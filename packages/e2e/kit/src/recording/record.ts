import { mkdirSync, rmdirSync } from 'node:fs'
import path from 'node:path'
import type { Browser, Page } from '@playwright/test'
import { evidenceName, type Example, type Scenario, type Variant } from '../evidence/index.ts'
import { caption, showCaptionInRecording } from './caption.ts'
import { CURSOR_LEGEND, showCursorInRecording } from './cursor.ts'
import { assertConverters, clearTake, finishEvidence, RECORDS_DIR, type CaptionAt } from './files.ts'

const DEFAULT_VIEWPORT = { width: 1920, height: 1200 }

/** 画面と録画の大きさ */
export type Viewport = { width: number; height: number }

/** 録画している画面と、字幕の出し方 */
export type Recording = {
  page: Page
  /** 前提と操作の文を字幕に出す */
  step: (text: string) => Promise<void>
  /**
   * 判定の文を字幕に出し、出し終えた時点の画面をスクリーンショットにする。その時点の画面で判定できる文に使う。
   * allowed には、検証シナリオの備考で、このスクリーンショットで改修前と違ってよいとされた差を書く。README の比較の表に出す
   */
  check: (text: string, allowed?: string) => Promise<void>
}

/** エビデンスの配置先と、字幕と README に出すアプリの値。利用者のリポジトリが決めて渡す */
export type RecordingTarget = {
  /** 1 つのシナリオのエビデンスの配置先。evidenceDir で作る */
  dir: string
  /** README に出すアプリの名前 */
  appName: string
  /** 字幕と README に出す、撮った環境の呼び名。例: 検証環境 */
  envLabel: string
  /** ログインした後の画面から、デプロイされたアプリのバージョンを読む。読めなければ空にする */
  readVersion: (page: Page) => Promise<string>
  /** 画面と録画の大きさ。無ければ 1920x1200 にする */
  viewport?: Viewport
  /** ブラウザの時間帯(例: Asia/Tokyo)。録画のコンテキストは Playwright の設定の use を受け継がないので、ここで渡す */
  timezoneId?: string
}

/**
 * 1 つの版と例の行を録画し、エビデンスの配置先へ mp4、スクリーンショット、README を書き出す。ffmpeg と ffprobe が要る。無ければ、録画を始める前に例外を投げる。
 * 操作が途中で失敗しても、そこまでの録画を書き出してから、例外を投げ直す。何が起きたかを見るため。
 * prepare が失敗したときは、録画を始めずに例外を投げ直す。
 * 操作が失敗し、書き出しも失敗したときは、両方を持つ AggregateError を投げる。
 *
 * @param prepare 録画の外で、ログインとデータの確認を行う。戻り値は body に渡る。録画は、prepare が終えたときの Cookie、localStorage、IndexedDB と、最後に開いた origin の sessionStorage を持ち越して始まる
 * @param body 録画する操作。最初の step より前に画面を開く。シナリオの前提と操作の文は step で、判定の文は check で字幕に出してから操作する
 */
