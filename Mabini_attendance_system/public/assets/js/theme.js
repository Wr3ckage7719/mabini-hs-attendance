function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial theme based on user preference or stored value
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
        document.documentElement.setAttribute('data-theme', storedTheme);
        document.documentElement.setAttribute('data-bs-theme', storedTheme);
    } else if (prefersDark.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.setAttribute('data-bs-theme', 'dark');
    }

    // Toggle theme (guard if toggle not present)
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            // update icons if present
            const sun = themeToggle.querySelector('.sun') || themeToggle.querySelector('.sun-icon');
            const moon = themeToggle.querySelector('.moon') || themeToggle.querySelector('.moon-icon');
            if (sun && moon) {
                if (newTheme === 'dark') { sun.style.display = 'none'; moon.style.display = 'inline-block'; themeToggle.setAttribute('aria-pressed','true'); }
                else { sun.style.display = 'inline-block'; moon.style.display = 'none'; themeToggle.setAttribute('aria-pressed','false'); }
            }
        });
    }

    // Sync icons on init
    (function syncIcons(){
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        const sun = toggle.querySelector('.sun') || toggle.querySelector('.sun-icon');
        const moon = toggle.querySelector('.moon') || toggle.querySelector('.moon-icon');
        const current = document.documentElement.getAttribute('data-theme') || (prefersDark.matches ? 'dark' : 'light');
        if (sun && moon) {
            if (current === 'dark') { sun.style.display = 'none'; moon.style.display = 'inline-block'; toggle.setAttribute('aria-pressed','true'); }
            else { sun.style.display = 'inline-block'; moon.style.display = 'none'; toggle.setAttribute('aria-pressed','false'); }
        }
    })();

    // Listen for system theme changes
    prefersDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const theme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            document.documentElement.setAttribute('data-bs-theme', theme);
        }
    });
}

document.addEventListener('DOMContentLoaded', initTheme);
