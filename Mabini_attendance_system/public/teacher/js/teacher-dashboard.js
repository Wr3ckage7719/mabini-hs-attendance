// =====================================================
// TEACHER DASHBOARD - Main Logic
// =====================================================

import { dataClient } from '../../js/data-client.js';

console.log('[Teacher Dashboard] Script loaded');

let allSchedules = [];
let currentTeacherId = null;

// Wait for teacher-common.js to provide CRUD functions and auth
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

console.log('[Teacher Dashboard] CRUD functions available');

// Load dashboard data
async function loadDashboard() {
    try {
        const userData = JSON.parse(sessionStorage.getItem('userData') || sessionStorage.getItem('teacherData'));
        if (!userData || !userData.id) {
            console.error('[Teacher Dashboard] No valid user data found');
            window.location.href = 'login.html';
            return;
        }
        
        currentTeacherId = userData.id;
        console.log('[Teacher Dashboard] Loading for teacher:', currentTeacherId);
        
        // Get teaching loads for this teacher
        const loadsResult = await dataClient.getAll('teaching_loads', [
            { field: 'teacher_id', operator: '==', value: currentTeacherId }
        ]);
        
        if (loadsResult.error) {
            console.error('[Teacher Dashboard] Error loading teaching loads:', loadsResult.error);
            if (window.showAlert) window.showAlert('Failed to load teaching assignments', 'error');
            return;
        }
        
        const myLoads = loadsResult.data || [];
        console.log('[Teacher Dashboard] My teaching loads:', myLoads.length);
        
        
        // Get related data
        const subjectsResult = await dataClient.getAll('subjects', []);
        const sectionsResult = await dataClient.getAll('sections', []);
        
        if (subjectsResult.error || sectionsResult.error) {
            console.error('[Teacher Dashboard] Error loading related data');
            if (window.showAlert) window.showAlert('Failed to load complete data', 'error');
            return;
        }
        
        const subjects = subjectsResult.data || [];
        const sections = sectionsResult.data || [];
        
        // Get students only if we have sections
        const uniqueSections = [...new Set(myLoads.map(l => l.section_id))].filter(Boolean);
        let students = [];
        
        if (uniqueSections.length > 0) {
            const studentsResult = await dataClient.getAll('students', [
                { field: 'section_id', operator: 'in', value: uniqueSections }
            ]);
            
            if (!studentsResult.error) {
                students = studentsResult.data || [];
            }
        }
        
        // Calculate stats
        const uniqueSubjects = [...new Set(myLoads.map(l => l.subject_id))].filter(Boolean);
        
        // Update stat cards
        const mySectionsEl = document.getElementById('mySections');
        const totalStudentsEl = document.getElementById('totalStudents');
        const totalClassesEl = document.getElementById('totalClasses');
        const totalSubjectsEl = document.getElementById('totalSubjects');
        
        if (mySectionsEl) mySectionsEl.textContent = uniqueSections.length;
        if (totalStudentsEl) totalStudentsEl.textContent = students.length;
        if (totalClassesEl) totalClassesEl.textContent = myLoads.length;
        if (totalSubjectsEl) totalSubjectsEl.textContent = uniqueSubjects.length;
        
        // Build schedule data
        allSchedules = myLoads.map(load => {
            const subject = subjects.find(s => String(s.id) === String(load.subject_id));
            const section = sections.find(s => String(s.id) === String(load.section_id));
            
            // Parse schedule string (format: "Monday, Tuesday, Wednesday 07:00-10:00")
            let daysPart = 'N/A';
            let timePart = 'N/A';
            if (load.schedule) {
                const schedParts = load.schedule.split(/\s+(?=\d)/);
                if (schedParts.length >= 2) {
                    daysPart = schedParts[0]; // "Monday, Tuesday, Wednesday"
                    timePart = schedParts[1]; // "07:00-10:00"
                } else {
                    daysPart = load.schedule;
                }
            }
            
            return {
                day: daysPart,
                time: timePart,
                subject: subject ? (subject.name || subject.subject_name || subject.code) : 'Unknown',
                section: section ? (section.section_name || section.name) : 'Unknown',
                room: load.room || section?.room || 'N/A'
            };
        });
        
        // Render schedules
        renderTodaySchedule();
        renderAllSchedules();
        
        console.log('[Teacher Dashboard] Dashboard loaded successfully');
    } catch (error) {
        console.error('[Teacher Dashboard] Error loading dashboard:', error);
        
        // Show error in schedule tables
        const todayBody = document.getElementById('todayScheduleBody');
        const allBody = document.getElementById('allSchedulesBody');
        
        if (todayBody) {
            todayBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-4"><i class="bi bi-exclamation-triangle me-2"></i>Error loading schedule</td></tr>';
        }
        
        if (allBody) {
            allBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4"><i class="bi bi-exclamation-triangle me-2"></i>Error loading schedule</td></tr>';
        }
        
        if (window.showAlert) {
            window.showAlert('Failed to load dashboard data: ' + error.message, 'error');
        }
    }
}

