/**
 * Main API Index
 * Exports all API clients for easy importing
 */

export { default as supabase, testConnection, subscribeToTable, unsubscribeFromTable } from './supabase-client.js'
export { default as authClient } from './auth-client.js'
export { default as dataClient } from './data-client.js'
export { default as attendanceClient } from './attendance-client.js'
export { default as smsClient } from './sms-client.js'
export { default as iotClient } from './iot-client.js'

// Convenience exports
export const API = {
  auth: authClient,
  data: dataClient,
  attendance: attendanceClient,
  sms: smsClient,
  iot: iotClient
}

export default API
