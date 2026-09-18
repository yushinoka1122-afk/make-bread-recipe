import os
import re

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 状態変数の追加 (上部)
if 'let currentMode =' not in content:
    content = content.replace('let menuMaster = {};', 'let menuMaster = {};\n  let currentMode = "bread";')

# 2. UI切り替え関数の追加
ui_functions = '''
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
'''
if 'function switchMode' not in content:
    content = content + '\n' + ui_functions

# 3. 保存時にモード情報を追加
old_serialize_ret = '''    return {
      menuCode,
      productName,
      periodStart,
      periodEnd,
      brandCategory,
      menuCategory,
      moldL, moldW, moldH, maxLoad,'''

new_serialize_ret = '''    return {
      menuCode,
      productName,
      periodStart,
      periodEnd,
      brandCategory,
      menuCategory,
      mode: currentMode,
      moldL, moldW, moldH, maxLoad,'''
content = content.replace(old_serialize_ret, new_serialize_ret)

# 4. 読み込み時にモード情報を復元
old_load = '''  function loadRecipeFromDB(recipe) {
    if (!recipe) return;

    document.getElementById('menuCode').value = recipe.menuCode || "";'''

new_load = '''  function loadRecipeFromDB(recipe) {
    if (!recipe) return;

    // モード切替を復元
    if (recipe.mode && recipe.mode !== currentMode) {
      // suppress sidebar toggle visually if needed, but since sidebar is closed by default, it's fine.
      // 実際には switchMode() を呼ぶとサイドバーがトグルされてしまう問題があるため、
      // ここではUIの直接操作と変数代入のみ行う。
      currentMode = recipe.mode;
      const body = document.body;
      const badge = document.getElementById('modeBadge');
      document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
      
      if (currentMode === 'cooking') {
        body.classList.add('mode-cooking');
        if (badge) { badge.innerText = '料理・デザートモード'; badge.style.backgroundColor = '#ef4444'; }
        const activeBtn = document.querySelector('.mode-btn[onclick*="cooking"]');
        if (activeBtn) activeBtn.classList.add('active');
      } else {
        body.classList.remove('mode-cooking');
        if (badge) { badge.innerText = 'パンモード'; badge.style.backgroundColor = '#f59e0b'; }
        const activeBtn = document.querySelector('.mode-btn[onclick*="bread"]');
        if (activeBtn) activeBtn.classList.add('active');
      }
    } else if (!recipe.mode && currentMode === 'cooking') {
       // 過去のレシピ（パンモード限定だった頃のもの）ならパンモードに戻す
       currentMode = 'bread';
       const body = document.body;
       const badge = document.getElementById('modeBadge');
       document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
       body.classList.remove('mode-cooking');
       if (badge) { badge.innerText = 'パンモード'; badge.style.backgroundColor = '#f59e0b'; }
       const activeBtn = document.querySelector('.mode-btn[onclick*="bread"]');
       if (activeBtn) activeBtn.classList.add('active');
    }

    document.getElementById('menuCode').value = recipe.menuCode || "";'''
content = content.replace(old_load, new_load)

# 5. resetFormToDefault でもパンモードに戻す (任意ですが、新規作成時はパンモードに戻すのが自然)
old_reset = '''  function resetFormToDefault(isNew = false) {
    document.getElementById('menuCode').value = "";'''

new_reset = '''  function resetFormToDefault(isNew = false) {
    // 新規作成時はデフォルトでパンモードに戻すか、現在のモードを維持するか。
    // 使い勝手を考慮して、モードは「現在のモード」を維持することにします。

    document.getElementById('menuCode').value = "";'''
content = content.replace(old_reset, new_reset)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("JS patched!")
