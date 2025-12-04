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
            <div class="text-center text-muted py-5">
                <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                <p class="mt-3">No notifications sent yet</p>
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
            <div class="notification-card mb-3 p-3 border rounded">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center gap-2">
                        <span style="font-size: 1.5rem;">${icon}</span>
                        <div>
                            <h5 class="mb-0">${notif.title}</h5>
                            <small class="text-muted">${date}</small>
                        </div>
                    </div>
                    <div class="d-flex gap-2 align-items-center">
                        <span class="badge bg-primary">${targetLabel}</span>
                        <button class="btn btn-sm btn-danger" onclick="deleteNotification('${notif.id}')">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </div>
                <p class="mb-0 text-muted">${notif.message}</p>
            </div>
        `;
    }).join('');

} catch (error) {
    console.error('Error loading notifications:', error);
    container.innerHTML = `
        <div class="text-center text-danger py-5">
            <i class="bi bi-exclamation-triangle" style="font-size: 3rem;"></i>
            <p class="mt-3">Failed to load notifications</p>
        </div>
    `;
}
}// Delete notification
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
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';

    container.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'}"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    setTimeout(() => {
        const alert = container.querySelector('.alert');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
