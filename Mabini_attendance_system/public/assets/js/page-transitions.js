// Lightweight page transition script for non-admin pages
// Adds the same slide-only entry/exit behavior used by admin pages.
(function(){
    try {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('page-anim', 'initial');
            requestAnimationFrame(() => setTimeout(() => document.body.classList.remove('initial'), 10));

            document.addEventListener('click', (e) => {
                const anchor = e.target.closest && e.target.closest('a');
                if (!anchor) return;

                const href = anchor.getAttribute('href');
                const target = anchor.getAttribute('target');

                if (!href) return;
                if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#') || href.startsWith('javascript:')) return;
                if (target === '_blank') return;

                e.preventDefault();
                document.body.classList.add('exit');
                setTimeout(() => { window.location.href = href; }, 180);
            }, true);
        });
    } catch (err) {
        console.warn('page-transitions init failed', err);
    }
})();
