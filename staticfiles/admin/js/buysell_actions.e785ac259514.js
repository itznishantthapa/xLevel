function processGameAccount(accountId, action) {
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const url = `/admin/buysell/gameaccount/${accountId}/${action}/`;

    const buttons = document.querySelectorAll(`button[onclick*="processGameAccount(${accountId}"]`);
    buttons.forEach(btn => { btn.disabled = true; btn.style.opacity = '0.6'; });

    fetch(url, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrftoken, 'Content-Type': 'application/json' }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            showGameAccountMessage(data.message, 'success');
            updateGameAccountRow(accountId, action);
        } else {
            showGameAccountMessage(data.error || 'An error occurred', 'error');
            buttons.forEach(btn => { btn.disabled = false; btn.style.opacity = '1'; });
        }
    })
    .catch(() => {
        showGameAccountMessage('Network error occurred', 'error');
        buttons.forEach(btn => { btn.disabled = false; btn.style.opacity = '1'; });
    });
}

function updateGameAccountRow(accountId, action) {
    const buttons = document.querySelectorAll(`button[onclick*="processGameAccount(${accountId}"]`);
    if (!buttons.length) return;

    const actionsCell = buttons[0].closest('td');
    const labels = { review: '🔍 Reviewing', sold: '✓ Sold', reject: '✗ Rejected' };
    const colors = { review: '#42a5f5', sold: '#28a745', reject: '#dc3545' };
    actionsCell.innerHTML = `<span style="color:${colors[action]}; font-weight:500; font-style:italic;">${labels[action]}</span>`;

    const row = actionsCell.closest('tr');
    row.querySelectorAll('td').forEach(cell => {
        const text = cell.textContent.trim();
        if (text === 'Pending Review' || text === 'Reviewing') {
            const statusLabels = { review: 'Reviewing', sold: 'Sold', reject: 'Rejected' };
            cell.innerHTML = `<span style="color:${colors[action]}; font-weight:500;">${statusLabels[action]}</span>`;
        }
    });
}

function showGameAccountMessage(message, type) {
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
