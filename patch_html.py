import os
import re

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 🍔 メニューボタンとタイトル、モードバッジの追加
old_header = '<h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">🍞 料理手順書ツール</h2>'
new_header = '''<div style="display: flex; align-items: center; gap: 12px;">
        <button id="hamburgerMenuBtn" onclick="toggleSidebar()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #1e293b; padding: 0;">≡</button>
        <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700;">🍞 料理手順書ツール <span id="modeBadge" style="font-size: 0.8rem; background-color: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; margin-left: 8px; vertical-align: middle;">パンモード</span></h2>
      </div>'''
content = content.replace(old_header, new_header)

# 2. サイドバーの追加 (bodyの直下に追加)
sidebar_html = '''
  <!-- 🍳 サイドバー（モード切替） -->
  <div id="sidebarOverlay" onclick="toggleSidebar()" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999;"></div>
  <div id="sidebarMenu" style="position: fixed; top: 0; left: -300px; width: 250px; height: 100%; background: #ffffff; box-shadow: 2px 0 5px rgba(0,0,0,0.2); z-index: 10000; transition: left 0.3s ease; display: flex; flex-direction: column;">
    <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; font-size: 1.1rem; color: #1e293b;">モード選択</h3>
      <button onclick="toggleSidebar()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #64748b; padding: 0;">×</button>
    </div>
    <div style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
      <button onclick="switchMode('bread')" class="mode-btn" style="padding: 12px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; text-align: left; font-size: 1rem; color: #334155; font-weight: bold;">🍞 パン手順書ツール</button>
      <button onclick="switchMode('cooking')" class="mode-btn" style="padding: 12px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; text-align: left; font-size: 1rem; color: #334155; font-weight: bold;">🍳 料理・デザート手順書</button>
    </div>
  </div>
'''
if '<div id="sidebarMenu"' not in content:
    content = content.replace('<body>', '<body>\n' + sidebar_html)

# 3. CSSの追加 (styleタグの末尾)
css_to_add = '''
    /* =========================================
       料理モード (Cooking Mode) 専用スタイル
       ========================================= */
    body.mode-cooking .editor-container {
      display: flex;
      flex-direction: row;
      gap: 20px;
      align-items: flex-start;
    }
    body.mode-cooking #layoutTopLeft {
      flex: 0 0 40%;
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-width: 300px;
    }
    body.mode-cooking #topRowContainer {
      flex-direction: column; /* 食材と画像を縦に並べる */
      align-items: stretch !important;
    }
    body.mode-cooking #layoutBottomRight {
      flex: 1; /* 残りのスペースを手順とスタンバイが使う */
      min-width: 400px;
    }
    /* パン専用の要素（型、ホイロ、焼成など）を非表示にする */
    body.mode-cooking .bread-only {
      display: none !important;
    }
    /* モードボタンのアクティブ表示 */
    .mode-btn.active {
      background-color: #3b82f6 !important;
      color: #ffffff !important;
      border-color: #2563eb !important;
    }
    /* 印刷時の設定（料理モードは横向きを推奨するが、CSSで強制はできない環境もあるので @page を追加） */
    @media print {
      body.mode-cooking @page {
        size: landscape;
      }
      body.mode-cooking .editor-container {
        flex-direction: row;
      }
    }
'''
if 'body.mode-cooking' not in content:
    content = content.replace('</style>', css_to_add + '\n  </style>')

# 4. パン専用項目に .bread-only クラスを付与
content = content.replace('<div style="flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 20px;" id="specsSection">', '<div class="bread-only" style="flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 20px;" id="specsSection">', 1)
content = content.replace('<div style="flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 20px;">', '<div class="bread-only" style="flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 20px;" id="specsSection">', 1) # Just in case

old_sub_images = '<div style="display: flex; gap: 10px; margin-top: 10px;">'
new_sub_images = '<div class="bread-only" style="display: flex; gap: 10px; margin-top: 10px;">'
content = content.replace(old_sub_images, new_sub_images)

# 5. レイアウト用のラッパー (layoutTopLeft, layoutBottomRight) を追加
# もしまだ追加されていなければ追加する
if '<div id="layoutTopLeft">' not in content:
    content = re.sub(
        r'(<div class="editor-container"[^>]*>\s*)(<div style="display: flex; gap: 20px; align-items: stretch; margin-bottom: 20px; flex-wrap: wrap;" id="topRowContainer">)',
        r'\1<div id="layoutTopLeft" style="width: 100%;">\n      \2',
        content
    )
    # Without ID just in case
    content = re.sub(
        r'(<div class="editor-container"[^>]*>\s*)(<div style="display: flex; gap: 20px; align-items: stretch; margin-bottom: 20px; flex-wrap: wrap;">)',
        r'\1<div id="layoutTopLeft" style="width: 100%;">\n      <div style="display: flex; gap: 20px; align-items: stretch; margin-bottom: 20px; flex-wrap: wrap;" id="topRowContainer">',
        content
    )

    # 閉じタグと layoutBottomRight
    content = re.sub(
        r'(</div>\s*)(<!-- 作成手順 -->\s*<h3[^>]*>.*?手順ブロック.*?</h3>)',
        r'\1    </div><!-- /layoutTopLeft -->\n    <div id="layoutBottomRight" style="width: 100%;">\n    \2',
        content
    )
    content = re.sub(
        r'(</div>\s*)(<h3[^>]*>.*?手順ブロック.*?</h3>)',
        r'\1    </div><!-- /layoutTopLeft -->\n    <div id="layoutBottomRight" style="width: 100%;">\n    \2',
        content
    )

    # editor-containerの閉じタグの直前でラッパーを閉じる
    content = re.sub(
        r'(</div>\s*<!-- 設定モーダル -->)',
        r'    </div><!-- /layoutBottomRight -->\n  \1',
        content
    )

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('HTML structure patched!')
