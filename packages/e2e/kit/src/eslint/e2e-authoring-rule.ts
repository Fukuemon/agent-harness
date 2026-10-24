import path from 'node:path'
import type { Rule } from 'eslint'

/** 規則の options。値は利用者のリポジトリが決めて、ESLint の設定で渡す */
export type E2eAuthoringRuleOptions = {
  /** テストのディレクトリ。ESLint の cwd からの相対パス。無ければ tests */
  testsDir?: string
  /** 固定の待ちを許すファイル。テストのディレクトリを含む、ESLint の cwd からの相対パス */
  fixedWaitAllowedFiles?: string[]
  /** 待つ時間の名前を定めるファイル。無ければ、待つ時間の数値を確認しない */
  timeoutDefinitionFile?: string
  /** widgets/ に書いてはいけない画面 ID の形。正規表現の文字列で、大文字と小文字を区別しない。無ければ確認しない */
  screenIdPattern?: string
  /** widgets/ が goto で開いてよい URL。無ければ / */
  widgetGotoAllowedUrl?: string
}

// typescript-eslint のパーサーが作る AST は、ESLint の型(estree)に無いプロパティ(importKind、typeAnnotation)を持つ。規則の中では緩い型で読む
type AstNode = { type: string; [key: string]: any }

// setTimeout は、test.setTimeout のようなテストの時間の設定と区別するため、グローバルの呼び出しだけを止める
const GLOBAL_OBJECTS = ['globalThis', 'window', 'self']
const CSS_LOCATORS = ['locator', 'waitForSelector', '$', '$$', '$eval', '$$eval']
// ページの操作のうち、最初の引数にセレクタの文字列を取るもの。locator の同じ名前の操作は、文字列を取らないか、引数が 1 つ少ない
const SELECTOR_ONLY_ACTIONS = ['click', 'dblclick', 'check', 'uncheck', 'hover', 'focus', 'tap']
const SELECTOR_AND_VALUE_ACTIONS = ['fill', 'type', 'press', 'selectOption', 'setInputFiles', 'dispatchEvent']
const TEXT_LOCATORS = [
  'getByRole',
  'getByLabel',
  'getByPlaceholder',
  'getByText',
  'getByTitle',
  'getByAltText',
]
const VALUE_READERS = ['innerText', 'textContent', 'inputValue', 'allInnerTexts', 'allTextContents']
// widgets の待ちが属性を見るのは比較ではないので、spec だけで止める
const SPEC_ONLY_VALUE_READERS = ['getAttribute']
// specs/<dir>/ の値のファイルに操作を書かせないため、ブラウザを操作する型の引数を止める
const OPERATION_TYPE = /\b(Page|Locator|BrowserContext|Browser)\b/

const isSpec = (filePath: string) => filePath.endsWith('.e2e.ts')

const calleeName = (node: AstNode): string => {
  const callee = node.callee
  if (callee.type === 'Identifier') return callee.name
  if (callee.type !== 'MemberExpression' || callee.property.type !== 'Identifier') return ''
  // expect.soft / expect.poll も結果の確認なので expect として扱う
  if (callee.object.type === 'Identifier' && callee.object.name === 'expect') return 'expect'
  return callee.property.name
}

const isFixedWait = (node: AstNode, name: string): boolean => {
  if (name === 'waitForTimeout') return true
  if (name !== 'setTimeout') return false
  const callee = node.callee
  return (
    callee.type === 'Identifier' ||
    (callee.object?.type === 'Identifier' && GLOBAL_OBJECTS.includes(callee.object.name))
  )
}

const isStringNode = (node: AstNode | undefined): boolean =>
  (node?.type === 'Literal' && typeof node.value === 'string') || node?.type === 'TemplateLiteral'

// セレクタの文字列をページの操作に渡しているか。ページの操作はメソッドとして呼ぶので、
// 録画の body が受け取る check(text) のように、関数として呼んだものは見ない
const passesSelector = (node: AstNode, name: string): boolean => {
  if (node.callee.type !== 'MemberExpression') return false
  const [first, second] = node.arguments
  if (!isStringNode(first)) return false
  if (SELECTOR_ONLY_ACTIONS.includes(name)) return true
  return SELECTOR_AND_VALUE_ACTIONS.includes(name) && second !== undefined && second.type !== 'ObjectExpression'
}

// 数値か、数値の四則の式(5 * 1000 など)
const isNumericConstant = (node: AstNode): boolean =>
  (node.type === 'Literal' && typeof node.value === 'number') ||
  (node.type === 'BinaryExpression' && isNumericConstant(node.left) && isNumericConstant(node.right)) ||
  (node.type === 'UnaryExpression' && isNumericConstant(node.argument))

