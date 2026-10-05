Created At: 2026-09-01T07:34:30Z
Completed At: 2026-09-01T07:34:30Z
File Path: `file:///C:/Users/m2100876/Downloads/%E6%89%8B%E9%A0%86%E6%9B%B8%E4%BD%9C%E6%88%90%E3%83%84%E3%83%BC%E3%83%AB%20%E3%82%B3%E3%83%BC%E3%83%89/js/main.js`
Total Lines: 2345
Total Bytes: 93774
Showing lines 800 to 1500
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
800:           <span class="print-text ing-name-print"></span>
801:         </td>
802:         <td>
803:           <input type="text" class="ing-amount" value="${ing.amount}" placeholder="使用量">
804:           <span class="print-text ing-amount-print"></span>
805:         </td>
806:         <td>
807:           <select class="ing-unit">
808:             ${unitOptions}
809:           </select>
810:         </td>
811:         <td style="text-align: center; position: relative;">
812:           <select class="ing-standby">
813:             <option value=""${ing.standby ? '' : ' selected'}></option>
814:             <option value="スタンバイ"${ing.standby ? ' selected' : ''}>スタンバイ</option>
815:           </select>
816:           <span class="print-standby-check">✔</span>
817:         </td>
818:         <td class="edit-only-col" style="text-align: center;">
819:           <button type="button" class="del-btn edit-only-btn" onclick="removeRow(this, 'ing')">🗑️</button>
820:         </td>
821:       `;
822:       container.appendChild(tr);
823:     });
824:     adjustPreviewScale();
825:   }
826: 
827:   document.addEventListener('DOMContentLoaded', () => {
828:     reorganizeStepBlocks();
829:     updateStandbyBlockNumbers();
830:     updateStandbyVisibility();
831: 
832:     // SortableJS Drag-and-Drop
833:     if (typeof Sortable !== 'undefined') {
834:       const sortableOptions = {
835:         group: 'steps',
836:         animation: 150,
837:         handle: '.step-block-header',
838:         onEnd: function() {
839:           reorganizeStepBlocks();
840:         }
841:       };
842:       new Sortable(document.getElementById('outStepsLeft'), sortableOptions);
843:       new Sortable(document.getElementById('outStepsRight'), sortableOptions);
844:       new Sortable(document.getElementById('outStepsFull'), sortableOptions);
845:     }
846:     updateStandbyVisibility();
847: 
848:     // 初期時にすでにあるテキストエリアのサイズを調整
849:     document.querySelectorAll('.step-textarea').forEach(el => {
850:       autoResizeTextarea(el);
851:     });
852: 
853:     const CACHE_VERSION = "v4";
854:     const cachedVersion = safeStorage.getItem('cachedVersion');
855:     const cachedData = safeStorage.getItem('cachedMenuMaster');
856:     
857:     if (cachedData && cachedVersion === CACHE_VERSION) {
858:       try {
859:         menuMaster = JSON.parse(cachedData);
860:         const menuCount = safeStorage.getItem('cachedMenuCount') || Object.keys(menuMaster).length;
861:         const sourceLabel = safeStorage.getItem('cachedSourceLabel') || "キャッシュ";
862:         const statusDiv = document.getElementById('masterStatus');
863:         statusDiv.innerText = `マスタデータ読込完了 (${menuCount}件のメニュー) (${sourceLabel})`;
864:         statusDiv.style.backgroundColor = "#e8f5e9";
865:         statusDiv.style.color = "#2e7d32";
866:         
867:         // キャッシュ読み込み後、バックグラウンドでGoogleスプレッドシートから自動更新を行う
868:         loadMasterData(true);
869:       } catch (e) {
870:         console.error("Cache load error", e);
871:         loadMasterData(false);
872:       }
873:     } else {
874:       safeStorage.removeItem('cachedMenuMaster');
875:       safeStorage.removeItem('cachedMenuCount');
876:       safeStorage.removeItem('cachedSourceLabel');
877:       safeStorage.setItem('cachedVersion', CACHE_VERSION);
878:       loadMasterData(false);
879:     }
880:     
881:     const menuCodeInput = document.getElementById('menuCode');
882:     const productNameInput = document.getElementById('productName');
883:     
884:     if (menuCodeInput) {
885:       menuCodeInput.addEventListener('input', (e) => {
886:         const code = e.target.value.trim();
887:         if (menuMaster[code]) {
888:           productNameInput.value = menuMaster[code].name;
889:           handleMenuCodeSelection(code);
890:         } else {
891:           updateDBStatusLabel(null);
892:         }
893:       });
894:     }
895:     
896:     if (productNameInput) {
897:       productNameInput.addEventListener('input', (e) => {
898:         const name = e.target.value.trim();
899:         const foundCode = Object.keys(menuMaster).find(code => menuMaster[code].name === name);
900:         if (foundCode) {
901:           menuCodeInput.value = foundCode;
902:           handleMenuCodeSelection(foundCode);
903:         } else {
904:           updateDBStatusLabel(null);
905:         }
906:       });
907:     }
908:   });
909: 
910:   // サジェスト機能
911:   let activeSuggestTarget = null;
912:   let activeSuggestValue = null;
913: 
914:   // --- 3.7 Auto-Complete Suggest List Engine ---
915:   function closeAllSuggestions() {
916:     document.querySelectorAll('.suggest-list').forEach(el => el.remove());
917:     activeSuggestTarget = null;
918:     activeSuggestValue = null;
919:   }
920: 
921:   function showSuggestions(inputEl) {
922:     const val = inputEl.value.trim();
923:     if (activeSuggestTarget === inputEl && activeSuggestValue === val) {
924:       if (inputEl.parentElement.querySelector('.suggest-list')) {
925:         return;
926:       }
927:     }
928: 
929:     closeAllSuggestions();
930:     activeSuggestTarget = inputEl;
931:     activeSuggestValue = val;
932: 
933:     const wrapper = inputEl.parentElement;
934:     if (!wrapper.classList.contains('autocomplete-wrapper')) return;
935: 
936:     let matches = [];
937:     const valUpper = val.toUpperCase();
938: 
939:     for (const [code, menu] of Object.entries(menuMaster)) {
940:       const matchCode = code.toUpperCase().includes(valUpper);
941:       const matchName = menu.name.toUpperCase().includes(valUpper);
942:       if (!val || matchCode || matchName) {
943:         matches.push({
944:           code: code,
945:           name: menu.name
946:         });
947:       }
948:     }
949: 
950:     if (matches.length === 0) return;
951: 
952:     matches = matches.slice(0, 50);
953: 
954:     const listDiv = document.createElement('div');
955:     listDiv.className = 'suggest-list';
956:     if (inputEl.id === 'menuCode') {
957:       listDiv.style.right = '0';
958:       listDiv.style.left = 'auto';
959:     }
960: 
961:     matches.forEach(item => {
962:       const itemDiv = document.createElement('div');
963:       itemDiv.className = 'suggest-item';
964:       const isSaved = savedMenuCodes.has(item.code);
965:       itemDiv.innerText = `${isSaved ? '💾 ' : ''}${item.code} : ${item.name}`;
966:       
967:       itemDiv.addEventListener('mousedown', (e) => {
968:         e.preventDefault();
969:         e.stopPropagation();
970:         
971:         document.getElementById('menuCode').value = item.code;
972:         document.getElementById('productName').value = item.name;
973:         closeAllSuggestions();
974:         handleMenuCodeSelection(item.code);
975:       });
976:       listDiv.appendChild(itemDiv);
977:     });
978: 
979:     wrapper.appendChild(listDiv);
980:   }
981: 
982:   function handleInputEvent(e) {
983:     let target = e.target;
984:     if (!target) return;
985:     
986:     // classListの存在確認を含め安全に取得
987:     let isArrowClick = target.classList && target.classList.contains('dropdown-arrow');
988:     if (isArrowClick) {
989:       target = target.parentElement ? target.parentElement.querySelector('input') : null;
990:     }
991:     if (!target) return;
992: 
993:     if (target.id === 'menuCode' || target.id === 'productName') {
994:       if (e.type === 'click' && isArrowClick) {
995:         const existingList = target.parentElement ? target.parentElement.querySelector('.suggest-list') : null;
996:         if (existingList) {
997:           closeAllSuggestions();
998:           return;
999:         }
1000:         target.focus();
1001:       }
1002:       showSuggestions(target);
1003:     }
1004:   }
1005: 
1006:   // --- 3.8 Global Event Bindings & Initializers ---
1007:   document.addEventListener('input', handleInputEvent);
1008:   document.addEventListener('focusin', handleInputEvent);
1009:   document.addEventListener('click', handleInputEvent);
1010: 
1011:   document.addEventListener('click', function(e) {
1012:     if (!e.target || !e.target.closest || !e.target.closest('.autocomplete-wrapper')) {
1013:       closeAllSuggestions();
1014:     }
1015:   });
1016: 
1017:   // スタンバイセレクトボックス変更時のクラス付与処理 (印刷用スタイルとの連携)
1018:   document.addEventListener('change', function(e) {
1019:     if (e.target.classList.contains('ing-standby')) {
1020:       const row = e.target.closest('.ing-row');
1021:       if (row) {
1022:         if (e.target.value === 'スタンバイ') {
1023:           row.classList.add('is-standby');
1024:         } else {
1025:           row.classList.remove('is-standby');
1026:         }
1027:       }
1028:     }
1029:   });
1030: 
1031:   document.addEventListener('focusout', function(e) {
1032:     setTimeout(() => {
1033:       if (document.activeElement !== e.target && (!document.activeElement || !document.activeElement.closest || !document.activeElement.closest('.autocomplete-wrapper'))) {
1034:         closeAllSuggestions();
1035:       }
1036:     }, 150);
1037:   });
1038: 
1039:   // ローカルファイル読込
1040:   const masterFileInput = document.getElementById('masterFileInput');
1041:   if (masterFileInput) {
1042:     masterFileInput.addEventListener('change', function(e) {
1043:       const file = e.target.files[0];
1044:       if (!file) return;
1045: 
1046:       const statusDiv = document.getElementById('masterStatus');
1047:       statusDiv.innerText = "ファイルを解析しています...";
1048:       statusDiv.style.backgroundColor = "#ffe0b2";
1049:       statusDiv.style.color = "#e65100";
1050: 
1051:       const fileName = file.name;
1052:       const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
1053: 
1054:       const reader = new FileReader();
1055:       if (isExcel) {
1056:         reader.onload = function(evt) {
1057:           try {
1058:             const data = new Uint8Array(evt.target.result);
1059:             const workbook = XLSX.read(data, {type: 'array'});
1060:             const firstSheetName = workbook.SheetNames[0];
1061:             const worksheet = workbook.Sheets[firstSheetName];
1062:             const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1});
1063:             processMasterRows(rows, `Excel: ${fileName}`);
1064:           } catch (err) {
1065:             console.error(err);
1066:             statusDiv.innerText = "Excelファイルの解析に失敗しました。";
1067:             statusDiv.style.backgroundColor = "#ffebee";
1068:             statusDiv.style.color = "#c62828";
1069:           }
1070:         };
1071:         reader.readAsArrayBuffer(file);
1072:       } else {
1073:         reader.onload = function(evt) {
1074:           try {
1075:             const text = evt.target.result;
1076:             const lines = text.split(/\r?\n/);
1077:             const rows = [];
1078:             for (let i = 0; i < lines.length; i++) {
1079:               if (lines[i].trim()) {
1080:                 rows.push(parseCSVLine(lines[i]));
1081:               }
1082:             }
1083:             processMasterRows(rows, `CSV: ${fileName}`);
1084:           } catch (err) {
1085:             console.error(err);
1086:             statusDiv.innerText = "CSVファイルの解析に失敗しました。";
1087:             statusDiv.style.backgroundColor = "#ffebee";
1088:             statusDiv.style.color = "#c62828";
1089:           }
1090:         };
1091:         reader.readAsText(file, 'Shift_JIS');
1092:       }
1093:     });
1094:   }
1095: 
1096:   // --- 3.1.1 IndexedDB Database Wrapper for Recipes ---
1097:   class RecipeDB {
1098:     constructor() {
1099:       this.dbName = "RecipeMakerDB";
1100:       this.dbVersion = 1;
1101:       this.storeName = "recipes";
1102:       this.db = null;
1103:     }
1104: 
1105:     init() {
1106:       return new Promise((resolve, reject) => {
1107:         try {
1108:           if (!window.indexedDB) {
1109:             throw new Error("IndexedDB is not supported in this browser.");
1110:           }
1111:           const request = indexedDB.open(this.dbName, this.dbVersion);
1112:           
1113:           request.onupgradeneeded = (e) => {
1114:             const db = e.target.result;
1115:             if (!db.objectStoreNames.contains(this.storeName)) {
1116:               db.createObjectStore(this.storeName, { keyPath: "menuCode" });
1117:             }
1118:           };
1119: 
1120:           request.onsuccess = (e) => {
1121:             this.db = e.target.result;
1122:             resolve(this.db);
1123:           };
1124: 
1125:           request.onerror = (e) => {
1126:             console.error("IndexedDB open error:", e.target.error);
1127:             reject(e.target.error || new Error("Permission denied to open IndexedDB"));
1128:           };
1129:         } catch (err) {
1130:           console.error("IndexedDB initialization error:", err);
1131:           reject(err);
1132:         }
1133:       });
1134:     }
1135: 
1136:     saveRecipe(recipe) {
1137:       return new Promise((resolve, reject) => {
1138:         if (!this.db) {
1139:           reject(new Error("Database not initialized"));
1140:           return;
1141:         }
1142:         const transaction = this.db.transaction([this.storeName], "readwrite");
1143:         const store = transaction.objectStore(this.storeName);
1144:         const request = store.put(recipe);
1145: 
1146:         request.onsuccess = () => resolve(true);
1147:         request.onerror = (e) => reject(e.target.error);
1148:       });
1149:     }
1150: 
1151:     getRecipe(menuCode) {
1152:       return new Promise((resolve, reject) => {
1153:         if (!this.db) {
1154:           reject(new Error("Database not initialized"));
1155:           return;
1156:         }
1157:         const transaction = this.db.transaction([this.storeName], "readonly");
1158:         const store = transaction.objectStore(this.storeName);
1159:         const request = store.get(menuCode);
1160: 
1161:         request.onsuccess = (e) => resolve(e.target.result || null);
1162:         request.onerror = (e) => reject(e.target.error);
1163:       });
1164:     }
1165: 
1166:     deleteRecipe(menuCode) {
1167:       return new Promise((resolve, reject) => {
1168:         if (!this.db) {
1169:           reject(new Error("Database not initialized"));
1170:           return;
1171:         }
1172:         const transaction = this.db.transaction([this.storeName], "readwrite");
1173:         const store = transaction.objectStore(this.storeName);
1174:         const request = store.delete(menuCode);
1175: 
1176:         request.onsuccess = () => resolve(true);
1177:         request.onerror = (e) => reject(e.target.error);
1178:       });
1179:     }
1180: 
1181:     getAllCodes() {
1182:       return new Promise((resolve, reject) => {
1183:         if (!this.db) {
1184:           reject(new Error("Database not initialized"));
1185:           return;
1186:         }
1187:         const transaction = this.db.transaction([this.storeName], "readonly");
1188:         const store = transaction.objectStore(this.storeName);
1189:         const request = store.getAllKeys();
1190: 
1191:         request.onsuccess = (e) => resolve(e.target.result || []);
1192:         request.onerror = (e) => reject(e.target.error);
1193:       });
1194:     }
1195: 
1196:     getAllRecipes() {
1197:       return new Promise((resolve, reject) => {
1198:         if (!this.db) {
1199:           reject(new Error("Database not initialized"));
1200:           return;
1201:         }
1202:         const transaction = this.db.transaction([this.storeName], "readonly");
1203:         const store = transaction.objectStore(this.storeName);
1204:         const request = store.getAll();
1205: 
1206:         request.onsuccess = (e) => resolve(e.target.result || []);
1207:         request.onerror = (e) => reject(e.target.error);
1208:       });
1209:     }
1210:   }
1211: 
1212:   const recipeDB = new RecipeDB();
1213:   const savedMenuCodes = new Set();
1214: 
1215:   // DBの初期化と保存済みコード一覧のロード
1216:   recipeDB.init()
1217:     .then(() => recipeDB.getAllCodes())
1218:     .then(codes => {
1219:       codes.forEach(code => savedMenuCodes.add(code));
1220:       console.log("Database initialized. Saved menu codes:", Array.from(savedMenuCodes));
1221:       
1222:       // 初期状態のメニューコード入力がある場合は表示状態を同期
1223:       const currentCode = document.getElementById('menuCode').value.trim();
1224:       if (currentCode) {
1225:         updateDBStatusLabel(currentCode);
1226:       }
1227:       updateSavedCount();
1228:     })
1229:     .catch(err => {
1230:       console.error("Failed to initialize database:", err);
1231:     });
1232: 
1233:   // DB連携のUI表示メッセージ更新
1234:   function showStatusMessage(text, type = "info") {
1235:     const statusDiv = document.getElementById('dbStatus');
1236:     if (!statusDiv) return;
1237:     
1238:     statusDiv.innerText = text;
1239:     statusDiv.style.color = "#fff";
1240:     
1241:     if (type === "success") {
1242:       statusDiv.style.backgroundColor = "#2e7d32"; // 緑
1243:     } else if (type === "error") {
1244:       statusDiv.style.backgroundColor = "#c62828"; // 赤
1245:     } else if (type === "info") {
1246:       statusDiv.style.backgroundColor = "#0288d1"; // 青
1247:     } else {
1248:       statusDiv.style.backgroundColor = "#78909c"; // グレー
1249:       statusDiv.style.color = "#37474f";
1250:     }
1251:   }
1252: 
1253:   function updateDBStatusLabel(code) {
1254:     const statusDiv = document.getElementById('dbStatus');
1255:     if (!statusDiv) return;
1256:     
1257:     if (!code) {
1258:       statusDiv.innerText = "✏️ 新規手順書";
1259:       statusDiv.style.backgroundColor = "#e2e8f0";
1260:       statusDiv.style.color = "#475569";
1261:       return;
1262:     }
1263:     
1264:     if (savedMenuCodes.has(code)) {
1265:       statusDiv.innerText = "💾 保存済み";
1266:       statusDiv.style.backgroundColor = "#c8e6c9";
1267:       statusDiv.style.color = "#256029";
1268:     } else {
1269:       statusDiv.innerText = "✏️ 未保存の新規";
1270:       statusDiv.style.backgroundColor = "#ffe0b2";
1271:       statusDiv.style.color = "#e65100";
1272:     }
1273:   }
1274: 
1275:   // 手順書オブジェクトのシリアライズ
1276:   async function serializeCurrentRecipe() {
1277:     const menuCode = document.getElementById('menuCode').value.trim();
1278:     const productName = document.getElementById('productName').value.trim();
1279:     if (!menuCode) return null;
1280: 
1281:     const periodStart = document.getElementById('periodStart').value;
1282:     const periodEnd = document.getElementById('periodEnd').value;
1283:     const brandCategory = document.getElementById('brandCategory') ? document.getElementById('brandCategory').value : "";
1284:     const menuCategory = document.getElementById('menuCategory') ? document.getElementById('menuCategory').value : "";
1285: 
1286:     const moldL = document.getElementById('moldL').value;
1287:     const moldW = document.getElementById('moldW').value;
1288:     const moldH = document.getElementById('moldH').value;
1289:     const maxLoad = document.getElementById('maxLoad').value;
1290: 
1291:     const proofL = document.getElementById('proofL').value;
1292:     const proofW = document.getElementById('proofW').value;
1293:     const proofH = document.getElementById('proofH').value;
1294:     const proofTime = document.getElementById('proofTime').value;
1295: 
1296:     const bakeL = document.getElementById('bakeL').value;
1297:     const bakeW = document.getElementById('bakeW').value;
1298:     const bakeH = document.getElementById('bakeH').value;
1299:     const bakeTime = document.getElementById('bakeTime').value;
1300: 
1301:     const servingText = document.getElementById('servingText') ? document.getElementById('servingText').value.trim() : "";
1302: 
1303:     // 使用食材
1304:     const ingredients = [];
1305:     document.querySelectorAll('#ingredientsContainer .ing-row').forEach(row => {
1306:       const code = row.querySelector('.ing-code').value.trim();
1307:       const name = row.querySelector('.ing-name').value.trim();
1308:       const amount = row.querySelector('.ing-amount').value.trim();
1309:       const unit = row.querySelector('.ing-unit').value;
1310:       const standby = row.querySelector('.ing-standby').value === 'スタンバイ';
1311:       if (code || name || amount) {
1312:         ingredients.push({ code, name, amount, unit, standby });
1313:       }
1314:     });
1315: 
1316:     // 各手順ブロック
1317:     const manualSteps = [];
1318:     const stepBlocks = document.querySelectorAll('#outputArea .step-block[data-block-type="step"]');
1319:     for (let block of stepBlocks) {
1320:       const text = block.querySelector('.step-textarea').value;
1321:       const uploadBox = block.querySelector('.image-upload-box');
1322:       const imageBlob = uploadBox.fileData || null;
1323:       manualSteps.push({ text, imageBlob });
1324:     }
1325: 
1326:     // スタンバイブロック
1327:     const standbySteps = [];
1328:     const standbyBlocks = document.querySelectorAll('#standbyContainer .standby-block');
1329:     for (let block of standbyBlocks) {
1330:       const text = block.querySelector('.step-textarea').value;
1331:       const uploadBox = block.querySelector('.image-upload-box');
1332:       const imageBlob = uploadBox.fileData || null;
1333:       standbySteps.push({ text, imageBlob });
1334:     }
1335: 
1336:     // 固定位置の画像
1337:     const mainImageBlob = document.getElementById('mainImage').closest('.image-upload-box').fileData || null;
1338:     const moldImageBlob = document.getElementById('moldImg').closest('.image-upload-box').fileData || null;
1339:     const proofImageBlob = document.getElementById('proofImg').closest('.image-upload-box').fileData || null;
1340:     const bakeImageBlob = document.getElementById('bakeImg').closest('.image-upload-box').fileData || null;
1341: 
1342:     return {
1343:       menuCode,
1344:       productName,
1345:       periodStart,
1346:       periodEnd,
1347:       brandCategory,
1348:       menuCategory,
1349:       mode: currentMode,
1350:       moldL, moldW, moldH, maxLoad,
1351:       proofL, proofW, proofH, proofTime,
1352:       bakeL, bakeW, bakeH, bakeTime,
1353:       servingText,
1354:       ingredients,
1355:       manualSteps,
1356:       standbySteps,
1357:       mainImageBlob,
1358:       moldImageBlob,
1359:       proofImageBlob,
1360:       bakeImageBlob,
1361:       lastUpdated: Date.now()
1362:     };
1363:   }
1364: 
1365:   // 手順書オブジェクトのデシリアライズ（画面への反映）
1366:   function loadRecipeFromDB(recipe) {
1367:     if (!recipe) return;
1368: 
1369:     // モード切替を復元
1370:     if (recipe.mode && recipe.mode !== currentMode) {
1371:       // suppress sidebar toggle visually if needed, but since sidebar is closed by default, it's fine.
1372:       // 実際には switchMode() を呼ぶとサイドバーがトグルされてしまう問題があるため、
1373:       // ここではUIの直接操作と変数代入のみ行う。
1374:       currentMode = recipe.mode;
1375:       const body = document.body;
1376:       const badge = document.getElementById('modeBadge');
1377:       document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
1378:     // 動的に印刷向きを変更
1379:     let printStyle = document.getElementById('dynamicPrintStyle');
1380:     if (!printStyle) {
1381:       printStyle = document.createElement('style');
1382:       printStyle.id = 'dynamicPrintStyle';
1383:       document.head.appendChild(printStyle);
1384:     }
1385: 
1386:       
1387:       if (currentMode === 'cooking') {
1388:         body.classList.add('mode-cooking');
1389:         if (badge) { badge.innerText = '料理・デザートモード'; badge.style.backgroundColor = '#ef4444'; }
1390:         const activeBtn = document.querySelector('.mode-btn[onclick*="cooking"]');
1391:         if (activeBtn) activeBtn.classList.add('active');
1392:       } else {
1393:         body.classList.remove('mode-cooking');
1394:         if (badge) { badge.innerText = 'パンモード'; badge.style.backgroundColor = '#f59e0b'; }
1395:         const activeBtn = document.querySelector('.mode-btn[onclick*="bread"]');
1396:         if (activeBtn) activeBtn.classList.add('active');
1397:       }
1398:     } else if (!recipe.mode && currentMode === 'cooking') {
1399:        // 過去のレシピ（パンモード限定だった頃のもの）ならパンモードに戻す
1400:        currentMode = 'bread';
1401:        const body = document.body;
1402:        const badge = document.getElementById('modeBadge');
1403:        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
1404:     // 動的に印刷向きを変更
1405:     let printStyle = document.getElementById('dynamicPrintStyle');
1406:     if (!printStyle) {
1407:       printStyle = document.createElement('style');
1408:       printStyle.id = 'dynamicPrintStyle';
1409:       document.head.appendChild(printStyle);
1410:     }
1411: 
1412:        body.classList.remove('mode-cooking');
1413:        if (badge) { badge.innerText = 'パンモード'; badge.style.backgroundColor = '#f59e0b'; }
1414:        const activeBtn = document.querySelector('.mode-btn[onclick*="bread"]');
1415:        if (activeBtn) activeBtn.classList.add('active');
1416:     }
1417: 
1418:     document.getElementById('menuCode').value = recipe.menuCode || "";
1419:     document.getElementById('productName').value = recipe.productName || "";
1420:     document.getElementById('periodStart').value = recipe.periodStart || "";
1421:     document.getElementById('periodEnd').value = recipe.periodEnd || "";
1422:     if (document.getElementById('brandCategory')) document.getElementById('brandCategory').value = recipe.brandCategory || "";
1423:     if (document.getElementById('menuCategory')) document.getElementById('menuCategory').value = recipe.menuCategory || "";
1424: 
1425:     document.getElementById('moldL').value = recipe.moldL || 0;
1426:     document.getElementById('moldW').value = recipe.moldW || 0;
1427:     document.getElementById('moldH').value = recipe.moldH || 0;
1428:     document.getElementById('maxLoad').value = recipe.maxLoad || "6";
1429: 
1430:     document.getElementById('proofL').value = recipe.proofL || 0;
1431:     document.getElementById('proofW').value = recipe.proofW || 0;
1432:     document.getElementById('proofH').value = recipe.proofH || 0;
1433:     document.getElementById('proofTime').value = recipe.proofTime || "40";
1434: 
1435:     document.getElementById('bakeL').value = recipe.bakeL || 0;
1436:     document.getElementById('bakeW').value = recipe.bakeW || 0;
1437:     document.getElementById('bakeH').value = recipe.bakeH || 0;
1438:     document.getElementById('bakeTime').value = recipe.bakeTime || "10";
1439: 
1440:     // 画像の復元
1441:     restoreImageHelper('mainImage', recipe.mainImageBlob);
1442:     restoreImageHelper('moldImg', recipe.moldImageBlob);
1443:     restoreImageHelper('proofImg', recipe.proofImageBlob);
1444:     restoreImageHelper('bakeImg', recipe.bakeImageBlob);
1445: 
1446:     if (document.getElementById('servingText')) {
1447:       document.getElementById('servingText').value = recipe.servingText || "";
1448:       autoResizeTextarea(document.getElementById('servingText'));
1449:     }
1450: 
1451:     // 食材テーブルの復元
1452:     let ingredientsToLoad = recipe.ingredients || [];
1453:     // マスターデータが存在し、該当のメニューコードがあれば強制的に最新の食材を使う
1454:     if (recipe.menuCode && window.menuMaster && window.menuMaster[recipe.menuCode] && window.menuMaster[recipe.menuCode].ingredients && window.menuMaster[recipe.menuCode].ingredients.length > 0) {
1455:       ingredientsToLoad = window.menuMaster[recipe.menuCode].ingredients;
1456:     }
1457:     populateIngredients(ingredientsToLoad);
1458: 
1459:     // 各手順ブロックの復元
1460:     const stepsLeft = document.getElementById('outStepsLeft');
1461:     const stepsRight = document.getElementById('outStepsRight');
1462:     const stepsFull = document.getElementById('outStepsFull');
1463:     stepsLeft.innerHTML = '';
1464:     stepsRight.innerHTML = '';
1465:     stepsFull.innerHTML = '';
1466: 
1467:     if (recipe.manualSteps && recipe.manualSteps.length > 0) {
1468:       recipe.manualSteps.forEach((step, index) => {
1469:         const blockId = Date.now() + index;
1470:         const div = document.createElement('div');
1471:         div.className = 'step-block';
1472:         div.setAttribute('data-block-id', blockId);
1473:         div.setAttribute('data-block-type', 'step');
1474:         div.innerHTML = `
1475:           <div class="step-block-header edit-only-row">
1476:             <span class="block-title" style="color:#e91e63;">手順</span>
1477:             <select class="step-template-select edit-only-btn" onchange="applyStepTemplate(this)" style="margin-left: 10px; font-size: 0.8rem; padding: 2px;">
1478:               <option value="">-- 定型文挿入 --</option>
1479:               <option value="proof">ホイロ</option>
1480:               <option value="bake1">焼成①</option>
1481:               <option value="bake2">焼成②（スチーム）</option>
1482:               <option value="bake3">焼成③（2重天板）</option>
1483:               <option value="bake4">焼成④（クッキングシート）</option>
1484:             </select>
1485:             <button type="button" class="del-btn edit-only-btn" style="width:auto; padding:2px 5px;" onclick="removeStepBlock(this)">ブロック削除</button>
1486:           </div>
1487:           <div class="step-preview-block">
1488:             <div class="step-img-out">
1489:               <div class="image-upload-box" onclick="triggerFileInput(this)">
1490:                 <input type="file" class="image-file-input block-img" accept="image/*" onchange="previewImage(this)">
1491:                 <div class="image-placeholder">
1492:                   <span>📷 写真を選択</span>
1493:                 </div>
1494:                 <div class="image-preview" style="display: none;">
1495:                   <img>
1496:                   <button type="button" class="del-image-btn edit-only-btn" onclick="clearImage(event, this)">×</button>
1497:                 </div>
1498:               </div>
1499:             </div>
1500:             <div class="step-texts-out">
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
