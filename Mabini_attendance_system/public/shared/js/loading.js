/**
 * Generates HTML for a loading spinner with custom message
 * @param {string} message - Loading message to display (default: 'Loading...')
 * @param {string} size - Spinner size: 'small', 'normal', or 'large' (default: 'normal')
 * @returns {string} HTML string for the loading spinner component
 * @example
 * container.innerHTML = getLoadingSpinnerHTML('Fetching students...', 'large');
 */
function getLoadingSpinnerHTML(message = 'Loading...', size = 'normal') {
    const sizes = {
        small: { spinner: '24px', text: '13px' },
        normal: { spinner: '40px', text: '14px' },
        large: { spinner: '56px', text: '16px' }
    };
    
    const s = sizes[size];
    
    return `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            gap: 16px;
        ">
            <div class="spinner-border text-primary" role="status" style="
                width: ${s.spinner};
                height: ${s.spinner};
                border-width: 3px;
            ">
                <span class="visually-hidden">Loading...</span>
            </div>
            <div style="color: #64748b; font-size: ${s.text}; font-weight: 500;">
                ${message}
            </div>
        </div>
    `;
}

/**
 * Displays a loading spinner inside a table body
 * @param {string} tableBodyId - ID of the table body element
 * @param {number} colspan - Number of columns to span (default: 7)
 * @param {string} message - Loading message to display (default: 'Loading data...')
 * @example
 * showTableLoading('studentsTableBody', 6, 'Loading students...');
 */
function showTableLoading(tableBodyId, colspan = 7, message = 'Loading data...') {
    const tbody = document.getElementById(tableBodyId);
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" style="padding: 0; border: none;">
                    ${getLoadingSpinnerHTML(message)}
                </td>
            </tr>
        `;
    }
}

/**
 * Sets a button to loading state (disabled with spinner) or restores it
 * @param {string} buttonId - ID of the button element
 * @param {boolean} loading - Whether to show loading state (default: true)
 * @example
 * setButtonLoading('saveBtn', true);  // Show loading
 * setButtonLoading('saveBtn', false); // Restore button
 */
function setButtonLoading(buttonId, loading = true) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    if (loading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            Processing...
        `;
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || 'Submit';
        delete btn.dataset.originalText;
    }
}

window.getLoadingSpinnerHTML = getLoadingSpinnerHTML;
window.showTableLoading = showTableLoading;
window.setButtonLoading = setButtonLoading;
