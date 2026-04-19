// PDF Dark Mode Converter - Core Engine
// Shared between main converter and invert-pdf-colors pages.
(function() {
    'use strict';

    let modifiedPdfBytes;
    let originalPdfData = null;
    let originalFileName = "";
    let currentRenderId = 0;

    const themes = {
        classic: { r: 0, g: 0, b: 0, name: 'Classic Inversion' },
        slate: { r: 40, g: 42, b: 46, name: 'Slate' },
        claude: { r: 42, g: 37, b: 34, name: 'Claude Warm' },
        chatgpt: { r: 52, g: 53, b: 65, name: 'ChatGPT Cool' },
        sepia: { r: 40, g: 35, b: 25, name: 'Sepia Dark' },
        midnight: { r: 25, g: 30, b: 45, name: 'Midnight Blue' },
        forest: { r: 25, g: 35, b: 30, name: 'Forest Green' },
        solarized: { r: 0, g: 43, b: 54, name: 'Solarized' },
        nord: { r: 46, g: 52, b: 64, name: 'Nord' },
        dracula: { r: 40, g: 42, b: 54, name: 'Dracula' },
        gruvbox: { r: 40, g: 40, b: 40, name: 'Gruvbox' },
        monokai: { r: 39, g: 40, b: 34, name: 'Monokai' },
        tokyonight: { r: 26, g: 27, b: 38, name: 'Tokyo Night' },
        rosepine: { r: 35, g: 33, b: 54, name: 'Rosé Pine' },
        cobalt: { r: 0, g: 28, b: 53, name: 'Cobalt' },
        negative: { r: 0, g: 0, b: 0, name: 'Invert (Negative)', mode: 'negative' },
        custom: { r: 30, g: 30, b: 30, name: 'Custom', lightMode: false }
    };

    const pdfJsSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
    const pdfWorkerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
    const pdfLibSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.11.0/pdf-lib.min.js";
    let pdfLibReadyPromise = null;

    // GPU-accelerated canvas filter support detection
    // Naive `'filter' in ctx` is insufficient: Firefox exposes the property
    // but silently fails when using `url(#id)` SVG filter references on canvas
    // (especially when the SVG is hidden with display:none).
    // We test against the ACTUAL #darkModeFilter in the page - same element,
    // same display:none parent, identical conditions to production usage.
    // Both initial matrices (dark-mode & invert) map white→black, so if the
    // pixel stays white the filter wasn't applied and we must use the JS path.
    const supportsCanvasFilter = (() => {
        try {
            const ctx = document.createElement('canvas').getContext('2d');
            if (!('filter' in ctx)) return false;
            if (!document.getElementById('darkModeFilter')) return false;

            // Draw a white pixel on a source canvas
            const c1 = document.createElement('canvas');
            c1.width = c1.height = 1;
            const ctx1 = c1.getContext('2d');
            ctx1.fillStyle = '#fff';
            ctx1.fillRect(0, 0, 1, 1);

            // Draw it onto a second canvas through the page's actual SVG filter
            const c2 = document.createElement('canvas');
            c2.width = c2.height = 1;
            const ctx2 = c2.getContext('2d');
            ctx2.filter = 'url(#darkModeFilter)';
            ctx2.drawImage(c1, 0, 0);

            // Both initial filter matrices map white to black (R≈0)
            const p = ctx2.getImageData(0, 0, 1, 1).data;
            return p[0] < 5 && p[1] < 5 && p[2] < 5;
        } catch (e) { return false; }
    })();

    // --- Theme resolution ---
    function getCurrentThemeKey() {
        const sel = document.getElementById('themeSelector');
        if (sel) return sel.value;
        return document.body.dataset.theme || 'classic';
    }

    function getCurrentTheme() {
        return themes[getCurrentThemeKey()] || themes.classic;
    }

    // --- PDF library loading ---
    function loadPdfLibraries() {
        if (pdfLibReadyPromise) return pdfLibReadyPromise;
        pdfLibReadyPromise = new Promise((resolve, reject) => {
            const pdfJsScript = document.createElement('script');
            pdfJsScript.src = pdfJsSrc;
            pdfJsScript.crossOrigin = 'anonymous';
            pdfJsScript.referrerPolicy = 'no-referrer';
            pdfJsScript.onload = () => {
                pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
                const pdfLibScript = document.createElement('script');
                pdfLibScript.src = pdfLibSrc;
                pdfLibScript.crossOrigin = 'anonymous';
                pdfLibScript.referrerPolicy = 'no-referrer';
                pdfLibScript.onload = () => resolve();
                pdfLibScript.onerror = reject;
                document.head.appendChild(pdfLibScript);
            };
            pdfJsScript.onerror = reject;
            document.head.appendChild(pdfJsScript);
        });
        return pdfLibReadyPromise;
    }

    async function ensurePdfLibraries() {
        try {
            await loadPdfLibraries();
        } catch (e) {
            alert("Unable to load PDF libraries. Please check your connection and try again.");
            throw e;
        }
    }

    // --- Theme background & UI tinting ---
    function applyThemeBackground(theme) {
        const bg = `rgb(${theme.r}, ${theme.g}, ${theme.b})`;
        document.body.style.backgroundColor = bg;
        document.documentElement.style.backgroundColor = bg;
        document.documentElement.style.setProperty('--carousel-fade', bg);

        const luminance = 0.299 * theme.r + 0.587 * theme.g + 0.114 * theme.b;
        const isLight = luminance > 150;
        document.body.classList.toggle('light-mode', isLight);

        const notice = document.querySelector('.notice');
        const icon = document.querySelector('.notice-icon');
        if (notice) {
            if (isLight) {
                const factor = Math.max(0.3, 0.6 - (luminance - 150) * 0.003);
                const tintR = Math.round(theme.r * factor);
                const tintG = Math.round(theme.g * factor);
                const tintB = Math.round(theme.b * factor);
                notice.style.borderColor = `rgba(${tintR}, ${tintG}, ${tintB}, 0.35)`;
                notice.style.background = `rgba(${tintR}, ${tintG}, ${tintB}, 0.08)`;
                if (icon) icon.style.color = `rgba(${tintR}, ${tintG}, ${tintB}, 0.7)`;
            } else {
                const tintR = Math.min(theme.r + 80, 255);
                const tintG = Math.min(theme.g + 80, 255);
                const tintB = Math.min(theme.b + 80, 255);
                notice.style.borderColor = `rgba(${tintR}, ${tintG}, ${tintB}, 0.25)`;
                notice.style.background = `rgba(${tintR}, ${tintG}, ${tintB}, 0.07)`;
                if (icon) icon.style.color = `rgba(${tintR}, ${tintG}, ${tintB}, 0.7)`;
            }
        }

        // Tint buttons
        if (isLight) {
            const factor = Math.max(0.25, 0.55 - (luminance - 150) * 0.003);
            const btnR = Math.round(theme.r * factor);
            const btnG = Math.round(theme.g * factor);
            const btnB = Math.round(theme.b * factor);
            document.documentElement.style.setProperty('--btn-bg', `rgb(${btnR}, ${btnG}, ${btnB})`);
        } else {
            const btnR = Math.min(theme.r + 60, 255);
            const btnG = Math.min(theme.g + 60, 255);
            const btnB = Math.min(theme.b + 60, 255);
            document.documentElement.style.setProperty('--btn-bg', `rgb(${btnR}, ${btnG}, ${btnB})`);
        }

        // Tint carousel arrows (CSS vars - harmless if no carousel on page)
        const root = document.documentElement;
        if (isLight) {
            const cf = Math.max(0.3, 0.6 - (luminance - 150) * 0.003);
            const cR = Math.round(theme.r * cf), cG = Math.round(theme.g * cf), cB = Math.round(theme.b * cf);
            root.style.setProperty('--carousel-btn-bg', `rgb(${cR}, ${cG}, ${cB})`);
            root.style.setProperty('--carousel-btn-bg-hover', `rgb(${Math.max(cR-20,0)}, ${Math.max(cG-20,0)}, ${Math.max(cB-20,0)})`);
            root.style.setProperty('--carousel-btn-border', `rgba(${cR}, ${cG}, ${cB}, 0.25)`);
            root.style.setProperty('--carousel-btn-color', `rgba(255,255,255,0.85)`);
            root.style.setProperty('--carousel-btn-color-hover', `#fff`);
            root.style.setProperty('--carousel-btn-shadow', `0 2px 8px rgba(${cR}, ${cG}, ${cB}, 0.25)`);
            root.style.setProperty('--carousel-btn-shadow-hover', `0 3px 12px rgba(${cR}, ${cG}, ${cB}, 0.35)`);
        } else {
            const cR = Math.min(theme.r + 30, 255), cG = Math.min(theme.g + 30, 255), cB = Math.min(theme.b + 30, 255);
            const hR = Math.min(theme.r + 50, 255), hG = Math.min(theme.g + 50, 255), hB = Math.min(theme.b + 50, 255);
            const iR = Math.min(theme.r + 80, 255), iG = Math.min(theme.g + 80, 255), iB = Math.min(theme.b + 80, 255);
            root.style.setProperty('--carousel-btn-bg', `rgb(${cR}, ${cG}, ${cB})`);
            root.style.setProperty('--carousel-btn-bg-hover', `rgb(${hR}, ${hG}, ${hB})`);
            root.style.setProperty('--carousel-btn-border', `rgb(${hR}, ${hG}, ${hB})`);
            root.style.setProperty('--carousel-btn-color', `rgb(${iR}, ${iG}, ${iB})`);
            root.style.setProperty('--carousel-btn-color-hover', `#fff`);
            root.style.setProperty('--carousel-btn-shadow', `0 2px 8px rgba(0,0,0,0.35)`);
            root.style.setProperty('--carousel-btn-shadow-hover', `0 3px 12px rgba(0,0,0,0.45)`);
        }

        // Tint tooltips
        if (isLight) {
            const tf = Math.max(0.3, 0.6 - (luminance - 150) * 0.003);
            const ttR = Math.round(theme.r * tf), ttG = Math.round(theme.g * tf), ttB = Math.round(theme.b * tf);
            const ttBgR = Math.min(Math.round(theme.r + (255 - theme.r) * 0.7), 255);
            const ttBgG = Math.min(Math.round(theme.g + (255 - theme.g) * 0.7), 255);
            const ttBgB = Math.min(Math.round(theme.b + (255 - theme.b) * 0.7), 255);
            root.style.setProperty('--tooltip-bg', `rgb(${ttBgR}, ${ttBgG}, ${ttBgB})`);
            root.style.setProperty('--tooltip-color', `rgb(${ttR}, ${ttG}, ${ttB})`);
            root.style.setProperty('--tooltip-border', `rgba(${ttR}, ${ttG}, ${ttB}, 0.15)`);
            root.style.setProperty('--tooltip-shadow', `0 4px 16px rgba(${ttR}, ${ttG}, ${ttB}, 0.12)`);
        } else {
            const ttR = Math.min(theme.r + 35, 255), ttG = Math.min(theme.g + 35, 255), ttB = Math.min(theme.b + 35, 255);
            const ttcR = Math.min(theme.r + 140, 255), ttcG = Math.min(theme.g + 140, 255), ttcB = Math.min(theme.b + 140, 255);
            root.style.setProperty('--tooltip-bg', `rgb(${ttR}, ${ttG}, ${ttB})`);
            root.style.setProperty('--tooltip-color', `rgb(${ttcR}, ${ttcG}, ${ttcB})`);
            root.style.setProperty('--tooltip-border', `rgba(${ttcR}, ${ttcG}, ${ttcB}, 0.12)`);
            root.style.setProperty('--tooltip-shadow', `0 4px 16px rgba(0, 0, 0, 0.4)`);
        }

        // Tint progress bar
        if (isLight) {
            const factor = Math.max(0.2, 0.45 - (luminance - 150) * 0.003);
            const barR = Math.round(theme.r * factor);
            const barG = Math.round(theme.g * factor);
            const barB = Math.round(theme.b * factor);
            document.documentElement.style.setProperty('--bar-color', `rgb(${barR}, ${barG}, ${barB})`);
        } else {
            const barR = Math.min(theme.r + 140, 255);
            const barG = Math.min(theme.g + 140, 255);
            const barB = Math.min(theme.b + 140, 255);
            document.documentElement.style.setProperty('--bar-color', `rgb(${barR}, ${barG}, ${barB})`);
        }

        // Tint toolbar glass
        if (isLight) {
            // Drop zone tinting
            const df = Math.max(0.3, 0.6 - (luminance - 150) * 0.003);
            const dR = Math.round(theme.r * df), dG = Math.round(theme.g * df), dB = Math.round(theme.b * df);
            root.style.setProperty('--drop-border', `rgba(${dR}, ${dG}, ${dB}, 0.25)`);
            root.style.setProperty('--drop-text', `rgba(${dR}, ${dG}, ${dB}, 0.45)`);
            root.style.setProperty('--drop-active-border', `rgb(${dR}, ${dG}, ${dB})`);
            root.style.setProperty('--drop-active-bg', `rgba(${dR}, ${dG}, ${dB}, 0.06)`);
            root.style.setProperty('--drop-active-text', `rgb(${dR}, ${dG}, ${dB})`);

            const tf = Math.max(0.3, 0.55 - (luminance - 150) * 0.003);
            const tbR = Math.round(theme.r + (255 - theme.r) * 0.6);
            const tbG = Math.round(theme.g + (255 - theme.g) * 0.6);
            const tbB = Math.round(theme.b + (255 - theme.b) * 0.6);
            root.style.setProperty('--toolbar-bg', `rgba(${tbR}, ${tbG}, ${tbB}, 0.7)`);
            root.style.setProperty('--toolbar-border', `rgba(0, 0, 0, 0.08)`);
            root.style.setProperty('--toolbar-text', `rgba(0, 0, 0, 0.35)`);
            root.style.setProperty('--toolbar-text-hover', `rgba(0, 0, 0, 0.7)`);
            root.style.setProperty('--toolbar-text-active', `rgba(0, 0, 0, 0.82)`);
            root.style.setProperty('--toolbar-text-disabled', `rgba(0, 0, 0, 0.15)`);
            root.style.setProperty('--toolbar-sep', `rgba(0, 0, 0, 0.1)`);
        } else {
            // Drop zone tinting
            const dR = Math.min(theme.r + 100, 255), dG = Math.min(theme.g + 100, 255), dB = Math.min(theme.b + 100, 255);
            root.style.setProperty('--drop-border', `rgba(${dR}, ${dG}, ${dB}, 0.18)`);
            root.style.setProperty('--drop-text', `rgba(${dR}, ${dG}, ${dB}, 0.35)`);
            root.style.setProperty('--drop-active-border', `rgba(${dR}, ${dG}, ${dB}, 0.6)`);
            root.style.setProperty('--drop-active-bg', `rgba(${dR}, ${dG}, ${dB}, 0.06)`);
            root.style.setProperty('--drop-active-text', `rgb(${dR}, ${dG}, ${dB})`);

            const tbR = Math.round(theme.r * 0.7);
            const tbG = Math.round(theme.g * 0.7);
            const tbB = Math.round(theme.b * 0.7);
            root.style.setProperty('--toolbar-bg', `rgba(${tbR}, ${tbG}, ${tbB}, 0.55)`);
            root.style.setProperty('--toolbar-border', `rgba(255, 255, 255, 0.06)`);
            root.style.setProperty('--toolbar-text', `rgba(255, 255, 255, 0.38)`);
            root.style.setProperty('--toolbar-text-hover', `rgba(255, 255, 255, 0.7)`);
            root.style.setProperty('--toolbar-text-active', `rgba(255, 255, 255, 0.85)`);
            root.style.setProperty('--toolbar-text-disabled', `rgba(255, 255, 255, 0.18)`);
            root.style.setProperty('--toolbar-sep', `rgba(255, 255, 255, 0.12)`);
        }

        // Tint PDF container, scrollbar, pill, more-pages label
        if (isLight) {
            const pcR = Math.max(theme.r - 15, 0), pcG = Math.max(theme.g - 15, 0), pcB = Math.max(theme.b - 15, 0);
            root.style.setProperty('--pdf-container-bg', `rgb(${pcR}, ${pcG}, ${pcB})`);
            root.style.setProperty('--scrollbar-thumb', `rgba(0,0,0,0.15)`);
            root.style.setProperty('--scrollbar-hover', `rgba(0,0,0,0.28)`);
            root.style.setProperty('--pill-bg', `rgba(255,255,255,0.85)`);
            root.style.setProperty('--pill-color', `rgba(0,0,0,0.6)`);
            root.style.setProperty('--pill-border', `rgba(0,0,0,0.1)`);
            root.style.setProperty('--more-pages-color', `rgba(0,0,0,0.35)`);
            root.style.setProperty('--pdf-container-border', `rgba(0,0,0,0.08)`);
        } else {
            const pcR = Math.min(theme.r + 14, 255), pcG = Math.min(theme.g + 14, 255), pcB = Math.min(theme.b + 14, 255);
            root.style.setProperty('--pdf-container-bg', `rgb(${pcR}, ${pcG}, ${pcB})`);
            root.style.setProperty('--scrollbar-thumb', `rgba(255,255,255,0.12)`);
            root.style.setProperty('--scrollbar-hover', `rgba(255,255,255,0.22)`);
            root.style.setProperty('--pill-bg', `rgba(${pcR}, ${pcG}, ${pcB}, 0.85)`);
            root.style.setProperty('--pill-color', `rgba(255,255,255,0.65)`);
            root.style.setProperty('--pill-border', `rgba(255,255,255,0.1)`);
            root.style.setProperty('--more-pages-color', `rgba(255,255,255,0.3)`);
            root.style.setProperty('--pdf-container-border', `rgba(255,255,255,0.08)`);
        }
    }

    // --- SVG filter for GPU-accelerated color transform ---
    function updateSvgFilter(theme) {
        let values;
        if (theme.mode === 'negative') {
            values = [
                -1, 0, 0, 0, 1,
                0, -1, 0, 0, 1,
                0, 0, -1, 0, 1,
                0, 0, 0, 1, 0
            ].join(' ');
            document.getElementById('darkModeMatrix').setAttribute('values', values);
            return;
        }
        const bR = theme.r / 255;
        const bG = theme.g / 255;
        const bB = theme.b / 255;
        if (theme.lightMode) {
            values = [
                bR * 0.299, bR * 0.587, bR * 0.114, 0, 0,
                bG * 0.299, bG * 0.587, bG * 0.114, 0, 0,
                bB * 0.299, bB * 0.587, bB * 0.114, 0, 0,
                0, 0, 0, 1, 0
            ].join(' ');
        } else {
            values = [
                -(1 - bR) * 0.299, -(1 - bR) * 0.587, -(1 - bR) * 0.114, 0, 1,
                -(1 - bG) * 0.299, -(1 - bG) * 0.587, -(1 - bG) * 0.114, 0, 1,
                -(1 - bB) * 0.299, -(1 - bB) * 0.587, -(1 - bB) * 0.114, 0, 1,
                0, 0, 0, 1, 0
            ].join(' ');
        }
        document.getElementById('darkModeMatrix').setAttribute('values', values);
    }

    // --- Color transform: GPU path via SVG filter, JS pixel fallback ---
    function applyDarkMode(sourceCanvas, theme) {
        if (theme.mode === 'negative' && !supportsCanvasFilter) {
            const ctx = sourceCanvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
            const data = imageData.data;
            for (let j = 0; j < data.length; j += 4) {
                data[j]     = 255 - data[j];
                data[j + 1] = 255 - data[j + 1];
                data[j + 2] = 255 - data[j + 2];
            }
            ctx.putImageData(imageData, 0, 0);
            return sourceCanvas;
        }
        if (supportsCanvasFilter) {
            const canvas = document.createElement('canvas');
            canvas.width = sourceCanvas.width;
            canvas.height = sourceCanvas.height;
            const ctx = canvas.getContext('2d');
            ctx.filter = 'url(#darkModeFilter)';
            ctx.drawImage(sourceCanvas, 0, 0);
            return canvas;
        }
        const ctx = sourceCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const data = imageData.data;
        const bgR = theme.r, bgG = theme.g, bgB = theme.b;
        if (theme.lightMode) {
            for (let j = 0; j < data.length; j += 4) {
                const brightness = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
                const factor = brightness / 255;
                data[j]     = bgR * factor;
                data[j + 1] = bgG * factor;
                data[j + 2] = bgB * factor;
            }
        } else {
            for (let j = 0; j < data.length; j += 4) {
                const brightness = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
                const factor = 1 - brightness / 255;
                data[j]     = bgR + (255 - bgR) * factor;
                data[j + 1] = bgG + (255 - bgG) * factor;
                data[j + 2] = bgB + (255 - bgB) * factor;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return sourceCanvas;
    }

    // --- Image detection for smart image preservation ---
    function getImageRects(page, viewport) {
        return page.getOperatorList().then(opList => {
            const OPS = pdfjsLib.OPS;
            const rects = [];
            const ctmStack = [];
            let ctm = [1, 0, 0, 1, 0, 0];
            const vt = viewport.transform;
            const pageArea = viewport.width * viewport.height;

            function mul(a, b) {
                return [
                    a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1],
                    a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3],
                    a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]
                ];
            }

            for (let i = 0; i < opList.fnArray.length; i++) {
                const fn = opList.fnArray[i];
                const args = opList.argsArray[i];
                if (fn === OPS.save) {
                    ctmStack.push(ctm.slice());
                } else if (fn === OPS.restore) {
                    ctm = ctmStack.pop() || [1, 0, 0, 1, 0, 0];
                } else if (fn === OPS.transform) {
                    ctm = mul(ctm, args);
                } else if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject || fn === OPS.paintInlineImageXObject) {
                    const ft = mul(vt, ctm);
                    const corners = [[0,0],[1,0],[0,1],[1,1]].map(c => [
                        ft[0]*c[0]+ft[2]*c[1]+ft[4], ft[1]*c[0]+ft[3]*c[1]+ft[5]
                    ]);
                    const xs = corners.map(c => c[0]), ys = corners.map(c => c[1]);
                    const x = Math.floor(Math.min(...xs));
                    const y = Math.floor(Math.min(...ys));
                    const w = Math.ceil(Math.max(...xs)) - x;
                    const h = Math.ceil(Math.max(...ys)) - y;
                    const area = w * h;
                    if (area > 10000) {
                        rects.push({ x, y, w, h });
                    }
                }
            }
            return rects;
        });
    }

    // --- Text layer scaling ---
    function scaleTextLayer(layer, img) {
        const cw = parseFloat(layer.dataset.canvasWidth);
        if (cw && img.clientWidth) {
            layer.style.transform = `scale(${img.clientWidth / cw})`;
        }
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            document.querySelectorAll('.preview-text-layer').forEach(layer => {
                const img = layer.parentElement.querySelector('img');
                if (img) scaleTextLayer(layer, img);
            });
        }, 100);
    });

    // --- Process a single page ---
    async function processPage(pdf, pageNum, theme, scale, jpegQuality) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Smart image preservation
        const imageToggle = document.getElementById('imageToggle');
        const smartImages = imageToggle ? imageToggle.checked : true;
        const savedRegions = [];
        if (smartImages) {
            try {
                const imageRects = await getImageRects(page, viewport);
                for (const rect of imageRects) {
                    const rx = Math.max(0, rect.x);
                    const ry = Math.max(0, rect.y);
                    const rw = Math.min(rect.w, canvas.width - rx);
                    const rh = Math.min(rect.h, canvas.height - ry);
                    if (rw > 0 && rh > 0) {
                        savedRegions.push({ x: rx, y: ry, data: ctx.getImageData(rx, ry, rw, rh) });
                    }
                }
            } catch (e) { /* Fall back to no image preservation */ }
        }

        const resultCanvas = applyDarkMode(canvas, theme);

        if (savedRegions.length > 0) {
            const rCtx = resultCanvas.getContext('2d');
            for (const region of savedRegions) {
                rCtx.putImageData(region.data, region.x, region.y);
            }
        }

        // Extract text content for sandwich PDF
        let textItems = [];
        const textToggle = document.getElementById('textToggle');
        if (textToggle ? textToggle.checked : true) {
            try {
                const textContent = await page.getTextContent();
                textItems = textContent.items
                    .filter(item => item.str && item.str.trim())
                    .map(item => ({
                        str: item.str,
                        x: item.transform[4] * scale,
                        y: item.transform[5] * scale,
                        fontSize: Math.abs(item.transform[0]) * scale,
                        width: item.width * scale
                    }));
            } catch (e) { /* Skip text extraction on error */ }
        }

        const blob = await new Promise(resolve =>
            resultCanvas.toBlob(resolve, 'image/jpeg', jpegQuality / 100)
        );
        const bytes = new Uint8Array(await blob.arrayBuffer());

        page.cleanup();
        canvas.width = 1; canvas.height = 1;
        if (resultCanvas !== canvas) {
            resultCanvas.width = 1; resultCanvas.height = 1;
        }

        return { bytes, width: viewport.width, height: viewport.height, textItems };
    }

    // --- UI Setup ---
    const resolutionSlider = document.getElementById('resolutionSlider');
    const resolutionValue = document.getElementById('resolutionValue');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');

    // --- Persistent settings ---
    const SETTINGS_KEY = 'pdfDM_settings';
    function saveSettings() {
        try {
            const s = {
                theme: themeSelector ? themeSelector.value : undefined,
                resolution: resolutionSlider.value,
                quality: qualitySlider.value,
                text: document.getElementById('textToggle').checked,
                images: document.getElementById('imageToggle').checked
            };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
        } catch (e) { /* storage full or blocked */ }
    }
    function loadSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (!raw) return;
            const s = JSON.parse(raw);
            if (s.theme && themeSelector && themes[s.theme]) themeSelector.value = s.theme;
            if (s.resolution != null) { resolutionSlider.value = s.resolution; resolutionValue.textContent = s.resolution + 'x'; }
            if (s.quality != null) { qualitySlider.value = s.quality; qualityValue.textContent = s.quality + '%'; }
            if (s.text != null) document.getElementById('textToggle').checked = s.text;
            if (s.images != null) document.getElementById('imageToggle').checked = s.images;
        } catch (e) { /* corrupt or blocked */ }
    }

    resolutionSlider.addEventListener('input', () => {
        resolutionValue.textContent = resolutionSlider.value + 'x';
    });
    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = qualitySlider.value + '%';
    });

    function onSettingsChange() {
        saveSettings();
        if (originalPdfData) {
            currentRenderId++;
            ensurePdfLibraries().then(() => {
                document.getElementById('dropZone').classList.add('processing');
                document.getElementById('progressContainer').classList.add('visible');
                document.getElementById('downloadBtn').style.display = 'none';
                renderPDF(originalPdfData).catch(err => {
                    console.error('Render failed:', err);
                    document.getElementById('progressText').innerText = 'Error processing PDF';
                    document.getElementById('cancelBtn').style.display = 'none';
                });
            });
        }
    }
    resolutionSlider.addEventListener('change', onSettingsChange);
    qualitySlider.addEventListener('change', onSettingsChange);
    document.getElementById('textToggle').addEventListener('change', onSettingsChange);
    document.getElementById('imageToggle').addEventListener('change', onSettingsChange);

    // Settings panel toggle
    document.getElementById('settingsBtn').addEventListener('click', function() {
        document.getElementById('settingsToggle').classList.toggle('open');
    });

    // converter-stage is baked into HTML (wraps tips + dropZone + progressContainer)

    // Preserve Images tips - two-way: one for ON, one for OFF
    const scannedTipEl = document.getElementById('scannedTip');
    const scannedTipLink = document.getElementById('scannedTipLink');
    const imagesTipEl = document.getElementById('imagesTip');
    const imagesTipLink = document.getElementById('imagesTipLink');
    function updatePreserveImagesTips() {
        const imageToggle = document.getElementById('imageToggle');
        const hasFile = !!originalPdfData;
        const preserveOn = imageToggle ? imageToggle.checked : true;
        if (scannedTipEl) scannedTipEl.classList.toggle('visible', hasFile && preserveOn);
        if (imagesTipEl) imagesTipEl.classList.toggle('visible', hasFile && !preserveOn);
    }
    function highlightAndToggleImages(turnOn) {
        const imageToggle = document.getElementById('imageToggle');
        const settingsLabel = document.querySelector('.settings-label');
        if (settingsLabel) settingsLabel.classList.add('highlight');
        if (imageToggle) {
            setTimeout(function() {
                imageToggle.checked = turnOn;
                imageToggle.dispatchEvent(new Event('change'));
            }, 600);
            setTimeout(function() {
                if (settingsLabel) settingsLabel.classList.remove('highlight');
            }, 1200);
        }
    }
    if (scannedTipLink) {
        scannedTipLink.addEventListener('click', function(e) {
            e.preventDefault();
            this.blur();
            highlightAndToggleImages(false);
        });
    }
    if (imagesTipLink) {
        imagesTipLink.addEventListener('click', function(e) {
            e.preventDefault();
            this.blur();
            highlightAndToggleImages(true);
        });
    }
    document.getElementById('imageToggle').addEventListener('change', updatePreserveImagesTips);

    // Apply URL theme param to selector (if present) before initial background
    const themeSelector = document.getElementById('themeSelector');

    // Restore saved settings (before URL overrides and theme application)
    loadSettings();

    // URL theme param overrides saved theme
    if (themeSelector) {
        const params = new URLSearchParams(window.location.search);
        const urlTheme = params.get('theme');
        if (urlTheme && themes[urlTheme]) {
            themeSelector.value = urlTheme;
        }
    }

    // Apply initial theme background
    applyThemeBackground(getCurrentTheme());

    // --- File handling ---
    function getOutputName(baseName) {
        const themeKey = getCurrentThemeKey();
        const theme = themes[themeKey];
        let themeName, modeSuffix;
        if (theme.mode === 'negative') {
            themeName = 'negative';
            modeSuffix = 'inverted';
        } else {
            themeName = theme.name.toLowerCase().replace(/\s+/g, '_');
            modeSuffix = theme.lightMode ? 'light' : 'dark';
        }
        return `${baseName}_${themeName}_${modeSuffix}.pdf`;
    }

    function validateFiles(files) {
        const errorEl = document.getElementById('dropZoneError');
        const valid = [];
        const rejected = [];
        for (const f of files) {
            if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
                valid.push(f);
            } else {
                rejected.push(f.name);
            }
        }
        if (rejected.length > 0) {
            errorEl.textContent = rejected.length === 1
                ? `"${rejected[0]}" is not a PDF. Only PDF files are supported.`
                : `${rejected.length} file${rejected.length > 1 ? 's' : ''} rejected (not PDF). Only PDF files are supported.`;
            errorEl.classList.add('visible');
            setTimeout(() => errorEl.classList.remove('visible'), 5000);
        } else {
            errorEl.classList.remove('visible');
        }
        return valid;
    }

    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(new Uint8Array(fr.result));
            fr.onerror = reject;
            fr.readAsArrayBuffer(file);
        });
    }

    async function handleFiles(files) {
        const valid = validateFiles(Array.from(files));
        if (valid.length === 0) return;

        // Show progress + hide dropZone synchronously (within 500ms input window → excluded from CLS)
        document.getElementById('dropZone').classList.add('processing');
        document.getElementById('progressContainer').classList.add('visible');
        document.getElementById('downloadBtn').style.display = 'none';
        updatePreserveImagesTips();

        if (valid.length === 1) {
            handleSingleFile(valid[0]);
        } else {
            await handleBatch(valid);
        }
    }

    async function handleSingleFile(file) {
        originalFileName = file.name.replace(/\.pdf$/i, '');
        const fileData = await readFileAsArrayBuffer(file);
        await ensurePdfLibraries();
        originalPdfData = fileData;
        updatePreserveImagesTips();
        document.getElementById('batchInfo').style.display = 'none';
        try {
            await renderPDF(fileData);
        } catch (err) {
            console.error('Render failed:', err);
            document.getElementById('progressText').innerText = 'Error processing PDF';
            document.getElementById('cancelBtn').style.display = 'none';
        }
    }

    async function handleBatch(files) {
        await ensurePdfLibraries();
        if (typeof JSZip === 'undefined') {
            alert('ZIP library not loaded. Please refresh and try again.');
            return;
        }

        const batchId = ++currentRenderId;
        const batchInfo = document.getElementById('batchInfo');
        const batchLabel = batchInfo.querySelector('.batch-label');
        const batchFileCurrent = batchInfo.querySelector('.batch-file-current');
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const pdfContainer = document.getElementById('pdfContainer');

        batchInfo.style.display = 'block';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        pdfContainer.innerHTML = '';
        modifiedPdfBytes = null;
        originalPdfData = null;

        const zip = new JSZip();
        const totalFiles = files.length;
        const startTime = performance.now();

        for (let fi = 0; fi < totalFiles; fi++) {
            if (batchId !== currentRenderId) return;

            const file = files[fi];
            const baseName = file.name.replace(/\.pdf$/i, '');
            batchLabel.textContent = `File ${fi + 1} of ${totalFiles}`;
            batchFileCurrent.textContent = file.name;
            progressBar.style.width = '0';
            progressText.innerText = `Reading ${file.name}...`;

            try {
                const fileData = await readFileAsArrayBuffer(file);
                if (batchId !== currentRenderId) return;

                // Render this file (no preview, no auto-download)
                await renderPDF(fileData, { isBatch: true, batchId, fileIndex: fi, totalFiles });
                if (batchId !== currentRenderId) return;

                if (modifiedPdfBytes) {
                    zip.file(getOutputName(baseName), modifiedPdfBytes);
                    modifiedPdfBytes = null;
                }
            } catch (err) {
                console.error(`Error processing ${file.name}:`, err);
            }
        }

        if (batchId !== currentRenderId) return;

        // Generate ZIP
        progressBar.style.width = '100%';
        progressText.innerText = 'Building ZIP...';
        batchLabel.textContent = `${totalFiles} files converted`;
        batchFileCurrent.textContent = '';

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        if (batchId !== currentRenderId) return;

        const totalTime = ((performance.now() - startTime) / 1000).toFixed(1);
        progressText.innerText = `Done - ${totalFiles} files in ${totalTime}s`;
        document.getElementById('cancelBtn').style.display = 'none';

        // Store ZIP blob for manual download
        modifiedPdfBytes = zipBlob;
        originalFileName = `pdf_dark_mode_batch_${totalFiles}_files`;
        document.getElementById('downloadBtn').style.display = 'block';

        setTimeout(() => {
            progressContainer.classList.remove('visible');
            batchInfo.style.display = 'none';
            document.getElementById('dropZone').classList.remove('processing');
        }, 3000);
        document.dispatchEvent(new CustomEvent('pdf-converted'));
    }

    document.getElementById('fileInput').addEventListener('change', function(event) {
        if (event.target.files.length > 0) handleFiles(event.target.files);
        this.value = '';
    });

    // --- Drop zone ---
    const dropZone = document.getElementById('dropZone');
    let dragCounter = 0;

    document.body.addEventListener('dragenter', function(e) {
        e.preventDefault();
        dragCounter++;
        if (dragCounter === 1) dropZone.classList.add('dragging');
    });

    document.body.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) { dragCounter = 0; dropZone.classList.remove('dragging'); }
    });

    document.body.addEventListener('dragover', function(e) {
        e.preventDefault();
    });

    document.body.addEventListener('drop', function(e) {
        e.preventDefault();
        dragCounter = 0;
        dropZone.classList.remove('dragging');
        if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    });

    // Theme selector change (only on pages that have one)
    if (themeSelector) {
        themeSelector.addEventListener('change', async function() {
            const selectedTheme = this.value;
            applyThemeBackground(themes[selectedTheme]);
            saveSettings();
            if (originalPdfData) {
                currentRenderId++;
                await ensurePdfLibraries();
                document.getElementById('dropZone').classList.add('processing');
                document.getElementById('progressContainer').classList.add('visible');
                document.getElementById('downloadBtn').style.display = 'none';
                try {
                    await renderPDF(originalPdfData);
                } catch (err) {
                    console.error('Render failed:', err);
                    document.getElementById('progressText').innerText = 'Error processing PDF';
                    document.getElementById('cancelBtn').style.display = 'none';
                }
            }
        });
    }

    // Preload PDF libraries when upload button is clicked
    const uploadBtn = document.querySelector('.custom-file-upload');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            loadPdfLibraries().catch(() => {});
        });
    }

    // --- Main render pipeline with concurrent page processing ---
    // options: { isBatch, batchId, fileIndex, totalFiles }
    async function renderPDF(pdfData, options) {
        const isBatch = options && options.isBatch;
        const renderId = isBatch ? options.batchId : ++currentRenderId;
        const theme = getCurrentTheme();
        const scale = parseFloat(resolutionSlider.value);
        const jpegQuality = parseInt(qualitySlider.value);

        if (!isBatch) applyThemeBackground(theme);
        if (supportsCanvasFilter) updateSvgFilter(theme);

        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const totalPages = pdf.numPages;

        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const progressContainer = document.getElementById('progressContainer');

        modifiedPdfBytes = null;
        progressBar.style.width = '0';

        if (!isBatch) {
            const pdfContainer = document.getElementById('pdfContainer');
            progressText.innerText = `0/${totalPages}`;
            document.getElementById('cancelBtn').style.display = 'inline-block';
            pdfContainer.querySelectorAll('img').forEach(img => {
                if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
            });
            pdfContainer.innerHTML = '';
        }

        const PREVIEW_LIMIT = 20;
        const maxConcurrency = scale <= 1.5 ? 6 : scale >= 2.5 ? 2 : 4;
        const CONCURRENCY = Math.min(navigator.hardwareConcurrency || 2, maxConcurrency, totalPages);

        const previewSlots = [];
        if (!isBatch) {
            const pdfContainer = document.getElementById('pdfContainer');
            pdfContainer.classList.add('has-previews');
            const firstPage = await pdf.getPage(1);
            const firstVp = firstPage.getViewport({ scale: 1 });
            const slotRatio = firstVp.width + ' / ' + firstVp.height;

            // Wrap pdfContainer if not already wrapped
            let wrap = pdfContainer.parentElement;
            if (!wrap.classList.contains('pdf-container-wrap')) {
                wrap = document.createElement('div');
                wrap.className = 'pdf-container-wrap';
                pdfContainer.parentNode.insertBefore(wrap, pdfContainer);
                wrap.appendChild(pdfContainer);
            }
            wrap.classList.add('visible');

            // Page number pill (positioned over scroll area)
            let pill = wrap.querySelector('.page-pill');
            if (!pill) {
                pill = document.createElement('div');
                pill.className = 'page-pill';
                wrap.appendChild(pill);
            }
            pill.textContent = 'Page 1';

            const showCount = Math.min(PREVIEW_LIMIT, totalPages);
            for (let i = 0; i < showCount; i++) {
                const slot = document.createElement('div');
                slot.className = 'preview-slot';
                slot.style.aspectRatio = slotRatio;
                slot.innerHTML = '<div class="preview-loader"><div class="spinner"></div>Loading preview…</div>';
                pdfContainer.appendChild(slot);
                previewSlots.push(slot);
            }

            // "X more pages" indicator
            if (totalPages > PREVIEW_LIMIT) {
                const more = document.createElement('div');
                more.className = 'more-pages';
                more.textContent = `+${totalPages - PREVIEW_LIMIT} more pages`;
                pdfContainer.appendChild(more);
            }

            // Scroll handler: show page pill
            let pillTimer;
            pdfContainer.onscroll = () => {
                const st = pdfContainer.scrollTop;
                let cur = 1;
                for (let i = 0; i < previewSlots.length; i++) {
                    if (previewSlots[i].offsetTop - pdfContainer.offsetTop <= st + 60) cur = i + 1;
                }
                pill.textContent = `Page ${cur} of ${totalPages}`;
                pill.classList.add('visible');
                clearTimeout(pillTimer);
                pillTimer = setTimeout(() => pill.classList.remove('visible'), 1200);
            };
        }

        let completedPages = 0;
        const pageResults = new Array(totalPages);
        const startTime = performance.now();

        let nextPageIdx = 0;

        async function worker() {
            while (nextPageIdx < totalPages) {
                if (renderId !== currentRenderId) return;
                const pageIdx = nextPageIdx++;

                try {
                    const result = await processPage(pdf, pageIdx + 1, theme, scale, jpegQuality);
                    if (renderId !== currentRenderId) return;

                    pageResults[pageIdx] = result;
                    completedPages++;

                    const percent = (completedPages / totalPages) * 100;
                    progressBar.style.width = `${percent}%`;

                    const elapsed = performance.now() - startTime;
                    const remaining = Math.ceil((totalPages - completedPages) * (elapsed / completedPages) / 1000);
                    const mins = Math.floor(remaining / 60);
                    const secs = remaining % 60;
                    const timeStr = mins > 0 ? `${mins}m ${secs}s left` : `${secs}s left`;
                    progressText.innerText = completedPages < totalPages
                        ? `${completedPages} of ${totalPages} pages  ·  ${timeStr}`
                        : `${completedPages} of ${totalPages} pages`;

                    if (!isBatch && pageIdx < PREVIEW_LIMIT) {
                        const previewBlob = new Blob([result.bytes], { type: 'image/jpeg' });
                        const img = document.createElement('img');
                        img.src = URL.createObjectURL(previewBlob);
                        img.alt = `Page ${pageIdx + 1}`;
                        img.draggable = false;
                        const loader = previewSlots[pageIdx].querySelector('.preview-loader');
                        if (loader) loader.remove();
                        previewSlots[pageIdx].appendChild(img);

                        if (result.textItems && result.textItems.length > 0) {
                            const textLayer = document.createElement('div');
                            textLayer.className = 'preview-text-layer';
                            textLayer.dataset.canvasWidth = result.width;
                            textLayer.style.width = result.width + 'px';
                            textLayer.style.height = result.height + 'px';
                            for (const item of result.textItems) {
                                const span = document.createElement('span');
                                span.textContent = item.str;
                                span.style.left = item.x + 'px';
                                span.style.top = (result.height - item.y) + 'px';
                                span.style.fontSize = item.fontSize + 'px';
                                span.style.transform = 'translateY(-100%)';
                                if (item.width > 0 && item.str.length > 0) {
                                    span.style.width = item.width + 'px';
                                    span.style.display = 'inline-block';
                                }
                                textLayer.appendChild(span);
                            }
                            previewSlots[pageIdx].appendChild(textLayer);
                            const scaleOnce = () => {
                                if (img.clientWidth > 0) {
                                    scaleTextLayer(textLayer, img);
                                } else {
                                    requestAnimationFrame(scaleOnce);
                                }
                            };
                            if (img.complete) scaleOnce(); else img.onload = scaleOnce;
                        }
                    }
                } catch (err) {
                    console.error(`Error processing page ${pageIdx + 1}:`, err);
                    completedPages++;
                }
            }
        }

        // Launch concurrent workers
        await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

        if (renderId !== currentRenderId) return;

        // Build output PDF from JPEG pages
        progressText.innerText = isBatch
            ? `Building PDF (file ${options.fileIndex + 1}/${options.totalFiles})...`
            : 'Building PDF...';

        const CHUNK_SIZE = 50;
        const chunks = [];

        for (let chunkStart = 0; chunkStart < totalPages; chunkStart += CHUNK_SIZE) {
            if (renderId !== currentRenderId) return;
            const chunkDoc = await PDFLib.PDFDocument.create();
            const needsText = pageResults.slice(chunkStart, Math.min(chunkStart + CHUNK_SIZE, totalPages)).some(r => r && r.textItems && r.textItems.length > 0);
            const helvetica = needsText ? await chunkDoc.embedFont(PDFLib.StandardFonts.Helvetica) : null;
            const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, totalPages);

            for (let i = chunkStart; i < chunkEnd; i++) {
                const result = pageResults[i];
                if (!result) continue;
                const image = await chunkDoc.embedJpg(result.bytes);
                const page = chunkDoc.addPage([result.width, result.height]);
                page.drawImage(image, { x: 0, y: 0, width: result.width, height: result.height });

                if (helvetica && result.textItems && result.textItems.length > 0) {
                    for (const item of result.textItems) {
                        try {
                            let fontSize = item.fontSize || 12;
                            if (item.width > 0 && item.str.length > 0) {
                                const measuredWidth = helvetica.widthOfTextAtSize(item.str, fontSize);
                                if (measuredWidth > 0) fontSize = fontSize * (item.width / measuredWidth);
                            }
                            page.drawText(item.str, {
                                x: item.x,
                                y: item.y,
                                size: Math.max(1, fontSize),
                                font: helvetica,
                                opacity: 0,
                            });
                        } catch (e) { /* Skip unsupported characters */ }
                    }
                }

                pageResults[i] = null;
            }

            chunks.push(await chunkDoc.save());
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        if (renderId !== currentRenderId) return;

        if (chunks.length === 1) {
            modifiedPdfBytes = chunks[0];
        } else {
            progressText.innerText = isBatch
                ? `Merging PDF (file ${options.fileIndex + 1}/${options.totalFiles})...`
                : 'Merging PDF chunks...';
            const finalPdf = await PDFLib.PDFDocument.create();
            for (let i = 0; i < chunks.length; i++) {
                if (renderId !== currentRenderId) return;
                const chunkDoc = await PDFLib.PDFDocument.load(chunks[i]);
                const copiedPages = await finalPdf.copyPages(chunkDoc, chunkDoc.getPageIndices());
                copiedPages.forEach(p => finalPdf.addPage(p));
                chunks[i] = null;
            }
            modifiedPdfBytes = await finalPdf.save();
        }

        if (renderId !== currentRenderId) return;

        if (!isBatch) {
            const totalTime = ((performance.now() - startTime) / 1000).toFixed(1);
            progressText.innerText = `Done in ${totalTime}s`;
            document.getElementById('cancelBtn').style.display = 'none';
            document.getElementById('downloadBtn').style.display = 'block';
            setTimeout(() => {
                progressContainer.classList.remove('visible');
                document.getElementById('dropZone').classList.remove('processing');
            }, 2000);
            document.dispatchEvent(new CustomEvent('pdf-converted'));
        }
    }

    function triggerDownload() {
        if (modifiedPdfBytes) {
            const isZip = modifiedPdfBytes instanceof Blob;
            const blob = isZip ? modifiedPdfBytes : new Blob([modifiedPdfBytes], { type: 'application/pdf' });
            const name = isZip ? originalFileName + '.zip' : getOutputName(originalFileName);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        }
    }

    document.getElementById('cancelBtn').addEventListener('click', function() {
        currentRenderId++;
        this.style.display = 'none';
        document.getElementById('progressText').innerText = 'Cancelled';
        document.getElementById('batchInfo').style.display = 'none';
        // Hide tips immediately
        if (scannedTipEl) scannedTipEl.classList.remove('visible');
        if (imagesTipEl) imagesTipEl.classList.remove('visible');
        // Collapse preview container immediately (max-height transition handles animation)
        const pdfC = document.getElementById('pdfContainer');
        pdfC.querySelectorAll('img').forEach(img => { if (img.src.startsWith('blob:')) URL.revokeObjectURL(img.src); });
        pdfC.classList.remove('has-previews');
        const wrap = pdfC.closest('.pdf-container-wrap');
        if (wrap) wrap.classList.remove('visible');
        const pill = document.querySelector('.page-pill');
        if (pill) pill.classList.remove('visible');
        // Clear innerHTML after collapse transition ends
        setTimeout(() => { pdfC.innerHTML = ''; }, 400);
        // Swap: fade out progress, fade in dropZone after user sees "Cancelled"
        setTimeout(() => {
            originalPdfData = null;
            document.getElementById('progressContainer').classList.remove('visible');
            document.getElementById('dropZone').classList.remove('processing');
            updatePreserveImagesTips();
        }, 2200);
    });

    document.getElementById('downloadBtn').addEventListener('click', triggerDownload);

    // FAQ accordion (works on any page with #faqList)
    const faqList = document.getElementById('faqList');
    if (faqList) {
        faqList.addEventListener('click', function(e) {
            const btn = e.target.closest('.faq-q');
            if (!btn) return;
            btn.parentElement.classList.toggle('open');
        });
    }

    // Hide floating logo near footer on mobile
    (function() {
        var logo = document.querySelector('.bratuka-logo');
        var footer = document.querySelector('.site-footer');
        if (!logo || !footer) return;
        var mq = window.matchMedia('(max-width: 768px)');
        function onScroll() {
            if (!mq.matches) { logo.style.opacity = ''; return; }
            var ft = footer.getBoundingClientRect().top;
            var wh = window.innerHeight;
            var fadeStart = 30;
            if (ft < wh + fadeStart) {
                var pct = Math.max(0, (ft - wh + fadeStart) / fadeStart);
                logo.style.opacity = pct;
            } else {
                logo.style.opacity = '';
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        mq.addEventListener('change', onScroll);
    })();

    // Expose API for theme-picker.js and other extensions
    window.PDFConverter = {
        themes: themes,
        applyThemeBackground: applyThemeBackground,
        getCurrentTheme: getCurrentTheme,
        getCurrentThemeKey: getCurrentThemeKey,
        loadPdfLibraries: loadPdfLibraries,
        ensurePdfLibraries: ensurePdfLibraries,
        get originalPdfData() { return originalPdfData; }
    };
})();
