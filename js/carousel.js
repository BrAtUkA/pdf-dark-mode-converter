// PDF Dark Mode Converter - Blog Carousel & Icons
// Only included on pages with a blog carousel.
(function() {
    'use strict';

    // Blog carousel arrows + drag
    const grid = document.getElementById('blogCarousel');
    if (!grid) return;

    const wrap = grid.parentElement;
    const prev = wrap.querySelector('.prev');
    const next = wrap.querySelector('.next');
    const fadeL = wrap.querySelector('.fade-left');
    const fadeR = wrap.querySelector('.fade-right');

    function update() {
        const atStart = grid.scrollLeft <= 8;
        const atEnd = grid.scrollLeft >= grid.scrollWidth - grid.clientWidth - 8;
        prev.classList.toggle('hidden', atStart);
        next.classList.toggle('hidden', atEnd);
        fadeL.classList.toggle('hidden', atStart);
        fadeR.classList.toggle('hidden', atEnd);
    }

    prev.addEventListener('click', () => { grid.scrollBy({ left: -280, behavior: 'smooth' }); });
    next.addEventListener('click', () => { grid.scrollBy({ left: 280, behavior: 'smooth' }); });
    grid.addEventListener('scroll', update);
    update();

    // Drag to scroll
    let isDragging = false, hasDragged = false, startX, startScroll;
    grid.addEventListener('dragstart', (e) => e.preventDefault());
    grid.addEventListener('mousedown', (e) => {
        isDragging = true; hasDragged = false;
        startX = e.pageX; startScroll = grid.scrollLeft;
        grid.style.cursor = 'grabbing'; grid.style.userSelect = 'none';
        grid.style.scrollBehavior = 'auto';
    });
    grid.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const dx = e.pageX - startX;
        if (Math.abs(dx) > 3) hasDragged = true;
        grid.scrollLeft = startScroll - dx;
    });
    const stopDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        grid.style.cursor = ''; grid.style.userSelect = '';
        grid.style.scrollBehavior = 'smooth';
    };
    grid.addEventListener('mouseup', stopDrag);
    grid.addEventListener('mouseleave', stopDrag);
    grid.addEventListener('click', (e) => {
        if (hasDragged) { e.preventDefault(); e.stopPropagation(); }
    }, true);
})();

// Inline Lucide icon replacement - no CDN dependency
// Bundles only the 7 icons used on this site (zap, palette, sun-moon, infinity,
// sliders-horizontal, chevron-left, chevron-right).
(function() {
    'use strict';
    var ICONS = {
        'zap': [
            ['path', {d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z'}]
        ],
        'palette': [
            ['circle', {cx: '13.5', cy: '6.5', r: '.5', fill: 'currentColor'}],
            ['circle', {cx: '17.5', cy: '10.5', r: '.5', fill: 'currentColor'}],
            ['circle', {cx: '8.5', cy: '7.5', r: '.5', fill: 'currentColor'}],
            ['circle', {cx: '6.5', cy: '12.5', r: '.5', fill: 'currentColor'}],
            ['path', {d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z'}]
        ],
        'sun-moon': [
            ['path', {d: 'M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4'}],
            ['path', {d: 'M12 2v2'}],
            ['path', {d: 'M12 20v2'}],
            ['path', {d: 'm4.9 4.9 1.4 1.4'}],
            ['path', {d: 'm17.7 17.7 1.4 1.4'}],
            ['path', {d: 'M2 12h2'}],
            ['path', {d: 'M20 12h2'}],
            ['path', {d: 'm6.3 17.7-1.4 1.4'}],
            ['path', {d: 'm19.1 4.9-1.4 1.4'}]
        ],
        'infinity': [
            ['path', {d: 'M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z'}]
        ],
        'sliders-horizontal': [
            ['line', {x1: '21', x2: '14', y1: '4',  y2: '4'}],
            ['line', {x1: '10', x2: '3',  y1: '4',  y2: '4'}],
            ['line', {x1: '21', x2: '12', y1: '12', y2: '12'}],
            ['line', {x1: '8',  x2: '3',  y1: '12', y2: '12'}],
            ['line', {x1: '21', x2: '16', y1: '20', y2: '20'}],
            ['line', {x1: '12', x2: '3',  y1: '20', y2: '20'}],
            ['line', {x1: '14', x2: '14', y1: '2',  y2: '6'}],
            ['line', {x1: '8',  x2: '8',  y1: '10', y2: '14'}],
            ['line', {x1: '16', x2: '16', y1: '18', y2: '22'}]
        ],
        'chevron-left':  [['path', {d: 'm15 18-6-6 6-6'}]],
        'chevron-right': [['path', {d: 'm9 18 6-6-6-6'}]]
    };

    var els = document.querySelectorAll('[data-lucide]');
    if (!els.length) return;

    var ns = 'http://www.w3.org/2000/svg';
    els.forEach(function(el) {
        var name = el.getAttribute('data-lucide');
        var def = ICONS[name];
        if (!def) return;
        var svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        if (el.className) svg.setAttribute('class', el.className);
        if (el.getAttribute('aria-hidden')) svg.setAttribute('aria-hidden', 'true');
        def.forEach(function(item) {
            var child = document.createElementNS(ns, item[0]);
            var attrs = item[1];
            Object.keys(attrs).forEach(function(k) { child.setAttribute(k, attrs[k]); });
            svg.appendChild(child);
        });
        el.parentNode.replaceChild(svg, el);
    });
})();
