import os

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# serializeCurrentRecipe を確実に書き換える
old_str = """    const periodStart = document.getElementById('periodStart').value;
    const periodEnd = document.getElementById('periodEnd').value;

    const moldL = document.getElementById('moldL').value;"""

new_str = """    const periodStart = document.getElementById('periodStart').value;
    const periodEnd = document.getElementById('periodEnd').value;
    const brandCategory = document.getElementById('brandCategory') ? document.getElementById('brandCategory').value : "";
    const menuCategory = document.getElementById('menuCategory') ? document.getElementById('menuCategory').value : "";

    const moldL = document.getElementById('moldL').value;"""
    
content = content.replace(old_str, new_str)

old_str_return = """    return {
      menuCode,
      productName,
      periodStart,
      periodEnd,
      moldL, moldW, moldH, maxLoad,"""

new_str_return = """    return {
      menuCode,
      productName,
      periodStart,
      periodEnd,
      brandCategory,
      menuCategory,
      moldL, moldW, moldH, maxLoad,"""

content = content.replace(old_str_return, new_str_return)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('serializeCurrentRecipe fixed successfully!')
