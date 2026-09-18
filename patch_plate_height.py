import os
import re

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath, 'r', encoding='utf-8') as f:
    css = f.read()

new_css = '''
/* プレート欄が絶対に縦に伸びないように固定 */
body.mode-cooking .serving-wrapper {
  flex: 0 0 auto !important; /* 縦に伸びるのを禁止 */
  height: auto !important;
}
body.mode-cooking #servingMethodSection {
  flex: 0 0 auto !important;
  height: auto !important;
}
body.mode-cooking #servingMethodSection textarea {
  min-height: 40px !important;
  height: 40px !important;
  max-height: 40px !important; /* これ以上絶対に伸びないように */
  flex: 0 0 auto !important;
}
'''
with open(filepath, 'a', encoding='utf-8') as f:
    f.write('\n' + new_css)

filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = re.sub(r'href="css/style\.css\?v=\d+"', 'href="css/style.css?v=2004"', html_content)
with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html_content)
