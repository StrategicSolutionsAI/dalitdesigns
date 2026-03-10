/* ─── DalitSite — App Orchestrator ───
 *  Initializes Lenis smooth scroll, GSAP ticker,
 *  preloader, and coordinates all modules.
 */
var DalitSite = window.DalitSite || {};

(function (DS) {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lenis = null;

    /* ── Lenis smooth scroll ── */
    function initLenis() {
        if (reducedMotion) return;
        if (typeof Lenis === 'undefined') return;

        lenis = new Lenis({
            lerp: 0.1,
            wheelMultiplier: 0.8,
            touchMultiplier: 1.5,
            smoothWheel: true
        });

        // Connect Lenis to GSAP ticker
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Connect ScrollTrigger to Lenis
        if (typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.update === 'function') {
            lenis.on('scroll', ScrollTrigger.update);
        }

        DS.lenis = lenis;

        // Intercept anchor links for smooth Lenis scroll
        initAnchorScroll();
    }

    /* ── Smooth anchor scrolling via Lenis ── */
    function initAnchorScroll() {
        document.addEventListener('click', function (e) {
            var link = e.target.closest('a[href^="#"]');
            if (!link) return;

            var hash = link.getAttribute('href');
            if (hash === '#' || hash === '#top') {
                e.preventDefault();
                lenis.scrollTo(0, { duration: 1.4, easing: easeOutQuart });
                return;
            }

            var target = document.querySelector(hash);
            if (!target) return;

            e.preventDefault();

            // Offset for sticky header
            var header = document.querySelector('.site-header');
            var offset = header ? header.offsetHeight + 24 : 0;

            lenis.scrollTo(target, {
                offset: -offset,
                duration: 1.4,
                easing: easeOutQuart
            });

            // Update URL without jumping
            history.pushState(null, '', hash);
        });
    }

    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    var internalNavigationKey = 'ds_internal_navigation';

    function isHomePage() {
        return !!document.querySelector('[data-barba="container"][data-barba-namespace="home"]');
    }

    function removePreloader() {
        var preloader = document.querySelector('.preloader');
        if (preloader) preloader.remove();
    }

    function scrollToHash(hash, immediate) {
        if (!hash || hash === '#' || hash === '#top') return;

        var target = document.querySelector(hash);
        if (!target) return;

        var header = document.querySelector('.site-header');
        var offset = header ? header.offsetHeight + 24 : 0;

        if (lenis && !reducedMotion) {
            lenis.scrollTo(target, {
                offset: -offset,
                immediate: !!immediate,
                duration: immediate ? 0 : 1.2,
                easing: easeOutQuart
            });
            return;
        }

        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
            top: top,
            behavior: immediate || reducedMotion ? 'auto' : 'smooth'
        });
    }

    function applyCurrentHash() {
        if (!window.location.hash) return;
        window.requestAnimationFrame(function () {
            scrollToHash(window.location.hash, true);
        });
    }

    function markInternalNavigation() {
        document.addEventListener('click', function (e) {
            var link = e.target.closest('a[href]');
            if (!link) return;
            if (link.hasAttribute('download')) return;
            if (link.target && link.target !== '_self') return;

            var href = link.getAttribute('href');
            if (!href || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0 || href.indexOf('#') === 0) return;

            var url;
            try {
                url = new URL(href, window.location.href);
            } catch (err) {
                return;
            }

            if (url.origin !== window.location.origin) return;
            if (url.pathname === window.location.pathname && url.hash === window.location.hash) return;

            sessionStorage.setItem(internalNavigationKey, '1');
        });
    }

    /* ── Preloader (dark — first visit) ── */
    function runPreloader(onComplete) {
        var el = document.querySelector('.preloader');
        var completed = false;
        var fallbackTimer = null;

        function finish() {
            if (completed) return;
            completed = true;
            if (fallbackTimer) window.clearTimeout(fallbackTimer);
            removePreloader();
            onComplete();
        }

        if (!el || reducedMotion || typeof gsap === 'undefined') {
            finish();
            return;
        }

        var logo = el.querySelector('.preloader__logo');
        var fill = el.querySelector('.preloader__bar-fill');
        if (!logo || !fill) {
            finish();
            return;
        }

        var tl = gsap.timeline({
            onComplete: finish
        });

        fallbackTimer = window.setTimeout(finish, 2400);

        tl.to(logo, { opacity: 1, duration: 0.4, ease: 'power2.out' })
          .to(fill, { width: '100%', duration: 0.8, ease: 'power2.inOut' }, '+=0.1')
          .to(el, { yPercent: -100, duration: 0.6, ease: 'power3.inOut' }, '+=0.15');
    }

    /* ── Year auto-update ── */
    function setYear() {
        var el = document.getElementById('current-year');
        if (el) el.textContent = new Date().getFullYear();
    }

    /* ── Mobile nav ── */
    function initMobileNav() {
        var toggle = document.getElementById('nav-toggle');
        var mobileNav = document.getElementById('mobile-nav');
        if (!toggle || !mobileNav) return;

        toggle.addEventListener('click', function () {
            var isOpen = mobileNav.classList.toggle('is-open');
            toggle.classList.toggle('is-active');
            toggle.setAttribute('aria-expanded', isOpen);
            mobileNav.setAttribute('aria-hidden', !isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
            // Pause Lenis when menu is open
            if (lenis) isOpen ? lenis.stop() : lenis.start();
        });

        mobileNav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                mobileNav.classList.remove('is-open');
                toggle.classList.remove('is-active');
                toggle.setAttribute('aria-expanded', 'false');
                mobileNav.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
                if (lenis) {
                    lenis.start();
                    // Small delay so Lenis restarts before the anchor scroll fires
                }
            });
        });
    }

    /* ── Case study mobile nav ── */
    function initCaseMobileNav() {
        var toggle = document.getElementById('case-nav-toggle');
        var mobileNav = document.getElementById('case-mobile-nav');
        if (!toggle || !mobileNav) return;

        toggle.addEventListener('click', function () {
            var isOpen = mobileNav.classList.toggle('is-open');
            toggle.classList.toggle('is-active');
            toggle.setAttribute('aria-expanded', isOpen);
            mobileNav.setAttribute('aria-hidden', !isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
            if (lenis) isOpen ? lenis.stop() : lenis.start();
        });

        mobileNav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                mobileNav.classList.remove('is-open');
                toggle.classList.remove('is-active');
                toggle.setAttribute('aria-expanded', 'false');
                mobileNav.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
                if (lenis) lenis.start();
            });
        });
    }

    /* ── Portrait gradient follow ── */
    function initPortraitGradient() {
        var container = document.getElementById('dalit-hero-image');
        var gradient = document.getElementById('dalit-hero-gradient');
        if (!container || !gradient) return;

        var center = function () {
            var r = container.getBoundingClientRect();
            gradient.style.transform = 'translate(' + (r.width / 2) + 'px, ' + (r.height / 2) + 'px) translate(-50%, -50%)';
        };
        center();

        if (!reducedMotion) {
            container.addEventListener('mousemove', function (e) {
                var r = container.getBoundingClientRect();
                gradient.style.transform = 'translate(' + (e.clientX - r.left) + 'px, ' + (e.clientY - r.top) + 'px) translate(-50%, -50%)';
            });
            container.addEventListener('mouseleave', center);
        }
        window.addEventListener('resize', center);
    }

    /* ── Main init ── */
    function initModules() {
        setYear();
        initMobileNav();
        initCaseMobileNav();
        initPortraitGradient();

        // Init modules in order
        if (DS.Animations && DS.Animations.init) DS.Animations.init();
        if (DS.Blob && DS.Blob.init) DS.Blob.init();

        if (DS.Magnetic && DS.Magnetic.init) DS.Magnetic.init();
        if (DS.Transitions && DS.Transitions.init) DS.Transitions.init();
        applyCurrentHash();
    }

    /* ── Boot sequence ── */
    function boot() {
        // Register GSAP plugins
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }

        initLenis();
        markInternalNavigation();

        // Run Splitting.js on data-split elements
        if (typeof Splitting !== 'undefined') {
            Splitting({ target: '[data-split]', by: 'chars' });
        }

        var arrivedFromInternalNavigation = sessionStorage.getItem(internalNavigationKey) === '1';
        sessionStorage.removeItem(internalNavigationKey);

        if (!isHomePage()) {
            removePreloader();
            initModules();
            return;
        }

        if (!arrivedFromInternalNavigation) {
            runPreloader(function () {
                initModules();
            });
            return;
        }

        removePreloader();
        initModules();
    }

    // Expose
    DS.reducedMotion = reducedMotion;
    DS.boot = boot;
    DS.initModules = initModules;
    DS.scrollToHash = scrollToHash;
    DS.destroyScrollTriggers = function () {
        if (typeof ScrollTrigger === 'undefined' || typeof ScrollTrigger.getAll !== 'function') return;
        ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
    };

    // Auto-start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})(DalitSite);
