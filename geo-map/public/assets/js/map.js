// Map initialization and worker marker management

function initializeMap(store) {
    // Initialize Leaflet map with dark theme
    store.map = L.map('map', {
        zoomControl: true
    }).setView([40.7128, -74.0060], 14); // NYC coordinates
    
    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(store.map);
    
    // Create worker markers
    createWorkerMarkers(store);
    
    // Load geofences on map
    loadGeofencesOnMap(store);
    
    console.log('Map initialized');
}

function createWorkerMarkers(store) {
    store.workers.forEach(worker => {
        const icon = createWorkerIcon(worker);
        const marker = L.marker([worker.lat, worker.lng], { icon })
            .addTo(store.map);
        
        // Popup with worker info
        marker.bindPopup(`
            <div style="font-family: Inter, sans-serif;">
                <strong style="font-size: 14px;">${worker.name}</strong><br>
                <span style="font-size: 12px; color: #888;">Status: ${worker.status}</span><br>
                <span style="font-size: 12px; color: #888;">Dept: ${worker.department}</span>
            </div>
        `);
        
        store.layers.markers[worker.id] = marker;
    });
}

function createWorkerIcon(worker) {
    const statusClass = worker.status === 'active' ? 'pulse-active' : 
                       worker.status === 'idle' ? 'blink-border' : '';
    const opacity = worker.status === 'offline' ? 0.5 : 1;
    
    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="worker-marker ${statusClass}" style="
            width: 20px;
            height: 20px;
            background-color: ${worker.color};
            opacity: ${opacity};
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

function loadGeofencesOnMap(store) {
    store.geofences.forEach(geofence => {
        let layer;
        
        if (geofence.type === 'polygon' || geofence.type === 'rectangle') {
            layer = L.polygon(geofence.coordinates, {
                color: geofence.color || '#3b82f6',
                fillColor: geofence.color || '#3b82f6',
                fillOpacity: 0.2,
                weight: 2
            }).addTo(store.map);
            
        } else if (geofence.type === 'circle') {
            layer = L.circle(geofence.center, {
                radius: geofence.radius,
                color: geofence.color || '#3b82f6',
                fillColor: geofence.color || '#3b82f6',
                fillOpacity: 0.2,
                weight: 2
            }).addTo(store.map);
        }
        
        if (layer) {
            layer.bindPopup(`
                <div style="font-family: Inter, sans-serif;">
                    <strong style="font-size: 14px;">${geofence.name}</strong><br>
                    <span style="font-size: 12px; color: #888;">Type: ${geofence.type}</span>
                </div>
            `);
            
            store.layers.geofenceLayers[geofence.id] = layer;
            store.layers.geofences.push(layer);
        }
    });
}

function zoomToAllWorkers(store) {
    if (store.workers.length === 0) return;
    
    const bounds = L.latLngBounds(
        store.workers.map(w => [w.lat, w.lng])
    );
    
    store.map.fitBounds(bounds, { padding: [50, 50] });
}

function zoomToWorker(store, workerId) {
    if (!workerId) return;
    
    const worker = store.workers.find(w => w.id === workerId);
    if (worker) {
        store.map.setView([worker.lat, worker.lng], 16, {
            animate: true,
            duration: 0.5
        });
    }
}

function zoomToGeofence(store, geofenceId) {
    if (!geofenceId) return;
    
    const layer = store.layers.geofenceLayers[geofenceId];
    if (layer) {
        store.map.fitBounds(layer.getBounds(), { padding: [50, 50] });
    }
}

function renderWorkerHistory(store, workerId) {
    // Clear existing history layers
    Object.values(store.layers.history).forEach(layer => {
        store.map.removeLayer(layer);
    });
    store.layers.history = {};
    
    const historyPoints = store.history[workerId];
    if (!historyPoints || historyPoints.length === 0) return;
    
    const worker = store.workers.find(w => w.id === workerId);
    if (!worker) return;
    
    // Create polyline
    const latlngs = historyPoints.map(p => [p.lat, p.lng]);
    const polyline = L.polyline(latlngs, {
        color: worker.color,
        weight: 3,
        opacity: 0.7,
        smoothFactor: 1
    }).addTo(store.map);
    
    // Add start marker
    const startIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width: 12px;
            height: 12px;
            background-color: #22c55e;
            border: 2px solid white;
            border-radius: 50%;
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
    
    const startMarker = L.marker([historyPoints[0].lat, historyPoints[0].lng], { icon: startIcon })
        .addTo(store.map)
        .bindPopup('Start');
    
    // Add end marker
    const endIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width: 12px;
            height: 12px;
            background-color: #ef4444;
            border: 2px solid white;
            border-radius: 50%;
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
    
    const lastPoint = historyPoints[historyPoints.length - 1];
    const endMarker = L.marker([lastPoint.lat, lastPoint.lng], { icon: endIcon })
        .addTo(store.map)
        .bindPopup('End');
    
    // Store layers
    store.layers.history[workerId] = L.layerGroup([polyline, startMarker, endMarker]);
    
    // Fit bounds to history
    store.map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    
    // Animate polyline drawing
    animatePolyline(polyline, latlngs);
}

function animatePolyline(polyline, latlngs) {
    let index = 0;
    const interval = setInterval(() => {
        if (index < latlngs.length) {
            polyline.setLatLngs(latlngs.slice(0, index + 1));
            index++;
        } else {
            clearInterval(interval);
        }
    }, 50);
}

function toggleGeofencesVisibility(store) {
    Object.values(store.layers.geofenceLayers).forEach(layer => {
        if (store.layers.showGeofences) {
            if (!store.map.hasLayer(layer)) {
                layer.addTo(store.map);
            }
        } else {
            store.map.removeLayer(layer);
        }
    });
}

// Export functions to global scope
window.initializeMap = initializeMap;
window.zoomToAllWorkers = zoomToAllWorkers;
window.zoomToWorker = zoomToWorker;
window.zoomToGeofence = zoomToGeofence;
window.renderWorkerHistory = renderWorkerHistory;
window.toggleGeofencesVisibility = toggleGeofencesVisibility;
