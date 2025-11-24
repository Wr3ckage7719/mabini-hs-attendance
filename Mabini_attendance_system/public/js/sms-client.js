/**
 * SMS Client
 * Handles SMS notifications for attendance
 * Integrates with existing SMS Mobile API service
 */

import { dataClient } from './data-client.js'

const SMS_API = './api/services/sms_service.php'

export const smsClient = {
  /**
   * Send check-in notification
   * @param {string} studentId
   * @param {string} parentPhone
   * @returns {Promise<{success, response, error}>}
   */
  async sendCheckInAlert(studentId, parentPhone) {
    try {
      // Get student details
      const student = await dataClient.getOne('students', studentId)
      if (student.error) throw new Error(student.error)

      const response = await fetch(SMS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_checkin',
          student: student.data,
          parent_phone: parentPhone,
          check_in_time: new Date().toISOString()
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'SMS send failed')

      return { success: true, response: result, error: null }
    } catch (error) {
      console.error('Check-in SMS error:', error)
      return { success: false, response: null, error: error.message }
    }
  },

  /**
   * Send check-out notification
   * @param {string} studentId
   * @param {string} parentPhone
   * @returns {Promise<{success, response, error}>}
   */
  async sendCheckOutAlert(studentId, parentPhone) {
    try {
      const student = await dataClient.getOne('students', studentId)
      if (student.error) throw new Error(student.error)

      const response = await fetch(SMS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_checkout',
          student: student.data,
          parent_phone: parentPhone,
          check_out_time: new Date().toISOString()
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'SMS send failed')

      return { success: true, response: result, error: null }
    } catch (error) {
      console.error('Check-out SMS error:', error)
      return { success: false, response: null, error: error.message }
    }
  },

  /**
   * Send absence alert
   * @param {string} studentId
   * @param {string} parentPhone
   * @param {string} date (YYYY-MM-DD)
   * @returns {Promise<{success, response, error}>}
   */
  async sendAbsenceAlert(studentId, parentPhone, date) {
    try {
      const student = await dataClient.getOne('students', studentId)
      if (student.error) throw new Error(student.error)

      const response = await fetch(SMS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_absence',
          student: student.data,
          parent_phone: parentPhone,
          date: date
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'SMS send failed')

      return { success: true, response: result, error: null }
    } catch (error) {
      console.error('Absence SMS error:', error)
      return { success: false, response: null, error: error.message }
    }
  },

  /**
   * Send daily summary
   * @param {string} parentPhone
   * @param {object} studentData
   * @returns {Promise<{success, response, error}>}
   */
  async sendDailySummary(parentPhone, studentData) {
    try {
      const response = await fetch(SMS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_daily_summary',
          parent_phone: parentPhone,
          student_name: `${studentData.first_name} ${studentData.last_name}`,
          status: studentData.status || 'Unknown',
          check_in_time: studentData.check_in_time || null,
          check_out_time: studentData.check_out_time || null
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'SMS send failed')

      return { success: true, response: result, error: null }
    } catch (error) {
      console.error('Daily summary SMS error:', error)
      return { success: false, response: null, error: error.message }
    }
  },

  /**
   * Send emergency alert
   * @param {string} parentPhone
   * @param {string} studentName
   * @param {string} alertMessage
   * @returns {Promise<{success, response, error}>}
   */
  async sendEmergencyAlert(parentPhone, studentName, alertMessage) {
    try {
      const response = await fetch(SMS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_emergency',
          parent_phone: parentPhone,
          student_name: studentName,
          alert_message: alertMessage
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'SMS send failed')

      return { success: true, response: result, error: null }
    } catch (error) {
      console.error('Emergency SMS error:', error)
      return { success: false, response: null, error: error.message }
    }
  },

  /**
   * Send custom SMS
   * @param {string} phone
   * @param {string} message
   * @returns {Promise<{success, response, error}>}
   */
  async sendCustom(phone, message) {
    try {
      const response = await fetch(SMS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_sms',
          recipient: phone,
          message: message
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'SMS send failed')

      return { success: true, response: result, error: null }
    } catch (error) {
      console.error('Custom SMS error:', error)
      return { success: false, response: null, error: error.message }
    }
  }
}

export default smsClient
