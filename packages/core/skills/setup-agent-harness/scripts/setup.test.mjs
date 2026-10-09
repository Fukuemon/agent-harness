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
  mkdirSync(join(skills, "other", "assets", ".github"), { recursive: true });
  writeFileSync(join(skills, "other", "assets", ".github", "pull_request_template.md"), "Closes #\n");
  mkdirSync(join(skills, "other", "assets", ".gitlab", "merge_request_templates"), { recursive: true });
  writeFileSync(join(skills, "other", "assets", ".gitlab", "merge_request_templates", "Default.md"), "Closes #\n");
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
  assert.doesNotMatch(project, /names:/);
  assert.match(readFileSync(join(repo, "CONTRIBUTING.md"), "utf8"), /^- 保護するブランチは `main`、`develop` である。/m);
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

test("2 回目は引数を省いても、CONTRIBUTING.md の保護するブランチを引き継ぐ", () => {
  const { repo, script } = setup();
  run(repo, script, ["--branches", "trunk,release"]);
  const p = join(repo, "CONTRIBUTING.md");
  assert.match(readFileSync(p, "utf8"), /^- 保護するブランチは `trunk`、`release` である。/m);
  const d = run(repo, script, ["--diff"]);
  assert.match(d.out, /CONTRIBUTING\.md: 差分なし/, d.out);
  const f = run(repo, script, ["--force", "CONTRIBUTING.md"]);
  assert.equal(f.status, 0, f.out);
  assert.match(readFileSync(p, "utf8"), /^- 保護するブランチは `trunk`、`release` である。/m);
});

