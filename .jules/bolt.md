## 2025-05-04 - Scoped querySelector for Duplicate IDs

**Learning:** In multi-language sites using duplicate IDs in separate containers, `document.getElementById` always returns the first occurrence (often hidden). Renaming IDs breaks external deep links.

**Action:** Use `activeContainer.querySelector('#' + CSS.escape(targetId))` to efficiently select the correct element while maintaining O(1)-like performance and preserving URL fragment compatibility.
