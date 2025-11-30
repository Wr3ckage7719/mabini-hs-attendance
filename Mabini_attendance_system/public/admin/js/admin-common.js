/**
 * Admin Common Functionality
 * Shared utilities for all admin pages
 * FIXED: Removed inline auth checks that were causing login/logout loops
 */

import { authClient } from '../../js/auth-client.js';
import { dataClient } from '../../js/data-client.js';

console.log('[Admin] Loading admin-common.js');

let currentUser = null;
let authCheckInProgress = false;

/**
 * Get user from cache or Supabase (non-fatal if fails)
 */
async function getCachedOrCurrentUser() {
    // Check if already cached in sessionStorage
    const cached = sessionStorage.getItem('userData');
    if (cached) {
        try {
            currentUser = JSON.parse(cached);
            return currentUser;
        } catch (e) {
            sessionStorage.removeItem('userData');
        }
    }

    // Get current Supabase user (lightweight check)
    try {
        const user = await authClient.getCurrentUser();
        if (!user) return null;

        // Try to get profile, but don't fail if it errors
        try {
            const profile = await authClient.getUserProfile();
            if (profile) {
                currentUser = {
                    id: user.id,
                    email: user.email,
                    fullName: profile.full_name || (profile.first_name + ' ' + profile.last_name).trim(),
                    role: profile.role,
                    ...profile
                };
                sessionStorage.setItem('userData', JSON.stringify(currentUser));
                return currentUser;
            }
        } catch (profileError) {
            console.warn('[Admin] Profile fetch failed, using session only:', profileError);
        }

        return null;
    } catch (error) {
        console.error('[Admin] User fetch error:', error);
        return null;
    }
}

/**
 * Refresh user profile (non-critical, doesn't redirect)
 */
async function refreshUserProfile() {
    if (authCheckInProgress) return;
    authCheckInProgress = true;

    try {
        const user = await getCachedOrCurrentUser();
        if (user) {
            updateUserProfileUI(user);
        }
    } catch (error) {
        console.warn('[Admin] Profile refresh failed:', error);
    } finally {
        authCheckInProgress = false;
    }
}

/**
 * Update sidebar user info display
 */
function updateUserProfileUI(user) {
    if (!user) return;

    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) userNameEl.textContent = user.fullName || 'Admin';
    if (userRoleEl) {
        const role = user.role || 'Administrator';
        userRoleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }
    
    if (userAvatarEl) {
        const initials = (user.fullName || 'AD').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        userAvatarEl.textContent = initials;
    }
}

/**
 * Protect admin page - verify admin access
 */
