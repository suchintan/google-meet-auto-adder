// Auto Google Meet Adder - Content Script
// Detects Google Calendar event creation/editing and auto-clicks
// the "Add Google Meet video conferencing" button.

(function () {
  "use strict";

  const LOG_PREFIX = "[AutoMeetAdder]";
  let enabled = true;
  let lastClickTime = 0;
  const CLICK_COOLDOWN_MS = 3000;

  // Load enabled state from storage
  chrome.storage.sync.get({ enabled: true }, (data) => {
    enabled = data.enabled;
    log(`Extension ${enabled ? "enabled" : "disabled"}`);
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
      enabled = changes.enabled.newValue;
      log(`Extension ${enabled ? "enabled" : "disabled"}`);
    }
  });

  function log(...args) {
    console.log(LOG_PREFIX, ...args);
  }

  /**
   * Check if Google Meet is already added to the current event.
   */
  function isMeetAlreadyAdded() {
    if (document.querySelector('a[href*="meet.google.com"]')) return true;
    if (document.body.textContent.includes("Join with Google Meet")) return true;
    return false;
  }

  /**
   * Find the "Add Google Meet video conferencing" button.
   * Google Calendar uses button#xAddRtcSel in both the quick-add popup
   * and the full /eventedit page.
   */
  function findAddMeetButton() {
    // Primary: the known button ID
    const btn = document.querySelector("#xAddRtcSel");
    if (btn) return btn;

    // Fallback: walk the DOM for the text (in case Google changes the ID)
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) =>
          node.textContent.includes("Add Google Meet video conferencing")
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
      }
    );

    const textNode = walker.nextNode();
    if (!textNode) return null;

    // Walk up to the nearest button or jsaction element
    let el = textNode.parentElement;
    while (el && el !== document.body) {
      if (
        el.tagName === "BUTTON" ||
        el.tagName === "A" ||
        el.getAttribute("role") === "button" ||
        el.hasAttribute("jsaction")
      ) {
        return el;
      }
      el = el.parentElement;
    }

    return null;
  }

  /**
   * Attempt to add Google Meet to the current event being created/edited.
   */
  function tryAddGoogleMeet() {
    if (!enabled) return;

    // Cooldown to prevent rapid re-clicks
    const now = Date.now();
    if (now - lastClickTime < CLICK_COOLDOWN_MS) return;

    if (isMeetAlreadyAdded()) {
      log("Meet already present, skipping");
      return;
    }

    const btn = findAddMeetButton();
    if (!btn) {
      return; // No button found — not in event creation context
    }

    log("Found 'Add Google Meet' button, clicking...");
    lastClickTime = now;
    btn.click();
    log("Clicked!");
  }

  // --- Detection: MutationObserver ---
  // Watches for the #xAddRtcSel button appearing in the DOM.
  let debounceTimer = null;

  const observer = new MutationObserver(() => {
    if (!enabled) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (document.querySelector("#xAddRtcSel")) {
        tryAddGoogleMeet();
      }
    }, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  log("Observer started");

  // --- Detection: URL polling ---
  // Google Calendar is a SPA; pushState doesn't fire reliable events.
  // Poll for URL changes and also periodically check for the button
  // as a safety net (covers cases where the observer misses mutations
  // during full SPA page transitions).
  let lastUrl = window.location.href;

  setInterval(() => {
    if (!enabled) return;

    const currentUrl = window.location.href;
    const urlChanged = currentUrl !== lastUrl;
    if (urlChanged) {
      lastUrl = currentUrl;
    }

    // On any event edit page (URL-based or the button being present)
    if (
      currentUrl.includes("/eventedit") ||
      document.querySelector("#xAddRtcSel")
    ) {
      tryAddGoogleMeet();
    }
  }, 1000);

  // --- Detection: initial page load ---
  if (window.location.href.includes("/eventedit")) {
    setTimeout(tryAddGoogleMeet, 1500);
  }
})();