export const recordEvidence = async <T>(
  browser: Browser,
  target: RecordingTarget,
  s: { scenario: Scenario; variant: Variant; example?: Example },
  prepare: (page: Page) => Promise<T>,
  body: (r: Recording, prepared: T) => Promise<void>,
): Promise<void> => {
  // 変換のツールが無いと、録画を全部終えた後にしか分からず、本体の失敗の理由も消えるので、先に確認する
  assertConverters()
  const { dir, appName, envLabel, viewport = DEFAULT_VIEWPORT, timezoneId } = target
  const name = evidenceName(s.variant, s.example)
  const where = [
    s.scenario.id,
    s.example ? `${s.example.column}=${s.example.value}` : '実施',
    s.variant.label,
  ]
    .filter(Boolean)
    .join(' / ')

  const signIn = await browser.newContext({ baseURL: s.variant.baseUrl, viewport, timezoneId })
  const signInPage = await signIn.newPage()
  let prepared: T,
    version: string,
    storageState: Awaited<ReturnType<typeof signIn.storageState>>,
    session: { origin: string; items: Record<string, string> }
  try {
    prepared = await prepare(signInPage)
    version = await target.readVersion(signInPage)
    storageState = await signIn.storageState({ indexedDB: true })
    session = {
      origin: new URL(signInPage.url()).origin,
      // opaque な origin(setContent、about:blank、data:)では sessionStorage が例外を投げるので、持ち越さない
      items: await signInPage.evaluate((): Record<string, string> => {
        try {
          return { ...sessionStorage }
        } catch {
          return {}
        }
      }),
    }
  } finally {
    await signIn.close()
  }
  const header = `${where} / ${envLabel} ${version}`.trim()

  mkdirSync(path.join(dir, RECORDS_DIR), { recursive: true })
  mkdirSync(path.join(dir, 'frames'), { recursive: true })
  clearTake(dir, name)
  const raw = path.join(dir, RECORDS_DIR, 'raw')
  const context = await browser.newContext({
    baseURL: s.variant.baseUrl,
    viewport,
    timezoneId,
    storageState,
    recordVideo: { dir: raw, size: viewport },
  })
  // storageState は sessionStorage を持たないので、prepare が最後に開いた origin の分だけを持ち越す。タブで最初に開いたときだけ入れ、画面が書き換えた値を読み直しで戻さない
  if (Object.keys(session.items).length > 0) {
    await context.addInitScript(({ origin, items }) => {
      if (location.origin !== origin || sessionStorage.getItem('__e2e-session-restored')) return
      for (const [k, v] of Object.entries(items)) sessionStorage.setItem(k, v)
      sessionStorage.setItem('__e2e-session-restored', '1')
    }, session)
  }
  // 字幕とカーソルは top layer に出し、後から出したものが上に重なる。上端のボタンを押す場面で丸が字幕に隠れないよう、カーソルを後に入れる
  await showCaptionInRecording(context, `${header}　(${CURSOR_LEGEND})`)
  await showCursorInRecording(context)
  const page = await context.newPage()
  const startedAt = Date.now()
  const captions: CaptionAt[] = []
  const show = async (text: string, still: boolean, allowed?: string) => {
    const at = (Date.now() - startedAt) / 1000
    await caption(page, text)
    const frame = still
      ? `frames/${name}-${captions.filter((c) => c.frame).length + 1}.png`
      : undefined
    if (frame) await page.screenshot({ path: path.join(dir, frame) })
    captions.push({ at, text, frame, allowed })
  }

  let failure: unknown
  try {
    await body(
      { page, step: (t) => show(t, false), check: (t, allowed) => show(t, true, allowed) },
      prepared,
    )
  } catch (e) {
    failure = e
  }
  const elapsed = (Date.now() - startedAt) / 1000
  // 操作の失敗で runner が先にコンテキストを閉じていても、録画は残っているので続ける
  await context.close().catch(() => undefined)
  await page.video()?.saveAs(path.join(dir, RECORDS_DIR, `${name}.webm`))
  await page.video()?.delete()
  // 同じ配置先で並べて撮っているほかの録画が残っていれば消さない。空のときだけ消える
  try {
    rmdirSync(raw)
  } catch {}
  try {
    finishEvidence(dir, {
      name,
      header,
      appName,
      envLabel,
      version,
      variant: s.variant,
      example: s.example,
      scenario: s.scenario,
      captions,
      elapsed,
      failure: failure === undefined ? undefined : describeFailure(failure),
    })
  } catch (e) {
    if (failure === undefined) throw e
    throw new AggregateError([failure, e], `操作が失敗し、録画の書き出しも失敗した: ${describeFailure(failure)}`)
  }
  if (failure !== undefined) throw failure
}

/** README に出す失敗の文。Error と文字列はそのまま、ほかの値は JSON にし、JSON にできなければ型の名前にする。 */
const describeFailure = (failure: unknown) => {
  if (failure instanceof Error || typeof failure === 'string') return String(failure)
  try {
    return JSON.stringify(failure) ?? typeof failure
  } catch {
    return typeof failure
  }
}
