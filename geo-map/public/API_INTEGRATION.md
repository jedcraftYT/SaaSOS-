# API Integration Guide

## 🔌 Connecting to a Real Backend

This guide shows how to replace mock data with real API calls.

## 📋 Prerequisites

- REST API endpoint
- CORS enabled on backend
- JSON response format matching mock data structure

## 🔄 Data Structure Requirements

### Workers Endpoint: `GET /api/workers`

Expected response:
```json
[
  {
    "id": "W001",
    "name": "Sarah Johnson",
    "status": "active",
    "lat": 40.7128,
    "lng": -74.0060,
    "color": "#22c55e",
    "department": "Field Operations"
  }
]
```

### History Endpoint: `GET /api/history` or `GET /api/workers/:id/history`

Expected response:
```json
{
  "W001": [
    {
      "lat": 40.7100,
      "lng": -74.0080,
      "timestamp": "09:00"
    }
  ]
}
```

Or for single worker:
```json
[
  {
    "lat": 40.7100,
    "lng": -74.0080,
    "timestamp": "2024-01-15T09:00:00Z"
  }
]
```

### Geofences Endpoint: `GET /api/geofences`

Expected response:
```json
[
  {
    "id": "GF001",
    "name": "Warehouse District",
    "type": "rectangle",
    "coordinates": [[40.7080, -74.0120], [40.7080, -74.0080]],
    "color": "#3b82f6",
    "alert": true
  }
]
```

## 🛠️ Step-by-Step Integration

### Step 1: Create Configuration File

Create `public/assets/js/config.js`:

```javascript
const API_CONFIG = {
    BASE_URL: 'https://api.yourbackend.com',
    ENDPOINTS: {
        WORKERS: '/api/workers',
        HISTORY: '/api/history',
        GEOFENCES: '/api/geofences',
        SAVE_GEOFENCE: '/api/geofences',
        UPDATE_WORKER: '/api/workers/:id'
    },
    WS_URL: 'wss://api.yourbackend.com/ws',
    POLLING_INTERVAL: 5000, // 5 seconds
    HEADERS: {
        'Content-Type': 'application/json',
        // Add auth headers here
        // 'Authorization': 'Bearer YOUR_TOKEN'
    }
};
```

Add to `index.html` before other scripts:
```html
<script src="assets/js/config.js"></script>
<script src="assets/js/utils.js"></script>
<!-- ... other scripts -->
```

### Step 2: Update app.js - Load Workers

Replace the `loadWorkers` method:

```javascript
// OLD (mock data)
async loadWorkers() {
    try {
        const response = await fetch('assets/data/workers.json');
        this.workers = await response.json();
        this.updateStats();
    } catch (error) {
        console.error('Error loading workers:', error);
    }
},

// NEW (API)
async loadWorkers() {
    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.WORKERS}`,
            {
                headers: API_CONFIG.HEADERS
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        this.workers = await response.json();
        this.updateStats();
        console.log('Workers loaded from API:', this.workers.length);
    } catch (error) {
        console.error('Error loading workers:', error);
        // Fallback to mock data
        this.loadWorkersFallback();
    }
},

// Fallback method
async loadWorkersFallback() {
    try {
        const response = await fetch('assets/data/workers.json');
        this.workers = await response.json();
        this.updateStats();
        console.log('Workers loaded from fallback');
    } catch (error) {
        console.error('Fallback also failed:', error);
    }
}
```

### Step 3: Update app.js - Load History

```javascript
// NEW (API)
async loadHistory() {
    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HISTORY}`,
            {
                headers: API_CONFIG.HEADERS
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        this.history = await response.json();
        console.log('History loaded from API');
    } catch (error) {
        console.error('Error loading history:', error);
        // Fallback to mock data
        const response = await fetch('assets/data/history.json');
        this.history = await response.json();
    }
}
```

### Step 4: Update app.js - Load Geofences

```javascript
// NEW (API)
async loadGeofences() {
    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GEOFENCES}`,
            {
                headers: API_CONFIG.HEADERS
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        this.geofences = await response.json();
        console.log('Geofences loaded from API:', this.geofences.length);
    } catch (error) {
        console.error('Error loading geofences:', error);
        // Fallback to mock data
        const response = await fetch('assets/data/geofences.json');
        this.geofences = await response.json();
    }
}
```

### Step 5: Add Real-Time Updates (Polling)

Add to `app.js` store:

```javascript
// Add to store properties
pollingInterval: null,

