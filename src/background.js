// Service worker for Click to Markdown.

async function ensureContentScript(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    if (response?.ready) return true;
  } catch (_) { /* Inject the capture scripts below. */ }

  try {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ['styles.css'] });
    await chrome.scripting.executeScript({ target: { tabId }, files: ['lib/turndown.js'] });
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    return Boolean(response?.ready);
  } catch (error) {
    console.error('Click to Markdown: could not start capture', error);
    return false;
  }
}

async function toggleCapture(tab) {
  if (!tab?.id || /^(chrome|chrome-extension|moz-extension):/.test(tab.url || '')) return;
  if (!(await ensureContentScript(tab.id))) return;
  const { inspectorActive = false } = await chrome.storage.local.get('inspectorActive');
  const active = !inspectorActive;
  await chrome.storage.local.set({ inspectorActive: active });
  await chrome.tabs.sendMessage(tab.id, { action: 'toggleInspector', active });
}

chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.local.set({ inspectorActive: false });
  if (details.reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-capture') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await toggleCapture(tab);
});
