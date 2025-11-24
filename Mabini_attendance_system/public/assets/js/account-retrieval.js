/**
 * Account Retrieval System
 * Handles one-time credential retrieval for students
 */

(function() {
    'use strict';

    // Get DOM elements
    const retrieveAccountLink = document.getElementById('retrieve-account-link');
    const retrieveAccountModal = document.getElementById('retrieve-account-modal');
    const retrieveAccountForm = document.getElementById('retrieve-account-form');
    const cancelRetrieveBtn = document.getElementById('cancel-retrieve-btn');
    const submitRetrieveBtn = document.getElementById('submit-retrieve-btn');
    const institutionalEmailInput = document.getElementById('institutional-email');
    const modalAlertContainer = document.getElementById('modal-alert-container');

    // Open modal
    if (retrieveAccountLink) {
        retrieveAccountLink.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    }

    // Close modal
    if (cancelRetrieveBtn) {
        cancelRetrieveBtn.addEventListener('click', closeModal);
    }

    // Close modal on backdrop click
    if (retrieveAccountModal) {
        retrieveAccountModal.addEventListener('click', function(e) {
            if (e.target === retrieveAccountModal) {
                closeModal();
            }
        });
    }

    // Handle form submission
    if (retrieveAccountForm) {
        retrieveAccountForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleAccountRetrieval();
        });
    }

    function openModal() {
        if (retrieveAccountModal) {
            retrieveAccountModal.style.display = 'flex';
            institutionalEmailInput.value = '';
            clearModalAlert();
            institutionalEmailInput.focus();
        }
    }

    function closeModal() {
        if (retrieveAccountModal) {
            retrieveAccountModal.style.display = 'none';
            clearModalAlert();
        }
    }

    async function handleAccountRetrieval() {
        const email = institutionalEmailInput.value.trim();

        // Validate email
        if (!email) {
            showModalAlert('Please enter your email address', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showModalAlert('Please enter a valid email address', 'error');
            return;
        }

        // Determine user type based on current page
        let userType = 'student'; // default
        const currentPath = window.location.pathname;
        if (currentPath.includes('/teacher/')) {
            userType = 'teacher';
        }

        // Disable submit button
        submitRetrieveBtn.disabled = true;
        submitRetrieveBtn.textContent = 'Sending...';

        try {
            const response = await fetch('/api/account/retrieve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email: email,
                    userType: userType
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showModalAlert(data.message || 'Your account credentials have been sent to your email!', 'success');
                
                // Close modal after 3 seconds
                setTimeout(() => {
                    closeModal();
                }, 3000);
            } else {
                // Show specific error message from server
                showModalAlert(data.message || data.error || 'Failed to retrieve account', 'error');
            }
        } catch (error) {
            console.error('Account retrieval error:', error);
            showModalAlert('Connection error. Please check your internet and try again.', 'error');
        } finally {
            // Re-enable submit button
            submitRetrieveBtn.disabled = false;
            submitRetrieveBtn.textContent = 'Send Credentials';
        }
    }

    function showModalAlert(message, type = 'error') {
        if (!modalAlertContainer) return;

        const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
        modalAlertContainer.innerHTML = `
            <div class="alert ${alertClass}">
                ${message}
            </div>
        `;
    }

    function clearModalAlert() {
        if (modalAlertContainer) {
            modalAlertContainer.innerHTML = '';
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return false;
        }
        
        // Determine user type based on current page
        const currentPath = window.location.pathname;
        const userType = currentPath.includes('/teacher/') ? 'teacher' : 'student';
        
        // Only students must use institutional email
        if (userType === 'student') {
            return email.toLowerCase().endsWith('@mabinicolleges.edu.ph');
        }
        
        // Teachers can use any valid email
        return true;
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && retrieveAccountModal.style.display === 'flex') {
            closeModal();
        }
    });
})();
