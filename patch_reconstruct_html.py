import os

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# 破壊された389行目以降（ <!-- スタンバイセクション --> 以降）をごっそり切り捨てる
start_idx = html.find('    <div style="margin-top: 10px; display: flex; gap: 10px;" class="edit-only-row">')
if start_idx != -1:
    html = html[:start_idx]

# 正しい末尾構造を組み立て直す
correct_footer = '''
    <div style="margin-top: 10px; display: flex; gap: 10px;" class="edit-only-row">
      <button type="button" class="add-btn" style="background:#e91e63;" onclick="addStepBlock()">＋ 手順ブロックを追加</button>
      <button type="button" class="add-btn" style="background:#2196f3;" onclick="addStandbyBlock()">＋ スタンバイブロックを追加</button>
    </div>

  </div> <!-- /outputArea -->
</div> <!-- /editorWrapper -->

<!-- JSファイルの読み込み -->
<script src="js/main.js"></script>

<!-- モーダル（保存済み一覧など） -->
<div id="recipeListModal" class="modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; justify-content:center; align-items:center;">
  <div style="background:#fff; padding:20px; border-radius:8px; width:80%; max-width:800px; max-height:80vh; display:flex; flex-direction:column;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
      <h3 style="margin:0; color:#1e293b;">保存済み手順書一覧</h3>
      <div style="display:flex; gap:10px; align-items:center;">
        <select id="modalCategoryFilter" onchange="renderRecipeGrid()" style="padding:4px; border-radius:4px; border:1px solid #cbd5e1; font-size:0.9rem;">
          <option value="">すべての区分</option>
          <option value="期間限定">期間限定</option>
          <option value="グランド">グランド</option>
        </select>
        <button type="button" class="del-btn" style="padding:4px 12px; font-size:1rem;" onclick="closeRecipeListModal()">×</button>
      </div>
    </div>
    <div style="overflow-y:auto; flex:1; padding-right:10px;">
      <div id="modalRecipeGrid" class="modal-recipe-grid">
        <!-- レシピカードが動的に生成されます -->
      </div>
    </div>
  </div>
</div>

</body>
</html>
'''

# そして、outputAreaの中にあるべき「スタンバイ枠」を、outputAreaが閉じる直前（ボタンの直前ではなく、outputAreaの中）に入れる
standby_html = '''
          <!-- === スタンバイセクション === -->
          <div class="steps-right-bottom">
            <div class="section-title" style="margin-top:20px;">
              <h2 style="color:#0056b3; margin:0; font-size:1.1rem;">■ スタンバイ</h2>
            </div>
            <div id="standbyContainer">
              <!-- スタンバイブロック -->
            </div>
          </div>
'''

html += standby_html + correct_footer

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
