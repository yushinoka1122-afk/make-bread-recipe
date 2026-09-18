import os
import re

filepath_css = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath_css, 'r', encoding='utf-8') as f:
    css_content = f.read()

new_css = '''
/* -----------------------------------------
   スタンバイ欄の縮小と余白の極限圧縮パッチ
----------------------------------------- */
/* 手順とスタンバイ間の余白を削除 */
body.mode-cooking .steps-grid,
body.mode-cooking .steps-col {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}
body.mode-cooking #standbySection {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

/* スタンバイブロック自体の縦幅を大幅に圧縮 */
body.mode-cooking .standby-preview-block {
  min-height: 100px !important; /* 通常の手順ブロックよりかなり小さくする */
  height: 120px !important; /* 高さを固定して下にはみ出さないように */
}
body.mode-cooking .s-block-img-out {
  height: 60px !important; /* スタンバイの写真は小さくてOK */
  min-height: 60px !important;
}
body.mode-cooking .standby-textarea {
  min-height: 30px !important;
  height: 30px !important;
}

/* 印刷時の隙間も徹底排除 */
@media print {
  body.mode-cooking #standbySection {
    margin-top: -5px !important; /* 印刷時は少し食い込ませるくらい詰める */
  }
}
'''

with open(filepath_css, 'a', encoding='utf-8') as f:
    f.write('\n' + new_css)


filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = re.sub(r'href="css/style\.css\?v=\d+"', 'href="css/style.css?v=2007"', html_content)

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html_content)
