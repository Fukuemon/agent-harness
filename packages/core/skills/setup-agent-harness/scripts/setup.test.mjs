// setup.mjs の 3 動作と、ほかのスキルの assets/ の取り込みを、使い捨てのディレクトリで確かめる。
// 実行: node --test packages/core/skills/setup-agent-harness/scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

const skillSrc = new URL("..", import.meta.url);
const KINDS = ["tech-stack", "codebase", "conventions", "testing", "operations", "domain"];

// スキルを使い捨ての skills/ に写し、assets/ を持つ兄弟のスキルを 1 つ足す
function setup() {
  const base = mkdtempSync(join(tmpdir(), "harness-"));
  const skills = join(base, "skills");
  cpSync(skillSrc, join(skills, "setup-agent-harness"), { recursive: true });
  mkdirSync(join(skills, "other", "assets", "docs"), { recursive: true });
  writeFileSync(join(skills, "other", "assets", "docs", "README.md"), "# other\n");
  mkdirSync(join(skills, "other", "assets", "design"), { recursive: true });
  writeFileSync(join(skills, "other", "assets", "design", "DesignDoc.md"), "---\ntype: design-doc\ntitle: 全体像\ndescription: 全体の設計\nstatus: draft\n---\n");
  mkdirSync(join(skills, "other", "assets", "adr"), { recursive: true });
  writeFileSync(join(skills, "other", "assets", "adr", "template.md"), "# ADR\n");
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
  const r = run(repo, script, ["--branches", "main,develop", "--docs", "docs/design,docs/adr,docs/specs"]);
  assert.equal(r.status, 0, r.out);
  for (const p of ["AGENTS.md", "CONTRIBUTING.md", "context/project.yml", "context/index.md", "docs/README.md", ...KINDS.map((k) => `context/${k}.md`)]) {
    assert.ok(existsSync(join(repo, p)), `${p} がない`);
  }
  const project = readFileSync(join(repo, "context/project.yml"), "utf8");
  assert.match(project, /names: \[main,develop\]/);
  assert.match(project, /design: docs\/design/);
  assert.match(readFileSync(join(repo, "AGENTS.md"), "utf8"), /^# my-repo/);
  const index = readFileSync(join(repo, "context/index.md"), "utf8");
  assert.match(index, /\[技術スタック\]\(tech-stack\.md\) — .*（draft）/);
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

test("目次は下位のディレクトリの context も載せ、書き終えた文書には draft の印を付けない", () => {
  const { repo, script } = setup();
  mkdirSync(join(repo, "context", "domain"), { recursive: true });
  writeFileSync(join(repo, "context", "domain", "order.md"), "---\ntype: context\ntitle: 注文\ndescription: 注文の状態と不変条件\nstatus: stable\n---\n");
  run(repo, script);
  const index = readFileSync(join(repo, "context/index.md"), "utf8");
  assert.match(index, /\[注文\]\(domain\/order\.md\) — 注文の状態と不変条件\n/);
  assert.match(index, /\[業務の知識\]\(domain\.md\)/);
});

test("2 回目は引数を省いても、値のファイルの値を引き継ぐ", () => {
  const { repo, script } = setup();
  run(repo, script, ["--branches", "main,develop", "--docs", "d,a,s"]);
  const d = run(repo, script, ["--diff"]);
  assert.equal(d.status, 0, d.out);
  assert.match(d.out, /context\/project\.yml: 差分なし/);
});

test("値のファイルの配列が行の形でも、保護ブランチを引き継ぐ", () => {
  const { repo, script } = setup();
  run(repo, script, ["--branches", "trunk"]);
  const p = join(repo, "context/project.yml");
  writeFileSync(p, readFileSync(p, "utf8").replace("names: [trunk]", "names:\n      - trunk\n      - release"));
  const d = run(repo, script, ["--diff"]);
  assert.match(d.out, /\+    names: \[trunk,release\]/, d.out);
  assert.doesNotMatch(d.out, /main,develop/);
  const f = run(repo, script, ["--force", "context/project.yml"]);
  assert.equal(f.status, 0, f.out);
  assert.match(readFileSync(p, "utf8"), /names: \[trunk,release\]/);
});

test("--diff は、まだ写していないファイルがあれば終了コード 1", () => {
  const { repo, script } = setup();
  assert.equal(run(repo, script, ["--diff"]).status, 1);
});

test("知らない引数と、テンプレートにない --force と、リポジトリの外を指す --docs は終了コード 2", () => {
  const { repo, script } = setup();
  assert.equal(run(repo, script, ["--topics", "nope"]).status, 2);
  assert.equal(run(repo, script, ["--force", "nope.md"]).status, 2);
  assert.equal(run(repo, script, ["--docs", "../shared,adr,specs"]).status, 2);
  assert.equal(run(repo, script, ["--docs", ".,adr,specs"]).status, 2);
  assert.ok(!existsSync(join(repo, "..", "shared")), "リポジトリの外に写した");
});

test(".gitignore に .ai-out/ を足し、2 回目は重ねて足さない。--diff は行がなければ差分に数える", () => {
  const { repo, script } = setup();
  writeFileSync(join(repo, ".gitignore"), "node_modules/");
  assert.equal(run(repo, script, ["--diff"]).status, 1);
  run(repo, script);
  assert.equal(readFileSync(join(repo, ".gitignore"), "utf8"), "node_modules/\n.ai-out/\n");
  run(repo, script);
  assert.equal(readFileSync(join(repo, ".gitignore"), "utf8"), "node_modules/\n.ai-out/\n");
  assert.equal(run(repo, script, ["--diff"]).status, 0);
});

test("apm.lock.yaml の配置先を、スキルとフックはディレクトリの単位で .gitignore に足し、2 回目は重ねて足さない", () => {
  const { repo, script } = setup();
  writeFileSync(join(repo, "apm.lock.yaml"), [
    "dependencies:",
    "- repo_url: _local/core",
    "  deployed_files:",
    "  - .claude/skills/git-commit",
    "  - .claude/skills/git-commit/SKILL.md",
    "  - .agents/skills/git-commit",
    "  - .claude/hooks/core/hooks/check-comments.mjs",
    "  - .codex/hooks/core/hooks/check-comments.mjs",
    "  deployed_file_hashes:",
    "    .claude/skills/git-commit/SKILL.md: sha256:0",
    "",
  ].join("\n"));
  assert.equal(run(repo, script, ["--diff"]).status, 1);
  run(repo, script);
  const expected = ".ai-out/\n/.agents/skills/git-commit/\n/.claude/hooks/core/\n/.claude/skills/git-commit/\n/.codex/hooks/core/\n";
  assert.equal(readFileSync(join(repo, ".gitignore"), "utf8"), expected);
  run(repo, script);
  assert.equal(readFileSync(join(repo, ".gitignore"), "utf8"), expected);
  assert.equal(run(repo, script, ["--diff"]).status, 0);
});

test("ほかのスキルの assets/ の design/ と adr/ は、答えた文書のディレクトリ名に写り、目次に載る", () => {
  const { repo, script } = setup();
  run(repo, script, ["--docs", "docs/design,docs/adr,docs/specs"]);
  assert.ok(existsSync(join(repo, "docs/design/DesignDoc.md")), "docs/design/DesignDoc.md がない");
  assert.ok(existsSync(join(repo, "docs/adr/template.md")), "docs/adr/template.md がない");
  assert.ok(!existsSync(join(repo, "design")), "design/ が残っている");
  assert.match(readFileSync(join(repo, "context/index.md"), "utf8"), /\[全体像\]\(\.\.\/docs\/design\/DesignDoc\.md\)/);
});

test("<リポジトリ名> は、写すすべてのファイルでリポジトリの名前に置き換わる", () => {
  const { repo, script } = setup();
  writeFileSync(join(repo, "..", "skills", "other", "assets", "design", "DesignDoc.md"), "---\ntype: design-doc\ntitle: <リポジトリ名> Design Doc\ndescription: 全体の設計\n---\n# <リポジトリ名> Design Doc\n");
  run(repo, script);
  const doc = readFileSync(join(repo, "design/DesignDoc.md"), "utf8");
  assert.match(doc, /^title: my-repo Design Doc$/m);
  assert.doesNotMatch(doc, /<リポジトリ名>/);
});

test("Claude Code のプラグインのキャッシュでは、同じ marketplace のほかのプラグインの最新の版の assets/ も写す", () => {
  const base = mkdtempSync(join(tmpdir(), "harness-"));
  const market = join(base, "plugins", "cache", "agent-harness");
  const skills = join(market, "core", "0.1.0", "skills");
  cpSync(skillSrc, join(skills, "setup-agent-harness"), { recursive: true });
  for (const [v, body] of [["0.1.0", "# old\n"], ["0.2.0", "# new\n"]]) {
    mkdirSync(join(market, "docs", v, "skills", "write-design-docs", "assets", "adr"), { recursive: true });
    writeFileSync(join(market, "docs", v, "skills", "write-design-docs", "assets", "adr", "template.md"), body);
  }
  utimesSync(join(market, "docs", "0.1.0", "skills"), 0, 0);
  const repo = join(base, "my-repo");
  mkdirSync(repo);
  const r = run(repo, join(skills, "setup-agent-harness", "scripts", "setup.mjs"), ["--docs", "d,a,s"]);
  assert.equal(r.status, 0, r.out);
  assert.equal(readFileSync(join(repo, "a/template.md"), "utf8"), "# new\n");
});
