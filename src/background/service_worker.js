chrome.action.onClicked.addListener(async (tab) => {
    console.log("BonsAI icon clicked! Screenshot preparation...");

    try {
        const screenshotUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png"});

        console.log("Screeshot successfully captured!");
        console.log("Image data:", screenshotUrl.substring(0, 50) + "...");

        chrome.tabs.create({ url: screenshotUrl });
    } catch (error) {
        console.error("Error while screenshot:", error);
    }
})