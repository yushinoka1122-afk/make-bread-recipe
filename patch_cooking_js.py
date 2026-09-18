import os
import re

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
with open(filepath, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. reorganizeStepBlocksの修正
new_reorganize = '''  function reorganizeStepBlocks() {
    const blocks = Array.from(document.querySelectorAll('#outputArea .step-block[data-block-type="step"]'));
    const outLeft = document.getElementById('outStepsLeft');
    const outRight = document.getElementById('outStepsRight');
    const outFull = document.getElementById('outStepsFull');

    if (outLeft) outLeft.innerHTML = '';
    if (outRight) outRight.innerHTML = '';
    if (outFull) outFull.innerHTML = '';

    const total = blocks.length;
    const leftCount = Math.ceil(total / 2);

    blocks.forEach((block, index) => {
      if (typeof currentMode !== 'undefined' && currentMode === 'cooking') {
        // 料理モードは全て outFull に格納
        if (outFull) outFull.appendChild(block);
      } else {
        // パンモードは左右に分割
        if (index < leftCount) {
          if (outLeft) outLeft.appendChild(block);
        } else {
          if (outRight) outRight.appendChild(block);
        }
      }
    });

    updateBlockNumbers();
    if (typeof adjustPreviewScale === 'function') adjustPreviewScale();
  }'''

js = re.sub(r'function reorganizeStepBlocks\(\)\s*\{[\s\S]*?adjustPreviewScale\(\);\s*\}', new_reorganize, js)

# 2. updateBlockNumbersの修正
new_update_nums = '''  function updateBlockNumbers() {
    const blocks = document.querySelectorAll('#outputArea .step-block[data-block-type="step"]');
    blocks.forEach((block, index) => {
      const displayNum = index + 1;
      const numSpan = block.querySelector('.step-num');
      if (numSpan) {
        numSpan.innerText = '手順' + getCircledNumber(displayNum);
      }
      
      // 料理モード専用の特殊な順序配置（ジグザグ配置）
      if (typeof currentMode !== 'undefined' && currentMode === 'cooking') {
          let order = index;
          if (index < 8) {
              if (index % 2 === 0) {
                  order = index / 2; // 0, 2, 4, 6 -> row 1
              } else {
                  order = 4 + Math.floor(index / 2); // 1, 3, 5, 7 -> row 2
              }
          }
          block.style.order = order;
      } else {
          block.style.order = '';
      }
    });
  }'''

js = re.sub(r'function updateBlockNumbers\(\)\s*\{[\s\S]*?\}\s*\}\);?\s*\}', new_update_nums, js)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(js)
print('JS updated!')
