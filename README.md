<p align="center">
  <img src="img/og-image.png" alt="PDF Dark Mode Converter" width="800">
</p>

# PDF Dark Mode Converter

> Originally created by [Chizkiyahu](https://github.com/Chizkiyahu/pdf-dark-mode-converter) · Made up to 10x faster and massively improved by [BrAtUkA](https://github.com/BrAtUkA)

**[Use it now →](https://bratuka.dev/pdf-dark-mode-converter/)**

Convert any PDF to dark mode instantly in your browser. No uploads, no server, no sign-up - fully offline and private.

## Features

- **Up to 10x faster** conversion using GPU-accelerated color transforms and concurrent page processing
- **16+ themes** - Classic, Slate, Claude Warm, ChatGPT Cool, Sepia, Midnight Blue, Forest Green, Solarized, Nord, Dracula, Gruvbox, Monokai, Tokyo Night, Rosé Pine, Cobalt, plus a custom color picker
- **Selectable text** - converted PDFs keep an invisible text layer so you can search, select, and copy
- **Image preservation** - detects photos and graphics and keeps their original colors
- **Batch conversion** - drop multiple PDFs at once
- **Dark and light output** - convert light-to-dark or dark-to-light
- **Adjustable resolution** (0.5x–4x) and **JPEG quality** (50–100%)
- **Invert PDF Colors** - separate tool at [`/invert-pdf-colors/`](https://bratuka.dev/pdf-dark-mode-converter/invert-pdf-colors/) for true RGB complement inversion
- **100% private** - everything runs client-side, nothing is uploaded

## Languages

Available in 10 languages: English, Spanish, French, German, Italian, Portuguese, Chinese, Korean, Japanese, and Russian.

## How to Use

1. Open the [PDF Dark Mode Converter](https://bratuka.dev/pdf-dark-mode-converter/).
2. Click **Choose PDF Files** or drag and drop one or more PDFs onto the page.
3. Pick a theme from the dropdown, or use the custom color picker.
4. Optionally adjust resolution, quality, and toggle selectable text or image preservation in **Settings**.
5. The converted PDF downloads automatically when done.

## Blog

14 guides covering dark mode on every platform:

- [Chrome](https://bratuka.dev/pdf-dark-mode-converter/blog/chrome-pdf-dark-mode/) · [Firefox](https://bratuka.dev/pdf-dark-mode-converter/blog/firefox-pdf-dark-mode/) · [Edge](https://bratuka.dev/pdf-dark-mode-converter/blog/pdf-dark-mode-microsoft-edge/) · [Windows](https://bratuka.dev/pdf-dark-mode-converter/blog/pdf-dark-mode-windows/)
- [iPhone](https://bratuka.dev/pdf-dark-mode-converter/blog/pdf-dark-mode-iphone/) · [iPad](https://bratuka.dev/pdf-dark-mode-converter/blog/pdf-dark-mode-ipad/) · [Android](https://bratuka.dev/pdf-dark-mode-converter/blog/pdf-dark-mode-android/)
- [Adobe Acrobat](https://bratuka.dev/pdf-dark-mode-converter/blog/adobe-acrobat-pdf-dark-mode/) · [Google Drive](https://bratuka.dev/pdf-dark-mode-converter/blog/pdf-dark-mode-google-drive/)
- [Dark Mode vs Invert](https://bratuka.dev/pdf-dark-mode-converter/blog/pdf-dark-mode-vs-invert-colors/) · [Invert PDF Colors](https://bratuka.dev/pdf-dark-mode-converter/blog/invert-pdf-colors/) · [Invert for Printing](https://bratuka.dev/pdf-dark-mode-converter/blog/invert-pdf-for-printing/)
- [Read PDFs at Night](https://bratuka.dev/pdf-dark-mode-converter/blog/read-pdf-at-night/) · [Convert Online](https://bratuka.dev/pdf-dark-mode-converter/blog/convert-pdf-to-dark-mode-online/)

## Technical Details

- Uses [pdf.js](https://mozilla.github.io/pdf.js/) for rendering and [pdf-lib](https://pdf-lib.js.org/) for PDF assembly
- GPU-accelerated via SVG `feColorMatrix` filter with automatic fallback for browsers that don't support canvas filters (e.g. Firefox)
- JPEG encoding for fast page processing
- Static site on GitHub Pages - no server-side code

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE) - free for personal use, commercial use is not permitted.

<br/>

<p align="center">
  <a href="https://github.com/BrAtUkA">
    <img src="https://raw.githubusercontent.com/BrAtUkA/BrAtUkA/main/imgs/logo-flat-white.png" alt="BrAtUkA" height="30"/>
  </a>
</p>
