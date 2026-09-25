// setup.mjs の 3 動作と、兄弟のスキルの assets/ の取り込みを、使い捨てのディレクトリで確かめる。
// 実行: node --test packages/core/scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

const skillSrc = new URL("..", import.meta.url);

// スキルを使い捨ての skills/ に写し、assets/ を持つ兄弟のスキルを 1 つ足す
function setup() {
  const base = mkdtempSync(join(tmpdir(), "harness-"));
  const skills = join(base, "skills");
  cpSync(skillSrc, join(skills, "setup-agent-harness"), { recursive: true });
  mkdirSync(join(skills, "other", "assets", "docs"), { recursive: true });
  writeFileSync(join(skills, "other", "assets", "docs", "README.md"), "# other\n");
  const repo = join(base, "my-repo");
  mkdirSync(repo);
  return { repo, script: join(skills, "setup-agent-harness", "scripts", "setup.mjs") };
}

function run(repo, script, args = []) {
  try {
    return { status: 0, out: execFileSync("node", [script, ...args], { cwd: repo, encoding: "utf8" }) };
  } catch (e) {
    return { status: e.status, out: e.stdout + e.stderr };
  }
}

test("既定の実行で一式を写し、値と目次を埋める", () => {
  const { repo, script } = setup();
  const r = run(repo, script, ["--branches", "main,develop", "--topics", "tech-stack,testing", "--docs", "docs/design,docs/adr,docs/specs"]);
  assert.equal(r.status, 0, r.out);
  for (const p of ["AGENTS.md", "CONTRIBUTING.md", "context/project.yml", "context/index.md", "context/tech-stack.md", "context/testing.md", "docs/README.md"]) {
    assert.ok(existsSync(join(repo, p)), `${p} がない`);
  }
  assert.ok(!existsSync(join(repo, "context/codebase.md")), "選んでいない話題が写っている");
  const project = readFileSync(join(repo, "context/project.yml"), "utf8");
  assert.match(project, /names: \[main,develop\]/);
  assert.match(project, /design: docs\/design/);
  assert.match(readFileSync(join(repo, "AGENTS.md"), "utf8"), /^# my-repo/);
  const index = readFileSync(join(repo, "context/index.md"), "utf8");
  assert.match(index, /\[技術スタック\]\(tech-stack\.md\)/);
  assert.doesNotMatch(index, /codebase\.md/);
});

test("2 回目は何も上書きせず、飛ばしたファイルを表示する", () => {
  const { repo, script } = setup();
  run(repo, script);
  writeFileSync(join(repo, "AGENTS.md"), "mine\n");
  const r = run(repo, script);
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /飛ばした/);
  assert.match(r.out, /AGENTS\.md/);
  assert.equal(readFileSync(join(repo, "AGENTS.md"), "utf8"), "mine\n");
});

test("--diff は差分を表示して終了コード 1、--force は名指ししたファイルだけを上書きする", () => {
  const { repo, script } = setup();
  run(repo, script);
  writeFileSync(join(repo, "AGENTS.md"), "mine\n");
  writeFileSync(join(repo, "CONTRIBUTING.md"), "mine too\n");
  const d = run(repo, script, ["--diff"]);
  assert.equal(d.status, 1, d.out);
  assert.match(d.out, /-mine/);
  assert.equal(readFileSync(join(repo, "AGENTS.md"), "utf8"), "mine\n");
  const f = run(repo, script, ["--force", "AGENTS.md"]);
  assert.equal(f.status, 0, f.out);
  assert.match(readFileSync(join(repo, "AGENTS.md"), "utf8"), /^# my-repo/);
  assert.equal(readFileSync(join(repo, "CONTRIBUTING.md"), "utf8"), "mine too\n");
});

test("目次は下位のディレクトリの context も載せる", () => {
  const { repo, script } = setup();
  mkdirSync(join(repo, "context", "domain"), { recursive: true });
  writeFileSync(join(repo, "context", "domain", "order.md"), "---\ntype: context\ntitle: 注文\ndescription: 注文の状態と不変条件\n---\n");
  run(repo, script, ["--topics", "domain"]);
  const index = readFileSync(join(repo, "context/index.md"), "utf8");
  assert.match(index, /\[注文\]\(domain\/order\.md\) — 注文の状態と不変条件/);
  assert.match(index, /\[業務の知識\]\(domain\.md\)/);
});

test("2 回目は引数を省いても、値のファイルと選んだ話題を引き継ぐ", () => {
  const { repo, script } = setup();
  run(repo, script, ["--branches", "main,develop", "--topics", "testing", "--docs", "d,a,s"]);
  const d = run(repo, script, ["--diff"]);
  assert.equal(d.status, 0, d.out);
  assert.match(d.out, /context\/testing\.md: 差分なし/);
  assert.match(d.out, /context\/project\.yml: 差分なし/);
});

test("知らない話題と、テンプレートにない --force は終了コード 2", () => {
  const { repo, script } = setup();
  assert.equal(run(repo, script, ["--topics", "nope"]).status, 2);
  assert.equal(run(repo, script, ["--force", "nope.md"]).status, 2);
});
