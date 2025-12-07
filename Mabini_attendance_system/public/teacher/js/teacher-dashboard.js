// =====================================================
// TEACHER DASHBOARD - Main Logic
// Version: 3.0 (Fixed - Dec 7, 2025 - 3:13 AM)
// =====================================================

import { dataClient } from '../../js/data-client.js';

console.log('[Teacher Dashboard] Script loaded - v3.0');

let allSchedules = [];
let currentTeacherId = null;

// Load dashboard data
async function loadDashboard() {
    console.log('[Teacher Dashboard] loadDashboard called');
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
        console.log('[Teacher Dashboard] Fetching teaching loads...');
        const loadsResult = await dataClient.getAll('teaching_loads', [
            { field: 'teacher_id', operator: '==', value: currentTeacherId }
        ]);
        
        console.log('[Teacher Dashboard] Teaching loads result:', loadsResult);
        
        if (loadsResult.error) {
            console.error('[Teacher Dashboard] Error loading teaching loads:', loadsResult.error);
            if (window.showAlert) window.showAlert('Failed to load teaching assignments: ' + loadsResult.error, 'error');
            
            // Still render empty state
            allSchedules = [];
            renderTodaySchedule();
            renderAllSchedules();
            return;
        }
        
        const myLoads = loadsResult.data || [];
        console.log('[Teacher Dashboard] My teaching loads:', myLoads.length, myLoads);
        
        
        // Get related data
        console.log('[Teacher Dashboard] Fetching subjects and sections...');
        const subjectsResult = await dataClient.getAll('subjects', []);
        const sectionsResult = await dataClient.getAll('sections', []);
        
        console.log('[Teacher Dashboard] Subjects result:', subjectsResult);
        console.log('[Teacher Dashboard] Sections result:', sectionsResult);
        
        if (subjectsResult.error || sectionsResult.error) {
            console.error('[Teacher Dashboard] Error loading related data');
            if (window.showAlert) window.showAlert('Failed to load complete data', 'error');
            
            // Still render with what we have
            allSchedules = [];
            renderTodaySchedule();
            renderAllSchedules();
            return;
        }
        
        const subjects = subjectsResult.data || [];
        const sections = sectionsResult.data || [];
        
        console.log('[Teacher Dashboard] Subjects loaded:', subjects.length);
        console.log('[Teacher Dashboard] Sections loaded:', sections.length);
        
        // Get students only if we have sections
        const uniqueSections = [...new Set(myLoads.map(l => l.section_id))].filter(Boolean);
        let students = [];
        
        console.log('[Teacher Dashboard] Unique sections:', uniqueSections.length);
        
        if (uniqueSections.length > 0) {
            console.log('[Teacher Dashboard] Fetching students for sections:', uniqueSections);
            const studentsResult = await dataClient.getAll('students', [
                { field: 'section_id', operator: 'in', value: uniqueSections }
            ]);
            
            console.log('[Teacher Dashboard] Students result:', studentsResult);
            
            if (!studentsResult.error) {
                students = studentsResult.data || [];
                console.log('[Teacher Dashboard] Students loaded:', students.length);
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

// Logout function
window.doLogout = async function() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('teacherData');
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('userRole');
        window.location.href = 'login.html';
    }
};

// Attach logout to button
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', doLogout);
    }
});

