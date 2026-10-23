#!/usr/bin/env node
// 基本の段と意味の段の CSS を 1 つのファイルにまとめ、静的なファイル（画面仕様書のモック、文書のサイト）が読むトークンの CSS を作る。
// 静的な HTML はパッケージの CSS を import で読めないので、@import の行を外して中身を並べる。
// 使い方: node build-static-tokens.mjs [--check] --out <書き出すパス> <CSS のファイルかパッケージのパス>...
//   基本の段を先に、意味の段を後に並べる。パッケージのパス（`@scope/name/dist/tokens.css` の形）は、カレントディレクトリの package.json から解決する
//   --check は書き出さず、書き出すはずの中身と今のファイルを比べる。CI で生成物のずれを見つけるのに使う
// 終了コード: 0 は書き出した（--check では一致した）、1 は --check で食い違うかファイルがない、2 は引数の誤りか CSS が読めない、@import が残る
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

const argv = process.argv.slice(2);
let check = false;
let out = "";
const sources = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--check") check = true;
  else if (argv[i] === "--out") out = argv[++i] ?? "";
  else if (argv[i].startsWith("--")) fail(`知らない引数: ${argv[i]}`);
  else sources.push(argv[i]);
}
if (!out || !sources.length) fail("--out <書き出すパス> と、元の CSS を 1 つ以上渡す");

const parts = sources.map((source) => {
  let css;
  try {
    css = readFileSync(locate(source), "utf8");
  } catch (e) {
    fail(`読めない: ${source}\n${e.message}`);
  }
  // コメントの中の @import を文と取り違えないよう、先にコメントを外す。生成物にはコメントを残さない
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  // 元の CSS は、次の段の CSS を @import で読む。中身は sources の順に並べるので、行ごと外す
  css = css.replace(/^\s*@import [^;]+;[ \t]*\r?\n?/gm, "").trim();
  if (/@import/.test(css)) fail(`@import が行の途中に残る: ${source}。静的なファイルは読めないので、元の CSS を直す`);
  return css;
});

const header = `/*
 * 生成物。手で直さない。次のコマンドで作り直す。
 * node build-static-tokens.mjs --out ${out} ${sources.join(" ")}
 */
`;
const body = `${header}\n${parts.join("\n\n")}\n`;
const target = resolve(out);
if (check) {
  if (!existsSync(target)) {
    console.error(`${out} がない。--check を外して作る`);
    process.exit(1);
  }
  if (readFileSync(target, "utf8") !== body) {
    console.error(`${out} が元の CSS と食い違う。--check を外して作り直し、一緒にコミットする`);
    process.exit(1);
  }
  console.log(`${out} は元の CSS と一致する`);
} else {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, body);
  console.log(`書き出した: ${relative(process.cwd(), target)}`);
}

function locate(source) {
  if (isAbsolute(source) || source.startsWith(".")) return resolve(source);
  return createRequire(join(process.cwd(), "package.json")).resolve(source);
}

function fail(message) {
  console.error(message);
  process.exit(2);
}