test("version 1 の値のファイルの保護ブランチを、CONTRIBUTING.md へ引き継ぐ", () => {
  const { repo, script } = setup();
  mkdirSync(join(repo, "context"), { recursive: true });
  writeFileSync(join(repo, "context/project.yml"), "version: 1\nguardrails:\n  protected_branches:\n    names:\n      - trunk\n      - release\n");
  writeFileSync(join(repo, "CONTRIBUTING.md"), "# 古い形\n");
  const d = run(repo, script, ["--diff"]);
  assert.match(d.out, /\+- 保護するブランチは `trunk`、`release` である。/, d.out);
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
  assert.equal(run(repo, script, ["--hosting", "bitbucket"]).status, 2);
  assert.equal(run(repo, script, ["--hosting", "constructor"]).status, 2);
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
    "- repo_url: _local/docs",
    "  owners:",
    "  - ./packages/core",
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

test("Claude Code のプラグインのキャッシュでは、同じ marketplace のほかのプラグインの最新のバージョンの assets/ も写す", () => {
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

test("apm.yml に post-install を足し、2 回目は重ねない。lifecycle: が既にあれば手で足すよう表示する", () => {
  const { repo, script } = setup();
  writeFileSync(join(repo, "apm.yml"), "name: my-repo\nversion: 0.1.0\n");
  assert.equal(run(repo, script, ["--diff"]).status, 1);
  run(repo, script);
  const once = readFileSync(join(repo, "apm.yml"), "utf8");
  assert.match(once, /^lifecycle:\n  post-install:\n/m);
  assert.match(once, /setup\.mjs" --gitignore'$/m);
  run(repo, script);
  assert.equal(readFileSync(join(repo, "apm.yml"), "utf8"), once);
  writeFileSync(join(repo, "apm.yml"), "name: my-repo\nlifecycle:\n  pre-install: []\n");
  const r = run(repo, script);
  assert.match(r.out, /lifecycle: があるので、次を手で足す/);
  assert.doesNotMatch(readFileSync(join(repo, "apm.yml"), "utf8"), /--gitignore/);
});

test("--gitignore は .gitignore の行だけをそろえ、テンプレートを写さない", () => {
  const { repo, script } = setup();
  writeFileSync(join(repo, "apm.lock.yaml"), "dependencies:\n- repo_url: x\n  deployed_files:\n  - .claude/skills/grilling\n");
  const r = run(repo, script, ["--gitignore"]);
  assert.equal(r.status, 0, r.out);
  assert.equal(readFileSync(join(repo, ".gitignore"), "utf8"), ".ai-out/\n/.claude/skills/grilling/\n");
  assert.ok(!existsSync(join(repo, "AGENTS.md")), "テンプレートを写した");
});

// Git のリポジトリにして、ロックファイルに載せたスキルの写しを置く
function deployRepo(skills) {
  const { repo, script } = setup();
  execFileSync("git", ["init", "-q"], { cwd: repo });
  writeLock(repo, skills);
  for (const s of skills) {
    mkdirSync(join(repo, ".claude", "skills", s), { recursive: true });
    writeFileSync(join(repo, ".claude", "skills", s, "SKILL.md"), `# ${s}\n`);
  }
  return { repo, script };
}

function writeLock(repo, skills) {
  writeFileSync(join(repo, "apm.lock.yaml"), ["dependencies:", "- repo_url: x", "  deployed_files:", ...skills.map((s) => `  - .claude/skills/${s}`), ""].join("\n"));
}

test("前回の記録にあってロックファイルにない写しを消す。.gitignore の行が先に消えていても消す", () => {
  const { repo, script } = deployRepo(["a", "b"]);
  run(repo, script, ["--gitignore"]);
  writeLock(repo, ["a"]);
  writeFileSync(join(repo, ".gitignore"), ".ai-out/\n/.claude/skills/a/\n");
  const r = run(repo, script, ["--gitignore"]);
  assert.equal(r.status, 0, r.out);
  assert.ok(!existsSync(join(repo, ".claude/skills/b")), "b が残っている");
  assert.ok(existsSync(join(repo, ".claude/skills/a/SKILL.md")), "a が消えた");
  assert.match(r.out, /消した: パッケージから消えた写し\n  \/\.claude\/skills\/b\//);
});

test("記録にない写しは、.gitignore に行があっても消さない", () => {
  const { repo, script } = deployRepo(["a", "private"]);
  writeLock(repo, ["a"]);
  writeFileSync(join(repo, ".gitignore"), ".ai-out/\n/.claude/skills/a/\n/.claude/skills/private/\n");
  run(repo, script, ["--gitignore"]);
  run(repo, script, ["--gitignore"]);
  assert.ok(existsSync(join(repo, ".claude/skills/private/SKILL.md")), "自作のスキルが消えた");
  assert.equal(readFileSync(join(repo, ".gitignore"), "utf8"), ".ai-out/\n/.claude/skills/a/\n/.claude/skills/private/\n");
});

test("利用者の自作のスキルと、Git が追跡しているディレクトリは消さない", () => {
  const { repo, script } = deployRepo(["a", "tracked"]);
  mkdirSync(join(repo, ".claude/skills/mine"), { recursive: true });
  writeFileSync(join(repo, ".claude/skills/mine/SKILL.md"), "# mine\n");
  execFileSync("git", ["add", "-f", ".claude/skills/tracked/SKILL.md"], { cwd: repo });
  run(repo, script, ["--gitignore"]);
  writeLock(repo, ["a"]);
  run(repo, script, ["--gitignore"]);
  assert.ok(existsSync(join(repo, ".claude/skills/mine/SKILL.md")), "自作のスキルが消えた");
  assert.ok(existsSync(join(repo, ".claude/skills/tracked/SKILL.md")), "追跡しているディレクトリが消えた");
});

test("Git の origin がなければ GitHub の雛形だけを写す", () => {
  const { repo, script } = setup();
  run(repo, script);
  assert.ok(existsSync(join(repo, ".github/pull_request_template.md")), ".github/ がない");
  assert.ok(!existsSync(join(repo, ".gitlab")), ".gitlab/ を写した");
  assert.match(readFileSync(join(repo, "context/project.yml"), "utf8"), /^hosting: github$/m);
  assert.match(readFileSync(join(repo, "CONTRIBUTING.md"), "utf8"), /pull request/);
});

test("origin が GitLab なら GitLab の雛形だけを写し、CONTRIBUTING.md を merge request の呼び方にする", () => {
  const { repo, script } = setup();
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["remote", "add", "origin", "git@gitlab.example.com:group/my-repo.git"], { cwd: repo });
  run(repo, script);
  assert.ok(existsSync(join(repo, ".gitlab/merge_request_templates/Default.md")), ".gitlab/ がない");
  assert.ok(!existsSync(join(repo, ".github")), ".github/ を写した");
  assert.match(readFileSync(join(repo, "context/project.yml"), "utf8"), /^hosting: gitlab$/m);
  const contributing = readFileSync(join(repo, "CONTRIBUTING.md"), "utf8");
  assert.match(contributing, /merge request/);
  assert.doesNotMatch(contributing, /pull request|PR #/);
});

test("2 回目は引数を省いても、値のファイルのホスティングサービスを引き継ぐ", () => {
  const { repo, script } = setup();
  run(repo, script, ["--hosting", "gitlab"]);
  const d = run(repo, script, ["--diff"]);
  assert.equal(d.status, 0, d.out);
  assert.doesNotMatch(d.out, /\.github/);
});

test("--diff は、選ばなかったホスティングサービスの雛形が残っていれば知らせて終了コード 1", () => {
  const { repo, script } = setup();
  run(repo, script, ["--hosting", "github"]);
  writeFileSync(join(repo, "context/project.yml"), readFileSync(join(repo, "context/project.yml"), "utf8").replace("hosting: github", "hosting: gitlab"));
  run(repo, script);
  const d = run(repo, script, ["--diff"]);
  assert.equal(d.status, 1, d.out);
  assert.match(d.out, /gitlab では使わない雛形がある[\s\S]*\.github\/pull_request_template\.md/);
  assert.ok(existsSync(join(repo, ".github/pull_request_template.md")), "残っていた雛形を消した");
});

test("apm.lock.yaml があれば、ロックファイルにないスキルの assets/ は写さない", () => {
  const { repo, script } = setup();
  writeFileSync(join(repo, "apm.lock.yaml"), [
    "dependencies:",
    "- repo_url: _local/core",
    "  deployed_files:",
    "  - .claude/skills/setup-agent-harness",
    "  - .claude/skills/setup-agent-harness/SKILL.md",
    "",
  ].join("\n"));
  const skills = join(repo, ".claude", "skills");
  cpSync(skillSrc, join(skills, "setup-agent-harness"), { recursive: true });
  mkdirSync(join(skills, "mine", "assets"), { recursive: true });
  writeFileSync(join(skills, "mine", "assets", "mine-template.md"), "# mine\n");
  const r = run(repo, join(skills, "setup-agent-harness", "scripts", "setup.mjs"));
  assert.equal(r.status, 0, r.out);
  assert.ok(existsSync(join(repo, "AGENTS.md")), "AGENTS.md がない");
  assert.ok(!existsSync(join(repo, "mine-template.md")), "ロックファイルにないスキルの assets/ を写した");
});
