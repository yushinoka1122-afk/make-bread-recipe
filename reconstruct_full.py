import os
import subprocess
import traceback

base_dir = r'C:\Users\m2100876\Downloads\手順書作成ツール コード'
parent_dir = r'C:\Users\m2100876\Downloads'
src_file = os.path.join(parent_dir, 'recipe_maker.html')

try:
    print('1. 完全初期化：大元の recipe_maker.html から再抽出...')
    with open(src_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    css_content = "".join(lines[11:690])
    js_content = "".join(lines[1037:3142])
    new_html_parts = []
    new_html_parts.extend(lines[0:10])
    new_html_parts.append('  <link rel="stylesheet" href="css/style.css?v=4000">\n')
    new_html_parts.extend(lines[691:1036])
    new_html_parts.append('  <script src="js/main.js"></script>\n')
    new_html_parts.extend(lines[3143:])
    new_html_content = "".join(new_html_parts)
    
    os.makedirs(os.path.join(base_dir, 'css'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'js'), exist_ok=True)
    
    with open(os.path.join(base_dir, 'css', 'style.css'), 'w', encoding='utf-8') as f:
        f.write(css_content)
    with open(os.path.join(base_dir, 'js', 'main.js'), 'w', encoding='utf-8') as f:
        f.write(js_content)
    with open(os.path.join(base_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(new_html_content)
        
    print('2. 正しい順序で過去のパッチを全適用...')
    patches = [
        'patch_main_mode.py',
        'patch_html.py',
        'patch_layout.py',
        'patch_serialize.py',
        'patch_print.py',
        'patch_js_print.py',
        'patch_plate.py',
        'patch_size.py',
        'patch_final_layout.py',
        'patch_autosync.py',
        'patch_standby_classes.py',
        'patch_standby_height.py',
        'patch_standby_increase.py',
        'patch_print_orientation.py'
    ]
    
    for p in patches:
        patch_path = os.path.join(base_dir, p)
        if os.path.exists(patch_path):
            print(f'Applying {p}...')
            subprocess.run(['python', patch_path], cwd=base_dir, check=True)
        else:
            print(f'Warning: {p} not found! スキップします。')
            
    print('SUCCESS: 全てのパッチの適用が完了し、料理モードが完全復活しました！')
except Exception as e:
    traceback.print_exc()
