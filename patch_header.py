import os

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# h1 タグの置き換え
old_header = '<h1>🍞 パン手順書作成ツール</h1>'
new_header = '''<div style="display: flex; align-items: center; gap: 12px;">
      <button id="hamburgerMenuBtn" onclick="toggleSidebar()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #1e293b; padding: 0;">≡</button>
      <h1 style="margin: 0;">🍞 手順書作成ツール <span id="modeBadge" style="font-size: 0.8rem; background-color: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; margin-left: 8px; vertical-align: middle;">パンモード</span></h1>
    </div>'''

if old_header in content:
    content = content.replace(old_header, new_header)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Header fixed!')
