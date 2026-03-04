// Auto Google Meet Adder - Content Script
// Detects Google Calendar event creation/editing and adds Google Meet automatically.

(function () {
  "use strict";

  const LOG_PREFIX = "[AutoMeetAdder]";
  let enabled = true;
  let pendingClicks = new Set(); // Track buttons we've already queued clicks for

  // Load enabled state from storage
  chrome.storage.sync.get({ enabled: true }, (data) => {
    enabled = data.enabled;
    log(`Extension ${enabled ? "enabled" : "disabled"}`);
  });

  // Listen for toggle changes from popup
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
   * Check if we're on an event creation/edit page or dialog.
   * Google Calendar uses different UIs:
   * 1. Quick event popup (inline dialog)
   * 2. Full event editing page (/eventedit or /r/eventedit)
   */
  function isEventCreationContext() {
    const url = window.location.href;
    // Full edit page
    if (url.includes("/eventedit") || url.includes("/r/eventedit")) {
      return true;
    }
    // Quick-add popup is detected via DOM, not URL
    return false;
  }

  /**
   * Look for the "Add Google Meet video conferencing" button and click it.
   *
   * Google Calendar renders conferencing options in a few ways:
   * - A clickable row/button with text like "Add Google Meet video conferencing"
   * - A dropdown or button with "Add video conferencing"
   * - The conferencing section with an "Add" action
   *
   * If a Meet link is already present, we skip.
   */
  function tryAddGoogleMeet() {
    if (!enabled) return;

    // Check if Meet is already added - look for existing Meet link or "Join with Google Meet" text
    const meetIndicators = [
      // Meet link present
      ...document.querySelectorAll('a[href*="meet.google.com"]'),
      // "Join with Google Meet" text
      ...document.querySelectorAll('[data-conferencedata]'),
    ];

    // Also check for text content indicating Meet is already added
    const allText = document.body.innerText;
    if (
      meetIndicators.length > 0 ||
      isTextPresent("Join with Google Meet") ||
      isTextPresent("meet.google.com/")
    ) {
      return; // Meet already present
    }

    // Strategy 1: Look for the "Add Google Meet video conferencing" button/row
    // Google Calendar uses aria-label and data attributes extensively
    const addMeetButton = findAddMeetButton();
    if (addMeetButton) {
      clickButton(addMeetButton);
      return;
    }

    // Strategy 2: Look for the conferencing dropdown trigger
    // In the full edit view, there's often a dropdown to select conferencing
    const confDropdown = findConferencingDropdown();
    if (confDropdown) {
      clickButton(confDropdown);
      // After opening dropdown, we need to select Google Meet from the options
      setTimeout(() => selectMeetFromDropdown(), 300);
      return;
    }
  }

  /**
   * Check if specific text is present in the event editing area.
   * Scoped to avoid false positives from other parts of the page.
   */
  function isTextPresent(text) {
    // Look within event editing containers
    const containers = document.querySelectorAll(
      '[data-eventid], [data-eventchip], [role="dialog"], [data-view-heading="Edit event"], form'
    );

    for (const container of containers) {
      if (container.textContent.includes(text)) {
        return true;
      }
    }

    // Fallback: check full page for edit pages
    if (isEventCreationContext()) {
      return document.body.textContent.includes(text);
    }

    return false;
  }

  /**
   * Find the "Add Google Meet video conferencing" button.
   * Google Calendar uses various DOM structures, so we try multiple selectors.
   */
  function findAddMeetButton() {
    // Common patterns for the "Add conferencing" button:
    const selectors = [
      // Aria-label based (most reliable)
      '[aria-label*="Add Google Meet"]',
      '[aria-label*="Add video conferencing"]',
      '[aria-label*="Add conferencing"]',
      // Data attribute based
      '[data-add-conferencing]',
      // The conferencing row in the event editor
      '[data-key="addConference"]',
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }

    // Text-content based search: find elements whose text matches
    const textPatterns = [
      "Add Google Meet video conferencing",
      "Add video conferencing",
    ];

    for (const pattern of textPatterns) {
      const el = findElementByText(pattern);
      if (el) return el;
    }

    return null;
  }

  /**
   * Find the conferencing type dropdown (used in full edit view).
   */
  function findConferencingDropdown() {
    // The dropdown for selecting conferencing provider
    const selectors = [
      '[aria-label*="conferencing"] [role="listbox"]',
      '[aria-label*="conferencing"] select',
      '[data-key="conferenceType"]',
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }

    return null;
  }

  /**
   * After opening the conferencing dropdown, select Google Meet.
   */
  function selectMeetFromDropdown() {
    const options = document.querySelectorAll(
      '[role="option"], [role="menuitem"], [data-value]'
    );
    for (const option of options) {
      if (
        option.textContent.includes("Google Meet") ||
        option.textContent.includes("Meet")
      ) {
        clickButton(option);
        return;
      }
    }
  }

  /**
   * Find a clickable element by its text content.
   * Returns the most specific (deepest) clickable ancestor.
   */
  function findElementByText(text) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) =>
          node.textContent.includes(text)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      // Walk up to find a clickable element
      let el = node.parentElement;
      while (el) {
        const tag = el.tagName.toLowerCase();
        const role = el.getAttribute("role");
        const isClickable =
          tag === "button" ||
          tag === "a" ||
          role === "button" ||
          role === "link" ||
          el.hasAttribute("jsaction") ||
          el.hasAttribute("data-eventid") ||
          el.style.cursor === "pointer" ||
          window.getComputedStyle(el).cursor === "pointer";

        if (isClickable) return el;
        el = el.parentElement;
      }
    }
    return null;
  }

  /**
   * Click a button with deduplication and a small delay for UI stability.
   */
  function clickButton(el) {
    const id = el.getAttribute("data-eventid") || el.textContent.trim().slice(0, 50);
    if (pendingClicks.has(id)) return;

    pendingClicks.add(id);
    log("Clicking:", id);

    // Small delay to ensure the UI is ready
    setTimeout(() => {
      el.click();
      // Also dispatch mouse events for Google's event handlers
      el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      // Clear from pending after a cooldown
      setTimeout(() => pendingClicks.delete(id), 3000);
    }, 100);
  }

  /**
   * Set up a MutationObserver to detect when event creation dialogs/forms appear.
   * Google Calendar is a SPA, so we can't rely on page loads.
   */
  function setupObserver() {
    let debounceTimer = null;

    const observer = new MutationObserver((mutations) => {
      if (!enabled) return;

      // Debounce to avoid rapid-fire checks
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // Check if we're in an event creation context
        const inEventEdit = isEventCreationContext();
        const hasDialog = document.querySelector(
          '[role="dialog"], [data-eventid]'
        );

        if (inEventEdit || hasDialog) {
          tryAddGoogleMeet();
        }
      }, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    log("Observer started");
  }

  // Also listen for URL changes (SPA navigation)
  let lastUrl = window.location.href;
  function checkUrlChange() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      if (isEventCreationContext()) {
        // Delay to let the page render
        setTimeout(tryAddGoogleMeet, 1000);
      }
    }
  }

  // Poll for URL changes (pushState doesn't fire events reliably)
  setInterval(checkUrlChange, 500);

  // Start observing
  setupObserver();

  // Initial check in case we loaded directly into an event edit page
  if (isEventCreationContext()) {
    setTimeout(tryAddGoogleMeet, 1500);
  }
})();
