import os
import re

filepath_css = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath_css, 'r', encoding='utf-8') as f:
    css_content = f.read()

# 120px -> 150px, 60px -> 90px に置換
css_content = css_content.replace('min-height: 120px !important;', 'min-height: 155px !important;')
css_content = css_content.replace('height: 120px !important;', 'height: 155px !important;')
css_content = css_content.replace('max-height: 120px !important;', 'max-height: 155px !important;')

css_content = css_content.replace('height: 60px !important;', 'height: 95px !important;')
css_content = css_content.replace('min-height: 60px !important;', 'min-height: 95px !important;')
css_content = css_content.replace('max-height: 60px !important;', 'max-height: 95px !important;')

with open(filepath_css, 'w', encoding='utf-8') as f:
    f.write(css_content)

filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

html_content = re.sub(r'href="css/style\.css\?v=\d+"', 'href="css/style.css?v=2009"', html_content)

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html_content)
