// Admin Sidebar Template
// This generates the consistent sidebar for all admin pages

function generateAdminSidebar(activePage) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <div class="sidebar-logo">
                <i class="bi bi-mortarboard-fill"></i>
                <span>Mabini HS</span>
            </div>
            <div class="sidebar-subtitle">Attendance System</div>
        </div>
        
        <div class="sidebar-menu">
            <div class="menu-label">Main</div>
            <a href="dashboard.html" class="menu-item ${activePage === 'dashboard' ? 'active' : ''}">
                <i class="bi bi-speedometer2"></i>
                <span>Dashboard</span>
            </a>
            
            <div class="menu-label">Management</div>
            <a href="students.html" class="menu-item ${activePage === 'students' ? 'active' : ''}">
                <i class="bi bi-people-fill"></i>
                <span>Students</span>
            </a>
            <a href="sections.html" class="menu-item ${activePage === 'sections' ? 'active' : ''}">
                <i class="bi bi-grid-3x3-gap-fill"></i>
                <span>Sections & Classes</span>
            </a>
            <a href="users.html" class="menu-item ${activePage === 'users' ? 'active' : ''}">
                <i class="bi bi-person-badge-fill"></i>
                <span>Users & Staff</span>
            </a>
            
            <div class="menu-label">Reports & Notifications</div>
            <a href="reports.html" class="menu-item ${activePage === 'reports' ? 'active' : ''}">
                <i class="bi bi-bar-chart-fill"></i>
                <span>Analytics</span>
            </a>
            <a href="notifications.html" class="menu-item ${activePage === 'notifications' ? 'active' : ''}">
                <i class="bi bi-megaphone-fill"></i>
                <span>Student Notifications</span>
            </a>
            <a href="sms-notifications.html" class="menu-item ${activePage === 'sms-notifications' ? 'active' : ''}">
                <i class="bi bi-chat-dots-fill"></i>
                <span>SMS Notifications</span>
            </a>
            <!-- Change Password removed from generated sidebar -->
        </div>
        
        <div class="sidebar-footer">
            <div class="user-profile">
                <div class="user-avatar" id="userAvatar">AD</div>
                <div class="user-details">
                    <div class="user-name" id="userName">Admin</div>
                    <div class="user-role" id="userRole">Administrator</div>
                </div>
            </div>
        </div>
    `;
}

// Auto-generate sidebar on load if data-page attribute exists
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.hasAttribute('data-page')) {
        const activePage = sidebar.getAttribute('data-page');
        generateAdminSidebar(activePage);
    }
});
