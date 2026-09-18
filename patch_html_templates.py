import os
import re

filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html = f.read()

# プレートのテンプレートプルダウン追加
old_plate_title = '''<span class="block-title" style="color:#e91e63; font-weight:bold;">【プレート】</span>'''
new_plate_title = '''<span class="block-title" style="color:#e91e63; font-weight:bold;">【プレート】</span>
          <select id="plateTemplateSelect" class="edit-only-btn" style="margin-left: 10px; font-size: 0.8rem; padding: 2px;" onchange="applyPlateTemplate(this)">
            <option value="">-- 提供方法テンプレート --</option>
            <option value="plate1">①プレート盛り</option>
            <option value="plate2">②ホーロー皿</option>
            <option value="plate3">③鉄板</option>
          </select>'''
if 'id="plateTemplateSelect"' not in html:
    html = html.replace(old_plate_title, new_plate_title)

# 手順①テンプレート挿入ボタン追加 (追加ボタンの横)
old_add_btn = '''<button type="button" class="add-btn edit-only-btn" onclick="addStepBlock()">＋手順ブロック追加</button>'''
new_add_btn = '''<button type="button" class="add-btn edit-only-btn" onclick="addStepBlock()">＋手順ブロック追加</button>
      <button type="button" class="add-btn edit-only-btn" style="background-color:#0288d1;" onclick="openStep1TemplateModal()">＋手順①テンプレ挿入</button>'''
if 'openStep1TemplateModal' not in html:
    html = html.replace(old_add_btn, new_add_btn)

# モーダルダイアログの追加 (bodyの最後)
modal_html = '''
  <!-- 手順①テンプレートモーダル -->
  <div id="step1TemplateModal" class="modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; justify-content:center; align-items:center;">
    <div style="background:#fff; padding:20px; border-radius:8px; width:400px; max-width:90%;">
      <h3 style="margin-top:0; color:#1e293b;">手順① テンプレート挿入</h3>
      
      <div style="margin-bottom:15px;">
        <label><input type="radio" name="step1Format" value="format1" checked onchange="toggleEquipmentList()"> <b>＜フォーマット①＞</b> 備品指定なし</label><br>
        <span style="font-size:0.8rem; color:#64748b; margin-left:20px;">「手を洗いアルコールをします。...」</span>
      </div>
      
      <div style="margin-bottom:15px;">
        <label><input type="radio" name="step1Format" value="format2" onchange="toggleEquipmentList()"> <b>＜フォーマット②＞</b> 備品複数選択</label><br>
        <div id="equipmentCheckboxes" style="margin-top:10px; margin-left:20px; display:none;">
          <label style="display:block; margin-bottom:5px;"><input type="checkbox" value="鉄板"> 鉄板</label>
          <label style="display:block; margin-bottom:5px;"><input type="checkbox" value="ボウル"> ボウル</label>
          <label style="display:block; margin-bottom:5px;"><input type="checkbox" value="手鍋"> 手鍋</label>
          <label style="display:block; margin-bottom:5px;"><input type="checkbox" value="ゴムベラ"> ゴムベラ</label>
          <label style="display:block; margin-bottom:5px;"><input type="checkbox" value="ホーロー皿"> ホーロー皿</label>
          <label style="display:block; margin-bottom:5px;"><input type="checkbox" value="プレート"> プレート</label>
        </div>
      </div>
      
      <div style="margin-top:20px; display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="del-btn" onclick="closeStep1TemplateModal()">キャンセル</button>
        <button type="button" class="add-btn" onclick="insertStep1Template()">テンプレ挿入してブロック追加</button>
      </div>
    </div>
  </div>
'''
if 'id="step1TemplateModal"' not in html:
    html = html.replace('</body>', modal_html + '\n</body>')

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html)
