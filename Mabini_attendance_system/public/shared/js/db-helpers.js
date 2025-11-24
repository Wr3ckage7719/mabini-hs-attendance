// Database Helper Functions - Supabase Integration
// Import Supabase client from the correct path
import { supabase } from '../../js/supabase-client.js';

// Get a single document by ID
export async function getDocument(collectionName, docId) {
  try {
    const { data, error } = await supabase
      .from(collectionName)
      .select('*')
      .eq('id', docId)
      .single();

    if (error) throw error;
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Get document error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get all documents in a collection with optional filters
export async function getDocuments(collectionName, filters = []) {
  try {
    let query = supabase.from(collectionName).select('*');

    // Apply filters if provided
    for (const filter of filters) {
      const { field, operator, value } = filter;
      
      if (operator === '==') {
        query = query.eq(field, value);
      } else if (operator === '!=') {
        query = query.neq(field, value);
      } else if (operator === '>') {
        query = query.gt(field, value);
      } else if (operator === '<') {
        query = query.lt(field, value);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Get documents error:', error);
    return [];
  }
}

// Create a new document
export async function createDocument(collectionName, data, customId = null) {
  try {
    const documentData = { ...data };
    
    if (customId) {
      documentData.id = customId;
    }

    const { data: result, error } = await supabase
      .from(collectionName)
      .insert([documentData])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    console.error('Create document error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

// Add a new document (alias for createDocument)
export async function addDocument(collectionName, data) {
  return createDocument(collectionName, data);
}

// Update a document
export async function updateDocument(collectionName, docId, data) {
  try {
    const { data: result, error } = await supabase
      .from(collectionName)
      .update(data)
      .eq('id', docId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: result,
      error: null
    };
  } catch (error) {
    console.error('Update document error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

// Delete a document
export async function deleteDocument(collectionName, docId) {
  try {
    const { error } = await supabase
      .from(collectionName)
      .delete()
      .eq('id', docId);

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error('Delete document error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
// Real-time listener for a collection (polling-based)
export function listenToCollection(collectionName, callback) {
  // Implement polling for real-time updates
  const pollInterval = 5000; // 5 seconds
  
  const poll = async () => {
    const documents = await getDocuments(collectionName);
    callback(documents);
  };
  
  // Initial call
  poll();
  
  // Set up polling
  const intervalId = setInterval(poll, pollInterval);
  
  // Return unsubscribe function
  return () => clearInterval(intervalId);
}

// Real-time listener for a single document (polling-based)
export function listenToDocument(collectionName, docId, callback) {
  // Implement polling for real-time updates
  const pollInterval = 5000; // 5 seconds
  
  const poll = async () => {
    const result = await getDocument(collectionName, docId);
    if (result.success) {
      callback(result.data);
    } else {
      callback(null);
    }
  };
  
  // Initial call
  poll();
  
  // Set up polling
  const intervalId = setInterval(poll, pollInterval);
  
  // Return unsubscribe function
  return () => clearInterval(intervalId);
}

// Helper functions for query building
export function where(field, operator, value) {
  return { field, operator, value };
}

export function orderBy(field, direction = 'asc') {
  return { orderBy: field, direction };
}

export function limit(count) {
  return { limit: count };
}

// Timestamp utility
export const Timestamp = {
  now: () => {
    return new Date().toISOString();
  },
  fromDate: (date) => {
    return date.toISOString();
  }
};
