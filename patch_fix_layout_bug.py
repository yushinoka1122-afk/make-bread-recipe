import os
import re

filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html = f.read()

# スタンバイセクションをごっそり削除
html = re.sub(r'<div id="standbyContainer".*?<!-- ===', '<!-- ===', html, flags=re.DOTALL)
html = re.sub(r'<div class="section-title" style="margin-top:20px;">\s*<h2 style="color:#0056b3; margin:0; font-size:1.1rem;">■ スタンバイ</h2>\s*</div>', '', html)
# 念のため、残っている古いスタンバイ関連のHTMLがあれば消す
html = re.sub(r'<div id="standbySection".*?</div>\s*</div>', '', html, flags=re.DOTALL)

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html)

filepath_css = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath_css, 'r', encoding='utf-8') as f:
    css = f.read()

new_css = '''
/* 3行目（9個目以降）の完全なグリッド化（強制） */
body.mode-cooking #outStepsFull,
body.mode-cooking .steps-full {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 15px !important;
  width: 100% !important;
  flex-direction: unset !important;
}
body.mode-cooking #outStepsFull .step-block,
body.mode-cooking .steps-full .step-block {
  width: 100% !important;
  max-width: none !important;
  flex: unset !important;
}
'''
with open(filepath_css, 'a', encoding='utf-8') as f:
    f.write('\n' + new_css)
