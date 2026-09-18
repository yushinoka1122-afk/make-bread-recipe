import re

filepath_html = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\index.html'
with open(filepath_html, 'r', encoding='utf-8') as f:
    html = f.read()

standby_html = '''
        <!-- === スタンバイセクション (パンモード用) === -->
        <div id="standbySectionWrapper">
          <div class="section-title" style="margin-top:20px;">
            <h2 style="color:#0056b3; margin:0; font-size:1.1rem;">■ スタンバイ</h2>
          </div>
          <div id="standbyContainer"></div>
        </div>
'''

# outputAreaの閉じタグの直前に挿入する
# id="editorWrapper" の </div> か何かがあるはずなので、目印を探す
html = html.replace('</div>\n</div>\n\n<!-- フッター -->', standby_html + '\n</div>\n</div>\n\n<!-- フッター -->')

# もし置換に失敗していたら別の方法で挿入
if 'id="standbyContainer"' not in html:
    # editorWrapperの最後尾付近に無理やり入れる
    html = html.replace('<!-- モーダル（テンプレート・保存済み一覧など） -->', standby_html + '\n<!-- モーダル（テンプレート・保存済み一覧など） -->')

with open(filepath_html, 'w', encoding='utf-8') as f:
    f.write(html)
