// packages/global が変わったときだけ、この端末の user scope へ配置し直す。lefthook の post-commit と post-merge から呼ぶ。
// 使い方: node scripts/apply-global.mjs <比べる元のコミット> [比べる先のコミット]
// 終了コード: 常に 0。配置を飛ばしたときと失敗したときは、理由を標準エラーに出す。コミットと pull を止めないため
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const [from, to = "HEAD"] = process.argv.slice(2);
const git = (...args) => spawnSync("git", args, { encoding: "utf8" });
const root = git("rev-parse", "--show-toplevel").stdout.trim();
const pkg = join(root, "packages/global");

// 最初のコミットのように元がなければ、先のコミットの変更だけを見る
const changed = from && git("rev-parse", "-q", "--verify", from).status === 0
  ? git("diff", "--name-only", from, to, "--", "packages/global").stdout
  : git("show", "--name-only", "--format=", to, "--", "packages/global").stdout;
if (!changed.trim()) process.exit(0);

const manifest = join(homedir(), ".apm/apm.yml");
if (!existsSync(manifest) || !readFileSync(manifest, "utf8").includes(pkg)) {
  console.error(`apply-global: ${manifest} に ${pkg} がないので、配置を飛ばす`);
  process.exit(0);
}

console.error("apply-global: packages/global の変更を user scope へ配置する");
try {
  execFileSync("apm", ["install", "-g"], { stdio: ["ignore", 2, 2] });
  execFileSync("apm", ["compile", "-g"], { stdio: ["ignore", 2, 2] });
} catch (e) {
  console.error(`apply-global: 配置に失敗した: ${e.message}`);
}
