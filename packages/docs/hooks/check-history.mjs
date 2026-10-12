// Design Doc と context に、変更履歴の見出しと issue の番号がないかを確かめる。
// 使い方: node packages/docs/hooks/check-history.mjs [ファイル]...。省くと Git が追跡する Markdown の全部を見る
// 終了コード: 0 は変更履歴の見出しがない、1 はある、2 はファイルが読めない。issue の番号は一覧を出すだけで、終了コードを変えない
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { historyFindings, isHistoryTarget } from "./doc-checks.mjs";

const files = process.argv.slice(2).length ? process.argv.slice(2) : execFileSync("git", ["ls-files", "-z", "*.md"], { encoding: "utf8" }).split("\0").filter(Boolean);
let failed = 0;
for (const file of files) {
  let body;
  try {
    body = readFileSync(file, "utf8");
  } catch (err) {
    console.error(`読めない: ${file}\n${err.message}`);
    process.exit(2);
  }
  if (!isHistoryTarget(body)) continue;
  for (const h of historyFindings(body)) {
    if (h.kind === "heading") {
      failed++;
      console.log(`${file}:${h.line}: 変更履歴の見出し: ${h.text}`);
    } else console.log(`${file}:${h.line}: issue の番号 ${h.text}。解決済みなら記述ごと消す`);
  }
}
process.exit(failed ? 1 : 0);
