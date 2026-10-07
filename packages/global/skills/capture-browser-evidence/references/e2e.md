# e2e で証跡を撮る

e2e（TesterArmy）は、Playwright の上に AI のステップを足したテストのフレームワークである。仕様は `https://e2e.tester.army/docs/llms.txt` から辿る。

## 入れる場所

対象のリポジトリの依存に足さない。作業の出力の置き場に `package.json` を置き、そこへ入れる。

```bash
npm i -D e2e @e2e-dev/web ai @ai-sdk/openai
npx @e2e-dev/web install chromium
npx e2e login openai       # AI のステップを使うときだけ。Claude のサブスクリプションには対応していない
```

## 設定

```ts
// e2e.config.ts
import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { chatgpt } from 'e2e/oauth/chatgpt';

export default {
  agents: {
    default: {
      model: chatgpt('<npx e2e models openai が出す id>'),
      providerOptions: { openai: { reasoningEffort: 'medium' } },
    },
  },
  targets: [{
    engine: web({ viewport: { width: 1920, height: 1200 }, locale: 'ja-JP' }),
    app: { url: 'http://localhost:<port>' },
  }],
  workers: 1,
  video: 'on',
  trace: 'on',
} satisfies E2EConfig;
```

- effort は `providerOptions` で明示する。指定しないとモデルの既定になり、証跡に書く値を `npx e2e models` で調べ直すことになる。
- `locale` を指定しないとブラウザは英語になり、Google Maps のような外部のライブラリが描くボタンの名前が変わる。`getByRole` の名前が合わなくなる。
- `app.url` にハッシュ（`#/…`）を書けない。ハッシュでルーティングするアプリは、テストの中で `app.open('/#/…')` で開く。

## テストの書き方

観点の操作と判定は、確定した操作で書く。

- 操作は `screen` の locator、判定は `expect`。
- 捕捉の層に遮られる要素は、`browser.evaluate` で DOM から座標を取り、`browser.mouse` の `move`、`down`、`up` で押す。
- 録画にはポインタが映らない。`browser.mouse` で操作する観点は、ポインタの位置と押下を描く要素をページに足す。どこで押して離したかが、動画から読めなくなる。
- `agent.act` は、観点の前提を作るだけの手順にだけ使う。直後に、前提ができたことを `expect` で確かめる。
- 観点の操作を `agent.act` に任せない。似た名前のボタンを押し間違えても成功を返し、押した位置が外れても「何も起きない」の判定が通る。その操作はキャッシュされ、次からも同じ誤りを再生する。
- エージェントの座標の操作（`tap_at`）は、点の位置に画面のツリーの要素があると、その要素への操作に置き換える。捕捉の層の下にある要素の位置を押す観点は、エージェントには行えない。モデルを替えても変わらない。
- エージェントが見るスクリーンショットは、長辺が 768 px に縮められる。1920x1200 では 2.5 分の 1 になり、小さなアイコンを見分けにくい。
- `agent.assert` は毎回モデルを呼び、判定が回ごとに揺れうる。使うなら `expect` と組にし、`agent.assert` だけで合否を決めない。

テストの名前は、観点の名前と揃える。撮った動画のファイル名と、添付するコメントの表の行に使う。

## 撮る

```bash
npx e2e run tests/<spec>.e2e.ts --reporter list,markdown
```

- 動画は `.e2e/artifacts/<target>/<テストごとのディレクトリ>/default/attempt-0/video/video.webm` に出る。次の実行で `.e2e/artifacts/` は空になる。撮るたびに、置き場所の `webm/` へ名前を付けて写す。
- 動画の長さは実時間と合う。待ちを入れれば、動画でも間になる。
- AI のステップを使ったときは、実行の最後の `AI <トークン> · <呼び出し回数> · <モデル>` の行と所要時間を、証跡に写す。`report.json` では、`kind: "model"` の記録に呼び出しごとのトークンが残る。
- `report.json` の `steps` に、操作と判定の記録が残る。証跡の README とスレッドには、テストのコードと出力を貼る。

## trace

`trace.zip` には、リクエストの URL がそのまま残る。API キーをクエリ文字列に載せるアプリでは、キーが入る。issue と pull request に添付しない。
