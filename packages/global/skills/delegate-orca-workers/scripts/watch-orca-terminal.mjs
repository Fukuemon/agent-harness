#!/usr/bin/env node
// Orca の端末を一定の間隔で読み、止まった状態を見つけたら 1 行ずつ標準出力に出す。
//
// 使い方:
//   node watch-orca-terminal.mjs <handle> [--interval <秒>]
//     `orca terminal read --terminal <handle> --json` を間隔ごとに読み続ける。終わらない。
//     実行するコマンドは、環境変数 ORCA_CLI_COMMAND があればその値、なければ orca。
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
//   1  引数が誤っている。orca のコマンドを起動できない。

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

// 表示の文言は Claude Code と Codex CLI の端末の表示に合わせている。表示が変わったら正規表現を直す
const spinner = /^[✻✳✽✶✢·*] |esc to interrupt|tokens/;
const heredoc = /<<-?\s*['"]?[A-Z_]+['"]?/;
// Claude Code は、ツールの呼び出しを行頭の ⏺ で表示する。最後の呼び出しから後を、実行中のコマンドとみなす
const toolCall = /^\s*⏺ /;
const shellMinutes =/Running [0-9]+ shell command[^0-9]*([0-9]+)m/g;
const limitText = /usage limit reached|you've hit your|limit will reset|resets at [0-9]|5-hour limit|weekly limit/i;
const waitingText = /◯ |[0-9]+ shell|background agent/;

const readsFor = (minutes) => Math.ceil((minutes * 60) / args.interval);
const state = { status: "running", readFail: "", heredocTold: false, limit: "", lastElapsed: 0, call: "", nextLong: 8, prev: null, same: 0 };

function say(line) {
  console.log(line);
}

function fail(reason) {
  if (reason !== state.readFail) say(`READFAIL ${reason}`);
  state.readFail = reason;
}

function inspect(raw) {
  let status;
  let tail;
  try {
    const read = JSON.parse(raw);
    if (read.ok === false) throw new Error(read.error?.code ?? "ok: false");
    const terminal = read.result.terminal;
    status = terminal.status ?? "?";
    tail = terminal.tail.slice(-25);
  } catch (error) {
    fail(error.message.split("\n")[0]);
    return;
  }
  state.readFail = "";

  if (status !== state.status && status !== "running") say(`STATUS ${status}`);
  state.status = status;

  const text = tail.join("\n");
  const minutes = [...text.matchAll(shellMinutes)].map((m) => Number(m[1]));
  const elapsed = minutes.length ? minutes[minutes.length - 1] : 0;
  const callIndex = tail.findLastIndex((line) => toolCall.test(line));
  const current = tail.slice(Math.max(0, callIndex)).join("\n");
  // 経過の分が前より減るか、最後の呼び出しの行が変わったら、別のコマンドが始まったとみなす
  const call = callIndex >= 0 ? tail[callIndex] : "";
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
  if (state.same === readsFor(idleMinutes)) {
    const last = body.split("\n").filter((line) => !/^[─ ]*$/.test(line)).slice(-3).join(" ");
    say(`IDLE ${idleMinutes} ${last}`);
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
  if (r.error?.code === "ENOENT") {
    console.error(`${command} を起動できない`);
    process.exit(1);
  }
  if (r.error) fail(r.error.code ?? r.error.message);
  else inspect(r.stdout || r.stderr);
  await new Promise((resolve) => setTimeout(resolve, args.interval * 1000));
}
