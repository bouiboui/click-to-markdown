// Service worker for Click to Markdown extension
// Handles state synchronization across tabs

chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage
  chrome.storage.local.set({ inspectorActive: false });
});

// Listen for tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Ensure content script is ready
    chrome.tabs.sendMessage(tabId, { action: 'ping' }).catch(() => {
      // Content script not ready yet, that's okay
    });
  }
});