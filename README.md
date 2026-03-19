# Monochromatic

A browser extension that keeps selected websites in grayscale to reduce distractions.

## Why

Part of the enshittification of the internet is design intended to keep us hooked and engaged.
That is why features that fry our dopamine receptors, i.e., short-form TikTok-like content,
cannot be turned off on most platforms.

The network effect makes deleting an account painful, and exercising self-control is not always sustainable.
That is why I believe in slightly changing incentives.

After seeing promising results when I switched my mobile device to grayscale (an accessibility
option), I decided to build a browser extension to try the same approach on my desktop. Give it a
try.

## How it works

1. Install the extension
2. Pin the icon to your toolbar
3. Click the icon on any page to toggle grayscale for that domain
4. The setting is saved and applied automatically on future visits
5. Unpin the icon to increase friction if you are tempted to see the colorful version again

## Development

```bash
npm install
npm run build      # one-off production build
npm run watch      # rebuild on changes
npm run typecheck  # run TypeScript type checking
npm run release    # build and package into a .zip for submission
```

Load the `dist/` directory as an unpacked extension in your browser.

## Releasing

```bash
npm run release -- 0.4.0
```

This updates the version in `package.json`, `src/manifest.json`, and `package-lock.json`,
runs a production build, packages the result into `monochromatic-v0.4.0.zip` ready for store submission,
and creates an annotated git tag `v0.4.0`.

Push the commit and tag to the remote:

```bash
git push --follow-tags
```

## Support

- [Buy Me a Coffee](https://ko-fi.com/I3I61GPLRC)
- [Report an issue](https://github.com/gniewomir/monochromatic/issues) — keep in mind that simplicity is a feature itself
- [Blog](https://gniewomir.com)
- [Email](mailto:gniewomir.swiechowski+monochromatic@gmail.com)
