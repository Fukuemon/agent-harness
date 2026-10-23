import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { otpFromFile, savedLoginPath } from './index.ts'

describe('savedLoginPath', () => {
  it('ホストとポートごとにディレクトリを分ける', () => {
    assert.equal(
      savedLoginPath('/s', 'http://localhost:3000/app', 'admin'),
      path.join('/s', 'localhost_3000', 'admin.json'),
    )
  })
})

describe('otpFromFile', () => {
  it('書かれたコードを読み、ファイルを消す', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'e2e-kit-otp-'))
    const read = otpFromFile(dir, 10_000)
    const pending = read('admin')
    writeFileSync(path.join(dir, 'otp-admin.txt'), '123456\n')
    assert.equal(await pending, '123456')
    assert.equal(existsSync(path.join(dir, 'otp-admin.txt')), false)
  })

  it('時間のうちに書かれなければ、例外を投げる', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'e2e-kit-otp-'))
    await assert.rejects(otpFromFile(dir, 50)('admin'), /書かれなかった/)
  })
})
