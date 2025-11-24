/**
 * Ensure Authentication Module
 * Makes sure admin pages have valid Supabase auth session
 * Fixes the RLS blocking issue by ensuring proper auth context
 */

import { supabase } from '../../js/supabase-client.js';

/**
 * Ensure user is authenticated before allowing operations
 * This mimics what the test page does - it checks/refreshes auth session
 */
export async function ensureAuthenticated() {
    try {
        // Check if we have an active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('[EnsureAuth] Session check error:', sessionError);
            throw new Error('Session check failed');
        }
        
        if (!session) {
            console.warn('[EnsureAuth] No active session found');
            // Redirect to login if no session
            window.location.href = '/admin/login.html';
            throw new Error('No active session');
        }
        
        console.log('[EnsureAuth] ✅ Active session found for:', session.user.email);
        return session;
    } catch (error) {
        console.error('[EnsureAuth] Authentication check failed:', error);
        throw error;
    }
}

/**
 * Get current authenticated user
 */
export async function getCurrentAuthUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        console.warn('[EnsureAuth] No authenticated user');
        return null;
    }
    
    return user;
}

/**
 * Refresh the authentication session
 */
export async function refreshAuthSession() {
    try {
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
            console.error('[EnsureAuth] Session refresh failed:', error);
            throw error;
        }
        
        console.log('[EnsureAuth] ✅ Session refreshed');
        return data.session;
    } catch (error) {
        console.error('[EnsureAuth] Failed to refresh session:', error);
        throw error;
    }
}

/**
 * Initialize authentication for admin pages
 * Call this on every admin page load
 */
export async function initAdminAuth() {
    try {
        console.log('[EnsureAuth] Initializing admin authentication...');
        
        // Ensure we have a valid session
        const session = await ensureAuthenticated();
        
        if (!session) {
            console.error('[EnsureAuth] No session - redirecting to login');
            window.location.href = '/admin/login.html';
            return false;
        }
        
        console.log('[EnsureAuth] ✅ Admin authentication initialized');
        return true;
    } catch (error) {
        console.error('[EnsureAuth] Admin auth initialization failed:', error);
        return false;
    }
}

// Export supabase instance for direct use
export { supabase };
