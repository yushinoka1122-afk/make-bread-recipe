import os
import re

filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html = f.read()

# スタンバイセクションが消えているので復活させる
standby_html = '''
        <!-- === スタンバイセクション (パンモード用) === -->
        <div id="standbySectionWrapper">
          <div class="section-title" style="margin-top:20px;">
            <h2 style="color:#0056b3; margin:0; font-size:1.1rem;">■ スタンバイ</h2>
          </div>
          <div id="standbyContainer"></div>
        </div>
'''

# outStepsFull の後あたりに挿入する
if 'id="standbyContainer"' not in html:
    html = html.replace('<div id="outStepsFull" class="steps-full"></div>', '<div id="outStepsFull" class="steps-full"></div>\n' + standby_html)

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html)

filepath_css = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath_css, 'r', encoding='utf-8') as f:
    css = f.read()

new_css = '''
/* 料理モードでは旧スタンバイ枠を完全に非表示にする */
body.mode-cooking #standbySectionWrapper,
body.mode-cooking #standbyContainer {
  display: none !important;
}
'''
if 'body.mode-cooking #standbySectionWrapper' not in css:
    with open(filepath_css, 'a', encoding='utf-8') as f:
        f.write('\n' + new_css)
