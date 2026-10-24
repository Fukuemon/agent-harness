import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import { variants } from '../evidence/index.ts'
import { recordEvidence } from './record.ts'

// 録画には、ブラウザのエンジンと ffmpeg が要る。CI の実行環境には入っていないことがあるので、無ければ飛ばす
const hasFfmpeg = (() => {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

let browser
before(async () => {
  if (!hasFfmpeg) return
  try {
    const { chromium } = await import('@playwright/test')
    browser = await chromium.launch()
  } catch {
    browser = undefined
  }
})
after(async () => {
  await browser?.close()
})

const scenario = { issue: '1', id: 'VP-1', actor: 'ログインなし', no: 1, title: '字幕' }
const target = (dir) => ({
  dir,
  appName: 'app',
  envLabel: 'テスト',
  readVersion: async () => 'v1',
  viewport: { width: 641, height: 481 },
})
const page = (title) => `data:text/html,<title>${title}</title><button>${title}</button>`

describe('recordEvidence', () => {
  it('sessionStorage を読めないページでも撮り、mp4、スクリーンショット、README を書き出す', async (t) => {
    if (!browser) return t.skip('ブラウザのエンジンか ffmpeg が無い')
    const dir = mkdtempSync(path.join(tmpdir(), 'e2e-kit-record-'))
    const [single] = variants({ baseUrl: 'http://localhost' })
    await recordEvidence(
      browser,
      target(dir),
      { scenario, variant: single },
      async (p) => {
        await p.goto(page('prepare'))
        return 'prepared'
      },
      async (r, prepared) => {
        assert.equal(prepared, 'prepared')
        await r.page.goto(page('body'))
        await r.step('前提 ページを開いている')
        await r.check('ならば ボタンが見える')
      },
    )
    assert.ok(existsSync(path.join(dir, '実施.mp4')))
    assert.ok(existsSync(path.join(dir, 'frames', '実施-1.png')))
    const readme = readFileSync(path.join(dir, 'README.md'), 'utf8')
    assert.match(readme, /^# S1_字幕/)
    assert.match(readme, /VP-1 \/ 実施 \/ テスト v1/)
    assert.match(readme, /ならば ボタンが見える \| frames\/実施-1\.png/)
    // 奇数の viewport でも、H.264 に変換できる
    assert.match(readme, /h264/)
  })

  it('操作が失敗しても、そこまでの録画と失敗の文を書き出してから例外を投げ直す', async (t) => {
    if (!browser) return t.skip('ブラウザのエンジンか ffmpeg が無い')
    const dir = mkdtempSync(path.join(tmpdir(), 'e2e-kit-record-'))
    const [single] = variants({ baseUrl: 'http://localhost' })
    await assert.rejects(
      recordEvidence(
        browser,
        target(dir),
        { scenario, variant: single },
        async () => undefined,
        async (r) => {
          await r.page.goto(page('body'))
          await r.step('もし 押す')
          throw new Error('押せなかった')
        },
      ),
      /押せなかった/,
    )
    assert.ok(existsSync(path.join(dir, '実施.mp4')))
    assert.match(readFileSync(path.join(dir, 'README.md'), 'utf8'), /撮影が途中で失敗した\*\*: Error: 押せなかった/)
  })

  it('改修前と改修後をそろえて撮ると、比較の画像を書き出す', async (t) => {
    if (!browser) return t.skip('ブラウザのエンジンか ffmpeg が無い')
    const dir = mkdtempSync(path.join(tmpdir(), 'e2e-kit-record-'))
    for (const variant of variants({ baseUrl: 'http://a', beforeBaseUrl: 'http://b' })) {
      await recordEvidence(
        browser,
        target(dir),
        { scenario, variant },
        async () => undefined,
        async (r) => {
          await r.page.goto(page(variant.name))
          await r.check('ならば 同じに見える')
        },
      )
    }
    assert.ok(existsSync(path.join(dir, 'compare', '実施-1.png')))
    assert.match(readFileSync(path.join(dir, 'README.md'), 'utf8'), /## 改修前と改修後の比較/)
  })

  it('同じ名前で撮り直すと、前の撮影のスクリーンショットを消し、README の行を重ねない', async (t) => {
    if (!browser) return t.skip('ブラウザのエンジンか ffmpeg が無い')
    const dir = mkdtempSync(path.join(tmpdir(), 'e2e-kit-record-'))
    const [single] = variants({ baseUrl: 'http://localhost' })
    const take = (checks) =>
      recordEvidence(browser, target(dir), { scenario, variant: single }, async () => undefined, async (r) => {
        await r.page.goto(page('body'))
        for (let i = 0; i < checks; i++) await r.check(`ならば ${i + 1} 番目が見える`)
      })
    await take(2)
    await take(1)
    assert.deepEqual(readdirSync(path.join(dir, 'frames')), ['実施-1.png'])
    const readme = readFileSync(path.join(dir, 'README.md'), 'utf8')
    assert.equal(readme.match(/^## 実施\.mp4$/gm)?.length, 1)
    assert.doesNotMatch(readme, /2 番目/)
  })
})

describe('recordEvidence の前提', () => {
  it('ffmpeg が無ければ、ブラウザを開く前に例外を投げる', async () => {
    const pathBefore = process.env.PATH
    process.env.PATH = mkdtempSync(path.join(tmpdir(), 'e2e-kit-empty-path-'))
    try {
      const [single] = variants({ baseUrl: 'http://localhost' })
      await assert.rejects(
        recordEvidence(null, target('/nonexistent'), { scenario, variant: single }, async () => undefined, async () => {}),
        /ffmpeg が無い/,
      )
    } finally {
      process.env.PATH = pathBefore
    }
  })
})
