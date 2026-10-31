<p align="center"><img src="assets/Kanso/kanso-lockup-light.png" alt="Kanso" width="420" /></p>

# Kanso 2.6.0

Instant-marker stream badges and a no-echo formatter for Nuvio + AIOStreams. **Every fact appears once:** chips own language, subtitles, channels, source, tier, streaming origin and picture; encode sits beside the container as formatter text. One formatter, four skins (Solid, Transparent, Mono, Outline), and a matching **Kanso Player** pack for badges under the Nuvio player title. The Compact preset was retired in 2.6.0.

**Outline is the default appearance; Manrope Semibold is the default badge font.** Sourced brand marks sit alongside a complete custom glyph family, with shared height, stroke, corners and spacing. The custom direction was developed with imagegen and drawn as crisp production SVGs. Source files and per-badge provenance are documented in [the design notes](docs/badge-design.md). Matching uses Kanso Instant Unicode markers from structured AIOStreams fields, not filename regex.

![New Kanso Outline badge system](assets/Kanso/kanso-badges-preview.png)

This preview uses the generated badge PNGs. The [local gallery](badges/design/gallery.html) includes all four skins and an approximate native 20px view. Device rendering has not been verified. Use the matching install files below.

## Install

Use **one formatter** and **two badge links per skin**: one for the Nuvio stream list and one for the Nuvio player.

