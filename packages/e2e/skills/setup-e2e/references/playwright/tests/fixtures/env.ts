// 環境変数から読む値の雛形。<e2e.dir>/tests/fixtures/env.ts に写し、<> の値を置き換える。
// テストのツールの設定からも読むので、読むだけで例外を投げる処理を置かない

/** テストを向けるアプリの URL */
export const BASE_URL = process.env.E2E_BASE_URL ?? '<ローカルで起動したアプリの URL>'
