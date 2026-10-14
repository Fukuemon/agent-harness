// 字幕とカーソルを重ねて、1 本の証跡を録画する。対象のリポジトリへ写して使う。
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { Browser, Page } from '@playwright/test';
import { caption, showCaptionInRecording } from './caption';
import { CURSOR_LEGEND, showCursorInRecording } from './cursor';
import { finishEvidence, type CaptionAt } from './files';

const VIEWPORT = { width: 1920, height: 1200 };

/** 録画している画面と、字幕の出し方 */
export type Recording = {
  page: Page;
  /** 前提と操作の文を字幕に出す */
  step: (text: string) => Promise<void>;
  /** 判定の文を字幕に出し、出し終えた時点の画面を静止画にする。その時点の画面で判定できる文に使う */
  check: (text: string) => Promise<void>;
};

/** 1 本の証跡。dir は置き場、name は拡張子を除くファイル名、header は字幕の 1 段目に出す、どの証跡かの名前 */
export type Take = { dir: string; name: string; header: string; baseURL?: string };

/**
 * 1 本を録画し、置き場へ mp4、静止画、README を書き出す。
 * prepare はログインとデータの確かめを録画の外で行い、その後のログインの状態で録画を始める。
 * 操作が途中で失敗しても、そこまでの録画は残す。何が起きたかを見るため。
 */
export const recordEvidence = async <T>(
  browser: Browser,
  take: Take,
  prepare: (page: Page) => Promise<T>,
  body: (r: Recording, prepared: T) => Promise<void>,
): Promise<void> => {
  const { dir, name, header } = take;
  const signIn = await browser.newContext({ baseURL: take.baseURL, viewport: VIEWPORT });
  const signInPage = await signIn.newPage();
  const prepared = await prepare(signInPage);
  const storageState = await signIn.storageState();
  const session = { origin: new URL(signInPage.url()).origin, items: await signInPage.evaluate(() => ({ ...sessionStorage })) };
  await signIn.close();

  mkdirSync(path.join(dir, 'webm'), { recursive: true });
  mkdirSync(path.join(dir, 'frames'), { recursive: true });
  const context = await browser.newContext({
    baseURL: take.baseURL,
    viewport: VIEWPORT,
    storageState,
    recordVideo: { dir: path.join(dir, 'webm', '.raw'), size: VIEWPORT },
  });
  // storageState は sessionStorage を持たない。タブで最初に開いたときだけ入れ、画面が書き換えた値を読み直しで戻さない
  await context.addInitScript(({ origin, items }) => {
    if (location.origin !== origin || sessionStorage.getItem('__e2e-session-restored')) return;
    for (const [k, v] of Object.entries(items)) sessionStorage.setItem(k, v);
    sessionStorage.setItem('__e2e-session-restored', '1');
  }, session);
  await showCursorInRecording(context);
  await showCaptionInRecording(context, `${header}　(${CURSOR_LEGEND})`);
  const page = await context.newPage();
  const startedAt = Date.now();
  const captions: CaptionAt[] = [];
  const show = async (text: string, still: boolean) => {
    const at = (Date.now() - startedAt) / 1000;
    await caption(page, text);
    const frame = still ? `frames/${name}-${captions.filter((c) => c.frame).length + 1}.png` : undefined;
    if (frame) await page.screenshot({ path: path.join(dir, frame) });
    captions.push({ at, text, frame });
  };

  let failure: unknown;
  try {
    await body({ page, step: (t) => show(t, false), check: (t) => show(t, true) }, prepared);
  } catch (e) {
    failure = e;
  }
  const elapsed = (Date.now() - startedAt) / 1000;
  // 操作の失敗で runner が先にコンテキストを閉じていても、録画は残っているので続ける
  await context.close().catch(() => undefined);
  await page.video()?.saveAs(path.join(dir, 'webm', `${name}.webm`));
  await page.video()?.delete();
  finishEvidence(dir, { name, header, captions, elapsed, failure: failure === undefined ? undefined : String(failure) });
  if (failure !== undefined) throw failure;
};
