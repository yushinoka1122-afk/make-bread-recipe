  // ==========================================================================
  // ■ SECTION 3: JAVASCRIPT LOGIC
  // ==========================================================================

  // --- 3.1 Base Utilities & Browser Cache Storage ---
  const circleNums = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳"];

  // 安全なlocalStorageアクセスラッパー (SecurityError等によるJSクラッシュの防止)
  const safeStorage = {
    getItem(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem(key, value) {
      try { localStorage.setItem(key, value); } catch (e) {}
    },
    removeItem(key) {
      try { localStorage.removeItem(key); } catch (e) {}
    }
  };

  // テキストエリアの高さ自動調整
  function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  // 生地の連番などの更新
  function updateNumbers(containerId, rowClass) {
    const container = document.getElementById(containerId);
    const rows = container.querySelectorAll('.' + rowClass);
    rows.forEach((row, index) => {
      const numLabel = row.querySelector('.step-num-label');
      if(numLabel) {
        numLabel.innerText = index < circleNums.length ? circleNums[index] : `(${index + 1})`;
      }
    });
  }

  // 手順ブロックの連番更新と自動レイアウト振り分け
  function reorganizeStepBlocks() {
    const blocks = Array.from(document.querySelectorAll('#outputArea .step-block[data-block-type="step"]'));
    const outLeft = document.getElementById('outStepsLeft');
    const outRight = document.getElementById('outStepsRight');
    const outFull = document.getElementById('outStepsFull');

    outLeft.innerHTML = '';
    outRight.innerHTML = '';
    if (outFull) outFull.innerHTML = '';

    const total = blocks.length;
    const leftCount = Math.ceil(total / 2);

    blocks.forEach((block, index) => {
      if (index < leftCount) {
        outLeft.appendChild(block);
      } else {
        outRight.appendChild(block);
      }
    });

    updateBlockNumbers();
    adjustPreviewScale();
  }

  // 手順ブロックヘッダー「手順①」の連番更新
  function updateBlockNumbers() {
    const blocks = document.querySelectorAll('#outputArea .step-block[data-block-type="step"]');
    blocks.forEach((block, index) => {
      const titleSpan = block.querySelector('.block-title');
      const printTitle = block.querySelector('.print-only-block-title');
      const numStr = index < circleNums.length ? circleNums[index] : `(${index + 1})`;
      if(titleSpan) titleSpan.innerText = `手順${numStr}`;
      if(printTitle) printTitle.innerText = `手順${numStr}`;
    });
  }

  // スタンバイブロックのヘッダー「スタンバイ」の更新
  function updateStandbyBlockNumbers() {
    const blocks = document.getElementById('standbyContainer').querySelectorAll('.standby-block');
    blocks.forEach((block) => {
      const titleSpan = block.querySelector('.s-block-title');
      if(titleSpan) titleSpan.innerText = `スタンバイ`;
    });
  }

  // --- 3.2 Block & Row Dynamic DOM Management (Add / Delete) ---
  function removeRow(btn, type) {
    const row = btn.closest('.row, .step-input-row, .ing-row');
    row.remove();
    
    adjustPreviewScale();
  }

  function removeStepBlock(btn) {
    const block = btn.closest('.step-block');
    block.remove();
    reorganizeStepBlocks();
  }

  function removeStandbyBlock(btn) {
    const block = btn.closest('.standby-block');
    block.remove();
    updateStandbyBlockNumbers();
    updateStandbyVisibility();
    adjustPreviewScale();
  }

  function addIngredient() {
    const container = document.getElementById('ingredientsContainer');
    const tr = document.createElement('tr');
    tr.className = 'ing-row';
    tr.innerHTML = `
      <td>
        <input type="text" class="ing-code" placeholder="コード">
        <span class="print-text ing-code-print"></span>
      </td>
      <td>
        <input type="text" class="ing-name" placeholder="品名">
        <span class="print-text ing-name-print"></span>
      </td>
      <td>
        <input type="text" class="ing-amount" placeholder="使用量">
        <span class="print-text ing-amount-print"></span>
      </td>
      <td>
        <select class="ing-unit">
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="ml">ml</option>
          <option value="L">L</option>
          <option value="個">個</option>
          <option value="枚">枚</option>
          <option value="本">本</option>
          <option value="尾">尾</option>
          <option value="杯">杯</option>
          <option value="種">種</option>
          <option value="人前">人前</option>
          <option value="円">円</option>
          <option value="適量">適量</option>
        </select>
      </td>
      <td style="text-align: center; position: relative;">
        <select class="ing-standby">
          <option value=""></option>
          <option value="スタンバイ">スタンバイ</option>
        </select>
        <span class="print-standby-check">✔</span>
      </td>
      <td class="edit-only-col" style="text-align: center;">
        <button type="button" class="del-btn edit-only-btn" onclick="removeRow(this, 'ing')">🗑️</button>
      </td>`;
    container.appendChild(tr);
    adjustPreviewScale();
  }



  function addStepBlock() {
    const container = document.getElementById('outStepsFull');
    const blockId = Date.now();
    const div = document.createElement('div');
    div.className = 'step-block';
    div.setAttribute('data-block-id', blockId);
    div.setAttribute('data-block-type', 'step');
    div.innerHTML = `
      <div class="step-block-header edit-only-row">
        <span class="block-title" style="color:#e91e63;">手順</span>
        <select class="step-template-select edit-only-btn" onchange="applyStepTemplate(this)" style="margin-left: 10px; font-size: 0.8rem; padding: 2px;">
          <option value="">-- 定型文挿入 --</option>
          <option value="proof">ホイロ</option>
          <option value="bake1">焼成①</option>
          <option value="bake2">焼成②（スチーム）</option>
          <option value="bake3">焼成③（2重天板）</option>
          <option value="bake4">焼成④（クッキングシート）</option>
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
    `;
    container.appendChild(div);
    reorganizeStepBlocks();
    
    const newTextarea = div.querySelector('.step-textarea');
    if (newTextarea) autoResizeTextarea(newTextarea);
  }

  function addStandbyBlock() {
    const container = document.getElementById('standbyContainer');
    const blockId = Date.now();
    const div = document.createElement('div');
    div.className = 'step-block standby-block';
    div.setAttribute('data-block-id', 's' + blockId);
    div.setAttribute('data-block-type', 'standby');
    div.innerHTML = `
      <div class="step-block-header edit-only-row">
        <span class="s-block-title" style="color:#2196f3;">スタンバイ</span>
        <button type="button" class="del-btn edit-only-btn" style="width:auto; padding:2px 5px;" onclick="removeStandbyBlock(this)">ブロック削除</button>
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
          <textarea class="step-textarea" placeholder="スタンバイ手順を自由に入力してください" oninput="autoResizeTextarea(this); updateStandbyVisibility();"></textarea>
        </div>
      </div>
    `;
    container.appendChild(div);
    updateStandbyBlockNumbers();
    updateStandbyVisibility();
    adjustPreviewScale();
    
    const newTextarea = div.querySelector('.step-textarea');
    if (newTextarea) autoResizeTextarea(newTextarea);
  }

  // 画像アップローダーの動作処理
  // --- 3.3 Image File Handling & Preview ---
  function triggerFileInput(box) {
    const fileInput = box.querySelector('input[type="file"]');
    if (fileInput) fileInput.click();
  }

  // 画像プレビュー処理
  // 画像圧縮用のユーティリティ関数
  function compressImageBlob(blob, maxWidth = 500) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        let width = img.width;
        let height = img.height;
        
        // 既に規定サイズ以下かつJPEG/WebPなら再圧縮せずに元のデータを返す
        if (width <= maxWidth && height <= maxWidth && (blob.type === 'image/jpeg' || blob.type === 'image/webp')) {
          return resolve(blob);
        }
        
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // JPEG出力時の背景黒透過防止用（白背景を敷く）
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((compressedBlob) => {
          if (compressedBlob) {
            resolve(compressedBlob);
          } else {
            resolve(blob); // 失敗時は元のblobを返す
          }
        }, 'image/jpeg', 0.6);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(blob); // エラー時は元データを返す
      };
      img.src = url;
    });
  }

  async function previewImage(input) {
    const box = input.closest('.image-upload-box');
    const placeholder = box.querySelector('.image-placeholder');
    const preview = box.querySelector('.image-preview');
    const img = preview.querySelector('img');
    
    if (input.files && input.files[0]) {
      const file = input.files[0];
      placeholder.querySelector('span').innerText = '圧縮中...';
      
      const compressedBlob = await compressImageBlob(file);
      const url = URL.createObjectURL(compressedBlob);
      img.src = url;
      box.fileData = compressedBlob;
      
      placeholder.querySelector('span').innerText = '📷 写真を選択';
      placeholder.style.display = 'none';
      preview.style.display = 'flex';
      updateStandbyVisibility();
    }
  }

  // 画像クリア処理
  function clearImage(event, btn) {
    event.stopPropagation();
    const box = btn.closest('.image-upload-box');
    const fileInput = box.querySelector('input[type="file"]');
    const placeholder = box.querySelector('.image-placeholder');
    const preview = box.querySelector('.image-preview');
    const img = preview.querySelector('img');
    
    fileInput.value = '';
    img.src = '';
    box.fileData = null;
    placeholder.style.display = 'flex';
    preview.style.display = 'none';
    updateStandbyVisibility();
  }

  // プレビューの縮小率の調整
  // --- 3.4 Scale Adjustment & Print / Excel Export ---
  function adjustPreviewScale() {
    const wrapper = document.getElementById('editorWrapper');
    const outputArea = document.getElementById('outputArea');
    if (!wrapper || !outputArea) return;

    if (window.innerWidth <= 600) {
      outputArea.style.transform = 'none';
      wrapper.style.height = 'auto';
      return;
    }
    
    const wrapperWidth = wrapper.clientWidth;
    const pageTargetWidth = 840;
    const scale = Math.min(1, (wrapperWidth - 20) / pageTargetWidth);
    
    outputArea.style.transform = `scale(${scale})`;
    outputArea.style.transformOrigin = 'top center';
    
    if (scale < 1) {
      const rect = outputArea.getBoundingClientRect();
      wrapper.style.height = (rect.height + 20) + 'px';
    } else {
      wrapper.style.height = 'auto';
    }
  }

  window.addEventListener('resize', adjustPreviewScale);

  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('#ingredientsContainer .ing-row').forEach(row => {
      const codeInput = row.querySelector('.ing-code');
      const nameInput = row.querySelector('.ing-name');
      const amountInput = row.querySelector('.ing-amount');
      
      const codeSpan = row.querySelector('.ing-code-print');
      const nameSpan = row.querySelector('.ing-name-print');
      const amountSpan = row.querySelector('.ing-amount-print');
      
      if (codeInput && codeSpan) codeSpan.innerText = codeInput.value;
      if (nameInput && nameSpan) nameSpan.innerText = nameInput.value;
      if (amountInput && amountSpan) amountSpan.innerText = amountInput.value;
    });
  });

  // Excelダウンロード処理
  function downloadExcel() {
    const data = [];
    
    // 基本情報
    const pStart = document.getElementById('periodStart').value;
    const pEnd = document.getElementById('periodEnd').value;
    data.push(["実施期間", `${pStart} ～ ${pEnd}`, "商品名称", document.getElementById('productName').value]);
    data.push([]);
    
    // 食材
    data.push(["コード", "品名", "使用量", "スタンバイ"]);
    document.querySelectorAll('#ingredientsContainer .ing-row').forEach(row => {
      const code = row.querySelector('.ing-code').value;
      const name = row.querySelector('.ing-name').value;
      const amount = row.querySelector('.ing-amount').value;
      const unit = row.querySelector('.ing-unit').value;
      const standby = row.querySelector('.ing-standby').value === 'スタンバイ';
      if(code || name || amount) {
        data.push([code, name, `${amount}${unit}`, standby ? "〇" : ""]);
      }
    });
    data.push([]);

    // 規格と工程条件
    data.push(["項目", "成型", "ホイロ", "焼成"]);
    const moldD = `縦${document.getElementById('moldL').value}×横${document.getElementById('moldW').value}×高さ${document.getElementById('moldH').value} cm`;
    const proofD = `縦${document.getElementById('proofL').value}×横${document.getElementById('proofW').value}×高さ${document.getElementById('proofH').value} cm`;
    const bakeD = `縦${document.getElementById('bakeL').value}×横${document.getElementById('bakeW').value}×高さ${document.getElementById('bakeH').value} cm`;
    data.push(["寸法", moldD, proofD, bakeD]);
    data.push([
      "条件", 
      `1鉄板最大載せ数: ${document.getElementById('maxLoad').value || "6"} 個`, 
      `ホイロ時間: ${document.getElementById('proofTime').value || "40"} 分`, 
      `焼成時間: ${document.getElementById('bakeTime').value || "10"} 分`
    ]);
    data.push([]);

    // 提供方法
    data.push(["提供方法", document.getElementById('servingText').value]);
    data.push([]);

    // 手順
    const blocks = document.querySelectorAll('#outputArea .step-block[data-block-type="step"]');
    blocks.forEach((block, index) => {
      const numStr = index < circleNums.length ? circleNums[index] : `(${index + 1})`;
      data.push([`手順${numStr}`]);
      
      const textarea = block.querySelector('.step-textarea');
      if (textarea && textarea.value.trim()) {
        const lines = textarea.value.trim().split('\n');
        lines.forEach((line) => {
          let cleanedLine = line.trim();
          if (cleanedLine) {
            if (cleanedLine.startsWith('・')) {
              cleanedLine = cleanedLine.substring(1).trim();
            }
            data.push(["・", cleanedLine]);
          }
        });
      }
      data.push([]);
    });

    // スタンバイ
    const sBlocks = document.querySelectorAll('#standbyContainer .standby-block');
    let hasStandbyData = false;
    const sData = [];
    sBlocks.forEach((block) => {
      sData.push([`スタンバイ`]);
      
      let hasText = false;
      const textarea = block.querySelector('.step-textarea');
      if (textarea && textarea.value.trim()) {
        const lines = textarea.value.trim().split('\n');
        lines.forEach((line) => {
          let cleanedLine = line.trim();
          if (cleanedLine) {
            if (cleanedLine.startsWith('・')) {
              cleanedLine = cleanedLine.substring(1).trim();
            }
            sData.push(["・", cleanedLine]);
            hasText = true;
            hasStandbyData = true;
          }
        });
      }
      if(hasText) sData.push([]);
    });
    if (hasStandbyData) {
      sData.forEach(r => data.push(r));
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "手順書");

    const filename = document.getElementById('productName').value || 'recipe';
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
  
  // --- 3.5 Step Templates & Section Visibility ---
  // テンプレートデータ


  function applyStepTemplate(selectObj) {
    const tempKey = selectObj.value;
    if (!tempKey) return;

    let proofTimeVal = document.getElementById('proofTime').value.trim() || "40";
    let bakeTimeVal = document.getElementById('bakeTime').value.trim() || "10";
    
    // 分マークをあらかじめ除去して統一
    proofTimeVal = proofTimeVal.replace(/分/g, "");
    bakeTimeVal = bakeTimeVal.replace(/分/g, "");

    let lines = [];
    if (tempKey === "proof") {
      lines = [
        `ホイロ：${proofTimeVal}分`,
        "※室温や生地状態により変化するため、最終判断はホイロ規格を基準にしてください。"
      ];
    } else if (tempKey === "bake1") {
      lines = [
        `焼成：${bakeTimeVal}分（数が少ない場合は短縮）`,
        "※オーブンや生地状態により変化するため、焼き色を基準にしてください。"
      ];
    } else if (tempKey === "bake2") {
      lines = [
        `スチームをかけて焼成：${bakeTimeVal}分（数が少ない場合は短縮）`,
        "※オーブンや生地状態により変化するため、焼き色を基準にしてください。"
      ];
    } else if (tempKey === "bake3") {
      lines = [
        `2重鉄板にして焼成：${bakeTimeVal}分（数が少ない場合は短縮）`,
        "※オーブンや生地状態により変化するため、焼き色を基準にしてください。"
      ];
    } else if (tempKey === "bake4") {
      lines = [
        `クッキングシートを被せ、上に鉄板をのせて焼成：${bakeTimeVal}分（数が少ない場合は短縮）`,
        "※オーブンや生地状態により変化するため、焼き色を基準にしてください。"
      ];
    }

    const block = selectObj.closest('.step-block');
    const textarea = block.querySelector('.step-textarea');
    
    if (textarea) {
      textarea.value = lines.join('\n');
      autoResizeTextarea(textarea);
    }

    selectObj.value = "";
    adjustPreviewScale();
  }

  function updateStandbyVisibility() {
    const section = document.getElementById('standbySection');
    let hasContent = false;
    
    document.querySelectorAll('#standbyContainer .standby-block').forEach(block => {
      const imgInput = block.querySelector('.block-img');
      if (imgInput && imgInput.files && imgInput.files[0]) hasContent = true;
      const textarea = block.querySelector('.step-textarea');
      if (textarea && textarea.value.trim()) hasContent = true;
    });
    
    if (hasContent) {
      section.classList.remove('print-empty-hide');
    } else {
      section.classList.add('print-empty-hide');
    }
  }

  // 初期化
  reorganizeStepBlocks();
  updateStandbyBlockNumbers();
  updateStandbyVisibility();

  // --- 3.6 Master Data Processing & Spreadsheet Synchronization ---
  // === マスタデータ連携・サジェスト・スプレッドシートデータ連携 ===
  let menuMaster = {
    "1001": {
      name: "ざくざく枝豆チーズスティック (デモ)",
      ingredients: [
        { code: "E001", name: "スティック用パン生地", amount: "60", unit: "g" },
        { code: "E002", name: "冷凍むき枝豆", amount: "25", unit: "g" },
        { code: "E003", name: "シュレッドチーズ", amount: "15", unit: "g" },
        { code: "E004", name: "マヨネーズ", amount: "5", unit: "g" }
      ]
    },
    "1002": {
      name: "スティッククロワッサン (デモ)",
      ingredients: [
        { code: "C001", name: "クロワッサン板生地", amount: "50", unit: "g" },
        { code: "C002", name: "艶出し用卵液", amount: "3", unit: "g" }
      ]
    },
    "1003": {
      name: "とろ～りチーズオムレツパン (デモ)",
      ingredients: [
        { code: "E001", name: "スティック用パン生地", amount: "60", unit: "g" },
        { code: "O001", name: "とろっとスクランブルエッグ", amount: "35", unit: "g" },
        { code: "E003", name: "シュレッドチーズ", amount: "10", unit: "g" }
      ]
    }
  };

  function processMasterRows(rows, sourceLabel) {
    const statusDiv = document.getElementById('masterStatus');
    menuMaster = {};

    let headerIdx = -1;
    let colMap = {};
    
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      if (!rows[i]) continue;
      const rowStr = rows[i].map(c => String(c || '')).join('');
      if (rowStr.includes("メニュー名称") || rowStr.includes("商品名称") || rowStr.includes("商品コード") || rowStr.includes("メニューコード")) {
        headerIdx = i;
        for (let j = 0; j < rows[i].length; j++) {
          const hName = String(rows[i][j] || '').trim();
          if (hName === "メニューコード" || hName === "ﾒﾆｭｰｺｰﾄﾞ") colMap.menuCode = j;
          else if (hName === "メニュー名称" || hName === "ﾒﾆｭｰ名称") colMap.menuName = j;
          else if (hName === "商品コード") colMap.ingCode = j;
          else if (hName === "商品名称") colMap.ingName = j;
          else if (hName === "正味使用量" || hName === "使用量") colMap.ingAmount = j;
          else if (hName === "正味単位" || hName === "単位") colMap.ingUnit = j;
        }
        break;
      }
    }
    
    // もしどうしても見つからなければ、従来の固定インデックスにフォールバックする
    if (headerIdx === -1 || colMap.menuCode === undefined) {
      colMap = {
        menuCode: 3, menuName: 4, ingCode: 10, ingName: 11, ingAmount: 12, ingUnit: 13
      };
      headerIdx = 0;
    }
    
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const cols = rows[i];
      if (!cols || cols.length === 0) continue;
      
      let menuCode = cols[colMap.menuCode] ? String(cols[colMap.menuCode]).trim() : "";
      let menuName = cols[colMap.menuName] ? String(cols[colMap.menuName]).trim() : "";
      const ingCode = cols[colMap.ingCode] ? String(cols[colMap.ingCode]).trim() : "";
      const ingName = cols[colMap.ingName] ? String(cols[colMap.ingName]).trim() : "";
      const ingAmount = cols[colMap.ingAmount] ? String(cols[colMap.ingAmount]).trim() : "";
      const ingUnit = cols[colMap.ingUnit] ? String(cols[colMap.ingUnit]).trim() : "";
      
      if (!menuCode || menuCode === "ﾒﾆｭｰｺｰﾄﾞ" || menuCode === "メニューコード") continue;
      
      if (!menuMaster[menuCode]) {
        menuMaster[menuCode] = {
          name: menuName,
          ingredients: []
        };
      }
      
      if (ingCode || ingName) {
        // ヘッダー文字列の混入を防ぐ
        if (ingCode !== "商品コード" && ingName !== "商品名称") {
          menuMaster[menuCode].ingredients.push({
            code: ingCode || "",
            name: ingName || "",
            amount: ingAmount || "",
            unit: ingUnit || "g"
          });
        }
      }
    }
    
    const menuCount = Object.keys(menuMaster).length;
    statusDiv.innerText = `マスタデータ読込完了 (${menuCount}件のメニュー) (${sourceLabel})`;
    statusDiv.style.backgroundColor = "#e8f5e9";
    statusDiv.style.color = "#2e7d32";
    
    safeStorage.setItem('cachedMenuMaster', JSON.stringify(menuMaster));
    safeStorage.setItem('cachedMenuCount', menuCount);
    safeStorage.setItem('cachedSourceLabel', sourceLabel);
    safeStorage.setItem('cachedVersion', "v4");
  }

  async function loadMasterData(isAuto = false) {
    const statusDiv = document.getElementById('masterStatus');
    if (!isAuto) {
      statusDiv.innerText = "マスタデータをスプレッドシートから読み込んでいます...";
      statusDiv.style.backgroundColor = "#ffe0b2";
      statusDiv.style.color = "#e65100";
    }

    const url = "https://docs.google.com/spreadsheets/d/1FUpFIMRcoOf-f5xDkcJGNparud13cgINV7JQehHznZ8/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent("BQ原価レシピ7");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("ネットワークエラーが発生しました。");
      const arrayBuffer = await response.arrayBuffer();
      const decoder = new TextDecoder('utf-8');
      const csvText = decoder.decode(arrayBuffer);
      
      const lines = csvText.split(/\r?\n/);
      const rows = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim()) {
          rows.push(parseCSVLine(lines[i]));
        }
      }
      
      processMasterRows(rows, isAuto ? "スプシから自動更新" : "スプシから同期");
      
    } catch (error) {
      console.error(error);
      if (!isAuto) {
        statusDiv.innerText = "同期失敗：上の『ローカル連携』からダウンロードしたExcel/CSVファイルを読み込めます。";
        statusDiv.style.backgroundColor = "#ffebee";
        statusDiv.style.color = "#c62828";
      } else {
        const menuCount = Object.keys(menuMaster).length;
        const sourceLabel = safeStorage.getItem('cachedSourceLabel') || "キャッシュ";
        statusDiv.innerText = `マスタデータ読込完了 (${menuCount}件のメニュー) (${sourceLabel})`;
        statusDiv.style.backgroundColor = "#e8f5e9";
        statusDiv.style.color = "#2e7d32";
      }
    }
  }

  function parseCSVLine(text) {
    const result = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        inQuote = !inQuote;
      } else if (c === ',' && !inQuote) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  }

  function populateIngredients(ingredients) {
    const container = document.getElementById('ingredientsContainer');
    container.innerHTML = '';
    
    if (ingredients.length === 0) {
      addIngredient();
      return;
    }
    
    ingredients.forEach(ing => {
      const tr = document.createElement('tr');
      tr.className = ing.standby ? 'ing-row is-standby' : 'ing-row';
      
      const units = ["g", "kg", "ml", "L", "個", "枚", "本", "尾", "杯", "種", "人前", "円", "適量"];
      let unitOptions = "";
      units.forEach(u => {
        const selected = u === ing.unit ? " selected" : "";
        unitOptions += `<option value="${u}"${selected}>${u}</option>`;
      });
      
      tr.innerHTML = `
        <td>
          <input type="text" class="ing-code" value="${ing.code}" placeholder="コード">
          <span class="print-text ing-code-print"></span>
        </td>
        <td>
          <input type="text" class="ing-name" value="${ing.name}" placeholder="品名">
          <span class="print-text ing-name-print"></span>
        </td>
        <td>
          <input type="text" class="ing-amount" value="${ing.amount}" placeholder="使用量">
          <span class="print-text ing-amount-print"></span>
        </td>
        <td>
          <select class="ing-unit">
            ${unitOptions}
          </select>
        </td>
        <td style="text-align: center; position: relative;">
          <select class="ing-standby">
            <option value=""${ing.standby ? '' : ' selected'}></option>
            <option value="スタンバイ"${ing.standby ? ' selected' : ''}>スタンバイ</option>
          </select>
          <span class="print-standby-check">✔</span>
        </td>
        <td class="edit-only-col" style="text-align: center;">
          <button type="button" class="del-btn edit-only-btn" onclick="removeRow(this, 'ing')">🗑️</button>
        </td>
      `;
      container.appendChild(tr);
    });
    adjustPreviewScale();
  }

  document.addEventListener('DOMContentLoaded', () => {
    reorganizeStepBlocks();
    updateStandbyBlockNumbers();
    updateStandbyVisibility();

    // SortableJS Drag-and-Drop
    if (typeof Sortable !== 'undefined') {
      const sortableOptions = {
        group: 'steps',
        animation: 150,
        handle: '.step-block-header',
        onEnd: function() {
          reorganizeStepBlocks();
        }
      };
      new Sortable(document.getElementById('outStepsLeft'), sortableOptions);
      new Sortable(document.getElementById('outStepsRight'), sortableOptions);
      new Sortable(document.getElementById('outStepsFull'), sortableOptions);
    }
    updateStandbyVisibility();

    // 初期時にすでにあるテキストエリアのサイズを調整
    document.querySelectorAll('.step-textarea').forEach(el => {
      autoResizeTextarea(el);
    });

    const CACHE_VERSION = "v4";
    const cachedVersion = safeStorage.getItem('cachedVersion');
    const cachedData = safeStorage.getItem('cachedMenuMaster');
    
    if (cachedData && cachedVersion === CACHE_VERSION) {
      try {
        menuMaster = JSON.parse(cachedData);
        const menuCount = safeStorage.getItem('cachedMenuCount') || Object.keys(menuMaster).length;
        const sourceLabel = safeStorage.getItem('cachedSourceLabel') || "キャッシュ";
        const statusDiv = document.getElementById('masterStatus');
        statusDiv.innerText = `マスタデータ読込完了 (${menuCount}件のメニュー) (${sourceLabel})`;
        statusDiv.style.backgroundColor = "#e8f5e9";
        statusDiv.style.color = "#2e7d32";
        
        // キャッシュ読み込み後、バックグラウンドでGoogleスプレッドシートから自動更新を行う
        loadMasterData(true);
      } catch (e) {
        console.error("Cache load error", e);
        loadMasterData(false);
      }
    } else {
      safeStorage.removeItem('cachedMenuMaster');
      safeStorage.removeItem('cachedMenuCount');
      safeStorage.removeItem('cachedSourceLabel');
      safeStorage.setItem('cachedVersion', CACHE_VERSION);
      loadMasterData(false);
    }
    
    const menuCodeInput = document.getElementById('menuCode');
    const productNameInput = document.getElementById('productName');
    
    if (menuCodeInput) {
      menuCodeInput.addEventListener('input', (e) => {
        const code = e.target.value.trim();
        if (menuMaster[code]) {
          productNameInput.value = menuMaster[code].name;
          handleMenuCodeSelection(code);
        } else {
          updateDBStatusLabel(null);
        }
      });
    }
    
    if (productNameInput) {
      productNameInput.addEventListener('input', (e) => {
        const name = e.target.value.trim();
        const foundCode = Object.keys(menuMaster).find(code => menuMaster[code].name === name);
        if (foundCode) {
          menuCodeInput.value = foundCode;
          handleMenuCodeSelection(foundCode);
        } else {
          updateDBStatusLabel(null);
        }
      });
    }
  });

  // サジェスト機能
  let activeSuggestTarget = null;
  let activeSuggestValue = null;

  // --- 3.7 Auto-Complete Suggest List Engine ---
  function closeAllSuggestions() {
    document.querySelectorAll('.suggest-list').forEach(el => el.remove());
    activeSuggestTarget = null;
    activeSuggestValue = null;
  }

  function showSuggestions(inputEl) {
    const val = inputEl.value.trim();
    if (activeSuggestTarget === inputEl && activeSuggestValue === val) {
      if (inputEl.parentElement.querySelector('.suggest-list')) {
        return;
      }
    }

    closeAllSuggestions();
    activeSuggestTarget = inputEl;
    activeSuggestValue = val;

    const wrapper = inputEl.parentElement;
    if (!wrapper.classList.contains('autocomplete-wrapper')) return;

    let matches = [];
    const valUpper = val.toUpperCase();

    for (const [code, menu] of Object.entries(menuMaster)) {
      const matchCode = code.toUpperCase().includes(valUpper);
      const matchName = menu.name.toUpperCase().includes(valUpper);
      if (!val || matchCode || matchName) {
        matches.push({
          code: code,
          name: menu.name
        });
      }
    }

    if (matches.length === 0) return;

    matches = matches.slice(0, 50);

    const listDiv = document.createElement('div');
    listDiv.className = 'suggest-list';
    if (inputEl.id === 'menuCode') {
      listDiv.style.right = '0';
      listDiv.style.left = 'auto';
    }

    matches.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'suggest-item';
      const isSaved = savedMenuCodes.has(item.code);
      itemDiv.innerText = `${isSaved ? '💾 ' : ''}${item.code} : ${item.name}`;
      
      itemDiv.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        document.getElementById('menuCode').value = item.code;
        document.getElementById('productName').value = item.name;
        closeAllSuggestions();
        handleMenuCodeSelection(item.code);
      });
      listDiv.appendChild(itemDiv);
    });

    wrapper.appendChild(listDiv);
  }

  function handleInputEvent(e) {
    let target = e.target;
    if (!target) return;
    
    // classListの存在確認を含め安全に取得
    let isArrowClick = target.classList && target.classList.contains('dropdown-arrow');
    if (isArrowClick) {
      target = target.parentElement ? target.parentElement.querySelector('input') : null;
    }
    if (!target) return;

    if (target.id === 'menuCode' || target.id === 'productName') {
      if (e.type === 'click' && isArrowClick) {
        const existingList = target.parentElement ? target.parentElement.querySelector('.suggest-list') : null;
        if (existingList) {
          closeAllSuggestions();
          return;
        }
        target.focus();
      }
      showSuggestions(target);
    }
  }

  // --- 3.8 Global Event Bindings & Initializers ---
  document.addEventListener('input', handleInputEvent);
  document.addEventListener('focusin', handleInputEvent);
  document.addEventListener('click', handleInputEvent);

  document.addEventListener('click', function(e) {
    if (!e.target || !e.target.closest || !e.target.closest('.autocomplete-wrapper')) {
      closeAllSuggestions();
    }
  });

  // スタンバイセレクトボックス変更時のクラス付与処理 (印刷用スタイルとの連携)
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('ing-standby')) {
      const row = e.target.closest('.ing-row');
      if (row) {
        if (e.target.value === 'スタンバイ') {
          row.classList.add('is-standby');
        } else {
          row.classList.remove('is-standby');
        }
      }
    }
  });

  document.addEventListener('focusout', function(e) {
    setTimeout(() => {
      if (document.activeElement !== e.target && (!document.activeElement || !document.activeElement.closest || !document.activeElement.closest('.autocomplete-wrapper'))) {
        closeAllSuggestions();
      }
    }, 150);
  });

  // ローカルファイル読込
  const masterFileInput = document.getElementById('masterFileInput');
  if (masterFileInput) {
    masterFileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;

      const statusDiv = document.getElementById('masterStatus');
      statusDiv.innerText = "ファイルを解析しています...";
      statusDiv.style.backgroundColor = "#ffe0b2";
      statusDiv.style.color = "#e65100";

      const fileName = file.name;
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

      const reader = new FileReader();
      if (isExcel) {
        reader.onload = function(evt) {
          try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            processMasterRows(rows, `Excel: ${fileName}`);
          } catch (err) {
            console.error(err);
            statusDiv.innerText = "Excelファイルの解析に失敗しました。";
            statusDiv.style.backgroundColor = "#ffebee";
            statusDiv.style.color = "#c62828";
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = function(evt) {
          try {
            const text = evt.target.result;
            const lines = text.split(/\r?\n/);
            const rows = [];
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].trim()) {
                rows.push(parseCSVLine(lines[i]));
              }
            }
            processMasterRows(rows, `CSV: ${fileName}`);
          } catch (err) {
            console.error(err);
            statusDiv.innerText = "CSVファイルの解析に失敗しました。";
            statusDiv.style.backgroundColor = "#ffebee";
            statusDiv.style.color = "#c62828";
          }
        };
        reader.readAsText(file, 'Shift_JIS');
      }
    });
  }

  // --- 3.1.1 IndexedDB Database Wrapper for Recipes ---
  class RecipeDB {
    constructor() {
      this.dbName = "RecipeMakerDB";
      this.dbVersion = 1;
      this.storeName = "recipes";
      this.db = null;
    }

    init() {
      return new Promise((resolve, reject) => {
        try {
          if (!window.indexedDB) {
            throw new Error("IndexedDB is not supported in this browser.");
          }
          const request = indexedDB.open(this.dbName, this.dbVersion);
          
          request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(this.storeName)) {
              db.createObjectStore(this.storeName, { keyPath: "menuCode" });
            }
          };

          request.onsuccess = (e) => {
            this.db = e.target.result;
            resolve(this.db);
          };

          request.onerror = (e) => {
            console.error("IndexedDB open error:", e.target.error);
            reject(e.target.error || new Error("Permission denied to open IndexedDB"));
          };
        } catch (err) {
          console.error("IndexedDB initialization error:", err);
          reject(err);
        }
      });
    }

    saveRecipe(recipe) {
      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error("Database not initialized"));
          return;
        }
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(recipe);

        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
      });
    }

    getRecipe(menuCode) {
      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error("Database not initialized"));
          return;
        }
        const transaction = this.db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(menuCode);

        request.onsuccess = (e) => resolve(e.target.result || null);
        request.onerror = (e) => reject(e.target.error);
      });
    }

    deleteRecipe(menuCode) {
      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error("Database not initialized"));
          return;
        }
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(menuCode);

        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
      });
    }

    getAllCodes() {
      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error("Database not initialized"));
          return;
        }
        const transaction = this.db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.getAllKeys();

        request.onsuccess = (e) => resolve(e.target.result || []);
        request.onerror = (e) => reject(e.target.error);
      });
    }

    getAllRecipes() {
      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error("Database not initialized"));
          return;
        }
        const transaction = this.db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = (e) => resolve(e.target.result || []);
        request.onerror = (e) => reject(e.target.error);
      });
    }
  }

  const recipeDB = new RecipeDB();
  const savedMenuCodes = new Set();

  // DBの初期化と保存済みコード一覧のロード
  recipeDB.init()
    .then(() => recipeDB.getAllCodes())
    .then(codes => {
      codes.forEach(code => savedMenuCodes.add(code));
      console.log("Database initialized. Saved menu codes:", Array.from(savedMenuCodes));
      
      // 初期状態のメニューコード入力がある場合は表示状態を同期
      const currentCode = document.getElementById('menuCode').value.trim();
      if (currentCode) {
        updateDBStatusLabel(currentCode);
      }
      updateSavedCount();
    })
    .catch(err => {
      console.error("Failed to initialize database:", err);
    });

  // DB連携のUI表示メッセージ更新
  function showStatusMessage(text, type = "info") {
    const statusDiv = document.getElementById('dbStatus');
    if (!statusDiv) return;
    
    statusDiv.innerText = text;
    statusDiv.style.color = "#fff";
    
    if (type === "success") {
      statusDiv.style.backgroundColor = "#2e7d32"; // 緑
    } else if (type === "error") {
      statusDiv.style.backgroundColor = "#c62828"; // 赤
    } else if (type === "info") {
      statusDiv.style.backgroundColor = "#0288d1"; // 青
    } else {
      statusDiv.style.backgroundColor = "#78909c"; // グレー
      statusDiv.style.color = "#37474f";
    }
  }

  function updateDBStatusLabel(code) {
    const statusDiv = document.getElementById('dbStatus');
    if (!statusDiv) return;
    
    if (!code) {
      statusDiv.innerText = "✏️ 新規手順書";
      statusDiv.style.backgroundColor = "#e2e8f0";
      statusDiv.style.color = "#475569";
      return;
    }
    
    if (savedMenuCodes.has(code)) {
      statusDiv.innerText = "💾 保存済み";
      statusDiv.style.backgroundColor = "#c8e6c9";
      statusDiv.style.color = "#256029";
    } else {
      statusDiv.innerText = "✏️ 未保存の新規";
      statusDiv.style.backgroundColor = "#ffe0b2";
      statusDiv.style.color = "#e65100";
    }
  }

  // 手順書オブジェクトのシリアライズ
  async function serializeCurrentRecipe() {
    const menuCode = document.getElementById('menuCode').value.trim();
    const productName = document.getElementById('productName').value.trim();
    if (!menuCode) return null;

    const periodStart = document.getElementById('periodStart').value;
    const periodEnd = document.getElementById('periodEnd').value;

    const moldL = document.getElementById('moldL').value;
    const moldW = document.getElementById('moldW').value;
    const moldH = document.getElementById('moldH').value;
    const maxLoad = document.getElementById('maxLoad').value;

    const proofL = document.getElementById('proofL').value;
    const proofW = document.getElementById('proofW').value;
    const proofH = document.getElementById('proofH').value;
    const proofTime = document.getElementById('proofTime').value;

    const bakeL = document.getElementById('bakeL').value;
    const bakeW = document.getElementById('bakeW').value;
    const bakeH = document.getElementById('bakeH').value;
    const bakeTime = document.getElementById('bakeTime').value;

    const servingText = document.getElementById('servingText') ? document.getElementById('servingText').value.trim() : "";

    // 使用食材
    const ingredients = [];
    document.querySelectorAll('#ingredientsContainer .ing-row').forEach(row => {
      const code = row.querySelector('.ing-code').value.trim();
      const name = row.querySelector('.ing-name').value.trim();
      const amount = row.querySelector('.ing-amount').value.trim();
      const unit = row.querySelector('.ing-unit').value;
      const standby = row.querySelector('.ing-standby').value === 'スタンバイ';
      if (code || name || amount) {
        ingredients.push({ code, name, amount, unit, standby });
      }
    });

    // 各手順ブロック
    const manualSteps = [];
    const stepBlocks = document.querySelectorAll('#outputArea .step-block[data-block-type="step"]');
    for (let block of stepBlocks) {
      const text = block.querySelector('.step-textarea').value;
      const uploadBox = block.querySelector('.image-upload-box');
      const imageBlob = uploadBox.fileData || null;
      manualSteps.push({ text, imageBlob });
    }

    // スタンバイブロック
    const standbySteps = [];
    const standbyBlocks = document.querySelectorAll('#standbyContainer .standby-block');
    for (let block of standbyBlocks) {
      const text = block.querySelector('.step-textarea').value;
      const uploadBox = block.querySelector('.image-upload-box');
      const imageBlob = uploadBox.fileData || null;
      standbySteps.push({ text, imageBlob });
    }

    // 固定位置の画像
    const mainImageBlob = document.getElementById('mainImage').closest('.image-upload-box').fileData || null;
    const moldImageBlob = document.getElementById('moldImg').closest('.image-upload-box').fileData || null;
    const proofImageBlob = document.getElementById('proofImg').closest('.image-upload-box').fileData || null;
    const bakeImageBlob = document.getElementById('bakeImg').closest('.image-upload-box').fileData || null;

    return {
      menuCode,
      productName,
      periodStart,
      periodEnd,
      moldL, moldW, moldH, maxLoad,
      proofL, proofW, proofH, proofTime,
      bakeL, bakeW, bakeH, bakeTime,
      servingText,
      ingredients,
      manualSteps,
      standbySteps,
      mainImageBlob,
      moldImageBlob,
      proofImageBlob,
      bakeImageBlob,
      lastUpdated: Date.now()
    };
  }

  // 手順書オブジェクトのデシリアライズ（画面への反映）
  function loadRecipeFromDB(recipe) {
    if (!recipe) return;

    document.getElementById('menuCode').value = recipe.menuCode || "";
    document.getElementById('productName').value = recipe.productName || "";
    document.getElementById('periodStart').value = recipe.periodStart || "";
    document.getElementById('periodEnd').value = recipe.periodEnd || "";
    if (document.getElementById('brandCategory')) document.getElementById('brandCategory').value = recipe.brandCategory || "";
    if (document.getElementById('menuCategory')) document.getElementById('menuCategory').value = recipe.menuCategory || "";

    document.getElementById('moldL').value = recipe.moldL || 0;
    document.getElementById('moldW').value = recipe.moldW || 0;
    document.getElementById('moldH').value = recipe.moldH || 0;
    document.getElementById('maxLoad').value = recipe.maxLoad || "6";

    document.getElementById('proofL').value = recipe.proofL || 0;
    document.getElementById('proofW').value = recipe.proofW || 0;
    document.getElementById('proofH').value = recipe.proofH || 0;
    document.getElementById('proofTime').value = recipe.proofTime || "40";

    document.getElementById('bakeL').value = recipe.bakeL || 0;
    document.getElementById('bakeW').value = recipe.bakeW || 0;
    document.getElementById('bakeH').value = recipe.bakeH || 0;
    document.getElementById('bakeTime').value = recipe.bakeTime || "10";

    // 画像の復元
    restoreImageHelper('mainImage', recipe.mainImageBlob);
    restoreImageHelper('moldImg', recipe.moldImageBlob);
    restoreImageHelper('proofImg', recipe.proofImageBlob);
    restoreImageHelper('bakeImg', recipe.bakeImageBlob);

    if (document.getElementById('servingText')) {
      document.getElementById('servingText').value = recipe.servingText || "";
      autoResizeTextarea(document.getElementById('servingText'));
    }

    // 食材テーブルの復元
    populateIngredients(recipe.ingredients || []);

    // 各手順ブロックの復元
    const stepsLeft = document.getElementById('outStepsLeft');
    const stepsRight = document.getElementById('outStepsRight');
    const stepsFull = document.getElementById('outStepsFull');
    stepsLeft.innerHTML = '';
    stepsRight.innerHTML = '';
    stepsFull.innerHTML = '';

    if (recipe.manualSteps && recipe.manualSteps.length > 0) {
      recipe.manualSteps.forEach((step, index) => {
        const blockId = Date.now() + index;
        const div = document.createElement('div');
        div.className = 'step-block';
        div.setAttribute('data-block-id', blockId);
        div.setAttribute('data-block-type', 'step');
        div.innerHTML = `
          <div class="step-block-header edit-only-row">
            <span class="block-title" style="color:#e91e63;">手順</span>
            <select class="step-template-select edit-only-btn" onchange="applyStepTemplate(this)" style="margin-left: 10px; font-size: 0.8rem; padding: 2px;">
              <option value="">-- 定型文挿入 --</option>
              <option value="proof">ホイロ</option>
              <option value="bake1">焼成①</option>
              <option value="bake2">焼成②（スチーム）</option>
              <option value="bake3">焼成③（2重天板）</option>
              <option value="bake4">焼成④（クッキングシート）</option>
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
        `;
        div.querySelector('.step-textarea').value = step.text || "";
        const box = div.querySelector('.image-upload-box');
        if (step.imageBlob) {
          restoreImageHelperOnBox(box, step.imageBlob);
        }
        
        stepsFull.appendChild(div);
        autoResizeTextarea(div.querySelector('.step-textarea'));
      });
    } else {
      insertBlankStepBlock();
    }
    reorganizeStepBlocks();

    // スタンバイブロックの復元
    const standbyContainer = document.getElementById('standbyContainer');
    standbyContainer.innerHTML = '';
    if (recipe.standbySteps && recipe.standbySteps.length > 0) {
      recipe.standbySteps.forEach((step, index) => {
        const div = document.createElement('div');
        div.className = 'step-block standby-block';
        div.innerHTML = `
          <div class="edit-only-row" style="margin-bottom: 2px; display: flex; justify-content: space-between; align-items: center;">
            <strong class="standby-title" style="color: #0d47a1;">スタンバイ</strong>
            <button type="button" class="del-btn edit-only-btn" onclick="removeStandbyBlock(this)">削除</button>
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
              <textarea class="step-textarea" placeholder="スタンバイ手順を自由に入力してください" oninput="autoResizeTextarea(this); updateStandbyVisibility();"></textarea>
            </div>
          </div>
        `;
        div.querySelector('.step-textarea').value = step.text || "";
        const box = div.querySelector('.image-upload-box');
        if (step.imageBlob) {
          restoreImageHelperOnBox(box, step.imageBlob);
        }
        standbyContainer.appendChild(div);
        autoResizeTextarea(div.querySelector('.step-textarea'));
      });
    } else {
      insertBlankStandbyBlock();
    }
    updateStandbyBlockNumbers();
    updateStandbyVisibility();

    updateDBStatusLabel(recipe.menuCode);
    adjustPreviewScale();
  }

  function restoreImageHelper(inputId, blob) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const box = input.closest('.image-upload-box');
    restoreImageHelperOnBox(box, blob);
  }

  async function restoreImageHelperOnBox(box, blob) {
    if (!box) return;
    const placeholder = box.querySelector('.image-placeholder');
    const preview = box.querySelector('.image-preview');
    const img = preview.querySelector('img');
    const fileInput = box.querySelector('input[type="file"]');
    
    if (blob) {
      // 古い重い画像の場合はここで自動圧縮！
      const compressedBlob = await compressImageBlob(blob);
      
      try {
        const file = new File([compressedBlob], "image.jpeg", { type: compressedBlob.type || "image/jpeg" });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        box.fileData = file;
      } catch (e) {
        console.error("Failed to restore files list:", e);
        box.fileData = compressedBlob;
      }
      
      const url = URL.createObjectURL(compressedBlob);
      img.src = url;
      placeholder.style.display = 'none';
      preview.style.display = 'flex';
    } else {
      fileInput.value = '';
      img.src = '';
      box.fileData = null;
      placeholder.style.display = 'flex';
      preview.style.display = 'none';
    }
  }

  function insertBlankStepBlock() {
    const container = document.getElementById('outStepsFull');
    const div = document.createElement('div');
    div.className = 'step-block';
    div.setAttribute('data-block-type', 'step');
    div.innerHTML = `
      <div class="step-block-header edit-only-row">
        <span class="block-title" style="color:#e91e63;">手順①</span>
        <select class="step-template-select edit-only-btn" onchange="applyStepTemplate(this)" style="margin-left: 10px; font-size: 0.8rem; padding: 2px;">
          <option value="">-- 定型文挿入 --</option>
          <option value="proof">ホイロ</option>
          <option value="bake1">焼成①</option>
          <option value="bake2">焼成②（スチーム）</option>
          <option value="bake3">焼成③（2重天板）</option>
          <option value="bake4">焼成④（クッキングシート）</option>
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
          <div class="print-only-block-title" style="font-weight:bold; margin-bottom:2px; text-align:left;">手順①</div>
          <textarea class="step-textarea" placeholder="手順を自由に入力してください" oninput="autoResizeTextarea(this)"></textarea>
        </div>
      </div>
    `;
    container.appendChild(div);
  }

  function insertBlankStandbyBlock() {
    const container = document.getElementById('standbyContainer');
    const div = document.createElement('div');
    div.className = 'step-block standby-block';
    div.innerHTML = `
      <div class="edit-only-row" style="margin-bottom: 2px; display: flex; justify-content: space-between; align-items: center;">
        <strong class="standby-title" style="color: #0d47a1;">スタンバイ</strong>
        <button type="button" class="del-btn edit-only-btn" onclick="removeStandbyBlock(this)">削除</button>
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
          <textarea class="step-textarea" placeholder="スタンバイ手順を自由に入力してください" oninput="autoResizeTextarea(this); updateStandbyVisibility();"></textarea>
        </div>
      </div>
    `;
    container.appendChild(div);
  }

  // 画面入力項目をリセットして初期状態（白紙）にする
  function resetFormToDefault(keepMetadata = false) {
    if (!keepMetadata) {
      document.getElementById('menuCode').value = '';
      document.getElementById('productName').value = '';
    }
    document.getElementById('periodStart').value = '';
    document.getElementById('periodEnd').value = '';
    if (document.getElementById('brandCategory')) document.getElementById('brandCategory').value = '';
    if (document.getElementById('menuCategory')) document.getElementById('menuCategory').value = '';

    document.getElementById('moldL').value = 0;
    document.getElementById('moldW').value = 0;
    document.getElementById('moldH').value = 0;
    document.getElementById('maxLoad').value = "6";

    document.getElementById('proofL').value = 0;
    document.getElementById('proofW').value = 0;
    document.getElementById('proofH').value = 0;
    document.getElementById('proofTime').value = "40";

    document.getElementById('bakeL').value = 0;
    document.getElementById('bakeW').value = 0;
    document.getElementById('bakeH').value = 0;
    document.getElementById('bakeTime').value = "10";

    if (document.getElementById('servingText')) {
      document.getElementById('servingText').value = '';
      autoResizeTextarea(document.getElementById('servingText'));
    }
    document.getElementById('ingredientsContainer').innerHTML = '';
    
    document.getElementById('outStepsLeft').innerHTML = '';
    document.getElementById('outStepsRight').innerHTML = '';
    document.getElementById('outStepsFull').innerHTML = '';
    insertBlankStepBlock();
    reorganizeStepBlocks();

    document.getElementById('standbyContainer').innerHTML = '';
    insertBlankStandbyBlock();
    updateStandbyBlockNumbers();
    
    // 写真リセット
    restoreImageHelper('mainImage', null);
    restoreImageHelper('moldImg', null);
    restoreImageHelper('proofImg', null);
    restoreImageHelper('bakeImg', null);

    updateStandbyVisibility();
    updateDBStatusLabel(keepMetadata ? document.getElementById('menuCode').value.trim() : null);
    adjustPreviewScale();
  }

  // メニューコード選択時のトリガー処理
  async function handleMenuCodeSelection(code) {
    if (!code) return;
    
    try {
      const savedRecipe = await recipeDB.getRecipe(code);
      if (savedRecipe) {
        loadRecipeFromDB(savedRecipe);
        showStatusMessage("💾 保存済みデータを読込", "success");
      } else {
        // 保存データがない場合、画面リセットしてマスタ食材のみロード
        resetFormToDefault(true);
        if (menuMaster[code]) {
          document.getElementById('productName').value = menuMaster[code].name;
          populateIngredients(menuMaster[code].ingredients);
        }
        showStatusMessage("✏️ 未保存の新規", "info");
      }
    } catch (e) {
      console.error("Error loading recipe from DB:", e);
      showStatusMessage("⚠️ DB非対応/読込エラー", "error");
      
      // フォールバック: データベースの読み込みに失敗しても、マスタの食材データは正常に表示する
      resetFormToDefault(true);
      if (menuMaster[code]) {
        document.getElementById('productName').value = menuMaster[code].name;
        populateIngredients(menuMaster[code].ingredients);
      }
    }
  }

  // ユーティリティ操作パネルのアクション
  async function saveCurrentRecipeToDB() {
    const code = document.getElementById('menuCode').value.trim();
    if (!code) {
      alert("メニューコードを入力してください。");
      return;
    }
    
    showStatusMessage("保存中...", "info");
    try {
      const recipe = await serializeCurrentRecipe();
      if (!recipe) {
        showStatusMessage("保存失敗", "error");
        return;
      }
      await recipeDB.saveRecipe(recipe);
      savedMenuCodes.add(code);
      updateDBStatusLabel(code);
      updateSavedCount();
      showStatusMessage("💾 保存完了", "success");
      alert("手順書データをデータベースに保存しました。");
    } catch (e) {
      console.error(e);
      showStatusMessage("保存エラー", "error");
      alert("保存エラーが発生しました: " + e.message);
    }
  }

  async function deleteCurrentRecipeFromDB() {
    const code = document.getElementById('menuCode').value.trim();
    if (!code) {
      alert("メニューコードを入力してください。");
      return;
    }
    
    if (!savedMenuCodes.has(code)) {
      alert("この手順書はデータベースに保存されていません。");
      return;
    }

    if (!confirm(`メニューコード 「${code}」 の手順書データをデータベースから削除しますか？`)) {
      return;
    }

    showStatusMessage("削除中...", "info");
    try {
      await recipeDB.deleteRecipe(code);
      savedMenuCodes.delete(code);
      updateSavedCount();
      resetFormToDefault(true);
      showStatusMessage("🗑️ 削除完了", "success");
      alert("手順書データをデータベースから削除しました。");
    } catch (e) {
      console.error(e);
      showStatusMessage("削除エラー", "error");
      alert("削除エラーが発生しました: " + e.message);
    }
  }

  // バックアップのエクスポート・インポート
  async function exportDBtoJSON() {
    showStatusMessage("エクスポート中...", "info");
    try {
      const recipes = await recipeDB.getAllRecipes();
      if (recipes.length === 0) {
        alert("データベースに保存された手順書データがありません。");
        showStatusMessage("データ空", "info");
        return;
      }

      const serializedList = [];
      for (let r of recipes) {
        const sr = { ...r };
        sr.mainImageBlob = await blobToBase64(r.mainImageBlob);
        sr.moldImageBlob = await blobToBase64(r.moldImageBlob);
        sr.proofImageBlob = await blobToBase64(r.proofImageBlob);
        sr.bakeImageBlob = await blobToBase64(r.bakeImageBlob);

        sr.manualSteps = [];
        if (r.manualSteps) {
          for (let step of r.manualSteps) {
            sr.manualSteps.push({
              text: step.text,
              imageBlob: await blobToBase64(step.imageBlob)
            });
          }
        }

        sr.standbySteps = [];
        if (r.standbySteps) {
          for (let step of r.standbySteps) {
            sr.standbySteps.push({
              text: step.text,
              imageBlob: await blobToBase64(step.imageBlob)
            });
          }
        }
        serializedList.push(sr);
      }

      const jsonStr = JSON.stringify(serializedList, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.href = url;
      a.download = `recipe_maker_db_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showStatusMessage("📤 バックアップ出力完了", "success");
    } catch (e) {
      console.error(e);
      showStatusMessage("出力エラー", "error");
      alert("バックアップ作成エラー: " + e.message);
    }
  }

  function triggerDBRestore() {
    const fileInput = document.getElementById('dbRestoreInput');
    if (fileInput) fileInput.click();
  }

  function importDBfromJSON(input) {
    const file = input.files[0];
    if (!file) return;

    showStatusMessage("リストア中...", "info");
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const list = JSON.parse(e.target.result);
        if (!Array.isArray(list)) {
          throw new Error("JSONファイルの形式が正しくありません（レシピ配列である必要があります）");
        }

        let importCount = 0;
        for (let sr of list) {
          const r = { ...sr };
          r.mainImageBlob = base64ToBlob(sr.mainImageBlob);
          r.moldImageBlob = base64ToBlob(sr.moldImageBlob);
          r.proofImageBlob = base64ToBlob(sr.proofImageBlob);
          r.bakeImageBlob = base64ToBlob(sr.bakeImageBlob);

          r.manualSteps = [];
          if (sr.manualSteps) {
            for (let step of sr.manualSteps) {
              r.manualSteps.push({
                text: step.text,
                imageBlob: base64ToBlob(step.imageBlob)
              });
            }
          }

          r.standbySteps = [];
          if (sr.standbySteps) {
            for (let step of sr.standbySteps) {
              r.standbySteps.push({
                text: step.text,
                imageBlob: base64ToBlob(step.imageBlob)
              });
            }
          }

          await recipeDB.saveRecipe(r);
          savedMenuCodes.add(r.menuCode);
          importCount++;
        }
        updateSavedCount();

        // 現在読み込み中のコードがあれば再読込
        const currentCode = document.getElementById('menuCode').value.trim();
        if (currentCode) {
          handleMenuCodeSelection(currentCode);
        } else {
          updateDBStatusLabel(null);
        }
        
        showStatusMessage(`📥 リストア完了 (${importCount}件)`, "success");
        alert(`バックアップから ${importCount} 件の手順書データを正常に復元しました。`);
      } catch (err) {
        console.error(err);
        showStatusMessage("リストアエラー", "error");
        alert("リストアエラー: " + err.message);
      } finally {
        input.value = '';
      }
    };
    reader.readAsText(file, "utf-8");
  }

  // Base64 相互変換ユーティリティ
  function base64ToBlob(base64Str) {
    if (!base64Str) return null;
    try {
      const parts = base64Str.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: contentType });
    } catch (e) {
      console.error("base64ToBlob conversion error:", e);
      return null;
    }
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      if (!blob) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // --- 3.7.1 Saved Recipes List Modal Management ---
  let modalObjectUrls = [];

  function updateSavedCount() {
    const savedCountSpan = document.getElementById('savedCount');
    const modalSavedCountSpan = document.getElementById('modalSavedCount');
    if (savedCountSpan) {
      savedCountSpan.innerText = savedMenuCodes.size;
    }
    if (modalSavedCountSpan) {
      modalSavedCountSpan.innerText = savedMenuCodes.size;
    }
  }

  async function openRecipeListModal() {
    const modal = document.getElementById('recipeListModal');
    const grid = document.getElementById('modalRecipeGrid');
    const searchInput = document.getElementById('modalSearchInput');
    if (!modal || !grid) return;

    if (searchInput) searchInput.value = '';

    showStatusMessage("一覧を読み込んでいます...", "info");
    
    modalObjectUrls.forEach(url => URL.revokeObjectURL(url));
    modalObjectUrls = [];

    try {
      const recipes = await recipeDB.getAllRecipes();
      
      recipes.sort((a, b) => {
        const numA = parseInt(a.menuCode, 10);
        const numB = parseInt(b.menuCode, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a.menuCode).localeCompare(String(b.menuCode));
      });

      grid.innerHTML = '';
      if (recipes.length === 0) {
        grid.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px; font-size: 0.85rem;">保存された手順書がありません。</div>';
      } else {
        recipes.forEach(r => {
          const card = document.createElement('div');
          card.className = 'recipe-card';
          card.setAttribute('data-code', r.menuCode);
          card.setAttribute('data-name', r.productName || '');

          let thumbHTML = '<div class="recipe-card-thumb">🍞</div>';
          if (r.mainImageBlob) {
            const url = URL.createObjectURL(r.mainImageBlob);
            modalObjectUrls.push(url);
            thumbHTML = `<div class="recipe-card-thumb"><img src="${url}" alt="縮小版"></div>`;
          }

          let dateStr = '不明';
          if (r.lastUpdated) {
            const d = new Date(r.lastUpdated);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const h = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            dateStr = `${y}/${m}/${day} ${h}:${min}`;
          }

          card.setAttribute('data-brand', r.brandCategory || '');
          card.setAttribute('data-menu', r.menuCategory || '');
          
          let labelsHtml = '';
          if (r.brandCategory) {
            labelsHtml += `<span style="background-color:#f1f5f9; color:#475569; padding:2px 6px; border-radius:4px; font-size:0.65rem; margin-right:4px; border:1px solid #cbd5e1;">${r.brandCategory}</span>`;
          }
          if (r.menuCategory) {
            labelsHtml += `<span style="background-color:#eff6ff; color:#1d4ed8; padding:2px 6px; border-radius:4px; font-size:0.65rem; border:1px solid #bfdbfe;">${r.menuCategory}</span>`;
          }
          if (labelsHtml) labelsHtml = `<div style="margin-top:2px; margin-bottom:4px;">${labelsHtml}</div>`;

          card.innerHTML = `
            ${thumbHTML}
            <div class="recipe-card-info">
              <h4 class="recipe-card-title">${r.menuCode} : ${r.productName || '無題の商品'}</h4>
              ${labelsHtml}
              <p class="recipe-card-meta">
                <span>📅 更新: ${dateStr}</span>
                <span>📋 原料: ${(r.ingredients || []).length}件</span>
              </p>
            </div>
            <div class="recipe-card-actions">
              <button type="button" style="background-color: #2196F3;" onclick="loadRecipeFromList('${r.menuCode}', event)">編集</button>
              <button type="button" style="background-color: #ef4444;" onclick="deleteRecipeFromList('${r.menuCode}', event)">🗑️</button>
            </div>
          `;

          card.addEventListener('click', () => {
            loadRecipeFromList(r.menuCode);
          });

          grid.appendChild(card);
        });
      }

      updateSavedCount();
      modal.style.display = 'flex';
      showStatusMessage("一覧表示中", "success");
    } catch (e) {
      console.error(e);
      showStatusMessage("一覧取得エラー", "error");
      alert("一覧の読み込み中にエラーが発生しました: " + e.message);
    }
  }

  function closeRecipeListModal() {
    const modal = document.getElementById('recipeListModal');
    if (modal) modal.style.display = 'none';

    modalObjectUrls.forEach(url => URL.revokeObjectURL(url));
    modalObjectUrls = [];
    
    const currentCode = document.getElementById('menuCode').value.trim();
    updateDBStatusLabel(currentCode);
  }

  function closeRecipeListModalOnOverlay(e) {
    if (e.target.id === 'recipeListModal') {
      closeRecipeListModal();
    }
  }

  function filterModalRecipes() {
    const query = document.getElementById('modalSearchInput').value.trim().toLowerCase();
    const brandFilter = document.getElementById('modalBrandFilter') ? document.getElementById('modalBrandFilter').value : "";
    const menuFilter = document.getElementById('modalMenuFilter') ? document.getElementById('modalMenuFilter').value : "";
    const cards = document.querySelectorAll('#modalRecipeGrid .recipe-card');
    
    cards.forEach(card => {
      const code = card.getAttribute('data-code').toLowerCase();
      const name = card.getAttribute('data-name').toLowerCase();
      const brand = card.getAttribute('data-brand');
      const menu = card.getAttribute('data-menu');
      
      const matchQuery = code.includes(query) || name.includes(query);
      const matchBrand = brandFilter === "" || brand === brandFilter;
      const matchMenu = menuFilter === "" || menu === menuFilter;
      
      if (matchQuery && matchBrand && matchMenu) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  async function loadRecipeFromList(code, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    closeRecipeListModal();
    document.getElementById('menuCode').value = code;
    await handleMenuCodeSelection(code);
  }

  async function deleteRecipeFromList(code, event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (!confirm(`メニューコード 「${code}」 の手順書データをデータベースから削除しますか？`)) {
      return;
    }

    try {
      await recipeDB.deleteRecipe(code);
      savedMenuCodes.delete(code);
      
      const card = document.querySelector(`#modalRecipeGrid .recipe-card[data-code="${code}"]`);
      if (card) card.remove();
      
      updateSavedCount();
      
      const currentCode = document.getElementById('menuCode').value.trim();
      if (currentCode === code) {
        resetFormToDefault(true);
      }
      
      const grid = document.getElementById('modalRecipeGrid');
      if (grid && grid.querySelectorAll('.recipe-card').length === 0) {
        grid.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px; font-size: 0.85rem;">保存された手順書がありません。</div>';
      }

      alert("手順書データをデータベースから削除しました。");
    } catch (e) {
      console.error(e);
      alert("削除中にエラーが発生しました: " + e.message);
    }
  }

  // --- 3.8 Drag and Drop Photo Upload Support ---
  // ドラッグ＆ドロップによる画像アップロードのイベントデリゲーション
  document.addEventListener('dragenter', (e) => {
    const box = e.target.closest('.image-upload-box');
    if (box) {
      e.preventDefault();
      box.classList.add('dragover');
    }
  });

  document.addEventListener('dragover', (e) => {
    const box = e.target.closest('.image-upload-box');
    if (box) {
      e.preventDefault();
      box.classList.add('dragover');
    }
  });

  document.addEventListener('dragleave', (e) => {
    const box = e.target.closest('.image-upload-box');
    if (box && (!e.relatedTarget || !box.contains(e.relatedTarget))) {
      box.classList.remove('dragover');
    }
  });

  document.addEventListener('drop', (e) => {
    const box = e.target.closest('.image-upload-box');
    if (box) {
      e.preventDefault();
      box.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const fileInput = box.querySelector('input[type="file"]');
        if (fileInput) {
          fileInput.files = files;
          const event = new Event('change', { bubbles: true });
          fileInput.dispatchEvent(event);
        }
      }
    }
  });
