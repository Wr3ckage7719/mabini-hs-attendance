/**
 * Authentication Client
 * Handles user authentication, login, logout, registration
 * Replaces: public/api/auth.php
 */

import { supabase } from './supabase-client.js'

export const authClient = {
  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user, session, error}>}
   */
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Get user role and details
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          profile: userProfile
        },
        session: data.session,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        user: null,
        session: null,
        error: error.message
      }
    }
  },

  /**
   * Logout user
   * @returns {Promise<{success, error}>}
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Clear ALL session data - more thorough cleanup
      sessionStorage.clear()
      
      // Clear Supabase auth token from localStorage
      // Format: sb-<project-ref>-auth-token
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.includes('-auth-token')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear any other auth-related items
      localStorage.removeItem('lastLogin')
      localStorage.removeItem('userData')
      
      // Clear any cached user data from window
      if (window._cachedUser) delete window._cachedUser
      if (window._cachedProfile) delete window._cachedProfile

      return { success: true, error: null }
    } catch (error) {
      console.error('Logout error:', error)
      // Even if error occurs, try to clear local data
      sessionStorage.clear()
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.includes('-auth-token')) {
          localStorage.removeItem(key)
        }
      })
      return { success: false, error: error.message }
    }
  },

  /**
   * Register new user
   * @param {string} email
   * @param {string} password
   * @param {object} userData - { firstName, lastName, role, ... }
   * @returns {Promise<{success, user, error}>}
   */
  async register(email, password, userData = {}) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) throw authError

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            auth_id: authData.user.id,
            email,
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            full_name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            role: userData.role || 'student',
            phone: userData.phone || null,
            status: 'active'
          }
        ])
        .select()
        .single()

      if (profileError) throw profileError

      return {
        success: true,
        user: profile,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        user: null,
        error: error.message
      }
    }
  },

  /**
   * Reset password
   * @param {string} email
   * @returns {Promise<{success, error}>}
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      return {
        success: true,
        message: 'Password reset email sent',
        error: null
      }
    } catch (error) {
      return {
        success: false,
        message: null,
        error: error.message
      }
    }
  },

  /**
   * Update user password
   * @param {string} newPassword
   * @returns {Promise<{success, error}>}
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Update user profile
   * @param {object} data
   * @returns {Promise<{success, user, error}>}
   */
  async updateProfile(data) {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('No authenticated user')

      const { data: updated, error } = await supabase
        .from('users')
        .update(data)
        .eq('auth_id', user.id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        user: updated,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        user: null,
        error: error.message
      }
    }
  },

  /**
   * Get current authenticated user
   * @returns {Promise<user|null>}
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  /**
   * Get user profile with role and details
   * @returns {Promise<profile|null>}
   */
  async getUserProfile() {
    try {
      const user = await this.getCurrentUser()
      if (!user) return null

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (error) throw error
      return profile
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  },

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    const user = await this.getCurrentUser()
    return user !== null
  },

  /**
   * Check user role
   * @param {string|string[]} requiredRole
   * @returns {Promise<boolean>}
   */
  async hasRole(requiredRole) {
    try {
      const profile = await this.getUserProfile()
      if (!profile) return false

      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      return roles.includes(profile.role)
    } catch (error) {
      return false
    }
  },

  /**
   * Listen to authentication state changes
   * @param {function} callback
   * @returns {function} unsubscribe function
   */
  onAuthStateChange(callback) {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })

    // Return unsubscribe function
    return () => subscription?.unsubscribe()
  },

  /**
   * Verify student credentials (for student login)
   * @param {string} studentNumber
   * @param {string} password
   * @returns {Promise<{success, student, error}>}
   */
  async verifyStudentCredentials(studentNumber, password) {
    try {
      // Get student by student_number
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_number', studentNumber)
        .single()

      if (error) throw error
      if (!student) throw new Error('Student not found')

      // Verify password (for demo, simple comparison)
      // In production, use proper bcrypt comparison
      const expectedPassword = `Student${studentNumber.slice(-4)}@2025`
      if (password !== expectedPassword) {
        throw new Error('Invalid password')
      }

      return {
        success: true,
        student,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        student: null,
        error: error.message
      }
    }
  }
}

export default authClient
