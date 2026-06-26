## 2026-05-04 - Fix Reverse Tabnabbing Vulnerability

**Vulnerability:** Found multiple external links with `target="_blank"` missing the `rel="noopener noreferrer"` attribute. This exposes the site to Reverse Tabnabbing, where a newly opened tab can gain access to the original page's `window.opener` object and navigate it to a malicious site.
**Learning:** This is a common security oversight in pure HTML/JS sites without modern frameworks that might enforce or warn about it. The issue was widespread in `index.html` and `experience/pcv/proportional-control-valve.html`. Need to use multi-line regex when fixing HTML tags as attributes can span multiple lines.
**Prevention:** Ensure all `target="_blank"` links strictly include `rel="noopener noreferrer"`. Enforce through linter rules or automated checks during CI.

## 2026-05-04 - Fix XSS Vulnerability via innerHTML

**Vulnerability:** Found multiple instances where `.innerHTML` was used to inject strings into the DOM in `js/main.js`, `experience/pcv/proportional-control-valve.html`, and `family/marriage.html`. This exposes the site to Cross-Site Scripting (XSS) vulnerabilities if any of the injected content is dynamic and unsanitized.
**Learning:** Even if the injected string is currently static, using `.innerHTML` is a bad practice as it can lead to XSS if the content is later made dynamic. Replacing it with `document.createElement`, `textContent`, and `appendChild` is safer. Also, when using `textContent`, HTML entities like `&copy;` and `&times;` need to be replaced with their literal characters (e.g., `©`, `×`) as `textContent` does not parse entities.
**Prevention:** Avoid using `.innerHTML`. Enforce the use of safe DOM APIs (`createElement`, `textContent`, `appendChild`) through linter rules (e.g., `no-inner-html` in ESLint or similar HTML validators) or automated checks during CI.

## 2026-05-04 - Enforce HTTPS via Content-Security-Policy

**Vulnerability:** The application was missing strict directives in its `Content-Security-Policy` to enforce secure connections and prevent mixed content on modern browsers. While it restricted sources, it did not explicitly instruct the browser to upgrade insecure HTTP requests to HTTPS, which leaves open the possibility of a downgrade attack if a user happens to request an insecure resource or follow an HTTP link.
**Learning:** For static sites with no backend, maximizing the strictness of the client-side `Content-Security-Policy` via `<meta>` tags is crucial. `upgrade-insecure-requests` is a highly effective way to prevent mixed content and force HTTPS connections where applicable, even when a user explicitly requests an HTTP resource. `block-all-mixed-content` serves as a fallback to ensure no insecure content is ever loaded.
**Prevention:** Always include `upgrade-insecure-requests; block-all-mixed-content;` in the `Content-Security-Policy` of all HTML files.

## 2026-05-04 - Enhance DOM XSS Protection via Trusted Types

**Vulnerability:** The application mitigated DOM XSS by replacing .innerHTML with safer APIs like .textContent and .createElement, but lacked browser-level enforcement.
**Learning:** Adding "require-trusted-types-for 'script';" to the Content-Security-Policy forces the browser to reject raw strings being passed to injection sinks (like innerHTML or eval). Since the codebase already adheres to safe DOM manipulation, this enhancement is a frictionless defense-in-depth measure.
**Prevention:** Include "require-trusted-types-for 'script';" in the Content-Security-Policy to enforce safe DOM API usage at the browser level.

## 2026-05-04 - Mitigate Clickjacking via JS Frame-busting

**Vulnerability:** The application was vulnerable to clickjacking. While the codebase attempts to mitigate this by setting the `frame-ancestors` directive in the CSP `<meta>` tags, browsers ignore the `frame-ancestors` directive when it is delivered via `<meta>` tags.
**Learning:** In pure static sites without backend or server configuration (like GitHub Pages where you can't easily configure HTTP headers), mitigating clickjacking requires a JS fallback since `<meta>` tag CSP isn't sufficient.
**Prevention:** Add a JS frame-busting snippet (e.g. `if (window.self !== window.top) { window.top.location = window.self.location; }`) in an early-loading script. Note that modern browsers and attackers using `sandbox="allow-scripts"` may bypass this basic implementation, but it serves as an initial defense-in-depth layer.

## 2026-06-06 - Strengthen CSP with worker-src and connect-src

**Vulnerability:** The application is a static site without backend architectures, which limits its exposure, but the Content-Security-Policy (CSP) was missing explicit limits on external connections (`connect-src`) and web workers (`worker-src`). In the event of a successful XSS attack, malicious scripts could spawn web workers or exfiltrate data to external servers via `fetch` or `XMLHttpRequest`.
**Learning:** Adding `connect-src 'self';` and `worker-src 'none';` to the CSP prevents scripts from connecting to third-party domains and blocks the creation of background web workers. This adds an important defense-in-depth layer against data exfiltration and crypto-mining payloads.
**Prevention:** Always scope down CSP directives as restrictively as possible. For static sites that do not use web workers or make external API calls, `worker-src 'none';` and `connect-src 'self';` should be standard practice.

## 2026-05-15 - Robust Clickjacking Mitigation Bypass

**Vulnerability:** The existing frame-busting script `window.top.location = window.self.location` could be bypassed if an attacker embedded the site in an iframe with `sandbox="allow-scripts"`, which blocks top-level navigation while still rendering the page.
**Learning:** On static sites where `frame-ancestors` CSP cannot be enforced via HTTP headers, simple frame-busting navigation is insufficient. The page must be explicitly hidden if the navigation is blocked.
**Prevention:** When using JavaScript frame-busting, always hide the `document.documentElement` (`style.display = 'none'`) inside the frame check to ensure the content remains invisible if the attacker suppresses the navigation attempt.
