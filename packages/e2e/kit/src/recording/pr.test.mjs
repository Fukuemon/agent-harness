import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after as afterAll, before as beforeAll, describe, it } from 'node:test'
import { variants } from '../evidence/index.ts'
import { recordPrEvidence, worktreeVersion } from './pr.ts'

const [single] = variants({ baseUrl: 'http://a' })
const [after, before] = variants({ baseUrl: 'http://a', beforeBaseUrl: 'http://b' })
const target = { root: tmpdir(), appName: 'app', viewport: { width: 1280, height: 800 } }
const never = () => assert.fail('撮る前に止まるはず')

describe('recordPrEvidence', () => {
  it('番号が数字でなければ、撮らずに例外を投げる', async () => {
    await assert.rejects(
      recordPrEvidence(null, { ...target, number: 'abc' }, { name: 'a', title: 't', actor: 'x', variant: single }, never, never),
      /EVIDENCE_NO/,
    )
  })

  it('name が英小文字、数字、ハイフンでなければ、撮らずに例外を投げる', async () => {
    await assert.rejects(
      recordPrEvidence(null, { ...target, number: '12' }, { name: 'List_View', title: 't', actor: 'x', variant: single }, never, never),
      /name は英小文字/,
    )
  })
})

// 撮る場合のテストには、ブラウザのエンジンと ffmpeg が要る。無ければ飛ばす
let browser
beforeAll(async () => {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    const { chromium } = await import('@playwright/test')
    browser = await chromium.launch()
  } catch {
    browser = undefined
  }
})
afterAll(async () => {
  await browser?.close()
})

describe('recordPrEvidence で撮る', () => {
  const body = async (r) => {
    await r.page.goto('data:text/html,<p>x</p>')
    await r.check('ならば 見える')
  }
  const take = (variant) => ({ name: 'open-list', title: '一覧を開く', actor: 'ログインなし', variant })
  const versioned = (root) => ({ ...target, root, number: '12', readVersion: async () => 'v1' })

  it('添付する mp4 を <番号>/<名前>.mp4 にコピーする', async (t) => {
    if (!browser) return t.skip('ブラウザのエンジンか ffmpeg が無い')
    const root = mkdtempSync(path.join(tmpdir(), 'e2e-kit-pr-'))
    await recordPrEvidence(browser, versioned(root), take(single), async () => undefined, body)
    const out = path.join(root, '.ai-out/evidence/12')
    assert.ok(existsSync(path.join(out, 'open-list.mp4')))
    assert.ok(existsSync(path.join(out, 'open-list', '実施.mp4')))
    assert.match(readFileSync(path.join(out, 'open-list', 'README.md'), 'utf8'), /#12 open-list \/ 実施 \/ ローカル環境 v1/)
  })

  it('改修前と改修後は、-before と -after を付けてコピーする', async (t) => {
    if (!browser) return t.skip('ブラウザのエンジンか ffmpeg が無い')
    const root = mkdtempSync(path.join(tmpdir(), 'e2e-kit-pr-'))
    for (const variant of [after, before]) {
      await recordPrEvidence(browser, { ...versioned(root), evidenceDir: 'out' }, take(variant), async () => undefined, body)
    }
    assert.deepEqual(
      readdirSync(path.join(root, 'out/12')).filter((f) => f.endsWith('.mp4')).sort(),
      ['open-list-after.mp4', 'open-list-before.mp4'],
    )
  })

  it('撮影が失敗したときは、前の撮影の添付する mp4 を消してから例外を投げ直す', async (t) => {
    if (!browser) return t.skip('ブラウザのエンジンか ffmpeg が無い')
    const root = mkdtempSync(path.join(tmpdir(), 'e2e-kit-pr-'))
    await recordPrEvidence(browser, versioned(root), take(single), async () => undefined, body)
    const attached = path.join(root, '.ai-out/evidence/12/open-list.mp4')
    await assert.rejects(
      recordPrEvidence(browser, versioned(root), take(single), async () => undefined, async () => {
        throw new Error('押せなかった')
      }),
      /押せなかった/,
    )
    assert.equal(existsSync(attached), false)
  })
})

describe('worktreeVersion', () => {
  it('作業ツリーのコミットを返し、未コミットの変更があれば -dirty を付ける', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'e2e-kit-git-'))
    const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
    git('init', '-q')
    writeFileSync(path.join(root, 'a.txt'), 'a')
    git('add', 'a.txt')
    git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-qm', 'a')
    const head = git('rev-parse', '--short', 'HEAD')
    assert.equal(worktreeVersion(root, after), head)
    writeFileSync(path.join(root, 'a.txt'), 'b')
    assert.equal(worktreeVersion(root, single), `${head}-dirty`)
  })

  it('改修前の版では、空を返す', () => {
    assert.equal(worktreeVersion('/nonexistent', before), '')
  })
})
