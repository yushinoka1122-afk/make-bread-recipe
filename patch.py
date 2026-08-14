import os

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. serializeCurrentRecipe の改修
s1_old = """    const periodEnd = document.getElementById('periodEnd').value;
    
    const recipe = {
      menuCode: menuCode,"""
s1_new = """    const periodEnd = document.getElementById('periodEnd').value;
    const brandCategory = document.getElementById('brandCategory').value;
    const menuCategory = document.getElementById('menuCategory').value;
    
    const recipe = {
      menuCode: menuCode,
      brandCategory: brandCategory,
      menuCategory: menuCategory,"""
content = content.replace(s1_old, s1_new)

# 2. loadRecipeFromDB の改修
s2_old = """    document.getElementById('periodStart').value = recipe.periodStart || '';
    document.getElementById('periodEnd').value = recipe.periodEnd || '';"""
s2_new = """    document.getElementById('periodStart').value = recipe.periodStart || '';
    document.getElementById('periodEnd').value = recipe.periodEnd || '';
    if (document.getElementById('brandCategory')) document.getElementById('brandCategory').value = recipe.brandCategory || '';
    if (document.getElementById('menuCategory')) document.getElementById('menuCategory').value = recipe.menuCategory || '';"""
content = content.replace(s2_old, s2_new)

# 3. resetFormToDefault の改修
s3_old = """      document.getElementById('periodStart').value = '';
      document.getElementById('periodEnd').value = '';"""
s3_new = """      document.getElementById('periodStart').value = '';
      document.getElementById('periodEnd').value = '';
      if (document.getElementById('brandCategory')) document.getElementById('brandCategory').value = '';
      if (document.getElementById('menuCategory')) document.getElementById('menuCategory').value = '';"""
content = content.replace(s3_old, s3_new)

# 4. openRecipeListModal 内のカード生成部分の改修
s4_old = """        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.setAttribute('data-code', r.menuCode || '');
        card.setAttribute('data-name', r.productName || '');
        
        card.innerHTML = `
          <div class="recipe-card-thumbnail">
            ${r.mainImageBlob ? '<img src="' + URL.createObjectURL(r.mainImageBlob) + '">' : '<div style="width:100%; height:100%; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:12px;">NO IMAGE</div>'}
          </div>
          <div class="recipe-card-info">
            <h4>${r.menuCode} : ${r.productName || '名称未設定'}</h4>"""

s4_new = """        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.setAttribute('data-code', r.menuCode || '');
        card.setAttribute('data-name', r.productName || '');
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
          <div class="recipe-card-thumbnail">
            ${r.mainImageBlob ? '<img src="' + URL.createObjectURL(r.mainImageBlob) + '">' : '<div style="width:100%; height:100%; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:12px;">NO IMAGE</div>'}
          </div>
          <div class="recipe-card-info">
            <h4>${r.menuCode} : ${r.productName || '名称未設定'}</h4>
            ${labelsHtml}"""
content = content.replace(s4_old, s4_new)

# 5. filterModalRecipes の改修
s5_old = """  function filterModalRecipes() {
    const query = document.getElementById('modalSearchInput').value.trim().toLowerCase();
    const cards = document.querySelectorAll('#modalRecipeGrid .recipe-card');
    
    cards.forEach(card => {
      const code = card.getAttribute('data-code').toLowerCase();
      const name = card.getAttribute('data-name').toLowerCase();
      
      if (code.includes(query) || name.includes(query)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }"""
s5_new = """  function filterModalRecipes() {
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
  }"""
content = content.replace(s5_old, s5_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('JS update successful!')
