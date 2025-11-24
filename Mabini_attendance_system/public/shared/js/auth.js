// Authentication Module - Supabase Integration
import { supabase } from '../../js/supabase-client.js';

// Current user state
let currentUser = null;
let userRole = null;

// Load current user from session
export function loadUserFromSession() {
  const userData = sessionStorage.getItem('userData');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      currentUser = user;
      userRole = user.role;
      return user;
    } catch (e) {
      sessionStorage.removeItem('userData');
    }
  }
  return null;
}

// Initialize on page load
loadUserFromSession();

// Input validation helpers
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
}

// Login function with role verification
export async function login(email, password, requiredRole = null) {
  try {
    console.log('Login attempt:', { email, role: requiredRole });
    
    // Input validation
    if (!validateEmail(email)) {
      console.log('Invalid email format');
      return { success: false, error: 'Invalid email format' };
    }
    if (!password || password.length < 6) {
      console.log('Password too short');
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Sanitize inputs
    email = sanitizeInput(email);

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.log('Login failed:', error.message);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return {
        success: false,
        error: 'Could not fetch user profile'
      };
    }

    // Check role if required
    if (requiredRole && profile.role !== requiredRole) {
      console.log('Role mismatch:', { required: requiredRole, actual: profile.role });
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Invalid role for this portal'
      };
    }

    // Store user data in session
    const userData = {
      id: data.user.id,
      email: data.user.email,
      role: profile.role,
      name: profile.name,
      full_name: profile.full_name || profile.name
    };
    
    sessionStorage.setItem('userData', JSON.stringify(userData));
    currentUser = userData;
    userRole = userData.role;

    console.log('Login successful, user:', userData);
    
    return {
      success: true,
      user: userData,
      role: userData.role
    };
  } catch (error) {
    console.error('Login exception:', error);
    return {
      success: false,
      error: 'Connection error. Please try again.'
    };
  }
}

// Logout function
export async function logout(redirectUrl = '/index.html') {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }

  // Clear all session data locally
  sessionStorage.clear();
  localStorage.removeItem('sb-ddblgwzylvwuucnpmtzi-auth-token');
  currentUser = null;
  userRole = null;
  window.userData = null;

  // Redirect to index (use root-relative path for Vercel)
  try {
    window.location.href = redirectUrl;
  } catch (e) {
    console.error('Redirect failed:', e);
  }

  return { success: true };
}

// Register new user (admin only)
export async function registerUser(userData) {
  try {
    // Validate inputs
    if (!validateEmail(userData.email)) {
      return { success: false, error: 'Invalid email format' };
    }
    if (!userData.password || userData.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    // Create auth user in Supabase
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: authUser.user.id,
        email: userData.email,
        name: userData.name || userData.full_name,
        full_name: userData.full_name || userData.name,
        role: userData.role || 'user',
        created_at: new Date().toISOString()
      }]);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true, user: authUser.user };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Registration failed. Please try again.'
    };
  }
}

// Password reset
export async function resetPassword(email) {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/Mabini_HS_Attendance/Mabini_attendance_system/public/shared/change-password.html'
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: 'Password reset email sent. Check your inbox.'
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'Password reset failed. Please try again.'
    };
  }
}

// Check if user is authenticated
export async function checkAuth(requiredRoles = []) {
  try {
    // Get current session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      // Try fallback to sessionStorage
      const userData = loadUserFromSession();
      if (userData) {
        if (requiredRoles.length > 0 && !requiredRoles.includes(userData.role)) {
          return { authenticated: false, reason: 'insufficient_permissions' };
        }
        return { authenticated: true, user: userData, role: userData.role };
      }
      return { authenticated: false, reason: 'not_logged_in' };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return { authenticated: false, reason: 'not_logged_in' };
    }

    // Check if user has required role
    if (requiredRoles.length > 0 && !requiredRoles.includes(profile.role)) {
      return { authenticated: false, reason: 'insufficient_permissions' };
    }
    
    // Update session storage
    const userData = {
      id: session.user.id,
      email: session.user.email,
      role: profile.role,
      name: profile.name,
      full_name: profile.full_name || profile.name
    };
    
    sessionStorage.setItem('userData', JSON.stringify(userData));
    currentUser = userData;
    userRole = userData.role;
    
    return { authenticated: true, user: userData, role: userData.role };
  } catch (error) {
    console.error('Check auth error:', error);
    return { authenticated: false, reason: 'error' };
  }
}

// Get current user data
export function getCurrentUser() {
  const userData = sessionStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
}

// Check if user has specific role
export function hasRole(role) {
  const user = getCurrentUser();
  return user && user.role === role;
}

// Require authentication (redirect to login if not authenticated)
export async function requireAuth(allowedRoles = []) {
  const authStatus = await checkAuth(allowedRoles);
  
  if (!authStatus.authenticated) {
    const reason = authStatus.reason;
    if (reason === 'insufficient_permissions') {
      alert('Access denied. Insufficient permissions.');
      window.location.href = '/Mabini_HS_Attendance/Mabini_attendance_system/public/index.html';
    } else {
      window.location.href = '/Mabini_HS_Attendance/Mabini_attendance_system/public/index.html';
    }
    return false;
  }
  
  return true;
}

// Export for backward compatibility
export { currentUser, userRole };
