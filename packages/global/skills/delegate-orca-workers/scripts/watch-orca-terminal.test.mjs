// watch-orca-terminal.mjs が、端末の読み取りの記録から止まった状態を見つけ、同じ状態を繰り返して出さないことを確かめる。
// 実行: node --test packages/global/skills/delegate-orca-workers/scripts/watch-orca-terminal.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const script = fileURLToPath(new URL("./watch-orca-terminal.mjs", import.meta.url));

const read = (tail, status = "running") => JSON.stringify({ ok: true, result: { terminal: { status, tail } } });

function watch(reads, ...args) {
  return spawnSync("node", [script, "-", ...args], { input: reads.join("\n") + "\n", encoding: "utf8" });
}

const lines = (r) => r.stdout.split("\n").filter(Boolean);

test("端末が running でなくなったら、STATUS を 1 回だけ出す", () => {
  const r = watch([read(["a"]), read(["b"], "exited"), read(["c"], "exited")]);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(lines(r), ["STATUS exited"]);
});

test("画面が 4 回の読み取りの間変わらなければ、IDLE を出す", () => {
  const same = read(["> 確認してよいですか", "─────"]);
  const r = watch([same, same, same, same, same, same]);
  assert.deepEqual(lines(r), ["IDLE 4 > 確認してよいですか"]);
});

test("スピナーの行だけが変わっても、画面は変わらないとみなす", () => {
  const r = watch([1, 2, 3, 4, 5].map((n) => read(["待っている", `✻ Thinking… ${n}s`])));
  assert.deepEqual(lines(r), ["IDLE 4 待っている"]);
});

test("サブエージェントを待つ間は、IDLE を 20 分まで出さない", () => {
  const waiting = read(["作業中", "◯ general-purpose  Reading"]);
  const r = watch(Array(21).fill(waiting));
  assert.deepEqual(lines(r), ["IDLE 20 作業中 ◯ general-purpose  Reading"]);
  assert.deepEqual(lines(watch(Array(20).fill(waiting))), []);
});

test("間隔を 30 秒にすると、IDLE は 8 回の読み取りで出る", () => {
  const same = read(["止まっている"]);
  assert.deepEqual(lines(watch(Array(8).fill(same), "--interval", "30")), []);
  assert.deepEqual(lines(watch(Array(9).fill(same), "--interval", "30")), ["IDLE 4 止まっている"]);
});

test("利用の上限の表示が出たら、LIMIT をその行で出す", () => {
  const r = watch([read(["作業中"]), read(["作業中", "You've hit your usage limit · resets at 3pm"])]);
  assert.deepEqual(lines(r), ["LIMIT You've hit your usage limit · resets at 3pm"]);
});

test("heredoc のコマンドが 3 分を超えたら、HEREDOC を 1 回だけ出す", () => {
  const cmd = "python3 - <<'EOF'";
  const r = watch([
    read([cmd, "Running 1 shell command… (2m 10s)"]),
    read([cmd, "Running 1 shell command… (3m 10s)"]),
    read([cmd, "Running 1 shell command… (4m 10s)"]),
  ]);
  assert.deepEqual(lines(r), ["HEREDOC 3 分を超えた heredoc のコマンドがある"]);
});

test("シェルのコマンドが 8 分を超えたら LONGCMD を出し、その後は 10 分ごとに出す", () => {
  const r = watch([8, 8, 9, 10, 11, 20].map((m) => read([`Running 1 shell command… (${m}m 0s)`])));
  assert.deepEqual(lines(r), ["LONGCMD 8m", "LONGCMD 10m", "LONGCMD 20m"]);
});

test("別のコマンドが 8 分を超えたら、LONGCMD をもう一度出す", () => {
  const r = watch([8, 0, 2, 8].map((m) => read(m ? [`Running 1 shell command… (${m}m 0s)`] : ["完了"])));
  assert.deepEqual(lines(r), ["LONGCMD 8m", "LONGCMD 8m"]);
});

