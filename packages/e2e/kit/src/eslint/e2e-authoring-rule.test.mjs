import path from 'node:path'
import { after, describe, it } from 'node:test'
import tsParser from '@typescript-eslint/parser'
import { RuleTester } from 'eslint'
import { rule } from './e2e-authoring-rule.ts'

RuleTester.afterAll = after
RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: { parser: tsParser, ecmaVersion: 2022, sourceType: 'module' },
})
const at = (file, code, options) => ({
  code,
  filename: path.join(process.cwd(), file),
  ...(options ? { options: [options] } : {}),
})
const invalid = (file, code, options) => ({
  ...at(file, code, options),
  errors: [{ messageId: 'e2e-authoring-rule' }],
})

tester.run('e2e-authoring-rule', rule, {
  valid: [
    at('tests/specs/12/a.e2e.ts', "import { DIFF } from './differences';"),
    at('tests/specs/12/sub/a.e2e.ts', "import { DIFF } from '../differences';"),
    at('tests/specs/12/a.e2e.ts', "import { DIFF } from '.';"),
    at('tests/specs/12/differences.ts', "export const DIFF = '差';"),
    at('tests/specs/12/differences.ts', 'export type Diff = { text: string };'),
    at(
      'tests/specs/12/differences.ts',
      "import type { Page } from '@playwright/test';\nexport type Op = (page: Page) => Promise<void>;",
    ),
    at('tests/specs/12/differences.ts', 'export const next = (page: number) => page + 1;'),
    at('tests/specs/a.e2e.ts', "await page.getByTestId('list').click();"),
    at('tests/selectors/a.ts', "export const row = (page) => page.getByRole('row');"),
    at('tests/widgets/w.ts', "await page.goto('/');"),
    at('tests/fixtures/human.ts', 'await page.waitForTimeout(1000);', {
      fixedWaitAllowedFiles: ['tests/fixtures/human.ts'],
    }),
    at('tests/fixtures/timeouts.ts', 'export const T = { timeout: 5000 };', {
      timeoutDefinitionFile: 'tests/fixtures/timeouts.ts',
    }),
    at('tests/widgets/w.ts', "const id = 'orders-list';"),
    at('src/a.ts', 'await page.waitForTimeout(1000);'),
    at('e2e/specs/a.e2e.ts', "await page.getByTestId('x').click();", { testsDir: 'e2e' }),
    at('tests/specs/a.e2e.ts', 'test.setTimeout(60_000);'),
    at('tests/specs/a.e2e.ts', "await row.press('Enter');"),
    at('tests/specs/a.e2e.ts', "await row.fill('値');"),
    at('tests/specs/a.e2e.ts', "await row.dispatchEvent('click', { bubbles: true });"),
    at('tests/selectors/a.ts', "export const open = (page) => page.click('#menu');"),
    at('tests/specs/12/ops.ts', "export type { Page } from '@playwright/test';"),
    at('tests/specs/a.e2e.ts', 'const s = `networkidle-${n}`;'),
    at('tests/fixtures/timeouts.ts', 'export const T = { timeout: 5 * 1000 };', {
      timeoutDefinitionFile: './tests/fixtures/timeouts.ts',
    }),
    at('tests/fixtures/human.ts', 'await page.waitForTimeout(1000);', {
      fixedWaitAllowedFiles: ['./tests/fixtures/human.ts'],
    }),
  ],
  invalid: [
    invalid('tests/specs/12/a.e2e.ts', "import { DIFF } from '../13/differences';"),
    invalid('tests/specs/12/a.e2e.ts', "import { x } from './b.e2e';"),
    invalid('tests/screens/x.ts', "import { DIFF } from '../specs/12/differences';"),
    invalid('tests/specs/differences.ts', "export const DIFF = '差';"),
    invalid('tests/screens/x.ts', "export * from '../specs/12/differences';"),
    invalid('tests/screens/x.ts', "export { DIFF } from '../specs/12/differences';"),
    invalid('tests/screens/x.ts', "export const load = () => import('../specs/12/differences');"),
    invalid('tests/specs/12/ops.ts', 'export const open = async (page) => page;'),
    invalid('tests/specs/12/ops.ts', 'export const open = async ({ page }) => page;'),
    invalid('tests/specs/12/ops.ts', 'export const open = async (p: pw.Page) => p;'),
    invalid('tests/specs/12/ops.ts', 'export const open = async (p: Page | undefined) => p;'),
    invalid('tests/specs/12/ops.ts', 'export const open = async (page = x) => page;'),
    invalid(
      'tests/specs/12/ops.ts',
      "import { test } from '@playwright/test';\ntest.beforeEach(() => {});",
    ),
    invalid('tests/specs/a.e2e.ts', 'await page.waitForTimeout(1000);'),
    invalid('tests/screens/s.ts', 'expect(page).toBeTruthy();'),
    invalid('tests/widgets/w.ts', 'expect.soft(page).toBeTruthy();'),
    invalid('tests/screens/s.ts', "await page.route('**', () => {});"),
    invalid('tests/specs/a.e2e.ts', "await page.locator('.row').click();"),
    invalid('tests/specs/a.e2e.ts', "await page.getByRole('button').click();"),
    invalid('tests/specs/a.e2e.ts', 'const t = await row.textContent();'),
    invalid('tests/specs/a.e2e.ts', "const v = await row.getAttribute('aria-pressed');"),
    invalid('tests/specs/a.e2e.ts', "await page.waitForLoadState('networkidle');"),
    invalid('tests/widgets/w.ts', "await page.goto('/orders');"),
    invalid('tests/widgets/w.ts', "const id = 'orders-list';", { screenIdPattern: '\\borders-list\\b' }),
    invalid('tests/widgets/w.ts', 'const id = `orders-list-${n}`;', {
      screenIdPattern: '\\borders-list\\b',
    }),
    invalid('tests/specs/a.e2e.ts', "await expect(row).toBeVisible({ timeout: 5000 });"),
    invalid('tests/screens/s.ts', 'const w = { timeout: 5000 };', {
      timeoutDefinitionFile: 'tests/fixtures/timeouts.ts',
    }),
    invalid('e2e/specs/a.e2e.ts', "await page.locator('.row').click();", { testsDir: 'e2e' }),
    invalid('tests/specs/a.e2e.ts', "await page.locator('.row').click();", { testsDir: './tests' }),
    invalid('tests/specs/a.e2e.ts', "await page.locator('.row').click();", { testsDir: 'tests/' }),
    invalid('tests/specs/a.e2e.ts', "await page.locator('.row').click();", {
      testsDir: path.join(process.cwd(), 'tests'),
    }),
    invalid('tests/fixtures/x.ts', 'const t = { timeout: 5000 };', {
      timeoutDefinitionFile: './tests/fixtures/timeouts.ts',
    }),
    invalid('tests/specs/a.e2e.ts', 'setTimeout(done, 100);'),
    invalid('tests/specs/a.e2e.ts', 'window.setTimeout(done, 100);'),
    invalid('tests/specs/a.e2e.ts', "const el = await page.$('#x');"),
    invalid('tests/specs/a.e2e.ts', "const n = await page.$$eval('li', (x) => x.length);"),
    invalid('tests/specs/a.e2e.ts', "await page.click('#x');"),
    invalid('tests/specs/a.e2e.ts', "await page.fill('#name', '値');"),
    invalid('tests/specs/12/ops.ts', "export { test } from '@playwright/test';"),
    invalid('tests/specs/12/ops.ts', "export * from '@playwright/test';"),
    invalid('tests/specs/a.e2e.ts', 'await page.waitForLoadState(`networkidle`);'),
    invalid('tests/screens/s.ts', 'const w = { timeout: 5 * 1000 };', {
      timeoutDefinitionFile: 'tests/fixtures/timeouts.ts',
    }),
  ],
})
