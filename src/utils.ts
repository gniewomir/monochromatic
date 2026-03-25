type Domain = string;

export const STORAGE_KEY = "domains";
export const DEFAULT_DOMAINS: string[] = [];
export const SUPPORTED_PROTOCOLS: ReadonlySet<string> = new Set(["http:", "https:"]);
const DEBUG_PREFIX = "[Monochromatic]";

function tryParseUrl(value: string): URL | null {
    try {
        return new URL(value);
    } catch {
        return null;
    }
}

export function normalizeDomain(raw: unknown): Domain {
    if (typeof raw !== "string") {
        return "";
    }

    const value = raw.trim().toLowerCase();
    if (!value) {
        return "";
    }

    const parsed = tryParseUrl(value) ?? tryParseUrl(`https://${value}`);
    if (!parsed?.hostname) {
        return "";
    }

    if (!SUPPORTED_PROTOCOLS.has(parsed.protocol)) {
        return "";
    }

    return parsed.hostname;
}

export function normalizeDomainList(items: unknown): Domain[] {
    if (!Array.isArray(items)) {
        return [];
    }

    const unique = new Set<Domain>();
    for (const item of items) {
        const normalized = normalizeDomain(item);
        if (normalized) {
            unique.add(normalized);
        }
    }

    return [...unique];
}

export function shouldApplyToHost(hostname: string, domains: readonly Domain[]): boolean {
    if (!hostname) {
        return false;
    }

    for (const domain of domains) {
        if (hostname === domain || hostname.endsWith(`.${domain}`)) {
            return true;
        }
    }

    return false;
}

export function logDebug(message: string, details?: unknown): void {
    if (details === undefined) {
        console.debug(DEBUG_PREFIX, message);
        return;
    }
    console.debug(DEBUG_PREFIX, message, details);
}

export function logError(message: string, error: unknown): void {
    console.error(DEBUG_PREFIX, message, error);
}

export async function safeStorageGet(key: string): Promise<Record<string, unknown>> {
    try {
        const result = await chrome.storage.sync.get(key);
        return result as Record<string, unknown>;
    } catch (error) {
        logError("storage.sync.get failed", error);
        return {};
    }
}

export async function safeStorageSet(value: Record<string, unknown>): Promise<boolean> {
    try {
        await chrome.storage.sync.set(value);
        return true;
    } catch (error) {
        logError("storage.sync.set failed", error);
        return false;
    }
}

export async function getConfiguredDomains(): Promise<Domain[]> {
    const stored = await safeStorageGet(STORAGE_KEY);
    if (Array.isArray(stored[STORAGE_KEY])) {
        return normalizeDomainList(stored[STORAGE_KEY]);
    }

    return DEFAULT_DOMAINS;
}
