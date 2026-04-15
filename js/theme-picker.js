// PDF Dark Mode Converter — Theme Picker
// Custom dropdown, color panel, and URL theme parameter handling.
// Only included on pages with a theme selector dropdown.
(function() {
    'use strict';

    const { themes, applyThemeBackground, getCurrentTheme } = window.PDFConverter;
    const select = document.getElementById('themeSelector');
    if (!select) return;

    const dropdown = document.getElementById('customDropdown');
    const toggle = dropdown.querySelector('.dropdown-toggle');
    const label = dropdown.querySelector('.dropdown-label');
    const menu = dropdown.querySelector('.dropdown-menu');

    // Build items with color swatches
    const options = Array.from(select.options);
    options.forEach(opt => {
        const theme = themes[opt.value];
        const item = document.createElement('div');
        item.className = 'dropdown-item' + (opt.selected ? ' active' : '');
        item.setAttribute('role', 'option');
        item.dataset.value = opt.value;

        const swatch = document.createElement('span');
        swatch.className = 'swatch' + (opt.value === 'custom' ? ' custom-swatch' : '');
        if (opt.value !== 'custom') {
            const sr = Math.min(theme.r + 60, 255);
            const sg = Math.min(theme.g + 60, 255);
            const sb = Math.min(theme.b + 60, 255);
            swatch.style.background = `rgb(${sr},${sg},${sb})`;
        } else {
            swatch.innerHTML = '<svg viewBox="0 0 12 12" fill="none" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 1.5l2 2M1 11l.5-2L9 1.5l2 2L3.5 11z"/></svg>';
        }

        item.appendChild(swatch);
        item.appendChild(document.createTextNode(opt.textContent));
        menu.appendChild(item);

        item.addEventListener('click', (e) => {
            if (opt.value === 'custom') {
                e.stopPropagation();
                dropdown.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                const panel = document.getElementById('colorPanel');
                panel.classList.toggle('visible');
                return;
            }
            document.getElementById('colorPanel').classList.remove('visible');
            select.value = opt.value;
            select.dispatchEvent(new Event('change'));
            label.textContent = opt.textContent;
            menu.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            dropdown.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });

    // Custom color panel
    const panelColors = [
        '#441220','#3c0838','#101044','#104438',
        '#441010','#384410','#443810','#441e08'
    ];
    const panelGrid = document.getElementById('colorPanelGrid');
    const hexInput = document.getElementById('hexInput');
    const panel = document.getElementById('colorPanel');
    const modeTrack = document.getElementById('modeToggleTrack');
    const modeDarkLabel = document.getElementById('modeDarkLabel');
    const modeLightLabel = document.getElementById('modeLightLabel');
    let customDirty = false;

    function updateModeToggleUI() {
        const isLight = themes.custom.lightMode;
        modeTrack.classList.toggle('light-active', isLight);
        modeDarkLabel.classList.toggle('active', !isLight);
        modeLightLabel.classList.toggle('active', isLight);
    }

    function autoDetectMode() {
        const t = themes.custom;
        const lum = 0.299 * t.r + 0.587 * t.g + 0.114 * t.b;
        themes.custom.lightMode = lum > 150;
        updateModeToggleUI();
    }

    function previewCustomColor(hex) {
        const clean = hex.replace('#', '');
        if (!/^[0-9a-f]{6}$/i.test(clean)) return;
        const r = parseInt(clean.slice(0,2), 16);
        const g = parseInt(clean.slice(2,4), 16);
        const b = parseInt(clean.slice(4,6), 16);
        themes.custom.r = r;
        themes.custom.g = g;
        themes.custom.b = b;
        autoDetectMode();
        select.value = 'custom';
        label.textContent = 'Custom';
        menu.querySelectorAll('.dropdown-item').forEach(el => {
            el.classList.toggle('active', el.dataset.value === 'custom');
        });
        hexInput.value = '#' + clean;
        panelGrid.querySelectorAll('.color-panel-swatch').forEach(s => {
            s.classList.toggle('selected', s.dataset.color === '#' + clean);
        });
        applyThemeBackground(themes.custom);
        customDirty = true;
    }

    function commitCustomColor() {
        if (!customDirty) return;
        customDirty = false;
        select.value = 'custom';
        select.dispatchEvent(new Event('change'));
    }

    modeTrack.addEventListener('click', () => {
        themes.custom.lightMode = !themes.custom.lightMode;
        updateModeToggleUI();
        applyThemeBackground(themes.custom);
        customDirty = true;
    });

    panelColors.forEach(c => {
        const sw = document.createElement('div');
        sw.className = 'color-panel-swatch';
        sw.style.background = c;
        sw.dataset.color = c;
        sw.addEventListener('click', () => previewCustomColor(c));
        panelGrid.appendChild(sw);
    });

    hexInput.addEventListener('input', () => {
        const val = hexInput.value.replace('#', '');
        if (val.length === 6) previewCustomColor(val);
    });
    hexInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); previewCustomColor(hexInput.value); }
    });

    // Close panel on outside click — commit and reprocess
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !e.target.closest('.dropdown-item[data-value="custom"]')) {
            if (panel.classList.contains('visible')) {
                panel.classList.remove('visible');
                commitCustomColor();
            }
        }
    });

    toggle.addEventListener('click', () => {
        const isOpen = dropdown.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });

    // Keyboard support
    toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle.click();
        } else if (e.key === 'Escape') {
            dropdown.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });

    // Sync dropdown label and highlight to match the actual selected theme on load
    function syncDropdownToSelectedTheme() {
        const selected = select.value;
        // Update label
        const opt = select.options[select.selectedIndex];
        if (opt) label.textContent = opt.textContent;
        // Update highlight
        menu.querySelectorAll('.dropdown-item').forEach(el => {
            el.classList.toggle('active', el.dataset.value === selected);
        });
    }
    syncDropdownToSelectedTheme();

    // Sync dropdown visual state with URL theme param (already set by converter.js)
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme');
    if (themeParam && themes[themeParam]) {
        const items = menu.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            item.classList.toggle('active', item.dataset.value === themeParam);
        });
        const opt = select.options[select.selectedIndex];
        if (opt) label.textContent = opt.textContent;
    }
})();
