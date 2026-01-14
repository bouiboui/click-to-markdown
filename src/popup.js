document.addEventListener('DOMContentLoaded', async () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const status = document.getElementById('status');
  const warning = document.getElementById('warning');
  const reloadBtn = document.getElementById('reloadBtn');

  // Inject content scripts dynamically
  async function injectContentScripts(tabId) {
    try {
      // Check if scripts are already injected
      try {
        const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        if (response && response.ready === true) {
          return true; // Already injected
        }
      } catch (e) {
        // Scripts not injected yet, continue to inject
      }

      // Inject CSS first
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['styles.css']
      });

      // Inject JavaScript files in order
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['lib/turndown.js']
      });

      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });

      // Wait a bit for scripts to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify injection
      const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      return response && response.ready === true;
    } catch (error) {
      console.error('Error injecting content scripts:', error);
      return false;
    }
  }

  // Check if content script is available
  async function checkContentScriptAvailable() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return false;
      
      // Skip check for chrome:// and other special pages
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://'))) {
        return false;
      }

      // Try to inject scripts if not available
      const injected = await injectContentScripts(tab.id);
      if (!injected) {
        return false;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
      return response && response.ready === true;
    } catch (error) {
      // Content script not available
      return false;
    }
  }

  // Get current state
  const result = await chrome.storage.local.get(['inspectorActive']);
  const isActive = result.inspectorActive || false;

  // Check content script availability
  const scriptAvailable = await checkContentScriptAvailable();
  updateUI(isActive, scriptAvailable);

  toggleBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        updateUI(isActive, false);
        return;
      }

      // Skip for special pages
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://'))) {
        updateUI(isActive, false);
        return;
      }

      // Inject scripts if needed
      const scriptAvailable = await injectContentScripts(tab.id);
      if (!scriptAvailable) {
        updateUI(isActive, false);
        return;
      }

      const result = await chrome.storage.local.get(['inspectorActive']);
      const newState = !result.inspectorActive;

      // Update storage
      await chrome.storage.local.set({ inspectorActive: newState });

      // Send message to content script
      await chrome.tabs.sendMessage(tab.id, {
        action: 'toggleInspector',
        active: newState
      });
      
      updateUI(newState, true);
      
      // Close popup after toggling inspector on to prevent two-click issue
      if (newState === true) {
        setTimeout(() => {
          window.close();
        }, 100);
      }
    } catch (error) {
      console.error('Error toggling inspector:', error);
      updateUI(isActive, false);
    }
  });

  // Reload page button
  reloadBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      chrome.tabs.reload(tab.id);
      window.close();
    }
  });

  function updateUI(isActive, scriptAvailable = true) {
    if (!scriptAvailable) {
      // Show warning state
      toggleBtn.disabled = true;
      toggleBtn.style.opacity = '0.6';
      toggleBtn.style.cursor = 'not-allowed';
      status.textContent = 'Inspector: Unavailable';
      status.style.color = '#856404';
      warning.classList.add('show');
      reloadBtn.style.display = 'block';
      return;
    }

    // Normal state
    toggleBtn.disabled = false;
    toggleBtn.style.opacity = '1';
    toggleBtn.style.cursor = 'pointer';
    warning.classList.remove('show');
    reloadBtn.style.display = 'none';

    if (isActive) {
      toggleBtn.textContent = 'Turn Off Inspector';
      toggleBtn.className = 'toggle-button active';
      status.textContent = 'Inspector: On';
      status.style.color = '#666';
    } else {
      toggleBtn.textContent = 'Toggle Inspector';
      toggleBtn.className = 'toggle-button inactive';
      status.textContent = 'Inspector: Off';
      status.style.color = '#666';
    }
  }

  // Listen for state changes from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'inspectorStateChanged') {
      updateUI(message.active, true);
    }
  });
});
