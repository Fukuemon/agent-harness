// collect-playwright-videos.py が、JSON レポートの録画を名前を付けて写し、録画の無いテストを終了コード 1 で知らせることを確かめる。
// 実行: node --test packages/global/skills/capture-browser-evidence/scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const script = fileURLToPath(new URL("./collect-playwright-videos.py", import.meta.url));

function run(specs, ...args) {
  const dir = mkdtempSync(join(tmpdir(), "collect-videos-"));
  const video = join(dir, "video.webm");
  writeFileSync(video, "x");
  const withVideo = (title) => ({ title, tests: [{ results: [{ attachments: [{ name: "video", path: video }] }] }] });
  const report = { suites: [{ file: "login.spec.ts", suites: [{ title: "ログインの回帰（一覧画面）", specs: specs.map((s) => (s.video ? withVideo(s.title) : { title: s.title, tests: [] })) }] }] };
  writeFileSync(join(dir, "report.json"), JSON.stringify(report));
  const r = spawnSync("python3", [script, join(dir, "report.json"), join(dir, "out"), ...args], { encoding: "utf8" });
  return { ...r, out: join(dir, "out", "webm") };
}

test("録画を、条件、spec、連番、画面、テスト名の順の名前で写して 0 で終わる", () => {
  const r = run([{ title: "成功する", video: true }], "--prefix", "before");
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(r.out, "before-login-01-一覧画面-成功する.webm")), r.stdout);
});

test("録画の無いテストがあれば、テスト名を出して 1 で終わる", () => {
  const r = run([{ title: "成功する", video: true }, { title: "録画なし", video: false }], "--prefix", "before");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /録画なし/);
});

test("--prefix が無ければ、2 で終わる", () => {
  const r = run([{ title: "成功する", video: true }]);
  assert.equal(r.status, 2);
});

test("--prefix にブランチ名の / があっても、名前から除いて 0 で終わる", () => {
  const r = run([{ title: "成功する", video: true }], "--prefix", "feature/66");
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(r.out, "feature66-login-01-一覧画面-成功する.webm")), r.stdout);
});
