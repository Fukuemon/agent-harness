// build-index.mjs の 3 つの終了コードと、導入のスキルが作る目次との一致を、使い捨てのディレクトリで確かめる。
// 実行: node --test packages/core/hooks/
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
