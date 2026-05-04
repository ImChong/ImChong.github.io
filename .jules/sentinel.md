## 2026-05-04 - Fix Reverse Tabnabbing Vulnerability

**Vulnerability:** Found multiple external links with `target="_blank"` missing the `rel="noopener noreferrer"` attribute. This exposes the site to Reverse Tabnabbing, where a newly opened tab can gain access to the original page's `window.opener` object and navigate it to a malicious site.
**Learning:** This is a common security oversight in pure HTML/JS sites without modern frameworks that might enforce or warn about it. The issue was widespread in `index.html` and `experience/pcv/proportional-control-valve.html`. Need to use multi-line regex when fixing HTML tags as attributes can span multiple lines.
**Prevention:** Ensure all `target="_blank"` links strictly include `rel="noopener noreferrer"`. Enforce through linter rules or automated checks during CI.
