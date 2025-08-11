# Inspector Jobs Carousel

An interactive job carousel for displaying the latest inspector job opportunities. Designed for integration with Wix websites and hosted on GitHub Pages.

## Features

- 🎠 **Interactive Carousel**: Smooth sliding carousel with navigation controls
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- 🔄 **Auto-play**: Automatically cycles through jobs every 5 seconds
- 🎯 **Touch Support**: Swipe gestures for mobile users
- 📊 **Live Data**: Connects to your Google Sheet for real-time job updates
- 🎨 **Professional Styling**: Modern design that matches professional websites
- ⚡ **Fast Loading**: Optimized for quick loading and smooth animations

## Setup Instructions

### 1. Create GitHub Repository
1. Create a new repository on GitHub
2. Upload these files:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`

### 2. Enable GitHub Pages
1. Go to repository Settings
2. Scroll to "Pages" section
3. Select "Deploy from a branch"
4. Choose "main" branch and "/ (root)" folder
5. Click Save

### 3. Configure Google Sheet Access
1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1E9Uu2I9cUGQjXqJ1hFX2LShOArmgQiPhMMECaj7BYz0
2. Go to File > Share > Publish to web
3. Choose "Entire Document" and "Comma-separated values (.csv)"
4. Copy the CSV URL and update the `SHEET_CSV_URL` in `script.js`

### 4. Wix Integration

#### Option 1: Embed HTML
1. Add an HTML element to your Wix page
2. Paste this code:
```html
<iframe src="https://YOUR-USERNAME.github.io/YOUR-REPO-NAME" 
        width="100%" height="600" frameborder="0">
</iframe>
```

#### Option 2: Custom Code
1. Add to Wix site header:
```html
<link rel="stylesheet" href="https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/styles.css">
```

2. Add HTML element with code:
```html
<div id="job-carousel-container"></div>
<script src="https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/script.js"></script>
```

## Customization

### Colors
Edit CSS custom properties in `styles.css`:
```css
:root {
    --primary-color: #3498db;
    --secondary-color: #2c3e50;
    --accent-color: #f39c12;
    --success-color: #27ae60;
}
```

### Job Display
- Modify `getSampleJobs()` function in `script.js` for fallback data
- Update `parseCSVToJobs()` to match your Google Sheet columns
- Change `slice(0, 10)` to show more/fewer jobs

### Auto-play Timing
Change interval in `startAutoPlay()` method:
```javascript
// Change 5000 to desired milliseconds
this.autoPlayInterval = setInterval(() => {
    this.nextSlide();
}, 5000);
```

## Troubleshooting

**Jobs not loading?**
- Check if Google Sheet is published to web
- Verify CSV URL in script.js
- Check browser console for errors

**Styling issues in Wix?**
- Use iframe method for better isolation
- Adjust iframe height as needed
- Check for CSS conflicts

**Mobile issues?**
- Test touch gestures
- Verify responsive breakpoints
- Check viewport meta tag

## Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## License

MIT License - feel free to customize for your needs!
