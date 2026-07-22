document.addEventListener('DOMContentLoaded', async () => {
  const shortcut = document.getElementById('shortcut');
  const command = (await chrome.commands.getAll()).find(({ name }) => name === 'toggle-capture');
  shortcut.textContent = command?.shortcut || 'Not assigned';
  document.getElementById('openShortcuts').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });
});
