import os
import re

filepath_css = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath_css, 'r', encoding='utf-8') as f:
    css_content = f.read()

# Remove old text area height override
css_content = re.sub(r'body\.mode-cooking\s*#servingMethodSection\s*textarea\s*{[^}]*}', '', css_content)

new_css = '''
/* プレート欄の泣き別れ修正とコンパクト化 */
body.mode-cooking .serving-wrapper {
  display: flex !important;
  flex-direction: column !important;
  gap: 5px !important;
  width: 100% !important;
  border: 2px solid #cbd5e1 !important;
  background: #f8fafc !important;
  padding: 8px !important;
  border-radius: 4px !important;
}
body.mode-cooking #servingMethodSection {
  border: none !important; 
  background: transparent !important;
  padding: 0 !important;
  width: 100% !important;
}
body.mode-cooking #servingMethodSection textarea {
  min-height: 40px !important; /* コンパクトに */
  height: 40px !important;
  resize: vertical;
}
'''

with open(filepath_css, 'a', encoding='utf-8') as f:
    f.write('\n' + new_css)

filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = re.sub(r'href="css/style\.css\?v=\d+"', 'href="css/style.css?v=2002"', html_content)

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html_content)
