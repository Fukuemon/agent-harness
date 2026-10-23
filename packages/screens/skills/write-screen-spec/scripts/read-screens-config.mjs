// check-screens.mjs と copy-screen-templates.mjs が読み込む。context/project.yml の screens のキーを読む。
// 依存を持たずに配置先で動かすため、YAML は screens: の下の 1 段のスカラーだけを読む。

/**
 * context/project.yml の本文から screens のキーを読み、形を確認して返す。
 * 読めない形（flow の形、ブロックのスカラー、閉じていない引用符）と、パスや URL の形の誤りは、Error を投げる。
 * screens が無ければ空のオブジェクトを返す。
 */
export function readScreensConfig(text) {
  const values = {};
  let inScreens = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\S/.test(line)) {
      const top = line.match(/^screens:(.*)$/);
      inScreens = top !== null;
      if (inScreens && stripComment(top[1]).trim() !== "") throw new Error(`screens は、キーごとに 1 行の形で書く: ${line}`);
      continue;
    }
    if (!inScreens || line.trim() === "" || line.trim().startsWith("#")) continue;
    const m = line.match(/^\s+([a-z0-9_]+):\s*(.*)$/);
    if (!m) throw new Error(`screens の行を読めない: ${line}`);
    values[m[1]] = scalar(m[1], m[2].trim());
  }
  for (const key of ["dir", "tokens_css", "e2e_dir"]) {
    const v = values[key];
    if (v === undefined) continue;
    if (v === "" || v.startsWith("/") || v.split("/").some((s) => s === "" || s === "." || s === "..")) {
      throw new Error(`screens.${key} はリポジトリのルートからの相対パスで書く。空、.、.. の区切りは使えない: ${v}`);
    }
  }
  if (values.catalog_url !== undefined && !/^https?:\/\/\S+$/.test(values.catalog_url)) throw new Error(`screens.catalog_url は http か https の URL で書く: ${values.catalog_url}`);
  return values;
}

function scalar(key, raw) {
  const quoted = raw.match(/^(["'])(.*?)\1\s*(#.*)?$/);
  if (quoted) return quoted[2];
  const value = stripComment(raw);
  if (/^["'|>{[&*!]/.test(value)) throw new Error(`screens.${key} は、引用符で閉じた 1 行の値か、引用符のない 1 行の値で書く: ${raw}`);
  return value;
}

function stripComment(raw) {
  return raw.replace(/(^|\s+)#.*$/, "");
}
