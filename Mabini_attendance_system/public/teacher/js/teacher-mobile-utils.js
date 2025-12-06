/**
 * Teacher Mobile Table Enhancements
 * Handles scroll indicators and mobile table behavior
 */

(function() {
    'use strict';
    
    // Wait for DOM to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileTables);
    } else {
        initMobileTables();
    }
    
    function initMobileTables() {
        // Only apply on mobile devices
        if (window.innerWidth > 767) return;
        
        // Find all table-responsive containers
        const tableContainers = document.querySelectorAll('.table-responsive');
        
        tableContainers.forEach(container => {
            // Check if table is scrollable
            function checkScroll() {
                const isScrollable = container.scrollWidth > container.clientWidth;
                const isScrolled = container.scrollLeft > 0;
                
                if (isScrollable) {
                    container.classList.add('has-scroll');
                } else {
                    container.classList.remove('has-scroll');
                }
                
                if (isScrolled) {
                    container.classList.add('scrolled');
                } else {
                    container.classList.remove('scrolled');
                }
            }
            
            // Check on load
            checkScroll();
            
            // Check on scroll
            container.addEventListener('scroll', checkScroll, { passive: true });
            
            // Check on window resize
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(checkScroll, 100);
            }, { passive: true });
            
            // Add smooth scrolling behavior
            container.style.scrollBehavior = 'smooth';
        });
        
        // Add swipe hint on first load
        const firstTable = document.querySelector('.table-responsive');
        if (firstTable && !sessionStorage.getItem('tableSwipeHintShown')) {
            setTimeout(() => {
                // Gentle scroll to show user they can swipe
                if (firstTable.scrollWidth > firstTable.clientWidth) {
                    firstTable.scrollLeft = 50;
                    setTimeout(() => {
                        firstTable.scrollLeft = 0;
                    }, 800);
                    sessionStorage.setItem('tableSwipeHintShown', 'true');
                }
            }, 1000);
        }
    }
    
    // Re-initialize when tables are dynamically updated
    window.refreshMobileTables = function() {
        initMobileTables();
    };
    
    // Expose to global scope
    window.teacherMobileUtils = {
        init: initMobileTables,
        refresh: initMobileTables
    };
})();
