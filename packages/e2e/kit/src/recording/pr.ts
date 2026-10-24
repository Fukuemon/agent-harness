import { execFileSync } from 'node:child_process'
import { copyFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import type { Browser, Page } from '@playwright/test'
import { evidenceName, type Variant } from '../evidence/index.ts'
import { recordEvidence, type Recording, type Viewport } from './record.ts'

/** pull request か issue に添付するエビデンスの、利用者のリポジトリごとの値 */
export type PrEvidenceTarget = {
  /** リポジトリのルートの絶対パス。エビデンスの置き場と、撮ったコミットを読む起点 */
  root: string
  /** README に出すアプリの名前 */
  appName: string
  /** 画面と録画の大きさ。pull request の本文で読める大きさにする */
  viewport: Viewport
  /** エビデンスの置き場。root からの相対パス。無ければ .ai-out/evidence にする */
  evidenceDir?: string
  /** 字幕と README に出す、撮った環境の呼び名。無ければ「ローカル環境」にする */
  envLabel?: string
  /** ブラウザの時間帯(例: Asia/Tokyo) */
  timezoneId?: string
  /**
   * エビデンスを入れる先。issue なら `issue-<番号>`、pull request なら `pr-<番号>` にする。置き場のディレクトリの名前になる。
   * pull request を作る前に撮ったなら issue の番号にし、作った後も使い続ける。無ければ環境変数 EVIDENCE_FOR を読む
   */
  evidenceFor?: string
  /** 字幕に出すバージョンを読む。無ければ worktreeVersion で、撮った作業ツリーのコミットを出す */
  readVersion?: (page: Page, variant: Variant) => Promise<string>
}

/** 1 本のエビデンスの観点 */
export type PrEvidenceTake = {
  /** 観点が分かる英小文字、数字、ハイフンの名前。添付したファイル名として動画の上に出る */
  name: string
  /** 観点の文。README の見出しになる */
  title: string
  /** ログインする人。画面にログインしないものは「ログインなし」にする */
  actor: string
  /** 撮る版。variantsFromEnv の 1 つを渡す */
  variant: Variant
}

/**
 * 撮った作業ツリーのコミットを、`git describe` の短いハッシュで返す。未コミットの変更があれば末尾に -dirty が付く。
 * 改修前の版は別のコードを撮るので、空を返す。root が Git の作業ツリーでなければ例外を投げる。
 */
export const worktreeVersion = (root: string, variant: Variant): string =>
  variant.name === 'before'
    ? ''
    : execFileSync('git', ['describe', '--always', '--dirty', '--match=__none__'], {
        cwd: root,
        encoding: 'utf8',
      }).trim()

/**
 * pull request か issue のエビデンスを 1 本撮る。`<root>/<evidenceDir>/<入れる先>/<name>/` に recordEvidence の mp4、スクリーンショット、README を書き、
 * 添付する mp4 を `<入れる先>/<name>.mp4` にコピーする。`<入れる先>` は `issue-<番号>` か `pr-<番号>` である。
 * 改修前と改修後を撮るときは `<name>-before.mp4` と `<name>-after.mp4` にする。
 * 入れる先が `issue-<番号>` か `pr-<番号>` の形でないとき、name が英小文字、数字、ハイフンでないときは、撮らずに例外を投げる。
 * 撮影が途中で失敗したときは、前の撮影の添付する mp4 を消してから、recordEvidence の例外を投げ直す。
 *
 * @param prepare 録画の外で、ログインとテストデータの確認を行い、録画する画面の origin を開いたまま返す
 * @param body 録画する操作。step と check で字幕を出してから操作する
 */
export const recordPrEvidence = async <T>(
  browser: Browser,
  target: PrEvidenceTarget,
  take: PrEvidenceTake,
  prepare: (page: Page) => Promise<T>,
  body: (r: Recording, prepared: T) => Promise<void>,
): Promise<void> => {
  const evidenceFor = target.evidenceFor ?? process.env.EVIDENCE_FOR
  if (!evidenceFor || !/^(issue|pr)-[1-9]\d*$/.test(evidenceFor))
    throw new Error(`EVIDENCE_FOR に issue-<番号> か pr-<番号> を渡す: ${evidenceFor ?? ''}`)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(take.name))
    throw new Error(`name は英小文字、数字、ハイフンにする: ${take.name}`)
  const out = path.resolve(target.root, target.evidenceDir ?? '.ai-out/evidence', evidenceFor)
  const dir = path.join(out, take.name)
  const suffix = take.variant.name === 'single' ? '' : `-${take.variant.name}`
  const attached = path.join(out, `${take.name}${suffix}.mp4`)
  rmSync(attached, { force: true })
  const readVersion = target.readVersion ?? (async () => worktreeVersion(target.root, take.variant))
  await recordEvidence(
    browser,
    {
      dir,
      appName: target.appName,
      envLabel: target.envLabel ?? 'ローカル環境',
      readVersion: (page) => readVersion(page, take.variant),
      timezoneId: target.timezoneId,
      viewport: target.viewport,
    },
    {
      scenario: { issue: evidenceFor, id: `${evidenceFor} ${take.name}`, actor: take.actor, no: 0, title: take.title },
      variant: take.variant,
    },
    prepare,
    body,
  )
  copyFileSync(path.join(dir, `${evidenceName(take.variant)}.mp4`), attached)
}
