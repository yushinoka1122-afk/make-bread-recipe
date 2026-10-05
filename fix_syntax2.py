import os
import re
filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\drink.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

fixed_block = '''  function applyStepTemplate(selectObj) {
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
    adjustPreviewScale();
  }'''

content = re.sub(r'  function applyStepTemplate\(selectObj\).*?adjustPreviewScale\(\);\s*\}', fixed_block, content, flags=re.DOTALL)
# The previous substitution might have left a trailing `}` because of the regex missing `adjustPreviewScale();`
# Let's clean up any double `}}`
content = content.replace('  }\n\n    selectObj.value = "";\n    adjustPreviewScale();\n  }', fixed_block)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
