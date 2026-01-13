document.addEventListener('DOMContentLoaded', async () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const status = document.getElementById('status');

  // Get current state
  const result = await chrome.storage.local.get(['inspectorActive']);
  const isActive = result.inspectorActive || false;

  updateUI(isActive);

  toggleBtn.addEventListener('click', async () => {
    const result = await chrome.storage.local.get(['inspectorActive']);
    const newState = !result.inspectorActive;

    // Update storage
    await chrome.storage.local.set({ inspectorActive: newState });

    // Send message to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggleInspector',
        active: newState
      });
    }

    updateUI(newState);
  });

  function updateUI(isActive) {
    if (isActive) {
      toggleBtn.textContent = 'Turn Off Inspector';
      toggleBtn.className = 'toggle-button active';
      status.textContent = 'Inspector: On';
    } else {
      toggleBtn.textContent = 'Toggle Inspector';
      toggleBtn.className = 'toggle-button inactive';
      status.textContent = 'Inspector: Off';
    }
  }

  // Listen for state changes from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'inspectorStateChanged') {
      updateUI(message.active);
    }
  });
});