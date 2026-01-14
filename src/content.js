// Content script for Click to Markdown extension
// Handles inspector overlay, highlighting, and conversion

(function() {
  'use strict';

  let inspectorActive = false;
  let highlightedElement = null;
  let overlay = null;
  let toast = null;

  // Initialize shadow DOM for isolation
  let shadowRoot = null;
  function getShadowRoot() {
    if (!shadowRoot) {
      // Ensure body exists
      if (!document.body) {
        console.error('Click to Markdown: document.body not available');
        return null;
      }
      
      const container = document.createElement('div');
      container.id = 'click-to-markdown-container';
      document.body.appendChild(container);
      shadowRoot = container.attachShadow({ mode: 'closed' });
    }
    return shadowRoot;
  }

  // Create overlay element
  function createOverlay() {
    const root = getShadowRoot();
    if (!root) return null;
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'ctm-overlay';
    overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      border: 3px dashed #4CAF50;
      background: rgba(76, 175, 80, 0.1);
      box-sizing: border-box;
      transition: all 0.1s ease;
      display: none;
    `;
    root.appendChild(overlay);
    return overlay;
  }

  // Create toast notification
  function createToast() {
    const root = getShadowRoot();
    if (!root) return null;
    if (toast) return toast;

    toast = document.createElement('div');
    toast.id = 'ctm-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 2147483647;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: none;
      pointer-events: none;
      animation: slideIn 0.3s ease;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    root.appendChild(style);
    root.appendChild(toast);
    return toast;
  }

  // Show toast notification
  function showToast(message) {
    const toastEl = createToast();
    toastEl.textContent = message;
    toastEl.style.display = 'block';
    toastEl.style.animation = 'slideIn 0.3s ease';

    setTimeout(() => {
      toastEl.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        toastEl.style.display = 'none';
      }, 300);
    }, 2000);
  }

  // Update overlay position and size
  function updateOverlay(element) {
    if (!element || !overlay) return;

    const rect = element.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
  }

  // Hide overlay
  function hideOverlay() {
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  // Convert HTML to Markdown using Turndown
  function htmlToMarkdown(htmlElement) {
    if (typeof TurndownService === 'undefined') {
      console.error('Turndown library not loaded');
      return '';
    }

    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
      strongDelimiter: '**'
    });

    try {
      const markdown = turndownService.turndown(htmlElement);
      return markdown;
    } catch (error) {
      console.error('Error converting to Markdown:', error);
      return '';
    }
  }

  // Copy to clipboard
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  }

  // Handle mouse over
  function handleMouseOver(e) {
    if (!inspectorActive) return;
    
    highlightedElement = e.target;
    updateOverlay(highlightedElement);
  }

  // Handle mouse out
  function handleMouseOut(e) {
    if (!inspectorActive) return;
    hideOverlay();
  }

  // Handle click
  async function handleClick(e) {
    if (!inspectorActive) return;

    // Prevent default behavior and stop propagation immediately
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Use highlightedElement if available (what user is hovering over),
    // otherwise fall back to e.target
    const element = highlightedElement || e.target;
    if (!element) return;

    // Convert to Markdown
    const markdown = htmlToMarkdown(element);
    
    if (!markdown) {
      showToast('Error: Could not convert to Markdown');
      return;
    }

    // Copy to clipboard
    const success = await copyToClipboard(markdown);
    
    if (success) {
      showToast('Copied to Clipboard!');
      
      // Turn off inspector mode
      inspectorActive = false;
      await chrome.storage.local.set({ inspectorActive: false });
      
      // Notify popup
      chrome.runtime.sendMessage({
        action: 'inspectorStateChanged',
        active: false
      });

      // Clean up
      hideOverlay();
      removeEventListeners();
    } else {
      showToast('Error: Could not copy to clipboard');
    }
  }

  // Add event listeners
  function addEventListeners() {
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    // Use mousedown instead of click to fire before popup closes
    document.addEventListener('mousedown', handleClick, true);
  }

  // Remove event listeners
  function removeEventListeners() {
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('mousedown', handleClick, true);
  }

  // Toggle inspector mode
  function toggleInspector(active) {
    inspectorActive = active;

    if (active) {
      createOverlay();
      createToast();
      addEventListeners();
    } else {
      hideOverlay();
      removeEventListeners();
    }
  }

  // Initialize from storage
  chrome.storage.local.get(['inspectorActive'], (result) => {
    if (result.inspectorActive) {
      toggleInspector(true);
    }
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleInspector') {
      toggleInspector(message.active);
      sendResponse({ success: true });
    } else if (message.action === 'ping') {
      sendResponse({ ready: true });
    }
    return true;
  });

  // Listen for storage changes (sync across tabs)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.inspectorActive) {
      toggleInspector(changes.inspectorActive.newValue);
    }
  });

})();
