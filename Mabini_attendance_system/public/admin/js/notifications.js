import { supabase } from '../../js/supabase-client.js';
import { dataClient } from '../../js/data-client.js';

let currentUser = null;
let sectionsCache = [];
let studentsCache = [];

// Initialize page
async function init() {
    try {
        console.log('🚀 Initializing Student Notifications page...');
        
        // Get current user
        const userData = sessionStorage.getItem('userData');
        if (!userData) {
            console.warn('⚠️ No user data found - redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        currentUser = JSON.parse(userData);
        console.log('✅ Current user:', currentUser.email || currentUser.username);

        // Test Supabase connection
        console.log('🔌 Testing Supabase connection...');
        const { data: healthCheck, error: healthError } = await supabase
            .from('students')
            .select('count', { count: 'exact', head: true });
        
        if (healthError) {
            console.error('❌ Supabase connection failed:', healthError);
            throw new Error(`Cannot connect to database: ${healthError.message}`);
        }
        
        console.log('✅ Supabase connection successful');

        // Preload sections and students for better UX
        console.log('📊 Loading cache data...');
        await Promise.all([
            loadSectionsCache(),
            loadStudentsCache()
        ]);
        
        console.log(`✅ Cache loaded: ${sectionsCache.length} sections, ${studentsCache.length} students`);

        // Setup event listeners
        setupFormHandlers();
        
        // Update initial recipient count after data is loaded
        updateRecipientCount('all', null);
        
        // Load initial data
        await loadNotifications();
        
        console.log('✅ Initialization complete');

    } catch (error) {
        console.error('❌ CRITICAL INITIALIZATION ERROR:', error);
        console.error('Full error details:', {
            message: error.message,
            stack: error.stack,
            hint: error.hint,
            details: error.details
        });
        
        showAlert(`Failed to initialize: ${error.message}. Please check console for details.`, 'error');
        
        // Show error in recipient display
        const recipientCount = document.getElementById('recipientCount');
        if (recipientCount) {
            recipientCount.textContent = `🔴 Initialization failed: ${error.message}`;
            recipientCount.className = 'text-danger fw-bold';
        }
    }
}

// Load sections into cache
async function loadSectionsCache() {
    try {
        const { data: sections, error } = await supabase
            .from('sections')
            .select('id, section_name, grade_level')
            .order('grade_level')
            .order('section_name');

        if (error) throw error;
        sectionsCache = sections || [];
    } catch (error) {
        console.error('Error loading sections cache:', error);
        sectionsCache = [];
    }
}

// Load students into cache
async function loadStudentsCache() {
    try {
        console.log('🔍 Attempting to load students from database...');
        
        // Test Supabase connection first
        const { data: testData, error: testError } = await supabase
            .from('students')
            .select('count', { count: 'exact', head: true });
        
        if (testError) {
            console.error('❌ Database connection test failed:', testError);
            // Don't throw, just log and continue with empty cache
            studentsCache = [];
            return;
        }
        
        console.log(`✅ Database connected. Total students in table: ${testData || 'unknown'}`);
        
        // Now fetch active students
        const { data: students, error } = await supabase
            .from('students')
            .select('id, first_name, last_name, student_number, grade_level, section_id, status, email')
            .eq('status', 'active')
            .order('grade_level')
            .order('last_name');

        if (error) {
            console.error('❌ Error fetching students:', error);
            // Don't throw, just set empty cache
            studentsCache = [];
            return;
        }
        
        studentsCache = Array.isArray(students) ? students : [];
        
        console.log(`✅ Loaded ${studentsCache.length} active students`);
        console.log('Student sample:', studentsCache.slice(0, 3)); // Log first 3 students
        
        // Show warning if no students found
        if (studentsCache.length === 0) {
            console.warn('⚠️ No active students found. Check database or RLS policies.');
            const recipientCount = document.getElementById('recipientCount');
            if (recipientCount) {
                recipientCount.textContent = '⚠️ No active students in database - check filters';
                recipientCount.className = 'text-warning fw-bold';
            }
        }
    } catch (error) {
        console.error('❌ CRITICAL ERROR loading students:', error);
        console.error('Error details:', {
            message: error.message,
            hint: error.hint,
            details: error.details,
            code: error.code
        });
        
        studentsCache = [];
        const recipientCount = document.getElementById('recipientCount');
        if (recipientCount) {
            recipientCount.textContent = `🔴 Database error: ${error.message}`;
            recipientCount.className = 'text-danger fw-bold';
        }
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
        updateRecipientCount(targetType, null);
        return;
    }

    targetValueGroup.style.display = 'block';
    targetValueSelect.required = true;
    targetValueSelect.innerHTML = '<option value="">-- Select --</option>';

    // Add event listener for recipient count update
    targetValueSelect.removeEventListener('change', handleTargetValueChange);
    targetValueSelect.addEventListener('change', handleTargetValueChange);

    try {
        if (targetType === 'grade') {
            // Grade levels
            targetValueSelect.innerHTML += `
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
            `;
        } else if (targetType === 'section') {
            // Use cached sections
            if (sectionsCache.length === 0) {
                await loadSectionsCache();
            }

            sectionsCache.forEach(section => {
                targetValueSelect.innerHTML += `
                    <option value="${section.id}">Grade ${section.grade_level} - ${section.section_name}</option>
                `;
            });

            if (sectionsCache.length === 0) {
                targetValueSelect.innerHTML += '<option value="" disabled>No sections available</option>';
            }
        } else if (targetType === 'individual') {
            // Use cached students
            if (studentsCache.length === 0) {
                await loadStudentsCache();
            }

            studentsCache.forEach(student => {
                const name = `${student.first_name} ${student.last_name}`;
                const sectionInfo = student.section_id ? 
                    ` - ${getSectionName(student.section_id)}` : '';
                
                targetValueSelect.innerHTML += `
                    <option value="${student.id}">${name} (${student.student_number}) - Grade ${student.grade_level}${sectionInfo}</option>
                `;
            });

            if (studentsCache.length === 0) {
                targetValueSelect.innerHTML += '<option value="" disabled>No students available</option>';
            }
        }
    } catch (error) {
        console.error('Error loading target options:', error);
        showAlert('Failed to load options', 'error');
    }
}

// Handle target value change
function handleTargetValueChange(e) {
    const targetType = document.querySelector('input[name="targetType"]:checked').value;
    const targetValue = e.target.value;
    updateRecipientCount(targetType, targetValue);
}

// Update recipient count display
function updateRecipientCount(targetType, targetValue) {
    let count = 0;
    let details = '';
    let studentIds = [];

    switch (targetType) {
        case 'all':
            count = studentsCache.length;
            details = `Will be sent to all ${count} active students`;
            studentIds = studentsCache.map(s => s.id);
            break;
        case 'grade':
            if (targetValue) {
                const filtered = studentsCache.filter(s => s.grade_level.toString() === targetValue);
                count = filtered.length;
                details = `Will be sent to ${count} student${count !== 1 ? 's' : ''} in Grade ${targetValue}`;
                studentIds = filtered.map(s => s.id);
            } else {
                details = 'Please select a grade level';
            }
            break;
        case 'section':
            if (targetValue) {
                const filtered = studentsCache.filter(s => s.section_id === targetValue);
                count = filtered.length;
                const section = sectionsCache.find(s => s.id === targetValue);
                const sectionName = section ? `${section.section_name}` : 'the selected section';
                details = `Will be sent to ${count} student${count !== 1 ? 's' : ''} in ${sectionName}`;
                studentIds = filtered.map(s => s.id);
            } else {
                details = 'Please select a section';
            }
            break;
        case 'individual':
            if (targetValue) {
                count = 1;
                const student = studentsCache.find(s => s.id === targetValue);
                if (student) {
                    const name = `${student.first_name} ${student.last_name}`;
                    details = `Will be sent to ${name} (${student.student_number})`;
                    studentIds = [student.id];
                } else {
                    details = 'Student selected';
                    studentIds = [targetValue];
                }
            } else {
                details = 'Please select a student';
            }
            break;
    }

    // Update display
    updateRecipientDisplay(details, count > 0 ? 'text-success' : 'text-warning');

    // Update send button
    const submitBtn = document.getElementById('sendButton');
    if (submitBtn) {
        if (count > 0) {
            submitBtn.innerHTML = `<i class="bi bi-send-fill me-2"></i>Send to ${count} Student${count !== 1 ? 's' : ''}`;
            submitBtn.disabled = false;
        } else {
            submitBtn.innerHTML = `<i class="bi bi-send-fill me-2"></i>Send Notification`;
            submitBtn.disabled = targetType !== 'all';
        }
        
        // Store student IDs for later use
        submitBtn.dataset.studentIds = JSON.stringify(studentIds);
    }
}

// Helper function to update recipient display
function updateRecipientDisplay(text, className = 'text-muted') {
    const recipientCount = document.getElementById('recipientCount');
    if (recipientCount) {
        recipientCount.textContent = text;
        recipientCount.className = className;
    }
}

// Helper function to get section name from cache
function getSectionName(sectionId) {
    const section = sectionsCache.find(s => s.id === sectionId);
    return section ? section.section_name : '';
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i> Sending notification...';

    try {
        const type = document.querySelector('input[name="type"]:checked').value;
        const notificationCategory = document.getElementById('notificationCategory')?.value || 'general';
        const title = document.getElementById('notificationTitle').value.trim();
        const message = document.getElementById('notificationMessage').value.trim();
        const targetType = document.querySelector('input[name="targetType"]:checked').value;
        const targetValue = targetType === 'all' ? null : document.getElementById('targetValue').value;

        // Validate
        if (!title || !message) {
            throw new Error('Please fill in both title and message');
        }

        if (targetType !== 'all' && !targetValue) {
            throw new Error('Please select a target from the dropdown');
        }

        // Get student IDs from button dataset
        const studentIdsStr = submitBtn.dataset.studentIds;
        const studentIds = studentIdsStr ? JSON.parse(studentIdsStr) : [];

        if (studentIds.length === 0) {
            throw new Error('No recipients found. Please select valid recipients.');
        }

        // Create individual notification for each student
        // This ensures each student sees the notification in their dashboard
        const notifications = studentIds.map(studentId => ({
            title,
            message,
            type,
            notification_type: notificationCategory,
            target_type: targetType,
            target_value: targetValue,
            student_id: studentId,
            is_read: false,
            created_at: new Date().toISOString()
        }));

        // Insert all notifications
        const { data, error } = await supabase
            .from('student_notifications')
            .insert(notifications);

        if (error) throw error;

        // Success
        const recipientCount = studentIds.length;
        showAlert(
            `✅ Success! Notification sent to ${recipientCount} student${recipientCount !== 1 ? 's' : ''}. They will see it when they log in to their dashboard.`, 
            'success'
        );
        
        // Reset form
        e.target.reset();
        document.querySelectorAll('.type-option').forEach(o => o.classList.remove('active'));
        document.querySelector('.type-option').classList.add('active');
        document.querySelectorAll('.target-option').forEach(o => o.classList.remove('active'));
        document.querySelector('.target-option').classList.add('active');
        document.getElementById('targetValueGroup').style.display = 'none';
        
        // Reset notification category dropdown to default
        const categorySelect = document.getElementById('notificationCategory');
        if (categorySelect) categorySelect.value = 'general';
        
        // Reset recipient count
        updateRecipientCount('all', null);

        // Reload notifications list
        await loadNotifications();

        // Scroll to top to see success message
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Error sending notification:', error);
        showAlert('❌ Failed to send notification: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
    }
}

// Load notifications
async function loadNotifications() {
    const container = document.getElementById('notificationsList');

    try {
        // Get notifications grouped by title, message, type, and target
        // to show unique notifications sent (not individual student records)
        const { data: notifications, error } = await supabase
            .from('student_notifications')
            .select('id, title, message, type, target_type, target_value, student_id, created_at, created_by')
            .order('created_at', { ascending: false })
            .limit(100); // Get more to group them

        if (error) throw error;

        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                    <p class="mt-3">No notifications sent yet</p>
                    <small>Start by creating your first notification above</small>
                </div>
            `;
            return;
        }

        // Group notifications by created_at, title, and message
        // to show one entry per notification sent (even if it went to multiple students)
        const grouped = new Map();
        notifications.forEach(notif => {
            // Create a unique key for grouping
            const key = `${notif.title}-${notif.message}-${notif.type}-${notif.target_type}-${notif.target_value || 'null'}-${new Date(notif.created_at).toISOString().split('.')[0]}`;
            
            if (!grouped.has(key)) {
                grouped.set(key, {
                    ...notif,
                    count: 1,
                    ids: [notif.id]
                });
            } else {
                const existing = grouped.get(key);
                existing.count++;
                existing.ids.push(notif.id);
            }
        });

        // Convert map to array and sort by date
        const uniqueNotifications = Array.from(grouped.values())
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 20); // Show last 20 unique notifications

        const typeIcons = {
            info: '📢',
            warning: '⚠️',
            success: '✅',
            danger: '🚨'
        };

        container.innerHTML = uniqueNotifications.map(notif => {
        const icon = typeIcons[notif.type] || typeIcons.info;
        const date = new Date(notif.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
        });

        let targetLabel = '';
        let targetDetails = '';
        
        switch (notif.target_type) {
            case 'all':
                targetLabel = 'All Students';
                targetDetails = `Sent to ${notif.count} student${notif.count !== 1 ? 's' : ''}`;
                break;
            case 'grade':
                targetLabel = `Grade ${notif.target_value}`;
                targetDetails = `Sent to ${notif.count} Grade ${notif.target_value} student${notif.count !== 1 ? 's' : ''}`;
                break;
            case 'section':
                const section = sectionsCache.find(s => s.id === notif.target_value);
                if (section) {
                    targetLabel = `${section.section_name}`;
                    targetDetails = `Grade ${section.grade_level} - ${section.section_name} (${notif.count} student${notif.count !== 1 ? 's' : ''})`;
                } else {
                    targetLabel = 'Specific Section';
                    targetDetails = `Sent to ${notif.count} student${notif.count !== 1 ? 's' : ''}`;
                }
                break;
            case 'individual':
                const student = studentsCache.find(s => s.id === notif.target_value || s.id === notif.student_id);
                if (student) {
                    const name = `${student.first_name} ${student.last_name}`;
                    targetLabel = name;
                    targetDetails = `Student Number: ${student.student_number}`;
                } else {
                    targetLabel = 'Individual Student';
                    targetDetails = `Sent to 1 student`;
                }
                break;
        }

        return `
            <div class="card mb-3 shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="d-flex align-items-start gap-3 flex-grow-1">
                            <span style="font-size: 2rem;">${icon}</span>
                            <div class="flex-grow-1">
                                <h5 class="mb-1">${notif.title}</h5>
                                <p class="mb-2 text-muted">${notif.message}</p>
                                <div class="d-flex gap-2 flex-wrap align-items-center">
                                    <span class="badge bg-primary">${targetLabel}</span>
                                    <small class="text-muted">${targetDetails}</small>
                                    <small class="text-muted">• ${date}</small>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteNotificationGroup('${notif.ids.join(',')}', '${notif.title}')" title="Delete this notification">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </div>
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
}
// Delete notification group (all notifications sent at once)
window.deleteNotificationGroup = async function(idsString, title) {
    const ids = idsString.split(',');
    const count = ids.length;
    
    if (!confirm(`Are you sure you want to delete "${title}"?\n\nThis will remove it from ${count} student${count !== 1 ? 's' : ''}.`)) {
        return;
    }

    try {
        const { error } = await supabase
            .from('student_notifications')
            .delete()
            .in('id', ids);

        if (error) throw error;

        showAlert(`✅ Notification deleted successfully (removed from ${count} student${count !== 1 ? 's' : ''})`, 'success');
        await loadNotifications();

    } catch (error) {
        console.error('Error deleting notification:', error);
        showAlert('❌ Failed to delete notification: ' + error.message, 'error');
    }
};

// Delete single notification (backward compatibility)
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
    const icon = type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill';

    container.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show shadow-sm" role="alert">
            <div class="d-flex align-items-start gap-3">
                <i class="bi bi-${icon}" style="font-size: 1.5rem;"></i>
                <div class="flex-grow-1">
                    ${message}
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        </div>
    `;

    // Auto-dismiss after 8 seconds for success, 10 seconds for errors
    const dismissTime = type === 'success' ? 8000 : 10000;
    setTimeout(() => {
        const alert = container.querySelector('.alert');
        if (alert) {
            const bsAlert = bootstrap.Alert.getInstance(alert);
            if (bsAlert) {
                bsAlert.close();
            }
        }
    }, dismissTime);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
