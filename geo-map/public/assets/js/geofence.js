// Geofence drawing and management using Leaflet.Draw

let drawControl = null;
let drawnItems = null;

function initializeDrawingTools(store) {
    // Create a feature group for drawn items
    drawnItems = new L.FeatureGroup();
    store.map.addLayer(drawnItems);
    
    // Map draw events
    store.map.on(L.Draw.Event.CREATED, function(event) {
        const layer = event.layer;
        const type = event.layerType;
        
        drawnItems.addLayer(layer);
        
        // Create geofence object
        createGeofenceFromLayer(store, layer, type);
    });
    
    store.map.on(L.Draw.Event.EDITED, function(event) {
        const layers = event.layers;
        layers.eachLayer(function(layer) {
            // Update geofence
            updateGeofenceFromLayer(store, layer);
        });
        store.addTimelineEvent('Geofence edited', 'geofence_edited');
    });
    
    store.map.on(L.Draw.Event.DELETED, function(event) {
        const layers = event.layers;
        layers.eachLayer(function(layer) {
            // Remove geofence
            deleteGeofenceFromLayer(store, layer);
        });
        store.addTimelineEvent('Geofence deleted', 'geofence_deleted');
    });
}

function startDrawing(store, mode) {
    // Initialize drawing tools if not already done
    if (!drawnItems) {
        initializeDrawingTools(store);
    }
    
    // Cancel any existing drawing
    if (store.drawing.handler) {
        store.drawing.handler.disable();
    }
    
    store.drawing.mode = mode;
    
    const drawOptions = {
        shapeOptions: {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            weight: 2
        }
    };
    
    switch(mode) {
        case 'polygon':
            store.drawing.handler = new L.Draw.Polygon(store.map, drawOptions);
            break;
        case 'rectangle':
            store.drawing.handler = new L.Draw.Rectangle(store.map, drawOptions);
            break;
        case 'circle':
            store.drawing.handler = new L.Draw.Circle(store.map, drawOptions);
            break;
    }
    
    if (store.drawing.handler) {
        store.drawing.handler.enable();
        store.addTimelineEvent(`Started drawing ${mode}`, 'system');
    }
}

function createGeofenceFromLayer(store, layer, type) {
    let geofence = {
        id: generateId('GF'),
        name: `Geofence ${store.geofences.length + 1}`,
        type: type,
        color: '#3b82f6',
        alert: true
    };
    
    if (type === 'polygon' || type === 'rectangle') {
        const latlngs = layer.getLatLngs()[0];
        geofence.coordinates = latlngs.map(ll => [ll.lat, ll.lng]);
    } else if (type === 'circle') {
        const center = layer.getLatLng();
        geofence.center = [center.lat, center.lng];
        geofence.radius = layer.getRadius();
    }
    
    // Store layer reference
    layer._geofenceId = geofence.id;
    
    // Add popup
    layer.bindPopup(`
        <div style="font-family: Inter, sans-serif;">
            <strong style="font-size: 14px;">${geofence.name}</strong><br>
            <span style="font-size: 12px; color: #888;">Type: ${geofence.type}</span>
        </div>
    `);
    
    store.geofences.push(geofence);
    store.layers.geofenceLayers[geofence.id] = layer;
    
    store.addTimelineEvent(`Geofence created: ${geofence.name}`, 'geofence_created');
    store.addAlert(`New geofence created: ${geofence.name}`, 'system');
    
    console.log('Geofence created:', geofence);
}

function updateGeofenceFromLayer(store, layer) {
    const geofenceId = layer._geofenceId;
    if (!geofenceId) return;
    
    const geofence = store.geofences.find(gf => gf.id === geofenceId);
    if (!geofence) return;
    
    if (geofence.type === 'polygon' || geofence.type === 'rectangle') {
        const latlngs = layer.getLatLngs()[0];
        geofence.coordinates = latlngs.map(ll => [ll.lat, ll.lng]);
    } else if (geofence.type === 'circle') {
        const center = layer.getLatLng();
        geofence.center = [center.lat, center.lng];
        geofence.radius = layer.getRadius();
    }
    
    console.log('Geofence updated:', geofence);
}

function deleteGeofenceFromLayer(store, layer) {
    const geofenceId = layer._geofenceId;
    if (!geofenceId) return;
    
    const index = store.geofences.findIndex(gf => gf.id === geofenceId);
    if (index !== -1) {
        const geofence = store.geofences[index];
        store.geofences.splice(index, 1);
        delete store.layers.geofenceLayers[geofenceId];
        
        store.addAlert(`Geofence deleted: ${geofence.name}`, 'system');
        console.log('Geofence deleted:', geofence);
    }
}

function createGeofenceFromCoords(store, coords) {
    // Create a rectangle layer from coordinates
    const layer = L.polygon(coords, {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        weight: 2
    }).addTo(store.map);
    
    // Add to drawn items
    if (!drawnItems) {
        initializeDrawingTools(store);
    }
    drawnItems.addLayer(layer);
    
    // Create geofence
    createGeofenceFromLayer(store, layer, 'rectangle');
    
    // Zoom to the new geofence
    store.map.fitBounds(layer.getBounds(), { padding: [50, 50] });
}

// Enable edit mode
function enableEditMode(store) {
    if (!drawnItems) {
        initializeDrawingTools(store);
    }
    
    const editHandler = new L.EditToolbar.Edit(store.map, {
        featureGroup: drawnItems
    });
    editHandler.enable();
}

// Enable delete mode
function enableDeleteMode(store) {
    if (!drawnItems) {
        initializeDrawingTools(store);
    }
    
    const deleteHandler = new L.EditToolbar.Delete(store.map, {
        featureGroup: drawnItems
    });
    deleteHandler.enable();
}

// Export functions to global scope
window.startDrawing = startDrawing;
window.createGeofenceFromCoords = createGeofenceFromCoords;
window.enableEditMode = enableEditMode;
window.enableDeleteMode = enableDeleteMode;
