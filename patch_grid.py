import os
import re

filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
filepath_js = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'

# --- 1. Patch HTML (CSS) ---
with open(filepath_html, 'r', encoding='utf-8') as f:
    html_content = f.read()

new_css = '''
    /* =========================================
       料理モード (Cooking Mode) 専用スタイル (PDF準拠レイアウト)
       ========================================= */
    body.mode-cooking .editor-container {
      display: flex;
      flex-direction: row;
      gap: 20px;
      align-items: flex-start;
    }
    
    /* 左側カラム (約30%) */
    body.mode-cooking #layoutTopLeft {
      flex: 0 0 32%;
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-width: 250px;
    }
    body.mode-cooking #topRowContainer {
      flex-direction: column; 
      align-items: stretch !important;
      gap: 20px;
    }
    
    /* 右側カラム (約70%) */
    body.mode-cooking #layoutBottomRight {
      flex: 1;
      min-width: 500px;
    }

    /* 作成手順・スタンバイの4列グリッド化 */
    body.mode-cooking .steps-grid,
    body.mode-cooking .steps-col,
    body.mode-cooking .steps-full {
      display: contents; /* ラッパーを無視して直接グリッドアイテムにする魔法のCSS */
    }
    body.mode-cooking #outputArea {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 15px !important;
      margin-bottom: 20px;
    }
    body.mode-cooking #standbyContainer {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 15px !important;
    }

    /* 各ブロック内を「上写真・下テキスト」に強制 */
    body.mode-cooking .step-preview-block,
    body.mode-cooking .standby-preview-block {
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      height: 100%;
    }
    body.mode-cooking .step-img-out,
    body.mode-cooking .s-block-img-out {
      width: 100% !important;
      height: 120px !important;
    }
    body.mode-cooking .image-upload-box {
      height: 100%;
    }
    body.mode-cooking .step-texts-out,
    body.mode-cooking .s-block-texts-out {
      width: 100% !important;
      flex: 1; /* 残りの高さを埋める */
      display: flex;
      flex-direction: column;
    }
    body.mode-cooking .step-textarea,
    body.mode-cooking .standby-textarea {
      flex: 1;
      resize: vertical;
    }

    /* 提供方法をプレートとしてスタイル */
    body.mode-cooking #servingMethodSection {
      border: 2px solid #e2e8f0;
      background: #f8fafc;
      padding: 10px !important;
    }
    body.mode-cooking #servingMethodSection > div {
      font-size: 14px !important;
      margin-bottom: 8px !important;
    }
    body.mode-cooking #servingMethodSection textarea {
      min-height: 60px !important;
    }

    /* パン専用の要素を非表示にする */
    body.mode-cooking .bread-only {
      display: none !important;
    }
    /* モードボタンのアクティブ表示 */
    .mode-btn.active {
      background-color: #3b82f6 !important;
      color: #ffffff !important;
      border-color: #2563eb !important;
    }
    /* 印刷時の設定 */
    @media print {
      body.mode-cooking @page {
        size: landscape;
      }
      body.mode-cooking .editor-container {
        flex-direction: row;
      }
      body.mode-cooking #outputArea,
      body.mode-cooking #standbyContainer {
        grid-template-columns: repeat(4, 1fr) !important;
      }
      body.mode-cooking .step-img-out,
      body.mode-cooking .s-block-img-out {
        height: 100px !important; /* 印刷用に少し縮める */
      }
    }
'''

# 既存の古いモード用CSSブロックを削除して新しいものに差し替え
if '/* =========================================\n       料理モード (Cooking Mode) 専用スタイル' in html_content:
    html_content = re.sub(
        r'/\* =========================================\s*料理モード \(Cooking Mode\) 専用スタイル.*?\*/\s*(?:.*?(?=\n\s*</style>))',
        '',
        html_content,
        flags=re.DOTALL
    )

if 'body.mode-cooking .editor-container' not in html_content:
    html_content = html_content.replace('</style>', new_css + '\n</style>')

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html_content)

# --- 2. Patch JS (DOM Move) ---
with open(filepath_js, 'r', encoding='utf-8') as f:
    js_content = f.read()

