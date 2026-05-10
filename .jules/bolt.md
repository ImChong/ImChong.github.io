## 2026-05-04 - Static Site Scroll Event Optimization

**Learning:** Even simple static portfolios can suffer from scroll performance issues. The `updateActiveNav` function here was bound directly to the scroll event and ran costly DOM queries on every tick.
**Action:** Always throttle scroll events with `requestAnimationFrame` and cache DOM queries that don't change constantly. Invalidate the cache when application state (like language mode) updates.

## 2025-05-04 - Scoped querySelector for Duplicate IDs

**Learning:** In multi-language sites using duplicate IDs in separate containers, `document.getElementById` always returns the first occurrence (often hidden). Renaming IDs breaks external deep links.

**Action:** Use `activeContainer.querySelector('#' + CSS.escape(targetId))` to efficiently select the correct element while maintaining O(1)-like performance and preserving URL fragment compatibility.

## 2026-05-05 - IntersectionObserver prevents Layout Thrashing

**Learning:** Combining scroll events with `offsetTop` and class toggles can cause severe layout thrashing. When `classList.add('active')` modifies properties that affect dimensions (like `font-weight: 600`), the layout becomes dirty. The subsequent scroll tick reading `offsetTop` forces the browser to perform a synchronous recalculation, ruining performance.
**Action:** Replace `scroll` event listeners and `offsetTop` with `IntersectionObserver` to track element visibility. This shifts the tracking off the main thread and completely bypasses the dirty-layout synchronous reflow cycle.

## 2026-05-08 - Preload Critical Above-The-Fold Images

**Learning:** The browser's native parser doesn't immediately discover the profile image located deep inside the `<body>` element. This delays the loading of the main hero image, significantly penalizing the Largest Contentful Paint (LCP) performance metric, particularly on slower networks.
**Action:** Always add a `<link rel="preload" as="image" href="...">` tag to the `<head>` for critical above-the-fold hero images. This instructs the browser to prioritize fetching the resource early during page load before the main parser reaches the image tag.

## 2026-05-09 - Preload Additional Critical LCP Images

**Learning:** Just like the main hero profile image, individual sub-pages (e.g., marriage page, project pages) also have their own critical hero images. The main parser still doesn't prioritize them if they are deep in the `<body>` element. Furthermore, these hero images shouldn't have `loading="lazy"` since they are above the fold.
**Action:** Always verify that critical above-the-fold images across all pages lack `loading="lazy"` and are preloaded via `<link rel="preload" as="image" href="...">` in their respective `<head>` sections.

## 2026-05-10 - Prevent Unnecessary Video Preloading

**Learning:** By default, browsers may aggressively fetch metadata and buffer chunks of `<video>` elements, even if they are far below the fold. This can delay the window `load` event and waste significant bandwidth (e.g., fetching parts of a 2.2MB video before it's even seen).
**Action:** Always explicitly set `preload="none"` on `<video>` elements that are not critical for the initial paint or above the fold. This instructs the browser to defer fetching the video data until the user initiates playback or scrolls near the element.
