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
