import os
import re

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath, 'r', encoding='utf-8') as f:
    css = f.read()

# 1. 縦幅と横幅の拡大、および不要な余白の削除
new_css = '''
/* 手順ブロックのサイズ拡大と余白調整 */
body.mode-cooking .step-block {
  width: 100% !important; /* 横幅いっぱいまで広げる */
  max-width: none !important; /* パンモードの制限を解除 */
  min-height: 250px !important; /* 縦幅を少し増やす */
}
body.mode-cooking .step-img-out {
  height: 140px !important; /* 写真エリアも少し大きく */
}

/* 右カラム内の要素（追加ボタンなど）の余白調整 */
body.mode-cooking .steps-grid {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}
body.mode-cooking .edit-only-row {
  margin-top: 5px !important;
  margin-bottom: 5px !important;
}
body.mode-cooking #standbySection {
  margin-top: 0 !important;
}
'''
with open(filepath, 'a', encoding='utf-8') as f:
    f.write('\n' + new_css)

filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

# cache buster
html_content = re.sub(r'href="css/style\.css\?v=\d+"', 'href="css/style.css?v=2003"', html_content)
with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html_content)
