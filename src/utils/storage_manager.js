const DEFAULT_SETTINGS = {
  is_enabled: true,
  is_shield_active: true,
  ai_endpoint: "http://localhost:11434",
  whitelist: ["fineco.it", "paypal.com", "poste.it"]
}

export async function initializeStorage() {
  const data = await chrome.storage.local.get(["bonsai_settings", "sites_config"]);
  
  if (!data.bonsai_settings) {
    await chrome.storage.local.set({ bonsai_settings: DEFAULT_SETTINGS });
    console.log("BonsAI: Storage initialized with default settings.");
  }
  
  if (!data.sites_config) {
    await chrome.storage.local.set({ sites_config: {} });
    console.log("BonsAI: Sites configuration initialized.");
  }
}

export async function getSettings() {
  const data = await chrome.storage.local.get("bonsai_settings");
  return data.bonsai_settings || DEFAULT_SETTINGS;
}

export async function updateSettings(newSettings) {
  const currentSettings = await getSettings();
  const updated = { ...currentSettings, ...newSettings };
  await chrome.storage.local.set({ bonsai_settings: updated });
  return updated;
}

export async function getSiteConfig(hostname) {
  const data = await chrome.storage.local.get("sites_config");
  const config = data.sites_config || {};
  return config[hostname] || { blocked_domains: [], cosmetic_selectors: [] };
}

export async function updateSiteConfig(hostname, blockedDomain = null, cosmeticSelector = null) {
  const data = await chrome.storage.local.get("sites_config");
  const config = data.sites_config || {};
  
  if (!config[hostname]) {
    config[hostname] = { blocked_domains: [], cosmetic_selectors: [] };
  }
  
  if (blockedDomain && !config[hostname].blocked_domains.includes(blockedDomain)) {
    config[hostname].blocked_domains.push(blockedDomain);
  }
  
  if (cosmeticSelector && !config[hostname].cosmetic_selectors.includes(cosmeticSelector)) {
    config[hostname].cosmetic_selectors.push(cosmeticSelector);
  }
  
  await chrome.storage.local.set({ sites_config: config });
  return config[hostname];
}