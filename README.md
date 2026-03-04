# Auto Google Meet Adder

Chrome extension that automatically adds a Google Meet link to every new Google Calendar event.

## Install

### From source
1. Clone this repo
2. Go to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select this directory

### From releases
1. Download the latest zip from [Releases](https://github.com/suchintan/google-meet-auto-adder/releases)
2. Unzip it
3. Load unpacked in `chrome://extensions`

## How it works

When you create or edit a Google Calendar event, the extension detects the "Add Google Meet video conferencing" button and clicks it automatically. If a Meet link is already present, it does nothing.

Works with both the quick-add popup and the full event editor (`/eventedit`).

## Toggle

Click the extension icon to enable/disable auto-adding.

## Privacy

No data is collected, stored, or transmitted. The extension only interacts with the Google Calendar page DOM. The only stored data is your on/off preference via Chrome sync storage.

## License

MIT
