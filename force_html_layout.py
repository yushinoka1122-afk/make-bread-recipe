import os
import re

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. preview-header の直前に <div id="layoutTopLeft" style="width: 100%;"> を追加
if 'id="layoutTopLeft"' not in html:
    html = html.replace('<!-- ヘッダーエリア -->', '<div id="layoutTopLeft" style="width: 100%;">\n    <!-- ヘッダーエリア -->')

# 2. bread-only クラスの付与
html = html.replace('<div style="display: flex; gap: 10px; margin-top: 10px;">', '<div class="bread-only" style="display: flex; gap: 10px; margin-top: 10px;">')
html = html.replace('<div style="flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 20px;" id="specsSection">', '<div class="bread-only" style="flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 20px;" id="specsSection">')

# 3. plateSection の挿入と layoutTopLeft の終了、layoutBottomRight の開始
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
    # specsSection を閉じる </div> </div> の後ろを狙う
    html = re.sub(
        r'(<div class="bread-only"[^>]*id="specsSection">.*?</div>\s*</div>)',
        r'\1\n' + plate_html,
        html,
        flags=re.DOTALL
    )

if 'id="layoutBottomRight"' not in html:
    html = html.replace('<!-- ============================== 手順ブロック ============================== -->',
                        '</div> <!-- /layoutTopLeft -->\n\n    <div id="layoutBottomRight" style="width: 100%;">\n      <!-- ============================== 手順ブロック ============================== -->')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
print('Direct HTML Structure Override Complete!')
