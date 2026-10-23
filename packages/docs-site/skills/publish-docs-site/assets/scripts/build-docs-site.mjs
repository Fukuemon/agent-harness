#!/usr/bin/env node
// context/project.yml の docs_site.parts に並べたもの（文書のサイト、カタログ、図のビルドの出力）を、1 つの出力のディレクトリのサブパスに並べる。
// 使い方: node scripts/build-docs-site.mjs --out <出力のディレクトリ> [--build] [--project <project.yml>]
//   --build を付けると、並べる前に各 part の build のコマンドをリポジトリのルートで実行する。
// 終了コード: 0 は並べた、1 は値が不正か並べるものがない、2 は値のファイルが読めないか build のコマンドが失敗した
import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { parse } from "yaml";

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const root = process.cwd();
const outArg = option("--out");
const projectPath = resolve(root, option("--project") ?? "context/project.yml");

if (!outArg) fail(1, "--out に出力のディレクトリを渡す");
if (!isRelativePath(outArg)) fail(1, `--out はリポジトリの中の相対パスで書く: ${outArg}`);

let project;
try {
  project = parse(readFileSync(projectPath, "utf8"));
} catch (e) {
  fail(2, `読めない: ${projectPath}\n${e.message}`);
}

const parts = project?.docs_site?.parts;
const errors = validateParts(parts);
const nested = (a, b) => a === b || a.startsWith(`${b}/`);
if (!errors.length) {
  for (const p of parts) if (nested(p.path, outArg) || nested(outArg, p.path)) errors.push(`${p.path}: --out の ${outArg} と重なる。出力のディレクトリは並べる前に消す`);
}
if (errors.length) fail(1, `docs_site.parts が不正: ${projectPath}\n${errors.map((e) => `  ${e}`).join("\n")}`);

if (args.includes("--build")) {
  for (const part of parts.filter((p) => p.build)) {
    console.log(`> ${part.build}`);
    try {
      execSync(part.build, { cwd: root, stdio: "inherit" });
    } catch {
      fail(2, `build のコマンドが失敗した: ${part.build}`);
    }
  }
}

const missing = parts.filter((p) => !existsSync(join(root, p.path)));
if (missing.length) {
  fail(1, missing.map((p) => `${p.path} がない。${p.build ? `先に ${p.build} を実行する` : "先にビルドの出力を作る"}`).join("\n"));
}

const out = join(root, outArg);
rmSync(out, { recursive: true, force: true });
for (const { path, subpath, exclude = [] } of parts) {
  cpSync(join(root, path), join(out, subpath), { recursive: true, filter: (src) => !exclude.includes(basename(src)) });
}
console.log(`${outArg} に並べた:\n${parts.map((p) => `  /${p.subpath ? `${p.subpath}/` : ""} <- ${p.path}`).join("\n")}`);

/** docs_site.parts の誤りを、人が読む文の配列で返す。schemas/docs-site.schema.json と同じ規則に、サブパスの重なりの確認を足す。 */
function validateParts(value) {
  if (!Array.isArray(value) || value.length === 0) return ["1 つ以上の part の配列にする"];
  const errors = [];
  const seen = new Set();
  value.forEach((p, i) => {
    const at = `parts[${i}]`;
    if (typeof p !== "object" || p === null || Array.isArray(p)) return errors.push(`${at}: path と subpath を持つオブジェクトにする`);
    for (const key of Object.keys(p)) if (!["path", "subpath", "build", "exclude"].includes(key)) errors.push(`${at}: 知らないキー ${key}`);
    if (!isRelativePath(p.path)) errors.push(`${at}.path: リポジトリの中の相対パスで書く`);
    if (p.subpath !== "" && !isRelativePath(p.subpath)) errors.push(`${at}.subpath: 空の文字列か、出力の中の相対パスで書く`);
    else if (seen.has(p.subpath)) errors.push(`${at}.subpath: ほかの part と重なる: "${p.subpath}"`);
    seen.add(p.subpath);
    if (p.build !== undefined && (typeof p.build !== "string" || !p.build)) errors.push(`${at}.build: コマンドの文字列にする`);
    if (p.exclude !== undefined && (!Array.isArray(p.exclude) || !p.exclude.every((x) => typeof x === "string" && x && !x.includes("/")))) {
      errors.push(`${at}.exclude: ファイル名の配列にする`);
    }
  });
  return errors;
}

/** 先頭と末尾の / がなく、空、.、.. の区切りを含まない相対パスか。 */
function isRelativePath(p) {
  return typeof p === "string" && p !== "" && p.split("/").every((s) => s !== "" && s !== "." && s !== "..");
}

function fail(code, message) {
  console.error(message);
  process.exit(code);
}