// Render today's schedule
function renderTodaySchedule() {
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];
    
    const todayDateEl = document.getElementById('todayDate');
    if (todayDateEl) {
        todayDateEl.textContent = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    const tbody = document.getElementById('todayScheduleBody');
    if (!tbody) return;
    
    // Show loading or no data message
    if (allSchedules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4"><i class="bi bi-calendar-x me-2"></i>No teaching assignments found. Please contact admin to assign you to classes.</td></tr>';
        return;
    }
    
    const todaySchedules = allSchedules.filter(s => s.day.includes(todayName));
    
    if (todaySchedules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3"><i class="bi bi-calendar-check me-2"></i>No classes scheduled for today</td></tr>';
        return;
    }
    
    tbody.innerHTML = todaySchedules.map(schedule => `
        <tr>
            <td>${schedule.time}</td>
            <td>${schedule.subject}</td>
            <td>${schedule.section}</td>
            <td>${schedule.room}</td>
        </tr>
    `).join('');
}

// Render all schedules
function renderAllSchedules(filterDay = '') {
    const tbody = document.getElementById('allSchedulesBody');
    if (!tbody) return;
    
    // Show no data message if no schedules at all
    if (allSchedules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4"><i class="bi bi-calendar-x me-2"></i>No teaching assignments found</td></tr>';
        return;
    }
    
    let filtered = allSchedules;
    
    if (filterDay) {
        filtered = allSchedules.filter(s => s.day.includes(filterDay));
    }
    
    // Sort by day and time
    const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
    filtered.sort((a, b) => {
        const dayCompare = (dayOrder[a.day] || 999) - (dayOrder[b.day] || 999);
        if (dayCompare !== 0) return dayCompare;
        return (a.time || '').localeCompare(b.time || '');
    });
    
    if (filtered.length === 0) {
        const dayName = filterDay || 'this filter';
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3"><i class="bi bi-calendar-check me-2"></i>No classes found for ${dayName}</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.map(schedule => `
        <tr>
            <td>${schedule.day}</td>
            <td>${schedule.time}</td>
            <td>${schedule.subject}</td>
            <td>${schedule.section}</td>
            <td>${schedule.room}</td>
        </tr>
    `).join('');
}

// Setup day filter
function setupDayFilter() {
    const daySelector = document.getElementById('daySelector');
    if (!daySelector) return;
    
    daySelector.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            // Remove active class from all buttons
            document.querySelectorAll('#daySelector button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            e.target.classList.add('active');
            
            const day = e.target.getAttribute('data-day');
            renderAllSchedules(day);
        }
    });
}

// Setup schedule search
function setupSearch() {
    const scheduleSearch = document.getElementById('scheduleSearch');
    if (!scheduleSearch) return;
    
    scheduleSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#allSchedulesBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

// Initialize dashboard
async function initDashboard() {
    console.log('[Teacher Dashboard] Initializing...');
    
    // Load data
    await loadDashboard();
    
    // Setup event listeners
    setupDayFilter();
    setupSearch();
    
    console.log('[Teacher Dashboard] Initialization complete');
}

// Run when page loads
window.addEventListener('load', initDashboard);

console.log('[Teacher Dashboard] Script ready');
        studentMap[s.id] = `${s.first_name} ${s.last_name}`;
    });

    // Get recent 10 records
    const recentRecords = attendanceRecords.slice(-10).reverse();

    tbody.innerHTML = recentRecords.map(record => {
        const studentName = studentMap[record.student_id] || 'Unknown Student';
        const date = new Date(record.date).toLocaleDateString();
        const timeIn = record.time_in ? formatTime(record.time_in) : '-';
        
        let statusBadge = '';
        switch(record.status) {
            case 'present':
                statusBadge = '<span class="badge bg-success">Present</span>';
                break;
            case 'late':
                statusBadge = '<span class="badge bg-warning">Late</span>';
                break;
            case 'absent':
                statusBadge = '<span class="badge bg-danger">Absent</span>';
                break;
            default:
                statusBadge = '<span class="badge bg-secondary">Unknown</span>';
        }

        return `
            <tr>
                <td>${date}</td>
                <td>${studentName}</td>
                <td>${timeIn}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

// Format time from HH:MM:SS to readable format
function formatTime(timeString) {
    if (!timeString) return '-';
    try {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return timeString;
    }
}

// Logout function
window.doLogout = async function() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('teacherData');
        sessionStorage.removeItem('userRole');
        window.location.href = 'login.html';
    }
};

// View class details
window.viewClassDetails = function(index) {
    const section = window.allClassSections?.[index];
    if (!section) return;
    
    document.getElementById('viewDay').textContent = section.day || 'N/A';
    document.getElementById('viewTime').textContent = section.schedule || 'N/A';
    document.getElementById('viewSubject').textContent = section.subject_name || '-';
    document.getElementById('viewSection').textContent = section.section_name || 'Unnamed Section';
    document.getElementById('viewRoom').textContent = section.room || 'N/A';
    document.getElementById('viewGradeLevel').textContent = section.grade_level || 'N/A';
    
    // Count students
    const studentCount = window.allStudents ? window.allStudents.filter(s => 
        s.grade_level === section.grade_level && s.section === section.section_name
    ).length : 0;
    document.getElementById('viewStudents').textContent = studentCount;
    
    const modal = new bootstrap.Modal(document.getElementById('classDetailsModal'));
    modal.show();
};

// Attach logout to button
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', doLogout);
    }
});

// Initialize dashboard when DOM is ready
initDashboard();
