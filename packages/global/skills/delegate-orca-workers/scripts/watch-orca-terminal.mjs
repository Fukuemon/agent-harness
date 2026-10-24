#!/usr/bin/env node
// Orca の端末を一定の間隔で読み、止まった状態を見つけたら 1 行ずつ標準出力に出す。
//
// 使い方:
//   node watch-orca-terminal.mjs <handle> [--interval <秒>]
//     `orca terminal read --terminal <handle> --json` を間隔ごとに読み続ける。終わらない。
//     実行するコマンドは、環境変数 ORCA_CLI_COMMAND があればその値、なければ orca。値は実行ファイルのパスだけで、引数を含めない。
//   node watch-orca-terminal.mjs - [--interval <秒>]
//     標準入力の 1 行を、`orca terminal read --json` の 1 回の出力として読む。行の間は間隔の秒数とみなす。
//     保存した読み取りの記録を判定し直すときに使う。記録は `jq -c .` で 1 行ずつにする。
//
// 出す行:
//   STATUS <状態>       端末の状態が running でなくなった。
//   HEREDOC             heredoc を含むシェルのコマンドが 3 分を超えた。
//   LIMIT <行>          利用の上限の表示が出た。
//   LONGCMD <分>m       シェルのコマンドが 8 分を超えた。その後は 10 分ごと。
//   IDLE <分> <末尾>    画面が 4 分変わらない。サブエージェントかバックグラウンドのシェルを待つ間は 20 分。
//   READFAIL <理由>     端末を読めない。
// 同じ状態が続く間は、同じ行を繰り返さない。
//
// 終了コード:
//   0  標準入力から読む形で、入力が終わった。
//   1  引数が誤っている。orca のコマンドを起動できない（時間切れは除き、READFAIL ETIMEDOUT を出して続ける）。

import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline";

const usage = "使い方: node watch-orca-terminal.mjs <handle|-> [--interval <秒>]";

function parseArgs(argv) {
  let handle;
  let interval = 60;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--interval") {
      interval = Number(argv[++i]);
      if (!Number.isFinite(interval) || interval <= 0) return null;
    } else if (handle === undefined) {
      handle = argv[i];
    } else {
      return null;
    }
  }
  return handle ? { handle, interval } : null;
}

const args = parseArgs(process.argv.slice(2));
if (!args) {
  console.error(usage);
  process.exit(1);
}

