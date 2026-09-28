// スキル setup-agent-harness が呼ぶ。setup-agent-harness と、同じ skills/ か同じ marketplace のプラグインにあるほかのスキルの assets/ を、利用者のリポジトリに写す。
// 使い方: node setup.mjs [--branches main,develop] [--docs design,adr,specs] [--diff] [--force <パス>]... | --gitignore
// 省いた値は、既にある context/project.yml から引き継ぐ。それもなければ main と develop、design,adr,specs
// .gitignore に .ai-out/ と、apm.lock.yaml にある apm の配置先の行がなければ足す。apm.yml には、apm install の後にそれを行う post-install を足す
// --gitignore は .gitignore の行だけをそろえる。apm の post-install から呼ばれる
// どちらも、パッケージから消えたスキルとフックの写しを配置先から消し、.gitignore の行も消す
// 終了コード: 0 は完了、1 は --diff で差分か未配置のファイルあり、2 は引数の誤り
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, mkdtempSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const opts = { branches: "", docs: "", diff: false, gitignore: false, force: [] };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--diff") opts.diff = true;
  else if (a === "--gitignore") opts.gitignore = true;
  else if (a === "--force") opts.force.push(argv[++i]);
  else if (a.startsWith("--") && a.slice(2) in opts) opts[a.slice(2)] = argv[++i];
  else fail(`知らない引数: ${a}`);
}
const root = process.cwd();
const DEPLOYED_DIR = /^\/\.(claude|agents|codex)\/(skills|hooks)\/[^/]+\/$/;
// apm の lifecycle は利用者の apm.yml にしか書けず、パッケージからは渡せない
const LIFECYCLE = `lifecycle:
  post-install:
  - type: command
    description: apm の配置先を .gitignore に足す（agent-harness）
    command: 'd=$(ls -d .claude/skills/setup-agent-harness .agents/skills/setup-agent-harness 2>/dev/null | head -1); [ -n "$d" ] || d=$(find \"$HOME/.claude/plugins/cache\" -maxdepth 5 -type d -path \"*/core/*/skills/setup-agent-harness\" 2>/dev/null | head -1); [ -z "$d" ] || node "$d/scripts/setup.mjs" --gitignore'
    timeoutSec: 30`;
