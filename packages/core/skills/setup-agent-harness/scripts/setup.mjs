// スキル setup-agent-harness が呼ぶ。setup-agent-harness と、同じ skills/ にあるほかのスキルの assets/ を、利用者のリポジトリに写す。
// 使い方: node setup.mjs [--branches main,develop] [--docs design,adr,specs] [--diff] [--force <パス>]...
// 省いた値は、既にある context/project.yml から引き継ぐ。それもなければ main と develop、design,adr,specs
// 終了コード: 0 は完了、1 は --diff で差分か未配置のファイルあり、2 は引数の誤り
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const opts = { branches: "", docs: "", diff: false, force: [] };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--diff") opts.diff = true;
  else if (a === "--force") opts.force.push(argv[++i]);
  else if (a.startsWith("--") && a.slice(2) in opts) opts[a.slice(2)] = argv[++i];
  else fail(`知らない引数: ${a}`);
}
const root = process.cwd();
const existing = existsSync(join(root, "context/project.yml")) ? readFileSync(join(root, "context/project.yml"), "utf8") : "";
const pick = (key, fallback) => new RegExp(`^\\s*${key}: (.+)$`, "m").exec(existing)?.[1].trim().replace(/^["']|["']$/g, "") ?? fallback;
opts.branches ||= pickList("names") ?? "main,develop";
opts.docs ||= ["design", "adr", "spec"].map((k) => pick(k, { design: "design", adr: "adr", spec: "specs" }[k])).join(",");
const docs = opts.docs.split(",");
if (docs.length !== 3) fail(`--docs は design,adr,spec の 3 つを順に書く: ${opts.docs}`);
if (opts.force.includes(undefined)) fail("--force にはパスが要る");

const skillDir = fileURLToPath(new URL("..", import.meta.url));
const skillsRoot = dirname(skillDir);

const candidates = new Map();
collect(join(skillDir, "assets"), candidates);
// 同じ skills/ にあるスキルだけを見る。Claude Code のプラグインのキャッシュにある assets/ は、置き場が決まってから足す
for (const name of readdirSync(skillsRoot)) {
  const assets = join(skillsRoot, name, "assets");
  if (name !== basename(skillDir) && existsSync(assets)) collect(assets, candidates);
}
candidates.set("context/project.yml", fillProject(candidates.get("context/project.yml")));
candidates.set("AGENTS.md", candidates.get("AGENTS.md").replace("<リポジトリ名>", basename(root)));
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
  process.exit(differs ? 1 : 0);
} else {
  const copied = [], skipped = [];
  for (const p of candidates.keys()) (existsSync(join(root, p)) ? skipped : copied).push(p);
  for (const p of copied) write(p);
  if (copied.length) console.log(`写した:\n${copied.map((p) => `  ${p}`).join("\n")}`);
  if (skipped.length) console.log(`飛ばした（既にある。--diff で差分を見る）:\n${skipped.map((p) => `  ${p}`).join("\n")}`);
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
  const block = /^---\n([\s\S]*?)\n---/.exec(body)?.[1] ?? "";
  const pick = (key) => new RegExp(`^${key}: (.+)$`, "m").exec(block)?.[1].trim();
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
  const lines = sorted(context).filter(([f]) => f !== "index.md").map(([f, body]) => line(f, body));
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
