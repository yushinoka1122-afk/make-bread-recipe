import os
import re

# --- 1. CSS Patch ---
filepath_css = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath_css, 'r', encoding='utf-8') as f:
    css_content = f.read()

new_css = '''
/* -----------------------------------------
   プレートと手順ブロックのサイズ最終調整
----------------------------------------- */
/* プレート欄の強制固定 */
body.mode-cooking #servingMethodSection,
body.mode-cooking .serving-wrapper {
  flex: 0 0 auto !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: 100px !important; /* どんな事があってもこれ以上伸びないように絶対防御 */
}
body.mode-cooking #servingMethodSection textarea {
  min-height: 40px !important;
  height: 40px !important;
  max-height: 40px !important;
  overflow-y: auto !important;
}

/* 印刷時も手順ブロックが横幅いっぱいに広がるように強制 */
@media print {
  body.mode-cooking .step-block,
  body.mode-cooking .standby-preview-block {
    width: 100% !important;
    max-width: none !important;
  }
  body.mode-cooking .steps-grid,
  body.mode-cooking .steps-col {
    width: 100% !important;
    max-width: none !important;
  }
}
'''
with open(filepath_css, 'a', encoding='utf-8') as f:
    f.write('\n' + new_css)

# --- 2. HTML cache buster update ---
filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = re.sub(r'href="css/style\.css\?v=\d+"', 'href="css/style.css?v=2005"', html_content)

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html_content)
