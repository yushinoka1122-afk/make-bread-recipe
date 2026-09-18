import os
import re

filepath_css = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
filepath_js = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'

# --- 1. CSSの修正 ---
with open(filepath_css, 'r', encoding='utf-8') as f:
    css_content = f.read()

# 古い間違ったCSS設定があれば削除
css_content = re.sub(r'/\* =========================================\n\s*料理モード.*?(?=\*/)\*/.*?(@media print\s*{.*?}\s*})?', '', css_content, flags=re.DOTALL)

new_css = '''
/* =========================================
   料理モード (Cooking Mode) 専用スタイル (完全版)
   ========================================= */
/* 大枠を横並びにする */
body.mode-cooking #outputArea {
  display: flex;
  flex-direction: row;
  gap: 20px;
  align-items: flex-start;
}

/* JSで作る左カラム */
.cooking-left-col {
  flex: 0 0 32%;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
/* 左カラムの中身の幅を100%に */
body.mode-cooking .preview-header {
  display: flex;
  flex-direction: column;
  width: 100%;
}
body.mode-cooking .preview-left, 
body.mode-cooking .preview-right {
  width: 100% !important;
}

/* JSで作る右カラム */
.cooking-right-col {
  flex: 1;
  min-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* パン専用の要素（成形・ホイロ・焼成）を完全に非表示 */
body.mode-cooking .specs-container {
  display: none !important;
}

/* プレート（提供方法）のデザイン */
body.mode-cooking #servingMethodSection {
  border: 2px solid #cbd5e1;
  background: #f8fafc;
  padding: 10px !important;
  width: 100% !important;
}
body.mode-cooking #servingMethodSection textarea {
  min-height: 80px !important;
}
body.mode-cooking .serving-wrapper {
  width: 100% !important;
}

/* 作成手順・スタンバイの4列グリッド化 */
body.mode-cooking .steps-grid,
body.mode-cooking .steps-full {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 15px !important;
  width: 100%;
}
body.mode-cooking .steps-col {
  display: contents; /* ラッパーを無効化 */
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
  flex: 1; 
  display: flex;
  flex-direction: column;
}
body.mode-cooking .step-textarea,
body.mode-cooking .standby-textarea {
  flex: 1;
  resize: vertical;
}

/* 印刷時の設定 */
@media print {
  body.mode-cooking @page {
    size: landscape;
  }
  body.mode-cooking #outputArea {
    flex-direction: row;
  }
}
'''
with open(filepath_css, 'w', encoding='utf-8') as f:
    f.write(css_content + '\n' + new_css)


# --- 2. JSの修正 ---
with open(filepath_js, 'r', encoding='utf-8') as f:
    js_content = f.read()

old_switchMode_match = re.search(r'function switchMode\(mode\).*?toggleSidebar\(\);\s*\}', js_content, re.DOTALL)

new_switchMode = '''function switchMode(mode) {
    currentMode = mode;
    const body = document.body;
    const badge = document.getElementById('modeBadge');
    
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    
    const outputArea = document.getElementById('outputArea');
    const previewHeader = document.querySelector('.preview-header');
    const specsContainer = document.querySelector('.specs-container');
    const stepsGrid = document.querySelector('.steps-grid');
    const stepsFull = document.getElementById('outStepsFull');
    
    // 提供方法
    const servingMethodSection = document.getElementById('servingMethodSection');
    const servingTitleSpan = servingMethodSection ? servingMethodSection.querySelector('span') : null;
    let servingWrapper = servingMethodSection ? servingMethodSection.parentNode : null;
    let servingFlexEnd = servingWrapper ? servingWrapper.parentNode : null;
    if (servingWrapper) servingWrapper.classList.add('serving-wrapper');

    const addButtonsRow = document.querySelector('.edit-only-row:has(.add-btn)');
    const standbySection = document.getElementById('standbySection');

    let leftCol = document.getElementById('cookingLeftCol');
    let rightCol = document.getElementById('cookingRightCol');
    if (!leftCol) {
      leftCol = document.createElement('div');
      leftCol.id = 'cookingLeftCol';
      leftCol.className = 'cooking-left-col';
    }
    if (!rightCol) {
      rightCol = document.createElement('div');
      rightCol.id = 'cookingRightCol';
      rightCol.className = 'cooking-right-col';
    }

    if (mode === 'cooking') {
      body.classList.add('mode-cooking');
      if (badge) { badge.innerText = '料理・デザートモード'; badge.style.backgroundColor = '#ef4444'; }
      const activeBtn = document.querySelector('.mode-btn[onclick*="cooking"]');
      if (activeBtn) activeBtn.classList.add('active');
      
      outputArea.prepend(leftCol);
      outputArea.appendChild(rightCol);
      
      if (previewHeader) leftCol.appendChild(previewHeader);
      if (servingFlexEnd) {
        servingFlexEnd.style.justifyContent = 'flex-start';
        leftCol.appendChild(servingFlexEnd);
      }
      if (servingTitleSpan) servingTitleSpan.innerText = '【プレート】';

      if (stepsGrid) rightCol.appendChild(stepsGrid);
      if (stepsFull) rightCol.appendChild(stepsFull);
      if (addButtonsRow) rightCol.appendChild(addButtonsRow);
      if (standbySection) rightCol.appendChild(standbySection);

    } else {
      body.classList.remove('mode-cooking');
      if (badge) { badge.innerText = 'パンモード'; badge.style.backgroundColor = '#f59e0b'; }
      const activeBtn = document.querySelector('.mode-btn[onclick*="bread"]');
      if (activeBtn) activeBtn.classList.add('active');
      
      if (previewHeader) outputArea.appendChild(previewHeader);
      if (specsContainer) outputArea.appendChild(specsContainer);
      if (stepsGrid) outputArea.appendChild(stepsGrid);
      if (stepsFull) outputArea.appendChild(stepsFull);
      if (servingFlexEnd) {
        servingFlexEnd.style.justifyContent = 'flex-end';
        outputArea.appendChild(servingFlexEnd);
      }
      if (addButtonsRow) outputArea.appendChild(addButtonsRow);
      if (standbySection) outputArea.appendChild(standbySection);
      if (servingTitleSpan) servingTitleSpan.innerText = '■ 提供方法';
      
      if (leftCol && leftCol.parentNode) leftCol.parentNode.removeChild(leftCol);
      if (rightCol && rightCol.parentNode) rightCol.parentNode.removeChild(rightCol);
    }
    toggleSidebar();
  }'''

if old_switchMode_match:
    js_content = js_content.replace(old_switchMode_match.group(0), new_switchMode)
    with open(filepath_js, 'w', encoding='utf-8') as f:
        f.write(js_content)
