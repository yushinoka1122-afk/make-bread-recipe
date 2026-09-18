import os
import re

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. <div id="outputArea"> の直後に <div class="editor-container"> を挿入
if '<div class="editor-container">' not in html:
    html = html.replace('<div id="outputArea">', '<div id="outputArea">\n    <div class="editor-container">', 1)
    # 閉じるタグを追加するために </div> <!-- /outputArea --> の前に </div> を追加
    html = html.replace('  </div> <!-- /outputArea -->', '    </div>\n  </div> <!-- /outputArea -->')

# 2. topRowContainer（食材と写真がある行）を layoutTopLeft で囲む
if 'layoutTopLeft' not in html:
    html = re.sub(
        r'(<div style="display: flex; gap: 20px; align-items: stretch; margin-bottom: 20px; flex-wrap: wrap;" id="topRowContainer">)',
        r'<div id="layoutTopLeft" style="width: 100%;">\n      \1',
        html
    )

# 3. specsSection の後に Plate（提供方法）を入れる
plate_html = '''
        <!-- 🍽️ プレート・提供方法セクション -->
        <div id="plateSection" class="plate-section" style="margin-top: 10px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; background-color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <h4 style="margin: 0; color: #e11d48; font-size: 1rem;">【プレート】</h4>
            <select id="plateTemplateSelect" onchange="applyPlateTemplate()" style="font-size: 0.8rem; padding: 2px 4px; border: 1px dashed #94a3b8; background: transparent; cursor: pointer;">
              <option value="">-- プレートテンプレ --</option>
              <option value="商品は重ねずに向きをそろえて提供します。">重ならないように提供</option>
              <option value="ソースは別添えで提供します。">ソース別添え</option>
              <option value="熱いので火傷に注意して提供してください。">火傷注意</option>
            </select>
          </div>
          <textarea id="plateText" class="step-textarea" placeholder="提供方法や盛り付けの注意点等" rows="3" oninput="autoResizeTextarea(this)" style="font-size: 0.85rem; padding: 4px;"></textarea>
        </div>
'''
if 'id="plateSection"' not in html:
    # 探す対象は bread-only クラスがついた specsSection
    if 'id="specsSection"' in html:
        # specsSection を含む </div> </div> の塊の後ろに差し込む
        html = re.sub(
            r'(<div class="bread-only"[^>]*id="specsSection">.*?</div>\s*</div>)',
            r'\1\n' + plate_html,
            html,
            flags=re.DOTALL
        )
        # 念のため class="bread-only" じゃない場合
        if 'id="plateSection"' not in html:
            html = re.sub(
                r'(<div style="flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 20px;" id="specsSection">.*?</div>\s*</div>)',
                r'\1\n' + plate_html,
                html,
                flags=re.DOTALL
            )

# 4. layoutTopLeft を閉じて layoutBottomRight を開く
# 手順ブロックの直前で layoutTopLeft を閉じる
if 'layoutBottomRight' not in html:
    html = html.replace('<!-- ============================== 手順ブロック ============================== -->',
                        '</div> <!-- /layoutTopLeft -->\n\n    <div id="layoutBottomRight" style="width: 100%;">\n      <!-- ============================== 手順ブロック ============================== -->')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
print('HTML Layout Fixed!')
