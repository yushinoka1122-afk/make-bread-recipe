import os

cooking_js_path = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\cooking.js'
with open(cooking_js_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

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
      </div>\n'''

new_lines = []
in_add = False
in_load = False
in_insert = False

for i, line in enumerate(lines):
    if 'function addStepBlock()' in line:
        new_lines.append(line)
        continue
    if 'function loadRecipeFromDB' in line:
        new_lines.append(line)
        continue
    if 'function insertBlankStepBlock()' in line:
        new_lines.append(line)
        continue
        
    if 'div.innerHTML = `' in lines[i-1] and 'addStepBlock' in ''.join(lines[i-10:i]):
        in_add = True
        new_lines.append(create_new_step_html('手順'))
        continue
    if in_add and '`;' in line:
        in_add = False
        new_lines.append(line)
        continue
    if in_add:
        continue
        
    # for loadRecipeFromDB
    if 'div.innerHTML = `' in lines[i-1] and 'step-block' in ''.join(lines[i-10:i]) and 'data-block-id' in ''.join(lines[i-10:i]) and not 'standby-block' in ''.join(lines[i-10:i]):
        if 'loadRecipeFromDB' in ''.join(lines[i-30:i]):
            in_load = True
            new_lines.append(create_new_step_html('手順'))
            continue
    if in_load and '`;' in line:
        in_load = False
        new_lines.append(line)
        continue
    if in_load:
        continue

    # for insertBlankStepBlock
    if 'div.innerHTML = `' in lines[i-1] and 'insertBlankStepBlock' in ''.join(lines[i-10:i]):
        in_insert = True
        new_lines.append(create_new_step_html('手順①'))
        continue
    if in_insert and '`;' in line:
        in_insert = False
        new_lines.append(line)
        continue
    if in_insert:
        continue

    new_lines.append(line)

with open(cooking_js_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
