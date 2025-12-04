# Quick Start Guide

## Start the Dashboard in 30 Seconds

1. **Open Terminal** in the `public` folder

2. **Run a local server** (choose one):

   ```bash
   # Python 3
   python -m http.server 8000
   
   # OR Node.js
   npx http-server -p 8000
   
   # OR PHP
   php -S localhost:8000
   ```

3. **Open Browser**: http://localhost:8000

4. **Done!** The dashboard should load with:
   - 8 workers on the map
   - Live position updates every 3 seconds
   - 5 pre-configured geofences
   - Full interactive controls in the left sidebar

## First Steps

1. **Watch Workers Move**: Active workers (green) will move automatically
2. **Click a Worker**: Select from the list to zoom and view details
3. **Toggle History**: Enable history toggle, then click a worker to see their route
4. **Draw a Geofence**: Click "Draw Polygon" and click points on the map
5. **Create from Coordinates**: Click "Square from Coordinates" and enter lat/lng values
6. **View Alerts**: Watch the alerts panel for geofence entry/exit notifications
7. **Export Data**: Click "Export" to download all data as JSON

## Troubleshooting

**Map not loading?**
- Check browser console for errors
- Ensure you're serving via HTTP (not opening file:// directly)
- Check internet connection (CDN resources needed)

**Workers not moving?**
- Check browser console
- Refresh the page
- Ensure JavaScript is enabled

**Drawing not working?**
- Click a draw button first
- Click on the map to place points
- Double-click or press Enter to finish

## Tips

- Use the range selector (1 Day/Week/Month) to see different distance calculations
- Click "Zoom to All Workers" to see everyone at once
- Toggle geofences off for a cleaner map view
- Open timeline to see complete event history
- Try creating a geofence around a moving worker to trigger alerts

Enjoy TrackFlow! 🚀
