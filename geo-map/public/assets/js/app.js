// Main Alpine.js store for the GPS tracking dashboard

document.addEventListener('alpine:init', () => {
    Alpine.store('App', {
        // State
        map: null,
        workers: [],
        history: {},
        geofences: [],
        alerts: [],
        timeline: [],
        stats: {
            active: 0,
            idle: 0,
            offline: 0,
            totalDistance: 0
        },
        selectedWorkerId: null,
        selectedGeofenceId: null,
        selectedRange: 'day',
        layers: {
            markers: {},
            history: {},
            geofences: [],
            geofenceLayers: {},
            showGeofences: true,
            showHistory: false,
        },
        drawing: {
            mode: null,
            handler: null
        },
        showTimeline: false,
        showCoordinateModal: false,
        coordModal: {
            lat1: '',
            lng1: '',
            lat2: '',
            lng2: ''
        },
        simulationInterval: null,
        workerStates: {}, // Track previous states for collision detection
        
        // Initialize the app
        async init() {
            console.log('Initializing TrackFlow Dashboard...');
            await this.loadWorkers();
            await this.loadHistory();
            await this.loadGeofences();
            this.initMap();
            this.startSimulation();
            this.addTimelineEvent('System started', 'system');
        },
        
        // Load workers from JSON
        async loadWorkers() {
            try {
                const response = await fetch('assets/data/workers.json');
                this.workers = await response.json();
                this.updateStats();
                console.log('Workers loaded:', this.workers.length);
            } catch (error) {
                console.error('Error loading workers:', error);
            }
        },
        
        // Load history from JSON
        async loadHistory() {
            try {
                const response = await fetch('assets/data/history.json');
                this.history = await response.json();
                console.log('History loaded');
            } catch (error) {
                console.error('Error loading history:', error);
            }
        },
        
        // Load geofences from JSON
        async loadGeofences() {
            try {
                const response = await fetch('assets/data/geofences.json');
                this.geofences = await response.json();
                console.log('Geofences loaded:', this.geofences.length);
            } catch (error) {
                console.error('Error loading geofences:', error);
            }
        },
        
        // Initialize map (delegated to map.js)
        initMap() {
            if (window.initializeMap) {
                window.initializeMap(this);
            }
        },
        
        // Start worker simulation
        startSimulation() {
            this.simulationInterval = setInterval(() => {
                this.simulateWorkerMovement();
            }, 3000);
        },
        
        // Simulate worker movement
        simulateWorkerMovement() {
            this.workers.forEach(worker => {
                if (worker.status === 'active') {
                    // Active workers move more
                    worker.lat += randomOffset(0.001);
                    worker.lng += randomOffset(0.001);
                    
                    // Update marker position
                    if (this.layers.markers[worker.id]) {
                        this.layers.markers[worker.id].setLatLng([worker.lat, worker.lng]);
                    }
                    
                    // Check geofence collisions
                    this.checkGeofenceCollision(worker);
                    
                } else if (worker.status === 'idle') {
                    // Idle workers have small jitter
                    worker.lat += randomOffset(0.0001);
                    worker.lng += randomOffset(0.0001);
                    
                    if (this.layers.markers[worker.id]) {
                        this.layers.markers[worker.id].setLatLng([worker.lat, worker.lng]);
                    }
                }
            });
            
            this.updateStats();
        },
        
        // Update statistics
        updateStats() {
            this.stats.active = this.workers.filter(w => w.status === 'active').length;
            this.stats.idle = this.workers.filter(w => w.status === 'idle').length;
            this.stats.offline = this.workers.filter(w => w.status === 'offline').length;
            
            // Calculate total distance based on selected range
            let totalDistance = 0;
            this.workers.forEach(worker => {
                if (this.history[worker.id]) {
                    const points = this.history[worker.id];
                    totalDistance += calculateTotalDistance(points);
                }
            });
            
            // Adjust based on range (mock multiplier)
            const multipliers = { day: 1, week: 7, month: 30 };
            this.stats.totalDistance = totalDistance * multipliers[this.selectedRange];
        },
        
        // Set time range
        setRange(range) {
            this.selectedRange = range;
            this.updateStats();
            this.addTimelineEvent(`Time range changed to ${range}`, 'system');
        },
        
        // Select worker
        selectWorker(workerId) {
            this.selectedWorkerId = workerId;
            this.zoomToWorker(workerId);
            
            if (this.layers.showHistory) {
                this.showWorkerHistory(workerId);
            }
            
            const worker = this.workers.find(w => w.id === workerId);
            if (worker) {
                this.addTimelineEvent(`Selected worker: ${worker.name}`, 'system');
            }
        },
        
        // Zoom to all workers
        zoomToAllWorkers() {
            if (window.zoomToAllWorkers) {
                window.zoomToAllWorkers(this);
            }
        },
        
        // Zoom to specific worker
        zoomToWorker(workerId) {
            if (window.zoomToWorker) {
                window.zoomToWorker(this, workerId);
            }
        },
        
        // Zoom to geofence
        zoomToGeofence(geofenceId) {
            if (window.zoomToGeofence) {
                window.zoomToGeofence(this, geofenceId);
            }
        },
        
        // Delete selected geofence
        deleteSelectedGeofence() {
            if (!this.selectedGeofenceId) return;
            
            const geofence = this.geofences.find(gf => gf.id === this.selectedGeofenceId);
            if (!geofence) return;
            
            // Confirm deletion
            if (!confirm(`Delete geofence "${geofence.name}"?`)) {
                return;
            }
            
            // Remove from map
            const layer = this.layers.geofenceLayers[this.selectedGeofenceId];
            if (layer && this.map) {
                this.map.removeLayer(layer);
            }
            
            // Remove from arrays
            delete this.layers.geofenceLayers[this.selectedGeofenceId];
            const index = this.geofences.findIndex(gf => gf.id === this.selectedGeofenceId);
            if (index !== -1) {
                this.geofences.splice(index, 1);
            }
            
            // Clear selection
            const deletedName = geofence.name;
            this.selectedGeofenceId = null;
            
            // Add notifications
            this.addAlert(`Geofence deleted: ${deletedName}`, 'system');
            this.addTimelineEvent(`Geofence deleted: ${deletedName}`, 'geofence_deleted');
            
            console.log('Geofence deleted:', deletedName);
        },
        
        // Start drawing mode
        startDraw(mode) {
            if (window.startDrawing) {
                window.startDrawing(this, mode);
            }
        },
        
        // Open coordinate modal
        openCoordinateModal() {
            this.showCoordinateModal = true;
            this.coordModal = { lat1: '', lng1: '', lat2: '', lng2: '' };
        },
        
        // Create geofence from coordinates
        createGeofenceFromCoordinates() {
            const { lat1, lng1, lat2, lng2 } = this.coordModal;
            
            if (!lat1 || !lng1 || !lat2 || !lng2) {
                alert('Please fill in all coordinates');
                return;
            }
            
            const coords = createRectangleFromCorners(
                parseFloat(lat1), 
                parseFloat(lng1), 
                parseFloat(lat2), 
                parseFloat(lng2)
            );
            
            if (window.createGeofenceFromCoords) {
                window.createGeofenceFromCoords(this, coords);
            }
            
            this.showCoordinateModal = false;
            this.addTimelineEvent('Geofence created from coordinates', 'geofence_created');
        },
        
        // Toggle geofences visibility
        toggleGeofences() {
            this.layers.showGeofences = !this.layers.showGeofences;
            
            if (window.toggleGeofencesVisibility) {
                window.toggleGeofencesVisibility(this);
            }
            
            this.addTimelineEvent(
                `Geofences ${this.layers.showGeofences ? 'shown' : 'hidden'}`, 
                'system'
            );
        },
        
        // Toggle history visibility
        toggleHistory() {
            this.layers.showHistory = !this.layers.showHistory;
            
            if (this.layers.showHistory && this.selectedWorkerId) {
                this.showWorkerHistory(this.selectedWorkerId);
            } else {
                // Clear history layers
                Object.values(this.layers.history).forEach(layer => {
                    if (this.map) {
                        this.map.removeLayer(layer);
                    }
                });
                this.layers.history = {};
            }
            
            this.addTimelineEvent(
                `History ${this.layers.showHistory ? 'shown' : 'hidden'}`, 
                'system'
            );
        },
        
        // Show worker history
        showWorkerHistory(workerId) {
            if (window.renderWorkerHistory) {
                window.renderWorkerHistory(this, workerId);
            }
        },
        
        // Check geofence collision
        checkGeofenceCollision(worker) {
            if (!this.workerStates[worker.id]) {
                this.workerStates[worker.id] = {};
            }
            
            this.geofences.forEach(geofence => {
                let isInside = false;
                
                if (geofence.type === 'polygon' || geofence.type === 'rectangle') {
                    isInside = isPointInPolygon([worker.lat, worker.lng], geofence.coordinates);
                } else if (geofence.type === 'circle') {
                    isInside = isPointInCircle(
                        [worker.lat, worker.lng], 
                        geofence.center, 
                        geofence.radius
                    );
                }
                
                const wasInside = this.workerStates[worker.id][geofence.id] || false;
                
                // Detect transitions
                if (isInside && !wasInside) {
                    // Entered
                    this.addAlert(
                        `${worker.name} entered ${geofence.name}`,
                        'entered',
                        worker.id,
                        geofence.id
                    );
                    this.addTimelineEvent(
                        `${worker.name} entered ${geofence.name}`,
                        'entered'
                    );
                } else if (!isInside && wasInside) {
                    // Exited
                    this.addAlert(
                        `${worker.name} exited ${geofence.name}`,
                        'exited',
                        worker.id,
                        geofence.id
                    );
                    this.addTimelineEvent(
                        `${worker.name} exited ${geofence.name}`,
                        'exited'
                    );
                }
                
                this.workerStates[worker.id][geofence.id] = isInside;
            });
        },
        
        // Add alert
        addAlert(message, type, workerId = null, geofenceId = null) {
            const alert = {
                id: generateId('ALERT'),
                message,
                type,
                workerId,
                geofenceId,
                time: formatTime()
            };
            this.alerts.push(alert);
        },
        
        // Add timeline event
        addTimelineEvent(message, type) {
            const event = {
                id: generateId('EVENT'),
                message,
                type,
                time: formatTime()
            };
            this.timeline.push(event);
        },
        
        // Save geofences (mock)
        saveGeofences() {
            this.addAlert('Geofences saved successfully', 'system');
            this.addTimelineEvent('Geofences saved', 'saved');
        },
        
        // Export data
        exportData() {
            const exportData = {
                workers: this.workers,
                geofences: this.geofences,
                alerts: this.alerts,
                timeline: this.timeline,
                stats: this.stats,
                exportedAt: new Date().toISOString()
            };
            
            downloadJSON(exportData, `trackflow-export-${Date.now()}.json`);
            this.addAlert('Data exported successfully', 'system');
            this.addTimelineEvent('Data exported', 'exported');
        }
    });
});
