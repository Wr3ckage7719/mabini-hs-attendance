# Password Reset Feature - Implementation Guide

## Overview
Fully functional OTP-based password reset system for students and teachers.

## Features
✅ **OTP Generation** - 6-digit codes sent via email  
✅ **Email Integration** - SendGrid API for delivery  
✅ **Secure Tokens** - 10-minute expiration, one-time use  
✅ **Database Tracking** - All reset attempts logged  
✅ **Multi-Step Flow** - Email → OTP → New Password  
✅ **Auto-cleanup** - Expired tokens removed after 24 hours  

---

## Setup Instructions

### 1. Database Migration
Run the SQL migration to create the `password_reset_tokens` table:

```sql
-- In Supabase SQL Editor, run:
\i server/ADD_PASSWORD_RESET_TABLE.sql
```

This creates:
- `password_reset_tokens` table with RLS enabled
- Indexes for performance
- Cleanup function for expired tokens

### 2. Environment Variables
Ensure these are set in Vercel/environment:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### 3. Verify API Endpoints
Three serverless functions are deployed:

```
/api/password-reset/send-otp.js      → Send OTP to email
/api/password-reset/verify-otp.js    → Verify OTP code
/api/password-reset/reset-password.js → Update password
```

---

## User Flow

### Student/Teacher Portal

1. **Forgot Password Link**
   - Click "Forgot Password?" on login page
   - Redirects to `/student/forgot-password.html` or `/teacher/forgot-password.html`

2. **Enter Email** (Step 1)
   - User enters their registered email
   - System validates account exists and is active
   - OTP sent to email (expires in 10 minutes)

3. **Verify OTP** (Step 2)
   - User enters 6-digit code from email
   - Can resend OTP if not received (60-second cooldown)
   - Can change email if entered incorrectly

4. **Reset Password** (Step 3)
   - User creates new password (min 6 characters)
   - Password must match confirmation
   - Password updated in database immediately

5. **Success** (Step 4)
   - Confirmation message displayed
   - User redirected to login page
   - Can now login with new password

---

## API Documentation

### POST /api/password-reset/send-otp

**Request:**
```json
{
  "email": "student@example.com",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "emailSent": true,
  "expiresIn": 600
}
```

**Errors:**
- `400` - Invalid email/role
- `404` - User not found
- `403` - Account inactive
- `500` - Server error

---

### POST /api/password-reset/verify-otp

**Request:**
```json
{
  "email": "student@example.com",
  "otp": "123456",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "resetToken": "uuid-token-id"
}
```

**Errors:**
- `400` - Invalid OTP, expired OTP
- `500` - Server error

---

### POST /api/password-reset/reset-password

**Request:**
```json
{
  "email": "student@example.com",
  "resetToken": "uuid-token-id",
  "newPassword": "newpass123",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully! You can now login with your new password"
}
```

**Errors:**
- `400` - Invalid token, password too short
- `404` - User not found
- `500` - Server error

---

## Database Schema

### password_reset_tokens Table

```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL,    -- 'student' or 'teacher'
    email VARCHAR(255) NOT NULL,
    token VARCHAR(6) NOT NULL,         -- OTP code
    expires_at TIMESTAMPTZ NOT NULL,   -- 10 minutes from creation
    used BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,           -- When OTP was verified
    used_at TIMESTAMPTZ,               -- When password was reset
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_password_reset_tokens_email` - Fast lookup by email
- `idx_password_reset_tokens_token` - Fast OTP verification
- `idx_password_reset_tokens_used` - Filter active tokens
- `idx_password_reset_tokens_expires_at` - Cleanup queries

---

## Security Features

### 1. Token Expiration
- OTP expires 10 minutes after generation
- Expired tokens cannot be verified
- Old tokens cleaned up after 24 hours

### 2. One-Time Use
- Each OTP can only be used once
- Token marked as `used` after password reset
- Verified tokens cannot be reused

### 3. Rate Limiting (Recommended)
Add rate limiting to prevent abuse:
- Max 3 OTP requests per email per hour
- Max 5 verification attempts per OTP
- Implement in API endpoints if needed

