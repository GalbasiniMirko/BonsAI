chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SHOW_AI_RESULT") {
        console.log("Message received from AI!");

        const widget = document.createElement("div");
        widget.style.position = "fixed";
        widget.style.bottom = "20px";
        widget.style.right = "20px";
        widget.style.backgroundColor = "#10b981";
        widget.style.color = "white";
        widget.style.padding = "15px 20px";
        widget.style.borderRadius = "8px";
        widget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        widget.style.zIndex = "999999";
        widget.style.fontFamily = "system-ui, sans-serif";
        widget.style.maxWidth = "300px";

        widget.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 8px; margin-bottom: 8px;">
                <strong style="font-size: 16px;">BonsAI</strong>
                <button id="bonsai-close" style="background: transparent; color: white; border: none; cursor: pointer; font-weight: bold; font-size: 16px;">X</button>
            </div>
            <p style="margin: 0; font-size: 14px; line-height: 1.4;">${message.text}</p>
        `;

        document.body.appendChild(widget);

        document.getElementById("bonsai-close").addEventListener("click", () => {
            widget.remove();
        })
    }
});