// 録画にカーソルの位置と押下を描く。対象のリポジトリへ写して使う。
import type { BrowserContext } from '@playwright/test';

/** 録画を見る人へのカーソルの凡例。下の丸の色を変えたら、ここも直す */
export const CURSOR_LEGEND = 'カーソル: 赤い丸はマウスの位置、黄色はボタンを押している間';

/**
 * 録画にマウスのカーソルが映らないので、カーソルの位置に丸を描き、押している間は色を変える。
 * 丸は pointer-events を持たないので、画面の操作には影響しない。
 */
export const showCursorInRecording = async (context: BrowserContext): Promise<void> => {
  await context.addInitScript(() => {
    const install = () => {
      const dot = document.createElement('div');
      dot.id = '__e2e-cursor';
      Object.assign(dot.style, {
        position: 'fixed',
        zIndex: '2147483647',
        width: '18px',
        height: '18px',
        margin: '-9px 0 0 -9px',
        borderRadius: '50%',
        border: '2px solid #fff',
        background: 'rgba(255, 64, 64, 0.6)',
        pointerEvents: 'none',
        left: '-100px',
        top: '-100px',
      });
      document.body.appendChild(dot);
      const opts = { capture: true, passive: true };
      window.addEventListener('mousemove', (e) => Object.assign(dot.style, { left: `${e.clientX}px`, top: `${e.clientY}px` }), opts);
      window.addEventListener('mousedown', () => (dot.style.background = 'rgba(255, 200, 0, 0.9)'), opts);
      window.addEventListener('mouseup', () => (dot.style.background = 'rgba(255, 64, 64, 0.6)'), opts);
    };
    if (document.body) install();
    else document.addEventListener('DOMContentLoaded', install);
  });
};
