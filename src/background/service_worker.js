import { initializeStorage, getSettings } from "../utils/storage_manager.js";

chrome.runtime.onInstalled.addListener(async () => {
    await initializeStorage();
});

chrome.action.onClicked.addListener(async (tab) => {
    console.log("BonsAI icon clicked! Reading settings...");

    if (tab.url.startsWith("chrome://") || tab.url.startsWith("devtools://") || tab.url === "") {
        console.warn("BonsAI is resting: cannot run on Chrome system pages.");
        return;
    }

    try {
        const settings = await getSettings();

        if (!settings.is_enabled) {
            console.log("BonsAI is currently turned OFF by the Master Switch.");
            return;
        }

        const urlObj = new URL(tab.url);
        const hostname = urlObj.hostname.replace("www.", "");

        if (settings.whitelist.some(domain => hostname.includes(domain))) {
            console.log(`BonsAI is resting: ${hostname} is in your Whitelist.`);
            return;
        }

        console.log("Checks passed. Preparing screenshot...");
        const screenshotUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });

        console.log("Screenshot successfully captured!");
        
        const base64Image = screenshotUrl.split(",")[1];
        console.log(`Sending image to Ollama (${settings.ai_endpoint})... Please wait.`);

        const requestBody = {
            model: "llava",
            prompt: "What do you see in this image? Describe it briefly in one sentence.",
            stream: false,
            images: [base64Image]
        };

        const response = await fetch(`${settings.ai_endpoint}/api/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const rawText = await response.text();
        console.log("BonsAI Analysis Result:");
        
        try {
            const data = JSON.parse(rawText);
            console.log(data.response);

            chrome.tabs.sendMessage(tab.id, {
                type: "SHOW_AI_RESULT",
                text: data.response
            });
        } catch (parseError) {
            const lines = rawText.split('\n').filter(line => line.trim() !== '');
            let fullSentence = "";

            for (const line of lines) {
                const parsedLine = JSON.parse(line);
                if (parsedLine.response) {
                    fullSentence += parsedLine.response;
                }
            }
            console.log(fullSentence);

            chrome.tabs.sendMessage(tab.id, {
                type: "SHOW_AI_RESULT",
                text: fullSentence
            });
        }
    } catch (error) {
        console.error("Error during screenshot or AI processing:", error);
    }
})