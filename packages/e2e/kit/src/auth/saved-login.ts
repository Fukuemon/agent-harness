import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { Browser, BrowserContext, Page } from '@playwright/test'

/**
 * ログインの状態を保存するファイルのパス。`<dir>/<ホスト>/<key>.json` を返す。
 * 検証環境とローカル環境で同じユーザーを使えるよう、ホストごとに分ける。ログインの状態は秘密の情報なので、Git で追跡しない場所を dir に渡す。
 */
export const savedLoginPath = (dir: string, baseUrl: string, key: string): string =>
  path.join(dir, new URL(baseUrl).host.replaceAll(':', '_'), `${key}.json`)

/**
 * 保存したログインの状態で入れればそれを使い、入れなければ状態を持たないコンテキストでログインし直す。どちらでも、入れた後の状態を保存し直す。
 * 保存したファイルを読めなければ、消してからログインする。
 * 保存するのは Cookie、localStorage、IndexedDB で、sessionStorage は保存しない。ファイルは本人だけが読める権限(600)で書く。
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
  const reused = await reuseSaved(browser, o)
  if (reused) return
  const context = await browser.newContext({ baseURL: o.baseUrl })
  try {
    const page = await context.newPage()
    await o.login(page)
    if (!(await o.isLoggedIn(page)))
      throw new Error(`ログインした後も、アプリに入れない: ${page.url()}`)
    await save(context, o.path)
  } finally {
    await context.close()
  }
}

/** 保存した状態で入れたら、入れた後の状態を保存し直して true を返す。入れたかを確認する間に、アプリがトークンを替えることがあるため */
const reuseSaved = async (
  browser: Browser,
  o: { path: string; baseUrl: string; isLoggedIn: (page: Page) => Promise<boolean> },
): Promise<boolean> => {
  if (!existsSync(o.path)) return false
  let context: BrowserContext
  try {
    context = await browser.newContext({ baseURL: o.baseUrl, storageState: o.path })
  } catch {
    rmSync(o.path, { force: true })
    return false
  }
  try {
    if (!(await o.isLoggedIn(await context.newPage()))) return false
    await save(context, o.path)
    return true
  } finally {
    await context.close()
  }
}

const save = async (context: BrowserContext, file: string): Promise<void> => {
  const state = await context.storageState({ indexedDB: true })
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 })
  // mode は新しく作るときだけ効くので、既にあるファイルは先に権限を絞ってから書く
  if (existsSync(file)) chmodSync(file, 0o600)
  writeFileSync(file, JSON.stringify(state, null, 2), { mode: 0o600 })
}
