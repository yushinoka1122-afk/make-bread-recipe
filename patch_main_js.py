import os
import re

filepath_js = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
with open(filepath_js, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. 12個制限
old_limit = '''    if (stepBlocks.length >= 8) {
      alert('手順は最大8個までです。');
      return;
    }'''
new_limit = '''    if (typeof currentMode !== 'undefined' && currentMode === 'cooking') {
      if (stepBlocks.length >= 12) {
        alert('料理・デザートモードでは手順は最大12個までです。');
        return;
      }
    } else {
      if (stepBlocks.length >= 8) {
        alert('パン手順書モードでは手順は最大8個までです。');
        return;
      }
    }'''
js = js.replace(old_limit, new_limit)

# 2. ブロック追加時のヘッダーにスタンバイ切り替えチェックボックス追加
old_header = '''<span class="block-title" style="color:#e91e63;">手順</span>
          <select class="step-template-select edit-only-btn"'''
new_header = '''<span class="block-title" style="color:#e91e63;">手順</span>
          <label style="margin-left:5px; font-size:0.8rem; cursor:pointer;" class="edit-only-btn"><input type="checkbox" onchange="toggleStandbyLabel(this)"> スタンバイ化</label>
          <select class="step-template-select edit-only-btn"'''
js = js.replace(old_header, new_header)

# 3. 番号更新ロジックの変更 (スタンバイ時は番号をカウントせず青文字にする)
old_update = '''  function updateStepNumbers() {
    const blocks = document.querySelectorAll('#outputArea .step-block[data-block-type="step"]');
    blocks.forEach((block, index) => {
      const titleSpan = block.querySelector('.block-title');
      if (titleSpan) {
        titleSpan.innerText = '手順' + String.fromCharCode(9311 + (index + 1));
      }
    });
  }'''
new_update = '''  function updateStepNumbers() {
    const blocks = document.querySelectorAll('#outputArea .step-block[data-block-type="step"]');
    let stepCount = 1;
    blocks.forEach((block) => {
      const titleSpan = block.querySelector('.block-title');
      if (titleSpan) {
        if (block.classList.contains('is-standby-block')) {
          titleSpan.innerText = 'スタンバイ';
          titleSpan.style.color = '#0056b3';
          titleSpan.style.fontWeight = 'bold';
        } else {
          titleSpan.innerText = '手順' + (stepCount <= 20 ? String.fromCharCode(9311 + stepCount) : stepCount);
          titleSpan.style.color = '#e91e63';
          titleSpan.style.fontWeight = 'normal';
          stepCount++;
        }
      }
    });
  }'''
js = js.replace(old_update, new_update)

# 4. toggleStandbyLabel 関数の追加
if 'function toggleStandbyLabel' not in js:
    js += '''
  window.toggleStandbyLabel = function(checkbox) {
    const block = checkbox.closest('.step-block');
    if (checkbox.checked) {
      block.classList.add('is-standby-block');
    } else {
      block.classList.remove('is-standby-block');
    }
    updateStepNumbers();
  };
'''

# 5. reorganizeStepBlocksの修正 (9個目以降は3行目へ)
old_reorg = '''        // 料理モード: 1行目(outLeft)と2行目(outRight)へ交互に振り分け
        if (index % 2 === 0) {
          outLeft.appendChild(block);
        } else {
          outRight.appendChild(block);
        }'''
new_reorg = '''        // 料理モード: 1〜8個目は1行目・2行目に交互、9〜12個目は3行目
        if (index < 8) {
          if (index % 2 === 0) {
            outLeft.appendChild(block);
          } else {
            outRight.appendChild(block);
          }
        } else {
          const outFull = document.getElementById('outStepsFull');
          if (outFull) outFull.appendChild(block);
        }'''
js = js.replace(old_reorg, new_reorg)


# シリアライズ時の manufacturingSlip 保存追加
old_serialize = '''const productName = document.getElementById('productName').value.trim();'''
new_serialize = '''const productName = document.getElementById('productName').value.trim();
    const manufacturingSlip = document.getElementById('manufacturingSlip') ? document.getElementById('manufacturingSlip').value.trim() : "";'''
js = js.replace(old_serialize, new_serialize)

old_serialize_ret = '''productName,
      periodStart,'''
new_serialize_ret = '''productName,
      manufacturingSlip,
      periodStart,'''
js = js.replace(old_serialize_ret, new_serialize_ret)

# デシリアライズ時の manufacturingSlip 復元追加
old_deserialize = '''document.getElementById('productName').value = recipe.productName || "";'''
new_deserialize = '''document.getElementById('productName').value = recipe.productName || "";
    if (document.getElementById('manufacturingSlip')) document.getElementById('manufacturingSlip').value = recipe.manufacturingSlip || "";'''
js = js.replace(old_deserialize, new_deserialize)

with open(filepath_js, 'w', encoding='utf-8') as f:
    f.write(js)
