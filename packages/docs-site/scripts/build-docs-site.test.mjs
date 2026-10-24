// 組み立てのスクリプト build-docs-site.mjs が docs_site.parts のとおりに並べ、
// 値の誤り、読めない形、欠けた出力、Git で追跡するファイルのある出力先、ぶつかるファイルを、決めた終了コードで報告することを確認する。
// 実行: node --test packages/docs-site/scripts/build-docs-site.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../skills/publish-docs-site/assets/scripts/build-docs-site.mjs", import.meta.url));

const PROJECT = `version: 2
docs_site:
  parts:
    - path: site
      subpath: ""
    - path: catalog/dist
      subpath: catalog
      build: make catalog
    - path: erd/dist
      subpath: erd
      exclude: [serve.json, dist]
`;

const OUTPUTS = {
  "site/index.html": "docs",
  "catalog/dist/index.html": "catalog",
  "erd/dist/index.html": "erd",
  "erd/dist/serve.json": "{}",
};

function repo(project, files = OUTPUTS) {
  const dir = mkdtempSync(join(tmpdir(), "docs-site-"));
  execFileSync("git", ["init", "-q"], { cwd: dir });
  mkdirSync(join(dir, "context"));
  writeFileSync(join(dir, "context/project.yml"), project);
  for (const [p, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), body);
  }
  return dir;
}

const run = (dir, ...args) => spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: "utf8" });
const parts = (...lines) => `docs_site:\n  parts:\n${lines.join("\n")}\n`;

test("parts のとおりにサブパスへ並べ、exclude の名前を part の中でだけ外し、前の出力を消す", () => {
  const dir = repo(PROJECT, { ...OUTPUTS, "public/stale.html": "old" });
  const r = run(dir, "--out", "public");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(join(dir, "public/index.html"), "utf8"), "docs");
  assert.equal(readFileSync(join(dir, "public/catalog/index.html"), "utf8"), "catalog");
  assert.equal(readFileSync(join(dir, "public/erd/index.html"), "utf8"), "erd");
  assert.equal(existsSync(join(dir, "public/erd/serve.json")), false);
  assert.equal(existsSync(join(dir, "public/stale.html")), false);
});

test("並べるものがなければ、build のコマンドを案内して終了コード 1", () => {
  const { "catalog/dist/index.html": _, ...rest } = OUTPUTS;
  const r = run(repo(PROJECT, rest), "--out", "public");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /catalog\/dist がない。先に make catalog を実行する/);
});

test("--build は、並べる前に build のコマンドをリポジトリのルートで実行し、失敗したら終了コード 2", () => {
  const ok = parts("    - path: out", '      subpath: ""', '      build: "mkdir out && pwd > out/index.html"');
  const dir = repo(ok, {});
  const r = run(dir, "--out", "public", "--build");
  assert.equal(r.status, 0, r.stderr);
  const cwd = readFileSync(join(dir, "public/index.html"), "utf8").trim();
  assert.equal(execFileSync("realpath", [cwd], { encoding: "utf8" }).trim(), execFileSync("realpath", [dir], { encoding: "utf8" }).trim());

  const ng = parts("    - path: out", '      subpath: ""', "      build: exit 3");
  assert.equal(run(repo(ng, {}), "--out", "public", "--build").status, 2);
});

test("--out の欠け、値のない引数、リポジトリの外、.git、並べるものとの重なりは終了コード 1", () => {
  const dir = repo(PROJECT);
  for (const args of [[], ["--out"], ["--out", "--build"], ["--out", "public", "--project"], ["--out", "../public"], ["--out", ".git"], ["--out", "x/.git"], ["--out", "site"], ["--out", "catalog"]]) {
    assert.equal(run(dir, ...args).status, 1, args.join(" "));
  }
  assert.equal(existsSync(join(dir, "site/index.html")), true);
});

test("--out の下に Git で追跡するファイルがあれば、消さずに終了コード 1", () => {
  const dir = repo(PROJECT, { ...OUTPUTS, "docs/index.md": "# 文書" });
  execFileSync("git", ["add", "docs/index.md"], { cwd: dir });
  const r = run(dir, "--out", "docs");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Git で追跡している/);
  assert.equal(readFileSync(join(dir, "docs/index.md"), "utf8"), "# 文書");
});

test("--out の途中か最後がシンボリックリンクなら、たどらずに終了コード 1", () => {
  const dir = repo(PROJECT, { ...OUTPUTS, "docs/pages/important.md": "# 文書" });
  execFileSync("git", ["add", "docs/pages/important.md"], { cwd: dir });
  symlinkSync("docs", join(dir, "alias"));
  for (const out of ["alias/pages", "alias"]) {
    const r = run(dir, "--out", out);
    assert.equal(r.status, 1, out);
    assert.match(r.stderr, /シンボリックリンク/);
  }
  assert.equal(readFileSync(join(dir, "docs/pages/important.md"), "utf8"), "# 文書");
});

test("ほかの part の出力とファイルがぶつかれば終了コード 1", () => {
  const r = run(repo(PROJECT, { ...OUTPUTS, "site/catalog/index.html": "root" }), "--out", "public");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /ぶつかる/);
});

test("値の誤りは終了コード 1、読めない形と読めない値のファイルは終了コード 2", () => {
  assert.equal(run(repo(parts("    - path: ../site", '      subpath: ""')), "--out", "public").status, 1);
  assert.equal(run(repo(parts("    - path: site", "      subpath: catalog", "    - path: erd/dist", "      subpath: catalog/erd")), "--out", "public").status, 1);
  assert.equal(run(repo("version: 2\n"), "--out", "public").status, 1);
  assert.equal(run(repo("docs_site: {parts: []}\n"), "--out", "public").status, 2);
  assert.equal(run(repo(PROJECT), "--out", "public", "--project", "missing.yml").status, 2);
});
