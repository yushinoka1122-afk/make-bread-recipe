import os

filepath_css = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath_css, 'r', encoding='utf-8') as f:
    css = f.read()

new_css = '''
/* ヘッダー全体が確実に最前面に来るようにする（メニュー区分のプルダウン埋没防止） */
body.mode-cooking .preview-header,
.preview-header {
  position: relative !important;
  z-index: 100 !important;
}
.preview-left {
  position: relative !important;
  z-index: 100 !important;
}
.category-title-row {
  position: relative !important;
  z-index: 100 !important;
}
'''
with open(filepath_css, 'a', encoding='utf-8') as f:
    f.write('\n' + new_css)

# Cache bump
filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html = f.read()
import re
html = re.sub(r'href="css/style\.css\?v=\d+"', 'href="css/style.css?v=2015"', html)
with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html)
