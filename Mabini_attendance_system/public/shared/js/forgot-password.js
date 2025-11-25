import { supabase } from '../../js/supabase-client.js';

export function initForgotPassword({ role = 'student', portalLabel = 'Portal', loginUrl = 'login.html' } = {}) {
  let userEmail = '';
  let resetToken = '';
  let resendTimer = null;
  let resendCountdown = 60;

  // Step management
  const steps = document.querySelectorAll('.step');
  const sections = document.querySelectorAll('.form-section');

  function showStep(stepNumber) {
    sections.forEach(section => section.classList.remove('active'));
    steps.forEach((step, index) => {
      step.classList.remove('active', 'completed');
      if (index < stepNumber - 1) step.classList.add('completed');
      if (index === stepNumber - 1) step.classList.add('active');
    });
    sections[stepNumber - 1].classList.add('active');
  }

  // Alert function
  function showAlert(message, type = 'error') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => alertContainer.innerHTML = '', 5000);
  }

  // OTP Inputs
  const otpInputs = document.querySelectorAll('.otp-input');
  otpInputs.forEach((input, index) => {
    // accessibility: label each OTP input for screen readers
    input.setAttribute('aria-label', `OTP digit ${index + 1}`);
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData('text').slice(0, 6);
      pasteData.split('').forEach((char, i) => {
        if (i < otpInputs.length && /[0-9]/.test(char)) {
          otpInputs[i].value = char;
        }
      });
      if (pasteData.length === 6) otpInputs[5].focus();
    });
  });

  // Step 1: Send OTP
  const emailForm = document.getElementById('email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const btn = document.getElementById('send-otp-btn');

      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.textContent = 'Sending OTP...';

      try {
        // Call API to send OTP
        const response = await fetch('/api/password-reset/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, role })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          showAlert(result.message || 'Failed to send OTP. Please try again.');
          btn.disabled = false;
          btn.removeAttribute('aria-busy');
          btn.textContent = 'Send OTP Code';
          return;
        }

        userEmail = email;
        const disp = document.getElementById('email-display');
        if (disp) disp.textContent = email;

        showAlert('OTP sent to your email! Please check your inbox.', 'success');

        setTimeout(() => {
          showStep(2);
          startResendTimer();
        }, 600);
      } catch (error) {
        console.error('Send OTP error:', error);
        showAlert('Connection error. Please check your internet and try again.');
      } finally {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        btn.textContent = 'Send OTP Code';
      }
    });
  }

  // Step 2: Verify OTP
  const otpForm = document.getElementById('otp-form');
  if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const otp = Array.from(otpInputs).map(input => input.value).join('');
      const btn = document.getElementById('verify-otp-btn');

      if (otp.length !== 6) {
        showAlert('Please enter all 6 digits');
        return;
      }

      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.textContent = 'Verifying...';

      try {
        // Call API to verify OTP
        const response = await fetch('/api/password-reset/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: userEmail, otp, role })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          showAlert(result.message || 'Invalid OTP. Please try again.');
          otpInputs.forEach(input => input.value = '');
          otpInputs[0].focus();
          btn.disabled = false;
          btn.removeAttribute('aria-busy');
          btn.textContent = 'Verify OTP';
          return;
        }

        // Store reset token for password reset
        resetToken = result.resetToken;
        
        showAlert('OTP verified successfully!', 'success');
        clearInterval(resendTimer);
        setTimeout(() => showStep(3), 400);
      } catch (error) {
        console.error('Verify OTP error:', error);
        showAlert('Connection error. Please try again.');
      } finally {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        btn.textContent = 'Verify OTP';
      }
    });
  }

  // Step 3: Reset Password  
  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const btn = document.getElementById('reset-password-btn');

      if (newPassword !== confirmPassword) {
        showAlert('Passwords do not match');
        return;
      }

      if (newPassword.length < 6) {
        showAlert('Password must be at least 6 characters');
        return;
      }

      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.textContent = 'Resetting Password...';

      try {
        // Call API to reset password
        const response = await fetch('/api/password-reset/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            email: userEmail, 
            resetToken, 
            newPassword, 
            role 
          })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          showAlert(result.message || 'Failed to reset password. Please try again.');
          btn.disabled = false;
          btn.removeAttribute('aria-busy');
          btn.textContent = 'Reset Password';
          return;
        }

        // Update success screen with email
        const resetEmailDisplay = document.getElementById('reset-email-display');
        if (resetEmailDisplay) {
          resetEmailDisplay.textContent = userEmail;
        }

        showAlert('Password reset successfully!', 'success');
        setTimeout(() => showStep(4), 1000);
      } catch (error) {
        console.error('Password reset error:', error);
        showAlert('Connection error. Please try again.');
      } finally {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        btn.textContent = 'Reset Password';
      }
    });
  }

  // Resend OTP
  const resendBtn = document.getElementById('resend-btn');
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      const btn = resendBtn;
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');

      try {
        // Call API to resend OTP
        const response = await fetch('/api/password-reset/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: userEmail, role })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          showAlert(result.message || 'Failed to resend OTP. Please try again.');
          btn.disabled = false;
          btn.setAttribute('aria-disabled', 'false');
          return;
        }
        
        showAlert('New OTP sent to your email!', 'success');
        
        resendCountdown = 60;
        startResendTimer();
      } catch (error) {
        console.error('Resend OTP error:', error);
        showAlert('Connection error. Please try again.');
        btn.disabled = false;
        btn.setAttribute('aria-disabled', 'false');
      }
    });
  }

  // Change email button
  const changeEmailBtn = document.getElementById('change-email-btn');
  if (changeEmailBtn) {
    changeEmailBtn.addEventListener('click', () => {
      clearInterval(resendTimer);
      showStep(1);
      otpInputs.forEach(input => input.value = '');
    });
  }

  // Resend timer
  function startResendTimer() {
    const resendBtnLocal = document.getElementById('resend-btn');
    const timerSpan = document.getElementById('timer');
    if (!resendBtnLocal || !timerSpan) return;
    resendBtnLocal.disabled = true;
    resendBtnLocal.setAttribute('aria-disabled', 'true');
    resendCountdown = 60;

    resendTimer = setInterval(() => {
      resendCountdown--;
      timerSpan.textContent = `(${resendCountdown}s)`;

      if (resendCountdown <= 0) {
        clearInterval(resendTimer);
        resendBtnLocal.disabled = false;
        resendBtnLocal.setAttribute('aria-disabled', 'false');
        timerSpan.textContent = '';
      }
    }, 1000);
  }

  // Initialize UI text
  const subtitleEl = document.querySelector('.subtitle');
  if (subtitleEl) {
    // keep first subtitle line, but update portal name where applicable
    subtitleEl.textContent = `${portalLabel} - Mabini High School`;
  }

  // Update back link on page
  const backLink = document.querySelector('.back-link');
  if (backLink) backLink.setAttribute('href', loginUrl);

  // Show initial step
  showStep(1);
}
