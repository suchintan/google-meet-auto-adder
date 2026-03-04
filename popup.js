// Popup script for Auto Google Meet Adder

const toggle = document.getElementById("enableToggle");
const status = document.getElementById("status");

// Load current state
chrome.storage.sync.get({ enabled: true }, (data) => {
  toggle.checked = data.enabled;
  updateStatus(data.enabled);
});

// Handle toggle
toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ enabled }, () => {
    updateStatus(enabled);
  });
});

function updateStatus(enabled) {
  if (enabled) {
    status.textContent =
      "Active — Meet links will be added automatically to new events.";
    status.className = "status active";
  } else {
    status.textContent = "Paused — Meet links will not be added automatically.";
    status.className = "status";
  }
}
