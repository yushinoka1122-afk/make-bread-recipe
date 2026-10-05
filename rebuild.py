import os

main_js_path = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
cooking_js_path = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\cooking.js'

with open(main_js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update step blocks in JS to use the new layout
# There are 3 blocks: addStepBlock, loadRecipeFromDB (step block), and insertBlankStepBlock
# They look like this in main.js:
'''
      <div class="step-block-header edit-only-row">
        <span class="block-title" style="color:#e91e63;">手順</span>
        <select class="step-template-select edit-only-btn" onchange="applyStepTemplate(this)" style="margin-left: 10px; font-size: 0.8rem; padding: 2px;">
          <option value="">-- 定型文挿入 --</option>
          <option value="proof">ホイロ</option>
          <option value="bake">焼成</option>
          <option value="steam">スチーム焼成</option>
          <option value="dry">空焼き</option>
        </select>
        <select class="tool-template-select edit-only-btn" onchange="applyToolTemplate(this)" style="margin-left: 5px; font-size: 0.8rem; padding: 2px;">
          <option value="">-- 🛠道具挿入 --</option>
          <option value="ボウル">ボウル</option>
          <option value="ホイッパー">ホイッパー</option>
          <option value="ゴムベラ">ゴムベラ</option>
          <option value="スケッパー">スケッパー</option>
          <option value="天板">天板</option>
          <option value="クッキングシート">クッキングシート</option>
          <option value="温度計">温度計</option>
          <option value="刷毛">刷毛</option>
          <option value="絞り袋">絞り袋</option>
          <option value="口金">口金</option>
          <option value="めん棒">めん棒</option>
        </select>
        <button type="button" class="del-btn edit-only-btn" style="width:auto; padding:2px 5px;" onclick="removeStepBlock(this)">ブロック削除</button>
      </div>
      <div class="step-preview-block">
        <div class="step-img-out">
          <div class="image-upload-box" onclick="triggerFileInput(this)">
            <input type="file" class="image-file-input block-img" accept="image/*" onchange="previewImage(this)">
            <div class="image-placeholder">
              <span>📷 写真を選択</span>
            </div>
            <div class="image-preview" style="display: none;">
              <img>
              <button type="button" class="del-image-btn edit-only-btn" onclick="clearImage(event, this)">×</button>
            </div>
          </div>
        </div>
        <div class="step-texts-out">
          <div class="print-only-block-title" style="font-weight:bold; margin-bottom:2px; text-align:left;">手順</div>
          <textarea class="step-textarea" placeholder="手順を自由に入力してください" oninput="autoResizeTextarea(this)"></textarea>
        </div>
      </div>
'''

# Let's replace the whole block manually for the 3 functions.
# Since we know the structure of main.js, we can replace them securely.
# Instead of regex, we'll split the file and replace.
# Actually, wait, insertBlankStepBlock didn't have the tool-template-select in main.js!
# I will use a simple function to replace the HTML inside the template literals.

def create_new_step_html(title_str="手順"):
    return f'''      <div class="step-block-header edit-only-row" style="flex-direction: column; align-items: stretch; gap: 5px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="block-title" style="color:#e91e63;">{title_str}</span>
            <label style="font-size: 0.8rem; cursor: pointer; color: #1565c0; font-weight: bold;">
              <input type="checkbox" class="standby-toggle" onchange="updateBlockNumbers()"> スタンバイ
            </label>
          </div>
          <button type="button" class="del-btn edit-only-btn" style="width: 24px; height: 24px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #ef4444; color: white;" onclick="removeStepBlock(this)">×</button>
        </div>
        <div style="display: flex; gap: 5px;">
          <select class="step-template-select edit-only-btn" onchange="applyStepTemplate(this)" style="font-size: 0.8rem; padding: 2px;">
            <option value="">-- 定型文挿入 --</option>
            <option value="format1">本文フォーマット①</option>
          </select>
          <div class="tool-dropdown-container edit-only-btn" style="position: relative; display: inline-block;">
            <button type="button" class="tool-dropdown-btn" onclick="toggleToolMenu(this)" style="font-size: 0.8rem; padding: 2px;">-- 🛠道具挿入 -- ▼</button>
            <div class="tool-dropdown-menu" style="display: none; position: absolute; left: 0; top: 100%; z-index: 100; background: white; border: 1px solid #ccc; padding: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); white-space: nowrap; font-size: 0.85rem; max-height: 250px; overflow-y: auto;">
              <label style="display:block; cursor:pointer;"><input type="checkbox" value="ボウル"> ボウル</label>
              <label style="display:block; cursor:pointer;"><input type="checkbox" value="ホイッパー"> ホイッパー</label>
              <label style="display:block; cursor:pointer;"><input type="checkbox" value="ゴムベラ"> ゴムベラ</label>
              <label style="display:block; cursor:pointer;"><input type="checkbox" value="スケッパー"> スケッパー</label>
              <label style="display:block; cursor:pointer;"><input type="checkbox" value="天板"> 天板</label>
              <label style="display:block; cursor:pointer;"><input type="checkbox" value="クッキングシート"> クッキングシート</label>
              <label style="display:block; cursor:pointer;"><input type="checkbox" value="温度計"> 温度計</label>
              <label style="display:block; cursor:pointer;"><input type="checkbox" value="刷毛"> 刷毛</label>
              <label style="display:block; cursor:pointer;"><input type="checkbox" value="絞り袋"> 絞り袋</label>
              <label style="display:block; cursor:pointer;"><input type="checkbox" value="口金"> 口金</label>
              <label style="display:block; cursor:pointer;"><input type="checkbox" value="めん棒"> めん棒</label>
              <button type="button" onclick="insertCheckedTools(this)" style="margin-top: 5px; width: 100%; font-size: 0.85rem; padding: 2px; background: #e0e0e0; cursor: pointer; border: 1px solid #999;">挿入する</button>
            </div>
          </div>
        </div>
      </div>
      <div class="step-preview-block">
        <div class="step-img-out">
          <div class="image-upload-box" onclick="triggerFileInput(this)">
            <input type="file" class="image-file-input block-img" accept="image/*" onchange="previewImage(this)">
            <div class="image-placeholder">
              <span>📷 写真を選択</span>
            </div>
            <div class="image-preview" style="display: none;">
              <img>
              <button type="button" class="del-image-btn edit-only-btn" onclick="clearImage(event, this)">×</button>
            </div>
          </div>
        </div>
        <div class="step-texts-out" style="position: relative;">
          <div class="print-only-block-title" style="font-weight:bold; margin-bottom:2px; text-align:left;">{title_str}</div>
          <div class="edit-only-row" style="justify-content: flex-end; margin-bottom: 2px;">
            <button type="button" class="font-adjust-btn edit-only-btn" onclick="adjustFontSize(this, -1)" style="padding: 1px 4px; font-size: 10px;" title="文字を小さく">A-</button>
            <button type="button" class="font-adjust-btn edit-only-btn" onclick="adjustFontSize(this, 1)" style="margin-left: 2px; padding: 1px 4px; font-size: 10px;" title="文字を大きく">A+</button>
          </div>
          <textarea class="step-textarea" placeholder="手順を自由に入力してください" oninput="autoResizeTextarea(this)"></textarea>
        </div>
      </div>'''

# Replace addStepBlock
import re
content = re.sub(
    r' {6}<div class="step-block-header edit-only-row">.*?<textarea class="step-textarea" placeholder="手順を自由に入力してください"></textarea>\n {8}</div>\n {6}</div>',
    create_new_step_html('手順'),
    content, count=1, flags=re.DOTALL
)

# Replace loadRecipeFromDB
content = re.sub(
    r' {12}<div class="step-block-header edit-only-row">.*?<textarea class="step-textarea" placeholder="手順を自由に入力してください"></textarea>\n {14}</div>\n {12}</div>',
    create_new_step_html('手順').replace('\n', '\n      '),
    content, count=1, flags=re.DOTALL
)

# Replace insertBlankStepBlock
content = re.sub(
    r' {6}<div class="step-block-header edit-only-row">.*?<textarea class="step-textarea" placeholder="手順を自由に入力してください"></textarea>\n {8}</div>\n {6}</div>',
    create_new_step_html('手順①'),
    content, count=1, flags=re.DOTALL
)

# Replace applyStepTemplate logic
content = content.replace('''  function applyStepTemplate(selectObj) {
    const templateName = selectObj.value;
    if (!templateName) return;
    
    let textToInsert = "";
    if (templateName === "proof") {
      textToInsert = "ホイロ： 分\\n※室温や生地状態により変化するため、最終判断はホイロ規格を基準にしてください。";
    } else if (templateName === "bake") {
      textToInsert = "焼成：℃　分\\n※オーブンの仕様や状態によって設定温度・時間は変化するため、最終判断は焼成規格を基準にしてください。";
    } else if (templateName === "steam") {
      textToInsert = "スチーム焼成：℃　分　スチーム　cc\\n※オーブンの仕様や状態によって設定温度・時間は変化するため、最終判断は焼成規格を基準にしてください。";
    } else if (templateName === "dry") {
      textToInsert = "空焼き：℃　分\\n※オーブンの仕様や状態によって設定温度・時間は変化するため、最終判断は焼成規格を基準にしてください。";
    }
    
    const block = selectObj.closest('.step-block');
    const textarea = block.querySelector('.step-textarea');
    
    if (textarea) {
      if (textarea.value) {
        textarea.value = textarea.value + '\\n' + textToInsert;
      } else {
        textarea.value = textToInsert;
      }
      autoResizeTextarea(textarea);
    }
    selectObj.value = "";
    adjustPreviewScale();
  }''', '''  function applyStepTemplate(selectObj) {
    const templateName = selectObj.value;
    if (!templateName) return;
    
    let textToInsert = "";
    if (templateName === "format1") {
      textToInsert = "手を洗いアルコールをします。\\n使用する備品に汚れが付いていないことを確認します。";
    }
    
    const block = selectObj.closest('.step-block');
    const textarea = block.querySelector('.step-textarea');
    
    if (textarea) {
      if (textarea.value) {
        textarea.value = textarea.value + '\\n' + textToInsert;
      } else {
        textarea.value = textToInsert;
      }
      autoResizeTextarea(textarea);
    }
    selectObj.value = "";
    adjustPreviewScale();
  }''')

# Replace applyToolTemplate with toggleToolMenu and insertCheckedTools
content = content.replace('''  function applyToolTemplate(selectObj) {
    const tool = selectObj.value;
    if (!tool) return;
    
    const block = selectObj.closest('.step-block');
    const textarea = block.querySelector('.step-textarea');
    
    if (textarea) {
      if (textarea.value) {
        textarea.value = textarea.value + '\\n・' + tool;
      } else {
        textarea.value = '・' + tool;
      }
      autoResizeTextarea(textarea);
    }
    selectObj.value = "";
    adjustPreviewScale();
  }''', '''  function toggleToolMenu(btn) {
    const container = btn.closest('.tool-dropdown-container');
    const menu = container.querySelector('.tool-dropdown-menu');
    const isVisible = menu.style.display === 'block';
    
    // 他の開いているメニューをすべて閉じる
    document.querySelectorAll('.tool-dropdown-menu').forEach(m => m.style.display = 'none');
    
    if (!isVisible) {
      menu.style.display = 'block';
      // メニューを開いたときにチェックボックスをリセットする
      menu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
  }

  // メニュー外をクリックしたら閉じる処理
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.tool-dropdown-container')) {
      document.querySelectorAll('.tool-dropdown-menu').forEach(m => m.style.display = 'none');
    }
  });

  function insertCheckedTools(insertBtn) {
    const menu = insertBtn.closest('.tool-dropdown-menu');
    const checkboxes = menu.querySelectorAll('input[type="checkbox"]:checked');
    const container = insertBtn.closest('.tool-dropdown-container');
    const block = container.closest('.step-block');
    const textarea = block.querySelector('.step-textarea');
    
    if (checkboxes.length > 0 && textarea) {
      const selectedTools = Array.from(checkboxes).map(cb => cb.value);
      const insertText = selectedTools.join('、') + 'を準備します。';
      
      if (textarea.value) {
        textarea.value = textarea.value + '\\n' + insertText;
      } else {
        textarea.value = insertText;
      }
      autoResizeTextarea(textarea);
    }
    
    // メニューを閉じる
    menu.style.display = 'none';
    adjustPreviewScale();
  }''')

# Add adjustFontSize to the end of the file
content += '''
function adjustFontSize(btn, delta) {
    const textarea = btn.closest('.step-block').querySelector('.step-textarea');
    if (!textarea) return;
    
    let currentSize = parseInt(textarea.style.fontSize) || 12;
    currentSize += delta;
    
    if (currentSize < 8) currentSize = 8;
    if (currentSize > 16) currentSize = 16;
    
    textarea.style.fontSize = currentSize + 'px';
    textarea.setAttribute('data-font-size', currentSize);
    if (typeof autoResizeTextarea === 'function') autoResizeTextarea(textarea);
}
'''

with open(cooking_js_path, 'w', encoding='utf-8') as f:
    f.write(content)
