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

        // Connect Lenis to GSAP ticker for frame-synced scrolling
        if (typeof gsap !== 'undefined' && gsap.ticker) {
            lenis.on('scroll', function () {
                if (typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.update === 'function') {
                    ScrollTrigger.update();
                }
            });
            gsap.ticker.add(function (time) {
                lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);
        } else {
            // Fallback: standalone RAF loop
            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
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

    var siteBrandLogoMarkup = `
<svg class="site-brand-logo" viewBox="0 0 220 32" width="220" height="32" aria-hidden="true" focusable="false">
  <g class="logo-icon" transform="scale(0.2909)">
    <g transform="translate(13.778459, 0.316037)">
      <path d="M40.8000451,109.846651 L6.93341924,109.846651 L6.93341924,102.905073 L40.8000451,102.905073 C67.3741537,102.905073 88.9977529,81.390862 88.9977529,54.9442308 C88.9977529,28.6629496 67.3741537,7.27665053 40.8000451,7.27665053 L7.77052247,7.27665053 L7.77052247,79.5688928 L0.794662206,79.5688928 L0.794662206,6.59029228 C0.794662206,3.142902 3.5473837,0.338192613 6.93341924,0.338192613 L40.8000451,0.338192613 C71.2242015,0.338192613 95.9736132,24.8349424 95.9736132,54.9442308 C95.9736132,85.2188691 71.2242015,109.846651 40.8000451,109.846651"></path>
    </g>
    <path d="M21.6816008,103.532155 C21.6188964,103.466639 21.2740224,103.223294 20.7128184,103.223294 L21.5028933,103.223294 L21.5028933,103.157778 C21.5154342,103.260732 21.612626,103.460399 21.6816008,103.532155 L21.6816008,103.532155 Z M20.7128184,110.161752 C17.1762923,110.161752 14.5301683,106.499095 14.5301683,103.223294 L20.7128184,103.223294 L20.7128184,110.161752 Z"></path>
    <g transform="translate(0.000000, 14.329470)">
      <path d="M52.5170978,81.9132486 L-0.000940565427,81.9132486 L0.0241411793,4.99744755 L6.9749197,3.71520555 L6.9749197,74.9716709 L52.5170978,74.9716709 C72.1686448,74.9716709 86.4338872,60.6579816 86.4338872,40.9314216 C86.4338872,21.3764512 72.1686448,7.18443451 52.5170978,7.18443451 L33.0818808,7.18443451 L33.0818808,0.242856778 L52.5170978,0.242856778 C76.2099409,0.242856778 93.4066122,17.3550158 93.4066122,40.9314216 C93.4066122,64.679417 76.2099409,81.9132486 52.5170978,81.9132486"></path>
    </g>
    <path d="M6.68836077,20.2931227 C6.75420035,20.2307265 6.99874736,19.8875474 6.99874736,19.3259815 L0.0260223102,19.3259815 C0.0260223102,15.8068356 3.70676836,13.1768356 6.99874736,13.1768356 L6.99874736,20.1152935 L7.06145172,20.1121737 C6.96112474,20.1277728 6.75733556,20.2244869 6.68836077,20.2931227"></path>
  </g>
  <g class="logo-wordmark" transform="translate(42, 9) scale(0.648) translate(0, -156.7)" fill-rule="nonzero">
    <g class="logo-letter" style="--wave-delay:0ms">
      <path d="M7.96543462,178 C13.7554346,178 18.4954346,173.29 18.4954346,167.47 C18.4954346,161.71 13.7554346,157 7.96543462,157 L0.855434619,157 C0.555434619,157 0.315434619,157.27 0.315434619,157.57 L0.315434619,177.43 C0.315434619,177.73 0.555434619,178 0.855434619,178 L7.96543462,178 Z M7.60543462,174.34 L4.18543462,174.34 L4.18543462,160.63 L7.60543462,160.63 C11.5054346,160.63 14.3554346,163.57 14.3554346,167.47 C14.3554346,171.4 11.5054346,174.34 7.60543462,174.34 Z"></path>
    </g>
    <g class="logo-letter" style="--wave-delay:55ms">
      <path d="M27.5436955,178 C28.0236955,178 28.2936955,177.7 28.4136955,177.4 L29.8836955,174.16 L38.8536955,174.16 L40.3236955,177.4 C40.5336955,177.82 40.7436955,178 41.1936955,178 L43.8036955,178 C44.2536955,178 44.4936955,177.61 44.3136955,177.22 L35.0736955,157.03 C34.9836955,156.85 34.8636955,156.7 34.5636955,156.7 L34.2636955,156.7 C33.9936955,156.7 33.8436955,156.85 33.7536955,157.03 L24.4236955,177.22 C24.2436955,177.61 24.4836955,178 24.9336955,178 L27.5436955,178 Z M37.3836955,170.83 L31.3536955,170.83 L34.2936955,164.23 L34.3836955,164.23 L37.3836955,170.83 Z"></path>
    </g>
    <g class="logo-letter" style="--wave-delay:110ms">
      <path d="M63.4719564,178 C63.8019564,178 64.0419564,177.73 64.0419564,177.43 L64.0419564,174.97 C64.0419564,174.67 63.8019564,174.4 63.4719564,174.4 L55.8219564,174.4 L55.8219564,157.57 C55.8219564,157.27 55.5519564,157 55.2519564,157 L52.4919564,157 C52.1619564,157 51.9219564,157.27 51.9219564,157.57 L51.9219564,177.43 C51.9219564,177.73 52.1619564,178 52.4919564,178 L63.4719564,178 Z"></path>
    </g>
    <g class="logo-letter" style="--wave-delay:165ms">
      <path d="M75.3102173,178 C75.6102173,178 75.8802173,177.73 75.8802173,177.43 L75.8802173,157.57 C75.8802173,157.27 75.6102173,157 75.3102173,157 L72.5202173,157 C72.2202173,157 71.9502173,157.27 71.9502173,157.57 L71.9502173,177.43 C71.9502173,177.73 72.2202173,178 72.5202173,178 L75.3102173,178 Z"></path>
    </g>
    <g class="logo-letter" style="--wave-delay:220ms">
      <path d="M92.3984782,178 C92.6984782,178 92.9684782,177.73 92.9684782,177.43 L92.9684782,160.6 L97.5584782,160.6 C97.8884782,160.6 98.1284782,160.33 98.1284782,160.03 L98.1284782,157.57 C98.1284782,157.27 97.8884782,157 97.5584782,157 L84.4484782,157 C84.1184782,157 83.8784782,157.27 83.8784782,157.57 L83.8784782,160.03 C83.8784782,160.33 84.1184782,160.6 84.4484782,160.6 L89.0384782,160.6 L89.0384782,177.43 C89.0384782,177.73 89.3084782,178 89.6084782,178 L92.3984782,178 Z"></path>
    </g>
    <g class="logo-letter" style="--wave-delay:330ms">
      <path d="M125.285,178 C131.075,178 135.815,173.29 135.815,167.47 C135.815,161.71 131.075,157 125.285,157 L118.175,157 C117.875,157 117.635,157.27 117.635,157.57 L117.635,177.43 C117.635,177.73 117.875,178 118.175,178 L125.285,178 Z M124.925,174.34 L121.505,174.34 L121.505,160.63 L124.925,160.63 C128.825,160.63 131.675,163.57 131.675,167.47 C131.675,171.4 128.825,174.34 124.925,174.34 Z"></path>
    </g>
    <g class="logo-letter" style="--wave-delay:385ms">
      <path d="M157.433261,178 C157.763261,178 158.003261,177.73 158.003261,177.43 L158.003261,174.97 C158.003261,174.67 157.763261,174.4 157.433261,174.4 L148.553261,174.4 L148.553261,169.15 L155.963261,169.15 C156.263261,169.15 156.533261,168.91 156.533261,168.58 L156.533261,166.09 C156.533261,165.79 156.263261,165.52 155.963261,165.52 L148.553261,165.52 L148.553261,160.6 L157.433261,160.6 C157.763261,160.6 158.003261,160.33 158.003261,160.03 L158.003261,157.57 C158.003261,157.27 157.763261,157 157.433261,157 L145.223261,157 C144.893261,157 144.653261,157.27 144.653261,157.57 L144.653261,177.43 C144.653261,177.73 144.893261,178 145.223261,178 L157.433261,178 Z"></path>
    </g>
    <g class="logo-letter" style="--wave-delay:440ms">
      <path d="M172.691522,178.3 C176.921522,178.3 179.591522,175.45 179.591522,172.36 C179.591522,168.49 176.231522,166.75 173.321522,165.58 C170.891522,164.59 169.781522,163.63 169.781522,162.22 C169.781522,161.26 170.711522,160.12 172.421522,160.12 C174.071522,160.12 176.351522,161.62 176.591522,161.77 C176.951522,162.01 177.401522,161.77 177.641522,161.41 L178.781522,159.7 C178.991522,159.4 178.901522,158.89 178.601522,158.71 C178.001522,158.26 175.661522,156.7 172.601522,156.7 C167.831522,156.7 165.851522,159.79 165.851522,162.46 C165.851522,166 168.671522,167.8 171.491522,168.94 C174.011522,169.96 175.301522,171.01 175.301522,172.54 C175.301522,173.83 174.131522,174.85 172.571522,174.85 C170.756005,174.85 168.524411,173.315719 168.104184,173.03146 L168.041522,172.99 C167.771522,172.78 167.261522,172.78 167.021522,173.2 L165.941522,175.06 C165.671522,175.54 165.821522,175.69 166.091522,175.96 C166.691522,176.53 168.911522,178.3 172.691522,178.3 Z"></path>
    </g>
    <g class="logo-letter" style="--wave-delay:495ms">
      <path d="M191.669783,178 C191.969783,178 192.239783,177.73 192.239783,177.43 L192.239783,157.57 C192.239783,157.27 191.969783,157 191.669783,157 L188.879783,157 C188.579783,157 188.309783,157.27 188.309783,157.57 L188.309783,177.43 C188.309783,177.73 188.579783,178 188.879783,178 L191.669783,178 Z"></path>
    </g>
    <g class="logo-letter" style="--wave-delay:550ms">
      <path d="M211.848044,178.27 C216.198044,178.27 219.288044,176.32 219.288044,176.32 C219.408044,176.23 219.528044,176.08 219.528044,175.84 L219.528044,168.16 C219.528044,167.86 219.288044,167.59 218.988044,167.59 L213.228044,167.59 C212.898044,167.59 212.658044,167.83 212.658044,168.16 L212.658044,170.53 C212.658044,170.83 212.898044,171.07 213.228044,171.07 L215.628044,171.07 L215.628044,173.62 C215.028044,173.86 213.738044,174.37 212.058044,174.37 C208.278044,174.37 205.308044,171.22 205.308044,167.5 C205.308044,163.75 208.278044,160.54 212.028044,160.54 C213.678044,160.54 215.268044,161.14 216.558044,162.28 C216.828044,162.52 217.098044,162.52 217.338044,162.28 L219.198044,160.33 C219.438044,160.09 219.408044,159.73 219.168044,159.49 C217.128044,157.75 214.548044,156.7 211.848044,156.7 C205.878044,156.7 201.078044,161.53 201.078044,167.53 C201.078044,173.53 205.878044,178.27 211.848044,178.27 Z"></path>
    </g>
    <g class="logo-letter" style="--wave-delay:605ms">
      <path d="M245.976304,178.3 C246.276304,178.3 246.546304,178.06 246.546304,177.76 L246.546304,157.57 C246.546304,157.27 246.276304,157 245.976304,157 L243.216304,157 C242.886304,157 242.646304,157.27 242.646304,157.57 L242.646304,169.96 L242.616304,169.96 L230.136304,156.7 L229.386304,156.7 C229.086304,156.7 228.816304,156.94 228.816304,157.24 L228.816304,177.43 C228.816304,177.73 229.086304,178 229.386304,178 L232.116304,178 C232.446304,178 232.686304,177.73 232.686304,177.43 L232.686304,164.53 L232.716304,164.53 L245.256304,178.3 L245.976304,178.3 Z"></path>
    </g>
    <g class="logo-letter" style="--wave-delay:660ms">
      <path d="M262.404565,178.3 C266.634565,178.3 269.304565,175.45 269.304565,172.36 C269.304565,168.49 265.944565,166.75 263.034565,165.58 C260.604565,164.59 259.494565,163.63 259.494565,162.22 C259.494565,161.26 260.424565,160.12 262.134565,160.12 C263.784565,160.12 266.064565,161.62 266.304565,161.77 C266.664565,162.01 267.114565,161.77 267.354565,161.41 L268.494565,159.7 C268.704565,159.4 268.614565,158.89 268.314565,158.71 C267.714565,158.26 265.374565,156.7 262.314565,156.7 C257.544565,156.7 255.564565,159.79 255.564565,162.46 C255.564565,166 258.384565,167.8 261.204565,168.94 C263.724565,169.96 265.014565,171.01 265.014565,172.54 C265.014565,173.83 263.844565,174.85 262.284565,174.85 C260.469048,174.85 258.237455,173.315719 257.817227,173.03146 L257.754565,172.99 C257.484565,172.78 256.974565,172.78 256.734565,173.2 L255.654565,175.06 C255.384565,175.54 255.534565,175.69 255.804565,175.96 C256.404565,176.53 258.624565,178.3 262.404565,178.3 Z"></path>
    </g>
  </g>
</svg>`.trim();

    function initSiteBrand() {
        document.querySelectorAll('.site-brand').forEach(function (brand) {
            if (brand.querySelector('.site-brand-logo')) return;

            var logoImage = brand.querySelector('img[src*="logo-horizontal.svg"]');
            if (!logoImage) return;

            logoImage.insertAdjacentHTML('afterend', siteBrandLogoMarkup);
            logoImage.remove();
        });
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
    var _portraitResizeHandler = null;
    function initPortraitGradient() {
        var container = document.getElementById('dalit-hero-image');
        var gradient = document.getElementById('dalit-hero-gradient');
        if (!container || !gradient) return;

        // Remove previous resize listener to prevent accumulation on Barba nav
        if (_portraitResizeHandler) {
            window.removeEventListener('resize', _portraitResizeHandler);
        }

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
        _portraitResizeHandler = center;
        window.addEventListener('resize', center);
    }

    /* ── Back to top button ── */
    function initBackToTop() {
        var btn = document.querySelector('.back-to-top');
        if (!btn) return;

        var threshold = 600;
        var visible = false;

        function toggle() {
            var shouldShow = window.pageYOffset > threshold;
            if (shouldShow === visible) return;
            visible = shouldShow;
            btn.classList.toggle('is-visible', shouldShow);
        }

        window.addEventListener('scroll', toggle, { passive: true });
        toggle();

        btn.addEventListener('click', function () {
            if (lenis && !reducedMotion) {
                lenis.scrollTo(0, { duration: 1.4, easing: easeOutQuart });
            } else {
                window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
            }
        });
    }

    /* ── Main init ── */
    function initModules() {
        setYear();
        initSiteBrand();
        initMobileNav();
        initCaseMobileNav();
        initPortraitGradient();
        initBackToTop();

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

        // Init modules early — preloader covers content so setup is invisible
        initModules();

        if (!isHomePage()) {
            removePreloader();
            return;
        }

        if (!arrivedFromInternalNavigation) {
            runPreloader(function () {
                if (typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.refresh === 'function') {
                    ScrollTrigger.refresh();
                }
            });
            return;
        }

        removePreloader();
    }

    // Expose
    DS.reducedMotion = reducedMotion;
    DS.internalNavigationKey = internalNavigationKey;
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
