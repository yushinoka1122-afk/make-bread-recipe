import os
import re

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

original_standby = '''
          <!-- === スタンバイセクション === -->
          <div class="steps-right-bottom">
            <div class="section-title" style="margin-top:20px;">
              <h2 style="color:#0056b3; margin:0; font-size:1.1rem;">■ スタンバイ</h2>
            </div>
            <div id="standbyContainer">
              <!-- スタンバイブロック -->
            </div>
          </div>
'''

if 'id="standbyContainer"' not in html:
    # outStepsRight の閉じタグのすぐ後に入れるのが元の構造に近い
    # 見つからなければ outStepsFull の直前
    html = html.replace('<div id="outStepsFull"', original_standby + '\n    <div id="outStepsFull"')

    # それでもダメなら</body>の直前
    if 'id="standbyContainer"' not in html:
        html = html.replace('</body>', original_standby + '\n</body>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
