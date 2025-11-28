// =====================================================
// ADMIN DASHBOARD - Supabase Data Integration
// =====================================================

import { authClient } from '../../js/auth-client.js';
import { dataClient } from '../../js/data-client.js';
import { protectPage, setupAutoLogout } from '../../js/session-guard.js';

// Update user profile in sidebar
function updateUserProfile(profile) {
    const fullName = profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Admin';
    const role = profile.role === 'admin' ? 'Administrator' : profile.role;
    
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
        // Get total students
        const studentsResult = await dataClient.getAll('students');
        const students = studentsResult.data || studentsResult || [];
        const totalStudentsEl = document.getElementById('totalStudents');
        if (totalStudentsEl) {
            totalStudentsEl.textContent = students.length;
        }
        
        // Get total sections (blocks)
        const sectionsResult = await dataClient.getAll('sections');
        const sections = sectionsResult.data || sectionsResult || [];
        const totalBlocksEl = document.getElementById('totalBlocks');
        if (totalBlocksEl) {
            totalBlocksEl.textContent = sections.length;
        }
        
        // Get today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayStart = new Date(today + 'T00:00:00').toISOString();
        const todayEnd = new Date(today + 'T23:59:59').toISOString();
        
        // Query entrance logs for today
        const logsResult = await dataClient.query('entrance_logs', {
            filter: {
                timestamp: { gte: todayStart, lte: todayEnd }
            }
        });
        const todayLogs = logsResult.data || logsResult || [];
        
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
        await loadRecentActivity(todayLogs.slice(-5).reverse());
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent activity
async function loadRecentActivity(logs) {
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
    
    // Get student names for the logs
    const studentIds = [...new Set(logs.map(log => log.student_id))];
    const students = await dataClient.query('students', {
        filter: { id: { in: studentIds } }
    });
    
    const studentMap = {};
    students.forEach(s => {
        studentMap[s.id] = `${s.first_name} ${s.last_name}`;
    });
    
    activityContainer.innerHTML = logs.map(log => {
        const time = new Date(log.timestamp);
        const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const studentName = studentMap[log.student_id] || 'Student';
        
        return `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="bi bi-check-circle-fill" style="color: var(--success);"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${studentName} checked in</div>
                    <div class="activity-time">${timeStr}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Sidebar toggle for mobile
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
};

// Logout function
window.doLogout = async function() {
    if (confirm('Are you sure you want to logout?')) {
        await authClient.logout();
        window.location.href = 'login.html';
    }
};

// Initialize dashboard
async function initDashboard() {
    // Protect page - require admin role
    const isAuthorized = await protectPage('admin');
    if (!isAuthorized) return;
    
    // Setup auto-logout on session expiry
    setupAutoLogout();
    
    // Get current user
    const user = await authClient.getCurrentUser();
    const profile = await authClient.getUserProfile(user.id);
    
    // Update user info in sidebar
    updateUserProfile(profile);
    
    // Load dashboard statistics
    await loadStats();
}

// Initialize when DOM is ready
initDashboard();