**Formatter:** [formatter-detailed.json](https://raw.githubusercontent.com/nosvasedis/Kanso/main/formatter-detailed.json)

| Skin | Stream list (stream badge setting) | Player (player badge setting) |
|---|---|---|
| **Solid** | [kanso-solid-detailed.json](https://gist.githubusercontent.com/nosvasedis/7abd79424bb8981b511838524c52f097/raw/kanso-solid-detailed.json) | [kanso-solid-player.json](https://gist.githubusercontent.com/nosvasedis/7abd79424bb8981b511838524c52f097/raw/kanso-solid-player.json) |
| **Transparent** | [kanso-transparent-detailed.json](https://gist.githubusercontent.com/nosvasedis/63b769d205bddbbef79faf8beef53c28/raw/kanso-transparent-detailed.json) | [kanso-transparent-player.json](https://gist.githubusercontent.com/nosvasedis/63b769d205bddbbef79faf8beef53c28/raw/kanso-transparent-player.json) |
| **Mono** | [kanso-mono-detailed.json](https://gist.githubusercontent.com/nosvasedis/1858e332fef11d136f76c697ea6c7439/raw/kanso-mono-detailed.json) | [kanso-mono-player.json](https://gist.githubusercontent.com/nosvasedis/1858e332fef11d136f76c697ea6c7439/raw/kanso-mono-player.json) |
| **Outline** | [kanso-outline-detailed.json](https://gist.githubusercontent.com/nosvasedis/0c3a88f4231dd17a249384e39cdbb127/raw/kanso-outline-detailed.json) | [kanso-outline-player.json](https://gist.githubusercontent.com/nosvasedis/0c3a88f4231dd17a249384e39cdbb127/raw/kanso-outline-player.json) |

1. Use **AIOStreams 2.36.0 or later**, verified against the official 2.36.0 engine. Older engines can lack the track operations this formatter needs.
2. In AIOStreams, select the custom formatter and import or sync the formatter URL. Alternatively, paste its `name` and `description` from `formatter-detailed-export-name.txt` and `formatter-detailed-export-description.txt`.
3. Set your preferred audio and subtitle languages in AIOStreams. Kanso reads those preferences.
4. In Nuvio, **replace** any old Kanso pack with the stream-list link of your skin, and set the matching `-player` link as the player badge pack. Do not merge with an old import, which can leave retired entries behind.
5. For an upgrade, **refresh the formatter and both packs**. Kanso uses a version marker, so mixed old/new exports fail closed instead of showing confident badges. Saving a URL does not guarantee the app has fetched the newest content; refresh its import when needed.
6. On Nuvio TV, turn off its native file-size badges if you keep Kanso's `💾` size row.

**Compact users (before 2.6.0):** the Compact formatter (`formatter.json`) and packs (`kanso-<skin>.json`) were removed. Switch to the formatter and links above.

The AIOStreams default template limit is **15,000 characters per field**. Kanso (19,159 / 12,969) **requires a raised limit**: on a self-hosted instance set `MAX_FORMATTER_TEMPLATE_LENGTH=20000`. If a host rejects a template, check its engine version and configured limit. Do not truncate the templates.

## Kanso Player (badges under the player title)

Nuvio's player does not read the formatter. It writes its own plain text from the decoder (for example `2160p 4K UHD HEVC DV HDR HDR10 10bit TrueHD Atmos 7.1 eng English`), so the stream-list packs, which match only Kanso's invisible markers, stay dark there by design. In Nuvio, choose a **Kanso Player** pack as the player badge pack, and keep the normal Kanso pack for the stream list. The packs use the same artwork as the stream-list packs and live in the same gists. Use **two different links**: a stream-list pack (for example `kanso-outline-detailed.json`) in the stream badge setting, and the matching `-player` pack in the player badge setting. A stream-list pack in the player shows nothing.

**Kanso Player:** [Solid](https://gist.githubusercontent.com/nosvasedis/7abd79424bb8981b511838524c52f097/raw/kanso-solid-player.json) · [Transparent](https://gist.githubusercontent.com/nosvasedis/63b769d205bddbbef79faf8beef53c28/raw/kanso-transparent-player.json) · [Mono](https://gist.githubusercontent.com/nosvasedis/1858e332fef11d136f76c697ea6c7439/raw/kanso-mono-player.json) · [Outline](https://gist.githubusercontent.com/nosvasedis/0c3a88f4231dd17a249384e39cdbb127/raw/kanso-outline-player.json)

Resolution, picture, and the codec, channels and language of the **selected** audio track come only from the playing decoder. From **Nuvio TV 1.1.0-beta.9 / Mobile 0.6.6-beta**, the player also reads `stream.name`, which is the Kanso formatter's title, for the groups the decoder cannot know: specials (Hybrid, Criterion, IMAX, 3D, cuts…), streaming origin, tier, source and subtitles. These chips are the same as in the stream list. The formatter therefore keeps those markers in the title field. Subtitle chips show the preferred subtitles present on the file, not the one currently selected. Decoder chips are anchored to the decoder's own text, so a filename can never light resolution, picture, audio or language. Older Nuvio builds show decoder chips only. Because the decoder text cannot separate some cases, a few chips are deliberately conservative:
- **Dolby Vision** shows DV only, never DV + HDR10, since profile 5 (no HDR10 base) looks the same as profile 8. HDR10+ is shown when the decoder reports PQ and Nuvio confirms HDR10+ from the filename.
- **SDR** is never claimed, because a missing HDR token can also mean the transfer is unknown.
- **DTS-HD MA** needs both Nuvio tokens, because Nuvio also writes `DTS-HD MA` for a DTS-ES Matrix profile. ExoPlayer reports MA as DTS-HD.
- **Channels:** Nuvio reports only 1.0, 2.0, 5.1 and 7.1, so other layouts have no chip, and a 6-channel track always reads as 5.1.
- **Atmos** appears only when the player reports it: E-AC-3 JOC, or an Atmos codec profile in mpv. ExoPlayer TrueHD shows as TrueHD.
- **Language** is matched on the track's own code, so it works with any app locale, a Greek one included.

`npm run test:player` ports Nuvio's `playbackMatchText` and checks 36,666 decoder states (mpv and ExoPlayer), names that spell out decoder facts, and 71 real titles through `stream.name`, against independently written truths for every skin. `node scripts/test-player-badges.mjs --java` repeats the check in native Java regex.

## What the formatter shows

- **Title:** transport emoji, stars, and the score as a percentage of the best stream in the list (`★★★★☆ · 87%`); seeders only for P2P or uncached debrid.
- **Description rows:** debrid cache state (`⚡`/`⏳`/`❔`), container, encode (`🎞️`), release group, country; size, folder size, bitrate, age; addon/service, indexer, private/freeleech, library/preload.
- **Warnings with no chip:** preferred audio missing, HDR/SDR conflict, upscaled, the matched Bad-rule name, NZB health.
- **Chips:** specials (SeaDex, IMAX, 3D, Hybrid, Criterion, cuts, B&W, remaster/proper), streaming origin, numbered tier or generic source, resolution, picture, audio, channels, up to four preferred spoken languages, and preferred subtitles present on the file.

Chips read left to right as specials (SeaDex, IMAX, 3D, Hybrid, Criterion, cuts, B&W, remaster/proper), then streaming origin, then numbered tier or generic source, then resolution, picture, audio, channels, language and subtitles. Encode is formatter text on the release row (`📦 MKV · 🎞️ HEVC · 👥 GROUP`), never a chip.

The formatter does not change AIOStreams sorting or ranking. Tiers are named rule/group classifications, not playback guarantees. Unknown tiers display one source badge. WEBRip is classified separately from WEB-DL. The title stars show AIOStreams relative expression score, rounded to the nearest whole star (Nuvio cannot draw half stars), not a guarantee of playback or objective file quality. The `%` is relative to the top-scored stream of the same list.

The detection library contains 201 definitions. Each stream-list pack exports 189 chips, including six WEBRip tier variants; each player pack 178. Language variants are consolidated into 38 display families in each audio/subtitle row. New reported-channel badges cover 1.0, 2.1 and 8.1; 8.1 no longer displays as 7.1. Best/Good/OK score chips, unranked family chips, MULTI language chips and encoder chips stay retired. No disabled placeholders or empty groups are exported.

## Accuracy and uncertainty

- **No inferred HDR from 4K REMUX.** Unknown range shows neither HDR nor SDR. Explicit SDR, HLG and supported DV/HDR combinations stay distinct. Conflicting SDR/HDR metadata produces a warning rather than simultaneous claims.
- Structured source/resolution information takes precedence. Limited filename fallbacks require bounded tokens and technical context; parsed title/release-group strings are removed from that fallback text.
- With audio tracks, codec and channel chips come from the **first usable matching track in file order** from your AIOStreams preferred-language context, excluding known commentary. Language chips show up to four matching preferred languages, the first of them from that same track. Extra languages and subtitles on the file that are not in that preference list do not get chips. It does not guarantee the player will select that track.
- If the preferred language is unavailable, a warning replaces a misleading language/codec assertion. Unrecognized languages have no chip and leave no visible text: codes are mapped as whole list items, so for example Taiwanese or Filipino can never light Tamil, Swedish, Finnish or Norwegian. The 48 detected identities map to 38 spoken/subtitle display families. ES groups Spanish variants, PT groups Portuguese variants, and IN groups the nine Indian languages for both audio and subtitles. IN is a family label; use the player to see the exact language. Preference selection still uses exact identities.
- Without track metadata, audio codec tags describe the **file**, not a guaranteed language/codec pairing. Without tracks, a language chip is used only with `probe` or `indexer` confidence. Channels, subtitles and source never also appear as formatter text. Encode is formatter-owned beside the container and is not truncated.
- Cache state is `⚡` cached, `⏳` uncached or `❔` unknown, at the start of the container/codec description row, and only for debrid streams. A dot follows only when another release field appears. Usenet, HTTP, P2P, live and other delivery types do not receive a cache cue. Bad sources and upstream health messages remain visible.
- A Netflix/Prime/etc. origin badge does not establish current subscription availability or regional rights.

## Tamtaro setup

The official Complete SEL Setup v3.2.9 was checked for this update. Its wizard puts your language choices, passthrough choices and fallbacks into AIOStreams’ language fields. Kanso reads the engine’s resolved preference context; `Original` can resolve to the media’s original language. Unresolved Original/Multi/Dubbed/Unknown placeholders do not become invented language chips.

Keep Kanso as the custom formatter when updating Tamtaro; changing the formatter does not alter Tamtaro’s SELs, sorting or stream ranking. Live user-profile settings were not changed or inspected. See [Tamtaro’s official changelog](https://github.com/Tam-Taro/SEL-Filtering-and-Sorting/blob/main/CHANGELOG.md).

## Appearance

Manrope Semibold gives generic badges a shared voice; small captions and tiers use Bold. Brand marks retain their own letterforms. Source icons sit above their captions to save horizontal space, and tiers use large, plain T1–T8 labels. DVD REMUX stacks DVD above REMUX. Resolution chips use UHD/QHD/FHD captions, and longer editions use readable abbreviations. Channels use a large filled speaker beside bold numerals. Compound picture/audio chips give the official primary logo more space, with smaller text suffixes and balanced paired brand marks. Spoken languages use speech-shaped flags with horizontal codes; subtitles use flag-filled documents beside a code stacked above SUB. All four skins share geometry. **Outline has colored words and glyphs matching the border; Transparent has white words and glyphs.** Flags retain real colors. Special editions keep distinct colors, and sources and their tiers share family hues. Picture uses gold, audio/channels cyan and languages/subtitles orchid/violet. Capture sources use coral. Solid uses category fill with contrasting ink; Mono uses white/black. Nuvio draws the border. The new channel contract requires the new formatter and pack together; mismatched old output fails closed.

The title begins with an invisible U+200E left-to-right anchor so Nuvio TV 1.0.0 cannot let a later hidden marker pick RTL alignment. HDR10+/HDR10/HLG suppress redundant generic HDR badges, and DTS Master Audio wins over generic DTS-HD. Structured audio tags cannot borrow a different codec from the filename.

Release-rule concerns display their specific matched name, such as `🚩 Bad Dual Groups`. Radarr/Sonarr prefixes are omitted. CAM, TS, TC and SCR are source chips, not formatter warnings. Conflicting HDR/SDR tags retain `⚠️`, upscaling retains `🔼`, and NZB health messages keep their status emoji and full details.

## Build, test and maintain

```sh
npm ci
npm run test:setup
npm run release
```

The setup clones the official AIOStreams **v2.36.0**, pinned to commit `ce6244454ee131bf0945b2bd6abc670a449b224d`, into ignored `.vendor/`. The release build is local and never uploads. It validates actual engine syntax/rendering and matching across 415 fixtures × four skins, plus 71 real release names (movies, series, anime) parsed by the engine's own FileParser with exact chip sets and visible-text grammar (`npm run test:real-titles`), all referenced PNG hashes and tier-sync regressions. No native playback/device compatibility claim is made by these tests.

Every exported badge has a positive real-metadata fixture. For native Java regex and Nuvio's exact first-strong direction semantics, run `node scripts/test-nuvio-java.mjs` with Java 21 or later; pass `--java=/path/to/java` to select an installed runtime. These checks do not substitute for testing your installed TV app or playback.

Maintainer publication, using the existing authorized GitHub CLI login for repository writes and a gist-capable token in `.env`:

```sh
npm run release:publish
```

Publication overlays a fresh checkout, preserves remote history/unrelated files, performs a non-force push, then updates the two files in each existing gist while preserving other gist files. It checks ownership and independently reads back uploaded content. Private config, tokens, vendor dependencies and recovery snapshots are excluded. `npm run verify:public` checks public formatter/pack/PNG bytes against local exports.

`npm run sync` opens the tier-group helper. Preview is read-only; applying a sync changes the tier oracle and regenerates the formatter locally. Import or publish the newly built formatter to use those classifications. Patching/building no longer implicitly uploads gists.

## Recovery and references

For this migration, old local exports/scripts were saved under `backup/approved-20261013`. That recovery folder is private and not included in the public repository. Public users can retrieve the previous formatter, pack and PNG files from Git history; pair an old formatter with its matching old pack. Maintainer release records and pre-write gist revisions are saved privately in `docs/release-evidence/`.

See [release notes](docs/kanso-v2.md), the [AIOStreams formatter reference](https://docs.aiostreams.viren070.me/reference/custom-formatter/), [official AIOStreams source](https://github.com/Viren070/AIOStreams/tree/v2.36.0), [Nuvio repositories](https://github.com/NuvioMedia) and [kingsizew/badges](https://github.com/kingsizew/badges).
