// エビデンスを撮る spec から kit を呼ぶ薄い層の雛形。<e2e.dir>/tests/fixtures/evidence.ts に写し、<> の値を置き換える
import { fileURLToPath } from 'node:url'
import type { Browser, Page } from '@playwright/test'
import { variantsFromEnv, type Variant } from '@fukuemon/e2e-kit/evidence'
import { recordPrEvidence, type Recording, type Viewport } from '@fukuemon/e2e-kit/recording'
import { BASE_URL } from './env'

/** リポジトリのルート。このファイルからルートまでの深さに合わせる */
const root = fileURLToPath(new URL('<このファイルからリポジトリのルートへの相対パス。例: ../../../>', import.meta.url))

/**
 * 撮る版の一覧。EVIDENCE_BEFORE_URL と EVIDENCE_ONLY で、改修前と改修後を切り替える。
 * EVIDENCE_ONLY が before と after のどちらでもなければ、例外を投げる。エビデンスの spec の中で呼ぶ
 */
export const evidenceVariants = (): Variant[] => variantsFromEnv(BASE_URL)

/** パソコンの幅の画面と録画の大きさ。pull request の本文で読める大きさにする */
export const DESKTOP_VIEWPORT: Viewport = { width: 1280, height: 800 }

/**
 * pull request か issue のエビデンスを 1 本撮る。環境変数 EVIDENCE_NO の番号の置き場に書き出す。
 *
 * @param o.name 観点が分かる英小文字、数字、ハイフンの名前。添付したファイル名として動画の上に出る
 * @param o.viewport 画面と録画の大きさ。無ければ DESKTOP_VIEWPORT にする
 * @param prepare 録画の外で、ログインとテストデータの確認を行い、録画する画面の origin を開いたまま返す
 * @param body 録画する操作。step と check で字幕を出してから操作する
 */
export const captureEvidence = <T>(
  browser: Browser,
  o: { name: string; title: string; actor: string; variant: Variant; viewport?: Viewport },
  prepare: (page: Page) => Promise<T>,
  body: (r: Recording, prepared: T) => Promise<void>,
): Promise<void> =>
  recordPrEvidence(
    browser,
    {
      root,
      appName: '<README に出すアプリの名前>',
      viewport: o.viewport ?? DESKTOP_VIEWPORT,
      // エビデンスの置き場。利用者の context/testing/e2e.md の Running Tests に書いた置き場にそろえる
      evidenceDir: '.ai-out/evidence',
    },
    o,
    prepare,
    body,
  )
