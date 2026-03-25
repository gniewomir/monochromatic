import {
    STORAGE_KEY,
    SUPPORTED_PROTOCOLS,
    getConfiguredDomains,
    logDebug,
    logError,
    shouldApplyToHost,
} from "./utils";

const GRAYSCALE_FILTER = "grayscale(1)";
const GRAYSCALE_CLASS = "monochromatic-grayscale-active";
const STYLE_ELEMENT_ID = "monochromatic-grayscale-style";

function ensureManagedStyleElement(): HTMLStyleElement {
    const existing = document.getElementById(STYLE_ELEMENT_ID);
    if (existing instanceof HTMLStyleElement) {
        return existing;
    }

    const styleElement = document.createElement("style");
    styleElement.id = STYLE_ELEMENT_ID;
    styleElement.textContent = [
        `html.${GRAYSCALE_CLASS} {`,
        `    filter: ${GRAYSCALE_FILTER} !important;`,
        `}`,
    ].join("\n");
    (document.head ?? document.documentElement).appendChild(styleElement);
    return styleElement;
}

function applyGrayscale(): void {
    const root = document.documentElement;
    ensureManagedStyleElement();
    root.classList.add(GRAYSCALE_CLASS);
}

function removeGrayscale(): void {
    const root = document.documentElement;
    root.classList.remove(GRAYSCALE_CLASS);
}

async function updateGrayscaleState(): Promise<void> {
    try {
        if (!SUPPORTED_PROTOCOLS.has(window.location.protocol)) {
            removeGrayscale();
            return;
        }

        const host = window.location.hostname.toLowerCase();
        if (!host) {
            removeGrayscale();
            return;
        }

        const domains = await getConfiguredDomains();
        if (!shouldApplyToHost(host, domains)) {
            removeGrayscale();
            return;
        }

        applyGrayscale();
    } catch (error) {
        logError("updateGrayscaleState failed", error);
    }
}

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") {
        return;
    }

    if (changes[STORAGE_KEY]) {
        logDebug("Configured domains changed, refreshing grayscale state");
        void updateGrayscaleState();
    }
});

void updateGrayscaleState();
