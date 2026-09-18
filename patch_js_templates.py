import os

filepath_js = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
with open(filepath_js, 'r', encoding='utf-8') as f:
    js = f.read()

template_logic = '''
  // --- プレート欄テンプレート挿入機能 ---
  window.applyPlateTemplate = function(select) {
    const val = select.value;
    const textArea = document.getElementById('servingText');
    if (!textArea || !val) return;
    
    let textToInsert = "";
    if (val === "plate1") {
      textToInsert = "①プレート盛り\\n\\nお皿の淵の汚れを確認し、提供します。";
    } else if (val === "plate2") {
      textToInsert = "②ホーロー皿\\n\\nゴム敷を敷いたプレートに乗せて、熱い状態で提供します。";
    } else if (val === "plate3") {
      textToInsert = "③鉄板\\n\\n木台に乗せて、熱い状態で提供します。";
    }
    
    // 現在のテキストの末尾に追加（または上書きするかは要件次第ですが、空ならそのまま、文字があれば追記）
    if (textArea.value.trim() !== "") {
      textArea.value += "\\n\\n" + textToInsert;
    } else {
      textArea.value = textToInsert;
    }
    autoResizeTextarea(textArea);
    select.value = ""; // リセット
  };

  // --- 手順①テンプレート挿入機能 ---
  window.openStep1TemplateModal = function() {
    document.getElementById('step1TemplateModal').style.display = 'flex';
  };
  
  window.closeStep1TemplateModal = function() {
    document.getElementById('step1TemplateModal').style.display = 'none';
  };
  
  window.toggleEquipmentList = function() {
    const format2 = document.querySelector('input[name="step1Format"][value="format2"]').checked;
    document.getElementById('equipmentCheckboxes').style.display = format2 ? 'block' : 'none';
  };
  
  window.insertStep1Template = function() {
    const format = document.querySelector('input[name="step1Format"]:checked').value;
    let textToInsert = "";
    
    if (format === "format1") {
      textToInsert = "手を洗いアルコールをします。\\n\\n使用する備品に汚れが付いていないことを確認します。";
    } else {
      // format2
      const checkedBoxes = document.querySelectorAll('#equipmentCheckboxes input[type="checkbox"]:checked');
      if (checkedBoxes.length === 0) {
        alert("備品を1つ以上選択してください。");
        return;
      }
      const equipments = Array.from(checkedBoxes).map(cb => cb.value).join('・');
      textToInsert = `使用する【${equipments}】に汚れがついていないかを確認します。`;
    }
    
    // 新しい手順ブロックを追加
    window.addStepBlock();
    
    // 追加された最新のブロックを取得
    const blocks = document.querySelectorAll('#outputArea .step-block[data-block-type="step"]');
    if (blocks.length > 0) {
      const latestBlock = blocks[blocks.length - 1];
      const textArea = latestBlock.querySelector('.step-textarea');
      if (textArea) {
        textArea.value = textToInsert;
        autoResizeTextarea(textArea);
      }
    }
    
    closeStep1TemplateModal();
  };
'''

if 'applyPlateTemplate' not in js:
    js += '\n' + template_logic

with open(filepath_js, 'w', encoding='utf-8') as f:
    f.write(js)
