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
