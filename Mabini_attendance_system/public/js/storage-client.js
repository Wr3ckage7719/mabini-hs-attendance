/**
 * Supabase Storage Client
 * Utilities for uploading/deleting images to Supabase Storage
 */

import { supabase } from './supabase-client.js';

const BUCKET_NAME = 'student-images';

export const storageClient = {
    /**
     * Upload image to Supabase Storage
     * @param {File|Blob} file - The image file to upload
     * @param {string} folder - Folder within bucket (e.g., 'qr-codes', 'profile-pictures')
     * @param {string} fileName - Custom filename (e.g., 'student-2025001-qr.png')
     * @returns {Promise<string>} - Public URL of uploaded image
     */
    async uploadImage(file, folder, fileName) {
        try {
            const filePath = `${folder}/${fileName}`;
            
            // Upload file to Supabase Storage
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true // Overwrite if exists
                });
            
            if (error) throw error;
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath);
            
            return publicUrl;
        } catch (error) {
            console.error('[Storage] Upload error:', error);
            throw error;
        }
    },

    /**
     * Upload QR code canvas as PNG to storage
     * @param {HTMLCanvasElement} canvas - Canvas with QR code
     * @param {string} studentNumber - Student number for filename
     * @returns {Promise<string>} - Public URL of uploaded QR code
     */
    async uploadQRCode(canvas, studentNumber) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(async (blob) => {
                try {
                    if (!blob) {
                        throw new Error('Failed to create blob from canvas');
                    }
                    
                    const fileName = `student-${studentNumber}-qr.png`;
                    const file = new File([blob], fileName, { type: 'image/png' });
                    
                    const url = await this.uploadImage(file, 'qr-codes', fileName);
                    resolve(url);
                } catch (error) {
                    reject(error);
                }
            }, 'image/png');
        });
    },

    /**
     * Upload profile picture from file input
     * @param {File} file - The image file from input
     * @param {string} studentNumber - Student number for filename
     * @returns {Promise<string>} - Public URL of uploaded image
     */
    async uploadProfilePicture(file, studentNumber) {
        // Validate file type
        if (!file.type.match('image.*')) {
            throw new Error('Please select an image file (PNG, JPG, JPEG)');
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('File size must be less than 5MB');
        }
        
        const extension = file.name.split('.').pop();
        const fileName = `student-${studentNumber}-profile.${extension}`;
        
        return await this.uploadImage(file, 'profile-pictures', fileName);
    },

    /**
     * Delete image from Supabase Storage
     * @param {string} publicUrl - Full public URL of the image
     * @returns {Promise<void>}
     */
    async deleteImage(publicUrl) {
        try {
            if (!publicUrl || !publicUrl.includes(BUCKET_NAME)) {
                console.warn('[Storage] Invalid URL, skipping delete:', publicUrl);
                return;
            }
            
            // Extract file path from public URL
            // URL format: https://[project].supabase.co/storage/v1/object/public/student-images/folder/file.png
            const parts = publicUrl.split(`/${BUCKET_NAME}/`);
            if (parts.length < 2) {
                throw new Error('Could not extract file path from URL');
            }
            
            const filePath = parts[1];
            
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([filePath]);
            
            if (error) throw error;
            
            console.log('[Storage] Deleted:', filePath);
        } catch (error) {
            console.error('[Storage] Delete error:', error);
            throw error;
        }
    },

    /**
     * Check if bucket exists and is accessible
     * @returns {Promise<boolean>}
     */
    async checkBucketAccess() {
        try {
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .list('', { limit: 1 });
            
            if (error) {
                console.error('[Storage] Bucket access error:', error);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('[Storage] Bucket check failed:', error);
            return false;
        }
    },

    /**
     * Get image URL with fallback
     * Checks for Storage URL first, then base64, then default
     * @param {object} student - Student object
     * @param {string} type - 'qr_code' or 'profile_picture'
     * @param {string} defaultImage - Default image path
     * @returns {string} - Image URL
     */
    getImageUrl(student, type, defaultImage = '') {
        if (type === 'qr_code') {
            return student.qr_code_url || student.qr_code || defaultImage || '../assets/img/default-qr.png';
        } else if (type === 'profile_picture') {
            return student.profile_picture_url || student.profile_picture || defaultImage || '../assets/img/default-avatar.png';
        }
        return defaultImage;
    }
};

export default storageClient;
