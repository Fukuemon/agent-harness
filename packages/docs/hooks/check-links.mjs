// Markdown の相対リンクの先のファイルと、見出しのアンカーが存在することを確かめる。
// 使い方: node packages/docs/hooks/check-links.mjs [ファイル]...。省くと Git が追跡する Markdown の全部を見る
// 終了コード: 0 はリンク切れがない、1 はある、2 はファイルが読めない
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { brokenLinks } from "./doc-checks.mjs";

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
  for (const l of brokenLinks(resolve(file), body)) {
    failed++;
    console.log(`${file}:${l.line}: ${l.target}（${l.reason}）`);
  }
}
process.exit(failed ? 1 : 0);
