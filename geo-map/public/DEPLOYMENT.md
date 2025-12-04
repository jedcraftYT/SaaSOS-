# Deployment Guide

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)

**Easiest deployment with drag-and-drop:**

1. Go to [netlify.com](https://netlify.com)
2. Sign up/login
3. Drag the `public` folder to the deploy zone
4. Done! Your site is live

**Or via CLI:**
```bash
npm install -g netlify-cli
cd public
netlify deploy --prod
```

### Option 2: Vercel

```bash
npm install -g vercel
cd public
vercel --prod
```

### Option 3: GitHub Pages

1. Create a new GitHub repository
2. Push the `public` folder contents to the repo
3. Go to Settings > Pages
4. Select branch and `/` (root) folder
5. Save and wait for deployment

### Option 4: AWS S3 + CloudFront

```bash
# Install AWS CLI
aws s3 sync public/ s3://your-bucket-name --acl public-read

# Configure CloudFront distribution pointing to S3 bucket
```

### Option 5: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select public folder
firebase deploy
```

### Option 6: Surge.sh

```bash
npm install -g surge
cd public
surge
```

### Option 7: Docker

Create `Dockerfile` in project root:

```dockerfile
FROM nginx:alpine
COPY public /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t trackflow .
docker run -p 8080:80 trackflow
```

### Option 8: Traditional Web Hosting

1. Get hosting (Bluehost, HostGator, etc.)
2. Upload `public` folder contents via FTP
3. Access via your domain

## 🔧 Configuration

### Custom Domain

Most platforms support custom domains:

**Netlify:**
- Domains > Add custom domain
- Update DNS records as instructed

**Vercel:**
- Settings > Domains > Add
- Follow DNS instructions

**GitHub Pages:**
- Add `CNAME` file with your domain
- Update DNS to point to GitHub

### Environment Variables

If you need to add API endpoints later:

**Create `config.js`:**
```javascript
window.CONFIG = {
    API_URL: 'https://api.yourbackend.com',
    WS_URL: 'wss://api.yourbackend.com',
    MAP_CENTER: [40.7128, -74.0060],
    MAP_ZOOM: 14
};
```

**Load before other scripts:**
```html
<script src="config.js"></script>
<script src="assets/js/app.js"></script>
```

### CDN Optimization

For production, consider self-hosting libraries:

1. Download libraries:
   - Leaflet.js
   - Leaflet.Draw
   - Alpine.js
   - Tailwind CSS

2. Place in `assets/vendor/`

3. Update script/link tags in `index.html`

## 🚀 Performance Optimization

### 1. Minify JavaScript

```bash
npm install -g terser

terser assets/js/app.js -o assets/js/app.min.js
terser assets/js/map.js -o assets/js/map.min.js
terser assets/js/geofence.js -o assets/js/geofence.min.js
terser assets/js/ui.js -o assets/js/ui.min.js
terser assets/js/utils.js -o assets/js/utils.min.js
```

Update HTML to use `.min.js` files.

### 2. Enable Gzip Compression

**Nginx:**
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

**Apache (.htaccess):**
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/json application/javascript
</IfModule>
```

### 3. Add Caching Headers

**Nginx:**
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|json)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Apache (.htaccess):**
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/json "access plus 1 week"
</IfModule>
```

### 4. Use CDN for Assets

Upload static assets to a CDN:
- Cloudflare
- AWS CloudFront
- Fastly
- BunnyCDN

### 5. Lazy Load Images

If you add images later:
```html
<img src="image.jpg" loading="lazy" alt="Description">
```

## 🔒 Security Headers

Add these headers for production:

**Nginx:**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https: 'unsafe-inline' 'unsafe-eval';" always;
```

**Apache (.htaccess):**
```apache
Header set X-Frame-Options "SAMEORIGIN"
Header set X-Content-Type-Options "nosniff"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "no-referrer-when-downgrade"
```

## 📊 Analytics

### Google Analytics

Add before `</head>`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Plausible Analytics (Privacy-friendly)

```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

## 🧪 Testing Before Deployment

1. **Test locally:**
   ```bash
   cd public
   python -m http.server 8000
   ```

2. **Check all features:**
   - Workers loading and moving
   - Geofences visible
   - Drawing tools working
   - History rendering
   - Alerts triggering
   - Export downloading

3. **Test in multiple browsers:**
   - Chrome
   - Firefox
   - Safari
   - Edge

4. **Check console:**
   - No errors
   - No warnings
   - All resources loaded

5. **Test on mobile:**
   - Responsive layout
   - Touch interactions
   - Performance

## 🐛 Troubleshooting

### CORS Issues
If loading from `file://`, use a local server instead.

### CDN Resources Not Loading
- Check internet connection
- Try alternative CDN URLs
- Self-host libraries

### Map Not Displaying
- Check Leaflet CSS is loaded
- Verify map container has height
- Check browser console for errors

### Workers Not Moving
- Check JavaScript console
- Verify workers.json loaded
- Check simulation interval running

## 📱 Mobile Optimization

For mobile deployment, consider:

1. **Viewport meta tag** (already included)
2. **Touch-friendly buttons** (already sized appropriately)
3. **Responsive sidebar** (consider collapsible on mobile)
4. **Reduced animations** on low-power devices

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Netlify
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        with:
          args: deploy --dir=public --prod
```

## 📝 Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] All workers visible on map
- [ ] Geofences rendering
- [ ] Drawing tools functional
- [ ] History displays correctly
- [ ] Alerts triggering
- [ ] Timeline updating
- [ ] Export working
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Fast load time (<3s)
- [ ] Analytics tracking
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Backup created

## 🎉 You're Live!

Your TrackFlow dashboard is now deployed and ready for users!

**Next Steps:**
1. Share the URL with your team
2. Gather feedback
3. Monitor analytics
4. Plan backend integration
5. Add custom features

Need help? Check the README.md and FEATURES.md files.
