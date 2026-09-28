// governs と verified_commit を持つ文書のうち、verified_commit より後に governs の範囲が変わったものを一覧する。
// 使い方: node packages/docs/hooks/list-drift.mjs。Git が追跡する Markdown の全部を見る
// 終了コード: 0 は完了（一覧があっても 0）、1 は governs と verified_commit の片方だけを持つ文書か、履歴にない verified_commit がある、2 は Git の履歴を読めない
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
let files;
try {
  files = git("ls-files", "*.md").split("\n").filter(Boolean);
} catch {
  console.error("Git の履歴を読めない。リポジトリの中で実行する");
  process.exit(2);
}

let invalid = 0;
for (const file of files) {
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, "utf8"))?.[1];
  if (!block) continue;
  const governs = yamlList(block, "governs");
  const commit = /^verified_commit:[ \t]*["']?([^"'\s]+)/m.exec(block)?.[1];
  if (!governs.length && commit === undefined) continue;
  if (!governs.length || commit === undefined) {
    invalid++;
    console.log(`${file}: governs と verified_commit の片方だけがある。両方を書くか、両方を省く`);
    continue;
  }
  if (commit === "unverified") {
    console.log(`${file}: 未確認（verified_commit: unverified）`);
    continue;
  }
  try {
    git("rev-parse", "--verify", `${commit}^{commit}`);
  } catch {
    invalid++;
    console.log(`${file}: verified_commit ${commit} が履歴にない。誤記か、書き換えられた履歴を指している。浅い clone なら履歴を全部取る`);
    continue;
  }
  const changed = git("log", "--format=%h", `${commit}..HEAD`, "--", ...governs).split("\n").filter(Boolean);
  if (changed.length) console.log(`${file}: ${commit} の後に governs の範囲が ${changed.length} 件のコミットで変わった（${governs.join("、")}）`);
}
process.exit(invalid ? 1 : 0);

function yamlList(block, key) {
  const m = new RegExp(`^${key}:[ \\t]*(.*)$`, "m").exec(block);
  if (!m) return [];
  const uncomment = (v) => v.replace(/(^|\s)#.*$/, "").trim();
  const unquote = (v) => uncomment(v).replace(/^["']|["']$/g, "");
  const value = uncomment(m[1]);
  if (value.startsWith("[")) return value.replace(/[[\]]/g, "").split(",").map(unquote).filter(Boolean);
  if (value) return [unquote(value)];
  const items = [];
  for (const line of block.slice(m.index + m[0].length).split(/\r?\n/).slice(1)) {
    const item = /^\s*-\s+(.+)$/.exec(line);
    if (!item) break;
    items.push(unquote(item[1]));
  }
  return items;
}
