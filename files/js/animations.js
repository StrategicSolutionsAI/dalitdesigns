/* ─── DalitSite — Animations ───
 *  GSAP ScrollTrigger: fade reveals, staggered grids,
 *  image parallax, metric count-up, text splits.
 */
(function (DS) {
    'use strict';

    function showStaticContent() {
        document.documentElement.classList.remove('motion-ready');
        document.querySelectorAll('[data-reveal], [data-animate]').forEach(function (el) {
            el.classList.add('is-visible');
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        document.querySelectorAll('[data-split] .char').forEach(function (el) {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }

    function init() {
        if (DS.reducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            showStaticContent();
            return;
        }

        try {
            document.documentElement.classList.add('motion-ready');
            initFadeReveals();
            initStaggeredGrids();
            initParallaxImages();
            initFullBleedParallax();
            initMetricCountUp();
            initTextSplits();
            initCardParallax();
        } catch (err) {
            showStaticContent();
        }
    }

    /* ── Fade reveals (data-reveal & data-animate) ── */
    function initFadeReveals() {
        var els = document.querySelectorAll('[data-reveal], [data-animate]');
        els.forEach(function (el) {
            gsap.fromTo(el,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 88%',
                        once: true
                    },
                    delay: parseFloat(getComputedStyle(el).getPropertyValue('--delay') || '0') / 1000,
                    onComplete: function () {
                        el.classList.add('is-visible');
                    }
                }
            );
        });
    }

    /* ── Staggered grid children ── */
    function initStaggeredGrids() {
        var grids = document.querySelectorAll('.project-grid, .summary-grid, .metric-grid, .principles-grid, .story-grid, .cs-stagger, .cs-process');
        grids.forEach(function (grid) {
            var children = grid.children;
            if (!children.length) return;

            gsap.fromTo(children,
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    stagger: 0.12,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: grid,
                        start: 'top 85%',
                        once: true
                    }
                }
            );
        });
    }

    /* ── Image parallax (scrub) ── */
    function initParallaxImages() {
        var images = document.querySelectorAll('.project-card-media img, .media-stage img, .gallery-frame img, .cs-stagger__img img');
        images.forEach(function (img) {
            gsap.fromTo(img,
                { yPercent: 8 },
                {
                    yPercent: -8,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: img.closest('.project-card, .media-stage, .gallery-frame') || img,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1
                    }
                }
            );
        });
    }

    /* ── Full-bleed parallax (deeper scrub) ── */
    function initFullBleedParallax() {
        var els = document.querySelectorAll('.cs-fullbleed__img, .cs-hero-v2__media img');
        els.forEach(function (el) {
            gsap.fromTo(el,
                { yPercent: 4, scale: 1.04 },
                {
                    yPercent: -4,
                    scale: 1.04,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: el.closest('.cs-fullbleed, .cs-hero-v2') || el,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1.2
                    }
                }
            );
        });
    }

    /* ── Metric count-up ── */
    function initMetricCountUp() {
        var metrics = document.querySelectorAll('.metric-number');
        metrics.forEach(function (el) {
            var text = el.textContent.trim();
            var match = text.match(/^(\[?)(\d+)(\]?[%+]?)/);
            if (!match) return;

            var target = parseInt(match[2], 10);
            var prefix = match[1] || '';
            var suffix = text.replace(/^[\[\d\]]+/, '').replace(match[2], '');
            // Keep original text for placeholder-style metrics
            if (text.indexOf('[') === 0) return;

            var obj = { val: 0 };
            gsap.to(obj, {
                val: target,
                duration: 1.6,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    once: true
                },
                onUpdate: function () {
                    el.textContent = prefix + Math.round(obj.val) + suffix;
                }
            });
        });
    }

    /* ── Text split reveals ── */
    function initTextSplits() {
        var splitEls = document.querySelectorAll('[data-split]');
        splitEls.forEach(function (el) {
            var chars = el.querySelectorAll('.char');
            if (!chars.length) return;

            gsap.fromTo(chars,
                { opacity: 0, y: 80, rotateX: -40 },
                {
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    duration: 0.6,
                    stagger: 0.025,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        once: true
                    }
                }
            );
        });
    }

    /* ── Project card 3D tilt + parallax ── */
    function initCardParallax() {
        if (!window.matchMedia('(pointer: fine)').matches) return;

        var cards = document.querySelectorAll('.project-card');
        cards.forEach(function (card) {
            var img = card.querySelector('.project-card-media img');
            var link = card.querySelector('a');
            if (!link) return;

            link.addEventListener('mousemove', function (e) {
                var rect = link.getBoundingClientRect();
                var x = (e.clientX - rect.left) / rect.width - 0.5;
                var y = (e.clientY - rect.top) / rect.height - 0.5;

                gsap.to(link, {
                    rotateY: x * 6,
                    rotateX: -y * 6,
                    duration: 0.4,
                    ease: 'power2.out',
                    transformPerspective: 800
                });

                if (img) {
                    gsap.to(img, {
                        x: x * 20,
                        y: y * 15,
                        duration: 0.4,
                        ease: 'power2.out'
                    });
                }
            });

            link.addEventListener('mouseleave', function () {
                gsap.to(link, {
                    rotateY: 0,
                    rotateX: 0,
                    duration: 0.8,
                    ease: 'elastic.out(1, 0.4)'
                });

                if (img) {
                    gsap.to(img, {
                        x: 0,
                        y: 0,
                        duration: 0.8,
                        ease: 'elastic.out(1, 0.4)'
                    });
                }
            });
        });
    }

    DS.Animations = { init: init };

})(window.DalitSite = window.DalitSite || {});
