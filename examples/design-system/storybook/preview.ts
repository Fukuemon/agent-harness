// カタログの preview の例。Storybook 10 の a11y のアドオン（axe）の違反をテストの失敗にし、サイドバーを 5 つのページの順に並べる。
// story をテストとして動かすのは @storybook/addon-vitest。main.ts の addons に '@storybook/addon-a11y' と '@storybook/addon-vitest' を足す。
// 複数の Storybook（コンポーネントのパッケージと画面のアプリ）でカタログを組むときは、parameters の a11y を共有のファイルに置き、確認の基準を 1 つにする。
// storySort は Storybook が preview のファイルから静的に読むので、各 preview に書く。
import type { Preview } from '@storybook/react-vite'

import '../src/tokens/theme.css'

const preview: Preview = {
  parameters: {
    a11y: { test: 'error' },
    options: {
      storySort: {
        // デザインシステムの文書の「カタログのページ」の順
        order: [
          'はじめに',
          ['原則', 'アクセシビリティ'],
          'トークン',
          ['色', '文字', '余白と角丸と影'],
          'コンポーネント',
          'パターン',
          '画面',
        ],
      },
    },
  },
}

export default preview
