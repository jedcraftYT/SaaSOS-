// UI helper functions and interactions

// Initialize UI components
function initializeUI() {
    console.log('UI initialized');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-[10000] px-6 py-3 rounded-lg shadow-xl backdrop-blur-xl border transition-all duration-300`;
    
    switch(type) {
        case 'success':
            notification.className += ' bg-green-500/20 border-green-500 text-green-400';
            break;
        case 'error':
            notification.className += ' bg-red-500/20 border-red-500 text-red-400';
            break;
        case 'warning':
            notification.className += ' bg-yellow-500/20 border-yellow-500 text-yellow-400';
            break;
        default:
            notification.className += ' bg-blue-500/20 border-blue-500 text-blue-400';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Format distance
function formatDistance(km) {
    if (km < 1) {
        return `${(km * 1000).toFixed(0)} m`;
    }
    return `${km.toFixed(2)} km`;
}

// Format duration
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

// Get status color
function getStatusColor(status) {
    switch(status) {
        case 'active':
            return '#22c55e';
        case 'idle':
            return '#f59e0b';
        case 'offline':
            return '#ef4444';
        default:
            return '#6b7280';
    }
}

// Get alert type icon
function getAlertIcon(type) {
    switch(type) {
        case 'entered':
            return '🟢';
        case 'exited':
            return '🔴';
        case 'idle':
            return '🟡';
        case 'system':
            return '⚙️';
        default:
            return '📍';
    }
}

// Export functions
window.initializeUI = initializeUI;
window.showNotification = showNotification;
window.formatDistance = formatDistance;
window.formatDuration = formatDuration;
window.getStatusColor = getStatusColor;
window.getAlertIcon = getAlertIcon;