### 4. Email Validation
- User must exist in database
- Account must be active
- Email must match user role (student/teacher)

### 5. Password Requirements
- Minimum 6 characters
- Must match confirmation
- No complexity requirements (can be added)

---

## Testing

### Manual Testing

1. **Test Send OTP:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/password-reset/send-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","role":"student"}'
   ```

2. **Test Verify OTP:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/password-reset/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","otp":"123456","role":"student"}'
   ```

3. **Test Reset Password:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/password-reset/reset-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","resetToken":"uuid","newPassword":"newpass","role":"student"}'
   ```

### Frontend Testing

1. Navigate to `/student/forgot-password.html`
2. Enter valid student email
3. Check email for OTP code
4. Enter OTP and verify
5. Set new password
6. Verify login works with new password

---

## Troubleshooting

### OTP Email Not Received

**Check:**
- SendGrid API key is valid
- Sender email is verified in SendGrid
- Email is not in spam folder
- User's email is correct in database

**Solution:**
- Verify SendGrid dashboard for delivery status
- Check Vercel function logs for errors
- Test with different email address

### OTP Verification Fails

**Check:**
- OTP hasn't expired (10-minute limit)
- Correct 6-digit code entered
- OTP matches user's email
- Token hasn't been used already

**Solution:**
- Request new OTP (resend button)
- Check database for token status
- Verify API endpoint is working

### Password Reset Fails

**Check:**
- Reset token is valid
- Token was verified (OTP step completed)
- User exists in database
- Password meets requirements

**Solution:**
- Start process over from Step 1
- Check Vercel logs for errors
- Verify database connection

---

## Maintenance

### Cleanup Expired Tokens

Run periodically (e.g., via cron job):

```sql
SELECT cleanup_expired_password_reset_tokens();
```

Or manually:

```sql
DELETE FROM password_reset_tokens
WHERE created_at < NOW() - INTERVAL '24 hours';
```

### Monitor Usage

Check reset activity:

```sql
-- Recent password resets
SELECT 
    user_type,
    email,
    created_at,
    used,
    EXTRACT(EPOCH FROM (expires_at - created_at))/60 AS valid_minutes
FROM password_reset_tokens
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Success rate
SELECT 
    COUNT(*) AS total_requests,
    COUNT(*) FILTER (WHERE used = true) AS successful_resets,
    ROUND(100.0 * COUNT(*) FILTER (WHERE used = true) / COUNT(*), 2) AS success_rate
FROM password_reset_tokens
WHERE created_at > NOW() - INTERVAL '30 days';
```

---

## Future Enhancements

### Potential Improvements

1. **SMS OTP** - Send OTP via SMS as alternative
2. **Rate Limiting** - Prevent abuse with request limits
3. **Password Complexity** - Enforce strong passwords
4. **Account Lockout** - Lock after multiple failed attempts
5. **Security Questions** - Additional verification step
6. **Audit Logging** - Detailed logs for security review
7. **Admin Override** - Allow admins to reset passwords
8. **2FA Integration** - Two-factor authentication

---

## Files Modified/Created

### New API Endpoints
- `api/password-reset/send-otp.js` ✨
- `api/password-reset/verify-otp.js` ✨
- `api/password-reset/reset-password.js` ✨

### Database Migration
- `server/ADD_PASSWORD_RESET_TABLE.sql` ✨

### Frontend Updates
- `public/shared/js/forgot-password.js` (updated to use API)
- `public/student/forgot-password.html` (success message updated)
- `public/teacher/forgot-password.html` (success message updated)

### Documentation
- `PASSWORD_RESET_GUIDE.md` (this file) ✨

---

## Support

For issues or questions:
1. Check Vercel function logs
2. Verify database migrations ran
3. Test API endpoints directly
4. Review email delivery in SendGrid

---

**Status:** ✅ Fully Implemented and Functional  
**Version:** 1.0  
**Last Updated:** November 25, 2025
