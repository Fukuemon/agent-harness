import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, statSync } from 'node:fs'
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
    // 入れたかを確かめる間に、アプリがトークンを替えたことにする
    const isLoggedIn = async (page) => {
      if (page.url() === 'about:blank') await page.goto('/')
      const now = await page.evaluate(() => localStorage.getItem('token'))
      if (now === '1') await page.evaluate(() => localStorage.setItem('token', '2'))
      return now !== null
    }
    const hasToken = async (page) => (await page.evaluate(() => localStorage.getItem('token'))) !== null
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
})
