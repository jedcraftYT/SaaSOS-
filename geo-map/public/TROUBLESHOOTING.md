# Troubleshooting Guide

## 🔍 Common Issues and Solutions

### Issue: Map Not Displaying

**Symptoms:**
- Blank white/gray area where map should be
- Console error: "Map container not found"

**Solutions:**
1. **Check you're using HTTP server** (not file://)
   ```bash
   # Use one of these:
   python -m http.server 8000
   npx http-server -p 8000
   php -S localhost:8000
   ```

2. **Verify Leaflet CSS loaded**
   - Open browser DevTools (F12)
   - Check Network tab for leaflet.css
   - Should return 200 status

3. **Check internet connection**
   - CDN resources require internet
   - Try refreshing the page

4. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Issue: Workers Not Appearing

**Symptoms:**
- Map loads but no worker markers
- Empty workers list in sidebar

**Solutions:**
1. **Check console for errors**
   - Open DevTools (F12) > Console tab
   - Look for fetch errors

2. **Verify workers.json exists**
   ```bash
   # Should exist at:
   public/assets/data/workers.json
   ```

3. **Check JSON syntax**
   - Use JSONLint.com to validate
   - Ensure no trailing commas

4. **Verify file path**
   - Check browser Network tab
   - Should fetch from: assets/data/workers.json
   - Should return 200 status

### Issue: Workers Not Moving

**Symptoms:**
- Workers appear but stay stationary
- No position updates

**Solutions:**
1. **Check JavaScript console**
   - Look for errors in simulation code
   - Verify no script loading failures

2. **Verify Alpine.js loaded**
   - Console: `typeof Alpine`
   - Should return "object", not "undefined"

3. **Check simulation interval**
   - Console: `Alpine.store('App').simulationInterval`
   - Should return a number (interval ID)

4. **Refresh the page**
   - Sometimes initialization fails
   - Hard refresh: Ctrl+Shift+R

### Issue: Drawing Tools Not Working

**Symptoms:**
- Click draw button but nothing happens
- Can't draw on map

**Solutions:**
1. **Verify Leaflet.Draw loaded**
   - Console: `typeof L.Draw`
   - Should return "object"

2. **Check for JavaScript errors**
   - Open console before clicking draw button
   - Look for errors when button clicked

3. **Try different draw mode**
   - If polygon fails, try rectangle
   - Helps isolate the issue

4. **Reload page and try again**
   - Drawing state can get stuck
   - Fresh start often fixes it

### Issue: Geofences Not Visible

**Symptoms:**
- Geofences created but not showing
- Toggle doesn't work

**Solutions:**
1. **Check toggle state**
   - Should show "✓ Geofences" when on
   - Click toggle to enable

2. **Verify geofences.json loaded**
   - Console: `Alpine.store('App').geofences`
   - Should return array of geofences

3. **Check map layers**
   - Console: `Alpine.store('App').layers.geofenceLayers`
   - Should contain geofence layers

4. **Zoom out**
   - Geofences might be outside current view
   - Click "Zoom to All Workers"

### Issue: History Not Showing

**Symptoms:**
- Toggle history but no route appears
- Selected worker but no line

**Solutions:**
1. **Ensure worker is selected**
   - Click a worker in the list first
   - Should highlight in blue

2. **Check history toggle is ON**
   - Should show "✓ History"
   - Click to enable if not

3. **Verify history.json loaded**
   - Console: `Alpine.store('App').history`
   - Should return object with worker IDs

4. **Check worker has history**
   - Some workers might have no history data
   - Try different worker

### Issue: Alerts Not Triggering

**Symptoms:**
- Workers enter geofences but no alerts
- Alert panel stays empty

**Solutions:**
1. **Verify geofences are alert-enabled**
   - Check geofences.json
   - `"alert": true` should be set

2. **Check collision detection**
   - Console: `Alpine.store('App').workerStates`
   - Should track worker positions

3. **Wait for movement**
   - Alerts only trigger on state change
   - Worker must cross geofence boundary

4. **Check alert array**
   - Console: `Alpine.store('App').alerts`
   - Should populate when alerts trigger

### Issue: Export Not Working

**Symptoms:**
- Click export but nothing downloads
- No file dialog appears

**Solutions:**
1. **Check browser download settings**
   - Ensure downloads not blocked
   - Check download folder

2. **Try different browser**
   - Some browsers block auto-downloads
   - Chrome/Firefox usually work best

3. **Check console for errors**
   - Look for blob/download errors

4. **Verify data exists**
   - Console: `Alpine.store('App')`
   - Should have workers, geofences, etc.

### Issue: Coordinate Modal Not Opening

**Symptoms:**
- Click "Square from Coordinates" but no modal
- Modal appears but can't interact

**Solutions:**
1. **Check modal state**
   - Console: `Alpine.store('App').showCoordinateModal`
   - Should be true when open

2. **Look for z-index issues**
   - Modal should have z-index: 9999
   - Check if something covering it

3. **Try clicking outside modal**
   - Should close modal
   - Then try opening again

4. **Refresh page**
   - Modal state can get stuck

### Issue: Slow Performance

**Symptoms:**
- Laggy animations
- Slow map interactions
- Delayed updates

**Solutions:**
1. **Close other browser tabs**
   - Free up memory
   - Reduce CPU usage

