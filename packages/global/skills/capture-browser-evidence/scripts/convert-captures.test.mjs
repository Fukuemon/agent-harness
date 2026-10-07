// convert-captures.sh が、webm を H.264 の mp4 に変換し、変換する物が無いときは終了コード 1 で止まることを確かめる。
// 実行: node --test packages/global/skills/capture-browser-evidence/scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const script = fileURLToPath(new URL("./convert-captures.sh", import.meta.url));
const hasFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

test("引数が無ければ、使い方を出して 1 で終わる", () => {
  const r = spawnSync("bash", [script], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /使い方/);
});

test("webm が無ければ、1 で終わる", () => {
  const dir = mkdtempSync(join(tmpdir(), "convert-captures-"));
  mkdirSync(join(dir, "webm"));
  const r = spawnSync("bash", [script, dir], { encoding: "utf8" });
  assert.equal(r.status, 1);
});

// ffmpeg は CI の実行環境に無いことがあるため、無ければ変換の確認だけを飛ばす
test("webm を、隣の mp4/ に H.264 で変換して 0 で終わる", { skip: !hasFfmpeg && "ffmpeg が無い" }, () => {
  const dir = mkdtempSync(join(tmpdir(), "convert-captures-"));
  mkdirSync(join(dir, "webm"));
  const made = spawnSync("ffmpeg", ["-loglevel", "error", "-f", "lavfi", "-i", "testsrc=duration=1:size=160x120:rate=10", "-c:v", "libvpx", join(dir, "webm", "a.webm")]);
  assert.equal(made.status, 0, String(made.stderr));
  const r = spawnSync("bash", [script, dir], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(dir, "mp4", "a.mp4")));
  assert.match(r.stdout, /h264/);
});
