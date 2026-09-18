import os

filepath_js = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
with open(filepath_js, 'r', encoding='utf-8') as f:
    js = f.read()

# loadRecipeFromDB内の印刷スタイル設定を修正
old_cooking_restore = '''      if (currentMode === 'cooking') {
        body.classList.add('mode-cooking');'''

new_cooking_restore = '''      if (currentMode === 'cooking') {
        if (printStyle) printStyle.innerHTML = "@page { size: A4 landscape; margin: 5mm; }";
        body.classList.add('mode-cooking');'''

old_bread_restore = '''      } else {
        body.classList.remove('mode-cooking');'''

new_bread_restore = '''      } else {
        if (printStyle) printStyle.innerHTML = "@page { size: A4 portrait; margin: 5mm; }";
        body.classList.remove('mode-cooking');'''

old_bread_restore_fallback = '''       body.classList.remove('mode-cooking');
       if (badge) { badge.innerText = 'パンモード'; badge.style.backgroundColor = '#f59e0b'; }'''

new_bread_restore_fallback = '''       if (printStyle) printStyle.innerHTML = "@page { size: A4 portrait; margin: 5mm; }";
       body.classList.remove('mode-cooking');
       if (badge) { badge.innerText = 'パンモード'; badge.style.backgroundColor = '#f59e0b'; }'''

js = js.replace(old_cooking_restore, new_cooking_restore)
js = js.replace(old_bread_restore, new_bread_restore)
js = js.replace(old_bread_restore_fallback, new_bread_restore_fallback)

with open(filepath_js, 'w', encoding='utf-8') as f:
    f.write(js)
