/* ─── DalitSite — Page Transitions ───
 *  Barba.js transitions with GSAP.
 *  Fade+Y leave/enter, ScrollTrigger cleanup.
 */
(function (DS) {
    'use strict';

    var initialized = false;

    function init() {
        if (initialized) return;
        if (DS.reducedMotion) return;
        if (typeof barba === 'undefined') return;

        initialized = true;

        barba.hooks.after(function () {
            sessionStorage.removeItem(DS.internalNavigationKey);
        });

        barba.init({
            preventRunning: true,
            transitions: [{
                name: 'fade-slide',

                leave: function (data) {
                    // Kill all ScrollTrigger instances
                    DS.destroyScrollTriggers();

                    // Destroy blob if present
                    if (DS.Blob && DS.Blob.destroy) DS.Blob.destroy();

                    // Destroy magnetic buttons
                    if (DS.Magnetic && DS.Magnetic.destroy) DS.Magnetic.destroy();

                    // Remove motion-ready so the incoming page's content
                    // is visible behind the container fade-in
                    document.documentElement.classList.remove('motion-ready');

                    return gsap.to(data.current.container, {
                        opacity: 0,
                        y: -30,
                        duration: 0.5,
                        ease: 'power2.inOut'
                    });
                },

                enter: function (data) {
                    // Remove old container so it doesn't affect layout
                    // or pollute querySelectorAll during re-init
                    if (data.current.container.parentNode) {
                        data.current.container.remove();
                    }

                    // Scroll reset
                    window.scrollTo(0, 0);
                    if (DS.lenis) {
                        DS.lenis.scrollTo(0, { immediate: true });
                    }

                    return gsap.fromTo(data.next.container,
                        { opacity: 0, y: 30 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.6,
                            ease: 'power2.out',
                            onComplete: function () {
                                // Clear GSAP inline styles so layout calculations
                                // (sticky header, ScrollTrigger positions) are accurate
                                gsap.set(data.next.container, { clearProps: 'all' });

                                // Re-init text splits for the new page
                                if (typeof Splitting !== 'undefined') {
                                    Splitting({ target: '[data-split]', by: 'chars' });
                                }

                                DS.initModules();

                                // Refresh AFTER new ScrollTrigger instances are created
                                if (typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.refresh === 'function') {
                                    ScrollTrigger.refresh();
                                }

                                if (DS.scrollToHash && window.location.hash) {
                                    DS.scrollToHash(window.location.hash, true);
                                }
                            }
                        }
                    );
                }
            }]
        });
    }

    DS.Transitions = { init: init };

})(window.DalitSite = window.DalitSite || {});