test("読み取りが 8 分や 10 の倍数の分を飛ばしても、閾値を超えたら LONGCMD を出す", () => {
  const r = watch([7, 9, 11, 13, 19, 21].map((m) => read([`Running 1 shell command… (${m}m 0s)`])));
  assert.deepEqual(lines(r), ["LONGCMD 9m", "LONGCMD 11m", "LONGCMD 21m"]);
});

test("終わった heredoc のコマンドが画面に残っていても、別のコマンドでは HEREDOC を出さない", () => {
  const r = watch([
    read(["⏺ Bash(python3 - <<'EOF')", "  ⎿  done", "⏺ Bash(pnpm test)", "Running 1 shell command… (3m 10s)"]),
  ]);
  assert.deepEqual(lines(r), []);
});

test("heredoc のコマンドが続いたら、HEREDOC をコマンドごとに出す", () => {
  const r = watch([
    read(["⏺ Bash(python3 a.py - <<'EOF')", "Running 1 shell command… (3m 10s)"]),
    read(["⏺ Bash(python3 b.py - <<'EOF')", "Running 1 shell command… (0m 10s)"]),
    read(["⏺ Bash(python3 b.py - <<'EOF')", "Running 1 shell command… (3m 10s)"]),
  ]);
  assert.deepEqual(lines(r), ["HEREDOC 3 分を超えた heredoc のコマンドがある", "HEREDOC 3 分を超えた heredoc のコマンドがある"]);
});

test("同じ表示の heredoc のコマンドが続いても、経過の分が減ったら HEREDOC をもう一度出す", () => {
  const cmd = "⏺ Bash(python3 - <<'EOF')";
  const r = watch(["3m 10s", "10s", "3m 10s"].map((t) => read([cmd, `Running 1 shell command… (${t})`])));
  assert.equal(lines(r).length, 2);
});

test("小文字の区切り語の heredoc でも、HEREDOC を出す", () => {
  const r = watch([read(["⏺ Bash(python3 - <<'eof')", "Running 1 shell command… (3m 10s)"])]);
  assert.deepEqual(lines(r), ["HEREDOC 3 分を超えた heredoc のコマンドがある"]);
});

test("here-string は heredoc とみなさない", () => {
  const r = watch([read(["⏺ Bash(python3 process.py <<< 'input')", "Running 1 shell command… (3m 10s)"])]);
  assert.deepEqual(lines(r), []);
});

test("前の呼び出しの経過を、実行中の呼び出しの経過とみなさない", () => {
  const r = watch([
    read(["⏺ Bash(pnpm build)", "Running 1 shell command… (10m 10s)", "⏺ Bash(python3 - <<'EOF'", "Running 1 shell command… (10s)"]),
  ]);
  assert.deepEqual(lines(r), []);
});

test("コマンドの出力にある heredoc は、HEREDOC で知らせない", () => {
  const r = watch([read(["⏺ Bash(python3 slow-build.py)", "  ⎿  Generated example: cat <<EOF", "Running 1 shell command… (3m 10s)"])]);
  assert.deepEqual(lines(r), []);
});

test("シフト演算は heredoc とみなさない", () => {
  const r = watch([read(["⏺ Bash(python3 -c 'n = 12; size = 1 << n; time.sleep(240)')", "Running 1 shell command… (3m 10s)"])]);
  assert.deepEqual(lines(r), []);
});

test("出力先を続けて書いた heredoc でも、HEREDOC を出す", () => {
  const r = watch([read(["⏺ Bash(cat <<EOF > out.txt", "Running 1 shell command… (3m 10s)"])]);
  assert.deepEqual(lines(r), ["HEREDOC 3 分を超えた heredoc のコマンドがある"]);
});

test("実行中の呼び出しが heredoc なら、HEREDOC を出す", () => {
  const r = watch([read(["⏺ Bash(pnpm test)", "  ⎿  ok", "⏺ Bash(python3 - <<'EOF')", "Running 1 shell command… (3m 10s)"])]);
  assert.deepEqual(lines(r), ["HEREDOC 3 分を超えた heredoc のコマンドがある"]);
});

