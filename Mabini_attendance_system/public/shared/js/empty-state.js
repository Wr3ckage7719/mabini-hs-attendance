/**
 * Generates HTML for an empty state display
 * @param {string} type - Type of empty state: 'teachers', 'students', 'subjects', 'sections', 'blocks', 'users', 'reports', or 'default'
 * @param {string} message - Main message to display in the empty state
 * @returns {string} HTML string for the empty state component
 * @example
 * tableBody.innerHTML = getEmptyStateHTML('students', 'No students found');
 */
function getEmptyStateHTML(type, message) {
    const icons = {
        teachers: 'bi-person-badge',
        students: 'bi-people-fill',
        subjects: 'bi-book-fill',
        sections: 'bi-grid-3x3-gap-fill',
        blocks: 'bi-calendar3',
        users: 'bi-person-circle',
        reports: 'bi-file-earmark-bar-graph',
        default: 'bi-inbox'
    };

    const icon = icons[type] || icons.default;
    
    return `
        <div style="text-align: center; padding: 60px 20px; color: #64748b;">
            <div style="
                width: 80px;
                height: 80px;
                margin: 0 auto 24px;
                border-radius: 50%;
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 36px;
                color: #94a3b8;
            ">
                <i class="bi ${icon}"></i>
            </div>
            <h3 style="font-size: 18px; font-weight: 600; color: #475569; margin-bottom: 8px;">
                ${message}
            </h3>
            <p style="font-size: 14px; color: #94a3b8;">
                ${getEmptyStateSubtext(type)}
            </p>
        </div>
    `;
}

/**
 * Gets the appropriate subtext message for an empty state
 * @param {string} type - Type of empty state
 * @returns {string} Subtext message providing guidance to the user
 * @private
 */
function getEmptyStateSubtext(type) {
    const subtexts = {
        teachers: 'Add your first teacher to get started with managing faculty.',
        students: 'No students enrolled yet. Start by adding student records.',
        subjects: 'Create subjects to organize your curriculum.',
        sections: 'Set up class sections to group students.',
        blocks: 'Create time blocks to manage class schedules.',
        users: 'No users have been added to the system yet.',
        reports: 'No attendance records available for reporting.',
        default: 'No data available at the moment.'
    };
    
    return subtexts[type] || subtexts.default;
}

window.getEmptyStateHTML = getEmptyStateHTML;
