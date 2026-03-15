function processTransaction(transactionId, action) {
    // Get CSRF token
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    // Determine endpoint
    const endpoint = action === 'approve' ? 'approve' : 'reject';
    const url = `/admin/transaction/transaction/${transactionId}/${endpoint}/`;
    
    // Show loading state
    const buttons = document.querySelectorAll(`button[onclick*="${transactionId}"]`);
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.6';
    });
    
    // Make AJAX request
    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show success message
            showMessage(data.message, 'success');
            
            // Update the row to show processed state
            updateTransactionRow(transactionId, action);
        } else {
            showMessage(data.error || 'An error occurred', 'error');
            
            // Re-enable buttons on error
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Network error occurred', 'error');
        
        // Re-enable buttons on error
        buttons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    });
}

function updateTransactionRow(transactionId, action) {
    // Find the row containing this transaction
    const buttons = document.querySelectorAll(`button[onclick*="${transactionId}"]`);
    if (buttons.length > 0) {
        const actionsCell = buttons[0].closest('td');
        
        // Replace buttons with processed status
        const statusText = action === 'approve' ? '✓ Approved' : '✗ Rejected';
        const statusColor = action === 'approve' ? '#28a745' : '#dc3545';
        
        actionsCell.innerHTML = `<span style="color: ${statusColor}; font-weight: 500; font-style: italic;">${statusText}</span>`;
        
        // Update status column if visible
        const row = actionsCell.closest('tr');
        const statusCells = row.querySelectorAll('td');
        statusCells.forEach(cell => {
            if (cell.textContent.includes('Pending') || cell.textContent.includes('Processing')) {
                const newStatus = action === 'approve' ? 'Success' : 'Rejected';
                const newColor = action === 'approve' ? '#28a745' : '#dc3545';
                cell.innerHTML = `<span style="color: ${newColor}; font-weight: 500;">${newStatus}</span>`;
            }
        });
    }
}

function showMessage(message, type) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Set background color based on type
    if (type === 'success') {
        messageDiv.style.background = '#28a745';
    } else {
        messageDiv.style.background = '#dc3545';
    }
    
    messageDiv.textContent = message;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(messageDiv);
    
    // Remove after 4 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 4000);
}

// Add styles for better button hover effects
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .transaction-action-btn {
            transition: all 0.2s ease;
        }
        .transaction-action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .transaction-action-btn:active {
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
});