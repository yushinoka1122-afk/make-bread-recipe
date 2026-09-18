import os
import re

filepath_css = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath_css, 'r', encoding='utf-8') as f:
    css = f.read()

new_css = '''
/* -----------------------------------------
   製造指示伝票 ＆ 3行目レイアウト＆ スタンバイ対応
----------------------------------------- */
/* 3行目用のコンテナ設定 */
#outStepsFull {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap;
  gap: 15px !important;
  width: 100% !important;
  margin-top: 15px !important;
}
#outStepsFull .step-block {
  flex: 0 0 calc(25% - 15px); /* 4列に収める */
}

/* 印刷時の設定 */
@media print {
  .slip-title-row input {
    display: none !important;
  }
  .slip-title-row .slip-title-print {
    display: inline-block !important;
    border-bottom: 1px solid #000;
    min-width: 200px;
    padding: 2px 5px;
  }
  #outStepsFull {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 5px !important;
    margin-top: 5px !important;
  }
  #outStepsFull .step-block {
    flex: none !important;
    width: 100% !important;
  }
}
'''

with open(filepath_css, 'a', encoding='utf-8') as f:
    f.write('\n' + new_css)

filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = re.sub(r'href="css/style\.css\?v=\d+"', 'href="css/style.css?v=2010"', html_content)

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html_content)
