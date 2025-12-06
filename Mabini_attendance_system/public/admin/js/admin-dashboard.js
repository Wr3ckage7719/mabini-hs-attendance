// =====================================================
// ADMIN DASHBOARD - Main Logic
// =====================================================

console.log('[Dashboard] Script loaded');

// Wait for admin-common.js to load CRUD functions
await new Promise(resolve => {
    if (window.getDocuments) {
        resolve();
    } else {
        const checkInterval = setInterval(() => {
            if (window.getDocuments) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 50);
    }
});

console.log('[Dashboard] CRUD functions available');

// Update user profile in sidebar
function updateUserProfile(user) {
    const fullName = user.fullName || user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Admin';
    const role = user.role === 'admin' ? 'Administrator' : user.role || 'Admin';
    
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) userNameEl.textContent = fullName;
    if (userRoleEl) userRoleEl.textContent = role;
    
    // Set user avatar initials
    if (userAvatarEl) {
        const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        userAvatarEl.textContent = initials;
    }
}

// Load dashboard statistics
async function loadStats() {
    try {
        console.log('[Dashboard] Loading stats...');
        
        // Get total students
        const students = await window.getDocuments('students');
        const totalStudentsEl = document.getElementById('totalStudents');
        if (totalStudentsEl) {
            totalStudentsEl.textContent = students.length;
        }
        
        // Get active sections
        const sections = await window.getDocuments('sections');
        const activeSections = sections.filter(s => s.status === 'active' || !s.status);
        const totalBlocksEl = document.getElementById('totalBlocks');
        if (totalBlocksEl) {
            totalBlocksEl.textContent = activeSections.length;
        }
        
        // Get today's attendance from entrance_logs
        const today = new Date().toISOString().split('T')[0];
        const logs = await window.getDocuments('entrance_logs');
        const todayLogs = logs.filter(log => {
            if (!log.scan_time) return false;
            const logDate = new Date(log.scan_time).toISOString().split('T')[0];
            return logDate === today;
        });
        
        // Count unique students who checked in today
        const uniqueStudents = new Set(todayLogs.map(log => log.student_id));
        const presentToday = uniqueStudents.size;
        
        const presentTodayEl = document.getElementById('presentToday');
        if (presentTodayEl) {
            presentTodayEl.textContent = presentToday;
        }
        
        // Calculate attendance rate
        const rate = students.length > 0 ? ((presentToday / students.length) * 100).toFixed(1) : 0;
        const attendanceRateEl = document.getElementById('attendanceRate');
        if (attendanceRateEl) {
            attendanceRateEl.textContent = rate + '%';
        }
        
        // Load recent activity
        await loadRecentActivity(todayLogs.slice(-5).reverse(), students);
        
        // Load notification stats
        await loadNotificationStats();
        
        console.log('[Dashboard] Stats loaded successfully');
    } catch (error) {
        console.error('[Dashboard] Error loading stats:', error);
    }
}

// Load notification statistics
async function loadNotificationStats() {
    try {
        console.log('[Dashboard] Loading notification stats...');
        
        const today = new Date().toISOString().split('T')[0];
        
        // Get SMS logs for today
        const smsLogs = await window.getDocuments('sms_logs');
        const todaySMS = smsLogs.filter(log => {
            if (!log.sent_at && !log.created_at) return false;
            const logDate = new Date(log.sent_at || log.created_at).toISOString().split('T')[0];
            return logDate === today;
        });
        
        // Count total SMS sent today
        const totalSMS = todaySMS.length;
        const smsSentTodayEl = document.getElementById('smsSentToday');
        if (smsSentTodayEl) {
            smsSentTodayEl.textContent = totalSMS;
        }
        
        // Count check-in alerts (entrance)
        const checkinAlerts = todaySMS.filter(log => 
            log.message_type === 'check_in' || 
            log.message_type === 'entrance' ||
            (log.message && (log.message.toLowerCase().includes('arrived') || log.message.toLowerCase().includes('checked in')))
        ).length;
        const checkinAlertsEl = document.getElementById('checkinAlerts');
        if (checkinAlertsEl) {
            checkinAlertsEl.textContent = checkinAlerts;
        }
        
        // Count check-out alerts (exit)
        const checkoutAlerts = todaySMS.filter(log => 
            log.message_type === 'check_out' || 
            log.message_type === 'exit' ||
            (log.message && (log.message.toLowerCase().includes('departed') || log.message.toLowerCase().includes('left') || log.message.toLowerCase().includes('checked out')))
        ).length;
        const checkoutAlertsEl = document.getElementById('checkoutAlerts');
        if (checkoutAlertsEl) {
            checkoutAlertsEl.textContent = checkoutAlerts;
        }
        
        // Count absence alerts
        const absenceAlerts = todaySMS.filter(log => 
            log.message_type === 'absence' ||
            (log.message && (log.message.toLowerCase().includes('absent') || log.message.toLowerCase().includes('did not attend')))
        ).length;
        const absenceAlertsEl = document.getElementById('absenceAlerts');
        if (absenceAlertsEl) {
            absenceAlertsEl.textContent = absenceAlerts;
        }
        
        console.log('[Dashboard] Notification stats loaded:', {
            total: totalSMS,
            checkin: checkinAlerts,
            checkout: checkoutAlerts,
            absence: absenceAlerts
        });
    } catch (error) {
        console.error('[Dashboard] Error loading notification stats:', error);
        // Set to 0 on error
        const elements = ['smsSentToday', 'checkinAlerts', 'checkoutAlerts', 'absenceAlerts'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
    }
}

// Load recent activity
async function loadRecentActivity(logs, students) {
    const activityContainer = document.getElementById('recentActivity');
    if (!activityContainer) return;
    
    if (logs.length === 0) {
        activityContainer.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="bi bi-info-circle"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">No recent activity</div>
                    <div class="activity-time">Start of the day</div>
                </div>
            </div>
        `;
        return;
    }
    
    // Create a map of student IDs to names for quick lookup
    const studentMap = {};
    students.forEach(s => {
        studentMap[s.id] = `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student';
    });
    
    activityContainer.innerHTML = logs.map(log => {
        const time = new Date(log.scan_time);
        const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const studentName = studentMap[log.student_id] || 'Student';
        const location = log.location || 'Main Entrance';
        
        return `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="bi bi-check-circle-fill" style="color: var(--success, #10b981);"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${studentName} checked in</div>
                    <div class="activity-time">${timeStr} - ${location}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Initialize dashboard
async function initDashboard() {
    console.log('[Dashboard] Initializing...');
    
    // Get user data from sessionStorage (set during login by admin-common.js)
    const userData = sessionStorage.getItem('userData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            updateUserProfile(user);
        } catch (e) {
            console.error('[Dashboard] Error parsing user data:', e);
        }
    }
    
    // Load dashboard stats
    await loadStats();
    
    console.log('[Dashboard] Initialization complete');
}

// Run when page loads
window.addEventListener('load', initDashboard);

console.log('[Dashboard] Script ready');
