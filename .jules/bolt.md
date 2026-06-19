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

## 2026-05-11 - Throttle Frequent Events like wheel

**Learning:** Unthrottled frequent events like `wheel` that cause DOM updates (e.g. style changes) can trigger layout thrashing and block the main thread. In `js/lightbox.js`, scaling the image based on mouse wheel generated hundreds of style updates per second.
**Action:** Always throttle frequent UI events (like `wheel`, `mousemove`, `resize`) using `requestAnimationFrame` when manipulating the DOM to ensure updates sync with the browser's display refresh rate (60fps) and do not queue redundant layout reflows.

## 2026-05-18 - Simplify Query Caching

**Learning:** Caching DOM queries like `document.querySelectorAll` inside a variable to avoid re-querying when the document state changes (like the language mode toggling) adds unnecessary complexity and state management bugs (e.g. invalidation errors). DOM querying by simple selectors like `.main-nav a` is extremely fast and provides no measurable benefit on occasional user interactions.
**Action:** Always favor readable, direct DOM queries (`querySelectorAll`, `getElementById`) over caching them unless querying in a high-frequency tight loop or scroll event.

## 2026-05-19 - Event Delegation for Multiple Elements

**Learning:** Attaching individual event listeners to multiple similar DOM elements (like images opening a lightbox) scales poorly. It increases memory overhead and slows down initialization time.
**Action:** Always favor event delegation for multiple similar elements. Attach a single listener to a common ancestor (like `document` or `document.body`) and check for the target element using `e.target.closest('selector')`.

## 2026-05-19 - Event Delegation for Multiple Elements

**Learning:** Attaching individual event listeners to multiple similar DOM elements (like images opening a lightbox, or navigation links) scales poorly. It increases memory overhead and slows down initialization time.
**Action:** Always favor event delegation for multiple similar elements. Attach a single listener to a common ancestor (like `document` or `document.body`) and check for the target element using `e.target.closest('selector')`.

## 2026-05-19 - Content Visibility Auto for Off-Screen Rendering Optimization

**Learning:** For single-page portfolios with many sections (like experience, projects, education, research, awards, and family), content far below the fold forces the browser to calculate layout and rendering for the entire page on initial load. This increases main thread work and delays interactivity.
**Action:** Use CSS `content-visibility: auto;` (along with `contain-intrinsic-size`) on major independent sections. This allows the browser to skip layout and painting for off-screen sections until the user scrolls near them, dramatically improving initial rendering performance.

## 2026-05-26 - Move Scripts to Head with Defer

**Learning:** Scripts placed at the end of the `<body>` delay their discovery and downloading until the HTML parser reaches the bottom of the document. This can delay interactivity and script execution, especially on larger pages or slower networks.
**Action:** Always load non-render-blocking scripts (like main application logic or UI interaction scripts) in the `<head>` using the `defer` attribute. This allows the browser to discover and download the script in parallel with HTML parsing, executing it only after the HTML is fully parsed, which improves the overall load performance and time to interactivity.

## 2026-05-27 - Lazy Initialize Interactive DOM Components

**Learning:** Creating complex DOM structures (like a lightbox overlay with controls) immediately upon script execution delays the main thread during the critical initial page load phase, even if those components are hidden and may never be used by the user.
**Action:** Use lazy initialization for interactive components that are not immediately visible. Wait to build and attach their DOM elements until the first time the user actually interacts with them (e.g., clicking an image to open the lightbox). This reduces initial DOM size and main thread blocking time.

## 2026-06-01 - Offload decoding of dynamically created images

**Learning:** When images are dynamically created in JavaScript, such as high-resolution images loaded into a lightbox component, synchronous decoding can block the main thread and cause UI jank (e.g., freezing the page temporarily while the image renders).
**Action:** Always add `img.decoding = 'async'` when creating an `img` element in JavaScript (`document.createElement('img')`) to instruct the browser to decode the image off the main thread, improving perceived performance and responsiveness.

## 2026-06-02 - Prevent Redundant Synchronous Storage Writes

**Learning:** Initializing theme state with blocking inline scripts (`<head>`) to prevent light flash is common, but duplicating that initialization logic in deferred main scripts causes redundant, synchronous DOM attribute updates and `localStorage` writes on every page load. `localStorage.setItem` is a slow synchronous API that blocks the main thread.
**Action:** When state is pre-initialized by a blocking script, deferred scripts should avoid redundant re-application of that state. Always add early returns in state application functions (e.g., `if (current === target) return;`) to prevent unnecessary DOM mutations and synchronous storage writes.

## 2026-06-03 - Prevent Unused IntersectionObserver Instantiation

**Learning:** Shared application scripts often execute functions indiscriminately on all pages. Creating expensive objects like `IntersectionObserver` when the target DOM elements (e.g. navigation menus) don't even exist on the current page wastes memory and initialization time.
**Action:** When writing code that interacts with the DOM in shared scripts, always use early returns (e.g. `if (elements.length === 0) return;`) before instantiating expensive objects or attaching heavy listeners.

## 2026-06-17 - GPU Acceleration for Image Zoom

**Learning:** Rapidly scaling high-resolution images via DOM transformations (like mouse wheel zoom) causes constant rasterization and layout recalculations on the main thread, resulting in janky animations and dropped frames.
**Action:** Use `will-change: transform` in CSS on elements undergoing high-frequency scale/translate changes to promote them to their own compositor layer, offloading the scaling work to the GPU for smooth 60fps performance. Use this technique sparingly to avoid excessive memory consumption.

## 2026-06-18 - Explicit Image Dimensions to prevent CLS

**Learning:** Browsers cannot reserve space for images during layout without knowing their dimensions, causing Cumulative Layout Shift (CLS) when the image finally loads and pushes content around.
**Action:** Always provide explicit `width` and `height` attributes on `<img>` tags (even if scaled with CSS) to ensure the browser can calculate the aspect ratio and reserve the correct space immediately during initial layout.
## 2026-06-19 - Optimize LCP with fetchpriority High
**Learning:** While <link rel="preload"> helps the parser discover critical hero images earlier, adding `fetchpriority="high"` explicitly instructs the browser to prioritize fetching these assets over other network requests, resulting in significantly faster Largest Contentful Paint (LCP) times.
**Action:** Always ensure that critical above-the-fold hero images and their corresponding preload links include the `fetchpriority="high"` attribute to maximize LCP performance.
