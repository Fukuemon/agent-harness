// 保護の確認のスクリプト check-docs-site-protection.mjs が、指定した認証の画面へ着いて中身がないときだけ終了コード 0 を返すことを確認する。
// サイトは 127.0.0.1、認証の画面とほかの公開のページは localhost で開き、ホストを分ける。
// 実行: node --test packages/docs-site/scripts/check-docs-site-protection.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { lookup } from "node:dns/promises";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../skills/publish-docs-site/assets/scripts/check-docs-site-protection.mjs", import.meta.url));
const MARKER = "社内の設計書";

async function serve(host, handler) {
  const server = createServer(handler);
  await new Promise((done) => server.listen(0, done));
  return { url: `http://${host}:${server.address().port}`, port: server.address().port, close: () => server.close() };
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

async function redirectTo(body, check, { host = "localhost", redirectBody = "" } = {}) {
  const dest = await serve(host, (_, res) => res.end(body));
  const site = await serve("127.0.0.1", (_, res) => res.writeHead(302, { location: `${dest.url}/login?redirect=site` }).end(redirectBody));
  try {
    await check(`${site.url}/`);
  } finally {
    site.close();
    dest.close();
  }
}

test("認証の画面のホストへリダイレクトし、中身がなければ終了コード 0", async () => {
  await redirectTo("<title>ログイン</title>", async (url) => {
    const r = await run(url, MARKER, "localhost");
    assert.equal(r.status, 0, r.stderr);
  });
});

const subdomainResolves = await lookup("auth.localhost").then(() => true, () => false);
test("認証の画面のホストのサブドメインに着けば終了コード 0", { skip: !subdomainResolves && "auth.localhost を名前解決できない" }, async () => {
  await redirectTo("<title>ログイン</title>", async (url) => {
    const r = await run(url, MARKER, "localhost");
    assert.equal(r.status, 0, r.stderr);
  }, { host: "auth.localhost" });
});

test("相対の Location を、要求した URL を基準にたどる", async () => {
  const login = await serve("localhost", (_, res) => res.end("<title>ログイン</title>"));
  const site = await serve("127.0.0.1", (req, res) => {
    if (req.url === "/") res.writeHead(302, { location: "/hop" }).end();
    else res.writeHead(302, { location: login.url }).end();
  });
  try {
    const r = await run(`${site.url}/`, MARKER, "localhost");
    assert.equal(r.status, 0, r.stderr);
  } finally {
    site.close();
    login.close();
  }
});

test("認証の画面と違うホストへリダイレクトすれば、中身がなくても終了コード 1", async () => {
  await redirectTo("<title>公開のページ</title>", async (url) => {
    const r = await run(url, MARKER, "auth.example.com");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /リダイレクトしない/);
  });
});

test("ホストの末尾が同じだけの別のホストは認めない", async () => {
  await redirectTo("<title>ログイン</title>", async (url) => {
    assert.equal((await run(url, MARKER, "host")).status, 1);
  });
});

test("リダイレクトせずに中身を返せば終了コード 1", async () => {
  const site = await serve("127.0.0.1", (_, res) => res.end(`<title>${MARKER}</title>`));
  try {
    const r = await run(`${site.url}/`, MARKER, "localhost");
    assert.equal(r.status, 1);
  } finally {
    site.close();
  }
});

test("着いた先か、リダイレクトの途中の応答に中身があれば終了コード 1", async () => {
  await redirectTo(`<title>${MARKER}</title>`, async (url) => {
    const r = await run(url, MARKER, "localhost");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /保護した中身がある/);
  });
  await redirectTo("<title>ログイン</title>", async (url) => {
    const r = await run(url, MARKER, "localhost");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /保護した中身がある/);
  }, { redirectBody: `<title>${MARKER}</title>` });
});

test("リダイレクトのループと接続の失敗は終了コード 2", async () => {
  const site = await serve("127.0.0.1", (_, res) => res.writeHead(302, { location: "/" }).end());
  try {
    const r = await run(`${site.url}/`, MARKER, "localhost");
    assert.equal(r.status, 2);
    assert.match(r.stderr, /リダイレクトが/);
  } finally {
    site.close();
  }
  assert.equal((await run("http://127.0.0.1:1/", MARKER, "localhost")).status, 2);
});

test("引数が欠けるか、URL でないか、サイトのホストを認証の画面のホストに渡せば終了コード 2", async () => {
  assert.equal((await run()).status, 2);
  assert.equal((await run("http://127.0.0.1:1/", MARKER)).status, 2);
  assert.equal((await run("not a url", MARKER, "localhost")).status, 2);
  assert.equal((await run("http://docs.example.com/", MARKER, "example.com")).status, 2);
});
