import { getSettings, updateSettings } from "../utils/storage_manager.js";

document.addEventListener("DOMContentLoaded", async () => {
  const masterSwitch = document.getElementById("master-switch");
  const shieldSwitch = document.getElementById("shield-switch");
  const whitelistBtn = document.getElementById("whitelist-btn");
  const scanBtn = document.getElementById("scan-btn");
  const whitelistListContainer = document.getElementById("whitelist-list");

  let settings = await getSettings();
  masterSwitch.checked = settings.is_enabled;
  shieldSwitch.checked = settings.is_shield_active;

  const statusResponse = await chrome.runtime.sendMessage({ type: "GET_SCAN_STATUS" });
  if (statusResponse && statusResponse.isScanning) {
    scanBtn.innerText = "Scanning...";
    scanBtn.disabled = true;
  } else if (!settings.is_enabled) {
    scanBtn.disabled = true;
    scanBtn.innerText = "BonsAI is Disabled";
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let currentHostname = "";
  
  if (tab && tab.url) {
    try {
      const urlObj = new URL(tab.url);
      currentHostname = urlObj.hostname.replace("www.", "");
    } catch (e) {
      console.error("Invalid URL:", tab.url);
    }
  }

  scanBtn.addEventListener("click", async () => {
    scanBtn.innerText = "Scanning...";
    scanBtn.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({ type: "START_AI_SCAN" });
      if (response && response.success) {
        scanBtn.innerText = "Scan Complete!";
      } else {
        scanBtn.innerText = "Scan Blocked";
      }
    } catch (err) {
      scanBtn.innerText = "Error";
    }

    setTimeout(() => {
      const isEnabled = masterSwitch.checked;
      scanBtn.disabled = !isEnabled;
      scanBtn.innerText = isEnabled ? "Scan with BonsAI" : "BonsAI is Disabled";
    }, 3000);
  });

  function updateWhitelistButton() {
    if (!currentHostname || tab.url.startsWith("chrome://") || tab.url.startsWith("devtools://")) {
      whitelistBtn.disabled = true;
      whitelistBtn.innerText = "Cannot whitelist this page";
      whitelistBtn.style.opacity = "0.5";
      return;
    }

    const isAlreadyWhitelisted = settings.whitelist.includes(currentHostname);

    if (isAlreadyWhitelisted) {
      whitelistBtn.innerText = `- Remove ${currentHostname}`;
      whitelistBtn.style.backgroundColor = "#ef4444";
      whitelistBtn.style.borderColor = "#f87171";
      whitelistBtn.style.color = "#ffffff";
    } else {
      whitelistBtn.innerText = `+ Whitelist ${currentHostname}`;
      whitelistBtn.style.backgroundColor = "#374151";
      whitelistBtn.style.borderColor = "#4b5563";
      whitelistBtn.style.color = "#f3f4f6";
    }
  }

  function renderWhitelist(whitelist) {
    whitelistListContainer.innerHTML = "";
    if (whitelist.length === 0) {
      whitelistListContainer.innerHTML = `<div style="font-size: 11px; color: #6b7280; text-align: center; padding: 5px 0;">No sites in Whitelist.</div>`;
      return;
    }
    whitelist.forEach((site) => {
      const item = document.createElement("div");
      item.className = "whitelist-item";
      item.innerHTML = `<span>${site}</span><button class="remove-btn" data-site="${site}">X</button>`;
      whitelistListContainer.appendChild(item);
    });
    document.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const siteToRemove = e.target.getAttribute("data-site");
        settings.whitelist = settings.whitelist.filter(domain => domain !== siteToRemove);
        await updateSettings({ whitelist: settings.whitelist });
        renderWhitelist(settings.whitelist);
        updateWhitelistButton();
      });
    });
  }

  renderWhitelist(settings.whitelist);
  updateWhitelistButton();

  masterSwitch.addEventListener("change", async () => {
    const isEnabled = masterSwitch.checked;
    await updateSettings({ is_enabled: isEnabled });
    scanBtn.disabled = !isEnabled;
    scanBtn.innerText = isEnabled ? "Scan with BonsAI" : "BonsAI is Disabled";
  });

  shieldSwitch.addEventListener("change", async () => {
    await updateSettings({ is_shield_active: shieldSwitch.checked });
  });

  whitelistBtn.addEventListener("click", async () => {
    if (!currentHostname) return;
    const isAlreadyWhitelisted = settings.whitelist.includes(currentHostname);
    if (isAlreadyWhitelisted) {
      settings.whitelist = settings.whitelist.filter(domain => domain !== currentHostname);
    } else {
      settings.whitelist.push(currentHostname);
    }
    await updateSettings({ whitelist: settings.whitelist });
    renderWhitelist(settings.whitelist);
    updateWhitelistButton();
  });
});