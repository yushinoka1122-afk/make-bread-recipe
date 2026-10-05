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
    // 製造指示伝票の印刷用テキスト反映
    const slipInput = document.getElementById('manufacturingSlip');
    const slipPrint = document.querySelector('.slip-title-print');
    if (slipInput && slipPrint) {
      slipPrint.innerText = slipInput.value;
    }

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
    window.menuMaster = {};
    menuMaster = window.menuMaster;

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

    // 【自動同期】全保存済みレシピの食材をマスターデータで一括上書きする
    autoSyncAllRecipes();
  }

  async function autoSyncAllRecipes() {
    try {
      const allRecipes = await recipeDB.getAllRecipes();
      let updatedCount = 0;
      for (const r of allRecipes) {
        if (r.menuCode && window.menuMaster && window.menuMaster[r.menuCode] && window.menuMaster[r.menuCode].ingredients && window.menuMaster[r.menuCode].ingredients.length > 0) {
          // 食材配列をマスターデータのものに差し替え
          r.ingredients = JSON.parse(JSON.stringify(window.menuMaster[r.menuCode].ingredients));
          await recipeDB.saveRecipe(r);
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        console.log(`マスターデータで ${updatedCount} 件の保存済み手順書の食材を自動同期しました`);
        // もし現在エディタで開いているレシピがあれば、画面の食材も即座に最新化する
        const currentMenuCode = document.getElementById('menuCode').value.trim();
        if (currentMenuCode && window.menuMaster[currentMenuCode] && window.menuMaster[currentMenuCode].ingredients) {
           populateIngredients(window.menuMaster[currentMenuCode].ingredients);
        }
      }
    } catch (e) {
      console.error("自動同期に失敗しました:", e);
    }
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

    const periodStart = document.getElementById('periodStart') ? document.getElementById('periodStart').value : "";
    const periodEnd = document.getElementById('periodEnd') ? document.getElementById('periodEnd').value : "";
    const brandCategory = document.getElementById('brandCategory') ? document.getElementById('brandCategory').value : "";
    const menuCategory = document.getElementById('menuCategory') ? document.getElementById('menuCategory').value : "";

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
      brandCategory,
      menuCategory,
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