const ignorePath = join(root, ".gitignore");
const ignoreLines = existsSync(ignorePath) ? readFileSync(ignorePath, "utf8").split(/\r?\n/) : [];
const unignored = [".ai-out/", ...deployedDirs()].filter((l) => !ignoreLines.includes(l));
if (opts.gitignore) {
  syncDeployed();
  addIgnored();
  process.exit(0);
}
const apmPath = join(root, "apm.yml");
const apmYml = existsSync(apmPath) ? readFileSync(apmPath, "utf8") : "";
const lifecycle = !apmYml || apmYml.includes("setup.mjs\" --gitignore") ? "ok" : /^lifecycle:/m.test(apmYml) ? "manual" : "missing";
const existing = existsSync(join(root, "context/project.yml")) ? readFileSync(join(root, "context/project.yml"), "utf8") : "";
const pick = (key, fallback) => new RegExp(`^\\s*${key}: (.+)$`, "m").exec(existing)?.[1].trim().replace(/^["']|["']$/g, "") ?? fallback;
opts.branches ||= pickList("names") ?? "main,develop";
opts.docs ||= ["design", "adr", "spec"].map((k) => pick(k, { design: "design", adr: "adr", spec: "specs" }[k])).join(",");
const docs = opts.docs.split(",");
if (docs.length !== 3) fail(`--docs は design,adr,spec の 3 つを順に書く: ${opts.docs}`);
for (const d of docs) if (d.split("/").some((s) => s === "" || s === "." || s === "..")) fail(`文書のディレクトリはリポジトリの中の相対パスで書く。空、.、.. の区切りは使えない: ${d}`);
if (opts.force.includes(undefined)) fail("--force にはパスが要る");

const skillDir = fileURLToPath(new URL("..", import.meta.url));
const skillsRoot = dirname(skillDir);

const candidates = new Map();
collect(join(skillDir, "assets"), candidates);
// ほかのスキルの assets/ にある design/、adr/、specs/ は、利用者が答えた文書のディレクトリ名に置き換える
const dirs = { design: docs[0], adr: docs[1], specs: docs[2] };
for (const root of skillsRoots()) {
  for (const name of readdirSync(root)) {
    const assets = join(root, name, "assets");
    if (name === basename(skillDir) || !existsSync(assets)) continue;
    for (const [p, body] of collect(assets, new Map())) {
      const [head, ...rest] = p.split("/");
      candidates.set(head in dirs && rest.length ? [dirs[head], ...rest].join("/") : p, body);
    }
  }
}
candidates.set("context/project.yml", fillProject(candidates.get("context/project.yml")));
for (const [p, body] of candidates) candidates.set(p, body.replaceAll("<リポジトリ名>", basename(root)));
candidates.set("context/index.md", buildIndex());

if (opts.force.length) {
  for (const p of opts.force) {
    if (!candidates.has(p)) fail(`テンプレートにないファイル: ${p}`);
    if (existsSync(join(root, p))) console.log(showDiff(p) || `${p}: 差分なし`);
    write(p);
    console.log(`上書きした: ${p}`);
  }
} else if (opts.diff) {
  let differs = 0;
  for (const p of candidates.keys()) {
    if (!existsSync(join(root, p))) { differs++; console.log(`${p}: まだない。既定の実行で写される`); continue; }
    const d = showDiff(p);
    if (d) { differs++; console.log(d); } else console.log(`${p}: 差分なし`);
  }
  if (unignored.length) { differs++; console.log(`.gitignore: 次の行がない。既定の実行で足される\n${unignored.map((l) => `  ${l}`).join("\n")}`); }
  if (lifecycle !== "ok") { differs++; console.log(`apm.yml: .gitignore をそろえる post-install がない。${lifecycle === "missing" ? "既定の実行で足される" : "lifecycle: があるので、次を手で足す"}\n${LIFECYCLE}`); }
  process.exit(differs ? 1 : 0);
} else {
  const copied = [], skipped = [];
  for (const p of candidates.keys()) (existsSync(join(root, p)) ? skipped : copied).push(p);
  for (const p of copied) write(p);
  if (copied.length) console.log(`写した:\n${copied.map((p) => `  ${p}`).join("\n")}`);
  if (skipped.length) console.log(`飛ばした（既にある。--diff で差分を見る）:\n${skipped.map((p) => `  ${p}`).join("\n")}`);
  syncDeployed();
  addIgnored();
  if (lifecycle === "missing") {
    writeFileSync(apmPath, `${apmYml}${apmYml.endsWith("\n") ? "" : "\n"}${LIFECYCLE}\n`);
    console.log("足した: apm.yml に、.gitignore をそろえる post-install。マシンごとに 1 度 apm lifecycle trust を実行する");
  } else if (lifecycle === "manual") console.log(`apm.yml に lifecycle: があるので、次を手で足す\n${LIFECYCLE}`);
}

// 消えた写しは、前回の post-install の記録と、.gitignore の配置先の行から探す。
// pull でロックファイルと .gitignore が先に変わると、どちらか一方では見つからないためである
function syncDeployed() {
  const current = new Set(deployedDirs());
  const record = gitPath("agent-harness/deployed");
  const recorded = record && existsSync(record) ? readFileSync(record, "utf8").split("\n") : [];
  const stale = [...new Set([...recorded, ...ignoreLines])].filter((d) => DEPLOYED_DIR.test(d) && !current.has(d));
  const removed = [];
  for (const d of stale) {
    const dir = join(root, d.slice(1, -1));
    if (!existsSync(dir) || isTracked(d.slice(1, -1))) continue;
    rmSync(dir, { recursive: true, force: true });
    removed.push(d);
  }
  if (removed.length) console.log(`消した: パッケージから消えた写し\n${removed.map((d) => `  ${d}`).join("\n")}`);
  const dropped = new Set(stale.filter((d) => !existsSync(join(root, d.slice(1, -1)))));
  if (dropped.size && existsSync(ignorePath)) {
    const lines = readFileSync(ignorePath, "utf8").split(/\r?\n/);
    writeFileSync(ignorePath, lines.filter((l) => !dropped.has(l)).join("\n"));
    const gone = ignoreLines.filter((l) => dropped.has(l));
    if (gone.length) console.log(`消した: .gitignore から\n${gone.map((l) => `  ${l}`).join("\n")}`);
  }
  if (record) {
    mkdirSync(dirname(record), { recursive: true });
    writeFileSync(record, `${[...current].join("\n")}\n`);
  }
}

function gitPath(name) {
  try {
    return resolve(root, execFileSync("git", ["rev-parse", "--git-path", name], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim());
  } catch {
    return undefined;
  }
}

// Git を読めないときは、追跡しているとみなして消さない
function isTracked(path) {
  try {
    return execFileSync("git", ["ls-files", "--", path], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() !== "";
  } catch {
    return true;
  }
}

function addIgnored() {
  if (!unignored.length) return;
  const current = existsSync(ignorePath) ? readFileSync(ignorePath, "utf8") : "";
  writeFileSync(ignorePath, `${current}${current && !current.endsWith("\n") ? "\n" : ""}${unignored.join("\n")}\n`);
  console.log(`足した: .gitignore に\n${unignored.map((l) => `  ${l}`).join("\n")}`);
}

// パッケージマネージャーはすべてのスキルを同じ skills/ に置く。
// Claude Code は marketplace から入れたプラグインを plugins/cache/<marketplace>/<plugin>/<version>/skills/ に分けて置くので、同じ marketplace のほかのプラグインも見る
function skillsRoots() {
  const plugin = dirname(dirname(skillsRoot));
  const market = dirname(plugin);
  if (basename(dirname(market)) !== "cache" || basename(dirname(dirname(market))) !== "plugins") return [skillsRoot];
  const roots = [skillsRoot];
  for (const e of readdirSync(market, { withFileTypes: true })) {
    const name = e.name;
    if (!e.isDirectory() || join(market, name) === plugin) continue;
    // 古い版の削除が済むまで版のディレクトリが並ぶので、最後に置かれたものを使う。版を選ぶ必要が出たら installed_plugins.json を読む
    const latest = readdirSync(join(market, name))
      .map((v) => join(market, name, v, "skills"))
      .filter(existsSync)
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
    if (latest) roots.push(latest);
  }
  return roots;
}

// apm.lock.yaml の deployed_files を、スキルとフックはディレクトリの単位にまとめて返す。
// ディレクトリを丸ごと無視すると、利用者が .claude/skills/ に置く自作のスキルまで追跡から外れる
function deployedDirs() {
  const lock = join(root, "apm.lock.yaml");
  if (!existsSync(lock)) return [];
  const dirs = new Set();
  let inList = false;
  for (const line of readFileSync(lock, "utf8").split(/\r?\n/)) {
    if (/^\s*deployed_files:\s*$/.test(line)) { inList = true; continue; }
    const item = /^\s*- (\S+)\s*$/.exec(line);
    if (!inList || !item) { inList = false; continue; }
    const parts = item[1].split("/");
    dirs.add(["skills", "hooks"].includes(parts[1]) && parts.length >= 3 ? `/${parts.slice(0, 3).join("/")}/` : `/${item[1]}`);
  }
  return [...dirs].sort();
}

// YAML の配列を、[a, b] の形と、- a の行が続く形のどちらでも読む
function pickList(key) {
  const m = new RegExp(`^(\\s*)${key}:[ \\t]*(.*)$`, "m").exec(existing);
  if (!m) return undefined;
  if (m[2].startsWith("[")) return m[2].replace(/[\[\]\s"']/g, "");
  const rest = existing.slice(m.index + m[0].length);
  const items = [];
  for (const line of rest.split("\n").slice(1)) {
    const item = /^\s*-\s+(.+)$/.exec(line);
    if (!item) break;
    items.push(item[1].trim().replace(/^["']|["']$/g, ""));
  }
  return items.join(",");
}

function collect(dir, into, base = dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) collect(full, into, base);
    else into.set(relative(base, full).split(sep).join("/"), readFileSync(full, "utf8"));
  }
  return into;
}

function fillProject(yaml) {
  const [design, adr, spec] = docs;
  return yaml
    .replace(/^(\s*names:) .*$/m, `$1 [${opts.branches}]`)
    .replace(/^(\s*design:) .*$/m, `$1 ${design}`)
    .replace(/^(\s*adr:) .*$/m, `$1 ${adr}`)
    .replace(/^(\s*spec:) .*$/m, `$1 ${spec}`);
}

function buildIndex() {
  const gather = (dir) => {
    const entries = new Map();
    if (existsSync(join(root, dir))) collect(join(root, dir), entries);
    for (const [p, body] of candidates) if (p.startsWith(`${dir}/`)) entries.set(p.slice(dir.length + 1), body);
    for (const f of entries.keys()) if (!f.endsWith(".md")) entries.delete(f);
    return entries;
  };
  return renderIndex(gather("context"), gather(docs[0]), docs[0]).index;
}

function frontmatter(body) {
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(body)?.[1] ?? "";
  const pick = (key) => new RegExp(`^${key}:[ \\t]*(.+?)\\r?$`, "m").exec(block)?.[1].trim().replace(/^(["'])(.*)\1$/, "$2");
  return {
    title: pick("title"),
    description: pick("description"),
    status: pick("status"),
    missing: ["type", "title", "description"].filter((key) => !pick(key)),
  };
}

function renderIndex(context, design, designDir) {
  const missing = [];
  const line = (link, body) => {
    const meta = frontmatter(body);
    missing.push(...meta.missing.map((key) => `${link}: frontmatter に ${key} がない`));
    return `- [${meta.title}](${link}) — ${meta.description}${meta.status === "draft" ? "（draft）" : ""}`;
  };
  const sorted = (entries) => [...entries].sort(([a], [b]) => (a < b ? -1 : 1));
  const lines = sorted(context).filter(([f]) => f !== "index.md" && f !== "log.md").map(([f, body]) => line(f, body));
  if (design.size) lines.push("", "## Design Doc", "", ...sorted(design).map(([f, body]) => line(`../${designDir}/${f}`, body)));
  const index = `# context の目次\n\n作業の中で参照する、このリポジトリの規約と事実。変更を取り込むまでの手順は [CONTRIBUTING.md](../CONTRIBUTING.md) にある。\n\n${lines.join("\n")}\n`;
  return { index, missing };
}

function showDiff(p) {
  const tmp = join(mkdtempSync(join(tmpdir(), "setup-")), basename(p));
  writeFileSync(tmp, candidates.get(p));
  try {
    execFileSync("git", ["diff", "--no-index", "--", join(root, p), tmp], { encoding: "utf8" });
    return "";
  } catch (e) {
    if (e.status !== 1) throw e;
    return e.stdout;
  }
}

function write(p) {
  mkdirSync(dirname(join(root, p)), { recursive: true });
  writeFileSync(join(root, p), candidates.get(p));
}

function fail(msg) {
  console.error(msg);
  process.exit(2);
}
