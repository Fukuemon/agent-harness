// 待つ時間の名前の雛形。<e2e.dir>/tests/fixtures/timeouts.ts に写す。
// 値は、複数の CI の実行から成功したテストごとの所要時間を集め、最大の所要に振れの倍率を見込んで決め直す。
// 内側から expect < action < navigation < test の順に長くし、どこで落ちたかを失敗の形から見分ける
export const TIMEOUTS = {
  expect: 5_000,
  action: 10_000,
  navigation: 30_000,
  test: 60_000,
  evidence: 180_000,
} as const
