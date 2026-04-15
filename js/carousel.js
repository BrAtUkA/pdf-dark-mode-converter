// PDF Dark Mode Converter — Blog Carousel & Icons
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

// Load Lucide icons for feature cards
(function() {
    'use strict';
    if (!document.querySelector('[data-lucide]')) return;
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js';
    s.onload = () => lucide.createIcons();
    document.head.appendChild(s);
})();
