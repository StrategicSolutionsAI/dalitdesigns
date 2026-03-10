/* ─── DalitSite — Magnetic Buttons ───
 *  Mouse proximity pulls buttons (0.3 multiplier).
 *  Elastic snap-back on mouse leave.
 */
(function (DS) {
    'use strict';

    var targets = [];

    function init() {
        if (DS.reducedMotion) return;
        if (!window.matchMedia('(pointer: fine)').matches) return;

        var selectors = '.hero-cta, .nav-cta, .pill, .nav-pill, .button-primary';
        var els = document.querySelectorAll(selectors);

        els.forEach(function (el) {
            el.addEventListener('mousemove', onMove);
            el.addEventListener('mouseleave', onLeave);
            targets.push(el);
        });
    }

    function onMove(e) {
        var el = this;
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;

        gsap.to(el, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.3,
            ease: 'power2.out'
        });
    }

    function onLeave() {
        gsap.to(this, {
            x: 0,
            y: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.4)'
        });
    }

    function destroy() {
        targets.forEach(function (el) {
            el.removeEventListener('mousemove', onMove);
            el.removeEventListener('mouseleave', onLeave);
            gsap.set(el, { x: 0, y: 0 });
        });
        targets = [];
    }

    DS.Magnetic = { init: init, destroy: destroy };

})(window.DalitSite = window.DalitSite || {});
