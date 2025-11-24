// =====================================================
// SESSION GUARD - Authentication Protection
// Automatically protect pages and redirect unauthorized users
// =====================================================

import { authClient } from './auth-client.js';

/**
 * Protect a page with authentication
 * @param {string|string[]} allowedRoles - Required role(s) to access the page
 * @param {string} redirectUrl - Where to redirect if not authenticated (default: login page)
 */
export async function protectPage(allowedRoles = null, redirectUrl = null) {
    try {
        // Get current user
        const user = await authClient.getCurrentUser();
        
        if (!user) {
            // Not authenticated - redirect to appropriate login page
            const path = window.location.pathname;
            if (!redirectUrl) {
                if (path.includes('/admin/')) {
                    redirectUrl = '../admin/login.html';
                } else if (path.includes('/teacher/')) {
                    redirectUrl = '../teacher/login.html';
                } else if (path.includes('/student/')) {
                    redirectUrl = '../student/login.html';
                } else {
                    redirectUrl = '../index.html';
                }
            }
            window.location.href = redirectUrl;
            return false;
        }
        
        // Get user profile to check role
        const profile = await authClient.getUserProfile(user.id);
        
        if (!profile) {
            // No profile found - logout and redirect
            await authClient.logout();
            window.location.href = redirectUrl || '../index.html';
            return false;
        }
        
        // Auto-detect required role if not specified
        if (!allowedRoles) {
            const path = window.location.pathname;
            if (path.includes('/admin/')) {
                allowedRoles = 'admin';
            } else if (path.includes('/teacher/')) {
                allowedRoles = 'teacher';
            } else if (path.includes('/student/')) {
                allowedRoles = 'student';
            }
        }
        
        // Check role if specified
        if (allowedRoles) {
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
            
            if (!roles.includes(profile.role)) {
                // CRITICAL: Wrong role - logout and redirect to correct login page
                await authClient.logout();
                
                // Redirect based on the portal they tried to access
                const path = window.location.pathname;
                if (path.includes('/admin/')) {
                    window.location.href = '../admin/login.html';
                } else if (path.includes('/teacher/')) {
                    window.location.href = '../teacher/login.html';
                } else if (path.includes('/student/')) {
                    window.location.href = '../student/login.html';
                } else {
                    window.location.href = '../index.html';
                }
                return false;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('Session guard error:', error);
        // On error, logout to be safe
        await authClient.logout();
        window.location.href = redirectUrl || '../index.html';
        return false;
    }
}

/**
 * Check authentication without redirect (for conditional UI)
 */
export async function checkAuth() {
    try {
        const user = await authClient.getCurrentUser();
        if (!user) return { authenticated: false };
        
        const profile = await authClient.getUserProfile(user.id);
        return {
            authenticated: true,
            user,
            profile,
            role: profile?.role
        };
    } catch (error) {
        console.error('Auth check error:', error);
        return { authenticated: false };
    }
}

/**
 * Get current user with profile
 */
export async function getCurrentUserWithProfile() {
    try {
        const user = await authClient.getCurrentUser();
        if (!user) return null;
        
        const profile = await authClient.getUserProfile(user.id);
        return {
            ...user,
            profile
        };
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
}

/**
 * Auto-logout listener - redirects when session expires
 */
export function setupAutoLogout(redirectUrl = null) {
    authClient.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            // Session expired or user logged out
            const path = window.location.pathname;
            if (!redirectUrl) {
                if (path.includes('/admin/')) {
                    redirectUrl = '../admin/login.html';
                } else if (path.includes('/teacher/')) {
                    redirectUrl = '../teacher/login.html';
                } else if (path.includes('/student/')) {
                    redirectUrl = '../student/login.html';
                } else {
                    redirectUrl = '../index.html';
                }
            }
            window.location.href = redirectUrl;
        }
    });
}
