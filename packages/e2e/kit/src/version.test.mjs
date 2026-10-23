import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

describe('e2e のバージョン', () => {
  it('プラグイン、kit、導入のスキルの kit-version.json が同じバージョンと名前を持つ', () => {
    const plugin = read('../../.claude-plugin/plugin.json')
    const kit = read('../package.json')
    const pinned = read('../../skills/setup-e2e/kit-version.json')
    assert.equal(kit.version, plugin.version)
    assert.deepEqual(pinned, { name: kit.name, version: kit.version })
  })
})
