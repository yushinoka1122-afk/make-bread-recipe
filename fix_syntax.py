import re

filepath_js = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
with open(filepath_js, 'r', encoding='utf-8') as f:
    js = f.read()

bad_code = '''        } else {
          const outFull = document.getElementById('outStepsFull');
          if (outFull) outFull.appendChild(block);
        }'''

js = js.replace(bad_code, '')

with open(filepath_js, 'w', encoding='utf-8') as f:
    f.write(js)
