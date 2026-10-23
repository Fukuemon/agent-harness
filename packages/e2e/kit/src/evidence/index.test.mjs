import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'
import { evidenceDate, evidenceDir, evidenceName, variants, variantsFromEnv } from './index.ts'

describe('variants', () => {
  it('baseUrl だけなら、名前の無い 1 つの版を返す', () => {
    assert.deepEqual(variants({ baseUrl: 'http://a' }), [
      { name: 'single', label: '', baseUrl: 'http://a' },
    ])
  })

  it('beforeBaseUrl があれば、改修後と改修前を返す', () => {
    assert.deepEqual(
      variants({ baseUrl: 'http://a', beforeBaseUrl: 'http://b' }).map((v) => [v.name, v.baseUrl]),
      [
        ['after', 'http://a'],
        ['before', 'http://b'],
      ],
    )
  })

  it('only があれば、baseUrl をその版として 1 つだけ返す', () => {
    assert.deepEqual(variants({ baseUrl: 'http://a', only: 'before' }), [
      { name: 'before', label: '改修前', baseUrl: 'http://a' },
    ])
    assert.equal(variants({ baseUrl: 'http://a', only: 'after' })[0].name, 'after')
  })

  it('only がほかの値なら、例外を投げる', () => {
    assert.throws(() => variants({ baseUrl: 'http://a', only: 'both' }), /before か after/)
  })
})

describe('variantsFromEnv', () => {
  it('EVIDENCE_BEFORE_URL と EVIDENCE_ONLY を読む', () => {
    assert.equal(variantsFromEnv('http://a', {}).length, 1)
    assert.equal(variantsFromEnv('http://a', { EVIDENCE_BEFORE_URL: 'http://b' }).length, 2)
    assert.equal(variantsFromEnv('http://a', { EVIDENCE_ONLY: 'after' })[0].name, 'after')
  })
})

describe('evidenceDate', () => {
  it('渡した YYYY-MM-DD をそのまま返し、無ければ今日の日付を返す', () => {
    assert.equal(evidenceDate('2026-01-02'), '2026-01-02')
    assert.match(evidenceDate(), /^\d{4}-\d{2}-\d{2}$/)
  })

  it('形が違えば、例外を投げる', () => {
    assert.throws(() => evidenceDate('2026/01/02'), /YYYY-MM-DD/)
  })
})

describe('evidenceDir と evidenceName', () => {
  const scenario = { issue: '12', id: 'VP-1', actor: '管理者', no: 3, title: '一覧を開く' }

  it('配置先を、要求の番号、環境、実施日、アクター、シナリオの順に組む', () => {
    assert.equal(
      evidenceDir({ root: '/r', envName: 'local', date: '2026-01-02', scenario }),
      path.resolve('/r/12/evidence/local/2026-01-02/管理者/S3_一覧を開く'),
    )
  })

  it('例の行と版から名前を作り、どちらも無ければ「実施」にする', () => {
    const [after, before] = variants({ baseUrl: 'http://a', beforeBaseUrl: 'http://b' })
    const example = { no: 1, column: '権限', value: '閲覧' }
    assert.equal(evidenceName(after, example), '01_閲覧_改修後')
    assert.equal(evidenceName(before), '改修前')
    assert.equal(evidenceName(variants({ baseUrl: 'http://a' })[0]), '実施')
  })
})
