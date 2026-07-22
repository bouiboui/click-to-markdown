// Content script for Click to Markdown.
// A click captures one element; a drag captures the content inside its rectangle.
(function () {
  'use strict';

  const DRAG_THRESHOLD = 8;
  let captureActive = false;
  let highlightedElement = null;
  let overlay = null;
  let toast = null;
  let shadowRoot = null;
  let pointerStart = null;
  let pressedElement = null;
  let isDragging = false;

  function getShadowRoot() {
    if (shadowRoot) return shadowRoot;
    if (!document.body) return null;
    const container = document.createElement('div');
    container.id = 'click-to-markdown-container';
    container.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483647;';
    document.body.appendChild(container);
    shadowRoot = container.attachShadow({ mode: 'closed' });
    return shadowRoot;
  }

  function createOverlay() {
    const root = getShadowRoot();
    if (!root || overlay) return overlay;
    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:3px dashed #4CAF50;background:rgba(76,175,80,.1);box-sizing:border-box;display:none;';
    root.appendChild(overlay);
    return overlay;
  }

  function createToast() {
    const root = getShadowRoot();
    if (!root || toast) return toast;
    toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#4CAF50;color:#fff;padding:12px 24px;border-radius:8px;font:600 14px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,.3);display:none;pointer-events:none;';
    root.appendChild(toast);
    return toast;
  }

  function showToast(message) {
    const element = createToast();
    element.textContent = message;
    element.style.display = 'block';
    clearTimeout(element.dismissTimer);
    element.dismissTimer = setTimeout(() => { element.style.display = 'none'; }, 2200);
  }

  function hideOverlay() { if (overlay) overlay.style.display = 'none'; }
  function setElementOverlay(element) {
    if (!element || !overlay) return;
    const rect = element.getBoundingClientRect();
    Object.assign(overlay.style, { display: 'block', border: '3px dashed #4CAF50', background: 'rgba(76,175,80,.1)', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  }
  function setAreaOverlay(start, end) {
    Object.assign(overlay.style, { display: 'block', border: '2px solid #2196F3', background: 'rgba(33,150,243,.14)', left: `${Math.min(start.x, end.x)}px`, top: `${Math.min(start.y, end.y)}px`, width: `${Math.abs(end.x - start.x)}px`, height: `${Math.abs(end.y - start.y)}px` });
  }

  function htmlToMarkdown(element) {
    if (typeof TurndownService === 'undefined') return '';
    try { return new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' }).turndown(element); }
    catch (error) { console.error('Click to Markdown: conversion failed', error); return ''; }
  }
  function rectsIntersect(a, b) { return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
  function textIntersectsSelection(node, selectionRect) {
    const range = document.createRange();
    range.selectNodeContents(node);
    return Array.from(range.getClientRects()).some((rect) => rectsIntersect(rect, selectionRect));
  }
  function cloneContentInSelection(node, selectionRect) {
    if (node.nodeType === Node.TEXT_NODE) return textIntersectsSelection(node, selectionRect) ? node.cloneNode() : null;
    if (node.nodeType !== Node.ELEMENT_NODE || node.id === 'click-to-markdown-container') return null;
    if (!rectsIntersect(node.getBoundingClientRect(), selectionRect)) return null;
    const clone = node.cloneNode(false);
    let hasContent = false;
    for (const child of node.childNodes) {
      const childClone = cloneContentInSelection(child, selectionRect);
      if (childClone) { clone.appendChild(childClone); hasContent = true; }
    }
    return hasContent || /^(IMG|VIDEO|AUDIO|SVG|CANVAS|INPUT|BR)$/i.test(node.tagName) ? clone : null;
  }
  function markdownFromSelection(selectionRect) {
    const container = document.createElement('div');
    for (const child of document.body.childNodes) {
      const clone = cloneContentInSelection(child, selectionRect);
      if (clone) container.appendChild(clone);
    }
    return htmlToMarkdown(container).trim();
  }
  async function copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (_) {
      const textArea = document.createElement('textarea');
      textArea.value = text; textArea.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(textArea); textArea.select();
      const copied = document.execCommand('copy'); textArea.remove();
      return copied;
    }
  }

  function stopEvent(event) { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); }
  function consumeNextClick(event) { stopEvent(event); document.removeEventListener('click', consumeNextClick, true); }
  function removeDragListeners() {
    document.removeEventListener('mousemove', handlePointerMove, true);
    document.removeEventListener('mouseup', handlePointerEnd, true);
  }
  async function deactivateCapture() {
    captureActive = false;
    await chrome.storage.local.set({ inspectorActive: false });
    chrome.runtime.sendMessage({ action: 'inspectorStateChanged', active: false });
    hideOverlay(); removeEventListeners();
  }

  function handleMouseOver(event) {
    if (!captureActive || pointerStart) return;
    highlightedElement = event.target;
    setElementOverlay(highlightedElement);
  }
  function handleMouseOut() { if (captureActive && !pointerStart) hideOverlay(); }
  function handlePointerStart(event) {
    if (!captureActive || event.button !== 0) return;
    stopEvent(event);
    pointerStart = { x: event.clientX, y: event.clientY };
    pressedElement = highlightedElement || event.target;
    isDragging = false;
    document.addEventListener('mousemove', handlePointerMove, true);
    document.addEventListener('mouseup', handlePointerEnd, true);
  }
  function handlePointerMove(event) {
    if (!pointerStart) return;
    stopEvent(event);
    const end = { x: event.clientX, y: event.clientY };
    if (!isDragging && Math.hypot(end.x - pointerStart.x, end.y - pointerStart.y) >= DRAG_THRESHOLD) isDragging = true;
    if (isDragging) setAreaOverlay(pointerStart, end);
  }
  async function handlePointerEnd(event) {
    if (!pointerStart) return;
    stopEvent(event);
    document.addEventListener('click', consumeNextClick, true);
    setTimeout(() => document.removeEventListener('click', consumeNextClick, true), 1000);
    const start = pointerStart;
    const end = { x: event.clientX, y: event.clientY };
    const dragged = isDragging;
    const selectedElement = pressedElement;
    pointerStart = null; pressedElement = null; isDragging = false;
    removeDragListeners();

    const markdown = dragged ? markdownFromSelection({
      left: Math.min(start.x, end.x), right: Math.max(start.x, end.x),
      top: Math.min(start.y, end.y), bottom: Math.max(start.y, end.y)
    }) : htmlToMarkdown(selectedElement);
    if (!markdown) { hideOverlay(); return showToast(dragged ? 'No convertible content in this area' : 'Error: Could not convert to Markdown'); }
    if (await copyToClipboard(markdown)) { showToast(dragged ? 'Area copied to Clipboard!' : 'Copied to Clipboard!'); await deactivateCapture(); }
    else showToast('Error: Could not copy to clipboard');
  }
  function handleKeyDown(event) { if (captureActive && event.key === 'Escape') deactivateCapture(); }

  function addEventListeners() {
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('mousedown', handlePointerStart, true);
    document.addEventListener('keydown', handleKeyDown, true);
  }
  function removeEventListeners() {
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('mousedown', handlePointerStart, true);
    document.removeEventListener('keydown', handleKeyDown, true);
    removeDragListeners();
  }
  function toggleCapture(active) {
    removeEventListeners();
    captureActive = active; pointerStart = null; isDragging = false;
    if (active) { createOverlay(); createToast(); addEventListeners(); showToast('Click an element or drag an area. Press Esc to cancel.'); }
    else hideOverlay();
  }

  chrome.storage.local.get(['inspectorActive'], (result) => { if (result.inspectorActive) toggleCapture(true); });
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'toggleInspector') { toggleCapture(message.active); sendResponse({ success: true }); }
    else if (message.action === 'ping') sendResponse({ ready: true });
    return true;
  });
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.inspectorActive) toggleCapture(changes.inspectorActive.newValue);
  });
})();
