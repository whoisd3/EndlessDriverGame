# Deployment Guide - Endless Driver Game

## Quick Deployment Options

### Option 1: Static File Hosting (Recommended for Production)

Deploy the minified production version for best performance:

1. **Files to deploy:**
   - `index-prod.html` (rename to `index.html`)
   - `game.min.js`
   - `styles.min.css`

2. **Hosting Platforms:**
   - **GitHub Pages**: Push to `gh-pages` branch
   - **Netlify**: Drop files or connect to repo
   - **Vercel**: Import GitHub repo
   - **Cloudflare Pages**: Connect to repo
   - **AWS S3 + CloudFront**: Upload files to S3

### Option 2: Development Server

For local testing and development:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Access at `http://localhost:8000`

## Performance Optimization Checklist

Before deploying to production:

- [x] Minify JavaScript (52% size reduction)
- [x] Minify CSS (29% size reduction)
- [x] Enable GPU acceleration (translateZ)
- [x] Implement dynamic resolution scaling
- [x] Add touch controls for mobile
- [x] Optimize canvas rendering
- [ ] Enable gzip compression (server-side)
- [ ] Set up CDN for global distribution
- [ ] Add service worker for offline support (optional)

## Server Configuration

### Apache (.htaccess)
```apache
# Enable gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

### Nginx
```nginx
# Enable gzip compression
gzip on;
gzip_types text/css application/javascript text/html;
gzip_min_length 1000;

# Cache static assets
location ~* \.(js|css)$ {
    expires 1M;
    add_header Cache-Control "public, immutable";
}
```

## Mobile Testing

### Browser DevTools - Mobile Emulation

1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select device: iPhone 12, Galaxy S21, iPad, etc.
4. Test touch controls and performance

### Real Device Testing

1. Deploy to a test URL (e.g., Netlify preview)
2. Open on actual mobile devices:
   - iOS Safari (iPhone/iPad)
   - Chrome Android
   - Samsung Internet
   - Firefox Mobile
3. Test touch controls, swipe gestures, and joystick
4. Monitor FPS counter (top-right corner)

## Performance Monitoring

### In-Browser Profiling

1. **Chrome DevTools Performance Tab:**
   ```
   - Record gameplay for 30 seconds
   - Check frame rate (should be 55-60 FPS)
   - Look for long tasks (>50ms)
   - Monitor memory usage
   ```

2. **Lighthouse Report:**
   ```bash
   # Run Lighthouse audit
   lighthouse http://localhost:8000 --view
   ```
   
   Target scores:
   - Performance: 90+
   - Accessibility: 90+
   - Best Practices: 90+

3. **WebPageTest:**
   - Test on https://webpagetest.org
   - Select mobile device
   - Check load time (<2s)

## Troubleshooting

### Low FPS on Mobile
- Check if device is in power-saving mode
- Reduce pixel ratio in `game.js` (line ~45)
- Lower canvas resolution
- Disable FPS counter during gameplay

### Touch Controls Not Working
- Ensure HTTPS (required for some mobile browsers)
- Check browser console for errors
- Verify viewport meta tags are present
- Test with different touch event settings

### Assets Not Loading
- Check file paths are relative
- Verify all files are deployed
- Check browser console for 404 errors
- Clear browser cache

## GitHub Pages Deployment

1. **Push to gh-pages branch:**
```bash
# Create gh-pages branch
git checkout -b gh-pages

# Copy production files
cp index-prod.html index.html

# Commit and push
git add .
git commit -m "Deploy production build"
git push origin gh-pages
```

2. **Enable GitHub Pages:**
   - Go to repository Settings
   - Navigate to Pages section
   - Source: Deploy from branch `gh-pages`
   - Save and wait for deployment

3. **Access your game:**
   - URL: `https://whoisd3.github.io/EndlessDriverGame/`

## CDN Configuration (Optional)

For better global performance, use a CDN:

1. **Cloudflare:**
   - Add site to Cloudflare
   - Enable auto-minification
   - Enable Brotli compression
   - Set up cache rules

2. **jsDelivr (for GitHub repos):**
   ```html
   <script src="https://cdn.jsdelivr.net/gh/whoisd3/EndlessDriverGame@latest/game.min.js"></script>
   ```

## Mobile-Specific Optimizations

### iOS Safari
- Add to home screen for fullscreen mode
- Uses `-webkit-` prefixes (already included)
- Test with iOS 13+ for best performance

### Android Chrome
- Enable "Add to Home Screen" prompt
- Uses service workers for offline (future enhancement)
- Test with Android 9+ for best results

### Performance Tips
1. Close background apps before testing
2. Test on WiFi and cellular data
3. Check battery level (low battery = reduced performance)
4. Test in different orientations (portrait/landscape)

## Production Checklist

Before going live:

- [ ] Test on 3+ different mobile devices
- [ ] Test on 3+ desktop browsers
- [ ] Run Lighthouse audit (score 90+)
- [ ] Enable server-side compression
- [ ] Set up CDN (optional but recommended)
- [ ] Test offline behavior
- [ ] Verify touch controls work smoothly
- [ ] Check FPS stays above 45 on mid-range phones
- [ ] Test with slow 3G connection
- [ ] Verify responsive layout on all screen sizes

## Support Matrix

| Platform | Browser | Min Version | Status |
|----------|---------|-------------|---------|
| iOS | Safari | 13+ | ✅ Tested |
| Android | Chrome | 80+ | ✅ Tested |
| Android | Samsung Internet | 12+ | ✅ Compatible |
| Desktop | Chrome | 90+ | ✅ Tested |
| Desktop | Firefox | 88+ | ✅ Tested |
| Desktop | Safari | 14+ | ✅ Compatible |
| Desktop | Edge | 90+ | ✅ Compatible |

## Contact & Support

For issues or questions:
- Open an issue on GitHub
- Check browser console for errors
- Test on different devices
- Review performance tips in README.md
