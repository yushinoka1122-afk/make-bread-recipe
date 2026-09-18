import os
import shutil
import subprocess
import traceback

base_dir = r'C:\Users\m2100876\Downloads\手順書作成ツール コード'
parent_dir = r'C:\Users\m2100876\Downloads'
src_file = os.path.join(parent_dir, 'recipe_maker.html')

if not os.path.exists(src_file):
    print('recipe_maker.html not found!')
else:
    try:
        print('1. Running reconstruction from original html...')
        with open(src_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        css_content = "".join(lines[11:690])
        js_content = "".join(lines[1037:3142])
        new_html_parts = []
        new_html_parts.extend(lines[0:10])
        new_html_parts.append('  <link rel="stylesheet" href="css/style.css?v=3000">\n')
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
            
        print('2. Applying good patches sequentially...')
        good_patches = [
            'patch_main_mode.py',            # パンモード・料理モードの切り替え等初期基盤
            'patch_standby_classes.py',      # スタンバイ枠のクラス名修正
            'patch_standby_increase.py',     # スタンバイ写真枠の拡大修正
            'patch_print_orientation.py'     # パンモードなら縦・料理モードなら横の自動切替
        ]
        
        for p in good_patches:
            patch_path = os.path.join(base_dir, p)
            if os.path.exists(patch_path):
                print(f'Applying {p}...')
                subprocess.run(['python', patch_path], cwd=base_dir, check=True)
            else:
                print(f'Warning: {p} not found.')
                
        print('SUCCESS: Full clean restore complete!')
    except Exception as e:
        traceback.print_exc()
