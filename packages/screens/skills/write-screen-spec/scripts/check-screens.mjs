// 画面仕様書（<screens.dir>/<画面 ID>_<画面の名前>/）を、画面仕様書の規約（<screens.dir>/rules.md）の「点検」のセクションの項目で確認する。
// context/project.yml の screens のキーを読む。dir の既定は docs/screens。catalog_url があればカタログの欄のリンクを、e2e_dir があればテストのコードの testid を見る。
// 引数で画面のディレクトリを渡すと、そのディレクトリだけを見る。省くと全ての画面を見て、testid も見る。
// 使い方: node check-screens.mjs [画面のディレクトリ]...
// 終了コード: 0 は違反なし、1 は違反あり（一覧を標準エラーに出す）、2 は設定の誤りか、ファイルが読めない
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";

const root = process.cwd();
const config = readConfig(join(root, "context/project.yml"));
const SCREENS_DIR = config.dir ?? "docs/screens";
const COMMON = join(SCREENS_DIR, "_common");
if (!existsSync(join(COMMON, "mock.js"))) fail(`${join(COMMON, "mock.js")} が無い。screens.dir を確認する`);
if (config.tokens_css !== undefined && !existsSync(join(root, config.tokens_css))) fail(`screens.tokens_css の ${config.tokens_css} が無い`);
if (config.e2e_dir !== undefined && !existsSync(join(root, config.e2e_dir))) fail(`screens.e2e_dir の ${config.e2e_dir} が無い`);

const SCREEN_DIR_NAME = /^([a-z]+-[a-z]+)_(.+)$/;
const MOCK_NAME = /^\d{2}-[a-z0-9]+(-[a-z0-9]+)*\.html$/;
// デバイスの名前は mock.js の VIEWS だけに書くので、そこから読む
const VIEWS = new Set([...readFileSync(join(COMMON, "mock.js"), "utf8").matchAll(/^\s+'?([a-z-]+)'?: \{ label:/gm)].map((m) => m[1]));
const SCRIPTS = ["../../_common/mock.js", "../../_common/interact.js"];
const GO_TARGET = /^(\.\.\/\.\.\/[a-z]+-[a-z]+_[^/]+\/mocks\/)?\d{2}-[a-z0-9-]+\.html$/;
const TESTID = /^[a-z][a-z0-9]*(-([a-z0-9]+(_[a-z0-9]+)*|\{[^}]+\}))+$/;
const TABLE_HEADER = ["番号", "種別", "要素名", "仕様"];
const FORBIDDEN = [
  [/https?:\/\//, "外部の URL"],
  [/position:\s*fixed/i, "position: fixed"],
  [/\d(\.\d+)?(dvh|svh|lvh|vh|dvw|svw|lvw|vw|vmin|vmax)\b/i, "viewport の単位"],
  [/@media[^{]*\b(min-|max-)?(width|height|aspect-ratio|orientation)\b/i, "viewport の寸法の @media"],
  [/prefers-color-scheme/i, "ダークモード"],
];
const PLACEHOLDER = /<(画面|要素|操作|状態)[^>]*>/;
const LINK_TARGET = /\]\(([^)\s]+)\)/g;
const TEST_FILE = /\.(c|m)?(j|t)sx?$/;

const problems = [];
const mockTestIds = new Set();
const report = (path, message) => problems.push(`${path}: ${message}`);

const targets = process.argv.length > 2
  ? process.argv.slice(2)
  : readdirSync(SCREENS_DIR).filter((e) => !e.startsWith("_") && !e.startsWith(".")).map((e) => join(SCREENS_DIR, e)).filter((p) => statSync(p).isDirectory());
for (const dir of targets) checkScreen(dir);
if (process.argv.length <= 2 && config.e2e_dir !== undefined) checkTestIds(config.e2e_dir);

