function processTopup(orderId, action) {
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const endpoint = action === 'complete' ? 'complete' : 'reject';
    const url = `/admin/store/topuprequest/${orderId}/${endpoint}/`;

    const buttons = document.querySelectorAll(`button[onclick*="processTopup(${orderId}"]`);
    buttons.forEach(btn => { btn.disabled = true; btn.style.opacity = '0.6'; });

    fetch(url, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrftoken, 'Content-Type': 'application/json' }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            showTopupMessage(data.message, 'success');
            updateTopupRow(orderId, action);
        } else {
            showTopupMessage(data.error || 'An error occurred', 'error');
            buttons.forEach(btn => { btn.disabled = false; btn.style.opacity = '1'; });
        }
    })
    .catch(() => {
        showTopupMessage('Network error occurred', 'error');
        buttons.forEach(btn => { btn.disabled = false; btn.style.opacity = '1'; });
    });
}

function updateTopupRow(orderId, action) {
    const buttons = document.querySelectorAll(`button[onclick*="processTopup(${orderId}"]`);
    if (!buttons.length) return;

    const actionsCell = buttons[0].closest('td');
    const statusText  = action === 'complete' ? '✓ Completed' : '✗ Rejected';
    const statusColor = action === 'complete' ? '#28a745' : '#dc3545';
    actionsCell.innerHTML = `<span style="color:${statusColor}; font-weight:500; font-style:italic;">${statusText}</span>`;

    const row = actionsCell.closest('tr');
    row.querySelectorAll('td').forEach(cell => {
        if (cell.textContent.trim() === 'Pending') {
            const newStatus = action === 'complete' ? 'Completed' : 'Rejected';
            cell.innerHTML = `<span style="color:${statusColor}; font-weight:500;">${newStatus}</span>`;
        }
    });
}

function showTopupMessage(message, type) {
    const div = document.createElement('div');
    div.style.cssText = `
        position:fixed; top:20px; right:20px; padding:12px 20px;
        border-radius:6px; color:white; font-weight:500; z-index:10000;
        box-shadow:0 4px 12px rgba(0,0,0,0.15); max-width:400px;
        background:${type === 'success' ? '#28a745' : '#dc3545'};
        animation: slideInRight 0.3s ease-out;
    `;
    div.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight  { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes slideOutRight { from { transform:translateX(0); opacity:1; } to { transform:translateX(100%); opacity:0; } }
    `;
    document.head.appendChild(style);
    document.body.appendChild(div);

    setTimeout(() => {
        div.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => div.parentNode && div.parentNode.removeChild(div), 300);
    }, 4000);
}
