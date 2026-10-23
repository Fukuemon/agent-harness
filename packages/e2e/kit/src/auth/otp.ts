import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'

/**
 * 人がファイルに書いた認証コードを読む関数を作る。メールで届くコードのように、プログラムから読めないコードに使う。
 * 返す関数は `<dir>/otp-<key>.txt` を消してから、コードが書かれるまで待ち、読んだら消してコードを返す。
 *
 * @param timeoutMs コードが書かれるのを待つミリ秒。無ければ 30 分。過ぎたら例外を投げる
 */
export const otpFromFile =
  (dir: string, timeoutMs = 1_800_000) =>
  async (key: string): Promise<string> => {
    mkdirSync(dir, { recursive: true })
    const file = path.join(dir, `otp-${key}.txt`)
    rmSync(file, { force: true })
    console.log(`認証コードを待っている: ${file} にコードを書く`)
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      if (existsSync(file)) {
        const code = readFileSync(file, 'utf8').trim()
        rmSync(file)
        if (code) return code
      }
      // 人がファイルに書くのを待つので、画面の状態を条件にできない
      await new Promise((r) => setTimeout(r, Math.min(2_000, Math.max(0, deadline - Date.now()))))
    }
    throw new Error(`認証コードが ${timeoutMs / 1000} 秒のうちに書かれなかった: ${file}`)
  }
