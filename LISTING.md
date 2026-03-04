# Chrome Web Store Listing Details

## Name
Auto Google Meet Adder

## Short Description (132 char max)
Automatically adds a Google Meet video conferencing link to every new Google Calendar event you create. No more forgetting Meet links.

## Detailed Description
Tired of creating Google Calendar events and forgetting to add a Google Meet link? This extension fixes that.

Auto Google Meet Adder watches for when you create or edit a Google Calendar event and automatically clicks "Add Google Meet video conferencing" for you. Every new event gets a Meet link — no extra clicks needed.

HOW IT WORKS
• Detects when you open the event creation dialog (quick-add or full edit page)
• Checks if a Google Meet link is already present
• If not, automatically adds one

FEATURES
• Works with both the quick-add popup and the full event editor
• Skips events that already have a Meet link
• Toggle on/off from the extension popup
• Lightweight — no background processes, no API calls
• Minimal permissions — only needs access to calendar.google.com

PRIVACY
This extension does not collect, store, or transmit any data. It runs entirely in your browser and only interacts with the Google Calendar page DOM. No analytics, no tracking, no network requests.

## Category
Productivity

## Language
English

## Privacy Policy (paste as-is or host as a gist)
Auto Google Meet Adder Privacy Policy

This extension does not collect, store, or transmit any personal data or browsing information. It operates entirely within your browser on calendar.google.com pages. The only data stored is your enable/disable preference, saved locally via Chrome's sync storage. No analytics or tracking of any kind is used.

## Single Purpose Description (required by Chrome Web Store)
Automatically adds Google Meet video conferencing to new Google Calendar events.

## Justification for Permissions
- storage: Used to save the user's enable/disable preference.
- host_permissions (calendar.google.com): Required to run the content script that detects event creation and adds Meet links.
