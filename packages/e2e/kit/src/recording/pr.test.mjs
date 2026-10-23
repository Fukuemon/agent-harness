import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
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
