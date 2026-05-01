chrome.action.onClicked.addListener(async (tab) => {
    console.log("BonsAI icon clicked! Screenshot preparation...");

    try {
        const screenshotUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png"});

        console.log("Screeshot successfully captured!");
        
        const base64Image = screenshotUrl.split(",")[1];
        console.log("Sending image to Ollama (LLaVA model)... Please wait.");

        const requestBody = {
            model: "llava",
            prompt: "What do you see in this image? Describe it briefly in one sentence.",
            steam: false,
            images: [base64Image]
        };

        const response = await fetch("http://localhost:11434/api/generate", {
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
        }
    } catch (error) {
        console.error("Error during screenshot or AI processing:", error);
    }
})