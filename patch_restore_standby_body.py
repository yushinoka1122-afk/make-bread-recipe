import re

filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html = f.read()

standby_html = '''
        <!-- === スタンバイセクション (パンモード裏方用) === -->
        <div id="standbySectionWrapper" style="display:none;">
          <div id="standbyContainer"></div>
        </div>
'''

if 'id="standbyContainer"' not in html:
    html = html.replace('</body>', standby_html + '\n</body>')

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html)
