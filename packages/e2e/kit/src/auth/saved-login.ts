import { chmodSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import type { Browser, Page } from '@playwright/test'

/**
 * ログインの状態を保存するファイルのパス。`<dir>/<ホスト>/<key>.json` を返す。
 * 検証環境とローカル環境で同じユーザーを使えるよう、ホストごとに分ける。ログインの状態は秘密の情報なので、Git で追跡しない場所を dir に渡す。
 */
export const savedLoginPath = (dir: string, baseUrl: string, key: string): string =>
  path.join(dir, new URL(baseUrl).host.replace(':', '_'), `${key}.json`)

/**
 * 保存したログインの状態で入れればそれを使い、入れなければログインする。どちらでも、入れた後の状態を保存し直す。
 * 保存するのは Cookie、localStorage、IndexedDB で、sessionStorage は保存しない。ファイルは本人だけが読める権限(600)にする。
 * 同じファイルを並列の worker で共有しない。refresh のトークンを使うたびに替えるアプリでは、全部のセッションが失効する。
 * ログインした後も isLoggedIn が false なら、例外を投げる。
 *
 * @param o.isLoggedIn ページで、アプリに入れているかを返す。保存した状態を試すときと、ログインした後に確認するときに呼ぶ
 * @param o.login ページで、ログインを始めてからアプリに入るまでを行う。ID 基盤のログインの画面の操作も、ここで行う
 */
export const ensureSavedLogin = async (
  browser: Browser,
  o: {
    path: string
    baseUrl: string
    isLoggedIn: (page: Page) => Promise<boolean>
    login: (page: Page) => Promise<void>
  },
): Promise<void> => {
  const saved = existsSync(o.path) ? o.path : undefined
  const context = await browser.newContext({ baseURL: o.baseUrl, storageState: saved })
  try {
    const page = await context.newPage()
    // 保存した状態で入れたときも保存し直す。入れたかを確認する間に、アプリがトークンを替えることがあるため
    if (!(saved && (await o.isLoggedIn(page)))) {
      await o.login(page)
      if (!(await o.isLoggedIn(page)))
        throw new Error(`ログインした後も、アプリに入れない: ${page.url()}`)
    }
    mkdirSync(path.dirname(o.path), { recursive: true, mode: 0o700 })
    await context.storageState({ path: o.path, indexedDB: true })
    chmodSync(o.path, 0o600)
  } finally {
    await context.close()
  }
}
