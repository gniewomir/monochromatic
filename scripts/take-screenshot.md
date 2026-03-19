# take-screenshot

Generates a promotional screenshot for the Chrome Web Store listing. Opens the given URL in headless Chromium at 1280x800, captures the page, and composites the left half in full color with the right half in grayscale — demonstrating the extension's core effect.

## Prerequisites

```bash
npm install
npx playwright install chromium
```

## Usage

```bash
npm run screenshot -- <url> [--scroll <pixels>]
```

| Argument            | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| `<url>`             | Page to screenshot (required)                                  |
| `--scroll <pixels>` | Scroll down before capturing, useful for skipping page headers |

## Output

Images are saved to `branding/screenshots/` with an auto-generated filename:

```
<slugified-url>-<YYYY-MM-DD-HH-mm-ss>.png
```

## Examples

```bash
# YouTube channel grid, scrolled past the header
npm run screenshot -- "https://www.youtube.com/@BBCEarth/videos" --scroll 440

# Reddit front page
npm run screenshot -- "https://www.reddit.com"
```

## Details

- Viewport: 1280x800, device scale factor 1
- Locale: en-US, timezone America/New_York
- Automatically dismisses common cookie/consent dialogs
- Uses `sharp` for image processing and `playwright` for browser automation
