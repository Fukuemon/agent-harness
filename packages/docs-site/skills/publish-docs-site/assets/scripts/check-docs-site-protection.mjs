#!/usr/bin/env node
// 公開した文書のサイトが保護されていることを、認証のない要求で確認する。
// リダイレクトをたどった先が、指定した認証の画面のホストであり、応答に保護した中身の文字列がなければ保護されている。
// 使い方: node scripts/check-docs-site-protection.mjs <サイトの URL> <保護した中身にだけある文字列> <認証の画面のホスト>
//   認証の画面のホストは、そのホストか、そのサブドメインに着けば認める。例: auth.example.com
// 終了コード: 0 は保護されている、1 は保護されていない、2 は引数の誤りか要求の失敗

const USAGE = "使い方: node scripts/check-docs-site-protection.mjs <サイトの URL> <保護した中身にだけある文字列> <認証の画面のホスト>";
const [url, marker, authHost] = process.argv.slice(2);
if (!url || !marker || !authHost) fail(2, USAGE);

let site;
try {
  site = new URL(url);
} catch {
  fail(2, `URL ではない: ${url}`);
}

let res, body;
try {
  res = await fetch(site, { redirect: "follow" });
  body = await res.text();
} catch (e) {
  fail(2, `要求が失敗した: ${site}\n${e.message}`);
}

const landed = new URL(res.url);
const host = authHost.toLowerCase();
if (landed.hostname !== host && !landed.hostname.endsWith(`.${host}`)) {
  fail(1, `保護されていない: ${site} が ${host} の認証の画面へリダイレクトしない（着いた先 ${landed}、ステータス ${res.status}）`);
}
if (body.includes(marker)) fail(1, `保護されていない: ${landed} の応答に保護した中身がある`);
console.log(`保護されている: ${site} -> ${landed.origin}${landed.pathname}`);

function fail(code, message) {
  console.error(message);
  process.exit(code);
}
