import { getSettings, updateSettings } from "../utils/storage_manager.js";

document.addEventListener("DOMContentLoaded", async () => {
  const masterSwitch = document.getElementById("master-switch");
  const shieldSwitch = document.getElementById("shield-switch");
  const whitelistBtn = document.getElementById("whitelist-btn");
  const scanBtn = document.getElementById("scan-btn");
  const whitelistListContainer = document.getElementById("whitelist-list");
  const optionsBtn = document.getElementById("open-options");

  let settings = await getSettings();
  masterSwitch.checked = settings.is_enabled;
  shieldSwitch.checked = settings.is_shield_active;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let currentHostname = "";
  let isInternalPage = false;

  if (tab && tab.url) {
    isInternalPage = tab.url.startsWith("chrome://") || 
                     tab.url.startsWith("devtools://") || 
                     tab.url.startsWith("chrome-extension://");
    try {
      const urlObj = new URL(tab.url);
      currentHostname = urlObj.hostname.replace("www.", "");
    } catch (e) {
      console.error("Invalid URL:", tab.url);
    }
  }

  function updateWhitelistButton() {
    if (!currentHostname || isInternalPage) {
      whitelistBtn.disabled = true;
      whitelistBtn.innerText = "Cannot whitelist this page";
      whitelistBtn.style.opacity = "0.5";
      return;
    }

    const isAlreadyWhitelisted = settings.whitelist.includes(currentHostname);
    if (isAlreadyWhitelisted) {
      whitelistBtn.innerText = `- Remove ${currentHostname}`;
      whitelistBtn.style.backgroundColor = "#ef4444";
    } else {
      whitelistBtn.innerText = `+ Whitelist ${currentHostname}`;
      whitelistBtn.style.backgroundColor = "#374151";
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

  const statusResponse = await chrome.runtime.sendMessage({ type: "GET_SCAN_STATUS" });
  if (statusResponse && statusResponse.isScanning) {
    scanBtn.innerText = "Scanning...";
    scanBtn.disabled = true;
  } else if (!settings.is_enabled) {
    scanBtn.disabled = true;
    scanBtn.innerText = "BonsAI is Disabled";
  } else if (isInternalPage) {
    scanBtn.disabled = true;
    scanBtn.innerText = "Cannot scan this page";
  }

  renderWhitelist(settings.whitelist);
  updateWhitelistButton();

  scanBtn.addEventListener("click", async () => {
    scanBtn.innerText = "Scanning...";
    scanBtn.disabled = true;
    try {
      const response = await chrome.runtime.sendMessage({ type: "START_AI_SCAN" });
      scanBtn.innerText = (response && response.success) ? "Scan Complete!" : "Scan Blocked";
    } catch (err) {
      scanBtn.innerText = "Error";
    }
    setTimeout(() => {
      scanBtn.disabled = !masterSwitch.checked || isInternalPage;
      scanBtn.innerText = !masterSwitch.checked ? "BonsAI is Disabled" : (isInternalPage ? "Cannot scan this page" : "Scan with BonsAI");
    }, 3000);
  });

  masterSwitch.addEventListener("change", async () => {
    await updateSettings({ is_enabled: masterSwitch.checked });
    scanBtn.disabled = !masterSwitch.checked || isInternalPage;
    scanBtn.innerText = masterSwitch.checked ? (isInternalPage ? "Cannot scan this page" : "Scan with BonsAI") : "BonsAI is Disabled";
  });

  shieldSwitch.addEventListener("change", async () => {
    await updateSettings({ is_shield_active: shieldSwitch.checked });
  });

  whitelistBtn.addEventListener("click", async () => {
    if (!currentHostname || isInternalPage) return;
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

  if (optionsBtn) {
    optionsBtn.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }
});