/**
 * E2E のテストのコードの書き方の規則。テストのディレクトリの下を、層(screens、widgets、selectors、specs)ごとに確認する。
 * 層、待ち方、要素の指し方の考え方は、パッケージ e2e の Design Doc にある。利用者のリポジトリに固有の値は options で受け取る。
 * 規則は、ESLint の cwd から見たテストのディレクトリの下だけを見る。ほかの場所のファイルでは何も報告しない。
 */
export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'E2E のテストのセレクタ、待ち、確認の置き場と、層の依存の向きを守らせる',
      url: 'https://github.com/Fukuemon/agent-harness/blob/main/packages/e2e/DesignDoc.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          testsDir: { type: 'string' },
          fixedWaitAllowedFiles: { type: 'array', items: { type: 'string' } },
          timeoutDefinitionFile: { type: 'string' },
          screenIdPattern: { type: 'string' },
          widgetGotoAllowedUrl: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
    messages: { 'e2e-authoring-rule': '{{ message }}' },
  },
  create(context) {
    const options: E2eAuthoringRuleOptions = context.options[0] ?? {}
    // ./tests や絶対パスで渡されても、ESLint の cwd からの相対パスにそろえて比べる
    const fromCwd = (p: string) =>
      path.relative(context.cwd, path.resolve(context.cwd, p)).split(path.sep).join('/')
    const testsRoot = fromCwd(options.testsDir ?? 'tests')
    const root = testsRoot === '' ? '' : `${testsRoot}/`
    const fixedWaitAllowedFiles = (options.fixedWaitAllowedFiles ?? []).map(fromCwd)
    const timeoutDefinitionFile = options.timeoutDefinitionFile
    const timeoutDefinitionPath = timeoutDefinitionFile && fromCwd(timeoutDefinitionFile)
    const widgetGotoAllowedUrl = options.widgetGotoAllowedUrl ?? '/'
    const screenId = options.screenIdPattern ? new RegExp(options.screenIdPattern, 'i') : undefined
    const filePath = fromCwd(context.filename)
    if (root.startsWith('../') || filePath.startsWith('../') || !filePath.startsWith(root)) return {}

    const specs = `${root}specs/`
    const isUnder = (dir: string) => filePath.startsWith(`${root}${dir}/`)
    const isScreenOrWidget = isUnder('screens') || isUnder('widgets')
    // specs/<dir>/ の <dir>。要求や機能ごとのまとまり。specs/ の外か直下なら undefined
    const specDirOf = (p: string) => (p.startsWith(specs) ? p.slice(specs.length).match(/^([^/]+)\//)?.[1] : undefined)
    const inExternalDomDir = isUnder('selectors')
    const isValueFile = !isSpec(filePath) && specDirOf(filePath) !== undefined

    // import してよいのは、同じ specs/<dir>/ の値のファイルだけ。spec と、specs/ を指すパッケージ名の import は止める
    const importsOtherSpecs = (source: string) => {
      if (!source.startsWith('.')) return /(^|\/)specs\//.test(source)
      // 末尾の / を足し、ディレクトリそのもの(`.`)も、その中のファイルと同じに判定する
      const target = `${path.posix.join(path.posix.dirname(filePath), source)}/`
      if (!target.startsWith(specs)) return false
      const dir = specDirOf(target)
      return dir === undefined || dir !== specDirOf(filePath) || /\.e2e(\.ts)?\/$/.test(target)
    }

    const report = (node: AstNode, message: string) =>
      context.report({ node: node as Rule.Node, messageId: 'e2e-authoring-rule', data: { message } })

    const checkModuleSource = (node: AstNode) => {
      const source = node.source?.type === 'Literal' ? String(node.source.value) : ''
      if (importsOtherSpecs(source)) {
        report(
          node,
          'spec を import しない。specs/<dir>/ から import できるのは、同じ specs/<dir>/ の値のファイルだけ。共有する操作は screens/ か widgets/ に出す',
        )
      }
      const typeOnly =
        node.importKind === 'type' ||
        node.exportKind === 'type' ||
        (node.type !== 'ExportAllDeclaration' &&
          (node.specifiers ?? []).every(
            (x: AstNode) => x.importKind === 'type' || x.exportKind === 'type',
          ))
      if (node.type !== 'ImportExpression' && isValueFile && source === '@playwright/test' && !typeOnly) {
        report(
          node,
          'specs/<dir>/ の spec 以外のファイルでは、@playwright/test から型だけを import と export する。test と expect は spec に書く',
        )
      }
    }

    const checkScreenId = (node: AstNode, text: string) => {
      if (screenId && isUnder('widgets') && screenId.test(text))
        report(node, 'widgets/ に画面 ID を書かない。testid の接頭辞は引数で受ける')
    }

    const checkOperatingFunction = (node: AstNode) => {
      if (!isValueFile) return
      const operates = node.params.some((param: AstNode) => {
        const p = param.type === 'AssignmentPattern' ? param.left : param
        if (p.typeAnnotation) return OPERATION_TYPE.test(context.sourceCode.getText(p.typeAnnotation))
        if (p.type === 'Identifier') return p.name === 'page'
        return p.type === 'ObjectPattern' && p.properties.some((x: AstNode) => x.key?.name === 'page')
      })
      if (operates)
        report(
          node,
          'specs/<dir>/ の spec 以外のファイルには、値だけを置く。画面の操作は screens/ か widgets/ に出す',
        )
    }

    const listeners: Record<string, (node: AstNode) => void> = {
      ImportDeclaration: checkModuleSource,
      ExportAllDeclaration: checkModuleSource,
      'ExportNamedDeclaration[source]': checkModuleSource,
      ImportExpression: checkModuleSource,

      'Program:exit'(node) {
        if (filePath.startsWith(specs) && !isSpec(filePath) && specDirOf(filePath) === undefined) {
          report(
            node,
            'specs/ の直下に spec 以外のファイルを置かない。その dir の spec が共有する値は specs/<dir>/ に置く',
          )
        }
      },

      CallExpression(node) {
        const name = calleeName(node)
        if (isUnder('widgets') && name === 'goto') {
          const target = node.arguments[0]
          if (!(target?.type === 'Literal' && target.value === widgetGotoAllowedUrl)) {
            report(
              node,
              `widgets/ で画面へ goto しない。開けるのは '${widgetGotoAllowedUrl}' だけ。画面を開く手順は screens/ か spec に置く`,
            )
          }
        } else if (isFixedWait(node, name) && !fixedWaitAllowedFiles.includes(filePath)) {
          report(node, `${name} で固定時間を待たない。何が終わったかを条件にして待つ`)
        } else if (name === 'expect' && isScreenOrWidget) {
          report(node, 'screens/ と widgets/ で expect を書かない。結果の確認は spec か setup に置く')
        } else if (name === 'route' && isScreenOrWidget) {
          report(node, 'screens/ と widgets/ で route を張らない')
        } else if ([...CSS_LOCATORS, ...TEXT_LOCATORS].includes(name) && !inExternalDomDir) {
          report(
            node,
            `${name} で要素を拾わない。data-testid で拾う(testid の無い要素は selectors/ にまとめる)`,
          )
        } else if (passesSelector(node, name) && !inExternalDomDir) {
          report(
            node,
            `${name} にセレクタの文字列を渡さない。data-testid で拾った locator を操作する(testid の無い要素は selectors/ にまとめる)`,
          )
        } else if (
          VALUE_READERS.includes(name) ||
          (isSpec(filePath) && SPEC_ONLY_VALUE_READERS.includes(name))
        ) {
          report(node, `${name} で値を読んでから比べない。locator をそのまま expect に渡して待たせる`)
        }
      },

      Literal(node) {
        if (typeof node.value !== 'string') return
        if (node.value === 'networkidle') {
          report(
            node,
            'networkidle に頼らない。読み込みを続ける画面では届かない。API のレスポンスか、要素が出るのを待つ',
          )
        }
        checkScreenId(node, node.value)
      },

      TemplateElement(node) {
        if (node.value.raw === 'networkidle' && node.parent?.quasis?.length === 1) {
          report(
            node,
            'networkidle に頼らない。読み込みを続ける画面では届かない。API のレスポンスか、要素が出るのを待つ',
          )
        }
        checkScreenId(node, node.value.raw)
      },

      FunctionDeclaration: checkOperatingFunction,
      FunctionExpression: checkOperatingFunction,
      ArrowFunctionExpression: checkOperatingFunction,

      Property(node) {
        const keyName =
          node.key.type === 'Identifier'
            ? node.key.name
            : node.key.type === 'Literal'
              ? String(node.key.value)
              : ''
        if (keyName !== 'timeout') return
        if (
          isSpec(filePath) &&
          node.parent?.type === 'ObjectExpression' &&
          node.parent.parent?.type === 'CallExpression'
        ) {
          report(node, 'spec に timeout を書かない。待ち時間は Playwright の設定にまとめる')
        } else if (
          timeoutDefinitionPath &&
          isNumericConstant(node.value) &&
          filePath !== timeoutDefinitionPath
        ) {
          report(node, `待つ時間は直書きせず、${timeoutDefinitionFile} の名前で渡す`)
        }
      },
    }
    return listeners as Rule.RuleListener
  },
}
