// build-index.mjs の 3 つの終了コードと、導入のスキルが作る目次との一致を、使い捨てのディレクトリで確かめる。
// 実行: node --test packages/core/scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const hook = fileURLToPath(new URL("./build-index.mjs", import.meta.url));
const setup = fileURLToPath(new URL("../skills/setup-agent-harness/scripts/setup.mjs", import.meta.url));
const doc = (title) => `---\ntype: context\ntitle: ${title}\ndescription: ${title}の取り決め\n---\n`;

function repo(before = () => {}) {
  const r = mkdtempSync(join(tmpdir(), "index-"));
  before(r);
  execFileSync("node", [setup, "--branches", "main", "--docs", "design,adr,specs"], { cwd: r });
  return r;
}

function run(cwd, args = []) {
  try {
    return { status: 0, out: execFileSync("node", [hook, ...args], { cwd, encoding: "utf8" }) };
  } catch (e) {
    return { status: e.status, out: e.stdout + e.stderr };
  }
}

test("導入の直後の目次は、生成し直しても差分がない", () => {
  const check = run(repo());
  assert.equal(check.status, 0, check.out);
});

test("目次を手で変えると差分を終了コード 1 で報告し、--write で書き換える", () => {
  const r = repo();
  const index = join(r, "context/index.md");
  const generated = readFileSync(index, "utf8");
  writeFileSync(index, generated + "- 手で足した行\n");
  const check = run(r);
  assert.equal(check.status, 1, check.out);
  assert.match(check.out, /^-- 手で足した行/m);
  assert.equal(run(r, ["--write"]).status, 0);
  assert.equal(readFileSync(index, "utf8"), generated);
});

test("必須のキーがない文書は、ファイルとキーを挙げて終了コード 2", () => {
  const r = repo();
  mkdirSync(join(r, "context/domain"), { recursive: true });
  writeFileSync(join(r, "context/domain/order.md"), "---\ntype: context\ntitle: 注文\n---\n");
  const check = run(r);
  assert.equal(check.status, 2, check.out);
  assert.match(check.out, /domain\/order\.md: frontmatter に description がない/);
});

