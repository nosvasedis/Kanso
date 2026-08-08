# Badge icons: CDN hosting (Kanso)

Nuvio matches **Kanso** Instant badges with tiny marker regex (effectively free).
Icons are content-hashed PNGs on [`nosvasedis/kanso`](https://github.com/nosvasedis/kanso) under `/files`.

## Architecture

1. AIOStreams **Kanso** formatter injects invisible Unicode markers.
2. Badge JSON patterns are marker-only (`(?s)^(?=.*…)`).
3. Badge `imageURL`s point at:

```text
https://raw.githubusercontent.com/nosvasedis/kanso/main/files/<hash16>.png
```

Override with `ICON_CDN_BASE` (e.g. jsDelivr) if desired.

## Commands

```bash
npm run audit:icons              # latency probe of current pack URLs
npm run icons:materialize        # download/hash → badges/badge-images/
npm run icons:publish            # push /files to GitHub
npm run solid:patch && npm run transparent:patch && npm run mono:patch
npm run push-gist -- --require   # refresh Nuvio gist packs
```

Icon generators with `--upload` write into `badges/badge-images/files/` and emit Kanso CDN URLs.