// Add method
startPolling() {
    this.pollingInterval = setInterval(async () => {
        await this.loadWorkers();
        // Workers will update on map automatically
    }, API_CONFIG.POLLING_INTERVAL);
},

// Update init method
async init() {
    console.log('Initializing TrackFlow Dashboard...');
    await this.loadWorkers();
    await this.loadHistory();
    await this.loadGeofences();
    this.initMap();
    this.startSimulation(); // Remove this for real data
    this.startPolling();    // Add this for real data
    this.addTimelineEvent('System started', 'system');
}
```

### Step 6: Add WebSocket Support (Real-Time)

Add to `app.js` store:

```javascript
// Add to store properties
ws: null,

// Add method
initWebSocket() {
    this.ws = new WebSocket(API_CONFIG.WS_URL);
    
    this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.addTimelineEvent('Real-time connection established', 'system');
    };
    
    this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case 'worker_update':
                this.updateWorker(data.worker);
                break;
            case 'worker_position':
                this.updateWorkerPosition(data.workerId, data.lat, data.lng);
                break;
            case 'geofence_alert':
                this.addAlert(data.message, data.alertType, data.workerId, data.geofenceId);
                break;
        }
    };
    
    this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Reconnect after 5 seconds
        setTimeout(() => this.initWebSocket(), 5000);
    };
},

// Add helper methods
updateWorker(worker) {
    const index = this.workers.findIndex(w => w.id === worker.id);
    if (index !== -1) {
        this.workers[index] = worker;
        
        // Update marker
        if (this.layers.markers[worker.id]) {
            this.layers.markers[worker.id].setLatLng([worker.lat, worker.lng]);
        }
        
        this.updateStats();
    }
},

updateWorkerPosition(workerId, lat, lng) {
    const worker = this.workers.find(w => w.id === workerId);
    if (worker) {
        worker.lat = lat;
        worker.lng = lng;
        
        // Update marker
        if (this.layers.markers[workerId]) {
            this.layers.markers[workerId].setLatLng([lat, lng]);
        }
        
        // Check geofence collisions
        this.checkGeofenceCollision(worker);
    }
},

// Update init method
async init() {
    console.log('Initializing TrackFlow Dashboard...');
    await this.loadWorkers();
    await this.loadHistory();
    await this.loadGeofences();
    this.initMap();
    // this.startSimulation(); // Remove for real data
    this.initWebSocket();      // Add for real-time
    this.addTimelineEvent('System started', 'system');
}
```

### Step 7: Save Geofences to Backend

Update `saveGeofences` method:

```javascript
// NEW (API)
async saveGeofences() {
    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SAVE_GEOFENCE}`,
            {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify({
                    geofences: this.geofences
                })
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        this.addAlert('Geofences saved successfully', 'system');
        this.addTimelineEvent('Geofences saved to server', 'saved');
        console.log('Save result:', result);
    } catch (error) {
        console.error('Error saving geofences:', error);
        this.addAlert('Failed to save geofences', 'error');
    }
}
```

### Step 8: Authentication

Add authentication token management:

```javascript
// Add to config.js
const AUTH = {
    token: null,
    
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
        API_CONFIG.HEADERS['Authorization'] = `Bearer ${token}`;
    },
    
    getToken() {
        if (!this.token) {
            this.token = localStorage.getItem('auth_token');
            if (this.token) {
                API_CONFIG.HEADERS['Authorization'] = `Bearer ${this.token}`;
            }
        }
        return this.token;
    },
    
    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
        delete API_CONFIG.HEADERS['Authorization'];
    }
};

// Usage in app
AUTH.setToken('your-jwt-token-here');
```

## 🔐 CORS Configuration

Your backend needs these headers:

```javascript
// Express.js example
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Or specific domain
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
```

## 📡 WebSocket Message Format

### Server → Client

```javascript
// Worker position update
{
    "type": "worker_position",
    "workerId": "W001",
    "lat": 40.7128,
    "lng": -74.0060,
    "timestamp": "2024-01-15T10:30:00Z"
}

// Worker full update
{
    "type": "worker_update",
    "worker": {
        "id": "W001",
        "name": "Sarah Johnson",
        "status": "active",
        "lat": 40.7128,
        "lng": -74.0060,
        "color": "#22c55e",
        "department": "Field Operations"
    }
}

// Geofence alert
{
    "type": "geofence_alert",
    "message": "Sarah Johnson entered Warehouse District",
    "alertType": "entered",
    "workerId": "W001",
    "geofenceId": "GF001",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### Client → Server

```javascript
// Subscribe to worker updates
{
    "type": "subscribe",
    "channel": "workers"
}

