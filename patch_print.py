import os
import re

# 1. Patch CSS
filepath_css = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath_css, 'r', encoding='utf-8') as f:
    css_content = f.read()

# 縦向き固定を削除
css_content = css_content.replace('size: A4 portrait;', '')

# 無効な @page 記述を削除
css_content = re.sub(r'body\.mode-cooking\s*@page\s*{[^}]*}', '', css_content)

with open(filepath_css, 'w', encoding='utf-8') as f:
    f.write(css_content)

# 2. Patch JS
filepath_js = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
with open(filepath_js, 'r', encoding='utf-8') as f:
    js_content = f.read()

# js内にダイナミック印刷スタイルの関数を追加
dynamic_style_code = '''
    // 動的に印刷向きを変更
    let printStyle = document.getElementById('dynamicPrintStyle');
    if (!printStyle) {
      printStyle = document.createElement('style');
      printStyle.id = 'dynamicPrintStyle';
      document.head.appendChild(printStyle);
    }
'''

old_cooking_js = "outputArea.style.width = '297mm';"
new_cooking_js = "outputArea.style.width = '297mm';\n      if(printStyle) printStyle.innerHTML = '@page { size: landscape; }';"

old_bread_js = "outputArea.style.width = '';"
new_bread_js = "outputArea.style.width = '';\n      if(printStyle) printStyle.innerHTML = '@page { size: portrait; }';"

if 'document.querySelectorAll(\'.mode-btn\').forEach(btn => btn.classList.remove(\'active\'));' in js_content and 'dynamicPrintStyle' not in js_content:
    js_content = js_content.replace('document.querySelectorAll(\'.mode-btn\').forEach(btn => btn.classList.remove(\'active\'));', 'document.querySelectorAll(\'.mode-btn\').forEach(btn => btn.classList.remove(\'active\'));' + dynamic_style_code)

if old_cooking_js in js_content and '@page { size: landscape; }' not in js_content:
    js_content = js_content.replace(old_cooking_js, new_cooking_js)

if old_bread_js in js_content and '@page { size: portrait; }' not in js_content:
    js_content = js_content.replace(old_bread_js, new_bread_js)

with open(filepath_js, 'w', encoding='utf-8') as f:
    f.write(js_content)

# 3. HTML cache buster update
filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = re.sub(r'href=\"css/style\.css\?v=\d+\"', 'href=\"css/style.css?v=1000\"', html_content)

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html_content)
