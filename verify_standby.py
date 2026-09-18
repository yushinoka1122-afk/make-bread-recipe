import os

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

if 'id="standbyContainer"' in html:
    print("SUCCESS: standbyContainer 復活成功！")
else:
    print("FAIL: standbyContainer まだ見つかりません...")
