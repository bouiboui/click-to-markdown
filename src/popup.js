document.addEventListener('DOMContentLoaded', async () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const status = document.getElementById('status');
  const warning = document.getElementById('warning');
  const reloadBtn = document.getElementById('reloadBtn');
  const settingsLink = document.getElementById('settingsLink');

  async function injectContentScripts(tabId) {
    try {
      try { if ((await chrome.tabs.sendMessage(tabId, { action: 'ping' }))?.ready) return true; } catch (_) { /* Inject below. */ }
      await chrome.scripting.insertCSS({ target: { tabId }, files: ['styles.css'] });
      await chrome.scripting.executeScript({ target: { tabId }, files: ['lib/turndown.js'] });
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
      return Boolean((await chrome.tabs.sendMessage(tabId, { action: 'ping' }))?.ready);
    } catch (error) { console.error('Click to Markdown: injection failed', error); return false; }
  }
  async function activeTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id && !/^(chrome|chrome-extension|moz-extension):/.test(tab.url || '') ? tab : null;
  }
  function updateUI(isActive, scriptAvailable = true) {
    if (!scriptAvailable) {
      toggleBtn.disabled = true; toggleBtn.style.opacity = '0.6';
      status.textContent = 'Capture: Unavailable'; status.style.color = '#856404';
      warning.classList.add('show'); reloadBtn.style.display = 'block'; return;
    }
    toggleBtn.disabled = false; toggleBtn.style.opacity = '1';
    toggleBtn.textContent = isActive ? 'Cancel Capture' : 'Start Capture';
    toggleBtn.className = `toggle-button ${isActive ? 'active' : 'inactive'}`;
    status.textContent = isActive ? 'Click an element or drag an area' : 'Capture: Off';
    status.style.color = '#666'; warning.classList.remove('show'); reloadBtn.style.display = 'none';
  }
  async function toggleCapture() {
    const tab = await activeTab();
    if (!tab || !(await injectContentScripts(tab.id))) return updateUI(false, false);
    const { inspectorActive = false } = await chrome.storage.local.get('inspectorActive');
    const active = !inspectorActive;
    await chrome.storage.local.set({ inspectorActive: active });
    await chrome.tabs.sendMessage(tab.id, { action: 'toggleInspector', active });
    updateUI(active);
    if (active) setTimeout(() => window.close(), 100);
  }

  const tab = await activeTab();
  const available = Boolean(tab && await injectContentScripts(tab.id));
  const { inspectorActive = false } = await chrome.storage.local.get('inspectorActive');
  updateUI(inspectorActive, available);
  toggleBtn.addEventListener('click', () => toggleCapture().catch((error) => { console.error(error); updateUI(false, false); }));
  reloadBtn.addEventListener('click', async () => { const current = await activeTab(); if (current) { chrome.tabs.reload(current.id); window.close(); } });
  settingsLink.addEventListener('click', (event) => { event.preventDefault(); chrome.runtime.openOptionsPage(); });
  chrome.runtime.onMessage.addListener((message) => { if (message.action === 'inspectorStateChanged') updateUI(message.active); });
});
