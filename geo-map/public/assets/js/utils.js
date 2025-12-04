// Utility functions for GPS tracking dashboard

// Haversine formula to calculate distance between two coordinates in kilometers
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Check if a point is inside a polygon using ray casting algorithm
function isPointInPolygon(point, polygon) {
    const x = point[0], y = point[1];
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        
        const intersect = ((yi > y) !== (yj > y)) &&
                         (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
}

// Check if a point is inside a circle
function isPointInCircle(point, center, radius) {
    const distance = haversineDistance(point[0], point[1], center[0], center[1]);
    return distance <= radius / 1000; // radius is in meters, convert to km
}

// Generate random movement offset
function randomOffset(max = 0.0005) {
    return (Math.random() - 0.5) * max;
}

// Format timestamp
function formatTime(date = new Date()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Generate unique ID
function generateId(prefix = 'ID') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate total distance from history points
function calculateTotalDistance(historyPoints) {
    let total = 0;
    for (let i = 1; i < historyPoints.length; i++) {
        const prev = historyPoints[i - 1];
        const curr = historyPoints[i];
        total += haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    }
    return total;
}

// Download JSON data
function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Create rectangle from two corner coordinates
function createRectangleFromCorners(lat1, lng1, lat2, lng2) {
    return [
        [lat1, lng1],
        [lat1, lng2],
        [lat2, lng2],
        [lat2, lng1]
    ];
}
