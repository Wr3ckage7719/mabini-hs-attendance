import { supabase } from '../../js/supabase-client.js';
import { dataClient } from '../../js/data-client.js';

let currentUser = null;

// Initialize page
async function init() {
    try {
        // Get current user
        const userData = sessionStorage.getItem('userData');
        if (!userData) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = JSON.parse(userData);

        // Setup event listeners
        setupFormHandlers();
        
        // Load initial data
        await loadNotifications();

    } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Failed to initialize page', 'error');
    }
}

// Setup form event handlers
function setupFormHandlers() {
    // Type selector
    document.querySelectorAll('.type-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.type-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            this.querySelector('input[type="radio"]').checked = true;
        });
    });

    // Target selector
    document.querySelectorAll('.target-option').forEach(option => {
        option.addEventListener('click', async function() {
            document.querySelectorAll('.target-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            
            const targetType = radio.value;
            await handleTargetTypeChange(targetType);
        });
    });

    // Form submission
    document.getElementById('notificationForm').addEventListener('submit', handleSubmit);
}

// Handle target type change
async function handleTargetTypeChange(targetType) {
    const targetValueGroup = document.getElementById('targetValueGroup');
    const targetValueSelect = document.getElementById('targetValue');

    if (targetType === 'all') {
        targetValueGroup.style.display = 'none';
        targetValueSelect.required = false;
        return;
    }

    targetValueGroup.style.display = 'block';
    targetValueSelect.required = true;
    targetValueSelect.innerHTML = '<option value="">-- Select --</option>';

    try {
        if (targetType === 'grade') {
            // Grade levels
            targetValueSelect.innerHTML += `
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
            `;
        } else if (targetType === 'section') {
            // Load sections
            const { data: sections, error } = await supabase
                .from('sections')
                .select('id, section_name, grade_level')
                .order('grade_level')
                .order('section_name');

            if (error) throw error;

            sections.forEach(section => {
                targetValueSelect.innerHTML += `
                    <option value="${section.id}">Grade ${section.grade_level} - ${section.section_name}</option>
                `;
            });
        } else if (targetType === 'individual') {
            // Load students
            const { data: students, error } = await supabase
                .from('students')
                .select('id, full_name, first_name, last_name, student_id, grade_level')
                .eq('status', 'active')
                .order('grade_level')
                .order('last_name');

            if (error) throw error;

            students.forEach(student => {
                const name = student.full_name || `${student.first_name} ${student.last_name}`;
                targetValueSelect.innerHTML += `
                    <option value="${student.id}">${name} (${student.student_id}) - Grade ${student.grade_level}</option>
                `;
            });
        }
    } catch (error) {
        console.error('Error loading target options:', error);
        showAlert('Failed to load options', 'error');
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Sending...';

    try {
        const type = document.querySelector('input[name="type"]:checked').value;
        const title = document.getElementById('notificationTitle').value.trim();
        const message = document.getElementById('notificationMessage').value.trim();
        const targetType = document.querySelector('input[name="targetType"]:checked').value;
        const targetValue = targetType === 'all' ? null : document.getElementById('targetValue').value;

        // Validate
        if (!title || !message) {
            throw new Error('Title and message are required');
        }

        if (targetType !== 'all' && !targetValue) {
            throw new Error('Please select a target');
        }

        // Create notification
        const { data, error } = await supabase
            .from('student_notifications')
            .insert([{
                title,
                message,
                type,
                target_type: targetType,
                target_value: targetValue,
                created_by: currentUser.id
            }])
            .select();

        if (error) throw error;

        // Success
        showAlert('✅ Notification sent successfully!', 'success');
        
        // Reset form
        e.target.reset();
        document.querySelectorAll('.type-option').forEach(o => o.classList.remove('active'));
        document.querySelector('.type-option').classList.add('active');
        document.querySelectorAll('.target-option').forEach(o => o.classList.remove('active'));
        document.querySelector('.target-option').classList.add('active');
        document.getElementById('targetValueGroup').style.display = 'none';

        // Reload notifications list
        await loadNotifications();

    } catch (error) {
        console.error('Error sending notification:', error);
        showAlert('❌ Failed to send notification: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-send-fill"></i> Send Notification';
    }
}

// Load notifications
async function loadNotifications() {
    const container = document.getElementById('notificationsList');

    try {
        const { data: notifications, error } = await supabase
            .from('student_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        if (notifications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                    <p>No notifications sent yet</p>
                </div>
            `;
            return;
        }

        const typeIcons = {
            info: '📢',
            warning: '⚠️',
            success: '✅',
            danger: '🚨'
        };

        container.innerHTML = notifications.map(notif => {
            const icon = typeIcons[notif.type] || typeIcons.info;
            const date = new Date(notif.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
            });

            let targetLabel = '';
            switch (notif.target_type) {
                case 'all':
                    targetLabel = 'All Students';
                    break;
                case 'grade':
                    targetLabel = `Grade ${notif.target_value}`;
                    break;
                case 'section':
                    targetLabel = 'Specific Section';
                    break;
                case 'individual':
                    targetLabel = 'Individual Student';
                    break;
            }

            return `
                <div class="notification-item ${notif.type}">
                    <div class="notification-header">
                        <div class="notification-title">
                            <span>${icon}</span>
                            ${notif.title}
                        </div>
                        <div class="notification-meta">
                            <div>${date}</div>
                            <div style="margin-top: 0.25rem;">
                                <span class="notification-target">${targetLabel}</span>
                            </div>
                        </div>
                    </div>
                    <div class="notification-message">${notif.message}</div>
                    <button class="delete-btn" onclick="deleteNotification('${notif.id}')">
                        <i class="bi bi-trash-fill"></i> Delete
                    </button>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #ef4444;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <p>Failed to load notifications</p>
            </div>
        `;
    }
}

// Delete notification
window.deleteNotification = async function(id) {
    if (!confirm('Are you sure you want to delete this notification?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('student_notifications')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showAlert('Notification deleted successfully', 'success');
        await loadNotifications();

    } catch (error) {
        console.error('Error deleting notification:', error);
        showAlert('Failed to delete notification', 'error');
    }
};

// Show alert
function showAlert(message, type) {
    const container = document.getElementById('alertContainer');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
    const icon = type === 'success' ? '✓' : '✕';

    container.innerHTML = `
        <div class="alert ${alertClass}">
            <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-circle-fill'}"></i>
            <span>${message}</span>
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
