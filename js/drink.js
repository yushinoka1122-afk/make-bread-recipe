  // ==========================================================================
  // ■ SECTION 3: JAVASCRIPT LOGIC
  // ==========================================================================

  // --- 3.1 Base Utilities & Browser Cache Storage ---
  const circleNums = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳"];

  let currentMode = 'drink';

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

  // --- Rich Text Editor & Toolbar Engine (太字・下線・斜体・取消線・文字サイズ・文字色・ハイライト・書式クリア) ---
  let activeRichEditor = null;

  function valueToRichHTML(val) {
    if (!val) return '';
    return String(val).replace(/\r?\n/g, '<br>');
  }

  function stripRichHTML(val) {
    if (!val) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = String(val)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(div|p)>/gi, '\n');
    return tmp.textContent || tmp.innerText || '';
  }

  function saveEditorSelection(editor) {
    if (!editor) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        editor._savedRange = range.cloneRange();
        activeRichEditor = editor;
      }
    }
  }

  function restoreEditorSelection(editor) {
    if (!editor) return;
    editor.focus();
    if (editor._savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(editor._savedRange);
      }
    }
  }

  function applyRichFontSize(editor, sizePx) {
    restoreEditorSelection(editor);
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    if (range.collapsed) {
      const span = document.createElement('span');
      span.style.fontSize = sizePx;
      span.innerHTML = '&#8203;';
      range.insertNode(span);
      const newRange = document.createRange();
      newRange.setStart(span.firstChild, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      saveEditorSelection(editor);
      return;
    }

    document.execCommand('styleWithCSS', false, false);
    document.execCommand('fontSize', false, '7');
    editor.querySelectorAll('font[size="7"]').forEach(fontEl => {
      fontEl.removeAttribute('size');
      fontEl.style.fontSize = sizePx;
      fontEl.querySelectorAll('[style*="font-size"]').forEach(child => {
        child.style.fontSize = '';
      });
    });
    saveEditorSelection(editor);
  }

  function clearRichFormattingOnSelection(editor) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      document.execCommand('removeFormat', false, null);
      return;
    }
    document.execCommand('removeFormat', false, null);
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('hiliteColor', false, 'transparent');
    editor.querySelectorAll('font, span').forEach(el => {
      if (sel.containsNode(el, true)) {
        el.style.fontSize = '';
        el.style.color = '';
        el.style.backgroundColor = '';
        el.removeAttribute('color');
        el.removeAttribute('size');
      }
    });
  }

  function syncEditorToTextarea(editor, textarea) {
    if (!editor || !textarea) return;
    const plain = (editor.innerText || '').replace(/\u200B/g, '').trim();
    if (!plain) {
      textarea.value = '';
      editor.setAttribute('data-empty', 'true');
    } else {
      textarea.value = editor.innerHTML;
      editor.removeAttribute('data-empty');
    }
    editor._lastSyncedValue = textarea.value;
  }

  function createRichToolbar(editor, textarea) {
    const toolbar = document.createElement('div');
    toolbar.className = 'step-rich-toolbar edit-only-row';
    toolbar._targetEditor = editor;
    toolbar._targetTextarea = textarea;
    toolbar._activeColor = '#dc2626';
    toolbar._activeHighlight = '#fef08a';

    toolbar.innerHTML = `
      <button type="button" class="rt-btn" data-rt-action="bold" title="太字 (Ctrl+B)"><b>B</b></button>
      <button type="button" class="rt-btn" data-rt-action="italic" title="斜体 (Ctrl+I)"><i>I</i></button>
      <button type="button" class="rt-btn" data-rt-action="underline" title="下線 (Ctrl+U)"><u>U</u></button>
      <button type="button" class="rt-btn" data-rt-action="strikeThrough" title="取消線"><s>abc</s></button>
      <span class="rt-sep"></span>
      <div class="rt-btn-wrap">
        <button type="button" class="rt-btn" data-rt-toggle="size" title="選択文字のサイズ変更">サイズ<span class="rt-arrow">▼</span></button>
        <div class="rt-dropdown-menu" data-rt-menu="size">
          <button type="button" class="rt-menu-item" data-rt-size="8px"><span style="font-size:8px;">極小 (8px)</span></button>
          <button type="button" class="rt-menu-item" data-rt-size="9.5px"><span style="font-size:9.5px;">標準 (9.5px)</span></button>
          <button type="button" class="rt-menu-item" data-rt-size="11px"><span style="font-size:11px;">中 (11px)</span></button>
          <button type="button" class="rt-menu-item" data-rt-size="13px"><span style="font-size:13px; font-weight:bold;">大 (13px)</span></button>
          <button type="button" class="rt-menu-item" data-rt-size="15px"><span style="font-size:15px; font-weight:bold;">特大 (15px)</span></button>
        </div>
      </div>
      <div class="rt-btn-wrap">
        <button type="button" class="rt-btn" data-rt-action="applyColor" title="文字色変更（赤文字など）">
          <span class="rt-color-indicator">
            <b style="font-size:10px;">A</b>
            <span class="rt-color-bar" style="background:#dc2626;"></span>
          </span>
        </button>
        <button type="button" class="rt-btn" data-rt-toggle="color" title="文字色を選択" style="min-width:12px; padding:0 2px;"><span class="rt-arrow">▼</span></button>
        <div class="rt-dropdown-menu" data-rt-menu="color">
          <button type="button" class="rt-menu-item" data-rt-color="#dc2626"><span class="rt-swatch" style="background:#dc2626;"></span><span style="color:#dc2626;font-weight:bold;">赤文字 (強調)</span></button>
          <button type="button" class="rt-menu-item" data-rt-color="#0f172a"><span class="rt-swatch" style="background:#0f172a;"></span><span style="color:#0f172a;">黒文字 (標準)</span></button>
          <button type="button" class="rt-menu-item" data-rt-color="#2563eb"><span class="rt-swatch" style="background:#2563eb;"></span><span style="color:#2563eb;">青文字</span></button>
          <button type="button" class="rt-menu-item" data-rt-color="#16a34a"><span class="rt-swatch" style="background:#16a34a;"></span><span style="color:#16a34a;">緑文字</span></button>
          <button type="button" class="rt-menu-item" data-rt-color="#ea580c"><span class="rt-swatch" style="background:#ea580c;"></span><span style="color:#ea580c;">オレンジ文字</span></button>
        </div>
      </div>
      <div class="rt-btn-wrap">
        <button type="button" class="rt-btn" data-rt-action="applyHighlight" title="ハイライト（蛍光マーカー）">
          <span class="rt-hl-badge" style="background:#fef08a; color:#0f172a;">A</span>
        </button>
        <button type="button" class="rt-btn" data-rt-toggle="highlight" title="ハイライト色を選択" style="min-width:12px; padding:0 2px;"><span class="rt-arrow">▼</span></button>
        <div class="rt-dropdown-menu" data-rt-menu="highlight">
          <button type="button" class="rt-menu-item" data-rt-hl="#fef08a"><span class="rt-swatch" style="background:#fef08a;"></span>黄ハイライト</button>
          <button type="button" class="rt-menu-item" data-rt-hl="#fbcfe8"><span class="rt-swatch" style="background:#fbcfe8;"></span>ピンクハイライト</button>
          <button type="button" class="rt-menu-item" data-rt-hl="#bae6fd"><span class="rt-swatch" style="background:#bae6fd;"></span>水色ハイライト</button>
          <button type="button" class="rt-menu-item" data-rt-hl="#bbf7d0"><span class="rt-swatch" style="background:#bbf7d0;"></span>緑ハイライト</button>
          <button type="button" class="rt-menu-item" data-rt-hl="transparent"><span class="rt-swatch" style="background:#ffffff;"></span>ハイライト解除</button>
        </div>
      </div>
      <span class="rt-sep"></span>
      <button type="button" class="rt-btn" data-rt-action="removeFormat" title="選択範囲の書式クリア">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
      </button>
    `;

    toolbar.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    toolbar.addEventListener('click', (e) => {
      e.stopPropagation();
      const toggleBtn = e.target.closest('[data-rt-toggle]');
      if (toggleBtn) {
        const menuType = toggleBtn.getAttribute('data-rt-toggle');
        const menu = toolbar.querySelector(`[data-rt-menu="${menuType}"]`);
        const wasOpen = menu && menu.classList.contains('open');
        document.querySelectorAll('.rt-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        if (menu && !wasOpen) {
          menu.classList.add('open');
        }
        return;
      }

      const actionBtn = e.target.closest('[data-rt-action]');
      if (actionBtn) {
        const action = actionBtn.getAttribute('data-rt-action');
        document.querySelectorAll('.rt-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        restoreEditorSelection(editor);
        if (action === 'bold' || action === 'italic' || action === 'underline' || action === 'strikeThrough') {
          document.execCommand(action, false, null);
        } else if (action === 'applyColor') {
          document.execCommand('styleWithCSS', false, true);
          document.execCommand('foreColor', false, toolbar._activeColor || '#dc2626');
        } else if (action === 'applyHighlight') {
          document.execCommand('styleWithCSS', false, true);
          document.execCommand('hiliteColor', false, toolbar._activeHighlight || '#fef08a');
        } else if (action === 'removeFormat') {
          clearRichFormattingOnSelection(editor);
        }
        saveEditorSelection(editor);
        syncEditorToTextarea(editor, textarea);
        if (typeof adjustPreviewScale === 'function') adjustPreviewScale();
        return;
      }

      const colorItem = e.target.closest('[data-rt-color]');
      if (colorItem) {
        const color = colorItem.getAttribute('data-rt-color');
        toolbar._activeColor = color;
        const bar = toolbar.querySelector('.rt-color-bar');
        if (bar) bar.style.background = color;
        document.querySelectorAll('.rt-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        restoreEditorSelection(editor);
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, color);
        saveEditorSelection(editor);
        syncEditorToTextarea(editor, textarea);
        return;
      }

      const hlItem = e.target.closest('[data-rt-hl]');
      if (hlItem) {
        const hl = hlItem.getAttribute('data-rt-hl');
        if (hl !== 'transparent') {
          toolbar._activeHighlight = hl;
          const badge = toolbar.querySelector('.rt-hl-badge');
          if (badge) badge.style.background = hl;
        }
        document.querySelectorAll('.rt-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        restoreEditorSelection(editor);
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('hiliteColor', false, hl);
        saveEditorSelection(editor);
        syncEditorToTextarea(editor, textarea);
        return;
      }

      const sizeItem = e.target.closest('[data-rt-size]');
      if (sizeItem) {
        const sizePx = sizeItem.getAttribute('data-rt-size');
        document.querySelectorAll('.rt-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        applyRichFontSize(editor, sizePx);
        syncEditorToTextarea(editor, textarea);
        if (typeof adjustPreviewScale === 'function') adjustPreviewScale();
        return;
      }
    });

    return toolbar;
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.rt-btn-wrap')) {
      document.querySelectorAll('.rt-dropdown-menu.open').forEach(m => m.classList.remove('open'));
    }
  });

  // --- 使用食材テーブル用 文字装飾（サイズ・文字色・太字・下線）エンジン ---
  let activeIngCell = null;

  function setActiveIngCell(el) {
    if (!el) return;
    document.querySelectorAll('#ingredientsContainer .ing-cell-active').forEach(c => c.classList.remove('ing-cell-active'));
    activeIngCell = el;
    el.classList.add('ing-cell-active');
    const indicator = document.getElementById('ingActiveCellLabel');
    if (indicator) {
      let colName = 'セル';
      if (el.classList.contains('ing-code')) colName = 'コード';
      else if (el.classList.contains('ing-name')) colName = '品名';
      else if (el.classList.contains('ing-amount')) colName = '使用量';
      else if (el.classList.contains('ing-unit')) colName = '単位';
      indicator.textContent = `選択中: ${colName}`;
      indicator.style.color = '#2563eb';
    }
  }

  document.addEventListener('focusin', (e) => {
    const cell = e.target.closest('#ingredientsContainer .ing-code, #ingredientsContainer .ing-name, #ingredientsContainer .ing-amount, #ingredientsContainer .ing-unit');
    if (cell) {
      setActiveIngCell(cell);
    }
  });

  function extractIngCellStyle(el) {
    if (!el) return null;
    const s = {};
    if (el.style.color) s.color = el.style.color;
    if (el.style.fontSize) s.fontSize = el.style.fontSize;
    if (el.style.fontWeight) s.fontWeight = el.style.fontWeight;
    if (el.style.textDecoration) s.textDecoration = el.style.textDecoration;
    return Object.keys(s).length > 0 ? s : null;
  }

  function applyIngCellStyle(el, styleObj) {
    if (!el) return;
    el.style.color = (styleObj && styleObj.color) ? styleObj.color : '';
    el.style.fontSize = (styleObj && styleObj.fontSize) ? styleObj.fontSize : '';
    el.style.fontWeight = (styleObj && styleObj.fontWeight) ? styleObj.fontWeight : '';
    el.style.textDecoration = (styleObj && styleObj.textDecoration) ? styleObj.textDecoration : '';
  }

  function syncIngCellPrintStyle(inputEl, printEl) {
    if (!inputEl || !printEl) return;
    const props = ['color', 'font-size', 'font-weight', 'text-decoration'];
    const camelProps = ['color', 'fontSize', 'fontWeight', 'textDecoration'];
    props.forEach((prop, idx) => {
      const val = inputEl.style[camelProps[idx]];
      if (val) {
        printEl.style.setProperty(prop, val, 'important');
      } else {
        printEl.style.removeProperty(prop);
      }
    });
  }

  function syncIngRowPrintStyles(row) {
    if (!row) return;
    const codeInput = row.querySelector('.ing-code');
    const nameInput = row.querySelector('.ing-name');
    const amountInput = row.querySelector('.ing-amount');
    const unitSelect = row.querySelector('.ing-unit');

    const codeSpan = row.querySelector('.ing-code-print');
    const nameSpan = row.querySelector('.ing-name-print');
    const amountSpan = row.querySelector('.ing-amount-print');

    if (codeInput && codeSpan) {
      codeSpan.innerText = codeInput.value;
      syncIngCellPrintStyle(codeInput, codeSpan);
    }
    if (nameInput && nameSpan) {
      nameSpan.innerText = nameInput.value;
      syncIngCellPrintStyle(nameInput, nameSpan);
    }
    if (amountInput && amountSpan) {
      amountSpan.innerText = amountInput.value;
      syncIngCellPrintStyle(amountInput, amountSpan);
    }
    if (unitSelect) {
      let unitSpan = row.querySelector('.ing-unit-print');
      if (!unitSpan) {
        unitSpan = document.createElement('span');
        unitSpan.className = 'print-text ing-unit-print';
        unitSelect.insertAdjacentElement('afterend', unitSpan);
      }
      unitSpan.innerText = unitSelect.value;
      syncIngCellPrintStyle(unitSelect, unitSpan);
    }
  }

    function mergeIngredientsWithSaved(masterIngs, savedIngs) {
    const clonedMaster = JSON.parse(JSON.stringify(masterIngs || []));
    // 未保存（新規）の場合はマスタ食材を初期割り当てとして返す
    if (!Array.isArray(savedIngs) || savedIngs.length === 0) {
      return clonedMaster.map(mIng => ({
        ...mIng,
        masterCode: String(mIng.code ?? ''),
        masterName: String(mIng.name ?? ''),
        masterAmount: String(mIng.amount ?? ''),
        masterUnit: String(mIng.unit ?? '')
      }));
    }
    // 保存済みデータがある場合は、ユーザーが編集・追加・削除・並び替えした保存済みリストをそのまま最優先で保持する（勝手に元に戻さない）
    return JSON.parse(JSON.stringify(savedIngs));
  }

  function getTargetIngCell() {
    if (activeIngCell && activeIngCell.isConnected) return activeIngCell;
    const firstAmount = document.querySelector('#ingredientsContainer .ing-amount');
    if (firstAmount) {
      setActiveIngCell(firstAmount);
      return firstAmount;
    }
    return null;
  }

  function ensureIngredientToolbar() {
    if (document.getElementById('ingStyleToolbar')) return;
    const table = document.querySelector('.output-left .output-table') || document.querySelector('.output-table');
    if (!table || !table.parentElement) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'ingStyleToolbar';
    toolbar.className = 'step-rich-toolbar ing-style-toolbar edit-only-row';
    toolbar._activeColor = '#dc2626';

    toolbar.innerHTML = `
      <span class="ing-toolbar-label" title="使用食材のセルをクリックしてからボタンを押してください">食材装飾:</span>
      <button type="button" class="rt-btn" data-ing-action="bold" title="太字"><b>B</b></button>
      <button type="button" class="rt-btn" data-ing-action="underline" title="下線"><u>U</u></button>
      <span class="rt-sep"></span>
      <div class="rt-btn-wrap">
        <button type="button" class="rt-btn" data-rt-toggle="ing-size" title="セルの文字サイズ変更">サイズ<span class="rt-arrow">▼</span></button>
        <div class="rt-dropdown-menu" data-rt-menu="ing-size">
          <button type="button" class="rt-menu-item" data-ing-size="7.5px"><span style="font-size:7.5px;">極小 (7.5px)</span></button>
          <button type="button" class="rt-menu-item" data-ing-size="8.5px"><span style="font-size:8.5px;">標準 (8.5px)</span></button>
          <button type="button" class="rt-menu-item" data-ing-size="10px"><span style="font-size:10px;">中 (10px)</span></button>
          <button type="button" class="rt-menu-item" data-ing-size="11.5px"><span style="font-size:11.5px; font-weight:bold;">大 (11.5px)</span></button>
          <button type="button" class="rt-menu-item" data-ing-size="13px"><span style="font-size:13px; font-weight:bold;">特大 (13px)</span></button>
        </div>
      </div>
      <div class="rt-btn-wrap">
        <button type="button" class="rt-btn" data-ing-action="applyColor" title="セルの文字色変更（赤文字・黒字など）">
          <span class="rt-color-indicator">
            <b style="font-size:10px;">A</b>
            <span class="rt-color-bar" style="background:#dc2626;"></span>
          </span>
        </button>
        <button type="button" class="rt-btn" data-rt-toggle="ing-color" title="文字色を選択" style="min-width:12px; padding:0 2px;"><span class="rt-arrow">▼</span></button>
        <div class="rt-dropdown-menu" data-rt-menu="ing-color">
          <button type="button" class="rt-menu-item" data-ing-color="#dc2626"><span class="rt-swatch" style="background:#dc2626;"></span><span style="color:#dc2626;font-weight:bold;">赤文字 (強調)</span></button>
          <button type="button" class="rt-menu-item" data-ing-color="#0f172a"><span class="rt-swatch" style="background:#0f172a;"></span><span style="color:#0f172a;">黒文字 (標準)</span></button>
          <button type="button" class="rt-menu-item" data-ing-color="#2563eb"><span class="rt-swatch" style="background:#2563eb;"></span><span style="color:#2563eb;">青文字</span></button>
          <button type="button" class="rt-menu-item" data-ing-color="#16a34a"><span class="rt-swatch" style="background:#16a34a;"></span><span style="color:#16a34a;">緑文字</span></button>
          <button type="button" class="rt-menu-item" data-ing-color="#ea580c"><span class="rt-swatch" style="background:#ea580c;"></span><span style="color:#ea580c;">オレンジ文字</span></button>
        </div>
      </div>
      <span class="rt-sep"></span>
      <button type="button" class="rt-btn" data-ing-action="clearFormat" title="選択セルの書式クリア">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
      </button>
      <span id="ingActiveCellLabel" class="ing-active-cell-label">セルを選択</span>
    `;

    toolbar.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    toolbar.addEventListener('click', (e) => {
      e.stopPropagation();
      const toggleBtn = e.target.closest('[data-rt-toggle]');
      if (toggleBtn) {
        const menuType = toggleBtn.getAttribute('data-rt-toggle');
        const menu = toolbar.querySelector(`[data-rt-menu="${menuType}"]`);
        const wasOpen = menu && menu.classList.contains('open');
        document.querySelectorAll('.rt-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        if (menu && !wasOpen) {
          menu.classList.add('open');
        }
        return;
      }

      const cell = getTargetIngCell();
      if (!cell) return;

      const actionBtn = e.target.closest('[data-ing-action]');
      if (actionBtn) {
        const action = actionBtn.getAttribute('data-ing-action');
        document.querySelectorAll('.rt-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        if (action === 'bold') {
          const isBold = cell.style.fontWeight === 'bold' || cell.style.fontWeight === '700';
          cell.style.fontWeight = isBold ? '' : 'bold';
        } else if (action === 'underline') {
          const isUnder = cell.style.textDecoration && cell.style.textDecoration.includes('underline');
          cell.style.textDecoration = isUnder ? '' : 'underline';
        } else if (action === 'applyColor') {
          cell.style.color = toolbar._activeColor || '#dc2626';
        } else if (action === 'clearFormat') {
          applyIngCellStyle(cell, null);
        }
        syncIngRowPrintStyles(cell.closest('.ing-row'));
        cell.focus();
        return;
      }

      const colorItem = e.target.closest('[data-ing-color]');
      if (colorItem) {
        const color = colorItem.getAttribute('data-ing-color');
        toolbar._activeColor = color;
        const bar = toolbar.querySelector('.rt-color-bar');
        if (bar) bar.style.background = color;
        document.querySelectorAll('.rt-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        cell.style.color = (color === '#0f172a') ? '' : color;
        syncIngRowPrintStyles(cell.closest('.ing-row'));
        cell.focus();
        return;
      }

      const sizeItem = e.target.closest('[data-ing-size]');
      if (sizeItem) {
        const sizePx = sizeItem.getAttribute('data-ing-size');
        document.querySelectorAll('.rt-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        cell.style.fontSize = (sizePx === '8.5px') ? '' : sizePx;
        syncIngRowPrintStyles(cell.closest('.ing-row'));
        cell.focus();
        return;
      }
    });

    table.insertAdjacentElement('beforebegin', toolbar);
  }

  function ensureRichEditor(textarea) {
    if (!textarea || !textarea.parentElement) return null;
    if (textarea.closest('.batch-print-page')) return null;
    if (!textarea.closest('.step-block, #plateSection, #servingMethodSection')) return null;

    let editor = textarea._richEditor;
    if ((!editor || !editor.isConnected) && textarea.nextElementSibling && textarea.nextElementSibling.classList.contains('step-rich-editor')) {
      editor = textarea.nextElementSibling;
      textarea._richEditor = editor;
      editor._textarea = textarea;
    }
    if (!editor || !editor.isConnected) {
      editor = document.createElement('div');
      editor.className = 'step-rich-editor';
      editor.contentEditable = 'true';
      editor.setAttribute('data-placeholder', textarea.getAttribute('placeholder') || '手順を自由に入力してください');
      textarea.classList.add('has-rich-editor');
      textarea.insertAdjacentElement('afterend', editor);
      textarea._richEditor = editor;
      editor._textarea = textarea;

      const block = textarea.closest('.step-block, #plateSection, #servingMethodSection');
      if (block) {
        const header = block.querySelector('.step-block-header');
        const oldToolbar = block.querySelector('.step-rich-toolbar');
        if (oldToolbar) oldToolbar.remove();
        const toolbar = createRichToolbar(editor, textarea);
        if (header) {
          header.appendChild(toolbar);
        } else {
          editor.insertAdjacentElement('beforebegin', toolbar);
        }
      }

      editor.addEventListener('input', () => {
        saveEditorSelection(editor);
        syncEditorToTextarea(editor, textarea);
        if (textarea.closest('#standbyContainer') && typeof updateStandbyVisibility === 'function') {
          updateStandbyVisibility();
        }
      });
      editor.addEventListener('mouseup', () => saveEditorSelection(editor));
      editor.addEventListener('keyup', () => saveEditorSelection(editor));
      editor.addEventListener('focus', () => {
        activeRichEditor = editor;
        saveEditorSelection(editor);
      });
      editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      });
    }

    if (textarea.value !== editor._lastSyncedValue) {
      const html = valueToRichHTML(textarea.value || '');
      editor.innerHTML = html;
      const plain = (editor.innerText || '').replace(/\u200B/g, '').trim();
      if (!plain) {
        editor.innerHTML = '';
        editor.setAttribute('data-empty', 'true');
        textarea.value = '';
      } else {
        editor.removeAttribute('data-empty');
      }
      editor._lastSyncedValue = textarea.value;
    }

    return editor;
  }

  // テキストエリアの高さ自動調整
  function autoResizeTextarea(textarea) {
    if (!textarea) return;
    const editor = ensureRichEditor(textarea);
    if (editor) return;
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
    const liveOutput = document.querySelector('#editorWrapper > #outputArea:not(.batch-print-page)') || document.getElementById('outputArea');
    if (!liveOutput) return;
    const blocks = Array.from(liveOutput.querySelectorAll('.step-block[data-block-type="step"]'));
    const outLeft = liveOutput.querySelector('#outStepsLeft');
    const outRight = liveOutput.querySelector('#outStepsRight');
    const outFull = liveOutput.querySelector('#outStepsFull');

    if (outLeft) outLeft.innerHTML = '';
    if (outRight) outRight.innerHTML = '';
    if (outFull) outFull.innerHTML = '';

    const total = blocks.length;
    const leftCount = Math.ceil(total / 2);

    blocks.forEach((block, index) => {
      if (typeof currentMode !== 'undefined' && currentMode === 'cooking') {
        // 料理モード: outFull にすべて格納
        if (outFull) outFull.appendChild(block);
      } else {
        // パンモード: 前半を左、後半を右
        if (index < leftCount) {
          if (outLeft) outLeft.appendChild(block);
        } else {
          if (outRight) outRight.appendChild(block);
        }
      }
    });

    updateBlockNumbers();
    liveOutput.querySelectorAll('.step-textarea').forEach(el => autoResizeTextarea(el));
    if (typeof adjustPreviewScale === 'function') adjustPreviewScale();
  }

  // 手順ブロックヘッダー「手順①」の連番更新
  function updateBlockNumbers() {
    const liveOutput = document.querySelector('#editorWrapper > #outputArea:not(.batch-print-page)') || document.getElementById('outputArea');
    if (!liveOutput) return;
    const blocks = liveOutput.querySelectorAll('.step-block[data-block-type="step"]');
    blocks.forEach((block, index) => {
      const titleSpan = block.querySelector('.block-title');
      const printTitle = block.querySelector('.print-only-block-title');
      const numStr = index < circleNums.length ? circleNums[index] : `(${index + 1})`;
      if(titleSpan) titleSpan.innerText = `手順${numStr}`;
      if(printTitle) printTitle.innerText = `手順${numStr}`;
      
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
  }

  // スタンバイブロックのヘッダー「スタンバイ」の更新
  function updateStandbyBlockNumbers() {
    const blocks = document.getElementById('standbyContainer').querySelectorAll('.standby-block');
    blocks.forEach((block) => {
      const titleSpan = block.querySelector('.s-block-title');
      if(titleSpan) titleSpan.innerText = `スタンバイ`;
      const ta = block.querySelector('.step-textarea');
      if (ta) autoResizeTextarea(ta);
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
              <option value="drink_prep">手洗い・アルコール・カップ確認</option>
              <option value="espuma">エスプーマ生クリーム</option>
              <option value="steamer">スチーマー</option>
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
    if (document.body.classList.contains('is-batch-printing')) return;
    const wrapper = document.getElementById('editorWrapper');
    const outputArea = document.querySelector('#editorWrapper > #outputArea:not(.batch-print-page)') || document.getElementById('outputArea');
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
    if (document.body.classList.contains('is-batch-printing')) return;
    // 製造指示伝票の印刷用テキスト反映
    const slipInput = document.getElementById('manufacturingSlip');
    const slipPrint = document.querySelector('.slip-title-print');
    if (slipInput && slipPrint) {
      slipPrint.innerText = slipInput.value;
    }

    document.querySelectorAll('#ingredientsContainer .ing-row').forEach(row => {
      syncIngRowPrintStyles(row);
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
    data.push(["品名", "使用量", "スタンバイ"]);
    document.querySelectorAll('#ingredientsContainer .ing-row').forEach(row => {
      const name = row.querySelector('.ing-name').value;
      const amount = row.querySelector('.ing-amount').value;
      const unit = row.querySelector('.ing-unit').value;
      const standby = row.querySelector('.ing-standby').value === 'スタンバイ';
      if(name || amount) {
        data.push([name, `${amount}${unit}`, standby ? "〇" : ""]);
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
        const lines = stripRichHTML(textarea.value).trim().split('\n');
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
        const lines = stripRichHTML(textarea.value).trim().split('\n');
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
    const block = selectObj.closest('.step-block');
    const textarea = block.querySelector('.step-textarea');
    let lines = [];
    if (tempKey === 'drink_prep') {
      lines.push("手を洗いアルコールをします。使用するカップに汚れが付いていないことを確認します。");
    } else if (tempKey === 'espuma') {
      lines.push("エスプーマを使用して、生クリーム（25g）をカップの淵に着けて一周し、その後、中も隙間なく搾ります。");
    } else if (tempKey === 'steamer') {
      lines.push("スチーマーを使用して沸かします。");
    }
    
    if (textarea) {
      if (textarea.value) {
        textarea.value = textarea.value + '\n' + lines.join('\n');
      } else {
        textarea.value = lines.join('\n');
      }
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
        if (r.menuCode && window.menuMaster && window.menuMaster[r.menuCode]) {
          const masterEntry = window.menuMaster[r.menuCode];
          let changed = false;
          // 保存済みの手順書ですでに食材が保存されている場合はユーザーの編集内容を保護し、空の場合のみマスタから補完する
          if ((!Array.isArray(r.ingredients) || r.ingredients.length === 0) && masterEntry.ingredients && masterEntry.ingredients.length > 0) {
            r.ingredients = mergeIngredientsWithSaved(masterEntry.ingredients, []);
            changed = true;
          }
          if ((!r.productName || String(r.productName).trim() === '') && masterEntry.name) {
            r.productName = String(masterEntry.name);
            changed = true;
          }
          if (changed) {
            await recipeDB.saveRecipe(r);
            updatedCount++;
          }
        }
      }
      if (updatedCount > 0) {
        console.log(`マスターデータで ${updatedCount} 件の未設定手順書を補完しました`);
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
    ensureIngredientToolbar();
    const container = document.getElementById('ingredientsContainer');
    container.innerHTML = '';
    
    if (ingredients.length === 0) {
      addIngredient();
      return;
    }
    
    ingredients.forEach(ing => {
      const tr = document.createElement('tr');
      tr.className = ing.standby ? 'ing-row is-standby' : 'ing-row';
      if (ing.masterCode !== undefined) tr.dataset.masterCode = String(ing.masterCode);
      if (ing.masterName !== undefined) tr.dataset.masterName = String(ing.masterName);
      if (ing.masterAmount !== undefined) tr.dataset.masterAmount = String(ing.masterAmount);
      if (ing.masterUnit !== undefined) tr.dataset.masterUnit = String(ing.masterUnit);
      if (ing.isCustomRow) tr.dataset.isCustomRow = '1';
      
      const units = ["g", "kg", "ml", "L", "個", "枚", "本", "尾", "杯", "種", "人前", "円", "適量"];
      if (ing.unit && !units.includes(ing.unit)) {
        units.push(ing.unit);
      }
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
      applyIngCellStyle(tr.querySelector('.ing-code'), ing.codeStyle);
      applyIngCellStyle(tr.querySelector('.ing-name'), ing.nameStyle);
      applyIngCellStyle(tr.querySelector('.ing-amount'), ing.amountStyle);
      applyIngCellStyle(tr.querySelector('.ing-unit'), ing.unitStyle);
      syncIngRowPrintStyles(tr);
      container.appendChild(tr);
    });
    adjustPreviewScale();
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureIngredientToolbar();
    const modeSelectInit = document.getElementById('recipeModeSelect');
    if (modeSelectInit && typeof currentMode !== 'undefined') {
        modeSelectInit.value = currentMode;
    }

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
        window.menuMaster = menuMaster;
        const menuCount = safeStorage.getItem('cachedMenuCount') || Object.keys(menuMaster).length;
        const sourceLabel = safeStorage.getItem('cachedSourceLabel') || "キャッシュ";
        const statusDiv = document.getElementById('masterStatus');
        statusDiv.innerText = `マスタデータ読込完了 (${menuCount}件のメニュー) (${sourceLabel})`;
        statusDiv.style.backgroundColor = "#e8f5e9";
        statusDiv.style.color = "#2e7d32";
        
        // ローカルのExcel/CSVファイルを読み込んでいる場合はスプシ自動更新で上書きしない
        if (!sourceLabel || (!sourceLabel.startsWith('Excel:') && !sourceLabel.startsWith('CSV:'))) {
          loadMasterData(true);
        }
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
        const currentCode = menuCodeInput ? menuCodeInput.value.trim() : '';
        // メニューコードが既に入力されている場合は商品名称の自由編集として扱い、検索によるリセットを行わない
        if (currentCode) {
          updateDBStatusLabel(currentCode);
          return;
        }
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
  if (false && masterFileInput) {
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
    .then(async codes => {
      codes.forEach(code => savedMenuCodes.add(code));
      console.log("Database initialized. Saved menu codes:", Array.from(savedMenuCodes));
      
      // 初期状態のメニューコード入力がある場合は表示状態を同期
      const currentCode = document.getElementById('menuCode').value.trim();
      if (currentCode) {
        updateDBStatusLabel(currentCode);
      }
      updateSavedCount();

      // モード切替後のリダイレクト読み込みがあれば実行
      const pendingCode = safeStorage.getItem('pendingLoadRecipe');
      if (pendingCode) {
        safeStorage.removeItem('pendingLoadRecipe');
        document.getElementById('menuCode').value = pendingCode;
        await handleMenuCodeSelection(pendingCode);
      }

      // モード切替後の一括印刷予約があれば実行
      const pendingBatchRaw = safeStorage.getItem('pendingBatchPrintCodes');
      if (pendingBatchRaw) {
        safeStorage.removeItem('pendingBatchPrintCodes');
        try {
          const batchCodes = JSON.parse(pendingBatchRaw);
          if (Array.isArray(batchCodes) && batchCodes.length > 0) {
            setTimeout(() => executeBatchPrintByCodes(batchCodes), 300);
          }
        } catch (e) {
          console.error("Failed to parse pendingBatchPrintCodes:", e);
        }
      }
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
    const brandCategory = (document.getElementById('brandCategory') && document.getElementById('brandCategory').value !== '--選択--') ? document.getElementById('brandCategory').value : "";
    const menuCategory = document.getElementById('menuCategory') ? document.getElementById('menuCategory').value : "";

    const servingText = document.getElementById('servingText') ? document.getElementById('servingText').value.trim() : "";

    // 使用食材
    const masterIngList = (menuCode && window.menuMaster && window.menuMaster[menuCode] && Array.isArray(window.menuMaster[menuCode].ingredients))
      ? window.menuMaster[menuCode].ingredients
      : null;
    const masterProductName = (menuCode && window.menuMaster && window.menuMaster[menuCode] && window.menuMaster[menuCode].name !== undefined)
      ? String(window.menuMaster[menuCode].name)
      : undefined;
    const usedMasterIdx = new Set();

    const ingredients = [];
    document.querySelectorAll('#ingredientsContainer .ing-row').forEach((row, rowIdx) => {
      const codeEl = row.querySelector('.ing-code');
      const nameEl = row.querySelector('.ing-name');
      const amountEl = row.querySelector('.ing-amount');
      const unitEl = row.querySelector('.ing-unit');
      const code = codeEl.value.trim();
      const name = nameEl.value.trim();
      const amount = amountEl.value.trim();
      const unit = unitEl.value;
      const standby = row.querySelector('.ing-standby').value === 'スタンバイ';
      if (code || name || amount) {
        const ingObj = { code, name, amount, unit, standby };
        const codeStyle = extractIngCellStyle(codeEl);
        const nameStyle = extractIngCellStyle(nameEl);
        const amountStyle = extractIngCellStyle(amountEl);
        const unitStyle = extractIngCellStyle(unitEl);
        if (codeStyle) ingObj.codeStyle = codeStyle;
        if (nameStyle) ingObj.nameStyle = nameStyle;
        if (amountStyle) ingObj.amountStyle = amountStyle;
        if (unitStyle) ingObj.unitStyle = unitStyle;

        // マスター基準値（スナップショット）の記録
        if (masterIngList) {
          let mIdx = -1;
          if (rowIdx < masterIngList.length && !usedMasterIdx.has(rowIdx) && masterIngList[rowIdx].code === code) {
            mIdx = rowIdx;
          } else if (code) {
            mIdx = masterIngList.findIndex((m, idx) => !usedMasterIdx.has(idx) && m.code === code);
          }
          if (mIdx === -1 && rowIdx < masterIngList.length && !usedMasterIdx.has(rowIdx)) {
            mIdx = rowIdx;
          }
          if (mIdx !== -1) {
            usedMasterIdx.add(mIdx);
            const mIng = masterIngList[mIdx];
            ingObj.masterCode = String(mIng.code ?? '');
            ingObj.masterName = String(mIng.name ?? '');
            ingObj.masterAmount = String(mIng.amount ?? '');
            ingObj.masterUnit = String(mIng.unit ?? '');
          } else {
            ingObj.isCustomRow = true;
          }
        } else {
          if (row.dataset.masterCode !== undefined) ingObj.masterCode = row.dataset.masterCode;
          if (row.dataset.masterName !== undefined) ingObj.masterName = row.dataset.masterName;
          if (row.dataset.masterAmount !== undefined) ingObj.masterAmount = row.dataset.masterAmount;
          if (row.dataset.masterUnit !== undefined) ingObj.masterUnit = row.dataset.masterUnit;
          if (row.dataset.isCustomRow === '1') ingObj.isCustomRow = true;
        }

        ingredients.push(ingObj);
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

    const result = {
      menuCode,
      productName,
  mode: document.getElementById('recipeModeSelect') ? document.getElementById('recipeModeSelect').value : (typeof currentMode !== 'undefined' ? currentMode : 'bread'),
      periodStart,
      periodEnd,
      brandCategory,
      menuCategory,
      servingText,
      ingredients,
      manualSteps,
      standbySteps,
      mainImageBlob,
      lastUpdated: Date.now()
    };
    if (masterProductName !== undefined) {
      result.masterProductName = masterProductName;
    }
    return result;
  }

  // 手順書オブジェクトのデシリアライズ（画面への反映）
  function loadRecipeFromDB(recipe, skipModeRedirect = false) {
    if (!recipe) return;

    // モード切替を復元
    if (!skipModeRedirect) {
      if (recipe.mode && recipe.mode !== currentMode) {
        safeStorage.setItem('pendingLoadRecipe', recipe.menuCode);
        if (recipe.mode === 'cooking') window.location.href = 'cooking.html';
        else if (recipe.mode === 'drink') window.location.href = 'drink.html';
        else window.location.href = 'index.html';
        return;
      } else if (!recipe.mode && currentMode !== 'bread') {
        safeStorage.setItem('pendingLoadRecipe', recipe.menuCode);
        window.location.href = 'index.html';
        return;
      }
    }

    const modeSelect = document.getElementById('recipeModeSelect');
    if (modeSelect) modeSelect.value = recipe.mode || 'bread';

    document.getElementById('menuCode').value = recipe.menuCode || "";
    let resolvedProductName = (recipe.productName !== undefined && String(recipe.productName).trim() !== "")
      ? recipe.productName
      : ((recipe.menuCode && window.menuMaster && window.menuMaster[recipe.menuCode] && window.menuMaster[recipe.menuCode].name)
          ? String(window.menuMaster[recipe.menuCode].name)
          : "");
    document.getElementById('productName').value = resolvedProductName;
    if (document.getElementById('manufacturingSlipName')) {
      document.getElementById('manufacturingSlipName').value = recipe.manufacturingSlipName || "";
    }
    if (document.getElementById('periodStart')) {
      document.getElementById('periodStart').value = recipe.periodStart || "";
    }
    if (document.getElementById('periodEnd')) {
      document.getElementById('periodEnd').value = recipe.periodEnd || "";
    }

    if (document.getElementById('brandCategory')) {
      if (typeof window.setBrandCategoryValue === 'function') {
        window.setBrandCategoryValue(recipe.brandCategory || "");
      } else {
        const val = (recipe.brandCategory && recipe.brandCategory !== '--選択--') ? recipe.brandCategory : "";
        document.getElementById('brandCategory').value = val;
        if (document.querySelector('.brand-print')) {
          document.querySelector('.brand-print').innerText = val;
        }
      }
    }
    if (document.getElementById('menuCategory')) {
      const val = recipe.menuCategory || "--選択--";
      document.getElementById('menuCategory').value = val;
      if (document.querySelector('.category-print')) {
        document.querySelector('.category-print').innerText = (val === '--選択--') ? '' : val;
      }
    }

    // ドリンク用項目の読み込み（今後追加予定）

    // 画像の復元
    restoreImageHelper('mainImage', recipe.mainImageBlob);
    restoreImageHelper('moldImg', recipe.moldImageBlob);
    restoreImageHelper('proofImg', recipe.proofImageBlob);
    restoreImageHelper('bakeImg', recipe.bakeImageBlob);

    if (document.getElementById('servingText')) {
      document.getElementById('servingText').value = recipe.servingText || "";
      autoResizeTextarea(document.getElementById('servingText'));
    }

    // 食材テーブルの復元（保存済みの編集内容・行削除・追加・単位・文字装飾をそのまま復元し、マスタで上書きしない）
    let ingredientsToLoad = (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0)
      ? recipe.ingredients
      : ((recipe.menuCode && window.menuMaster && window.menuMaster[recipe.menuCode] && Array.isArray(window.menuMaster[recipe.menuCode].ingredients))
          ? mergeIngredientsWithSaved(window.menuMaster[recipe.menuCode].ingredients, [])
          : []);
    populateIngredients(ingredientsToLoad);

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
              <option value="drink_prep">手洗い・アルコール・カップ確認</option>
              <option value="espuma">エスプーマ生クリーム</option>
              <option value="steamer">スチーマー</option>
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
    updateSavedCount();
    updateDBStatusLabel(recipe.menuCode);
    updateStandbyVisibility();
    adjustPreviewScale();
  }

  function restoreImageHelper(inputId, blob) {
    const input = document.getElementById(inputId);
    if (!input) return Promise.resolve();
    const box = input.closest('.image-upload-box');
    return restoreImageHelperOnBox(box, blob);
  }

  async function restoreImageHelperOnBox(box, blob) {
    if (!box) return;
    const p = (async () => {
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
        if (typeof batchPrintObjectUrls !== 'undefined' && Array.isArray(batchPrintObjectUrls)) {
          batchPrintObjectUrls.push(url);
        }
        await new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        });
        placeholder.style.display = 'none';
        preview.style.display = 'flex';
      } else {
        fileInput.value = '';
        img.src = '';
        box.fileData = null;
        placeholder.style.display = 'flex';
        preview.style.display = 'none';
      }
    })();
    box._restorePromise = p;
    return p;
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
              <option value="drink_prep">手洗い・アルコール・カップ確認</option>
              <option value="espuma">エスプーマ生クリーム</option>
              <option value="steamer">スチーマー</option>
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

    // ドリンク用項目のクリア（今後追加予定）

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
          populateIngredients((menuMaster[code].ingredients || []).map(m => ({
            ...m,
            masterCode: String(m.code ?? ''),
            masterName: String(m.name ?? ''),
            masterAmount: String(m.amount ?? ''),
            masterUnit: String(m.unit ?? '')
          })));
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
        populateIngredients((menuMaster[code].ingredients || []).map(m => ({
          ...m,
          masterCode: String(m.code ?? ''),
          masterName: String(m.name ?? ''),
          masterAmount: String(m.amount ?? ''),
          masterUnit: String(m.unit ?? '')
        })));
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
  let batchPrintObjectUrls = [];

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
    const modeFilter = document.getElementById('modalModeFilter');
    if (!modal || !grid) return;

    if (searchInput) searchInput.value = '';
    if (modeFilter) modeFilter.value = currentMode || 'all';

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
          const rMode = r.mode || 'bread';
          const card = document.createElement('div');
          card.className = 'recipe-card';
          card.setAttribute('data-code', r.menuCode);
          card.setAttribute('data-name', r.productName || '');
          card.setAttribute('data-brand', r.brandCategory || '');
          card.setAttribute('data-category', r.menuCategory || '');
          card.setAttribute('data-mode', rMode);

          const modeEmoji = rMode === 'cooking' ? '🍳' : (rMode === 'drink' ? '🥤' : '🍞');
          const modeLabel = rMode === 'cooking' ? '料理' : (rMode === 'drink' ? 'ドリンク' : 'パン');
          let thumbHTML = `<div class="recipe-card-thumb">${modeEmoji}</div>`;
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

          let tagsHTML = `<span style="display:inline-block; border: 1px solid #cbd5e1; background: #f1f5f9; color: #334155; padding: 1px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: bold; margin-right: 5px;">${modeEmoji} ${modeLabel}</span>`;
          if (r.brandCategory && r.brandCategory !== '--選択--') {
             r.brandCategory.split(',').map(s => s.trim()).filter(s => s && s !== '--選択--').forEach(b => {
               tagsHTML += `<span style="display:inline-block; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; padding: 1px 6px; border-radius: 4px; font-size: 0.75rem; margin-right: 5px;">${b}</span>`;
             });
          }
          if (r.menuCategory) {
             tagsHTML += `<span style="display:inline-block; border: 1px solid #93c5fd; background: #eff6ff; color: #2563eb; padding: 1px 6px; border-radius: 4px; font-size: 0.75rem;">${r.menuCategory}</span>`;
          }

          card.innerHTML = `
            <div class="recipe-card-check" onclick="toggleBatchCardCheckFromWrapper(this, event)">
              <input type="checkbox" class="batch-recipe-checkbox" value="${r.menuCode}" data-mode="${rMode}" onclick="event.stopPropagation();" onchange="onBatchCheckboxChange(this)">
            </div>
            ${thumbHTML}
            <div class="recipe-card-info">
              <h4 class="recipe-card-title">${r.menuCode} : ${r.productName || '無題の商品'}</h4>
              <div style="margin: 4px 0 6px 0;">${tagsHTML}</div>
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

          card.addEventListener('click', (e) => {
            if (e.target.closest('.recipe-card-check') || e.target.closest('.recipe-card-actions')) return;
            loadRecipeFromList(r.menuCode);
          });

          grid.appendChild(card);
        });
      }

      updateSavedCount();
      filterModalRecipes();
      updateBatchSelectionUI();
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
    const searchInput = document.getElementById('modalSearchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const brandFilter = document.getElementById('modalBrandFilter') ? document.getElementById('modalBrandFilter').value : '';
    const categoryFilter = document.getElementById('modalCategoryFilter') ? document.getElementById('modalCategoryFilter').value : '';
    const modeFilter = document.getElementById('modalModeFilter') ? document.getElementById('modalModeFilter').value : 'all';
    const cards = document.querySelectorAll('#modalRecipeGrid .recipe-card');
    
    cards.forEach(card => {
      const code = (card.getAttribute('data-code') || '').toLowerCase();
      const name = (card.getAttribute('data-name') || '').toLowerCase();
      const brand = card.getAttribute('data-brand') || '';
      const category = card.getAttribute('data-category') || '';
      const cardMode = card.getAttribute('data-mode') || 'bread';
      
      let matchQuery = (!query || code.includes(query) || name.includes(query));
      const brandList = brand.split(',').map(s => s.trim()).filter(Boolean);
      let matchBrand = (!brandFilter || brandFilter === '--選択--' || brand === brandFilter || brandList.includes(brandFilter));
      let matchCategory = (!categoryFilter || categoryFilter === '--選択--' || category === categoryFilter);
      let matchMode = (!modeFilter || modeFilter === 'all' || cardMode === modeFilter);
      
      if (matchQuery && matchBrand && matchCategory && matchMode) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });

    updateBatchSelectionUI();
  }

  function toggleBatchCardCheckFromWrapper(wrapperEl, event) {
    if (event) {
      event.stopPropagation();
    }
    const cb = wrapperEl.querySelector('.batch-recipe-checkbox');
    if (!cb) return;
    if (event && event.target === cb) return;
    cb.checked = !cb.checked;
    onBatchCheckboxChange(cb);
  }

  function onBatchCheckboxChange(cb) {
    const card = cb.closest('.recipe-card');
    if (card) {
      card.classList.toggle('selected-for-batch', cb.checked);
    }
    updateBatchSelectionUI();
  }

  function toggleBatchSelectAll(checked) {
    const cards = document.querySelectorAll('#modalRecipeGrid .recipe-card');
    cards.forEach(card => {
      if (card.style.display !== 'none') {
        const cb = card.querySelector('.batch-recipe-checkbox');
        if (cb) {
          cb.checked = checked;
          card.classList.toggle('selected-for-batch', checked);
        }
      }
    });
    updateBatchSelectionUI();
  }

  function updateBatchSelectionUI() {
    const allCheckboxes = Array.from(document.querySelectorAll('#modalRecipeGrid .batch-recipe-checkbox'));
    const checkedBoxes = allCheckboxes.filter(cb => cb.checked);
    const visibleCards = Array.from(document.querySelectorAll('#modalRecipeGrid .recipe-card')).filter(c => c.style.display !== 'none');
    const visibleCheckboxes = visibleCards.map(c => c.querySelector('.batch-recipe-checkbox')).filter(Boolean);

    const badge = document.getElementById('batchSelectedCountBadge');
    const execBtn = document.getElementById('batchPrintExecBtn');
    const selectAllCb = document.getElementById('batchSelectAllCheckbox');

    if (badge) {
      badge.textContent = `${checkedBoxes.length}件選択中`;
    }
    if (execBtn) {
      execBtn.disabled = checkedBoxes.length === 0;
    }
    const quickSheetBtn = document.getElementById('quickSheetExecBtn');
    if (quickSheetBtn) {
      quickSheetBtn.disabled = checkedBoxes.length === 0;
    }
    if (selectAllCb) {
      if (visibleCheckboxes.length === 0) {
        selectAllCb.checked = false;
        selectAllCb.indeterminate = false;
      } else {
        const visibleCheckedCount = visibleCheckboxes.filter(cb => cb.checked).length;
        selectAllCb.checked = visibleCheckedCount === visibleCheckboxes.length;
        selectAllCb.indeterminate = visibleCheckedCount > 0 && visibleCheckedCount < visibleCheckboxes.length;
      }
    }
  }

  async function executeBatchPrintFromModal() {
    const checkedBoxes = Array.from(document.querySelectorAll('#modalRecipeGrid .batch-recipe-checkbox:checked'));
    if (checkedBoxes.length === 0) {
      alert('一括出力する手順書を選択してください。');
      return;
    }

    const selectedItems = checkedBoxes.map(cb => ({
      code: cb.value,
      mode: cb.getAttribute('data-mode') || 'bread'
    }));

    const modes = Array.from(new Set(selectedItems.map(item => item.mode)));
    let targetMode = currentMode;
    let targetCodes = selectedItems.map(item => item.code);

    if (modes.length > 1) {
      const modeNameMap = { bread: '🍞 パン', cooking: '🍳 料理・デザート', drink: '🥤 ドリンク' };
      const currentModeItems = selectedItems.filter(item => item.mode === currentMode);
      if (currentModeItems.length > 0) {
        const msg = `異なる区分（パン／料理／ドリンク）の手順書が同時に選択されています。\n用紙の向きやレイアウトが異なるため、まずは現在のモード（${modeNameMap[currentMode]}：${currentModeItems.length}件）のみを一括出力しますか？\n（※区分フィルタを使うとモード別に一括選択できます）`;
        if (!confirm(msg)) return;
        targetMode = currentMode;
        targetCodes = currentModeItems.map(item => item.code);
      } else {
        targetMode = modes[0];
        const firstModeItems = selectedItems.filter(item => item.mode === targetMode);
        const msg = `異なる区分（パン／料理／ドリンク）の手順書が同時に選択されています。\nまずは「${modeNameMap[targetMode]}」（${firstModeItems.length}件）画面へ移動して一括出力しますか？`;
        if (!confirm(msg)) return;
        targetCodes = firstModeItems.map(item => item.code);
      }
    } else {
      targetMode = modes[0];
    }

    if (targetMode !== currentMode) {
      safeStorage.setItem('pendingBatchPrintCodes', JSON.stringify(targetCodes));
      if (targetMode === 'cooking') {
        window.location.href = 'cooking.html';
      } else if (targetMode === 'drink') {
        window.location.href = 'drink.html';
      } else {
        window.location.href = 'index.html';
      }
      return;
    }

    closeRecipeListModal();
    await executeBatchPrintByCodes(targetCodes);
  }

  async function executeBatchPrintByCodes(codes) {
    if (!Array.isArray(codes) || codes.length === 0) return;

    const currentEditingCode = document.getElementById('menuCode') ? document.getElementById('menuCode').value.trim() : '';

    let overlay = document.getElementById('batchPrintLoadingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'batchPrintLoadingOverlay';
      overlay.innerHTML = `
        <div class="batch-loading-spinner"></div>
        <div class="batch-loading-text" id="batchPrintLoadingText">一括印刷データを準備中...</div>
        <div class="batch-loading-sub" id="batchPrintLoadingSub">画像を読み込んでレイアウトを最適化しています</div>
      `;
      document.body.appendChild(overlay);
    }
    const loadingText = document.getElementById('batchPrintLoadingText');
    overlay.style.display = 'flex';

    let batchContainer = document.getElementById('batchPrintContainer');
    if (!batchContainer) {
      batchContainer = document.createElement('div');
      batchContainer.id = 'batchPrintContainer';
      const wrapper = document.getElementById('editorWrapper');
      if (wrapper) {
        wrapper.appendChild(batchContainer);
      } else {
        document.body.appendChild(batchContainer);
      }
    }
    batchContainer.innerHTML = '';

    batchPrintObjectUrls.forEach(url => URL.revokeObjectURL(url));
    batchPrintObjectUrls = [];

    try {
      const outputArea = document.querySelector('#editorWrapper > #outputArea:not(.batch-print-page)') || document.getElementById('outputArea');
      if (!outputArea) throw new Error('出力エリアが見つかりません。');

      const pageClones = [];

      for (let i = 0; i < codes.length; i++) {
        const code = String(codes[i]);
        if (loadingText) {
          loadingText.textContent = `一括出力データを準備中... (${i + 1} / ${codes.length} 件)`;
        }

        const recipe = await recipeDB.getRecipe(code);
        if (!recipe) continue;

        document.getElementById('menuCode').value = code;
        await loadRecipeFromDB(recipe, true);

        const boxes = Array.from(outputArea.querySelectorAll('.image-upload-box'));
        const promises = boxes.map(b => b._restorePromise).filter(Boolean);
        await Promise.all(promises);

        outputArea.querySelectorAll('textarea').forEach(ta => {
          if (typeof autoResizeTextarea === 'function') autoResizeTextarea(ta);
          if (typeof syncStepPrintText === 'function') syncStepPrintText(ta);
        });
        const slipInput = document.getElementById('manufacturingSlip');
        const slipPrint = outputArea.querySelector('.slip-title-print');
        if (slipInput && slipPrint) {
          slipPrint.innerText = slipInput.value;
        }
        outputArea.querySelectorAll('#ingredientsContainer .ing-row').forEach(row => {
          if (typeof syncIngRowPrintStyles === 'function') syncIngRowPrintStyles(row);
        });

        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));

        const clone = outputArea.cloneNode(true);
        clone.classList.add('batch-print-page');
        clone.style.transform = 'none';

        const origInputs = outputArea.querySelectorAll('input, textarea, select');
        const cloneInputs = clone.querySelectorAll('input, textarea, select');
        origInputs.forEach((origEl, idx) => {
          const cloneEl = cloneInputs[idx];
          if (!cloneEl) return;
          if (origEl.tagName === 'TEXTAREA') {
            cloneEl.value = origEl.value;
            cloneEl.textContent = origEl.value;
            cloneEl.style.height = origEl.style.height;
          } else if (origEl.tagName === 'SELECT') {
            cloneEl.value = origEl.value;
            Array.from(cloneEl.options).forEach((opt, optIdx) => {
              if (origEl.options[optIdx] && origEl.options[optIdx].selected) {
                opt.setAttribute('selected', 'selected');
              } else {
                opt.removeAttribute('selected');
              }
            });
          } else if (origEl.type === 'checkbox' || origEl.type === 'radio') {
            cloneEl.checked = origEl.checked;
            if (origEl.checked) cloneEl.setAttribute('checked', 'checked');
            else cloneEl.removeAttribute('checked');
          } else if (origEl.type !== 'file') {
            cloneEl.value = origEl.value;
            cloneEl.setAttribute('value', origEl.value);
          }
        });

        pageClones.push(clone);
      }

      pageClones.forEach(c => batchContainer.appendChild(c));

      const wrapper = document.getElementById('editorWrapper');
      if (wrapper) wrapper.style.height = 'auto';

      overlay.style.display = 'none';
      document.body.classList.add('is-batch-printing');

      await new Promise(r => setTimeout(r, 120));

      const cleanup = async () => {
        window.removeEventListener('afterprint', cleanup);
        await cleanupBatchPrint(currentEditingCode, codes[codes.length - 1]);
      };
      window.addEventListener('afterprint', cleanup, { once: true });

      window.print();
    } catch (err) {
      console.error('Batch print error:', err);
      if (overlay) overlay.style.display = 'none';
      document.body.classList.remove('is-batch-printing');
      alert('一括出力の準備中にエラーが発生しました: ' + err.message);
    }
  }

  async function cleanupBatchPrint(previousCode, lastLoadedCode) {
    document.body.classList.remove('is-batch-printing');
    const batchContainer = document.getElementById('batchPrintContainer');
    if (batchContainer) {
      batchContainer.innerHTML = '';
    }
    batchPrintObjectUrls.forEach(url => URL.revokeObjectURL(url));
    batchPrintObjectUrls = [];

    const codeToRestore = previousCode || lastLoadedCode || '';
    if (codeToRestore) {
      document.getElementById('menuCode').value = codeToRestore;
      const savedRecipe = await recipeDB.getRecipe(codeToRestore);
      if (savedRecipe) {
        await loadRecipeFromDB(savedRecipe, true);
      }
    }
    showStatusMessage("一括印刷・PDF出力が完了しました", "success");
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
      updateBatchSelectionUI();
      
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


  // ==========================
  // モード切替UI制御
  // ==========================
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebarMenu');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !overlay) return;
    if (sidebar.style.left === '0px') {
      sidebar.style.left = '-300px';
      overlay.style.display = 'none';
    } else {
      sidebar.style.left = '0px';
      overlay.style.display = 'block';
    }
  }

  function switchMode(mode) {
    currentMode = mode;
    const body = document.body;
    const badge = document.getElementById('modeBadge');
    
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    // 動的に印刷向きを変更
    let printStyle = document.getElementById('dynamicPrintStyle');
    if (!printStyle) {
      printStyle = document.createElement('style');
      printStyle.id = 'dynamicPrintStyle';
      document.head.appendChild(printStyle);
    }

    
    if (mode === 'cooking') {
      body.classList.add('mode-cooking');
      if (badge) {
        badge.innerText = '料理・デザートモード';
        badge.style.backgroundColor = '#ef4444'; // Red
      }
      const activeBtn = document.querySelector('.mode-btn[onclick*="cooking"]');
      if (activeBtn) activeBtn.classList.add('active');
    } else {
      body.classList.remove('mode-cooking');
      if (badge) {
        badge.innerText = 'パンモード';
        badge.style.backgroundColor = '#f59e0b'; // Amber
      }
      const activeBtn = document.querySelector('.mode-btn[onclick*="bread"]');
      if (activeBtn) activeBtn.classList.add('active');
    }
    toggleSidebar();
  }


  // --- ブランド区分（複数選択）UI制御 ---
  window.toggleBrandDropdown = function(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('brandDropdownMenu');
    if (!menu) return;
    menu.style.display = (menu.style.display === 'none' || !menu.style.display) ? 'block' : 'none';
  };

  window.onBrandCheckboxChange = function() {
    const cbs = document.querySelectorAll('.brand-option-cb');
    const selected = [];
    cbs.forEach(cb => {
      if (cb.checked) selected.push(cb.value);
    });
    const valStr = selected.join(', ');
    const input = document.getElementById('brandCategory');
    if (input) input.value = valStr;
    const label = document.getElementById('brandDropdownLabel');
    if (label) {
      if (selected.length === 0) {
        label.innerHTML = '--選択--';
      } else {
        label.innerHTML = selected.map(b =>
          '<span style="background: #e0f2fe; border: 1px solid #7dd3fc; color: #0369a1; padding: 0px 6px; border-radius: 3px; font-size: 0.78rem; font-weight: bold;">' + b + '</span>'
        ).join('');
      }
    }
    const printSpan = document.querySelector('.brand-print');
    if (printSpan) {
      printSpan.innerText = valStr;
    }
  };

  window.setBrandCategoryValue = function(rawVal) {
    let arr = [];
    if (Array.isArray(rawVal)) {
      arr = rawVal;
    } else if (typeof rawVal === 'string' && rawVal && rawVal !== '--選択--') {
      arr = rawVal.split(',').map(s => s.trim()).filter(s => s && s !== '--選択--');
    }
    const cbs = document.querySelectorAll('.brand-option-cb');
    cbs.forEach(cb => {
      cb.checked = arr.includes(cb.value);
    });
    window.onBrandCheckboxChange();
  };

  document.addEventListener('click', function(e) {
    const container = document.querySelector('.brand-multiselect-container');
    const menu = document.getElementById('brandDropdownMenu');
    if (menu && menu.style.display === 'block') {
      if (!container || !container.contains(e.target)) {
        menu.style.display = 'none';
      }
    }
  });


  // --- 簡易手順書（横6列一覧表）自動生成・プレビュー・印刷機能（工程順・使う順並び替え対応） ---
  let quickSheetItems = [];
  let quickSheetObjectUrls = [];
  let quickSheetGroupTitles = {};
  let qsDragState = null;

  function loadSavedQuickSheetCustomMap() {
    try {
      const raw = safeStorage.getItem('quickSheetCustomFlowMap_v1');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveQuickSheetCustomForItem(item) {
    if (!item || !item.menuCode) return;
    try {
      const map = loadSavedQuickSheetCustomMap();
      map[item.menuCode] = {
        productName: item.productName,
        breakBefore: !!item.breakBefore,
        flowRows: item.flowRows
      };
      safeStorage.setItem('quickSheetCustomFlowMap_v1', JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save quickSheetCustomFlowMap_v1:', e);
    }
  }

  // マスタやレシピデータから初期の工程順リスト（ホイロ前食材 → ホイロ → 焼成前食材 → 焼成 → 焼成後食材）を構築・同期
  function buildChronologicalFlowRows(r, ings, savedCustom) {
    const proofTimeStr = (r.proofTime !== undefined && r.proofTime !== '') ? `${r.proofTime}分` : '40分';
    const bakeTimeStr = (r.bakeTime !== undefined && r.bakeTime !== '') ? `${r.bakeTime}分` : '10分';
    const pL = r.proofL || 0;
    const pW = r.proofW || 0;
    const pH = r.proofH || 0;
    const maxLoad = r.maxLoad || 6;
    const defaultProofText = `ホイロ　${proofTimeStr}`;
    const defaultProofSpec = `規格: 縦${pL}×横${pW}×高${pH}cm / のせ数${maxLoad}個`;
    const defaultBakeText = `焼成　${bakeTimeStr}`;

    const latestIngRows = ings.map(ing => ({
      type: 'ing',
      code: ing.code || '',
      name: ing.name || '',
      amountUnit: `${ing.amount || ''}${ing.unit || ''}`
    }));

    // 過去に並び替えた順序が保存されている場合は、その順番（ホイロ前・焼成前・焼成後）を維持しつつ最新の原価シート使用量を反映
    if (savedCustom && Array.isArray(savedCustom.flowRows) && savedCustom.flowRows.length > 0) {
      const usedLatestIdx = new Set();
      const mergedRows = [];

      savedCustom.flowRows.forEach(sRow => {
        if (sRow.type === 'proof' || sRow.type === 'bake') {
          mergedRows.push({ ...sRow });
        } else {
          // 対応する最新食材があれば使用量を最新化
          let matchIdx = -1;
          if (sRow.code) {
            matchIdx = latestIngRows.findIndex((l, idx) => !usedLatestIdx.has(idx) && l.code && l.code === sRow.code);
          }
          if (matchIdx === -1 && sRow.name) {
            matchIdx = latestIngRows.findIndex((l, idx) => !usedLatestIdx.has(idx) && l.name === sRow.name);
          }
          if (matchIdx !== -1) {
            usedLatestIdx.add(matchIdx);
            mergedRows.push({
              type: 'ing',
              code: latestIngRows[matchIdx].code,
              name: sRow.name || latestIngRows[matchIdx].name,
              amountUnit: latestIngRows[matchIdx].amountUnit
            });
          } else {
            mergedRows.push({ ...sRow });
          }
        }
      });

      // 新たに原価シートで追加された食材があれば焼成の前に差し込む
      latestIngRows.forEach((lRow, idx) => {
        if (!usedLatestIdx.has(idx)) {
          const bakePos = mergedRows.findIndex(r => r.type === 'bake');
          if (bakePos !== -1) {
            mergedRows.splice(bakePos, 0, lRow);
          } else {
            mergedRows.push(lRow);
          }
        }
      });

      return mergedRows;
    }

    // 初回生成時：
    // 1行目の生地（または最初の食材）→ 【ホイロ】 → 残りの食材 → 【焼成】 の順に自動配置（画面上で▲▼やドラッグでいつでも自由に移動可能）
    const rows = [];
    if (latestIngRows.length > 0) {
      rows.push(latestIngRows[0]);
      rows.push({
        type: 'proof',
        text: defaultProofText,
        specText: defaultProofSpec
      });
      for (let i = 1; i < latestIngRows.length; i++) {
        rows.push(latestIngRows[i]);
      }
      rows.push({
        type: 'bake',
        text: defaultBakeText
      });
    } else {
      rows.push({
        type: 'proof',
        text: defaultProofText,
        specText: defaultProofSpec
      });
      rows.push({
        type: 'bake',
        text: defaultBakeText
      });
    }
    return rows;
  }

  window.openQuickReferenceSheetFromModal = async function() {
    const checkedBoxes = Array.from(document.querySelectorAll('#modalRecipeGrid .batch-recipe-checkbox:checked'));
    if (checkedBoxes.length === 0) {
      alert('簡易手順書に出力する商品にチェックを入れてください。');
      return;
    }

    const codes = checkedBoxes.map(cb => String(cb.value));
    closeRecipeListModal();
    await buildQuickReferenceSheetByCodes(codes);
  };

  async function buildQuickReferenceSheetByCodes(codes) {
    quickSheetObjectUrls.forEach(url => URL.revokeObjectURL(url));
    quickSheetObjectUrls = [];
    quickSheetItems = [];
    const customMap = loadSavedQuickSheetCustomMap();

    for (const code of codes) {
      const r = await recipeDB.getRecipe(code);
      if (!r) continue;

      let ings = Array.isArray(r.ingredients) ? r.ingredients : [];
      if (r.menuCode && window.menuMaster && window.menuMaster[r.menuCode] && Array.isArray(window.menuMaster[r.menuCode].ingredients) && window.menuMaster[r.menuCode].ingredients.length > 0 && typeof mergeIngredientsWithSaved === 'function') {
        ings = mergeIngredientsWithSaved(window.menuMaster[r.menuCode].ingredients, ings);
      }

      let imgUrl = '';
      if (r.mainImageBlob) {
        imgUrl = URL.createObjectURL(r.mainImageBlob);
        quickSheetObjectUrls.push(imgUrl);
      }

      const savedCustom = customMap[r.menuCode] || null;
      const flowRows = buildChronologicalFlowRows(r, ings, savedCustom);

      quickSheetItems.push({
        menuCode: r.menuCode,
        productName: (savedCustom && savedCustom.productName) ? savedCustom.productName : (r.productName || '無題の商品'),
        brandCategory: r.brandCategory || '',
        imgUrl,
        breakBefore: savedCustom ? !!savedCustom.breakBefore : false,
        flowRows
      });
    }

    if (quickSheetItems.length === 0) {
      alert('選択された手順書データが見つかりませんでした。');
      return;
    }

    let pageStyle = document.getElementById('quickSheetPrintPageStyle');
    if (!pageStyle) {
      pageStyle = document.createElement('style');
      pageStyle.id = 'quickSheetPrintPageStyle';
      pageStyle.textContent = '@media print { @page { size: A4 landscape; margin: 6mm 7mm; } }';
      document.head.appendChild(pageStyle);
    }

    document.body.classList.add('is-quick-sheet-mode');
    renderQuickReferenceSheet();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.renderQuickReferenceSheet = function() {
    let container = document.getElementById('quickSheetViewContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'quickSheetViewContainer';
      const wrapper = document.getElementById('editorWrapper');
      if (wrapper) {
        wrapper.appendChild(container);
      } else {
        document.body.appendChild(container);
      }
    }

    const rows = [];
    let currentRow = [];
    quickSheetItems.forEach((item, idx) => {
      if (idx > 0 && (item.breakBefore || currentRow.length === 6)) {
        rows.push(currentRow);
        currentRow = [];
      }
      currentRow.push({ item, index: idx });
    });
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    const today = new Date();
    const dateLabel = `更新日: ${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

    let rowsHtml = '';
    rows.forEach((rowEntries, rIdx) => {
      const savedGroupTitle = quickSheetGroupTitles[rIdx] || '';
      let cardsHtml = '';

      rowEntries.forEach(({ item, index }) => {
        const photoHtml = item.imgUrl
          ? `<img src="${item.imgUrl}" alt="${item.productName}">`
          : `<span class="quick-sheet-card-photo-empty">写真なし</span>`;

        let flowRowsHtml = '';
        item.flowRows.forEach((row, rowIdx) => {
          const actionBtnsHtml = `
            <span class="qs-row-actions">
              <button type="button" class="qs-row-btn" title="1つ上へ移動" onclick="moveQuickSheetFlowRow(${index}, ${rowIdx}, -1)" ${rowIdx === 0 ? 'disabled style="opacity:0.35;"' : ''}>▲</button>
              <button type="button" class="qs-row-btn" title="1つ下へ移動" onclick="moveQuickSheetFlowRow(${index}, ${rowIdx}, 1)" ${rowIdx === item.flowRows.length - 1 ? 'disabled style="opacity:0.35;"' : ''}>▼</button>
              <button type="button" class="qs-row-btn qs-row-del" title="この行を削除" onclick="removeQuickSheetFlowRow(${index}, ${rowIdx})">×</button>
            </span>`;

          const dragAttrs = `draggable="true" ondragstart="onQsRowDragStart(event, ${index}, ${rowIdx})" ondragover="onQsRowDragOver(event)" ondragleave="onQsRowDragLeave(event)" ondrop="onQsRowDrop(event, ${index}, ${rowIdx})"`;

          if (row.type === 'proof') {
            flowRowsHtml += `
              <tr class="qs-flow-row qs-type-proof" ${dragAttrs}>
                <td colspan="2" class="qs-process-cell">
                  <div style="display:flex; align-items:center;">
                    <span class="qs-drag-handle" title="ドラッグして順番移動">⠿</span>
                    <div style="flex:1;">
                      <div class="qs-proof-main" contenteditable="true" onblur="onQuickSheetFlowEdit(${index}, ${rowIdx}, 'text', this.innerText)">${row.text || 'ホイロ　40分'}</div>
                      <div class="qs-proof-spec" contenteditable="true" onblur="onQuickSheetFlowEdit(${index}, ${rowIdx}, 'specText', this.innerText)">${row.specText ?? ''}</div>
                    </div>
                  </div>
                  ${actionBtnsHtml}
                </td>
              </tr>`;
          } else if (row.type === 'bake') {
            flowRowsHtml += `
              <tr class="qs-flow-row qs-type-bake" ${dragAttrs}>
                <td colspan="2" class="qs-process-cell">
                  <div style="display:flex; align-items:center;">
                    <span class="qs-drag-handle" title="ドラッグして順番移動">⠿</span>
                    <div class="qs-bake-main" style="flex:1;" contenteditable="true" onblur="onQuickSheetFlowEdit(${index}, ${rowIdx}, 'text', this.innerText)">${row.text || '焼成　10分'}</div>
                  </div>
                  ${actionBtnsHtml}
                </td>
              </tr>`;
          } else {
            flowRowsHtml += `
              <tr class="qs-flow-row qs-type-ing" ${dragAttrs}>
                <td class="qs-ing-name">
                  <span class="qs-drag-handle" title="ドラッグして順番移動">⠿</span>
                  <span contenteditable="true" onblur="onQuickSheetFlowEdit(${index}, ${rowIdx}, 'name', this.innerText)">${row.name || ''}</span>
                </td>
                <td class="qs-ing-amt">
                  <span contenteditable="true" onblur="onQuickSheetFlowEdit(${index}, ${rowIdx}, 'amountUnit', this.innerText)">${row.amountUnit || ''}</span>
                  ${actionBtnsHtml}
                </td>
              </tr>`;
          }
        });

        cardsHtml += `
          <div class="quick-sheet-card">
            <div class="quick-sheet-card-toolbar">
              <div>
                <button type="button" title="カードを左へ移動" onclick="moveQuickSheetItem(${index}, -1)" ${index === 0 ? 'disabled style="opacity:0.4;"' : ''}>◀</button>
                <button type="button" title="カードを右へ移動" onclick="moveQuickSheetItem(${index}, 1)" ${index === quickSheetItems.length - 1 ? 'disabled style="opacity:0.4;"' : ''}>▶</button>
                <button type="button" class="${item.breakBefore ? 'qs-break-active' : ''}" title="この商品から次の段（新しい見出し行）へ改行" onclick="toggleQuickSheetRowBreak(${index})" ${index === 0 ? 'disabled style="opacity:0.4;"' : ''}>⤵改行</button>
              </div>
              <button type="button" class="qs-del-btn" title="一覧から除外" onclick="removeQuickSheetItem(${index})">✖</button>
            </div>
            <div class="quick-sheet-card-title" contenteditable="true" onblur="quickSheetItems[${index}].productName = this.innerText.trim(); saveQuickSheetCustomForItem(quickSheetItems[${index}]);">${item.productName}</div>
            <div class="quick-sheet-card-photo">${photoHtml}</div>
            <table class="quick-sheet-ing-table">
              <tbody>
                ${flowRowsHtml}
              </tbody>
            </table>
            <div class="quick-sheet-add-bar">
              <button type="button" onclick="addQuickSheetFlowRow(${index}, 'ing')" title="食材や注記の行を追加">＋食材・注記</button>
              <button type="button" onclick="addQuickSheetFlowRow(${index}, 'proof')" title="ホイロ・解凍の行を追加">＋ホイロ</button>
              <button type="button" onclick="addQuickSheetFlowRow(${index}, 'bake')" title="2次焼成などの焼成行を追加">＋焼成</button>
            </div>
          </div>`;
      });

      rowsHtml += `
        <div class="quick-sheet-row-block">
          <div class="quick-sheet-group-header" contenteditable="true" data-placeholder="【生地名・カテゴリー見出しを入力（例：【キューブ】【ホテル生地】 ※空欄なら印刷時非表示）】" onblur="onQuickSheetGroupTitleEdit(${rIdx}, this.innerText)">${savedGroupTitle}</div>
          <div class="quick-sheet-grid-6">
            ${cardsHtml}
          </div>
        </div>`;
    });

    container.innerHTML = `
      <div class="quick-sheet-action-bar">
        <div class="quick-sheet-action-left">
          <div class="quick-sheet-action-title">📋 簡易手順書（横6列一覧・${quickSheetItems.length}商品）プレビュー</div>
          <div class="quick-sheet-action-sub">💡 「⠿」をドラッグ または 行右側の「▲▼」ボタンで、【ホイロまでの食材 → ホイロ → 焼成までの食材 → 焼成 → 焼成後の食材】の順に自由に並び替えられます（並び順は自動保存されます）</div>
        </div>
        <div class="quick-sheet-action-buttons">
          <button type="button" style="background: #334155; color: #fff;" onclick="reopenModalFromQuickSheet()">📂 商品を選び直す</button>
          <button type="button" style="background: #0d9488; color: #fff; font-size: 0.88rem; padding: 7px 16px;" onclick="window.print()">🖨️ この簡易手順書を印刷・PDF保存（A4横）</button>
          <button type="button" style="background: #ef4444; color: #fff;" onclick="closeQuickReferenceSheet()">✖ 通常の編集画面に戻る</button>
        </div>
      </div>
      <div class="quick-sheet-paper">
        <div class="quick-sheet-doc-header">
          <div class="quick-sheet-doc-title" contenteditable="true">BRC・BCC 簡易手順書一覧</div>
          <div class="quick-sheet-doc-date" contenteditable="true">${dateLabel}</div>
        </div>
        ${rowsHtml}
      </div>
    `;
  };

  window.onQuickSheetGroupTitleEdit = function(rowIdx, text) {
    quickSheetGroupTitles[rowIdx] = text.trim();
  };

  window.onQuickSheetFlowEdit = function(itemIdx, rowIdx, field, val) {
    const item = quickSheetItems[itemIdx];
    if (item && item.flowRows[rowIdx]) {
      item.flowRows[rowIdx][field] = val.trim();
      saveQuickSheetCustomForItem(item);
    }
  };

  window.moveQuickSheetFlowRow = function(itemIdx, rowIdx, dir) {
    const item = quickSheetItems[itemIdx];
    if (!item) return;
    const target = rowIdx + dir;
    if (target < 0 || target >= item.flowRows.length) return;
    const temp = item.flowRows[rowIdx];
    item.flowRows[rowIdx] = item.flowRows[target];
    item.flowRows[target] = temp;
    saveQuickSheetCustomForItem(item);
    renderQuickReferenceSheet();
  };

  window.onQsRowDragStart = function(e, itemIdx, rowIdx) {
    qsDragState = { itemIdx, rowIdx };
    e.dataTransfer.effectAllowed = 'move';
  };

  window.onQsRowDragOver = function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const tr = e.target.closest('tr.qs-flow-row');
    if (tr) tr.classList.add('qs-drag-over');
  };

  window.onQsRowDragLeave = function(e) {
    const tr = e.target.closest('tr.qs-flow-row');
    if (tr) tr.classList.remove('qs-drag-over');
  };

  window.onQsRowDrop = function(e, targetItemIdx, targetRowIdx) {
    e.preventDefault();
    const tr = e.target.closest('tr.qs-flow-row');
    if (tr) tr.classList.remove('qs-drag-over');
    if (!qsDragState || qsDragState.itemIdx !== targetItemIdx) return;
    const fromIdx = qsDragState.rowIdx;
    qsDragState = null;
    if (fromIdx === targetRowIdx) return;
    const item = quickSheetItems[targetItemIdx];
    if (!item) return;
    const [moved] = item.flowRows.splice(fromIdx, 1);
    item.flowRows.splice(targetRowIdx, 0, moved);
    saveQuickSheetCustomForItem(item);
    renderQuickReferenceSheet();
  };

  window.addQuickSheetFlowRow = function(itemIdx, type) {
    const item = quickSheetItems[itemIdx];
    if (!item) return;
    if (type === 'proof') {
      item.flowRows.push({ type: 'proof', text: 'ホイロ　40分', specText: '' });
    } else if (type === 'bake') {
      item.flowRows.push({ type: 'bake', text: '焼成　5分' });
    } else {
      item.flowRows.push({ type: 'ing', name: '食材・注記', amountUnit: '' });
    }
    saveQuickSheetCustomForItem(item);
    renderQuickReferenceSheet();
  };

  window.removeQuickSheetFlowRow = function(itemIdx, rowIdx) {
    const item = quickSheetItems[itemIdx];
    if (!item) return;
    item.flowRows.splice(rowIdx, 1);
    saveQuickSheetCustomForItem(item);
    renderQuickReferenceSheet();
  };

  window.moveQuickSheetItem = function(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= quickSheetItems.length) return;
    const temp = quickSheetItems[index];
    quickSheetItems[index] = quickSheetItems[target];
    quickSheetItems[target] = temp;
    renderQuickReferenceSheet();
  };

  window.toggleQuickSheetRowBreak = function(index) {
    if (index <= 0 || index >= quickSheetItems.length) return;
    quickSheetItems[index].breakBefore = !quickSheetItems[index].breakBefore;
    saveQuickSheetCustomForItem(quickSheetItems[index]);
    renderQuickReferenceSheet();
  };

  window.removeQuickSheetItem = function(index) {
    quickSheetItems.splice(index, 1);
    if (quickSheetItems.length === 0) {
      closeQuickReferenceSheet();
      return;
    }
    renderQuickReferenceSheet();
  };

  window.reopenModalFromQuickSheet = function() {
    const modal = document.getElementById('recipeListModal');
    if (modal) {
      modal.style.display = 'flex';
    } else {
      openRecipeListModal();
    }
  };

  window.closeQuickReferenceSheet = function() {
    document.body.classList.remove('is-quick-sheet-mode');
    const pageStyle = document.getElementById('quickSheetPrintPageStyle');
    if (pageStyle) pageStyle.remove();
    const container = document.getElementById('quickSheetViewContainer');
    if (container) container.innerHTML = '';
    quickSheetObjectUrls.forEach(url => URL.revokeObjectURL(url));
    quickSheetObjectUrls = [];
  };


  // --- 原価シート抽出 ＆ 黄色塗りつぶしデザイン付きExcel出力機能（チェック選択・店舗セット保存・コード一括貼付対応） ---
  let jqWorkbookCache = null;
  let jqExtractedRows = [];
  let jqSelectedCodes = new Set();
  let jqSourceFileName = '原価シート抽出';

  function loadJqPresetsMap() {
    try {
      const raw = safeStorage.getItem('jqSelectionPresets_v1');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveJqPresetsMap(map) {
    try {
      safeStorage.setItem('jqSelectionPresets_v1', JSON.stringify(map));
    } catch (e) {}
  }

  function refreshJqPresetSelectUI() {
    const sel = document.getElementById('jqPresetSelect');
    if (!sel) return;
    const map = loadJqPresetsMap();
    const names = Object.keys(map);
    sel.innerHTML = '<option value="">-- 店舗・ラインナップ保存セット呼出 --</option>';
    names.forEach(name => {
      const codes = Array.isArray(map[name]) ? map[name] : [];
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = `${name} (${codes.length}品)`;
      sel.appendChild(opt);
    });
  }

  window.openJqExtractModal = function() {
    let modal = document.getElementById('jqExtractModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'jqExtractModal';
      modal.className = 'modal-overlay';
      modal.onclick = function(e) {
        if (e.target.id === 'jqExtractModal') closeJqExtractModal();
      };
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header" style="background: linear-gradient(90deg, #1e293b, #334155); color: #fff;">
            <h3 style="margin:0; color:#fef08a;">📊 原価シート抽出 ＆ Excel出力（対象商品の選択・店舗プリセット対応）</h3>
            <button type="button" class="close-modal-btn" style="color:#fff;" onclick="closeJqExtractModal()">×</button>
          </div>
          <div class="modal-body" style="display:flex; flex-direction:column; flex:1; overflow:hidden;">
            <!-- 上段：ファイル選択＆出力ボタン -->
            <div class="jq-toolbar">
              <div class="jq-toolbar-group">
                <label style="font-weight:bold; font-size:0.82rem; color:#1e293b;">① 元ファイル:</label>
                <input type="file" id="jqFileInput" accept=".xlsx,.xls,.csv" onchange="handleJqFileSelect(this)" style="font-size:0.8rem; max-width:210px;">
                <span id="jqSheetSelectWrap" style="display:none; align-items:center; gap:4px;">
                  <label style="font-size:0.78rem; color:#475569;">シート:</label>
                  <select id="jqSheetSelect" onchange="reparseJqCurrentSheet()" style="font-size:0.78rem; padding:3px 6px; border:1px solid #cbd5e1; border-radius:4px;"></select>
                </span>
                <span style="display:inline-flex; align-items:center; gap:4px;">
                  <label style="font-size:0.78rem; color:#475569;">抽出列:</label>
                  <select id="jqColModeSelect" onchange="reparseJqCurrentSheet()" style="font-size:0.78rem; padding:3px 6px; border:1px solid #cbd5e1; border-radius:4px;">
                    <option value="auto">自動判定（J〜Q列 / 先頭列）</option>
                    <option value="jq">J〜Q列固定（10〜17列目）</option>
                    <option value="ah">A〜H列固定（1〜8列目）</option>
                  </select>
                </span>
                <span style="display:inline-flex; align-items:center; gap:4px;">
                  <label style="font-size:0.78rem; color:#475569;">黄色:</label>
                  <select id="jqYellowColorSelect" onchange="renderJqPreviewTable()" style="font-size:0.78rem; padding:3px 6px; border:1px solid #cbd5e1; border-radius:4px; background:#FFF176; font-weight:bold;">
                    <option value="FFF176" style="background:#FFF176;">標準イエロー</option>
                    <option value="FFFF00" style="background:#FFFF00;">鮮やかな黄色</option>
                    <option value="FFF9C4" style="background:#FFF9C4;">パステルイエロー</option>
                  </select>
                </span>
              </div>
              <div class="jq-toolbar-group">
                <span id="jqStatBadge" class="jq-stat-badge">0 / 0 メニュー選択中</span>
                <button type="button" id="jqSyncMasterBtn" onclick="importJqToToolMaster()" disabled style="background:#0284c7; color:#fff; font-size:0.78rem; padding:6px 10px;" title="チェックしたメニューを手順書ツールの原価マスタにも反映します">
                  🔄 選択分をツールマスタに反映
                </button>
                <button type="button" id="jqExportExcelBtn" onclick="exportJqStyledExcel()" disabled style="background:#eab308; color:#0f172a; font-size:0.84rem; font-weight:bold; padding:7px 14px; box-shadow:0 2px 4px rgba(0,0,0,0.12);">
                  📥 チェックした商品をExcel(.xlsx)出力
                </button>
              </div>
            </div>

            <!-- 中段：多品種ラインナップを瞬時に選ぶスマート選択バー -->
            <div class="jq-smart-bar">
              <div class="jq-toolbar-group">
                <span style="font-weight:bold; color:#1e40af;">⚡ 店舗・一括選択:</span>
                <select id="jqPresetSelect" onchange="applyJqPreset(this.value)" style="font-size:0.78rem; padding:3px 6px; border:1px solid #93c5fd; border-radius:4px; background:#fff; min-width:210px;"></select>
                <button type="button" class="jq-mini-btn" onclick="saveCurrentJqPreset()" title="現在チェックしている商品リストに名前（例：BRC標準店、BCC○○店）をつけて保存します">💾 現在の選択をセット保存</button>
                <button type="button" class="jq-mini-btn" onclick="deleteSelectedJqPreset()" title="選択中の保存セットを削除">🗑️</button>
              </div>
              <div class="jq-toolbar-group">
                <button type="button" class="jq-mini-btn" onclick="openJqPasteCodesPrompt()" style="background:#fef9c3 !important; border-color:#eab308 !important; color:#854d0e !important;" title="Excelやリストから複数のメニューコードや商品名を貼り付けて一発チェックします">
                  📋 コード・商品名を一括貼付で選択
                </button>
                <select id="jqDbBrandQuickSelect" onchange="selectJqBySavedDBBrand(this.value); this.value='';" style="font-size:0.75rem; padding:3px 6px; border:1px solid #93c5fd; border-radius:4px; background:#fff;">
                  <option value="">🏪 保存済み手順書から自動チェック...</option>
                  <option value="__ALL_SAVED__">保存済み手順書がある全商品</option>
                  <option value="BAQET">ブランド：BAQET の保存済み商品</option>
                  <option value="BAKERY RESTAURANT C">ブランド：BAKERY RESTAURANT C の保存済み商品</option>
                  <option value="BAKERY CAFE C">ブランド：BAKERY CAFE C の保存済み商品</option>
                </select>
                <label style="font-size:0.76rem; color:#334155; display:inline-flex; align-items:center; gap:3px; cursor:pointer; user-select:none;">
                  <input type="checkbox" id="jqIncludeHeaderCb" checked onchange="renderJqPreviewTable()"> 見出し行あり
                </label>
              </div>
            </div>

            <!-- 下段：2ペイン（左＝チェックボックス選択リスト、右＝抽出プレビュー表） -->
            <div class="jq-workspace">
              <div class="jq-left-panel">
                <div class="jq-left-header">
                  <input type="text" id="jqFilterInput" placeholder="🔍 コード・商品名・食材名で検索（例: キューブ）" oninput="renderJqChecklistAndPreview()" style="width:100%; padding:5px 8px; font-size:0.78rem; border:1px solid #cbd5e1; border-radius:4px; box-sizing:border-box;">
                  <div style="display:flex; gap:4px; flex-wrap:wrap; justify-content:space-between;">
                    <button type="button" class="jq-mini-btn" style="flex:1;" onclick="toggleJqVisibleChecks(true)" title="検索で表示されている商品をすべてチェック追加します">☑ 表示中をすべて選択</button>
                    <button type="button" class="jq-mini-btn" style="flex:1;" onclick="toggleJqVisibleChecks(false)" title="検索で表示されている商品のチェックを外します">☐ 表示中を解除</button>
                    <button type="button" class="jq-mini-btn" onclick="clearAllJqChecks()" title="すべてのチェックをクリア">全クリア</button>
                  </div>
                </div>
                <div id="jqMenuChecklist" class="jq-menu-checklist">
                  <div style="text-align:center; color:#94a3b8; padding:30px 10px; font-size:0.78rem;">ファイルを選択するとここにメニュー一覧が表示されます</div>
                </div>
              </div>

              <div id="jqPreviewContainer" class="jq-preview-wrap">
                <div style="text-align:center; color:#64748b; padding:45px 20px; font-size:0.86rem;">
                  上の <b>「① 元ファイル」</b> からExcel（.xlsx / .xls）またはCSVを選択してください。<br><br>
                  <span style="font-size:0.78rem; color:#475569; display:inline-block; text-align:left; background:#f8fafc; padding:10px 14px; border-radius:6px; border:1px solid #e2e8f0;">
                    <b>💡 多品種ラインナップでも簡単に抽出できる4つの方法：</b><br>
                    1. <b>左のリストでポチポチ選択</b>（初期状態は全選択／「全クリア」から必要なものだけチェックも可）<br>
                    2. <b>キーワード検索＋「☑ 表示中をすべて選択」</b>（例：「キューブ」で検索して一括選択 → 「クロワッサン」で検索して追加選択）<br>
                    3. <b>「📋 コード・商品名を一括貼付で選択」</b>（別シートのメニューコード列をコピー＆ペーストして50品でも一発チェック）<br>
                    4. <b>「💾 現在の選択をセット保存」</b>（店舗や業態ごとに保存しておけば、次回からワンクリックで同じ商品を抽出！）
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    refreshJqPresetSelectUI();
    modal.style.display = 'flex';
  };

  window.closeJqExtractModal = function() {
    const modal = document.getElementById('jqExtractModal');
    if (modal) modal.style.display = 'none';
  };

  window.handleJqFileSelect = function(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    jqSourceFileName = file.name.replace(/\.[^.]+$/, '');
    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();

    if (isCSV) {
      reader.onload = function(evt) {
        try {
          const text = evt.target.result;
          const lines = text.split(/\r?\n/);
          const rows = [];
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim()) rows.push(parseCSVLine(lines[i]));
          }
          jqWorkbookCache = { SheetNames: ['CSV'], Sheets: { CSV: rows }, isRawRows: true };
          document.getElementById('jqSheetSelectWrap').style.display = 'none';
          parseJqRowsFromGrid(rows);
        } catch (err) {
          alert('CSVの読み込みに失敗しました: ' + err.message);
        }
      };
      reader.readAsText(file, 'Shift_JIS');
    } else {
      reader.onload = function(evt) {
        try {
          const data = new Uint8Array(evt.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          jqWorkbookCache = wb;
          const sheetSelect = document.getElementById('jqSheetSelect');
          const sheetWrap = document.getElementById('jqSheetSelectWrap');
          sheetSelect.innerHTML = '';
          wb.SheetNames.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            sheetSelect.appendChild(opt);
          });
          sheetWrap.style.display = wb.SheetNames.length > 1 ? 'inline-flex' : 'none';
          reparseJqCurrentSheet();
        } catch (err) {
          alert('Excelファイルの解析に失敗しました: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  window.reparseJqCurrentSheet = function() {
    if (!jqWorkbookCache) return;
    if (jqWorkbookCache.isRawRows) {
      parseJqRowsFromGrid(jqWorkbookCache.Sheets.CSV);
      return;
    }
    const sheetSelect = document.getElementById('jqSheetSelect');
    const sheetName = (sheetSelect && sheetSelect.value) ? sheetSelect.value : jqWorkbookCache.SheetNames[0];
    const ws = jqWorkbookCache.Sheets[sheetName];
    if (!ws) return;
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    parseJqRowsFromGrid(rows);
  };

  function detectJqStartColumn(rows, mode) {
    if (mode === 'jq') return 9;
    if (mode === 'ah') return 0;

    let scoreJ = 0;
    let scoreA = 0;
    const sampleLimit = Math.min(rows.length, 120);

    for (let i = 0; i < sampleLimit; i++) {
      const r = rows[i];
      if (!r) continue;
      if (r.length >= 14) {
        const c9 = String(r[9] ?? '').trim();
        const c10 = String(r[10] ?? '').trim();
        const c11 = String(r[11] ?? '').trim();
        const c12 = String(r[12] ?? '').trim();
        if (/^\d{3,8}$/.test(c9) && c10 && !c11) scoreJ += 3;
        if (!c9 && /^[0-9A-Za-z]{4,16}$/.test(c10) && c11 && c12 !== '') scoreJ += 2;
      }
      if (r.length >= 5) {
        const c0 = String(r[0] ?? '').trim();
        const c1 = String(r[1] ?? '').trim();
        const c2 = String(r[2] ?? '').trim();
        const c3 = String(r[3] ?? '').trim();
        if (/^\d{3,8}$/.test(c0) && c1 && !c2) scoreA += 3;
        if (!c0 && /^[0-9A-Za-z]{4,16}$/.test(c1) && c2 && c3 !== '') scoreA += 2;
      }
    }

    return scoreJ >= scoreA && scoreJ > 0 ? 9 : 0;
  }

  function parseJqRowsFromGrid(rows) {
    const colModeEl = document.getElementById('jqColModeSelect');
    const colMode = colModeEl ? colModeEl.value : 'auto';
    const baseCol = detectJqStartColumn(rows, colMode);

    const extracted = [];
    let currentMenu = null;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length <= baseCol) continue;

      const cJ = String(r[baseCol] ?? '').trim();
      const cK = String(r[baseCol + 1] ?? '').trim();
      const cL = String(r[baseCol + 2] ?? '').trim();
      const cM = String(r[baseCol + 3] ?? '').trim();
      const cN = String(r[baseCol + 4] ?? '').trim();
      const cO = String(r[baseCol + 5] ?? '').trim();
      const cP = String(r[baseCol + 6] ?? '').trim();
      const cQ = String(r[baseCol + 7] ?? '').trim();

      if (!cJ && !cK && !cL && !cM && !cN && !cO && !cP && !cQ) continue;
      if (cJ === 'メニューコード' || cJ === 'ﾒﾆｭｰｺｰﾄﾞ' || cK === '商品コード' || cK === 'メニュー名称') continue;

      const isMenuParentRow = (cJ !== '' && cK !== '' && cL === '' && cM === '');

      if (isMenuParentRow) {
        currentMenu = {
          uid: `${cJ}_${extracted.length}`,
          rowType: 'menu',
          menuCode: cJ,
          menuName: cK,
          colJ: cJ,
          colK: cK,
          colL: '',
          colM: '',
          colN: '',
          colO: cO,
          colP: cP,
          colQ: cQ,
          children: []
        };
        extracted.push(currentMenu);
      } else if (cK !== '' || cL !== '') {
        const ingRow = {
          rowType: 'ing',
          parentCode: currentMenu ? currentMenu.menuCode : '',
          parentName: currentMenu ? currentMenu.menuName : '',
          colJ: cJ,
          colK: cK,
          colL: cL,
          colM: cM,
          colN: cN,
          colO: cO,
          colP: cP,
          colQ: cQ
        };
        if (currentMenu) {
          currentMenu.children.push(ingRow);
        } else {
          const fallbackCode = cJ || '未設定';
          currentMenu = {
            uid: `${fallbackCode}_${extracted.length}`,
            rowType: 'menu',
            menuCode: fallbackCode,
            menuName: '（メニュー行なし）',
            colJ: cJ,
            colK: '',
            colL: '',
            colM: '',
            colN: '',
            colO: '',
            colP: '',
            colQ: '',
            children: [ingRow]
          };
          extracted.push(currentMenu);
        }
      }
    }

    jqExtractedRows = extracted;
    // 初期状態はすべて選択（すぐに全クリアや絞り込み選択が可能）
    jqSelectedCodes = new Set(extracted.map(m => m.menuCode));
    renderJqChecklistAndPreview();
  }

  function getVisibleJqMenuBlocksByQuery() {
    const qEl = document.getElementById('jqFilterInput');
    const q = qEl ? qEl.value.trim().toLowerCase() : '';
    if (!q) return jqExtractedRows;

    return jqExtractedRows.filter(menu => {
      if ((menu.menuCode || '').toLowerCase().includes(q)) return true;
      if ((menu.menuName || '').toLowerCase().includes(q)) return true;
      return menu.children.some(ing =>
        (ing.colK || '').toLowerCase().includes(q) ||
        (ing.colL || '').toLowerCase().includes(q)
      );
    });
  }

  function getCheckedJqMenuBlocks() {
    return jqExtractedRows.filter(menu => jqSelectedCodes.has(menu.menuCode));
  }

  window.renderJqChecklistAndPreview = function() {
    renderJqChecklist();
    renderJqPreviewTable();
  };

  window.renderJqChecklist = function() {
    const listEl = document.getElementById('jqMenuChecklist');
    if (!listEl) return;

    if (jqExtractedRows.length === 0) {
      listEl.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:30px 10px; font-size:0.78rem;">ファイルを選択するとここにメニュー一覧が表示されます</div>';
      return;
    }

    const visibleMenus = getVisibleJqMenuBlocksByQuery();
    if (visibleMenus.length === 0) {
      listEl.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px 10px; font-size:0.78rem;">検索条件に一致するメニューがありません</div>';
      return;
    }

    let html = '';
    visibleMenus.forEach(menu => {
      const checked = jqSelectedCodes.has(menu.menuCode);
      const safeCode = String(menu.menuCode).replace(/'/g, "\\'");
      html += `
        <label class="jq-check-item ${checked ? 'is-checked' : ''}">
          <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleSingleJqMenuCheck('${safeCode}', this.checked)">
          <span class="jq-check-code">${menu.menuCode}</span>
          <span class="jq-check-name" title="${menu.menuName}">${menu.menuName}</span>
          <span class="jq-check-count">(${menu.children.length})</span>
        </label>`;
    });
    listEl.innerHTML = html;
  };

  window.toggleSingleJqMenuCheck = function(menuCode, checked) {
    if (checked) {
      jqSelectedCodes.add(String(menuCode));
    } else {
      jqSelectedCodes.delete(String(menuCode));
    }
    renderJqChecklistAndPreview();
  };

  window.toggleJqVisibleChecks = function(shouldCheck) {
    const visibleMenus = getVisibleJqMenuBlocksByQuery();
    visibleMenus.forEach(m => {
      if (shouldCheck) jqSelectedCodes.add(m.menuCode);
      else jqSelectedCodes.delete(m.menuCode);
    });
    renderJqChecklistAndPreview();
  };

  window.clearAllJqChecks = function() {
    jqSelectedCodes.clear();
    renderJqChecklistAndPreview();
  };

  // Excel等からコピーした複数のメニューコードや商品名を一括貼り付けして選択
  window.openJqPasteCodesPrompt = function() {
    if (jqExtractedRows.length === 0) {
      alert('先に「① 元ファイル」から原価シート（Excel/CSV）を読み込んでください。');
      return;
    }
    const raw = prompt('Excelやリストからコピーした「メニューコード」または「商品名」を貼り付けてください（改行・カンマ・スペース・タブ区切りすべて対応）：');
    if (!raw || !raw.trim()) return;

    const tokens = raw.split(/[\r\n,\t、 ]+/).map(s => s.trim()).filter(Boolean);
    if (tokens.length === 0) return;

    const replaceMode = confirm(`貼り付けた条件で選択します。\n\n【OK】：現在の選択をクリアして、貼り付けた商品だけを選択する\n【キャンセル】：現在選択中の商品に、貼り付けた商品を追加する`);
    if (replaceMode) {
      jqSelectedCodes.clear();
    }

    let hitCount = 0;
    jqExtractedRows.forEach(menu => {
      const mCode = String(menu.menuCode || '').trim();
      const mName = String(menu.menuName || '').trim();
      const matched = tokens.some(t =>
        mCode === t ||
        mCode.replace(/^0+/, '') === t.replace(/^0+/, '') ||
        (t.length >= 2 && mName.includes(t))
      );
      if (matched) {
        jqSelectedCodes.add(menu.menuCode);
        hitCount++;
      }
    });

    renderJqChecklistAndPreview();
    alert(`${hitCount} 件のメニューが一致し、チェックを選択しました！`);
  };

  // ツール内の保存済み手順書（または特定ブランド）に該当する商品を一括チェック
  window.selectJqBySavedDBBrand = async function(brandVal) {
    if (!brandVal) return;
    if (jqExtractedRows.length === 0) {
      alert('先に「① 元ファイル」から原価シート（Excel/CSV）を読み込んでください。');
      return;
    }
    try {
      const allRecipes = await recipeDB.getAllRecipes();
      const targetCodes = new Set();
      allRecipes.forEach(r => {
        if (!r || !r.menuCode) return;
        if (brandVal === '__ALL_SAVED__') {
          targetCodes.add(String(r.menuCode).trim());
        } else {
          const bList = String(r.brandCategory || '').split(',').map(s => s.trim());
          if (bList.includes(brandVal)) {
            targetCodes.add(String(r.menuCode).trim());
          }
        }
      });

      jqSelectedCodes.clear();
      let hitCount = 0;
      jqExtractedRows.forEach(m => {
        if (targetCodes.has(String(m.menuCode).trim())) {
          jqSelectedCodes.add(m.menuCode);
          hitCount++;
        }
      });
      renderJqChecklistAndPreview();
      alert(`保存済み手順書（${brandVal === '__ALL_SAVED__' ? '全商品' : brandVal}）に該当する ${hitCount} 件のメニューをチェックしました！`);
    } catch (e) {
      alert('保存済み手順書の参照中にエラーが発生しました: ' + e.message);
    }
  };

  // 店舗別・用途別の選択プリセット保存
  window.saveCurrentJqPreset = function() {
    const checked = getCheckedJqMenuBlocks();
    if (checked.length === 0) {
      alert('セット保存する商品に1つ以上チェックを入れてください。');
      return;
    }
    const sel = document.getElementById('jqPresetSelect');
    const defaultName = (sel && sel.value) ? sel.value : '';
    const name = prompt(`現在チェックしている ${checked.length} 品のラインナップを保存します。\nセット名（例：BRC標準店、BCC○○店、キューブ一式など）を入力してください：`, defaultName);
    if (!name || !name.trim()) return;

    const cleanName = name.trim();
    const map = loadJqPresetsMap();
    map[cleanName] = checked.map(m => m.menuCode);
    saveJqPresetsMap(map);
    refreshJqPresetSelectUI();
    if (sel) sel.value = cleanName;
    alert(`「${cleanName}」（${checked.length}品）を保存しました！\n次回から上のプルダウンを選ぶだけで同じ商品を一発選択できます。`);
  };

  window.applyJqPreset = function(presetName) {
    if (!presetName) return;
    if (jqExtractedRows.length === 0) {
      alert('先に「① 元ファイル」から原価シート（Excel/CSV）を読み込んでください。');
      return;
    }
    const map = loadJqPresetsMap();
    const codes = map[presetName];
    if (!Array.isArray(codes)) return;

    const codeSet = new Set(codes.map(c => String(c).trim()));
    jqSelectedCodes.clear();
    let hitCount = 0;
    jqExtractedRows.forEach(m => {
      if (codeSet.has(String(m.menuCode).trim())) {
        jqSelectedCodes.add(m.menuCode);
        hitCount++;
      }
    });
    renderJqChecklistAndPreview();
  };

  window.deleteSelectedJqPreset = function() {
    const sel = document.getElementById('jqPresetSelect');
    if (!sel || !sel.value) {
      alert('削除する保存セットをプルダウンから選択してください。');
      return;
    }
    const name = sel.value;
    if (!confirm(`保存セット「${name}」を削除しますか？`)) return;
    const map = loadJqPresetsMap();
    delete map[name];
    saveJqPresetsMap(map);
    refreshJqPresetSelectUI();
  };

  window.renderJqPreviewTable = function() {
    const container = document.getElementById('jqPreviewContainer');
    const badge = document.getElementById('jqStatBadge');
    const exportBtn = document.getElementById('jqExportExcelBtn');
    const syncBtn = document.getElementById('jqSyncMasterBtn');
    const colorSelect = document.getElementById('jqYellowColorSelect');
    const yellowHex = colorSelect ? colorSelect.value : 'FFF176';
    if (colorSelect) {
      colorSelect.style.backgroundColor = '#' + yellowHex;
    }

    const checkedBlocks = getCheckedJqMenuBlocks();
    let totalIngCount = 0;
    checkedBlocks.forEach(b => { totalIngCount += b.children.length; });

    if (badge) {
      badge.textContent = `選択中: ${checkedBlocks.length} / 全${jqExtractedRows.length}メニュー（食材 ${totalIngCount}行）`;
    }
    if (exportBtn) exportBtn.disabled = checkedBlocks.length === 0;
    if (syncBtn) syncBtn.disabled = checkedBlocks.length === 0;

    if (!container) return;
    if (jqExtractedRows.length === 0) return;

    if (checkedBlocks.length === 0) {
      container.innerHTML = '<div style="text-align:center; color:#64748b; padding:50px 20px; font-size:0.88rem;">左のリストから出力したいメニューにチェックを入れてください。<br><span style="font-size:0.78rem; color:#94a3b8;">（キーワード検索して「☑ 表示中をすべて選択」を押すと、カテゴリー単位で素早く追加選択できます）</span></div>';
      return;
    }

    const includeHeader = document.getElementById('jqIncludeHeaderCb') ? document.getElementById('jqIncludeHeaderCb').checked : true;

    let html = '<table class="jq-preview-table">';
    if (includeHeader) {
      html += `
        <thead>
          <tr>
            <th style="width:36px;">解除</th>
            <th>J列: メニューコード</th>
            <th>K列: メニュー名 / 食材コード</th>
            <th>L列: 食材名</th>
            <th>M列: 使用量</th>
            <th>N列: 単位</th>
            <th>O列: 売価 / 単価</th>
            <th>P列: 原価 / 金額</th>
            <th>Q列: 原価率(%)</th>
          </tr>
        </thead>`;
    }
    html += '<tbody>';

    checkedBlocks.forEach(menu => {
      const safeCode = String(menu.menuCode).replace(/'/g, "\\'");
      html += `
        <tr class="jq-row-menu" style="background-color: #${yellowHex};">
          <td style="text-align:center; background-color: #${yellowHex};">
            <button type="button" onclick="toggleSingleJqMenuCheck('${safeCode}', false)" title="このメニューを選択から外す" style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; border-radius:3px; padding:0 5px; font-size:0.72rem; cursor:pointer;">×</button>
          </td>
          <td style="text-align:center; background-color: #${yellowHex};">${menu.colJ}</td>
          <td style="background-color: #${yellowHex};">${menu.colK}</td>
          <td style="background-color: #${yellowHex};">${menu.colL}</td>
          <td style="background-color: #${yellowHex};">${menu.colM}</td>
          <td style="background-color: #${yellowHex};">${menu.colN}</td>
          <td style="text-align:right; background-color: #${yellowHex};">${menu.colO}</td>
          <td style="text-align:right; background-color: #${yellowHex};">${menu.colP}</td>
          <td style="text-align:right; background-color: #${yellowHex};">${menu.colQ}</td>
        </tr>`;

      menu.children.forEach(ing => {
        html += `
          <tr class="jq-row-ing">
            <td style="background:#f8fafc;"></td>
            <td style="text-align:center; color:#94a3b8;">${ing.colJ}</td>
            <td style="font-family:monospace; color:#334155;">${ing.colK}</td>
            <td>${ing.colL}</td>
            <td style="text-align:right; font-weight:bold;">${ing.colM}</td>
            <td style="text-align:center;">${ing.colN}</td>
            <td style="text-align:right;">${ing.colO}</td>
            <td style="text-align:right;">${ing.colP}</td>
            <td style="text-align:right;">${ing.colQ}</td>
          </tr>`;
      });
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  };

  function toNumOrStr(val) {
    if (val === undefined || val === null || val === '') return '';
    const s = String(val).replace(/,/g, '').trim();
    if (s === '') return '';
    if (/^0\d+$/.test(s)) return s;
    const n = Number(s);
    return !isNaN(n) && isFinite(n) ? n : String(val);
  }

  window.exportJqStyledExcel = function() {
    const blocks = getCheckedJqMenuBlocks();
    if (blocks.length === 0) {
      alert('出力するメニューにチェックを入れてください。');
      return;
    }

    const colorSelect = document.getElementById('jqYellowColorSelect');
    const yellowHex = colorSelect ? colorSelect.value : 'FFF176';
    const includeHeader = document.getElementById('jqIncludeHeaderCb') ? document.getElementById('jqIncludeHeaderCb').checked : true;

    const aoa = [];
    const rowTypes = [];

    if (includeHeader) {
      aoa.push([
        'メニューコード',
        'メニュー名 / 食材コード',
        '食材名称',
        '使用量',
        '単位',
        '売価 / 単価',
        '原価 / 金額',
        '原価率(%)'
      ]);
      rowTypes.push('header');
    }

    blocks.forEach(menu => {
      aoa.push([
        String(menu.colJ ?? ''),
        String(menu.colK ?? ''),
        '',
        '',
        '',
        toNumOrStr(menu.colO),
        toNumOrStr(menu.colP),
        toNumOrStr(menu.colQ)
      ]);
      rowTypes.push('menu');

      menu.children.forEach(ing => {
        aoa.push([
          String(ing.colJ ?? ''),
          String(ing.colK ?? ''),
          String(ing.colL ?? ''),
          toNumOrStr(ing.colM),
          String(ing.colN ?? ''),
          toNumOrStr(ing.colO),
          toNumOrStr(ing.colP),
          toNumOrStr(ing.colQ)
        ]);
        rowTypes.push('ing');
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    ws['!cols'] = [
      { wch: 13 },
      { wch: 30 },
      { wch: 38 },
      { wch: 10 },
      { wch: 8 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 }
    ];

    ws['!rows'] = rowTypes.map(t => {
      if (t === 'header') return { hpt: 24 };
      if (t === 'menu') return { hpt: 20 };
      return { hpt: 17 };
    });

    const totalRows = aoa.length;
    const totalCols = 8;

    for (let r = 0; r < totalRows; r++) {
      const rType = rowTypes[r];
      for (let c = 0; c < totalCols; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellAddr]) {
          ws[cellAddr] = { t: 's', v: '' };
        }
        const cell = ws[cellAddr];

        if (rType === 'ing' && c === 1 && cell.v !== '') {
          cell.t = 's';
          cell.v = String(cell.v);
        }

        if (rType === 'header') {
          cell.s = {
            fill: { patternType: 'solid', fgColor: { rgb: '1E293B' } },
            font: { name: 'Meiryo UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '0F172A' } },
              bottom: { style: 'medium', color: { rgb: '0F172A' } },
              left: { style: 'thin', color: { rgb: '334155' } },
              right: { style: 'thin', color: { rgb: '334155' } }
            }
          };
        } else if (rType === 'menu') {
          const alignH = (c === 0) ? 'center' : (c >= 5 ? 'right' : 'left');
          const styleObj = {
            fill: { patternType: 'solid', fgColor: { rgb: yellowHex } },
            font: { name: 'Meiryo UI', sz: 10, bold: true, color: { rgb: '000000' } },
            alignment: { horizontal: alignH, vertical: 'center' },
            border: {
              top: { style: 'medium', color: { rgb: '64748B' } },
              bottom: { style: 'thin', color: { rgb: '94A3B8' } },
              left: { style: 'thin', color: { rgb: 'CBD5E1' } },
              right: { style: 'thin', color: { rgb: 'CBD5E1' } }
            }
          };
          if (typeof cell.v === 'number') {
            if (c === 5) styleObj.numFmt = '#,##0';
            else if (c === 6 || c === 7) styleObj.numFmt = '#,##0.00';
          }
          cell.s = styleObj;
        } else {
          let alignH = 'left';
          if (c === 0 || c === 4) alignH = 'center';
          else if (c === 3 || c >= 5) alignH = 'right';

          const styleObj = {
            fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
            font: { name: 'Meiryo UI', sz: 9.5, bold: (c === 3), color: { rgb: '1E293B' } },
            alignment: { horizontal: alignH, vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: 'E2E8F0' } },
              bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
              left: { style: 'thin', color: { rgb: 'E2E8F0' } },
              right: { style: 'thin', color: { rgb: 'E2E8F0' } }
            }
          };
          if (typeof cell.v === 'number') {
            if (c === 3) styleObj.numFmt = '#,##0.##';
            else if (c === 5 || c === 6) styleObj.numFmt = '#,##0.00';
          }
          cell.s = styleObj;
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '原価シート抽出');

    const presetSel = document.getElementById('jqPresetSelect');
    const presetSuffix = (presetSel && presetSel.value) ? `_${presetSel.value}` : '';
    const today = new Date();
    const dStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    XLSX.writeFile(wb, `${jqSourceFileName}_原価シート抽出${presetSuffix}_${dStr}.xlsx`);
  };

  window.importJqToToolMaster = function() {
    const blocks = getCheckedJqMenuBlocks();
    if (blocks.length === 0) return;

    if (!window.menuMaster) window.menuMaster = {};
    let addedCount = 0;

    blocks.forEach(menu => {
      if (!menu.menuCode) return;
      window.menuMaster[menu.menuCode] = {
        name: menu.menuName || '',
        ingredients: menu.children.map(ing => ({
          code: ing.colK || '',
          name: ing.colL || '',
          amount: ing.colM || '',
          unit: ing.colN || 'g'
        }))
      };
      addedCount++;
    });

    menuMaster = window.menuMaster;
    const totalCount = Object.keys(menuMaster).length;
    const sourceLabel = `Excel: ${jqSourceFileName} (原価シート抽出)`;

    safeStorage.setItem('cachedMenuMaster', JSON.stringify(menuMaster));
    safeStorage.setItem('cachedMenuCount', totalCount);
    safeStorage.setItem('cachedSourceLabel', sourceLabel);
    safeStorage.setItem('cachedVersion', 'v4');

    const statusDiv = document.getElementById('masterStatus');
    if (statusDiv) {
      statusDiv.innerText = `マスタデータ読込完了 (${totalCount}件のメニュー) (${sourceLabel})`;
      statusDiv.style.backgroundColor = '#e8f5e9';
      statusDiv.style.color = '#2e7d32';
    }

    alert(`チェックした ${addedCount} 件のメニューを手順書ツールの原価マスタに反映しました！\nメニューコードや商品名からすぐに呼び出せます。`);
  };


  // --- 4枠メニュー・原価シート連携管理（①バケット・BRC旧 / ②バケット・BRC新 / ③カフェC・ペトリコール旧 / ④カフェC・ペトリコール新） ---
  const MASTER_SLOT_NAMES = {
    1: '①バケット・BRC(旧)',
    2: '②バケット・BRC(新)',
    3: '③カフェC・ペトリコール(旧)',
    4: '④カフェC・ペトリコール(新)'
  };

  function getMasterSlotStoragePrefix() {
    return (typeof currentMode !== 'undefined' && currentMode === 'standby') ? 'standbyMasterSlot_' : 'commonMasterSlot_';
  }

  function loadAllMasterSlotsFromStorage() {
    const prefix = getMasterSlotStoragePrefix();
    const slots = {};
    for (let s = 1; s <= 4; s++) {
      try {
        const raw = safeStorage.getItem(prefix + s);
        if (raw) {
          slots[s] = JSON.parse(raw);
        }
      } catch (e) {}
    }
    return slots;
  }

  function saveMasterSlotToStorage(slotNum, slotData) {
    const prefix = getMasterSlotStoragePrefix();
    try {
      if (slotData) {
        safeStorage.setItem(prefix + slotNum, JSON.stringify(slotData));
      } else {
        safeStorage.removeItem(prefix + slotNum);
      }
    } catch (e) {
      console.warn('Failed to save master slot to storage:', e);
    }
  }

  // あらゆる原価シート形式（標準フラット形式 / J〜Q親子階層形式 / スタンバイ_Data形式）を自動判別してメニュー辞書に変換
  function parseAnyMasterRowsToDict(rows, slotLabel) {
    const dict = {};
    if (!Array.isArray(rows) || rows.length === 0) return dict;

    // 1. まずヘッダー行がある標準フラット形式またはスタンバイ形式かをチェック
    let headerIdx = -1;
    let colMap = {};
    let isStandbyFormat = false;

    for (let i = 0; i < Math.min(rows.length, 25); i++) {
      if (!rows[i]) continue;
      const rowStr = rows[i].map(c => String(c || '')).join('');
      if (rowStr.includes('ｽﾀﾝﾊﾞｲ商品ｺｰﾄﾞ') || rowStr.includes('スタンバイ商品コード')) {
        headerIdx = i;
        isStandbyFormat = true;
        for (let j = 0; j < rows[i].length; j++) {
          const hName = String(rows[i][j] || '').trim();
          if (hName === 'ｽﾀﾝﾊﾞｲ商品ｺｰﾄﾞ' || hName === 'スタンバイ商品コード') colMap.menuCode = j;
          else if (hName === 'ｽﾀﾝﾊﾞｲ商品名' || hName === 'スタンバイ商品名') colMap.menuName = j;
          else if (hName === '商品コード' || hName === '商品ｺｰﾄﾞ') colMap.ingCode = j;
          else if (hName === '商品名' || hName === '商品名称') colMap.ingName = j;
          else if (hName === '使用量' || hName === '正味使用量') colMap.ingAmount = j;
          else if (hName === '単位' || hName === '正味単位') colMap.ingUnit = j;
        }
        break;
      } else if (rowStr.includes('メニュー名称') || rowStr.includes('ﾒﾆｭｰ名称') || (rowStr.includes('メニューコード') && rowStr.includes('商品コード')) || (rowStr.includes('ﾒﾆｭｰｺｰﾄﾞ') && rowStr.includes('商品コード'))) {
        headerIdx = i;
        for (let j = 0; j < rows[i].length; j++) {
          const hName = String(rows[i][j] || '').trim();
          if (hName === 'メニューコード' || hName === 'ﾒﾆｭｰｺｰﾄﾞ') colMap.menuCode = j;
          else if (hName === 'メニュー名称' || hName === 'ﾒﾆｭｰ名称') colMap.menuName = j;
          else if (hName === '商品コード') colMap.ingCode = j;
          else if (hName === '商品名称' || hName === '商品名') colMap.ingName = j;
          else if (hName === '正味使用量' || hName === '使用量') colMap.ingAmount = j;
          else if (hName === '正味単位' || hName === '単位') colMap.ingUnit = j;
        }
        break;
      }
    }

    // 2. 親子階層形式（J〜Q列 または A〜H列：親行にメニューコード＋メニュー名、子行に食材コード＋食材名）かどうかをスコア判定
    let scoreJQ = 0;
    let scoreAH = 0;
    const sampleLimit = Math.min(rows.length, 120);
    for (let i = 0; i < sampleLimit; i++) {
      const r = rows[i];
      if (!r) continue;
      if (r.length >= 14) {
        const c9 = String(r[9] ?? '').trim();
        const c10 = String(r[10] ?? '').trim();
        const c11 = String(r[11] ?? '').trim();
        const c12 = String(r[12] ?? '').trim();
        if (/^\d{3,8}$/.test(c9) && c10 && !c11) scoreJQ += 3;
        if (!c9 && /^[0-9A-Za-z]{4,16}$/.test(c10) && c11 && c12 !== '') scoreJQ += 2;
      }
      if (r.length >= 5) {
        const c0 = String(r[0] ?? '').trim();
        const c1 = String(r[1] ?? '').trim();
        const c2 = String(r[2] ?? '').trim();
        const c3 = String(r[3] ?? '').trim();
        if (/^\d{3,8}$/.test(c0) && c1 && !c2) scoreAH += 3;
        if (!c0 && /^[0-9A-Za-z]{4,16}$/.test(c1) && c2 && c3 !== '') scoreAH += 2;
      }
    }

    if (headerIdx === -1 && (scoreJQ >= 5 || scoreAH >= 5)) {
      const baseCol = scoreJQ >= scoreAH ? 9 : 0;
      let curCode = '';
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length <= baseCol) continue;
        const cJ = String(r[baseCol] ?? '').trim();
        const cK = String(r[baseCol + 1] ?? '').trim();
        const cL = String(r[baseCol + 2] ?? '').trim();
        const cM = String(r[baseCol + 3] ?? '').trim();
        const cN = String(r[baseCol + 4] ?? '').trim();
        if (!cJ && !cK && !cL) continue;
        if (cJ === 'メニューコード' || cJ === 'ﾒﾆｭｰｺｰﾄﾞ' || cK === '商品コード') continue;

        if (cJ !== '' && cK !== '' && cL === '' && cM === '') {
          curCode = cJ;
          dict[curCode] = {
            name: cK,
            slotLabel: slotLabel || '',
            ingredients: []
          };
        } else if (curCode && dict[curCode] && (cK !== '' || cL !== '')) {
          dict[curCode].ingredients.push({
            code: cK,
            name: cL,
            amount: cM,
            unit: cN || 'g'
          });
        }
      }
      if (Object.keys(dict).length > 0) return dict;
    }

    // 3. スタンバイ形式または標準フラット形式の解析
    if (isStandbyFormat) {
      if (colMap.menuCode === undefined) {
        colMap = { menuCode: 1, menuName: 2, ingCode: 9, ingName: 10, ingAmount: 11, ingUnit: 12 };
      }
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const cols = rows[i];
        if (!cols || cols.length === 0) continue;
        const menuCode = cols[colMap.menuCode] !== undefined ? String(cols[colMap.menuCode]).trim() : '';
        const shortName = cols[colMap.menuName] !== undefined ? String(cols[colMap.menuName]).trim() : '';
        const ingCode = cols[colMap.ingCode] !== undefined ? String(cols[colMap.ingCode]).trim() : '';
        const ingName = cols[colMap.ingName] !== undefined ? String(cols[colMap.ingName]).trim() : '';
        const ingAmount = cols[colMap.ingAmount] !== undefined ? String(cols[colMap.ingAmount]).trim() : '';
        const ingUnit = cols[colMap.ingUnit] !== undefined ? String(cols[colMap.ingUnit]).trim() : '';

        if (!menuCode || menuCode === 'ｽﾀﾝﾊﾞｲ商品ｺｰﾄﾞ' || menuCode === 'スタンバイ商品コード') continue;
        const isParentRow = (ingCode && ingCode === menuCode) || (!shortName && ingName);
        if (!dict[menuCode]) {
          dict[menuCode] = {
            name: isParentRow && ingName ? ingName : (shortName || ingName || ''),
            slotLabel: slotLabel || '',
            ingredients: []
          };
        } else if (isParentRow && ingName) {
          dict[menuCode].name = ingName;
        }
        if (isParentRow) continue;
        if (ingCode || ingName) {
          if (ingCode !== '商品コード' && ingName !== '商品名' && ingName !== '商品名称') {
            dict[menuCode].ingredients.push({
              code: ingCode,
              name: ingName,
              amount: ingAmount,
              unit: ingUnit || 'g'
            });
          }
        }
      }
      return dict;
    }

    // 標準フラット形式（フォールバック含む）
    if (headerIdx === -1 || colMap.menuCode === undefined) {
      colMap = { menuCode: 3, menuName: 4, ingCode: 10, ingName: 11, ingAmount: 12, ingUnit: 13 };
      headerIdx = 0;
    }
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const cols = rows[i];
      if (!cols || cols.length === 0) continue;
      const menuCode = cols[colMap.menuCode] ? String(cols[colMap.menuCode]).trim() : '';
      const menuName = cols[colMap.menuName] ? String(cols[colMap.menuName]).trim() : '';
      const ingCode = cols[colMap.ingCode] ? String(cols[colMap.ingCode]).trim() : '';
      const ingName = cols[colMap.ingName] ? String(cols[colMap.ingName]).trim() : '';
      const ingAmount = cols[colMap.ingAmount] ? String(cols[colMap.ingAmount]).trim() : '';
      const ingUnit = cols[colMap.ingUnit] ? String(cols[colMap.ingUnit]).trim() : '';

      if (!menuCode || menuCode === 'ﾒﾆｭｰｺｰﾄﾞ' || menuCode === 'メニューコード') continue;
      if (!dict[menuCode]) {
        dict[menuCode] = {
          name: menuName,
          slotLabel: slotLabel || '',
          ingredients: []
        };
      } else if (!dict[menuCode].name && menuName) {
        dict[menuCode].name = menuName;
      }
      if (ingCode || ingName) {
        if (ingCode !== '商品コード' && ingName !== '商品名称' && ingName !== '商品名') {
          dict[menuCode].ingredients.push({
            code: ingCode,
            name: ingName,
            amount: ingAmount,
            unit: ingUnit || 'g'
          });
        }
      }
    }
    return dict;
  }

  // 4つのスロットのデータを統合して window.menuMaster と画面表示を更新
  window.rebuildCombinedMasterFromSlots = function() {
    const slots = loadAllMasterSlotsFromStorage();
    const combined = {};
    const activeLabels = [];

    for (let s = 1; s <= 4; s++) {
      const slotInfo = slots[s];
      const badgeEl = document.getElementById('masterSlotBadge' + s);
      const clearBtn = document.getElementById('masterSlotClear' + s);
      const boxEl = document.querySelector(`.master-slot-box[data-slot="${s}"]`);

      if (slotInfo && slotInfo.data && Object.keys(slotInfo.data).length > 0) {
        const count = Object.keys(slotInfo.data).length;
        Object.assign(combined, slotInfo.data);
        activeLabels.push(`${MASTER_SLOT_NAMES[s]}:${count}件`);
        if (badgeEl) {
          badgeEl.textContent = `✓ ${count}件`;
          badgeEl.title = `読込ファイル: ${slotInfo.fileName || ''}`;
        }
        if (clearBtn) clearBtn.style.display = 'inline-block';
        if (boxEl) boxEl.classList.add('is-loaded');
      } else {
        if (badgeEl) {
          badgeEl.textContent = '未読込';
          badgeEl.title = '';
        }
        if (clearBtn) clearBtn.style.display = 'none';
        if (boxEl) boxEl.classList.remove('is-loaded');
      }
    }

    if (Object.keys(combined).length > 0) {
      window.menuMaster = combined;
      menuMaster = window.menuMaster;
      const totalCount = Object.keys(combined).length;
      const labelStr = activeLabels.join(' / ');

      const cacheKey = (typeof currentMode !== 'undefined' && currentMode === 'standby') ? 'cachedStandbyMaster' : 'cachedMenuMaster';
      const countKey = (typeof currentMode !== 'undefined' && currentMode === 'standby') ? 'cachedStandbyCount' : 'cachedMenuCount';
      const labelKey = (typeof currentMode !== 'undefined' && currentMode === 'standby') ? 'cachedStandbyLabel' : 'cachedSourceLabel';

      safeStorage.setItem(cacheKey, JSON.stringify(combined));
      safeStorage.setItem(countKey, totalCount);
      safeStorage.setItem(labelKey, 'Excel: ' + labelStr);
      safeStorage.setItem('cachedVersion', 'v4');

      const statusDiv = document.getElementById('masterStatus');
      if (statusDiv) {
        statusDiv.innerText = `マスタ連携中: 合計 ${totalCount}件 (${labelStr})`;
        statusDiv.style.backgroundColor = '#e8f5e9';
        statusDiv.style.color = '#2e7d32';
      }
      if (typeof autoSyncAllRecipes === 'function') {
        autoSyncAllRecipes();
      }
    }
  };

  window.handleMasterSlotFileChange = function(inputEl, slotNum) {
    const file = inputEl && inputEl.files && inputEl.files[0];
    if (!file) return;

    const slotTitle = MASTER_SLOT_NAMES[slotNum] || `スロット${slotNum}`;
    const statusDiv = document.getElementById('masterStatus');
    const badgeEl = document.getElementById('masterSlotBadge' + slotNum);
    if (badgeEl) badgeEl.textContent = '解析中...';
    if (statusDiv) {
      statusDiv.innerText = `${slotTitle}（${file.name}）を解析しています...`;
      statusDiv.style.backgroundColor = '#ffe0b2';
      statusDiv.style.color = '#e65100';
    }

    const fileName = file.name;
    const isExcel = fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls');
    const reader = new FileReader();

    const onRowsReady = (rows) => {
      const parsedDict = parseAnyMasterRowsToDict(rows, slotTitle);
      const count = Object.keys(parsedDict).length;
      if (count === 0) {
        if (badgeEl) badgeEl.textContent = '0件';
        alert(`${slotTitle}（${fileName}）からメニューデータが検出できませんでした。シートの形式をご確認ください。`);
        return;
      }
      saveMasterSlotToStorage(slotNum, {
        slotNum,
        slotTitle,
        fileName,
        updatedAt: Date.now(),
        data: parsedDict
      });
      rebuildCombinedMasterFromSlots();
    };

    if (isExcel) {
      reader.onload = function(evt) {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          // 全シートを走査、または最初の有効なシートから読み込み
          let combinedRows = [];
          for (const sName of workbook.SheetNames) {
            const ws = workbook.Sheets[sName];
            const sheetRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            if (sheetRows && sheetRows.length > 1) {
              combinedRows = combinedRows.concat(sheetRows);
            }
          }
          onRowsReady(combinedRows);
        } catch (err) {
          console.error(err);
          if (badgeEl) badgeEl.textContent = 'エラー';
          if (statusDiv) {
            statusDiv.innerText = 'Excelファイルの解析に失敗しました。';
            statusDiv.style.backgroundColor = '#ffebee';
            statusDiv.style.color = '#c62828';
          }
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
            if (lines[i].trim()) rows.push(parseCSVLine(lines[i]));
          }
          onRowsReady(rows);
        } catch (err) {
          console.error(err);
          if (badgeEl) badgeEl.textContent = 'エラー';
          if (statusDiv) {
            statusDiv.innerText = 'CSVファイルの解析に失敗しました。';
            statusDiv.style.backgroundColor = '#ffebee';
            statusDiv.style.color = '#c62828';
          }
        }
      };
      reader.readAsText(file, 'Shift_JIS');
    }
  };

  window.clearMasterSlot = function(slotNum) {
    const slotTitle = MASTER_SLOT_NAMES[slotNum] || `スロット${slotNum}`;
    if (!confirm(`${slotTitle} の読み込みデータをクリアしますか？`)) return;
    saveMasterSlotToStorage(slotNum, null);
    const inputId = slotNum === 1 ? 'masterFileInput' : ('masterFileInput' + slotNum);
    const inputEl = document.getElementById(inputId);
    if (inputEl) inputEl.value = '';
    rebuildCombinedMasterFromSlots();
  };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      rebuildCombinedMasterFromSlots();
    }, 50);
  });
