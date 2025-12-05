/**
 * Supabase Client Configuration
 * Initialize Supabase connection
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.10/+esm'

// Supabase configuration (hardcoded for Apache/XAMPP)
const SUPABASE_URL = 'https://ddblgwzylvwuucnpmtzi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYmxnd3p5bHZ3dXVjbnBtdHppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDM4MjIsImV4cCI6MjA3OTM3OTgyMn0.EL7xhE0SbgvJ_R8ZAlkawOqRMi3yYMGFbGkqBMWMaJI'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials')
}

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error && error.message !== 'Auth session missing') {
      throw error
    }
    console.log('✅ Supabase connected')
    return true
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message)
    return false
  }
}

// Handle realtime subscriptions
export function subscribeToTable(table, filter = null) {
  return supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter
      },
      (payload) => {
        console.log(`🔔 Change detected on ${table}:`, payload)
        return payload
      }
    )
    .subscribe()
}

// Unsubscribe from table
export async function unsubscribeFromTable(subscription) {
  if (subscription) {
    await supabase.removeChannel(subscription)
  }
}

export default supabase