2. **Disable browser extensions**
   - Some extensions slow down pages
   - Try incognito mode

3. **Reduce simulation frequency**
   - Edit app.js line with setInterval
   - Change 3000 to 5000 (5 seconds)

4. **Hide history when not needed**
   - History rendering is intensive
   - Toggle off when not using

### Issue: Styling Looks Wrong

**Symptoms:**
- No glassmorphism effect
- Colors look off
- Layout broken

**Solutions:**
1. **Verify TailwindCSS loaded**
   - Check Network tab for tailwindcss.com
   - Should return 200 status

2. **Check browser compatibility**
   - Use modern browser (Chrome, Firefox, Safari, Edge)
   - Update to latest version

3. **Clear browser cache**
   - Old CSS might be cached
   - Hard refresh: Ctrl+Shift+R

4. **Check for CSS conflicts**
   - Disable browser extensions
   - Try incognito mode

### Issue: Console Errors

**Common Errors and Fixes:**

**Error: "Cannot read property 'map' of undefined"**
- Data not loaded yet
- Check network requests
- Verify JSON files exist

**Error: "Alpine is not defined"**
- Alpine.js not loaded
- Check script tag
- Verify CDN accessible

**Error: "L is not defined"**
- Leaflet not loaded
- Check script order
- Leaflet must load before app scripts

**Error: "Failed to fetch"**
- CORS issue (using file://)
- Use HTTP server instead
- Or check file paths

**Error: "Unexpected token in JSON"**
- JSON syntax error
- Validate JSON files
- Check for trailing commas

## 🧪 Testing Checklist

Run through this checklist to verify everything works:

- [ ] Page loads without console errors
- [ ] Map displays with dark theme
- [ ] 8 workers visible on map
- [ ] Workers have colored markers
- [ ] Active workers are pulsing
- [ ] Stats cards show correct counts
- [ ] Workers list is populated
- [ ] Click worker zooms to location
- [ ] Time range selector works
- [ ] Draw Polygon button starts drawing
- [ ] Draw Rectangle button starts drawing
- [ ] Draw Circle button starts drawing
- [ ] Coordinate modal opens
- [ ] Can create geofence from coordinates
- [ ] Geofences visible on map
- [ ] Toggle geofences works
- [ ] Toggle history works
- [ ] History shows for selected worker
- [ ] Zoom to all workers works
- [ ] Zoom to selected worker works
- [ ] Zoom to geofence works
- [ ] Alerts appear when workers move
- [ ] Timeline updates with events
- [ ] Timeline toggle works
- [ ] Save button triggers alert
- [ ] Export downloads JSON file
- [ ] Workers move every 3 seconds
- [ ] No console errors during use

## 🔧 Debug Mode

Add this to browser console for detailed logging:

```javascript
// Enable debug mode
Alpine.store('App').debug = true;

// Watch state changes
Alpine.effect(() => {
    console.log('Workers:', Alpine.store('App').workers.length);
    console.log('Geofences:', Alpine.store('App').geofences.length);
    console.log('Alerts:', Alpine.store('App').alerts.length);
});

// Check simulation
console.log('Simulation running:', !!Alpine.store('App').simulationInterval);

// Check map
console.log('Map initialized:', !!Alpine.store('App').map);

// Check layers
console.log('Markers:', Object.keys(Alpine.store('App').layers.markers).length);
console.log('Geofence layers:', Object.keys(Alpine.store('App').layers.geofenceLayers).length);
```

## 📞 Still Having Issues?

1. **Run test.html first**
   - Open public/test.html
   - Checks all dependencies
   - Shows what's failing

2. **Check browser console**
   - F12 to open DevTools
   - Look for red errors
   - Read error messages carefully

3. **Verify file structure**
   ```
   public/
   ├── index.html
   └── assets/
       ├── js/
       │   ├── app.js
       │   ├── map.js
       │   ├── geofence.js
       │   ├── ui.js
       │   └── utils.js
       └── data/
           ├── workers.json
           ├── history.json
           └── geofences.json
   ```

4. **Try different browser**
   - Chrome (recommended)
   - Firefox
   - Edge
   - Safari

5. **Check internet connection**
   - CDN resources need internet
   - Try loading: https://cdn.tailwindcss.com
   - Should show JavaScript code

6. **Start fresh**
   - Close all browser tabs
   - Clear cache
   - Restart browser
   - Try again

## 💡 Pro Tips

1. **Always use HTTP server** - Never open index.html directly
2. **Check console first** - Most issues show errors there
3. **Use modern browser** - Chrome/Firefox work best
4. **Clear cache often** - Prevents stale resource issues
5. **Test in incognito** - Isolates extension conflicts

## 🎯 Quick Fixes

**Nothing works:**
```bash
# Start over
cd public
python -m http.server 8000
# Open http://localhost:8000
# Hard refresh: Ctrl+Shift+R
```

**Map blank:**
```javascript
// Console check
typeof L // should be "object"
typeof L.map // should be "function"
```

**Workers not loading:**
```javascript
// Console check
fetch('assets/data/workers.json')
    .then(r => r.json())
    .then(console.log)
```

**Alpine not working:**
```javascript
// Console check
typeof Alpine // should be "object"
Alpine.store('App') // should return store object
```

---

**Still stuck?** Double-check you're using an HTTP server and have internet access for CDN resources. Those two issues cause 90% of problems.
