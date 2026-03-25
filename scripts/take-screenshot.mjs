import sharp from "sharp";
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT_DIR = join(ROOT, "branding", "screenshots");

function slugify(url) {
    const { hostname, pathname } = new URL(url);
    return [hostname, pathname]
        .join("")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
}

function outputPath(url) {
    const slug = slugify(url);
    const ts = new Date().toISOString().replace(/[:T]/g, "-").replace(/\..+/, "");
    return join(OUTPUT_DIR, `${slug}-${ts}.png`);
}

const WIDTH = 1280;
const HEIGHT = 800;

function parseArgs() {
    const args = process.argv.slice(2);
    const scrollIndex = args.indexOf("--scroll");
    let scrollPx = 0;
    if (scrollIndex !== -1) {
        scrollPx = parseInt(args[scrollIndex + 1], 10) || 0;
        args.splice(scrollIndex, 2);
    }
    const url = args[0];
    if (!url) {
        console.error("Usage: node scripts/take-screenshot.mjs <url> [--scroll <pixels>]");
        console.error(
            "Example: node scripts/take-screenshot.mjs https://www.youtube.com/@BBCEarth/videos --scroll 440",
        );
        process.exit(1);
    }
    try {
        new URL(url);
    } catch {
        console.error(`Invalid URL: ${url}`);
        process.exit(1);
    }
    return { url, scrollPx };
}

async function captureScreenshot(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: WIDTH, height: HEIGHT },
        deviceScaleFactor: 1,
        locale: "en-US",
        timezoneId: "America/New_York",
    });
    const page = await context.newPage();

    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Dismiss common cookie/consent dialogs
    for (const label of ["Accept all", "Accept", "I agree", "Agree", "Allow all"]) {
        try {
            const btn = page.getByRole("button", { name: label, exact: false });
            await btn.waitFor({ state: "visible", timeout: 2000 });
            await btn.click();
            console.log(`Dismissed consent dialog ("${label}")`);
            await page.waitForTimeout(2000);
            break;
        } catch {
            // not present, try next
        }
    }

    return { page, browser };
}

async function scrollAndCapture(page, browser, scrollPx) {
    if (scrollPx > 0) {
        await page.evaluate((px) => window.scrollBy(0, px), scrollPx);
        console.log(`Scrolled down ${scrollPx}px`);
        await page.waitForTimeout(1500);
    }

    const buf = await page.screenshot({ type: "png" });
    console.log(`Captured ${WIDTH}x${HEIGHT} screenshot`);
    await browser.close();
    return buf;
}

async function splitGrayscale(screenshotBuf, dest) {
    const { width, height } = await sharp(screenshotBuf).metadata();
    const mid = Math.floor(width / 2);

    const leftBuf = await sharp(screenshotBuf)
        .extract({ left: 0, top: 0, width: mid, height })
        .toBuffer();

    const rightBuf = await sharp(screenshotBuf)
        .extract({ left: mid, top: 0, width: width - mid, height })
        .grayscale()
        .toBuffer();

    await sharp({
        create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
        .composite([
            { input: leftBuf, left: 0, top: 0 },
            { input: rightBuf, left: mid, top: 0 },
        ])
        .png()
        .toFile(dest);

    console.log(`Saved ${width}x${height} split image to ${dest}`);
}

mkdirSync(OUTPUT_DIR, { recursive: true });

const { url, scrollPx } = parseArgs();
const dest = outputPath(url);
const { page, browser } = await captureScreenshot(url);
const screenshot = await scrollAndCapture(page, browser, scrollPx);
await splitGrayscale(screenshot, dest);
