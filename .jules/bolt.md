## 2026-05-04 - Static Site Scroll Event Optimization

**Learning:** Even simple static portfolios can suffer from scroll performance issues. The `updateActiveNav` function here was bound directly to the scroll event and ran costly DOM queries on every tick.
**Action:** Always throttle scroll events with `requestAnimationFrame` and cache DOM queries that don't change constantly. Invalidate the cache when application state (like language mode) updates.

## 2025-05-04 - Scoped querySelector for Duplicate IDs

**Learning:** In multi-language sites using duplicate IDs in separate containers, `document.getElementById` always returns the first occurrence (often hidden). Renaming IDs breaks external deep links.

**Action:** Use `activeContainer.querySelector('#' + CSS.escape(targetId))` to efficiently select the correct element while maintaining O(1)-like performance and preserving URL fragment compatibility.