test("Design Doc は値のファイルの docs.design の下から載り、導入のスキルの目次と一致する", () => {
  const r = repo((r) => {
    mkdirSync(join(r, "design/features/a"), { recursive: true });
    writeFileSync(join(r, "design/DesignDoc.md"), doc("全体像"));
    writeFileSync(join(r, "design/features/a/DesignDoc_a.md"), doc("機能 A").replace("---\n", "---\nstatus: draft\n"));
  });
  const index = readFileSync(join(r, "context/index.md"), "utf8");
  assert.match(index, /## Design Doc\n\n- \[全体像\]\(\.\.\/design\/DesignDoc\.md\) — 全体像の取り決め\n- \[機能 A\]\(\.\.\/design\/features\/a\/DesignDoc_a\.md\) — 機能 Aの取り決め（draft）\n/);
  const check = run(r);
  assert.equal(check.status, 0, check.out);
});

test("context/ がなければ終了コード 2", () => {
  assert.equal(run(mkdtempSync(join(tmpdir(), "index-"))).status, 2);
});

test("CRLF の改行と引用符つきの値を読み、予約された log.md は載せない", () => {
  const r = repo();
  writeFileSync(join(r, "context/crlf.md"), "---\r\ntype: context\r\ntitle: \"改行\"\r\ndescription: 'CRLF の文書'\r\n---\r\n");
  writeFileSync(join(r, "context/log.md"), "# 更新履歴\n");
  assert.equal(run(r, ["--write"]).status, 0);
  const index = readFileSync(join(r, "context/index.md"), "utf8");
  assert.match(index, /- \[改行\]\(crlf\.md\) — CRLF の文書\n/);
  assert.doesNotMatch(index, /log\.md/);
});

test("docs.design は YAML として読み、行末のコメントに影響されない", () => {
  const r = repo((r) => {
    mkdirSync(join(r, "design"));
    writeFileSync(join(r, "design/DesignDoc.md"), doc("全体像"));
  });
  const p = join(r, "context/project.yml");
  writeFileSync(p, readFileSync(p, "utf8").replace("design: design", "design: design # 全体像と機能ごとの Design Doc"));
  assert.equal(run(r).status, 0, run(r).out);
  assert.match(readFileSync(join(r, "context/index.md"), "utf8"), /\.\.\/design\/DesignDoc\.md/);
});

test("コードの隣の DesignDoc.md とルートの PRD.md も載り、スキルの assets/ のテンプレートは載らない。導入のスキルの目次と一致する", () => {
  const r = repo((r) => {
    execFileSync("git", ["init", "-q"], { cwd: r });
    mkdirSync(join(r, "packages/foo"), { recursive: true });
    writeFileSync(join(r, "packages/foo/DesignDoc.md"), doc("foo"));
    writeFileSync(join(r, "PRD.md"), doc("要求"));
    mkdirSync(join(r, "skills/bar/assets/design"), { recursive: true });
    writeFileSync(join(r, "skills/bar/assets/design/DesignDoc.md"), doc("テンプレート"));
  });
  const index = readFileSync(join(r, "context/index.md"), "utf8");
  assert.match(index, /- \[要求\]\(\.\.\/PRD\.md\) — 要求の取り決め\n/);
  assert.match(index, /- \[foo\]\(\.\.\/packages\/foo\/DesignDoc\.md\) — fooの取り決め\n/);
  assert.doesNotMatch(index, /テンプレート/);
  const check = run(r);
  assert.equal(check.status, 0, check.out);
});

test("導入のスキルの --index は、既にある文書の frontmatter から目次だけを作り直す", () => {
  const r = repo((r) => execFileSync("git", ["init", "-q"], { cwd: r }));
  mkdirSync(join(r, "packages/foo"), { recursive: true });
  writeFileSync(join(r, "packages/foo/DesignDoc.md"), doc("foo"));
  writeFileSync(join(r, "context/index.md"), "# 古い目次\n");
  execFileSync("node", [setup, "--index"], { cwd: r });
  assert.match(readFileSync(join(r, "context/index.md"), "utf8"), /\.\.\/packages\/foo\/DesignDoc\.md/);
  assert.equal(run(r).status, 0, run(r).out);
});

test("導入のスキルの --index は、frontmatter が欠けた文書があれば、目次を書かずに失敗する", () => {
  const r = repo((r) => execFileSync("git", ["init", "-q"], { cwd: r }));
  writeFileSync(join(r, "context/broken.md"), "---\ntype: context\ntitle: 壊れた\n---\n");
  writeFileSync(join(r, "context/index.md"), "# 古い目次\n");
  let status = 0;
  try {
    execFileSync("node", [setup, "--index"], { cwd: r, stdio: "pipe" });
  } catch (e) {
    status = e.status;
  }
  assert.equal(status, 2);
  assert.equal(readFileSync(join(r, "context/index.md"), "utf8"), "# 古い目次\n");
});

test("設計文書のディレクトリにある、frontmatter を持たない資料は目次に載せず、失敗にもしない", () => {
  const r = repo((r) => execFileSync("git", ["init", "-q"], { cwd: r }));
  mkdirSync(join(r, "design/features/site/reference"), { recursive: true });
  writeFileSync(join(r, "design/features/site/reference/profile.md"), "# 企業プロフィール\n");
  writeFileSync(join(r, "design/features/site/reference/rule.md"), "---\n# 水平線で始まる資料\n");
  execFileSync("node", [setup, "--index"], { cwd: r });
  assert.doesNotMatch(readFileSync(join(r, "context/index.md"), "utf8"), /profile\.md|rule\.md/);
  assert.equal(run(r).status, 0, run(r).out);
});