// Unsubscribe
{
    "type": "unsubscribe",
    "channel": "workers"
}
```

## 🧪 Testing API Integration

### 1. Test with Mock API

Use [JSONPlaceholder](https://jsonplaceholder.typicode.com/) or [Mockoon](https://mockoon.com/) for testing.

### 2. Test with Postman

Create requests for each endpoint and verify responses match expected format.

### 3. Test CORS

```javascript
// In browser console
fetch('https://api.yourbackend.com/api/workers')
    .then(r => r.json())
    .then(console.log)
    .catch(console.error);
```

### 4. Test WebSocket

```javascript
// In browser console
const ws = new WebSocket('wss://api.yourbackend.com/ws');
ws.onmessage = (e) => console.log('Received:', e.data);
ws.onopen = () => console.log('Connected');
ws.onerror = (e) => console.error('Error:', e);
```

## 🔄 Migration Checklist

- [ ] Backend API endpoints ready
- [ ] CORS configured
- [ ] Response formats match mock data
- [ ] Authentication implemented
- [ ] config.js created with API URLs
- [ ] loadWorkers() updated
- [ ] loadHistory() updated
- [ ] loadGeofences() updated
- [ ] saveGeofences() updated
- [ ] Polling or WebSocket implemented
- [ ] Error handling added
- [ ] Fallback to mock data working
- [ ] Tested in development
- [ ] Tested in production

## 🚀 Deployment with API

Update environment variables:

```bash
# .env file
API_BASE_URL=https://api.yourbackend.com
WS_URL=wss://api.yourbackend.com/ws
```

Load in config.js:

```javascript
const API_CONFIG = {
    BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
    WS_URL: process.env.WS_URL || 'ws://localhost:3000/ws',
    // ...
};
```

## 📊 Performance Optimization

### 1. Debounce Updates

```javascript
let updateTimeout;
function debouncedUpdate(worker) {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
        updateWorker(worker);
    }, 100);
}
```

### 2. Batch Updates

```javascript
let updateQueue = [];
function queueUpdate(worker) {
    updateQueue.push(worker);
}

setInterval(() => {
    if (updateQueue.length > 0) {
        updateWorkers(updateQueue);
        updateQueue = [];
    }
}, 1000);
```

### 3. Cache Responses

```javascript
const cache = new Map();

async function fetchWithCache(url, ttl = 60000) {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    cache.set(url, {
        data,
        timestamp: Date.now()
    });
    
    return data;
}
```

## 🐛 Debugging API Issues

```javascript
// Add to config.js
const DEBUG = true;

// Wrap fetch calls
async function apiFetch(url, options = {}) {
    if (DEBUG) {
        console.log('API Request:', url, options);
    }
    
    const response = await fetch(url, options);
    
    if (DEBUG) {
        console.log('API Response:', response.status, response.statusText);
    }
    
    return response;
}
```

## 📝 Example Backend (Node.js/Express)

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Workers endpoint
app.get('/api/workers', (req, res) => {
    res.json([
        {
            id: 'W001',
            name: 'Sarah Johnson',
            status: 'active',
            lat: 40.7128,
            lng: -74.0060,
            color: '#22c55e',
            department: 'Field Operations'
        }
    ]);
});

// History endpoint
app.get('/api/history', (req, res) => {
    res.json({
        W001: [
            { lat: 40.7100, lng: -74.0080, timestamp: '09:00' }
        ]
    });
});

// Geofences endpoint
app.get('/api/geofences', (req, res) => {
    res.json([
        {
            id: 'GF001',
            name: 'Warehouse District',
            type: 'rectangle',
            coordinates: [[40.7080, -74.0120], [40.7080, -74.0080]],
            color: '#3b82f6',
            alert: true
        }
    ]);
});

// Save geofences
app.post('/api/geofences', (req, res) => {
    const { geofences } = req.body;
    // Save to database
    res.json({ success: true, count: geofences.length });
});

app.listen(3000, () => {
    console.log('API running on http://localhost:3000');
});
```

---

**You're now ready to connect TrackFlow to a real backend!** 🚀

Start with polling for simplicity, then upgrade to WebSockets for real-time updates.
