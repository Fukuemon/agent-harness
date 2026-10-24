// 文書のサイトを出す Worker。中身は scripts/build-docs-site.mjs が public/ に並べた静的なファイルだけで、スクリプトを持たない。
// Worker には Cloudflare の画面で Access を掛ける。名前を変えると、新しい Worker が Access なしで出る。
import { defineConfig } from 'cf/config'

export default defineConfig({
  worker: {
    name: '<Worker の名前>',
    compatibilityDate: '2026-10-01',
    workersDev: true,
  },
})
