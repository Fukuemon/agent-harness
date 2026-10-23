import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import { ensureSavedLogin } from './saved-login.ts'

// ブラウザのエンジンが無い環境(CI)では飛ばす
let browser
let server
let baseUrl
before(async () => {
  try {
    const { chromium } = await import('@playwright/test')
    browser = await chromium.launch()
  } catch {
    return
  }
  server = createServer((_, res) => res.end('<p>app</p>'))
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})
after(async () => {
  await browser?.close()
  server?.close()
})

const token = (file) =>
  JSON.parse(readFileSync(file, 'utf8')).origins[0].localStorage.find((x) => x.name === 'token')?.value

describe('ensureSavedLogin', () => {
  it('入れなければログインし、状態を本人だけが読めるファイルに保存する', async (t) => {
    if (!browser) return t.skip('ブラウザのエンジンが無い')
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'e2e-kit-login-')), 'host', 'user.json')
    await ensureSavedLogin(browser, {
      path: file,
      baseUrl,
      isLoggedIn: async (page) => (await page.evaluate(() => localStorage.getItem('token'))) !== null,
      login: async (page) => {
        await page.goto('/')
        await page.evaluate(() => localStorage.setItem('token', '1'))
      },
    })
    assert.equal(token(file), '1')
    assert.equal(statSync(file).mode & 0o777, 0o600)
  })

  it('保存した状態で入れたときも、入れた後の状態で保存し直す', async (t) => {
    if (!browser) return t.skip('ブラウザのエンジンが無い')
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'e2e-kit-login-')), 'user.json')
    const login = async (page) => {
      await page.goto('/')
      await page.evaluate(() => localStorage.setItem('token', '1'))
    }
    // 入れたかを確認する間に、アプリがトークンを替えたことにする
    const isLoggedIn = async (page) => {
      if (page.url() === 'about:blank') await page.goto('/')
      const now = await page.evaluate(() => localStorage.getItem('token'))
      if (now === '1') await page.evaluate(() => localStorage.setItem('token', '2'))
      return now !== null
    }
    await ensureSavedLogin(browser, { path: file, baseUrl, isLoggedIn: hasToken, login })
    assert.equal(token(file), '1')
    await ensureSavedLogin(browser, {
      path: file,
      baseUrl,
      isLoggedIn,
      login: async () => assert.fail('保存した状態で入れるはず'),
    })
    assert.equal(token(file), '2')
  })

  it('保存した状態で入れなければ、状態を持たないコンテキストでログインし直す', async (t) => {
    if (!browser) return t.skip('ブラウザのエンジンが無い')
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'e2e-kit-login-')), 'user.json')
    const loginWith = (value) => async (page) => {
      await page.goto('/')
      await page.evaluate((v) => localStorage.setItem('token', v), value)
    }
    const valid = async (page) => {
      if (page.url() === 'about:blank') await page.goto('/')
      return (await page.evaluate(() => localStorage.getItem('token'))) === 'valid'
    }
    await ensureSavedLogin(browser, { path: file, baseUrl, isLoggedIn: hasToken, login: loginWith('expired') })
    let before
    await ensureSavedLogin(browser, {
      path: file,
      baseUrl,
      isLoggedIn: valid,
      login: async (page) => {
        await page.goto('/')
        before = await page.evaluate(() => localStorage.getItem('token'))
        await loginWith('valid')(page)
      },
    })
    assert.equal(before, null)
    assert.equal(token(file), 'valid')
  })

  it('保存したファイルを読めなければ、消してからログインする', async (t) => {
    if (!browser) return t.skip('ブラウザのエンジンが無い')
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'e2e-kit-login-')), 'user.json')
    writeFileSync(file, '{ 壊れた')
    await ensureSavedLogin(browser, {
      path: file,
      baseUrl,
      isLoggedIn: hasToken,
      login: async (page) => {
        await page.goto('/')
        await page.evaluate(() => localStorage.setItem('token', '1'))
      },
    })
    assert.equal(token(file), '1')
  })

  it('ログインした後も入れなければ、例外を投げて保存しない', async (t) => {
    if (!browser) return t.skip('ブラウザのエンジンが無い')
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'e2e-kit-login-')), 'user.json')
    await assert.rejects(
      ensureSavedLogin(browser, { path: file, baseUrl, isLoggedIn: async () => false, login: async () => {} }),
      /ログインした後も、アプリに入れない/,
    )
    assert.equal(existsSync(file), false)
  })
})

const hasToken = async (page) => {
  if (page.url() === 'about:blank') await page.goto('/')
  return (await page.evaluate(() => localStorage.getItem('token'))) !== null
}
