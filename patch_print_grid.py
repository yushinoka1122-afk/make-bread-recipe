import os
import re

# --- 1. CSS Patch ---
filepath_css = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath_css, 'r', encoding='utf-8') as f:
    css_content = f.read()

new_css = '''
/* -----------------------------------------
   印刷時レイアウトの完全崩壊防止パッチ
----------------------------------------- */
@media print {
  /* 古い設定が #outputArea を4列グリッドにしてしまうのを強制解除し、正しく左右に分割 */
  body.mode-cooking #outputArea {
    display: flex !important;
    flex-direction: row !important;
    width: 297mm !important;
  }
  
  /* 左カラム（食材など）の幅を適切に */
  body.mode-cooking .cooking-left-col {
    flex: 0 0 32% !important;
    min-width: 0 !important;
  }
  
  /* 右カラム（手順）に残りの幅をすべて使わせる */
  body.mode-cooking .cooking-right-col {
    flex: 1 !important;
    min-width: 0 !important;
    width: 100% !important;
  }
  
  /* 手順ブロック内の写真の高さも調整（潰れ防止） */
  body.mode-cooking .step-img-out {
    height: 120px !important;
  }
  body.mode-cooking .step-block {
    min-height: 200px !important;
  }
}
'''
with open(filepath_css, 'a', encoding='utf-8') as f:
    f.write('\n' + new_css)

# --- 2. HTML cache buster update ---
filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = re.sub(r'href="css/style\.css\?v=\d+"', 'href="css/style.css?v=2006"', html_content)

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html_content)
