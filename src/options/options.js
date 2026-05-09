import { StorageManager } from "../utils/storage_manager.js";

document.addEventListener("DOMContentLoaded", async () => {
    const aiEndpointInput = document.getElementById("ai-endpoint");
    const modelNameSelect = document.getElementById("model-name");
    const refreshBtn = document.getElementById("refresh-models");
    const systemPromptInput = document.getElementById("system-prompt");
    const scanModeSelect = document.getElementById("scan-mode");
    const saveBtn = document.getElementById("save-settings");
    const statusMsg = document.getElementById("status-msg");

    const settings = await StorageManager.getSettings();

    aiEndpointInput.value = settings.ai_endpoint;
    systemPromptInput.value = settings.system_prompt;
    scanModeSelect.value = settings.scan_mode;

    async function fetchModels() {
        const endpoint = aiEndpointInput.value.replace(/\/$/, "");
        modelNameSelect.innerHTML = '<option value="">Loading...</option>';
        
        try {
            const response = await fetch(`${endpoint}/api/tags`);
            if (!response.ok) throw new Error();
            
            const data = await response.json();
            modelNameSelect.innerHTML = '';
            
            if (data.models && data.models.length > 0) {
                data.models.forEach(model => {
                    const option = document.createElement("option");
                    option.value = model.name;
                    option.text = model.name;
                    if (model.name === settings.model_name) option.selected = true;
                    modelNameSelect.appendChild(option);
                });
            } else {
                modelNameSelect.innerHTML = '<option value="">No models found</option>';
            }
        } catch (err) {
            modelNameSelect.innerHTML = '<option value="">Ollama unreachable</option>';
        }
    }

    fetchModels();

    refreshBtn.addEventListener("click", fetchModels);

    saveBtn.addEventListener("click", async () => {
        saveBtn.disabled = true;
        saveBtn.innerText = "Saving...";

        await StorageManager.saveSettings({
            ai_endpoint: aiEndpointInput.value,
            model_name: modelNameSelect.value,
            system_prompt: systemPromptInput.value,
            scan_mode: scanModeSelect.value
        });

        statusMsg.innerText = "Settings saved successfully!";
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.innerText = "Save Configuration";
            statusMsg.innerText = "";
        }, 2000);
    });
});