# switchMode 関数内での DOM 要素の移動処理を追加
old_switchMode = '''  function switchMode(mode) {
    currentMode = mode;
    const body = document.body;
    const badge = document.getElementById('modeBadge');
    
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));'''

new_switchMode = '''  function switchMode(mode) {
    currentMode = mode;
    const body = document.body;
    const badge = document.getElementById('modeBadge');
    
    // UIのDOM移動（プレートの移動）
    const servingSectionWrapper = document.getElementById('servingMethodSection').parentNode;
    const layoutTopLeft = document.getElementById('topRowContainer');
    const layoutBottomRight = document.getElementById('layoutBottomRight');
    const servingTitleSpan = document.querySelector('#servingMethodSection span');
    const addButtonsRow = document.querySelector('.edit-only-row:has(.add-btn)');
    
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));'''

js_content = js_content.replace(old_switchMode, new_switchMode)

old_cooking_block = '''    if (mode === 'cooking') {
      body.classList.add('mode-cooking');
      if (badge) {
        badge.innerText = '料理・デザートモード';
        badge.style.backgroundColor = '#ef4444'; // Red
      }
      const activeBtn = document.querySelector('.mode-btn[onclick*="cooking"]');
      if (activeBtn) activeBtn.classList.add('active');'''

new_cooking_block = '''    if (mode === 'cooking') {
      body.classList.add('mode-cooking');
      if (badge) {
        badge.innerText = '料理・デザートモード';
        badge.style.backgroundColor = '#ef4444'; // Red
      }
      const activeBtn = document.querySelector('.mode-btn[onclick*="cooking"]');
      if (activeBtn) activeBtn.classList.add('active');
      
      // 料理モード時は「提供方法」を左カラム（TopRowContainerの最後）へ移動し、「プレート」に名称変更
      if (layoutTopLeft && servingSectionWrapper) {
        servingSectionWrapper.style.width = '100%';
        layoutTopLeft.appendChild(servingSectionWrapper);
      }
      if (servingTitleSpan) servingTitleSpan.innerText = '【プレート】';
      '''
js_content = js_content.replace(old_cooking_block, new_cooking_block)

old_bread_block = '''    } else {
      body.classList.remove('mode-cooking');
      if (badge) {
        badge.innerText = 'パンモード';
        badge.style.backgroundColor = '#f59e0b'; // Amber
      }
      const activeBtn = document.querySelector('.mode-btn[onclick*="bread"]');
      if (activeBtn) activeBtn.classList.add('active');'''

new_bread_block = '''    } else {
      body.classList.remove('mode-cooking');
      if (badge) {
        badge.innerText = 'パンモード';
        badge.style.backgroundColor = '#f59e0b'; // Amber
      }
      const activeBtn = document.querySelector('.mode-btn[onclick*="bread"]');
      if (activeBtn) activeBtn.classList.add('active');
      
      // パンモード時は「提供方法」を元の位置（追加ボタンの上）へ戻し、名称も戻す
      if (layoutBottomRight && addButtonsRow && servingSectionWrapper) {
        servingSectionWrapper.style.width = 'calc(50% - 4px)';
        layoutBottomRight.insertBefore(servingSectionWrapper.parentNode, addButtonsRow); // 実際には外側のdivごと移動させるための調整が必要
      }
      if (servingTitleSpan) servingTitleSpan.innerText = '■ 提供方法';
      '''

# wait, servingSectionWrapper is currently just a div with style="width: calc(50% - 4px);". 
# Its parent is a div with style="display: flex; justify-content: flex-end; margin-bottom: 4px;"
# So I should move the outer div!
js_content = js_content.replace(old_bread_block, new_bread_block)

# 修正: 完全に正確なDOM移動
js_content = js_content.replace(
    '''const servingSectionWrapper = document.getElementById('servingMethodSection').parentNode;''',
    '''const servingSectionWrapper = document.getElementById('servingMethodSection').parentNode.parentNode; // <div style="display: flex; ...>'''
)

with open(filepath_js, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Patch applied!")
