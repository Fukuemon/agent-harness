// 保護の確認のスクリプト check-docs-site-protection.mjs が、認証の画面へ着いて中身がないときだけ終了コード 0 を返すことを確認する。
// サイトと認証の画面を、ポートの違う 2 つのローカルのサーバ（別のオリジン）で立てる。
// 実行: node --test packages/docs-site/scripts/check-docs-site-protection.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../skills/publish-docs-site/assets/scripts/check-docs-site-protection.mjs", import.meta.url));
const MARKER = "社内の設計書";

async function serve(handler) {
  const server = createServer(handler);
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

// spawnSync はイベントループを止め、同じプロセスのサーバが応答できないので、非同期で待つ
function run(...args) {
  return new Promise((done) => {
    const child = spawn(process.execPath, [script, ...args]);
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (status) => done({ status, stderr }));
  });
}

test("認証の画面へリダイレクトし、中身がなければ終了コード 0", async () => {
  const login = await serve((_, res) => res.end("<title>ログイン</title>"));
  const site = await serve((_, res) => res.writeHead(302, { location: `${login.url}/login?redirect=site` }).end());
  try {
    const r = await run(`${site.url}/`, MARKER);
    assert.equal(r.status, 0, r.stderr);
  } finally {
    site.close();
    login.close();
  }
});

test("リダイレクトせずに中身を返せば終了コード 1", async () => {
  const site = await serve((_, res) => res.end(`<title>${MARKER}</title>`));
  try {
    const r = await run(`${site.url}/`, MARKER);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /リダイレクトしない/);
  } finally {
    site.close();
  }
});

test("リダイレクトした先が中身を返せば終了コード 1", async () => {
  const mirror = await serve((_, res) => res.end(`<title>${MARKER}</title>`));
  const site = await serve((_, res) => res.writeHead(302, { location: mirror.url }).end());
  try {
    const r = await run(`${site.url}/`, MARKER);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /保護した中身がある/);
  } finally {
    site.close();
    mirror.close();
  }
});

test("引数が欠けるか URL でなければ終了コード 2", async () => {
  assert.equal((await run()).status, 2);
  assert.equal((await run("http://127.0.0.1:1/")).status, 2);
  assert.equal((await run("not a url", MARKER)).status, 2);
});
