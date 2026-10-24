import type { ESLint } from 'eslint'
import { rule } from './e2e-authoring-rule.ts'

export { rule, type E2eAuthoringRuleOptions } from './e2e-authoring-rule.ts'

/**
 * 規則を 1 つ持つ ESLint のプラグイン。設定の plugins に `e2e: plugin` で入れ、規則は `e2e/e2e-authoring-rule` で有効にする。
 * TypeScript のテストを読むには、languageOptions の parser に @typescript-eslint/parser を渡す。
 */
export const plugin: ESLint.Plugin = {
  meta: { name: '@fukuemon/e2e-kit' },
  rules: { 'e2e-authoring-rule': rule },
}
