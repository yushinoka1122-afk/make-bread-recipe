import os

filepath = r'C:\Users\m2100876\Downloads\手順書作成ツール コード\css\style.css'
with open(filepath, 'a', encoding='utf-8') as f:
    f.write('''
/* =========================================================
   料理・デザートモード 最終レイアウト（12枠・スタンバイ無）
   ========================================================= */

/* スタンバイ枠と旧分割コンテナの完全非表示 */
body.mode-cooking #standbySection,
body.mode-cooking #outStepsLeft,
body.mode-cooking #outStepsRight {
  display: none !important;
}

/* 手順ブロックを12枠（4列×3行）のグリッドで表示 */
body.mode-cooking #outStepsFull {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 10px !important;
  width: 100% !important;
}

/* ブロック全体のサイズ調整（3行入るように縮小） */
body.mode-cooking .step-block {
  min-height: 180px !important;
  height: 100% !important;
  margin-bottom: 0 !important;
}

/* 画像とテキストを上下（縦）に並べる */
body.mode-cooking .step-preview-block {
  flex-direction: column !important;
  align-items: stretch !important;
}

/* 画像枠を横幅100%に広げ、高さを制限 */
body.mode-cooking .step-img-out {
  flex: auto !important;
  width: 100% !important;
  height: auto !important;
  margin-bottom: 5px !important;
}
body.mode-cooking .step-img-out img {
  max-width: 100% !important;
  height: 90px !important;
  object-fit: contain !important;
}

/* プレート欄のコンパクト化（2ページ目突入防止） */
body.mode-cooking #plateSection {
  padding: 5px !important;
  margin-top: 5px !important;
}
body.mode-cooking #plateSection textarea {
  height: 35px !important;
  min-height: 35px !important;
  padding: 2px !important;
}
''')

print('CSS updated!')
