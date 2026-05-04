## 2026-05-04 - Static Site Scroll Event Optimization

**Learning:** Even simple static portfolios can suffer from scroll performance issues. The `updateActiveNav` function here was bound directly to the scroll event and ran costly DOM queries on every tick.
**Action:** Always throttle scroll events with `requestAnimationFrame` and cache DOM queries that don't change constantly. In validate the cache when application state (like language mode) updates.
