import os
import re

filepath_css = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath_css, 'r', encoding='utf-8') as f:
    css_content = f.read()

new_css = '''
/* -----------------------------------------
   スタンバイ欄のサイズ・余白 強制圧縮（完全版）
----------------------------------------- */
/* スタンバイブロック全体の高さを圧縮 */
body.mode-cooking .standby-block {
  min-height: 120px !important;
  height: 120px !important;
  max-height: 120px !important;
}
/* スタンバイ内の画像エリアを小さく */
body.mode-cooking .standby-block .step-img-out,
body.mode-cooking .standby-block .image-upload-box {
  height: 60px !important;
  min-height: 60px !important;
  max-height: 60px !important;
}
/* スタンバイ内のテキストエリアを小さく */
body.mode-cooking .standby-block .step-textarea,
body.mode-cooking .standby-block textarea {
  min-height: 35px !important;
  height: 35px !important;
  max-height: 35px !important;
}

/* スタンバイセクション周辺の余白を極限まで削る */
body.mode-cooking #standbySection {
  margin-top: 0 !important;
  padding-top: 0 !important;
}
body.mode-cooking .steps-grid,
body.mode-cooking .steps-full,
body.mode-cooking #outStepsFull {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}
/* 追加ボタンの行の余白も削る（印刷時や非表示時にも隙間を作らせない） */
body.mode-cooking .edit-only-row {
  margin: 0 !important;
  padding: 0 !important;
}
'''

with open(filepath_css, 'a', encoding='utf-8') as f:
    f.write('\n' + new_css)

# Cache buster
filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = re.sub(r'href="css/style\.css\?v=\d+"', 'href="css/style.css?v=2008"', html_content)

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html_content)
