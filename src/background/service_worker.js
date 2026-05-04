import { initializeStorage, getSettings } from "../utils/storage_manager.js";

let isScanning = false;

chrome.runtime.onInstalled.addListener(async () => {
    await initializeStorage();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "START_AI_SCAN") {
        handleScanProcess(sendResponse);
        return true; 
    }
    if (message.type === "GET_SCAN_STATUS") {
        sendResponse({ isScanning: isScanning });
    }
});

async function handleScanProcess(sendResponse) {
    isScanning = true;
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || tab.url.startsWith("chrome://") || tab.url.startsWith("devtools://") || tab.url === "") {
            sendResponse({ success: false, reason: "BonsAI cannot scan system pages" });
            return;
        }

        const settings = await getSettings();

        if (!settings.is_enabled) {
            sendResponse({ success: false, reason: "BonsAI is disabled" });
            return;
        }

        const urlObj = new URL(tab.url);
        const hostname = urlObj.hostname.replace("www.", "");
        if (settings.whitelist.some(domain => hostname.includes(domain))) {
            sendResponse({ success: false, reason: `${hostname} is whitelisted` });
            return;
        }

        const screenshotUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
        const base64Image = screenshotUrl.split(",")[1];

        const response = await fetch(`${settings.ai_endpoint}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llava",
                prompt: "What do you see in this image? Describe it briefly in one sentence.",
                stream: false,
                images: [base64Image]
            }),
        });

        if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);

        const rawText = await response.text();
        let fullSentence = "";

        try {
            const data = JSON.parse(rawText);
            fullSentence = data.response;
        } catch (e) {
            const lines = rawText.split('\n').filter(l => l.trim() !== '');
            for (const line of lines) {
                const parsedLine = JSON.parse(line);
                if (parsedLine.response) fullSentence += parsedLine.response;
            }
        }

        try {
            await chrome.tabs.sendMessage(tab.id, {
                type: "SHOW_AI_RESULT",
                text: fullSentence
            });

            console.log("Result successfully sent to Content Script");
        } catch (e) {
            console.warn("Failed to send message to Content Script. Try refreshing the page.", e.message);
        }

        sendResponse({ success: true });

    } catch (error) {
        console.error("Scan error:", error);
        sendResponse({ success: false, reason: error.message });
    } finally {
        isScanning = false;
    }
}