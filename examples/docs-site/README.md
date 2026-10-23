# 文書のサイトを Cloudflare Workers に公開し、Access で守る手順

パッケージ docs-site の雛形 `references/cloudflare-workers/` を写した利用者のリポジトリで、公開先を用意する手順の例。  
写して使うときは、`docs-site/README.md` に置き、Worker の名前、トークンの名前、開ける人を利用者の値に書き換える。  
手順は 2026-10 の Cloudflare のダッシュボードで確認した。

## 構成

- 文書のサイト、カタログ、図は、1 つの Worker の静的なファイルである。`scripts/build-docs-site.mjs` が `context/project.yml` の `docs_site.parts` のとおりに `docs-site/public/` へ並べる。
- `.github/workflows/docs-site.yml` が、既定のブランチへの push で組み立てて公開し、公開の後に保護を確認する。pull request ごとのプレビューは出さない。
- `docs-site/cloudflare.config.ts` が Worker の名前を、`docs-site/wrangler.config.ts` が静的なファイルの置き場を持つ。
- `cf` は beta なので、バージョンを固定する。上げるときは、`pnpm --filter ./docs-site run build` の後に `deploy:dry-run` が通ることを確認する。`deploy:dry-run` は Cloudflare の認証が要らない。

## 公開先を用意する

1. Cloudflare のアカウントを作り、Zero Trust を有効にする。Free のプランでよい。
2. Workers & Pages で、`cloudflare.config.ts` の名前の Worker を作る。中身は Hello World のままでよい。手順 3 のトークンは Worker を作れないため、先に作る。
3. 「Manage Account → Account API Tokens」で、アカウントのトークンを Custom token で作る。
   - 権限は 1 つだけにする。製品は Workers、範囲は Specified Workers の手順 2 の Worker、役割は Editor。
   - Editor は Worker の中身と設定を書き換えて出せるが、Worker を消せない。ほかの Worker と Access の設定には届かない。
   - 送り元の IP は絞らない。GitHub Actions の runner の IP は決まっていない。
4. GitHub のリポジトリの「Settings → Secrets and variables → Actions」に登録する。
   - Secrets: `CLOUDFLARE_API_TOKEN`（手順 3 のトークン）
   - Variables: `CLOUDFLARE_ACCOUNT_ID`（ダッシュボードの Account ID）
   - Variables: `DOCS_SITE_URL`（Worker の workers.dev の URL）と `DOCS_SITE_MARKER`（トップのページにだけある文字列）
5. Worker の Access のタブで「すべてのトラフィック」を選び、開ける人（メールアドレスかメールのドメイン）を決める。

- アカウント全体の Access（Workers & Pages の概要の「Cloudflare Access」のスイッチ）は使わない。同じアカウントの、公開しているほかの Worker も守られて開けなくなるためである。
- Worker の名前を変えると、新しい Worker が Access なしで出る。名前を変えるときは、先に手順 2、3、5 を新しい名前で行う。
- `DOCS_SITE_MARKER` に、サイトの名前と Worker の名前を使わない。Access の認証の画面にもアプリの名前が出ることがあり、保護されていても確認が失敗する。

## 保護を確認する

認証のない要求でリダイレクトをたどり、Access の認証の画面（`*.cloudflareaccess.com`）に着き、保護した中身を取得できないことを確認する。ワークフローは公開のたびに同じ確認を流す。

```sh
node scripts/check-docs-site-protection.mjs "$DOCS_SITE_URL" "$DOCS_SITE_MARKER" cloudflareaccess.com
```

- 終了コード 0 は保護されている。1 は保護されていない。2 は引数の誤りか、要求が失敗した。
- 1 が出たら、Worker の Access のタブの設定と、Worker の名前が手順 2 と同じかを見る。
