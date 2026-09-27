// パッケージの本文（packages/*/skills/**/*.md）に、prh-packages.yml の語がないことを確かめる。コードスパンとコードブロックの中も見る。
// 使い方: node scripts/check-package-names.mjs [対象のディレクトリ]
// 終了コード: 0 は問題なし、1 は語が見つかった、2 は prh-packages.yml が読めない
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "yaml";

const root = process.cwd();
const target = join(root, process.argv[2] ?? "packages");
const rulesPath = new URL("../prh-packages.yml", import.meta.url);

let rules;
try {
  rules = parse(readFileSync(rulesPath, "utf8")).rules.map((r) => ({
    expected: r.expected,
    message: r.prh,
    patterns: (r.patterns ?? [r.pattern]).map(toRegExp),
  }));
} catch (e) {
  console.error(`読めない: prh-packages.yml\n${e.message}`);
  process.exit(2);
}

let found = 0;
for (const file of skillDocs(target)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const rule of rules) {
      for (const re of rule.patterns) {
        for (const m of line.matchAll(re)) {
          found++;
          console.log(`${relative(root, file)}:${i + 1}:${m.index + 1}: ${m[0]} => ${rule.expected}。${rule.message}`);
        }
      }
    }
  });
}
process.exit(found ? 1 : 0);

// prh の pattern は、/.../ なら正規表現、それ以外は文字列そのまま
function toRegExp(pattern) {
  const m = /^\/(.*)\/([a-z]*)$/.exec(pattern);
  return m ? new RegExp(m[1], m[2].includes("g") ? m[2] : `${m[2]}g`) : new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
}

// packages/<名前>/skills/ の下の Markdown だけを対象にする
function skillDocs(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const pkg of readdirSync(dir, { withFileTypes: true })) {
    const skills = join(dir, pkg.name, "skills");
    if (pkg.isDirectory() && existsSync(skills)) walk(skills, files);
  }
  return files;
}

function walk(dir, into) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, into);
    else if (e.name.endsWith(".md")) into.push(full);
  }
}
