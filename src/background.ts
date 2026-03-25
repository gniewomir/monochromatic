import {
    DEFAULT_DOMAINS,
    STORAGE_KEY,
    SUPPORTED_PROTOCOLS,
    getConfiguredDomains,
    logDebug,
    logError,
    normalizeDomain,
    safeStorageGet,
    safeStorageSet,
    shouldApplyToHost,
} from "./utils";

const ABOUT_MENU_ID = "monochromatic-about";

async function ensureDefaults(): Promise<void> {
    const stored = await safeStorageGet(STORAGE_KEY);
    const domains = stored[STORAGE_KEY];

    if (Array.isArray(domains)) {
        return;
    }

    const didSet = await safeStorageSet({ [STORAGE_KEY]: DEFAULT_DOMAINS });
    if (!didSet) {
        logDebug("Unable to persist default domains");
    }
}

async function updateActionState(tabId: number | undefined, tabUrl?: string): Promise<void> {
    if (typeof tabId !== "number") {
        return;
    }

    const domains = await getConfiguredDomains();

    let host: string;
    try {
        host = tabUrl ? new URL(tabUrl).hostname.toLowerCase() : "";
    } catch {
        host = "";
    }

    const isConfigured = shouldApplyToHost(host, domains);
    const variant = isConfigured ? "gradient" : "grayscale";

    try {
        await chrome.action.setIcon({
            tabId,
            path: {
                16: `icons/icon-${variant}-16.png`,
                24: `icons/icon-${variant}-24.png`,
                32: `icons/icon-${variant}-32.png`,
            },
        });
    } catch (error) {
        logError("Failed to update action icon", error);
    }
}

async function toggleCurrentDomain(tab: chrome.tabs.Tab): Promise<void> {
    const url = tab.url;
    if (!url) {
        return;
    }

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return;
    }

    if (!SUPPORTED_PROTOCOLS.has(parsed.protocol)) {
        return;
    }

    const host = normalizeDomain(parsed.hostname);
    if (!host) {
        return;
    }

    const domains = await getConfiguredDomains();
    const wasConfigured = shouldApplyToHost(host, domains);

    const nextDomains = wasConfigured
        ? domains.filter((domain: string) => domain !== host && !host.endsWith(`.${domain}`))
        : [...domains, host];

    const didSet = await safeStorageSet({ [STORAGE_KEY]: nextDomains });
    if (!didSet) {
        logDebug("Domain toggle was not persisted", { host });
        return;
    }

    await updateActionState(tab.id, url);
}

async function updateActionStateForActiveTab(): Promise<void> {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (typeof activeTab?.id !== "number") {
            return;
        }
        await updateActionState(activeTab.id, activeTab.url);
    } catch (error) {
        logError("tabs.query failed while updating active tab state", error);
    }
}

async function setupContextMenu(): Promise<void> {
    try {
        await chrome.contextMenus.removeAll();
        await chrome.contextMenus.create({
            id: ABOUT_MENU_ID,
            title: "About Monochromatic",
            contexts: ["action"],
        });
    } catch (error) {
        logError("Failed to set up context menu", error);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    void ensureDefaults();
    void setupContextMenu();
    void updateActionStateForActiveTab();
});

chrome.runtime.onStartup.addListener(() => {
    void ensureDefaults();
    void setupContextMenu();
    void updateActionStateForActiveTab();
});

chrome.action.onClicked.addListener((tab) => {
    void toggleCurrentDomain(tab);
});

chrome.tabs.onActivated.addListener(() => {
    void updateActionStateForActiveTab();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" || changeInfo.url) {
        void updateActionState(tabId, tab.url);
    }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && changes[STORAGE_KEY]) {
        void updateActionStateForActiveTab();
    }
});

chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId !== ABOUT_MENU_ID) {
        return;
    }

    void chrome.tabs.create({ url: chrome.runtime.getURL("about.html") });
});