async function protectAdminPage(allowedRoles = ['admin']) {
    try {
        const user = await getCachedOrCurrentUser();
        
        if (!user) {
            console.warn('[Admin] No user found, redirecting to login');
            window.location.href = '/admin/login.html';
            return false;
        }
        
        if (!allowedRoles.includes(user.role)) {
            console.warn('[Admin] User role', user.role, 'not in allowed roles:', allowedRoles);
            alert('Access denied. Admin access required.');
            window.location.href = '/index.html';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('[Admin] Page protection error:', error);
        window.location.href = '/admin/login.html';
        return false;
    }
}

/**
 * Get documents from collection (used by all admin pages)
 */
async function getDocuments(collection) {
    try {
        const { data, error } = await dataClient.getAll(collection);
        
        if (error) {
            console.error('[Admin] Error fetching documents from', collection, ':', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('[Admin] Error fetching documents from', collection, ':', error);
        return [];
    }
}

/**
 * Create document in collection
 */
async function createDocument(collection, data) {
    try {
        const result = await dataClient.create(collection, data);
        return result;
    } catch (error) {
        console.error('[Admin] Error creating document in', collection, ':', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update document in collection
 */
async function updateDocument(collection, id, data) {
    try {
        const result = await dataClient.update(collection, id, data);
        return result;
    } catch (error) {
        console.error('[Admin] Error updating document in', collection, ':', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete document from collection
 */
async function deleteDocument(collection, id) {
    try {
        const result = await dataClient.delete(collection, id);
        return result;
    } catch (error) {
        console.error('[Admin] Error deleting document from', collection, ':', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================================

window.protectAdminPage = protectAdminPage;
window.getDocuments = getDocuments;
window.createDocument = createDocument;
window.updateDocument = updateDocument;
window.deleteDocument = deleteDocument;
window.refreshUserProfile = refreshUserProfile;
window.currentUser = currentUser;
window.dataClient = dataClient;
window.authClient = authClient;
window.updateUserProfileUI = updateUserProfileUI;

// ============================================================================
// UI FUNCTIONS
// ============================================================================

// Sidebar toggle for mobile
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
};

// Logout function
window.doLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
        if (typeof logout === 'function') {
            logout();
        } else {
            import('../../shared/js/auth.js').then(mod => {
                if (mod && typeof mod.logout === 'function') {
                    mod.logout();
                } else {
                    sessionStorage.clear();
                    window.location.href = '/index.html';
                }
            }).catch(err => {
                console.warn('[Admin] Logout import failed:', err);
                sessionStorage.clear();
                window.location.href = '/index.html';
            });
        }
    }
};

console.log('[Admin] Admin common script ready');

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

// Set active sidebar item based on current location
function setActiveNavFromLocation() {
    try {
        const path = window.location.pathname || '';
        const filename = path.split('/').pop() || '';
        const menuItems = Array.from(document.querySelectorAll('.sidebar-menu .menu-item'));
        const persisted = (function(){ 
            try { return sessionStorage.getItem('lastActiveAdmin') || ''; } 
            catch(e){ return ''; } 
        })();
        const preferred = persisted || filename;

        let matched = false;
        menuItems.forEach(item => {
            const href = item.getAttribute('href') || '';
            const linkFile = href.split('/').pop();
            if (linkFile === preferred) {
                document.querySelectorAll('.sidebar-menu .menu-item.active').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                matched = true;
            }
        });

        if (!matched && menuItems.length > 0) {
            document.querySelectorAll('.sidebar-menu .menu-item.active').forEach(i => i.classList.remove('active'));
            menuItems[0].classList.add('active');
        }
    } catch (e) {
        console.warn('[Admin] setActiveNavFromLocation failed:', e);
    }
}

// Normalize admin top bar
function normalizeAdminTop() {
    try {
        const top = document.querySelector('.admin-top');
        if (!top || top.querySelector('.admin-top-actions')) return;

        const actions = document.createElement('div');
        actions.className = 'admin-top-actions';
        actions.innerHTML = `
            <div class="admin-search" role="search" aria-label="Admin search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <input type="search" placeholder="Search..." aria-label="Search" />
            </div>
            <button id="themeToggle" class="theme-toggle" aria-pressed="false" aria-label="Toggle theme">
                <span class="icon sun" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.2"/>
                    </svg>
                </span>
                <span class="icon moon" aria-hidden="true" style="display:none">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
            </button>
            <div style="display:flex;align-items:center;gap:10px">
                <div class="avatar" title="Administrator" aria-hidden="true">
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="3" stroke="currentColor" stroke-width="1.2"/>
                        <path d="M4 20c1.5-4 6-6 8-6s6.5 2 8 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <button id="logoutBtn" class="btn ghost" aria-label="Logout">Logout</button>
            </div>
        `;
        top.appendChild(actions);
    } catch (e) {
        console.warn('[Admin] normalizeAdminTop failed:', e);
    }
}

// Page transitions - DISABLED
function setupPageTransitions() {
    try {
        // Removed animation classes
        // document.body.classList.add('page-anim', 'initial');
        // requestAnimationFrame(() => {
        //     setTimeout(() => document.body.classList.remove('initial'), 10);
        // });

        document.addEventListener('click', (e) => {
            const anchor = e.target.closest && e.target.closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            const target = anchor.getAttribute('target');

            if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#') || href.startsWith('javascript:') || target === '_blank') {
                return;
            }

            e.preventDefault();

            try {
                const menuItem = anchor.closest('.menu-item');
                if (menuItem) {
                    document.querySelectorAll('.sidebar-menu .menu-item.active').forEach(i => i.classList.remove('active'));
                    menuItem.classList.add('active');
                    const hrefVal = menuItem.getAttribute('href') || href || '';
                    const linkFile = hrefVal.split('/').pop();
                    try { sessionStorage.setItem('lastActiveAdmin', linkFile); } catch(e) {}
                }
            } catch (_) {}

            // Navigate immediately without animation delay
            window.location.href = href;
        }, true);
    } catch (err) {
        console.warn('[Admin] Page transition setup failed:', err);
    }
}

// ============================================================================
// ATTACH LOGOUT BUTTON LISTENER
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            import('../../shared/js/auth.js').then(mod => {
                if (mod && typeof mod.logout === 'function') {
                    mod.logout();
                } else {
                    sessionStorage.clear();
                    window.location.href = '/index.html';
                }
            }).catch(err => {
                console.warn('[Admin] Logout button error:', err);
                sessionStorage.clear();
                window.location.href = '/index.html';
            });
        });
    }
});

// ============================================================================
// ON PAGE LOAD
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Admin] Page DOM ready');

    // Restore user from sessionStorage IMMEDIATELY (before anything else)
    try {
        const userData = sessionStorage.getItem('userData');
        if (userData) {
            const user = JSON.parse(userData);
            updateUserProfileUI(user);
        }
    } catch (e) {
        console.warn('[Admin] Restore user from session failed:', e);
    }

    // Protect page - verify admin access ONCE per page load
    (async () => {
        try {
            await protectAdminPage(['admin']);
        } catch (error) {
            console.warn('[Admin] Page protection check failed:', error);
            // Fall through - if session is cached, we can still display page
        }
    })();

    // Normalize UI
    normalizeAdminTop();
    setActiveNavFromLocation();
    setupPageTransitions();

    // Initialize responsive features
    initResponsiveTables();

    // Refresh profile in background (non-fatal)
    refreshUserProfile().catch(e => console.warn('[Admin] Profile refresh failed:', e));
});

// ============================================================================
// RESPONSIVE NAVIGATION FUNCTIONS
// ============================================================================

function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    sidebar.classList.toggle('show');
    backdrop.classList.toggle('show');
    if (window.innerWidth <= 1023) {
        document.body.classList.toggle('sidebar-open', sidebar.classList.contains('show'));
    }
}

function closeSidebar() {
    document.querySelector('.admin-sidebar').classList.remove('show');
    document.querySelector('.sidebar-backdrop').classList.remove('show');
    document.body.classList.remove('sidebar-open');
}

// Close sidebar when window is resized to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 1023) closeSidebar();
});

// Close sidebar when clicking menu items on tablet/mobile
if (window.innerWidth <= 1023) {
    document.querySelectorAll('.admin-sidebar .menu-item').forEach(item => {
        item.addEventListener('click', closeSidebar);
    });
}

// Initialize responsive tables
function initResponsiveTables() {
    const tables = document.querySelectorAll('.table-responsive');
    
    tables.forEach(table => {
        function checkScroll() {
            const hasScroll = table.scrollWidth > table.clientWidth;
            table.classList.toggle('has-scroll', hasScroll);
        }
        
        checkScroll();
        table.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
    });
}

// Make functions global
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;

console.log('[Admin] admin-common.js module loaded');
