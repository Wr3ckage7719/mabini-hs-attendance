/**
 * Displays a confirmation modal before deleting an item
 * @param {string} itemName - The name of the item to be deleted (shown in modal)
 * @param {Function} onConfirm - Callback function executed when user confirms deletion
 * @example
 * confirmDelete('Student John Doe', () => {
 *     deleteStudent(studentId);
 * });
 */
function confirmDelete(itemName, onConfirm) {
    const modalId = 'confirm-modal-' + Date.now();
    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1" data-bs-backdrop="static">`
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="border-radius: 16px;">
                    <div class="modal-header" style="background: #fef2f2; border: none;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="
                                width: 48px;
                                height: 48px;
                                border-radius: 12px;
                                background: #fee2e2;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 24px;
                                color: #dc2626;
                            ">
                                <i class="bi bi-trash-fill"></i>
                            </div>
                            <h5 class="modal-title" style="margin: 0;">Delete Confirmation</h5>
                        </div>
                    </div>
                    <div class="modal-body" style="padding: 24px;">
                        <p style="color: #475569; font-size: 15px; margin: 0;">
                            Are you sure you want to delete <strong>${itemName}</strong>? This action cannot be undone.
                        </p>
                    </div>
                    <div class="modal-footer" style="border: none; gap: 12px;">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="${modalId}-confirm">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);

    const modalElement = document.getElementById(modalId);
    const modal = new bootstrap.Modal(modalElement);

    document.getElementById(`${modalId}-confirm`).addEventListener('click', () => {
        modal.hide();
        onConfirm();
        setTimeout(() => modalDiv.remove(), 300);
    });

    modalElement.addEventListener('hidden.bs.modal', () => {
        setTimeout(() => modalDiv.remove(), 300);
    });

    modal.show();
}

window.confirmDelete = confirmDelete;
