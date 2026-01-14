// Service worker for Click to Markdown extension
// Handles state synchronization across tabs

chrome.runtime.onInstalled.addListener((details) => {
  // Initialize storage
  chrome.storage.local.set({ inspectorActive: false });
  
  // Show onboarding page on first install
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('onboarding.html')
    });
  }
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
