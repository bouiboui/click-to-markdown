# Quick Setup Guide

## Prerequisites
- Google Chrome browser
- The extension files (already in this directory)

## Step-by-Step Installation

### 1. Icons

The extension includes icon files (`icon16.png`, `icon48.png`, `icon128.png`). If you want to customize them, you can replace these files with your own PNG images of the same sizes.

### 2. Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **"Load unpacked"**
5. Select this folder (`click-to-markdown`)
6. Extension should appear in your list!

### 3. Use the Extension

1. Click the extension icon in Chrome toolbar
2. Click "Toggle Inspector"
3. Hover over elements on any webpage
4. Click to copy as Markdown!

## Troubleshooting

**Extension won't load:**
- Check that all files are present
- Verify `manifest.json` is valid
- Make sure you selected the correct folder

**Icons missing:**
- Extension still works, just shows default icon
- Create icons manually using any image editor (16x16, 48x48, 128x128 pixels)

**Inspector not working:**
- Refresh the page after toggling
- Check browser console (F12) for errors
- Try on a different website

## File Checklist

✅ `manifest.json` - Extension configuration
✅ `popup.html` - Popup UI
✅ `popup.js` - Popup logic
✅ `background.js` - Service worker
✅ `content.js` - Content script
✅ `styles.css` - Styles
✅ `lib/turndown.js` - Markdown converter
✅ `icon16.png` - Extension icon
✅ `icon48.png` - Extension icon
✅ `icon128.png` - Extension icon

## Need Help?

See `README.md` for detailed documentation.