if (problems.length > 0) {
  console.error(`画面仕様書の規約の違反が ${problems.length} 件ある。`);
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}
console.log(`${targets.length} 画面が規約に合っている。`);

function fail(message) {
  console.error(message);
  process.exit(2);
}

// 依存を持たずに配置先で動かすため、YAML は screens: の下の 1 段のスカラーだけを読む
function readConfig(path) {
  if (!existsSync(path)) return {};
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (e) {
    fail(`読めない: ${path}\n${e.message}`);
  }
  const values = {};
  let inScreens = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\S/.test(line)) {
      inScreens = /^screens:\s*(#.*)?$/.test(line);
      continue;
    }
    if (!inScreens) continue;
    const m = line.match(/^\s+([a-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const raw = m[2].trim();
    const quoted = raw.match(/^(["'])(.*)\1$/);
    values[m[1]] = quoted ? quoted[2] : raw.replace(/\s+#.*$/, "");
  }
  for (const key of ["dir", "tokens_css", "e2e_dir"]) {
    const v = values[key];
    if (v === undefined) continue;
    if (v === "" || v.startsWith("/") || v.split("/").some((s) => s === "" || s === "." || s === "..")) {
      fail(`screens.${key} はリポジトリのルートからの相対パスで書く。空、.、.. の区切りは使えない: ${v}`);
    }
  }
  if (values.catalog_url !== undefined && !/^https?:\/\/\S+$/.test(values.catalog_url)) fail(`screens.catalog_url は http か https の URL で書く: ${values.catalog_url}`);
  return values;
}

/** CSS と HTML のコメントを除く。コメントの中の語を禁止の記述として拾わないため */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");
}

function attr(tag, name) {
  return tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
}

function isContiguous(numbers) {
  return [...numbers].map(Number).sort((a, b) => a - b).every((n, i) => n === i + 1);
}

function checkCatalogLinks(markdown, specPath) {
  markdown.split(/\r?\n/).forEach((line, index) => {
    if (!line.startsWith("**カタログ**:")) return;
    const links = [...line.matchAll(LINK_TARGET)].map((m) => m[1]);
    if (links.length === 0) report(specPath, `カタログの欄にリンクが無い（${index + 1} 行目）`);
    for (const link of links) {
      if (!link.startsWith(config.catalog_url)) report(specPath, `カタログの欄のリンク ${link} が screens.catalog_url で始まらない（${index + 1} 行目）`);
    }
  });
}

/** 「構成」のセクションの状態のタブ（=== "状態"）ごとに、iframe の src と構成要素の表の番号を返す */
function readStates(markdown, specPath) {
  const states = [];
  const lines = markdown.split(/\r?\n/);
  let current = null;
  let inComposition = false;
  let inTable = false;
  let inFence = null;
  // タブの中身は 4 つの空白で字下げするので、外して読む
  const unindent = (line) => (current !== null ? line.replace(/^ {4}/, "") : line);
  lines.forEach((rawLine, index) => {
    if (current !== null && rawLine.trim() !== "" && !/^( {4}|=== "|## )/.test(rawLine)) {
      report(specPath, `「${current.name}」のタブの中身を 4 つの空白で字下げする（${index + 1} 行目）`);
    }
    const line = unindent(rawLine);
    const fence = line.match(/^(`{3,}|~{3,})/);
    if (fence && (inFence === null || fence[1].startsWith(inFence))) {
      inFence = inFence === null ? fence[1][0].repeat(3) : null;
      return;
    }
    if (inFence !== null) return;
    if (/^## /.test(line)) {
      inComposition = line.trim() === "## 構成";
      current = null;
      return;
    }
    if (!inComposition) return;
    const heading = rawLine.match(/^=== "(.+)"$/);
    if (heading) {
      current = { name: heading[1].trim(), iframe: false, src: null, numbers: new Set(), header: null };
      states.push(current);
      inTable = false;
      return;
    }
    if (current === null) return;
    const iframe = line.match(/^<iframe\b[^>]*>/);
    if (iframe) {
      current.iframe = true;
      current.src = attr(iframe[0], "src") ?? null;
      if (current.src === null) report(specPath, `「${current.name}」の iframe に src が無い`);
      if (attr(iframe[0], "class") !== "mock") report(specPath, `「${current.name}」の iframe に class="mock" が無い`);
      if (!attr(iframe[0], "title")) report(specPath, `「${current.name}」の iframe に title が無い`);
      if (/\s(height|sandbox|loading)=/.test(iframe[0])) report(specPath, `「${current.name}」の iframe に height、sandbox、loading を書かない`);
      const link = unindent(lines[index + 1] ?? "").match(/^<a\b[^>]*>別タブで開く<\/a>$/);
      if (!link || attr(link[0], "class") !== "mock-open" || attr(link[0], "href") !== current.src || attr(link[0], "target") !== "_blank") {
        report(specPath, `「${current.name}」の iframe の直後に、同じ src を開く <a class="mock-open" target="_blank"> が無い`);
      }
      return;
    }
    if (!line.startsWith("|")) {
      inTable = false;
      return;
    }
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (current.header === null) {
      current.header = cells;
      inTable = true;
      return;
    }
    if (!inTable || cells.every((c) => /^:?-+:?$/.test(c))) return;
    if (!/^\d+$/.test(cells[0])) {
      report(specPath, `「${current.name}」の表の番号 ${cells[0]} が整数でない`);
      return;
    }
    current.numbers.add(cells[0]);
  });
  return states;
}

function checkInteractions(code, mockPath) {
  for (const m of code.matchAll(/\sdata-go="([^"]*)"/g)) {
    if (!GO_TARGET.test(m[1])) {
      report(mockPath, `data-go="${m[1]}" を <モック>.html か ../../<画面のディレクトリ>/mocks/<モック>.html にする`);
      continue;
    }
    if (!existsSync(join(dirname(mockPath), m[1]))) report(mockPath, `data-go="${m[1]}" のモックが無い`);
  }
  for (const m of code.matchAll(/\sdata-(go|choice|panel|open|close)(?:=(?:""|'')|(?=[\s/>]))/g)) report(mockPath, `data-${m[1]} の値が空である`);
  for (const tag of code.matchAll(/<[a-z][^>]*\sdata-escape\b[^>]*>/g)) {
    if (!/\sdata-(go|toggle|choice|open|close)\b/.test(tag[0])) report(mockPath, `data-escape を操作の属性の無い要素に付けている: ${tag[0]}`);
  }
  const panels = new Set([...code.matchAll(/\sdata-panel="([^"]*)"/g)].map((m) => m[1]));
  for (const m of code.matchAll(/\sdata-(open|close)="([^"]*)"/g)) {
    if (!panels.has(m[2])) report(mockPath, `data-${m[1]}="${m[2]}" の data-panel が無い`);
  }
}

function checkMock(mockPath, screenId) {
  const html = readFileSync(mockPath, "utf8");
  const code = stripComments(html);
  const sheets = [...code.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map((m) => attr(m[0], "href"));
  const tokens = config.tokens_css === undefined ? [] : [relative(dirname(mockPath), join(root, config.tokens_css)).split(sep).join("/")];
  const expected = ["../../_common/mock.css", ...tokens, "../../_common/wireframe.css", `${screenId}.css`];
  if (sheets.join() !== expected.join()) report(mockPath, `stylesheet を ${expected.join("、")} の順に読む`);
  const body = html.match(/<body\b[^>]*>/)?.[0] ?? "";
  if (!VIEWS.has(attr(body, "data-view") ?? "")) report(mockPath, `body の data-view を ${[...VIEWS].join("、")} のどれかにする`);
  for (const cls of ["stage", "screen", "screen-body", "markers"]) {
    if (!new RegExp(`class="(?:[^"]*\\s)?${cls}(?:\\s[^"]*)?"`).test(html)) report(mockPath, `class="${cls}" の要素が無い`);
  }
  if (!/<div class="markers">\s*<\/div>/.test(html)) report(mockPath, ".markers は空にする");
  const scripts = [...code.matchAll(/<script\b[^>]*>/g)].map((m) => attr(m[0], "src"));
  if (scripts.join() !== SCRIPTS.join()) report(mockPath, `script は ${SCRIPTS.join("、")} だけをこの順に読む`);
  checkInteractions(code, mockPath);
  for (const [pattern, label] of FORBIDDEN) if (pattern.test(code)) report(mockPath, `${label}を使わない`);
  if (PLACEHOLDER.test(html)) report(mockPath, `テンプレートの ${html.match(PLACEHOLDER)[0]} が残っている`);
  const numbers = new Set();
  for (const m of code.matchAll(/\sdata-m=["']([^"']*)["']/g)) {
    if (!/^[1-9]\d*$/.test(m[1])) {
      report(mockPath, `data-m="${m[1]}" が整数でない`);
      continue;
    }
    numbers.add(m[1]);
  }
  if (!isContiguous(numbers)) report(mockPath, `data-m が 1 から欠番なく続いていない（${[...numbers].join("、")}）`);
  for (const m of code.matchAll(/\bdata-testid="([^"]*)"/g)) {
    mockTestIds.add(m[1]);
    if (!TESTID.test(m[1])) report(mockPath, `data-testid="${m[1]}" の形が規約と違う`);
  }
  return numbers;
}

function checkCss(cssPath) {
  const raw = readFileSync(cssPath, "utf8");
  if (PLACEHOLDER.test(raw)) report(cssPath, `テンプレートの ${raw.match(PLACEHOLDER)[0]} が残っている`);
  const css = stripComments(raw);
  for (const [pattern, label] of FORBIDDEN) if (pattern.test(css)) report(cssPath, `${label}を使わない`);
}

function checkScreen(dir) {
  const match = basename(dir).match(SCREEN_DIR_NAME);
  if (!match) {
    report(dir, "ディレクトリの名前を <画面 ID>_<画面の名前> にする");
    return;
  }
  const [, screenId, screenName] = match;
  const specPath = join(dir, "index.md");
  const apiPath = join(dir, "api.md");
  const mocksDir = join(dir, "mocks");
  if (!existsSync(specPath)) report(dir, "index.md が無い");
  if (!existsSync(apiPath)) report(dir, "api.md が無い");
  else if (PLACEHOLDER.test(readFileSync(apiPath, "utf8"))) report(apiPath, "テンプレートの <…> が残っている");
  if (!existsSync(mocksDir)) {
    report(dir, "mocks/ が無い");
    return;
  }
  const cssPath = join(mocksDir, `${screenId}.css`);
  if (existsSync(cssPath)) checkCss(cssPath);
  else report(mocksDir, `${screenId}.css が無い`);

  const mocks = new Map();
  for (const file of readdirSync(mocksDir)) {
    if (file === `${screenId}.css` || file.startsWith(".")) continue;
    if (!MOCK_NAME.test(file)) {
      report(join(mocksDir, file), "モックの名前を <2 桁の連番>-<状態>.html にする");
      continue;
    }
    mocks.set(`mocks/${file}`, checkMock(join(mocksDir, file), screenId));
  }
  if (!existsSync(specPath)) return;

  const markdown = readFileSync(specPath, "utf8");
  if (markdown.split(/\r?\n/)[0] !== `# ${screenId} ${screenName}`) report(specPath, `1 行目を「# ${screenId} ${screenName}」にする`);
  if (PLACEHOLDER.test(markdown)) report(specPath, `テンプレートの ${markdown.match(PLACEHOLDER)[0]} が残っている`);
  const prose = markdown
    .replace(/^( {0,4})(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[^\n]*$/gm, "")
    .replace(/(`+)[^`\n][\s\S]*?\1/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\\</g, "");
  for (const tag of prose.matchAll(/<\/?([a-z][a-z0-9-]*)(?=[\s/>])/gi)) {
    if (!["iframe", "a"].includes(tag[1].toLowerCase())) report(specPath, `生の HTML の <${tag[1]}> を使わない`);
  }
  if (config.catalog_url !== undefined) checkCatalogLinks(markdown, specPath);

  const embedded = new Set();
  for (const state of readStates(markdown, specPath)) {
    if (state.src === null) {
      if (!state.iframe) report(specPath, `「${state.name}」にモックの iframe が無い`);
      continue;
    }
    embedded.add(state.src);
    if (state.header?.join() !== TABLE_HEADER.join()) report(specPath, `「${state.name}」の構成要素の表の見出しを ${TABLE_HEADER.join(" | ")} にする`);
    const numbers = mocks.get(state.src);
    if (numbers === undefined) {
      report(specPath, `「${state.name}」の iframe の ${state.src} が無い`);
      continue;
    }
    const missing = [...state.numbers].filter((n) => !numbers.has(n));
    const extra = [...numbers].filter((n) => !state.numbers.has(n));
    if (missing.length > 0) report(specPath, `「${state.name}」の番号 ${missing.join("、")} が ${state.src} の data-m に無い`);
    if (extra.length > 0) report(specPath, `${state.src} の data-m ${extra.join("、")} が「${state.name}」の表に無い`);
  }
  for (const src of mocks.keys()) if (!embedded.has(src)) report(specPath, `${src} を「構成」のセクションに埋め込んでいない`);
}

function testFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : testFiles(path);
    return TEST_FILE.test(e.name) ? [path] : [];
  });
}

/** getByTestId の引数から、照らす値を返す。exact は同じ値、prefix は始まり。読めなければ null */
function readTestIdArg(arg) {
  const quoted = arg.match(/^(['"])([^'"]+)\1/);
  if (quoted) return { exact: quoted[2] };
  const template = arg.match(/^`([^`]*)`/);
  if (template) {
    const i = template[1].indexOf("${");
    return i === -1 ? { exact: template[1] } : { prefix: template[1].slice(0, i) };
  }
  const regex = arg.match(/^\/\^((?:[^\\/.*+?()[\]{}|$]|\\.)*)/);
  if (regex) return { prefix: regex[1].replace(/\\(.)/g, "$1") };
  return null;
}

/** モックの x-{…} の {…} には 1 文字以上のどの値も入るとみなして、テストの testid に当てる */
function matchesPlaceholder(testId) {
  return [...mockTestIds].some((id) => {
    if (!id.includes("{")) return false;
    const pattern = id.split(/\{[^}]*\}/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".+");
    return new RegExp(`^${pattern}$`).test(testId);
  });
}

// 文字列の testid は同じ値か、モックの x-{…} の形を探す。`x-${…}` と /^x-/ は、x- で始まる値を探す
function checkTestIds(e2eDir) {
  for (const file of testFiles(join(root, e2eDir))) {
    const shown = relative(root, file);
    for (const m of readFileSync(file, "utf8").matchAll(/getByTestId\(\s*([^)\n]*)/g)) {
      const target = readTestIdArg(m[1]);
      if (target === null || target.prefix === "") {
        report(shown, `getByTestId(${m[1].trim()}) の testid を読めない。文字列か、始まりの付いたテンプレートか /^…/ で書く`);
        continue;
      }
      const found = target.exact !== undefined
        ? mockTestIds.has(target.exact) || matchesPlaceholder(target.exact)
        : [...mockTestIds].some((id) => id.startsWith(target.prefix));
      if (!found) report(shown, `テストの testid ${target.exact ?? `${target.prefix}…`} がどのモックの data-testid にも無い`);
    }
  }
}
