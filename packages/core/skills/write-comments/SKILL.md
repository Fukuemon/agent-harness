---
name: write-comments
description: コード、スクリプト、設定ファイルを書くとき、直すとき、レビューするときに使う。文書コメントを書く対象と内容、実装のコメントを残す基準、lint や型のチェックの抑制の扱いを定める。
---

# write-comments

コメントは 2 種類に分ける。呼び出す側が読む文書コメントと、本体の中の実装のコメントである。  
文書コメントは、公開する識別子に書く。実装のコメントは、残してよい 3 つに限る。

## 文書コメント

公開する識別子には、言語の文書コメントの記法で書く。export する関数と型、public なメンバー、大文字で始まる名前が当たる。  
記法は、godoc、JSDoc と TSDoc、docstring、rustdoc、KDoc と Javadoc である。単体で配置されるスクリプトでは、先頭に書く使い方と終了コードが文書コメントに当たる。

書くことは次の 3 つ。

- 要約の 1 文。名前で始めるか、命令形で書く。
- 契約。何を返すか、副作用、失敗する条件（返すエラー、例外、panic）、呼び出しの前提と後始末。
- 名前と型から読み取れない引数の意味。

書かないことは次の 3 つ。

- 名前の言い換え。名前を文にしただけのコメントは、情報を足さない。
- 型で分かる `@param` と `@returns`。型に加える情報があるときだけ書く。
- 実装の詳細。アルゴリズムは、本体の中の実装のコメントに書く。

有無は lint が確かめる。有効にする lint は、context の「コードと文書の規約」に書く。言語ごとの lint は次のとおり。

- Go は revive の exported。Python は pylint の missing-function-docstring。
- TypeScript は eslint-plugin-jsdoc の require-jsdoc。Rust は rustc の missing_docs。Java は Checkstyle の MissingJavadocMethod。

- 出典: [Go Doc Comments](https://go.dev/doc/comment)
- 出典: [PEP 257](https://peps.python.org/pep-0257/)
- 出典: [Google TypeScript Style Guide の Comments and documentation](https://google.github.io/styleguide/tsguide.html#comments-documentation)
- 出典: [How to write documentation（rustdoc）](https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html)
- 出典: [How to Write Doc Comments for the Javadoc Tool](https://www.oracle.com/technical-resources/articles/java/javadoc-tool.html)

## 実装のコメント

- コードを言い換えるだけのコメントを書かない。
- 理由は、コメントではなく仕組みの側で表す。名前、型、設定の項目、エラーの文、テストが使える。
- 自分たちのコードの分かりにくさは、コメントで補わない。名前を変える、関数を分ける、型で表す、のいずれかで直す。
- 「消すな」「重要」と書かれたコメントを見つけたら、その制約を型、テスト、自動チェックで表せないかを先に考える。
- コメントで指すものは、スキル、ファイル、関数の実際の名前で書く。例えや抽象の語で指さない。

残してよい実装のコメントは、次の 3 つだけ。当てはまるか迷うコメントは、消す。

- ライセンスの表記。
- 自分たちでは変えられない外部の制約。依存、プラットフォーム、プロトコルが当たる。issue や仕様へのリンクを添える。
- 意図して選んだ簡略化の限界と、直す条件。1 行で書く。

## チェックの抑制

lint や型のチェックを抑制するコメントを足さない。先に、指摘の原因を直す。  
抑制してよいのは、そのルールが見た目だけを扱う場合と、ルールの側が誤っている場合に限る。
