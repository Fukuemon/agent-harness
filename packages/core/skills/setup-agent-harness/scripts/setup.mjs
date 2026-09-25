// 導入のスキルが呼ぶ。このスキルと兄弟のスキルの assets/ を、利用者のリポジトリに写す。
// 使い方: node setup.mjs [--branches main,develop] [--topics tech-stack,testing] [--docs design,adr,specs] [--diff] [--force <パス>]...
// 省いた値は、既にある context/project.yml と context/ から引き継ぐ。それもなければ main、話題なし、design,adr,specs
// 終了コード: 0 は完了、1 は --diff で差分あり、2 は引数の誤り
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";

const TOPICS = ["tech-stack", "codebase", "conventions", "testing", "operations", "domain"];

const opts = { branches: "", topics: "", docs: "", diff: false, force: [] };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--diff") opts.diff = true;
  else if (a === "--force") opts.force.push(argv[++i]);
  else if (a.startsWith("--") && a.slice(2) in opts) opts[a.slice(2)] = argv[++i];
  else fail(`知らない引数: ${a}`);
}
const root = process.cwd();
// 省いた値は、既にある値のファイルと context から引き継ぐ。--diff と --force で利用者の値を差分にしないためである
const existing = existsSync(join(root, "context/project.yml")) ? readFileSync(join(root, "context/project.yml"), "utf8") : "";
const pick = (key, fallback) => new RegExp(`^\\s*${key}: (.*)$`, "m").exec(existing)?.[1] ?? fallback;
opts.branches ||= pick("names", "[main]").replace(/[\[\]\s]/g, "");
opts.docs ||= ["design", "adr", "spec"].map((k) => pick(k, { design: "design", adr: "adr", spec: "specs" }[k])).join(",");
opts.topics ||= TOPICS.filter((t) => existsSync(join(root, `context/${t}.md`))).join(",");
const topics = opts.topics ? opts.topics.split(",") : [];
const docs = opts.docs.split(",");
for (const t of topics) if (!TOPICS.includes(t)) fail(`知らない話題: ${t}。選べるのは ${TOPICS.join(", ")}`);
if (docs.length !== 3) fail(`--docs は design,adr,spec の 3 つを順に書く: ${opts.docs}`);
if (opts.force.includes(undefined)) fail("--force にはパスが要る");

const skillDir = fileURLToPath(new URL("..", import.meta.url));
const skillsRoot = dirname(skillDir);

// 候補: 写す先の相対パス → 内容
const candidates = new Map();
collect(join(skillDir, "assets"), candidates);
// ponytail: 兄弟のスキルだけを見る。別のプラグインのキャッシュにある assets/ は、置き場が決まってから足す
for (const name of readdirSync(skillsRoot)) {
  const assets = join(skillsRoot, name, "assets");
  if (name !== basename(skillDir) && existsSync(assets)) collect(assets, candidates);
}
for (const t of TOPICS) if (!topics.includes(t)) candidates.delete(`context/${t}.md`);
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
    if (!existsSync(join(root, p))) { console.log(`${p}: まだない。既定の実行で写される`); continue; }
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

// 目次は、写す context と、利用者のリポジトリに既にある context の frontmatter から作る。下位のディレクトリも含める
function buildIndex() {
  const entries = new Map();
  if (existsSync(join(root, "context"))) collect(join(root, "context"), entries);
  for (const [p, body] of candidates) if (p.startsWith("context/")) entries.set(p.slice("context/".length), body);
  for (const f of entries.keys()) if (!f.endsWith(".md") || f === "index.md") entries.delete(f);
  const lines = [...entries].map(([f, body]) => {
    const title = /^title: (.+)$/m.exec(body)?.[1] ?? f;
    const description = /^description: (.+)$/m.exec(body)?.[1] ?? "";
    return `- [${title}](${f}) — ${description}`;
  });
  return `# context の目次\n\n作業の中で参照する、このリポジトリの規約と事実。変更を取り込むまでの手順は [CONTRIBUTING.md](../CONTRIBUTING.md) にある。\n\n${lines.join("\n")}\n`;
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
