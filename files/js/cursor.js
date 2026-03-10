/* ─── DalitSite — Custom Cursor ───
 *  Dot (8px) + Ring (40px), mix-blend-mode: difference.
 *  Ring grows on hover over interactive elements.
 *  Only on pointer: fine devices.
 */
(function (DS) {
    'use strict';

    var dot, ring;
    var pos = { x: -100, y: -100 };
    var dotPos = { x: -100, y: -100 };
    var ringPos = { x: -100, y: -100 };

    function init() {
        if (DS.reducedMotion) return;
        if (!window.matchMedia('(pointer: fine)').matches) return;

        // Create elements
        dot = document.createElement('div');
        dot.className = 'cursor-dot';
        dot.setAttribute('aria-hidden', 'true');

        ring = document.createElement('div');
        ring.className = 'cursor-ring';
        ring.setAttribute('aria-hidden', 'true');

        document.body.appendChild(dot);
        document.body.appendChild(ring);

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseenter', show);
        document.addEventListener('mouseleave', hide);

        // Hover targets
        bindHovers();

        // Start render loop via GSAP ticker for smooth follow
        gsap.ticker.add(render);
    }

    function onMove(e) {
        pos.x = e.clientX;
        pos.y = e.clientY;
    }

    function render() {
        // Dot follows instantly
        dotPos.x += (pos.x - dotPos.x) * 0.85;
        dotPos.y += (pos.y - dotPos.y) * 0.85;

        // Ring follows with lag
        ringPos.x += (pos.x - ringPos.x) * 0.15;
        ringPos.y += (pos.y - ringPos.y) * 0.15;

        dot.style.transform = 'translate(' + dotPos.x + 'px, ' + dotPos.y + 'px) translate(-50%, -50%)';
        ring.style.transform = 'translate(' + ringPos.x + 'px, ' + ringPos.y + 'px) translate(-50%, -50%)';
    }

    function show() {
        if (dot) dot.style.opacity = '1';
        if (ring) ring.style.opacity = '1';
    }

    function hide() {
        if (dot) dot.style.opacity = '0';
        if (ring) ring.style.opacity = '0';
    }

    function bindHovers() {
        var targets = document.querySelectorAll('a, button, .project-card, .pill, .nav-pill, .nav-cta, .hero-cta, [role="button"]');
        targets.forEach(function (el) {
            el.addEventListener('mouseenter', function () {
                if (ring) ring.classList.add('is-hover');
            });
            el.addEventListener('mouseleave', function () {
                if (ring) ring.classList.remove('is-hover');
            });
        });
    }

    DS.Cursor = { init: init, bindHovers: bindHovers };

})(window.DalitSite = window.DalitSite || {});
