# Click to Markdown Chrome Extension

A Chrome Extension (Manifest V3) that allows you to toggle an "Inspector Mode" to click any element on a webpage and instantly copy its content as Markdown to your clipboard.

## Features

- **Toggle Inspector Mode**: Simple popup UI with a big toggle button
- **Visual Highlighting**: Green dashed border around elements as you hover
- **One-Click Conversion**: Click any element to convert its HTML to Markdown
- **Auto-Copy**: Automatically copies the Markdown to your clipboard
- **Toast Notifications**: Visual feedback when content is copied
- **Auto-Disable**: Inspector mode automatically turns off after clicking an element

## Installation

### Step 1: Icons

The extension includes icon files (`icon16.png`, `icon48.png`, `icon128.png`). If you want to customize them, you can replace these files with your own PNG images of the same sizes (16x16, 48x48, and 128x128 pixels respectively).

### Step 2: Load the Extension in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** using the toggle switch in the top-right corner
4. Click **"Load unpacked"** button
5. Select the `click-to-markdown` directory (the folder containing `manifest.json`)
6. The extension should now appear in your extensions list

### Step 3: Pin the Extension (Optional)

1. Click the puzzle piece icon (Extensions) in Chrome's toolbar
2. Find "Click to Markdown" in the list
3. Click the pin icon to keep it visible in your toolbar

## Usage

1. **Open any webpage** where you want to extract content
2. **Click the extension icon** in your toolbar to open the popup
3. **Click "Toggle Inspector"** to activate Inspector Mode
4. **Hover over elements** on the page - they will be highlighted with a green dashed border
5. **Click any highlighted element** to:
   - Convert its HTML content to Markdown
   - Copy it to your clipboard
   - See a "Copied to Clipboard!" notification
   - Automatically turn off Inspector Mode

## File Structure

```
click-to-markdown/
├── manifest.json          # Extension manifest (Manifest V3)
├── popup.html             # Popup UI
├── popup.js               # Popup logic
├── background.js          # Service worker for state management
├── content.js             # Content script (highlighting & conversion)
├── styles.css             # Styles (mostly inline in content.js)
├── lib/
│   └── turndown.js        # HTML to Markdown converter library
├── icon16.png             # Extension icon (16x16)
├── icon48.png             # Extension icon (48x48)
├── icon128.png            # Extension icon (128x128)
└── README.md              # This file
```

## Technical Details

### Manifest V3 Compliance

- Uses service worker (`background.js`) instead of background page
- Content scripts are declared in manifest
- No remote code execution (turndown.js is bundled locally)

### Isolation

- Uses Shadow DOM to prevent CSS conflicts with page styles
- High z-index (2147483647) ensures overlay appears above all content
- Event listeners use capture phase to intercept clicks

### Libraries

- **Turndown.js**: HTML to Markdown conversion (v7.1.3)
  - Downloaded from jsDelivr CDN
  - Stored locally in `lib/` folder for offline use

## Troubleshooting

### Extension not loading
- Make sure all files are in the correct locations
- Check that `manifest.json` is valid JSON
- Verify icon files exist and are PNG format

### Inspector not highlighting
- Refresh the page after enabling Inspector Mode
- Check browser console for errors (F12 → Console)
- Ensure the page allows content scripts (some pages may block them)

### Markdown conversion not working
- Verify `lib/turndown.js` exists and is loaded
- Check browser console for JavaScript errors
- Try clicking a different element

### Clipboard not working
- Some pages may block clipboard access
- Try on a different website
- Check browser permissions for clipboard access

## Development

### Making Changes

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Reload the page you're testing on

### Testing

1. Load the extension in Chrome
2. Open any webpage
3. Toggle Inspector Mode
4. Hover and click elements to test conversion

## License

This extension uses:
- **Turndown.js** - Copyright (c) 2017+ Dom Christie - MIT License

## Support

For issues or questions, please check:
- Chrome Extension documentation: https://developer.chrome.com/docs/extensions/
- Turndown.js documentation: https://github.com/domchristie/turndown