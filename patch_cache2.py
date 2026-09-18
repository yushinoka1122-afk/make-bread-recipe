import re

filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html = f.read()
html = re.sub(r'href="css/style\.css\?v=\d+"', 'href="css/style.css?v=2021"', html)
with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html)
