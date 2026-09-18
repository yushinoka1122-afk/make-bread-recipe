import os
import re

filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. 製造指示伝票の追加（商品名称の上の行などに独立して配置）
new_slip_row = '''
      <div class="slip-title-row" style="display:flex; align-items:center; gap:10px; margin-bottom: 5px; border-bottom: 2px solid #1e293b; padding-bottom: 3px;">
        <label style="font-size: 1.1rem; font-weight: bold; white-space: nowrap;">製造指示伝票名称：</label>
        <input type="text" id="manufacturingSlip" placeholder="伝票名称を入力" style="flex: 1; font-size: 1.1rem; font-weight: bold; border: none; background: transparent; padding: 2px;">
        <span class="print-text slip-title-print" style="display:none; font-size: 1.1rem; font-weight: bold;"></span>
      </div>
'''
if 'id="manufacturingSlip"' not in html:
    html = html.replace('<div class="product-title-row">', new_slip_row + '      <div class="product-title-row">')

# 2. スタンバイ欄の削除
html = re.sub(r'<!-- === スタンバイセクション === -->.*?<!-- === 右カラム：手順等 === -->', '<!-- === 右カラム：手順等 === -->', html, flags=re.DOTALL)

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html)
