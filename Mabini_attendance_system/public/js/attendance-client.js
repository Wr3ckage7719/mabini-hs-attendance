/**
 * Attendance Client
 * Specific operations for attendance and entrance logs
 * Supports check-in, check-out, attendance marking
 */

import { supabase } from './supabase-client.js'
import { dataClient } from './data-client.js'
import { smsClient } from './sms-client.js'

export const attendanceClient = {
  /**
   * Record student check-in
   * @param {string} studentId
   * @param {string} deviceId
   * @param {object} additionalData
   * @returns {Promise<{success, log, error}>}
   */
  async checkIn(studentId, deviceId = 'manual', additionalData = {}) {
    try {
      // Get student details
      const student = await dataClient.getOne('students', studentId)
      if (student.error) throw new Error(student.error)

      // Record entrance log
      const { data: log, error } = await supabase
        .from('entrance_logs')
        .insert([
          {
            student_id: studentId,
            scan_type: 'entry',
            device_id: deviceId,
            location: additionalData.location || null,
            face_image_url: additionalData.faceImageUrl || null,
            scan_time: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Send SMS notification to parent
      if (student.data?.guardian_contact) {
        try {
          await smsClient.sendCheckInAlert(studentId, student.data.guardian_contact)
        } catch (smsError) {
          console.warn('SMS notification failed:', smsError)
          // Don't fail the check-in if SMS fails
        }
      }

      return { success: true, log, error: null }
    } catch (error) {
      return { success: false, log: null, error: error.message }
    }
  },

  /**
   * Record student check-out
   * @param {string} studentId
   * @param {string} deviceId
   * @param {object} additionalData
   * @returns {Promise<{success, log, error}>}
   */
  async checkOut(studentId, deviceId = 'manual', additionalData = {}) {
    try {
      // Get student details
      const student = await dataClient.getOne('students', studentId)
      if (student.error) throw new Error(student.error)

      // Record entrance log
      const { data: log, error } = await supabase
        .from('entrance_logs')
        .insert([
          {
            student_id: studentId,
            scan_type: 'exit',
            device_id: deviceId,
            location: additionalData.location || null,
            scan_time: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Send SMS notification to parent
      if (student.data?.guardian_contact) {
        try {
          await smsClient.sendCheckOutAlert(studentId, student.data.guardian_contact)
        } catch (smsError) {
          console.warn('SMS notification failed:', smsError)
        }
      }

      return { success: true, log, error: null }
    } catch (error) {
      return { success: false, log: null, error: error.message }
    }
  },

  /**
   * Get today's attendance for a student
   * @param {string} studentId
   * @returns {Promise<{data, error}>}
   */
  async getTodayAttendance(studentId) {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('entrance_logs')
        .select('*')
        .eq('student_id', studentId)
        .eq('scan_time', today)
        .order('scan_time', { ascending: true })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  /**
   * Get attendance for a date range
   * @param {string} studentId
   * @param {string} startDate (YYYY-MM-DD)
   * @param {string} endDate (YYYY-MM-DD)
   * @returns {Promise<{data, error}>}
   */
  async getAttendanceRange(studentId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('entrance_logs')
        .select('*')
        .eq('student_id', studentId)
        .gte('scan_time', `${startDate}T00:00:00`)
        .lte('scan_time', `${endDate}T23:59:59`)
        .order('scan_time', { ascending: false })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  /**
   * Mark student as present
   * @param {string} studentId
   * @param {string} sectionId
   * @param {string} date (YYYY-MM-DD)
   * @returns {Promise<{success, record, error}>}
   */
  async markPresent(studentId, sectionId, date) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .upsert(
          {
            student_id: studentId,
            section_id: sectionId,
            attendance_date: date,
            status: 'present',
            time_in: new Date().toISOString().split('T')[1].substring(0, 8)
          },
          { onConflict: 'student_id,section_id,attendance_date' }
        )
        .select()
        .single()

      if (error) throw error

      return { success: true, record: data, error: null }
    } catch (error) {
      return { success: false, record: null, error: error.message }
    }
  },

  /**
   * Mark student as absent
   * @param {string} studentId
   * @param {string} sectionId
   * @param {string} date (YYYY-MM-DD)
   * @param {string} remarks
   * @returns {Promise<{success, record, error}>}
   */
  async markAbsent(studentId, sectionId, date, remarks = '') {
    try {
      const student = await dataClient.getOne('students', studentId)
      if (student.error) throw new Error(student.error)

      const { data, error } = await supabase
        .from('attendance')
        .upsert(
          {
            student_id: studentId,
            section_id: sectionId,
            attendance_date: date,
            status: 'absent',
            remarks: remarks
          },
          { onConflict: 'student_id,section_id,attendance_date' }
        )
        .select()
        .single()

      if (error) throw error

      // Send absence notification
      if (student.data?.guardian_contact) {
        try {
          await smsClient.sendAbsenceAlert(studentId, student.data.guardian_contact, date)
        } catch (smsError) {
          console.warn('SMS notification failed:', smsError)
        }
      }

      return { success: true, record: data, error: null }
    } catch (error) {
      return { success: false, record: null, error: error.message }
    }
  },

  /**
   * Mark student as late
   * @param {string} studentId
   * @param {string} sectionId
   * @param {string} date (YYYY-MM-DD)
   * @param {string} timeIn
   * @returns {Promise<{success, record, error}>}
   */
  async markLate(studentId, sectionId, date, timeIn = null) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .upsert(
          {
            student_id: studentId,
            section_id: sectionId,
            attendance_date: date,
            status: 'late',
            time_in: timeIn || new Date().toISOString().split('T')[1].substring(0, 8)
          },
          { onConflict: 'student_id,section_id,attendance_date' }
        )
        .select()
        .single()

      if (error) throw error

      return { success: true, record: data, error: null }
    } catch (error) {
      return { success: false, record: null, error: error.message }
    }
  },

  /**
   * Get attendance report for a date range
   * @param {string} sectionId
   * @param {string} startDate (YYYY-MM-DD)
   * @param {string} endDate (YYYY-MM-DD)
   * @returns {Promise<{data, error}>}
   */
  async getAttendanceReport(sectionId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          students:student_id (
            id,
            student_number,
            first_name,
            last_name,
            grade_level,
            section
          )
        `)
        .eq('section_id', sectionId)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: false })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  /**
   * Get attendance statistics
   * @param {string} studentId
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<{stats, error}>}
   */
  async getAttendanceStats(studentId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('status, COUNT(*) as count', { count: 'exact' })
        .eq('student_id', studentId)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .group_by('status')

      if (error) throw error

      // Process data into stats
      const stats = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0
      }

      data.forEach((record) => {
        stats[record.status] = record.count
        stats.total += record.count
      })

      return { stats, error: null }
    } catch (error) {
      return { stats: null, error: error.message }
    }
  }
}

export default attendanceClient
