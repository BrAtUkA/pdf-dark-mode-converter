# Security Policy

## Project Architecture & Security Scope

**PDF Dark Mode Converter** is a fully client-side, browser-based tool. There is no server, no backend, no user accounts, and no data transmission of any kind. All PDF processing happens locally in your browser using the Web APIs.

This means the security surface is narrow but real:

- **Client-side PDF parsing** via `pdf.js` — malicious PDF files could exploit parser vulnerabilities
- **CDN dependency integrity** — third-party scripts loaded from cdnjs.cloudflare.com
- **DOM/XSS surface** — content rendered from parsed PDF metadata
- **Privacy guarantees** — your files never leave your device; any regression in this is a critical security issue

---

## Supported Versions

| Version | Status | Notes |
| ------- | ------ | ----- |
| **2.0.x** | ✅ Supported | Current release — security fixes applied here |
| 1.0.x | ❌ End of Life | No patches; upgrade to v2.0.x |

Only the latest release (`v2.0.0`) receives security updates. If you are on v1.0.x, upgrade immediately — no backports will be issued.

---

## Dependency Versions (CDN-loaded)

These are the third-party libraries currently in use. Vulnerabilities in them directly affect this tool:

| Library | Version | Source |
| ------- | ------- | ------ |
| `pdf.js` | 2.16.105 | cdnjs.cloudflare.com |
| `pdf-lib` | 1.11.0 | cdnjs.cloudflare.com |
| `jszip` | 3.10.1 | cdnjs.cloudflare.com |

If a CVE is published against any of these, open an issue or contact us directly — we will update the pinned version promptly.

---

## Reporting a Vulnerability

**Please do not open a public GitHub Issue for security vulnerabilities.** Doing so exposes users before a fix is available.

### Private Disclosure

Email us directly at **bratuka@bratuka.dev** with:

- A clear description of the vulnerability
- Steps to reproduce (include a minimal test PDF if relevant)
- Affected version(s)
- Your assessment of impact / severity
- Any suggested fix, if you have one

### Response Timeline

| Stage | Target |
| ----- | ------ |
| Acknowledgement | Within **48 hours** |
| Triage & severity assessment | Within **5 business days** |
| Fix / mitigation published | Within **14 days** for critical; **30 days** for moderate/low |
| Public disclosure (coordinated) | After fix is live |

We will keep you updated throughout. If you don't hear back within 48 hours, follow up — emails can get lost.

---

## Threat Model

Given the client-side-only architecture, here is what we consider in-scope vs. out-of-scope:

### In-Scope

- **Malicious PDF exploitation** — a crafted PDF that causes unintended code execution or exfiltrates data via the rendering pipeline
- **XSS via PDF metadata** — PDF titles, author fields, or annotations rendered unsanitized into the DOM
- **Privacy regression** — any code path that causes file content or names to be uploaded, logged, or transmitted
- **Dependency vulnerability** — known CVE in pdf.js, pdf-lib, or jszip that affects this use case
- **CDN SRI bypass** — loading scripts without Subresource Integrity checks, enabling CDN-based supply chain attacks

### Out-of-Scope

- Vulnerabilities in the user's browser itself (report to the browser vendor)
- PDF files that crash the browser tab (browser memory limits — not exploitable)
- Social engineering or phishing using the tool's UI
- Security issues in GitHub Pages infrastructure (report to GitHub)
- Theoretical attacks requiring physical access to the user's device

---

## Privacy as a Security Property

The core promise of this tool is **zero data egress**. Any code change that causes PDF content, file names, or user preferences to be sent to any external server — even our own — is treated as a **critical security vulnerability**, not a feature regression.

If you discover network requests being made during conversion that shouldn't be there, report it immediately.

---

## Acknowledgements

We appreciate responsible disclosure. Reporters who follow this policy will be credited in the release notes for the fix (unless they prefer anonymity).

---

## Contact

- **Security email:** bratuka@bratuka.dev
- **GitHub:** [BrAtUkA/pdf-dark-mode-converter](https://github.com/BrAtUkA/pdf-dark-mode-converter)
- **Contact page:** https://bratuka.dev/pdf-dark-mode-converter/contact/
