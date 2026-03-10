/* ─── DalitSite — Page Transitions ───
 *  Barba.js transitions with GSAP.
 *  Fade+Y leave/enter, ScrollTrigger cleanup.
 */
(function (DS) {
    'use strict';

    var internalNavigationKey = 'ds_internal_navigation';
    var initialized = false;

    function init() {
        if (initialized) return;
        if (DS.reducedMotion) return;
        if (typeof barba === 'undefined') return;

        initialized = true;

        barba.hooks.after(function () {
            sessionStorage.removeItem(internalNavigationKey);
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

                    return gsap.to(data.current.container, {
                        opacity: 0,
                        y: -30,
                        duration: 0.5,
                        ease: 'power2.inOut'
                    });
                },

                enter: function (data) {
                    // Scroll reset
                    window.scrollTo(0, 0);
                    if (DS.lenis) {
                        DS.lenis.scrollTo(0, { immediate: true });
                    }

                    if (typeof gsap === 'undefined') {
                        if (typeof Splitting !== 'undefined') {
                            Splitting({ target: '[data-split]', by: 'chars' });
                        }
                        if (typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.refresh === 'function') {
                            ScrollTrigger.refresh();
                        }
                        DS.initModules();
                        if (DS.scrollToHash && window.location.hash) {
                            DS.scrollToHash(window.location.hash, true);
                        }
                        return;
                    }

                    return gsap.fromTo(data.next.container,
                        { opacity: 0, y: 30 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.6,
                            ease: 'power2.out',
                            onComplete: function () {
                                // Re-init everything for the new page
                                if (typeof Splitting !== 'undefined') {
                                    Splitting({ target: '[data-split]', by: 'chars' });
                                }

                                if (typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.refresh === 'function') {
                                    ScrollTrigger.refresh();
                                }

                                DS.initModules();
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
