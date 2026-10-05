import os
import re

# 1. Update drink.html Serving Template
filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\drink.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    content = f.read()

# Instead of exact string matching, we match the closing </select> of servingTemplate
pattern_serve = r'(<select id="servingTemplate".*?</option>\n.*?)(</select>)'
replacement_serve = r'\1                <option value="エスプーマを使用して、生クリーム（25g）をカップの淵に着けて一周し、その後、中も隙間なく搾ります。">② クリーム</option>\n\2'

if '② クリーム' not in content:
    content = re.sub(pattern_serve, replacement_serve, content, flags=re.DOTALL)
    with open(filepath_html, 'w', encoding='utf-8') as f:
        f.write(content)

# 2. Update drink.js Step Templates
filepath_js = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\drink.js'
with open(filepath_js, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Replace the step-template-select options
pattern_step = r'<select class="step-template-select edit-only-btn".*?</select>'
new_step_select = '''<select class="step-template-select edit-only-btn" onchange="applyStepTemplate(this)" style="margin-left: 10px; font-size: 0.8rem; padding: 2px;">
              <option value="">-- 定型文挿入 --</option>
              <option value="drink_prep">準備・アルコール・カップ確認</option>
              <option value="espuma">エスプーマ生クリーム</option>
            </select>'''

js_content = re.sub(pattern_step, new_step_select, js_content, flags=re.DOTALL)

# Update applyStepTemplate logic
pattern_apply = r'function applyStepTemplate\(selectObj\)\s*\{.*?autoResizeTextarea\(textarea\);\s*\}'
new_apply = '''  function applyStepTemplate(selectObj) {
    const tempKey = selectObj.value;
    if (!tempKey) return;
    const block = selectObj.closest('.step-block');
    const textarea = block.querySelector('.step-textarea');
    let lines = [];
    if (tempKey === 'drink_prep') {
      lines.push("手洗い・アルコール・カップ確認");
    } else if (tempKey === 'espuma') {
      lines.push("エスプーマを使用して、生クリーム（25g）をカップの淵に着けて一周し、その後、中も隙間なく搾ります。");
    }
    
    if (textarea) {
      if (textarea.value) {
        textarea.value = textarea.value + '\\n' + lines.join('\\n');
      } else {
        textarea.value = lines.join('\\n');
      }
      autoResizeTextarea(textarea);
    }
    selectObj.value = "";
  }'''

js_content = re.sub(pattern_apply, new_apply, js_content, flags=re.DOTALL)

with open(filepath_js, 'w', encoding='utf-8') as f:
    f.write(js_content)
