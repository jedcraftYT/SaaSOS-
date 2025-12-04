# TrackFlow - Premium GPS Tracking Dashboard

A complete, front-end-only GPS tracking dashboard built with Alpine.js, TailwindCSS, and Leaflet.js.

## Features

- **Real-time Worker Tracking**: Monitor 8 field workers with live position updates
- **Status Management**: Active, Idle, and Offline worker states with visual indicators
- **Geofencing**: Create and manage geofences using polygons, rectangles, circles, or coordinates
- **Movement History**: View worker routes with animated polylines
- **Alerts System**: Real-time alerts for geofence entries/exits
- **Timeline**: Complete event log of all system activities
- **Statistics Dashboard**: Live stats for workers and distance tracking
- **Data Export**: Export all data as JSON

## Tech Stack

- **Alpine.js**: State management and interactivity
- **TailwindCSS**: Premium UI styling with glassmorphism
- **Leaflet.js**: Interactive mapping
- **Leaflet.Draw**: Geofence drawing tools
- **Mock Data**: JSON files (no backend required)

## Getting Started

### Option 1: Python HTTP Server

```bash
cd public
python -m http.server 8000
```

Then open: http://localhost:8000

### Option 2: Node.js HTTP Server

```bash
cd public
npx http-server -p 8000
```

Then open: http://localhost:8000

### Option 3: PHP Server

```bash
cd public
php -S localhost:8000
```

Then open: http://localhost:8000

## Project Structure

```
/public
  index.html
  /assets
    /js
      app.js          - Alpine store & global logic
      map.js          - Map initialization & worker markers
      geofence.js     - Geofence drawing & management
      ui.js           - UI helpers
      utils.js        - Utility functions (distance calc, etc.)
    /data
      workers.json    - Worker data
      history.json    - Movement history
      geofences.json  - Geofence definitions
```

## Usage

### Tools Panel

- **Draw Polygon**: Click to start drawing a custom polygon geofence
- **Draw Rectangle**: Click to draw a rectangular geofence
- **Draw Circle**: Click to draw a circular geofence
- **Square from Coordinates**: Enter two corner coordinates to create a precise rectangle
- **Toggle Geofences**: Show/hide all geofences on the map
- **Toggle History**: Show/hide movement history for selected worker
- **Zoom Controls**: Zoom to all workers, selected worker, or selected geofence
- **Save**: Mock save operation (adds alert + timeline event)
- **Export**: Download all data as JSON file

### Worker List

- Click any worker to select and zoom to their location
- Selected worker shows history trail when history toggle is enabled
- Color-coded status indicators (green=active, yellow=idle, red=offline)

### Alerts

- Real-time notifications when workers enter/exit geofences
- Color-coded by alert type
- Shows last 10 alerts

### Timeline

- Complete event log of all activities
- Collapsible panel
- Shows last 20 events
- Color-coded by event type

## Customization

### Change Map Center

Edit `map.js`, line 5:
```javascript
.setView([40.7128, -74.0060], 14); // [lat, lng], zoom
```

### Add More Workers

Edit `assets/data/workers.json` and add worker objects.

### Modify Geofences

Edit `assets/data/geofences.json` to add/modify geofences.

### Change Theme Colors

Edit the Tailwind classes in `index.html` or add custom CSS.

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari

## Notes

- This is a frontend-only demo using mock data
- Worker positions simulate movement every 3 seconds
- All data is client-side only (no persistence)
- Ready to integrate with a real backend API

## License

MIT License - Free to use and modify
