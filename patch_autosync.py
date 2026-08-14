import os

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 読み込み時 (loadRecipeFromDB) の動的同期
s1_old = """    // 食材テーブルの復元
    populateIngredients(recipe.ingredients || []);"""
s1_new = """    // 食材テーブルの復元
    let ingredientsToLoad = recipe.ingredients || [];
    // マスターデータが存在し、該当のメニューコードがあれば強制的に最新の食材を使う
    if (recipe.menuCode && window.menuMaster && window.menuMaster[recipe.menuCode] && window.menuMaster[recipe.menuCode].ingredients && window.menuMaster[recipe.menuCode].ingredients.length > 0) {
      ingredientsToLoad = window.menuMaster[recipe.menuCode].ingredients;
    }
    populateIngredients(ingredientsToLoad);"""
content = content.replace(s1_old, s1_new)

# 2. マスターデータ更新時の全件バックグラウンド同期 (processMasterRowsの末尾に追加)
s2_old = """    safeStorage.setItem('cachedMenuCount', menuCount);
    safeStorage.setItem('cachedSourceLabel', sourceLabel);
    safeStorage.setItem('cachedVersion', "v4");
  }"""
s2_new = """    safeStorage.setItem('cachedMenuCount', menuCount);
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
  }"""
content = content.replace(s2_old, s2_new)

# menuMasterをグローバルアクセス可能にするため、window.menuMasterを使うように先頭で宣言されているか確認
# すでに `let menuMaster = {};` が先頭にあるが、関数内で `menuMaster = {};` している部分を `window.menuMaster` に書き換える
s3_old = """  function processMasterRows(rows, sourceLabel) {
    const statusDiv = document.getElementById('masterStatus');
    menuMaster = {};"""
s3_new = """  function processMasterRows(rows, sourceLabel) {
    const statusDiv = document.getElementById('masterStatus');
    window.menuMaster = {};
    menuMaster = window.menuMaster;"""
content = content.replace(s3_old, s3_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Auto-sync logic injected successfully!')
