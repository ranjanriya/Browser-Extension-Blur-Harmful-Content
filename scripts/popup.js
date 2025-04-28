document.getElementById("enableBlur").addEventListener("change", (e) => {
    chrome.storage.local.set({ blurEnabled: e.target.checked });
});

document.getElementById("reloadBtn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url?.includes("youtube.com")) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => location.reload()
            });
        }
    });
});

// Store user-selected categories
const categoryCheckboxes = document.querySelectorAll(".blur-category");
categoryCheckboxes.forEach(cb => {
    cb.addEventListener("change", () => {
        const selected = Array.from(categoryCheckboxes)
            .filter(c => c.checked)
            .map(c => c.value);
        chrome.storage.local.set({ blurCategories: selected });
    });
});

chrome.storage.local.get(["blurEnabled", "blurCategories"], (data) => {
    const blurEnabled = data.blurEnabled !== false;
    document.getElementById("enableBlur").checked = blurEnabled;
    const storedCategories = data.blurCategories;
    const allCategories = Array.from(categoryCheckboxes).map(cb => cb.value);
    const selectedCategories = storedCategories ?? allCategories;
    categoryCheckboxes.forEach(cb => {
        cb.checked = selectedCategories.includes(cb.value);
    });
    if (!storedCategories) {
        chrome.storage.local.set({ blurCategories: allCategories });
    }
});