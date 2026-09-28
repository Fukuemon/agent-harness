// check-history.mjs、check-links.mjs、list-drift.mjs を、使い捨ての Git のリポジトリで確かめる。
// 実行: node --test packages/docs/hooks/checks.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

const script = (name) => new URL(name, import.meta.url).pathname;
const DD = "---\ntype: design-doc\ntitle: 全体像\ndescription: 全体の設計\n---\n\n# 全体像\n\n## Overview\n\n本文。\n";

function repo(files) {
  const dir = mkdtempSync(join(tmpdir(), "docs-checks-"));
  const git = (...a) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: dir, encoding: "utf8" });
  git("init", "-q");
  write(dir, files);
  git("add", "-A");
  git("commit", "-qm", "init");
  return { dir, git, head: git("rev-parse", "HEAD").trim() };
}

function write(dir, files) {
  for (const [p, body] of Object.entries(files)) {
    mkdirSync(join(dir, p, ".."), { recursive: true });
    writeFileSync(join(dir, p), body);
  }
}

function run(dir, name, args = []) {
  try {
    return { status: 0, out: execFileSync("node", [script(name), ...args], { cwd: dir, encoding: "utf8" }) };
  } catch (e) {
    return { status: e.status, out: e.stdout + e.stderr };
  }
}

test("check-history は変更履歴の見出しを終了コード 1 で報告し、issue の番号は一覧だけを出す", () => {
  const { dir } = repo({ "design/DesignDoc.md": `${DD}\n## 変更履歴\n\n- 足した\n`, "context/a.md": "---\ntype: context\ntitle: a\ndescription: a\n---\n\n未解決の論点は #12 にある。`#34` は数えない。\n", "README.md": "## History\n" });
  const r = run(dir, "check-history.mjs");
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /design\/DesignDoc\.md:13: 変更履歴の見出し: ## 変更履歴/);
  assert.match(r.out, /context\/a\.md:7: issue の番号 #12/);
  assert.doesNotMatch(r.out, /#34|README/);
});

test("check-history は issue の番号だけなら終了コード 0", () => {
  const { dir } = repo({ "design/DesignDoc.md": `${DD}\n#7 の論点が残る。\n` });
  const r = run(dir, "check-history.mjs");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /#7/);
});

test("check-links は存在しないファイルと見出しへのリンクを終了コード 1 で報告する", () => {
  const { dir } = repo({
    "a.md": "# A\n\n## 文書の種類と寿命\n\n[ある](b.md#使い方) [ない](missing.md) [自分](#文書の種類と寿命) [見出しなし](#nope) [外](https://example.com) `[コード](x.md)`\n\n```md\n[ブロック](y.md)\n```\n",
    "b.md": "# B\n\n## 使い方\n",
  });
  const r = run(dir, "check-links.mjs");
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /a\.md:5: missing\.md（ファイルがない）/);
  assert.match(r.out, /a\.md:5: #nope（見出しがない）/);
  assert.doesNotMatch(r.out, /b\.md#使い方|#文書の種類と寿命|x\.md|y\.md|example/);
});

test("list-drift は governs の範囲の変更だけを一覧し、片方だけの文書は終了コード 1", () => {
  const { dir, git, head } = repo({ "src/a.js": "1\n", "lib/b.js": "1\n" });
  write(dir, {
    "design/in.md": `---\ntype: feature-design\ntitle: in\ndescription: d\ngoverns: src\nverified_commit: ${head}\n---\n`,
    "design/out.md": `---\ntype: feature-design\ntitle: out\ndescription: d\ngoverns:\n  - lib\nverified_commit: ${head}\n---\n`,
    "design/inline.md": `---\ntype: feature-design\ntitle: inline\ndescription: d\ngoverns: [lib, "src"]\nverified_commit: ${head}\n---\n`,
  });
  write(dir, { "src/a.js": "2\n" });
  git("add", "-A");
  git("commit", "-qm", "change src");
  let r = run(dir, "list-drift.mjs");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /design\/in\.md: .* 1 件のコミットで変わった（src）/);
  assert.doesNotMatch(r.out, /design\/out\.md/);
  assert.match(r.out, /design\/inline\.md: .*（lib、src）/);
  write(dir, { "design/half.md": "---\ntype: feature-design\ntitle: half\ndescription: d\ngoverns: src\n---\n" });
  git("add", "-A");
  git("commit", "-qm", "half");
  r = run(dir, "list-drift.mjs");
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /design\/half\.md: governs と verified_commit の片方だけがある/);
});
