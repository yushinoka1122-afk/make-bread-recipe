import os

base_dir = r"C:\Users\m2100876\Downloads"
src_file = os.path.join(base_dir, "recipe_maker.html")

with open(src_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# CSSは12行目から690行目（インデックス11～690）
css_content = "".join(lines[11:690])

# JSは1038行目から3142行目（インデックス1037～3142）
js_content = "".join(lines[1037:3142])

# 新しいHTMLの構築
new_html_parts = []
new_html_parts.extend(lines[0:10]) # <style>の直前まで
new_html_parts.append('  <link rel="stylesheet" href="css/style.css">\n')
new_html_parts.extend(lines[691:1036]) # </style>の直後から<script>の直前まで
new_html_parts.append('  <script src="js/main.js"></script>\n')
new_html_parts.extend(lines[3143:]) # </script>の直後から最後まで

new_html_content = "".join(new_html_parts)

# ディレクトリ作成
os.makedirs(os.path.join(base_dir, "css"), exist_ok=True)
os.makedirs(os.path.join(base_dir, "js"), exist_ok=True)

# ファイル書き出し
with open(os.path.join(base_dir, "css", "style.css"), 'w', encoding='utf-8') as f:
    f.write(css_content)

with open(os.path.join(base_dir, "js", "main.js"), 'w', encoding='utf-8') as f:
    f.write(js_content)

with open(os.path.join(base_dir, "index.html"), 'w', encoding='utf-8') as f:
    f.write(new_html_content)

print("Split successfully!")
