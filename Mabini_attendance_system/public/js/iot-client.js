/**
 * IoT Device Client
 * Handles IoT device integration and verification
 */

import { supabase } from './supabase-client.js'
import { dataClient } from './data-client.js'
import { attendanceClient } from './attendance-client.js'

export const iotClient = {
  /**
   * Verify entry (check-in/check-out)
   * @param {string} studentId
   * @param {string} deviceId
   * @param {string} faceImage - Base64 encoded
   * @returns {Promise<{success, action, log, error}>}
   */
  async verifyEntry(studentId, deviceId = 'scanner', faceImage = null) {
    try {
      // Get student
      const student = await dataClient.getOne('students', studentId)
      if (student.error) throw new Error('Student not found')

      // Check if student already checked in today
      const today = new Date().toISOString().split('T')[0]
      const { data: todayLogs, error: logsError } = await supabase
        .from('entrance_logs')
        .select('*')
        .eq('student_id', studentId)
        .gte('scan_time', `${today}T00:00:00`)
        .order('scan_time', { ascending: false })
        .limit(1)

      if (logsError) throw logsError

      // Determine action: check-in or check-out
      const lastLog = todayLogs?.length > 0 ? todayLogs[0] : null
      const isCheckOut = lastLog && lastLog.scan_type === 'entry' && !lastLog.check_out_time

      if (isCheckOut) {
        // Record check-out
        return await attendanceClient.checkOut(studentId, deviceId, { faceImageUrl: faceImage })
      } else {
        // Record check-in
        return await attendanceClient.checkIn(studentId, deviceId, { faceImageUrl: faceImage })
      }
    } catch (error) {
      return { success: false, action: null, log: null, error: error.message }
    }
  },

  /**
   * Register new device
   * @param {string} deviceId
   * @param {string} deviceName
   * @param {string} deviceType - 'scanner', 'camera', 'sensor'
   * @param {string} location
   * @param {string} apiKey
   * @returns {Promise<{success, device, error}>}
   */
  async registerDevice(deviceId, deviceName, deviceType = 'scanner', location = null, apiKey = null) {
    try {
      const { data, error } = await supabase
        .from('iot_devices')
        .insert([
          {
            device_id: deviceId,
            device_name: deviceName,
            device_type: deviceType,
            location: location,
            api_key: apiKey,
            status: 'active'
          }
        ])
        .select()
        .single()

      if (error) throw error

      return { success: true, device: data, error: null }
    } catch (error) {
      return { success: false, device: null, error: error.message }
    }
  },

  /**
   * Update device status
   * @param {string} deviceId
   * @param {string} status - 'active', 'inactive', 'maintenance'
   * @returns {Promise<{success, device, error}>}
   */
  async updateDeviceStatus(deviceId, status = 'active') {
    try {
      const { data, error } = await supabase
        .from('iot_devices')
        .update({
          status: status,
          last_seen: new Date().toISOString()
        })
        .eq('device_id', deviceId)
        .select()
        .single()

      if (error) throw error

      return { success: true, device: data, error: null }
    } catch (error) {
      return { success: false, device: null, error: error.message }
    }
  },

  /**
   * Get device info
   * @param {string} deviceId
   * @returns {Promise<{data, error}>}
   */
  async getDevice(deviceId) {
    try {
      const { data, error } = await supabase
        .from('iot_devices')
        .select('*')
        .eq('device_id', deviceId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  /**
   * Get all devices
   * @returns {Promise<{data, error}>}
   */
  async getAllDevices() {
    try {
      const { data, error } = await supabase
        .from('iot_devices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  /**
   * Send heartbeat (device is alive)
   * @param {string} deviceId
   * @returns {Promise<{success, error}>}
   */
  async sendHeartbeat(deviceId) {
    try {
      const { error } = await supabase
        .from('iot_devices')
        .update({ last_seen: new Date().toISOString() })
        .eq('device_id', deviceId)

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

export default iotClient
