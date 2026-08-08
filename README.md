# Kanso

**No echo. Every detail once.**

Clean stream marks for [Nuvio](https://github.com/NuvioMedia) — an Instant AIOStreams formatter paired with three badge skins. Every useful fact about a stream, shown once: no duplicate resolutions, no redundant audio pills, no noisy filename soup in the badge row.

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#styles">Styles</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#requirements">Requirements</a>
</p>

---

## Philosophy

| Principle | What you get |
|-----------|----------------|
| **Rich** | Resolution, quality, release tiers, dynamic range, Smart Audio/Visual merges, editions, languages, streaming services |
| **Clean** | Readable AIOStreams title/description; badges carry the technical signal |
| **Once** | Best-wins tiers + merge badges (e.g. DV · HDR10+) suppress lower or redundant marks |
| **Instant** | Invisible Unicode markers from the formatter → tiny Nuvio regex → icons from this repo’s `/files` CDN |

Kanso is built for Nuvio. It is not a Universal “match the whole filename” pack.

---

## Install

### 1. AIOStreams formatter

1. Open your AIOStreams configure page → **Formatter** → Custom.
2. Import [`formatter.json`](https://raw.githubusercontent.com/nosvasedis/Kanso/main/formatter.json),  
   or paste [`formatter-export-name.txt`](https://raw.githubusercontent.com/nosvasedis/Kanso/main/formatter-export-name.txt) into **Name** and [`formatter-export-description.txt`](https://raw.githubusercontent.com/nosvasedis/Kanso/main/formatter-export-description.txt) into **Description** (preserve invisible characters).
3. Ensure your host allows long templates (see [Requirements](#requirements)).

### 2. Nuvio badges

Settings → Streams → Stream Badges → import **one** style raw URL:

| Style | Raw URL |
|-------|---------|
| **Solid** | `https://gist.githubusercontent.com/nosvasedis/7abd79424bb8981b511838524c52f097/raw/kanso-solid.json` |
| **Transparent** | `https://gist.githubusercontent.com/nosvasedis/63b769d205bddbbef79faf8beef53c28/raw/kanso-transparent.json` |
| **Mono** | `https://gist.githubusercontent.com/nosvasedis/1858e332fef11d136f76c697ea6c7439/raw/kanso-mono.json` |

Same packs also live in this repo as [`kanso-solid.json`](kanso-solid.json), [`kanso-transparent.json`](kanso-transparent.json), [`kanso-mono.json`](kanso-mono.json).

Refresh Nuvio after changing the badge URL so icons reload from `/files`.

---

## Styles

| Pack | Look |
|------|------|
| **Solid** | Filled pills, strong color hierarchy |
| **Transparent** | Outline / glass-friendly icons |
| **Mono** | High-contrast monochrome for dark UIs |

Matching rules are identical across styles — only art and colors change.

---

## How it works

```text
Vidhin / stream fields
        ↓
Kanso formatter (invisible markers + clean visible layout)
        ↓
Nuvio haystack
        ↓
Marker-only badge regex  →  PNG from raw.githubusercontent.com/nosvasedis/Kanso/.../files/
```

- Production patterns are short existence checks like `(?s)^(?=.*MARKER)` — not multi‑KB release-group allowlists.
- Icons are content-addressed under [`files/`](files/) for fast, stable GitHub raw URLs.

---

## Requirements

- **Nuvio** with stream badge JSON import
- **AIOStreams** custom formatter
- Host env: `MAX_FORMATTER_TEMPLATE_LENGTH` **≥ 16000** (Kanso name/description exceed the default 5000)

Optional but recommended: Vidhin-style ranked stream expressions so release **tiers** fire from `stream.rseMatched` (formatter also has release-group fallbacks).

---

## Repo layout

```text
formatter.json                 # AIOStreams import
formatter-export-*.txt         # paste-friendly name / description
kanso-{solid,transparent,mono}.json
files/                         # CDN icons (do not rename)
scripts/                       # build, patch, audit, publish
badges/                        # icon manifests
```

---

## Development

```bash
npm run test:v2-benchmark      # marker packs stay ≪ 15 ms/stream
npm run audit:gists            # local packs vs published gists
npm run audit:icons            # imageURL latency
npm run icons:cdn              # rematerialize + publish /files
npm run release:publish        # patch V2 packs + formatter + push gists
```

---

## Credits

- Marker / Instant architecture inspired by the community pattern popularized in [kingsizew/badges](https://github.com/kingsizew/badges) — Kanso uses its **own** marker lexicon, packs, and tooling.
- Built for [Nuvio](https://github.com/NuvioMedia) and [AIOStreams](https://github.com/Viren070/AIOStreams).

---

<p align="center"><em>No echo. Every detail once.</em></p>
