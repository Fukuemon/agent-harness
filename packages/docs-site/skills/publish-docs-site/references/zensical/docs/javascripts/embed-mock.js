/**
 * 文書のページに埋め込んだモック（iframe.mock）の高さを、モックが postMessage で送る中身の高さに合わせる。
 * モックは { source: 'screen-mock', type: 'resize', height } を親のページへ送る。
 * 文書のサイトのページごとに読み込む。モックの HTML では読まない。
 */
;(() => {
  /** モックが送るメッセージの source。モックの側の値と同じにする */
  const MESSAGE_SOURCE = 'screen-mock'

  window.addEventListener('message', (event) => {
    const data = event.data
    if (data?.source !== MESSAGE_SOURCE || data.type !== 'resize') return
    for (const frame of document.querySelectorAll('iframe.mock')) {
      if (frame.contentWindow !== event.source) continue
      // style.height は枠線を含むため、枠線の分を足す
      const border = frame.offsetHeight - frame.clientHeight
      frame.style.height = `${Number(data.height) + border}px`
    }
  })
})()
