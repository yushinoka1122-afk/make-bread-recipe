import re

# --- HTML ロールバック ---
filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html = f.read()

# 製造指示伝票を削除
html = re.sub(r'<div class="slip-title-row".*?</div>', '', html, flags=re.DOTALL)
# プレートのテンプレートプルダウンを削除
html = re.sub(r'<select id="plateTemplateSelect".*?</select>', '', html, flags=re.DOTALL)
# 手順①テンプレート挿入ボタンを削除
html = re.sub(r'<button type="button" class="add-btn edit-only-btn" style="background-color:#0288d1;" onclick="openStep1TemplateModal\(\)">＋手順①テンプレ挿入</button>', '', html)
# モーダルを削除
html = re.sub(r'<!-- 手順①テンプレートモーダル -->.*?</div>\s*</div>', '', html, flags=re.DOTALL)
# body末尾の強引なスタンバイ枠を削除
html = re.sub(r'<!-- === スタンバイセクション \(パンモード裏方用\) === -->.*?</div>\s*</div>', '', html, flags=re.DOTALL)
# 古い位置にスタンバイ枠を復活
original_standby = '''
          <div class="steps-right-bottom">
            <div class="section-title" style="margin-top:20px;">
              <h2 style="color:#0056b3; margin:0; font-size:1.1rem;">■ スタンバイ</h2>
            </div>
            <div id="standbyContainer"></div>
          </div>
'''
if 'id="standbyContainer"' not in html:
    # 適切な場所（おそらく右カラムの下か全体の下）に戻す。
    html = html.replace('<!-- === 右カラム：手順等 === -->', original_standby + '\n<!-- === 右カラム：手順等 === -->')

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html)


# --- JS ロールバック ---
filepath_js = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\js\main.js'
with open(filepath_js, 'r', encoding='utf-8') as f:
    js = f.read()

# Limit
js = re.sub(r'if \(typeof currentMode !== \'undefined\' && currentMode === \'cooking\'\) \{.*?\} else \{.*?(if \(stepBlocks\.length >= 8\) \{.*?\}).*?\}', r'\1', js, flags=re.DOTALL)
# Header checkbox
js = re.sub(r'<label style="margin-left:5px; font-size:0.8rem; cursor:pointer;" class="edit-only-btn"><input type="checkbox" onchange="toggleStandbyLabel\(this\)"> スタンバイ化</label>\s*', '', js)
# Numbering update
old_update = '''  function updateStepNumbers() {
    const blocks = document.querySelectorAll('#outputArea .step-block[data-block-type="step"]');
    blocks.forEach((block, index) => {
      const titleSpan = block.querySelector('.block-title');
      if (titleSpan) {
        titleSpan.innerText = '手順' + String.fromCharCode(9311 + (index + 1));
        titleSpan.style.color = '#e91e63';
        titleSpan.style.fontWeight = 'normal';
      }
    });
  }'''
js = re.sub(r'function updateStepNumbers\(\) \{.*?let stepCount = 1;.*?\}\);\s*\}', old_update, js, flags=re.DOTALL)
# reorganize
old_reorg = '''        // 料理モード
        if (index % 2 === 0) {
          outLeft.appendChild(block);
        } else {
          outRight.appendChild(block);
        }'''
js = re.sub(r'// 料理モード: 1〜8個目は1行目・2行目に交互.*?if \(index < 8\) \{.*?\} else \{.*?\}', old_reorg, js, flags=re.DOTALL)
# manufacturingSlip
js = re.sub(r'\s*const manufacturingSlip = document.getElementById\(\'manufacturingSlip\'\) \? document.getElementById\(\'manufacturingSlip\'\)\.value\.trim\(\) : "";', '', js)
js = js.replace('manufacturingSlip,', '')
js = re.sub(r'\s*if \(document.getElementById\(\'manufacturingSlip\'\)\) document.getElementById\(\'manufacturingSlip\'\)\.value = recipe\.manufacturingSlip \|\| "";', '', js)
js = re.sub(r'// 製造指示伝票の印刷用テキスト反映.*?\}', '', js, flags=re.DOTALL)

# 追加した関数を一気に消す
js = re.sub(r'window\.toggleStandbyLabel = function\(checkbox\) \{.*?\};', '', js, flags=re.DOTALL)
js = re.sub(r'// --- プレート欄テンプレート挿入機能 ---.*?\};', '', js, flags=re.DOTALL)

with open(filepath_js, 'w', encoding='utf-8') as f:
    f.write(js)
