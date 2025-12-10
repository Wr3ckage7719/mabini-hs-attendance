/**
 * Data Access Client
 * Generic CRUD operations for all tables
 * Replaces: public/api/data.php
 */

import { supabase } from './supabase-client.js'

export const dataClient = {
  /**
   * Get all records from a table
   * @param {string} table
   * @param {array} filters - [{ field, operator, value }]
   * @param {string} orderBy
   * @param {number} limit
   * @returns {Promise<{data, error}>}
   */
  async getAll(table, filters = [], orderBy = 'created_at', limit = 1000) {
    try {
      let query = supabase.from(table).select('*')

      // Apply filters
      for (const filter of filters) {
        const { field, operator, value } = filter

        if (operator === '==') {
          query = query.eq(field, value)
        } else if (operator === '!=') {
          query = query.neq(field, value)
        } else if (operator === '>') {
          query = query.gt(field, value)
        } else if (operator === '<') {
          query = query.lt(field, value)
        } else if (operator === '>=') {
          query = query.gte(field, value)
        } else if (operator === '<=') {
          query = query.lte(field, value)
        } else if (operator === 'in') {
          query = query.in(field, value)
        } else if (operator === 'contains') {
          query = query.ilike(field, `%${value}%`)
        }
      }

      // Order by and limit
      const { data, error } = await query
        .order(orderBy, { ascending: true })
        .limit(limit)

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  /**
   * Get single record by ID
   * @param {string} table
   * @param {string|number} id
   * @returns {Promise<{data, error}>}
   */
  async getOne(table, id) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  /**
   * Create new record
   * @param {string} table
   * @param {object} data
   * @returns {Promise<{data, error}>}
   */
  async create(table, data) {
    try {
      // Validate required fields
      if (!data || Object.keys(data).length === 0) {
        throw new Error('No data provided')
      }

      // For students, teachers, and attendance tables, skip auth check since they use sessionStorage
      const skipAuthCheck = ['students', 'teachers', 'attendance'].includes(table);
      
      if (!skipAuthCheck) {
        // Ensure we have an active session for other tables
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          console.warn('No active session, attempting to refresh...')
          // Try to refresh the session
          const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError || !newSession) {
            throw new Error('Authentication required. Please login again.')
          }
        }
      }

      const { data: result, error } = await supabase
        .from(table)
        .insert([data])
        .select()
        .single()

      if (error) throw error

      return { data: result, error: null }
    } catch (error) {
      console.error(`[dataClient] Create error on ${table}:`, error)
      return { data: null, error: error.message }
    }
  },

  /**
   * Batch create multiple records
   * @param {string} table
   * @param {array} records
   * @returns {Promise<{data, error}>}
   */
  async batchCreate(table, records) {
    try {
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error('Records must be a non-empty array')
      }

      const { data, error } = await supabase
        .from(table)
        .insert(records)
        .select()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  /**
   * Update record
   * @param {string} table
   * @param {string|number} id
   * @param {object} data
   * @returns {Promise<{data, error}>}
   */
  async update(table, id, data) {
    try {
      if (!data || Object.keys(data).length === 0) {
        throw new Error('No data to update')
      }

      console.log(`[dataClient] Updating ${table} with id:`, id, 'data:', data);
      console.log(`[dataClient] ID type:`, typeof id, 'ID value:', id);

      // Validate ID is not null/undefined
      if (!id) {
        throw new Error('Invalid ID: ID is required for update');
      }

      // For students, teachers, and attendance tables, skip auth check since they use sessionStorage
      const skipAuthCheck = ['students', 'teachers', 'attendance'].includes(table);
      
      if (!skipAuthCheck) {
        // Ensure we have an active session for other tables
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          console.warn('No active session, attempting to refresh...')
          const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError || !newSession) {
            throw new Error('Authentication required. Please login again.')
          }
        }
      }

      // First, try update with select
      let { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()

      if (error) {
        console.error(`[dataClient] Supabase update error:`, error);
        console.error(`[dataClient] Error details - code:`, error.code, 'message:', error.message, 'details:', error.details);
        throw error;
      }

      console.log(`[dataClient] Update result:`, result);
      console.log(`[dataClient] Update result length:`, result?.length);

      // If select returned empty, try without select to just confirm update worked
      if (!result || (Array.isArray(result) && result.length === 0)) {
        console.log(`[dataClient] No data returned from select, trying update without select...`);
        const { error: updateError } = await supabase
          .from(table)
          .update(data)
          .eq('id', id);
        
        if (updateError) {
          console.error(`[dataClient] Update without select failed:`, updateError);
          throw updateError;
        }
        
        console.log(`[dataClient] Update without select succeeded, returning merged data`);
        // Return the merged data since update succeeded but we couldn't select
        return { data: { id, ...data }, error: null };
      }

      // Return the first item if array, otherwise return as-is
      const returnData = Array.isArray(result) ? result[0] : result;
      
      return { data: returnData, error: null }
    } catch (error) {
      console.error(`[dataClient] Update error on ${table}:`, error)
      return { data: null, error: error.message }
    }
  },

  /**
   * Delete record
   * @param {string} table
   * @param {string|number} id
   * @returns {Promise<{success, error}>}
   */
  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Advanced query with multiple conditions
   * @param {string} table
   * @param {object} conditions - { field: { operator, value } }
   * @returns {Promise<{data, error}>}
   */
  async query(table, conditions = {}) {
    try {
      let query = supabase.from(table).select('*')

      // Build query from conditions object
      for (const [field, condition] of Object.entries(conditions)) {
        const { operator = '==', value } = condition

        if (operator === '==') {
          query = query.eq(field, value)
        } else if (operator === '!=') {
          query = query.neq(field, value)
        } else if (operator === '>') {
          query = query.gt(field, value)
        } else if (operator === '<') {
          query = query.lt(field, value)
        } else if (operator === 'in') {
          query = query.in(field, value)
        } else if (operator === 'contains') {
          query = query.ilike(field, `%${value}%`)
        }
      }

      const { data, error } = await query

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  /**
   * Search records
   * @param {string} table
   * @param {string} searchField
   * @param {string} searchValue
   * @param {number} limit
   * @returns {Promise<{data, error}>}
   */
  async search(table, searchField, searchValue, limit = 50) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .ilike(searchField, `%${searchValue}%`)
        .limit(limit)

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  /**
   * Get records with pagination
   * @param {string} table
   * @param {number} page
   * @param {number} pageSize
   * @returns {Promise<{data, count, error}>}
   */
  async paginate(table, page = 1, pageSize = 20) {
    try {
      const start = (page - 1) * pageSize
      const end = start + pageSize - 1

      const { data, count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .range(start, end)

      if (error) throw error

      return { data, count, error: null }
    } catch (error) {
      return { data: null, count: 0, error: error.message }
    }
  },

  /**
   * Count records
   * @param {string} table
   * @param {array} filters
   * @returns {Promise<{count, error}>}
   */
  async count(table, filters = []) {
    try {
      let query = supabase.from(table).select('*', { count: 'exact', head: true })

      // Apply filters
      for (const filter of filters) {
        const { field, operator, value } = filter
        if (operator === '==') {
          query = query.eq(field, value)
        }
      }

      const { count, error } = await query

      if (error) throw error

      return { count, error: null }
    } catch (error) {
      return { count: 0, error: error.message }
    }
  },

  /**
   * Upsert (insert or update)
   * @param {string} table
   * @param {object} data
   * @returns {Promise<{data, error}>}
   */
  async upsert(table, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .upsert(data)
        .select()

      if (error) throw error

      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }
}

export default dataClient