// Claude Code 2.1.310 の端末を `orca terminal read --json` で読んだときの、heredoc のコマンドを実行中の画面
const runningScreen = (time) => [
  "❯ 次のコマンドを 1 回実行する",
  `  Running the display test command · ${time}`,
  "  ⎿  $ cat <<'EOF' > /dev/null && sleep 240",
  "     x",
  "     EOF (3m 30s)",
  "     (ctrl+b to run in background)",
  "✳ Befuddling… (3m 37s · ↓ 99 tokens)",
  "─".repeat(61),
  "❯",
  "─".repeat(61),
  "  ⏵⏵ bypass permissions on (shift+tab to cycle) · PR #152 ·",
];

test("Claude Code 2.1.310 の見出しの形でも、HEREDOC と LONGCMD を出す", () => {
  const r = watch([read(runningScreen("3m 31s")), read(runningScreen("8m 2s"))]);
  assert.deepEqual(lines(r), ["HEREDOC 3 分を超えた heredoc のコマンドがある", "LONGCMD 8m"]);
});

test("フッターに ⏺ main とサブエージェントの一覧があっても、実行中のコマンドを見失わない", () => {
  const r = watch([read([...runningScreen("8m 2s"), "  ⏺ main", "  ◯ general-purpose  Worker: … 10s · ↓ 238.1k tokens"])]);
  assert.deepEqual(lines(r), ["HEREDOC 3 分を超えた heredoc のコマンドがある", "LONGCMD 8m"]);
});

test("前の形でも、フッターの ⏺ main を呼び出しとみなさない", () => {
  const footer = ["─".repeat(61), "❯", "─".repeat(61), "  ⏺ main", "  ◯ general-purpose  Reading"];
  const r = watch([read(["⏺ Bash(pnpm build)", "Running 1 shell command… (8m 0s)", ...footer])]);
  assert.deepEqual(lines(r), ["LONGCMD 8m"]);
});

test("経過が時間の単位で出ても、分に直して LONGCMD を出す", () => {
  const r = watch([read(["⏺ Bash(pnpm build)", "Running 1 shell command… (1h 5m)"])]);
  assert.deepEqual(lines(r), ["LONGCMD 65m"]);
});

test("区切り語の後に && が続く heredoc でも、HEREDOC を出す", () => {
  const r = watch([read(["⏺ Bash(cat <<EOF && make", "Running 1 shell command… (3m 10s)"])]);
  assert.deepEqual(lines(r), ["HEREDOC 3 分を超えた heredoc のコマンドがある"]);
});

test("IDLE の閾値が 20 分から 4 分に変わっても、IDLE を 1 回だけ出す", () => {
  // スピナーの行は画面の比較から外れるので、待ちの表示が消えても画面は変わらないとみなされる
  const waiting = read(["作業中", "* 1 background agent"]);
  const stopped = read(["作業中", "* Thinking"]);
  const r = watch([...Array(6).fill(waiting), stopped, stopped, stopped]);
  assert.deepEqual(lines(r), ["IDLE 4 作業中"]);
});

test("読み取りが失敗したら、READFAIL を理由ごとに 1 回出す", () => {
  const stale = JSON.stringify({ ok: false, error: { code: "terminal_handle_stale" } });
  const r = watch([stale, stale, "not json"]);
  assert.equal(lines(r).length, 2);
  assert.equal(lines(r)[0], "READFAIL terminal_handle_stale");
  assert.match(lines(r)[1], /^READFAIL /);
});

test("引数が誤っていれば、1 で終わる", () => {
  assert.equal(spawnSync("node", [script], { encoding: "utf8" }).status, 1);
  assert.equal(spawnSync("node", [script, "-", "--interval", "0"], { encoding: "utf8" }).status, 1);
});

test("orca のコマンドを起動できなければ、1 で終わる", () => {
  const r = spawnSync("node", [script, "term_x"], { encoding: "utf8", env: { ...process.env, ORCA_CLI_COMMAND: "/nonexistent/orca" } });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /起動できない/);
});

test("orca のコマンドが実行できないファイルなら、1 で終わる", () => {
  const r = spawnSync("node", [script, "term_x"], { encoding: "utf8", env: { ...process.env, ORCA_CLI_COMMAND: fileURLToPath(import.meta.url) } });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /EACCES/);
});
