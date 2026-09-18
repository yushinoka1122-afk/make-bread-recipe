import os

filepath_js = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
with open(filepath_js, 'r', encoding='utf-8') as f:
    js = f.read()

# 印刷前の値コピー処理を探す
old_print = '''  window.addEventListener('beforeprint', () => {'''
new_print = '''  window.addEventListener('beforeprint', () => {
    // 製造指示伝票の印刷用テキスト反映
    const slipInput = document.getElementById('manufacturingSlip');
    const slipPrint = document.querySelector('.slip-title-print');
    if (slipInput && slipPrint) {
      slipPrint.innerText = slipInput.value;
    }
'''
if 'slipPrint.innerText = slipInput.value' not in js:
    js = js.replace(old_print, new_print)

with open(filepath_js, 'w', encoding='utf-8') as f:
    f.write(js)
