Created At: 2026-10-02T12:29:43+09:00
Completed At: 2026-10-02T12:29:43+09:00
The following changes were made by the replace_file_content tool to: C:\Users\m2100876\Downloads\手順書作成ツール コード\js\cooking.js. If relevant, proactively run terminal commands to execute this code for the USER. Don't ask for permission.
[diff_block_start]
@@ -590,22 +590,49 @@
     adjustPreviewScale();
   }
 
-  function applyToolTemplate(selectObj) {
-    const tool = selectObj.value;
-    if (!tool) return;
-    
-    const block = selectObj.closest('.step-block');
-    const textarea = block.querySelector('.step-textarea');
-    
-    if (textarea) {
-      if (textarea.value) {
-        textarea.value = textarea.value + '\n・' + tool;
-      } else {
-        textarea.value = '・' + tool;
-      }
-      autoResizeTextarea(textarea);
-    }
-    selectObj.value = "";
+  function toggleToolMenu(btn) {
+    const container = btn.closest('.tool-dropdown-container');
+    const menu = container.querySelector('.tool-dropdown-menu');
+    const isVisible = menu.style.display === 'block';
+    
+    // 他の開いているメニューをすべて閉じる
+    document.querySelectorAll('.tool-dropdown-menu').forEach(m => m.style.display = 'none');
+    
+    if (!isVisible) {
+      menu.style.display = 'block';
+      // メニューを開いたときにチェックボックスをリセットする
+      menu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
+    }
+  }
+
+  // メニュー外をクリックしたら閉じる処理
+  document.addEventListener('click', function(e) {
+    if (!e.target.closest('.tool-dropdown-container')) {
+      document.querySelectorAll('.tool-dropdown-menu').forEach(m => m.style.display = 'none');
+    }
+  });
+
+  function insertCheckedTools(insertBtn) {
+    const menu = insertBtn.closest('.tool-dropdown-menu');
+    const checkboxes = menu.querySelectorAll('input[type="checkbox"]:checked');
+    const container = insertBtn.closest('.tool-dropdown-container');
+    const block = container.closest('.step-block');
+    const textarea = block.querySelector('.step-textarea');
+    
+    if (checkboxes.length > 0 && textarea) {
+      const selectedTools = Array.from(checkboxes).map(cb => cb.value);
+      const insertText = selectedTools.join('、') + 'を準備します。';
+      
+      if (textarea.value) {
+        textarea.value = textarea.value + '\n' + insertText;
+      } else {
+        textarea.value = insertText;
+      }
+      autoResizeTextarea(textarea);
+    }
+    
+    // メニューを閉じる
+    menu.style.display = 'none';
     adjustPreviewScale();
   }
 
[diff_block_end]

Please note that the above snippet only shows the MODIFIED lines from the last change. It shows up to 3 lines of unchanged lines before and after the modified lines. The actual file contents may have many more lines not shown.