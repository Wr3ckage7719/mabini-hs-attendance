import { supabase } from '../../js/supabase-client.js';

let allRetrievals = [];
let filteredRetrievals = [];

// Load retrievals on page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadRetrievals();
    setupLogout();
});

// Setup logout functionality
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }
}

// Load all account retrievals
async function loadRetrievals() {
    try {
        console.log('Loading account retrievals...');
        
        const { data, error } = await supabase
            .from('account_retrievals')
            .select('*')
            .order('retrieved_at', { ascending: false });
        
        if (error) {
            console.error('Supabase error loading retrievals:', error);
            throw error;
        }
        
        allRetrievals = data || [];
        filteredRetrievals = [...allRetrievals];
        console.log('Loaded retrievals:', allRetrievals.length);
        
        updateStats();
        renderRetrievals(filteredRetrievals);
    } catch (error) {
        console.error('Error loading retrievals:', error);
        document.getElementById('retrievalsTableBody').innerHTML = `
            <tr><td colspan="6" class="text-center text-danger">Error loading retrievals: ${error.message}</td></tr>
        `;
    }
}

// Update statistics cards
function updateStats() {
    const total = allRetrievals.length;
    const students = allRetrievals.filter(r => r.user_type === 'student').length;
    const teachers = allRetrievals.filter(r => r.user_type === 'teacher').length;
    
    // Calculate today's retrievals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = allRetrievals.filter(r => {
        const retrievedDate = new Date(r.retrieved_at);
        retrievedDate.setHours(0, 0, 0, 0);
        return retrievedDate.getTime() === today.getTime();
    }).length;
    
    document.getElementById('totalRetrievals').textContent = total;
    document.getElementById('studentRetrievals').textContent = students;
    document.getElementById('teacherRetrievals').textContent = teachers;
    document.getElementById('todayRetrievals').textContent = todayCount;
}

// Render retrievals table
function renderRetrievals(retrievals) {
    const tbody = document.getElementById('retrievalsTableBody');
    
    if (!retrievals || retrievals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No account retrievals found</td></tr>';
        return;
    }
    
    tbody.innerHTML = retrievals.map(retrieval => {
        const date = new Date(retrieval.retrieved_at);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const userTypeBadge = retrieval.user_type === 'student' 
            ? '<span class="badge bg-success">Student</span>'
            : '<span class="badge bg-info">Teacher</span>';
        
        return `
            <tr>
                <td>${retrieval.email || 'N/A'}</td>
                <td>${retrieval.student_number || 'N/A'}</td>
                <td>${userTypeBadge}</td>
                <td><small class="text-muted">${retrieval.ip_address || 'Unknown'}</small></td>
                <td><small>${formattedDate}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteRetrieval('${retrieval.id}', '${retrieval.email}')" title="Delete">
                        <i class="bi bi-trash"></i> <span class="btn-label">Delete</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter retrievals
window.filterRetrievals = function() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const userType = document.getElementById('userTypeFilter').value;
    
    filteredRetrievals = allRetrievals.filter(retrieval => {
        const matchesSearch = !searchTerm || 
            (retrieval.email && retrieval.email.toLowerCase().includes(searchTerm)) ||
            (retrieval.student_number && retrieval.student_number.toLowerCase().includes(searchTerm));
        
        const matchesType = !userType || retrieval.user_type === userType;
        
        return matchesSearch && matchesType;
    });
    
    renderRetrievals(filteredRetrievals);
};

// Clear filters
window.clearFilters = function() {
    document.getElementById('searchInput').value = '';
    document.getElementById('userTypeFilter').value = '';
    filteredRetrievals = [...allRetrievals];
    renderRetrievals(filteredRetrievals);
};

// Delete single retrieval
window.deleteRetrieval = async function(id, email) {
    if (!window.confirmModal) {
        if (!confirm(`Delete retrieval record for ${email}?\n\nThis will allow the user to retrieve their account again.`)) {
            return;
        }
    } else {
        const confirmed = await window.confirmModal(
            'Delete Retrieval Record',
            `Are you sure you want to delete the retrieval record for <strong>${email}</strong>?<br><br>This will allow the user to retrieve their account credentials again.`,
            'Delete',
            'btn-danger'
        );
        if (!confirmed) return;
    }
    
    try {
        const { error } = await supabase
            .from('account_retrievals')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        if (window.showToast) {
            window.showToast('Retrieval record deleted successfully', 'success');
        } else {
            alert('Retrieval record deleted successfully!');
        }
        
        await loadRetrievals();
    } catch (error) {
        console.error('Error deleting retrieval:', error);
        if (window.showToast) {
            window.showToast('Error deleting retrieval record: ' + error.message, 'error');
        } else {
            alert('Error deleting retrieval record: ' + error.message);
        }
    }
};

// Delete all retrievals
window.deleteAllRetrievals = async function() {
    if (allRetrievals.length === 0) {
        if (window.showToast) {
            window.showToast('No retrieval records to delete', 'info');
        } else {
            alert('No retrieval records to delete');
        }
        return;
    }
    
    if (!window.confirmModal) {
        if (!confirm(`Delete ALL ${allRetrievals.length} retrieval records?\n\nThis will allow all users to retrieve their accounts again. This action cannot be undone.`)) {
            return;
        }
    } else {
        const confirmed = await window.confirmModal(
            'Delete All Retrieval Records',
            `Are you sure you want to delete <strong>ALL ${allRetrievals.length} retrieval records</strong>?<br><br>This will allow all users to retrieve their account credentials again.<br><br><strong class="text-danger">This action cannot be undone!</strong>`,
            'Delete All',
            'btn-danger'
        );
        if (!confirmed) return;
    }
    
    try {
        // Delete all records
        const { error } = await supabase
            .from('account_retrievals')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (workaround since there's no delete all)
        
        if (error) throw error;
        
        if (window.showToast) {
            window.showToast('All retrieval records deleted successfully', 'success');
        } else {
            alert('All retrieval records deleted successfully!');
        }
        
        await loadRetrievals();
    } catch (error) {
        console.error('Error deleting all retrievals:', error);
        if (window.showToast) {
            window.showToast('Error deleting all records: ' + error.message, 'error');
        } else {
            alert('Error deleting all records: ' + error.message);
        }
    }
};

// Sidebar toggle for mobile
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    sidebar.classList.toggle('active');
    backdrop.classList.toggle('active');
};

window.closeSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    sidebar.classList.remove('active');
    backdrop.classList.remove('active');
};