// 表示の文言は Claude Code の端末の表示に合わせている。表示が変わったら正規表現を直す
const spinner = /^[✻✳✽✶✢·*] |esc to interrupt|tokens/;
// 区切り語の後に、行末、`)`、`>`、`|`、`&&` が続くものだけを heredoc とみなす。here-string とシフト演算を除くための簡略化で、`;` が続く heredoc は取りこぼす
const heredoc = /(?<!<)<<(?!<)-?\s*(['"]?)[A-Za-z_]\w*\1\s*(?:\)|[>|]|&&|$)/m;
// 実行中のシェルのコマンドの見出しは 2 つの形がある。Claude Code 2.1.310 は `Running <説明> · 3m 31s` の下に `⎿  $ <コマンド>` を出す。
// 前の形は、行頭の ⏺ の呼び出しの後に `Running 1 shell command… (3m 10s)` を出す
const runningHeader = /^\s*Running .+ · (?:\d+h )?(?:\d+m )?\d+s\s*$/;
const toolCall = /^\s*⏺ /;
const shellRunning = /Running [0-9]+ shell command/;
const limitText = /usage limit reached|you've hit your|limit will reset|resets at [0-9]|5-hour limit|weekly limit/i;
const waitingText = /◯ |[0-9]+ shell|background agent/;
const separator = /^─{10,}/;

const readsFor = (minutes) => Math.ceil((minutes * 60) / args.interval);
const state = { status: "running", readFail: "", heredocTold: false, limit: "", lastElapsed: 0, call: "", nextLong: 8, prev: null, same: 0, idleTold: false };

// `3m 31s`、`1h 5m`、`10s` のような経過の表示を分に直す。秒だけなら 0 分
function minutesOf(text) {
  return Number(text.match(/(\d+)h/)?.[1] ?? 0) * 60 + Number(text.match(/(\d+)m\b/)?.[1] ?? 0);
}

// 入力欄とその下のフッターを除く。入力欄は、末尾の 2 本の区切り線に挟まれている
function aboveInput(tail) {
  const seps = tail.flatMap((line, i) => (separator.test(line) ? [i] : []));
  return seps.length >= 2 ? tail.slice(0, seps[seps.length - 2]) : tail;
}

// 実行中のコマンドの見出しの行、コマンドの表示、経過の分を返す。なければ null
function currentCommand(lines) {
  const header = lines.findLastIndex((line) => runningHeader.test(line));
  if (header >= 0) {
    const command = lines.slice(header + 1).find((line) => /^\s*⎿\s+\$ /.test(line)) ?? "";
    const [call, time] = lines[header].split(/ · (?=[^·]*$)/);
    return { call, command, elapsed: minutesOf(time) };
  }
  const call = lines.findLastIndex((line) => toolCall.test(line));
  const rest = lines.slice(Math.max(0, call));
  const running = rest.findLast((line) => shellRunning.test(line));
  if (!running) return null;
  const output = rest.findIndex((line) => /^\s*⎿/.test(line));
  const command = rest.slice(0, output < 0 ? undefined : output).filter((line) => !shellRunning.test(line)).join("\n");
  return { call: call >= 0 ? lines[call] : "", command, elapsed: minutesOf(running.match(/\(([^)]*)\)\s*$/)?.[1] ?? "") };
}

function say(line) {
  console.log(line);
}

function fail(reason) {
  if (reason !== state.readFail) say(`READFAIL ${reason}`);
  state.readFail = reason;
}

function inspect(raw, stderr = "") {
  let read;
  try {
    read = JSON.parse(raw);
  } catch (error) {
    fail((stderr.trim() || error.message).split("\n")[0]);
    return;
  }
  if (read.ok === false || !Array.isArray(read.result?.terminal?.tail)) {
    fail(read.error?.code ?? "result.terminal.tail がない");
    return;
  }
  const status = read.result.terminal.status ?? "?";
  const tail = read.result.terminal.tail.slice(-25);
  state.readFail = "";

  if (status !== state.status && status !== "running") say(`STATUS ${status}`);
  state.status = status;

  const { call, command: current, elapsed } = currentCommand(aboveInput(tail)) ?? { call: "", command: "", elapsed: 0 };
  // 経過の分が前より減るか、実行中のコマンドの見出しが変わったら、別のコマンドが始まったとみなす
  if (elapsed < state.lastElapsed || call !== state.call) {
    state.heredocTold = false;
    state.nextLong = 8;
  }
  state.lastElapsed = elapsed;
  state.call = call;

  if (heredoc.test(current)) {
    if (elapsed >= 3 && !state.heredocTold) {
      say("HEREDOC 3 分を超えた heredoc のコマンドがある");
      state.heredocTold = true;
    }
  } else {
    state.heredocTold = false;
  }

  const limitLine = tail.slice(-8).findLast((line) => limitText.test(line)) ?? "";
  if (limitLine && limitLine !== state.limit) say(`LIMIT ${limitLine.trim()}`);
  state.limit = limitLine;

  if (elapsed >= state.nextLong) {
    say(`LONGCMD ${elapsed}m`);
    state.nextLong = (Math.floor(elapsed / 10) + 1) * 10;
  }

  const body = tail.filter((line) => !spinner.test(line)).join("\n");
  state.same = body === state.prev ? state.same + 1 : 0;
  state.prev = body;
  const idleMinutes = waitingText.test(tail.slice(-4).join("\n")) ? 20 : 4;
  if (state.same === 0) state.idleTold = false;
  if (state.same >= readsFor(idleMinutes) && !state.idleTold) {
    const last = body.split("\n").filter((line) => !/^[─ ]*$/.test(line)).slice(-3).join(" ");
    say(`IDLE ${idleMinutes} ${last}`);
    state.idleTold = true;
  }
}

if (args.handle === "-") {
  const lines = createInterface({ input: process.stdin });
  for await (const line of lines) if (line.trim()) inspect(line);
  process.exit(0);
}

const command = process.env.ORCA_CLI_COMMAND || "orca";
for (;;) {
  const r = spawnSync(command, ["terminal", "read", "--terminal", args.handle, "--json"], { encoding: "utf8", timeout: 30_000 });
  if (r.error && r.error.code !== "ETIMEDOUT") {
    console.error(`${command} を起動できない: ${r.error.code ?? r.error.message}`);
    process.exit(1);
  }
  if (r.error) fail(r.error.code);
  else inspect(r.stdout, r.stderr);
  await new Promise((resolve) => setTimeout(resolve, args.interval * 1000));
}
