import os
import re

# --- 1. JS Patch for Alternating Steps ---
filepath_js = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
with open(filepath_js, 'r', encoding='utf-8') as f:
    js_content = f.read()

old_reorg = '''
    blocks.forEach((block, index) => {
      if (index < leftCount) {
        outLeft.appendChild(block);
      } else {
        outRight.appendChild(block);
      }
    });
'''

new_reorg = '''
    blocks.forEach((block, index) => {
      if (typeof currentMode !== 'undefined' && currentMode === 'cooking') {
        // 料理モード: 1行目(outLeft)と2行目(outRight)へ交互に振り分け
        if (index % 2 === 0) {
          outLeft.appendChild(block);
        } else {
          outRight.appendChild(block);
        }
      } else {
        // パンモード: 前半を左、後半を右
        if (index < leftCount) {
          outLeft.appendChild(block);
        } else {
          outRight.appendChild(block);
        }
      }
    });
'''
if old_reorg in js_content:
    js_content = js_content.replace(old_reorg, new_reorg)

with open(filepath_js, 'w', encoding='utf-8') as f:
    f.write(js_content)


# --- 2. CSS Patch ---
filepath_css = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath_css, 'r', encoding='utf-8') as f:
    css_content = f.read()

new_css = '''
/* -----------------------------------------
   ユーザーレビュー後のUI微調整 (v3)
----------------------------------------- */
/* 白背景を画面いっぱいに広げる */
body.mode-cooking #editorWrapper {
  width: 100%;
  max-width: none !important;
}
body.mode-cooking #outputArea {
  width: 100% !important;
  max-width: none !important;
  min-height: 100vh !important;
  box-sizing: border-box;
}

/* ヘッダーの重なりとメニュー区分プルダウン修正 */
body.mode-cooking .preview-header {
  flex-wrap: wrap !important;
  z-index: 10;
  position: relative;
}
body.mode-cooking .product-title-row,
body.mode-cooking .category-title-row {
  flex-wrap: wrap !important;
}
body.mode-cooking .product-title-row input,
body.mode-cooking .category-title-row select {
  white-space: normal !important;
}

/* 交互振り分けされた手順ブロックを2行のグリッドとして表示 */
body.mode-cooking .steps-grid {
  display: flex !important;
  flex-direction: column !important;
  gap: 15px !important;
}
body.mode-cooking .steps-col {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 15px !important;
  width: 100% !important;
}

/* 印刷時の設定（2枚目の白紙防止） */
@media print {
  body.mode-cooking #outputArea {
    width: 297mm !important;
    min-height: 0 !important;
    height: auto !important;
    margin: 0 !important;
    padding: 10mm !important;
    box-shadow: none !important;
    border: none !important;
    overflow: hidden;
  }
}
'''
with open(filepath_css, 'a', encoding='utf-8') as f:
    f.write('\n' + new_css)

# --- 3. HTML cache buster ---
filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = re.sub(r'href="css/style\.css\?v=\d+"', 'href="css/style.css?v=2000"', html_content)

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html_content)
