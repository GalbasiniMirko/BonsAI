const DEFAULT_SETTINGS = {
    is_enabled: true,
    is_shield_active: true,
    ai_endpoint: "http://localhost:11434",
    model_name: "qwen2.5-vl",
    system_prompt: "Analyze this webpage screenshot. Identify all advertisements, banners, and empty spaces. Respond exclusively with a JSON array containing the CSS selectors of these elements.",
    scan_mode: "on_load",
    whitelist: ["fineco.it", "paypal.com", "poste.it"]
};

export const StorageManager = {
    getSettings: async () => {
        const data = await chrome.storage.local.get('bonsai_settings');
        return { ...DEFAULT_SETTINGS, ...data.bonsai_settings };
    },

    saveSettings: async (newSettings) => {
        const current = await StorageManager.getSettings();
        const updated = { ...current, ...newSettings };
        await chrome.storage.local.set({ bonsai_settings: updated });
        return updated;
    },

    saveSiteRules: async (hostname, selectors) => {
        const data = await chrome.storage.local.get('sites_config') || { sites_config: {} };
        const config = data.sites_config || {};
        config[hostname] = {
            selectors: selectors,
            timestamp: Date.now()
        };
        await chrome.storage.local.set({ sites_config: config });
    },

    getSiteRules: async (hostname) => {
        const data = await chrome.storage.local.get('sites_config');
        return data.sites_config?.[hostname] || null;
    }
};

export const initializeStorage = async () => {
    const data = await chrome.storage.local.get(["bonsai_settings", "sites_config"]);
    if (!data.bonsai_settings) {
        await chrome.storage.local.set({ bonsai_settings: DEFAULT_SETTINGS });
    }
    if (!data.sites_config) {
        await chrome.storage.local.set({ sites_config: {} });
    }
};

export const getSettings = StorageManager.getSettings;
export const updateSettings = StorageManager.saveSettings;

export const getSiteConfig = async (hostname) => {
    const data = await chrome.storage.local.get("sites_config");
    const config = data.sites_config || {};
    return config[hostname] || { blocked_domains: [], cosmetic_selectors: [] };
};