# Kanso 2.5.3 — clearer gists

- Player packs are now `kanso-<skin>-player.json`, beside `kanso-<skin>.json` (Compact) and `kanso-<skin>-detailed.json`. The 2.5.2 names `kanso-player-<skin>.json` were removed; re-enter the player link in Nuvio.
- Each gist leads with `Kanso <Skin>.md`, so GitHub titles it by skin and lists which link goes in which Nuvio setting.

# Kanso 2.5.2 — Kanso Player

- **Kanso Player packs** (`kanso-<skin>-player.json`, in each skin's gist): the same artwork, matched against the plain text that Nuvio's player writes from the decoder, so badges appear under the player title. Chips cover resolution, picture, and the codec, channels and language of the selected audio track. Conservative where that text is ambiguous: DV never claims HDR10, SDR is never claimed, and DTS-HD MA needs both Nuvio tokens.
- **Verification:** `npm run test:player` ports Nuvio `playbackMatchText` (mpv + ExoPlayer) and checks 34,876 decoder states × 4 skins against independently written truths. `--java` repeats the check in native Java regex.

# Kanso 2.5.1 — accuracy release

- **Languages:** codes are mapped as whole list items. Uncatalogued languages (Icelandic, Catalan, Irish, Tagalog, Galician, Basque…) no longer leak as visible text (`★★★★☆ · 87IS`), and Taiwanese/Filipino no longer light Tamil, Swedish, Finnish or Norwegian. Unknown languages no longer consume Detailed's four slots; Compact keeps the language tied to the selected codec track.
- **Editions:** the parser reports `Extended Edition`; the Extended chip now appears on real releases. `IMAX.Enhanced` (parsed as plain IMAX) keeps the IMAX Enhanced chip. Open Matte, B&W and True-Hue are read from a bounded filename token even when another edition is parsed.
- **Audio:** probe/indexer tag spellings `AC3`, `AC-3`, `E-AC-3`, `EAC3`, `DDP`, `DTS-X` map to their artwork.
- **Score:** Detailed shows `★★★★☆ · 87%` (percent of the best stream in the list). Half stars round up instead of showing as empty.
- **Budget:** Compact 13,540/13,604 fits the default limit; Detailed 16,064/16,064 needs `MAX_FORMATTER_TEMPLATE_LENGTH=20000`.
- **Verification:** new `npm run test:real-titles`: 71 real movie/series/anime release names parsed by the engine FileParser, exact chip sets, visible-text grammar, × 2 presets × 4 skins. Plus 415 existing fixtures and the Java/Nuvio check.

# Kanso 2.5.0 — Manrope, Outline, Instant markers

Kanso keeps Instant Unicode matching on structured AIOStreams fields. Outline is the default appearance, with Manrope Semibold for generic labels and original artwork for brand marks. Four skins share consistent geometry: Solid, Transparent, Mono and Outline. Category colors remain gold picture, cyan sound, orchid locale, traffic-light resolution, blue tiers, slate source, brand streaming and distinct specials. See [badge design and source notes](badge-design.md). This release replaces the previous badge appearance and formatter contract.

The formatter never prints a fact an enabled chip already shows. Language, subtitles, channels, source family/tier, CAM/TS/TC/SCR and picture tags are chips. Encode sits beside the container as `🎞️` text, not a chip. The title carries transport emoji and stars. Debrid cache state (`⚡`/`⏳`/`❔`) starts the container/codec description row, with a dot only before another visible field. Seeders appear on the title only for P2P or uncached streams.

## Inventory

208 detection definitions. Redesigned Compact exports 156 chips; Detailed exports 189, including six WEBRip tier variants. New channel facts cover 1.0, 2.1 and 8.1 without mislabeling 8.1 as 7.1. Best/Good/OK score chips, unranked family chips, MULTI and encoder chips stay retired. Compact hides numbered tiers and streaming origin; Detailed shows them. Hybrid, Criterion, cuts, IMAX and the rest of the specials lead the row on both presets. One source chip wins: numbered tier or generic family, never both. WEBRip remains distinct from WEB-DL.

## Language and subtitles

Forty-eight detected language identities map to 38 display families for both audio and subtitles. ES groups Spanish/Latino, PT groups Portuguese variants, and IN groups nine Indian languages. IN is a geographical family label, not an assertion of Hindi. Compact emits the preferred usable track; Detailed can resolve up to four tracks, with duplicate family badges displayed once. Exact preference selection still precedes grouping. Spoken chips use real-color flags clipped into speech bubbles plus code; subtitles use flag-filled documents behind a vertically stacked language code and SUB. Outline has colored ink matching the border; Transparent has white ink. Unresolved Original/Multi/Dubbed/Unknown values do not become chips.

Chips read left to right as specials (SeaDex, IMAX, 3D, Hybrid, Criterion, cuts, B&W, remaster/proper), then streaming origin, then numbered tier or generic source, then resolution, picture, audio, channels, language and subtitles. Encode is formatter text on the release row (`📦 MKV · 🎞️ HEVC · 👥 GROUP`).

## Verification

415 real-engine fixtures × two presets × four skins on official AIOStreams 2.36.0. Templates fit the default 15,000-character budget: Compact 12,173/12,219; Detailed 14,688/14,687. Every exported badge has a positive structured-metadata fixture.

Refresh the formatter and **replace** the old imported Kanso badge pack. Updating a remote JSON does not automatically delete old entries retained by a merge in the client. Keep Kanso as your custom formatter during Tamtaro template updates.

## Nuvio coverage in 2.3.2

Audio metadata supports AIOStreams 2.36.0 multi-value track tags, with legacy single-tag and codec fallbacks. Audio description (AD) follows the same selected usable audio track as codec and channels. Forced and SDH subtitle indicators follow configured subtitle languages, or known tracks when no preference is configured; flags and descriptive track titles are supported. These indicators describe available file tracks, not the player selection. Hardcoded HDRip has its own HC HDRIP source; DVD REMUX is distinct from Blu-ray REMUX and cannot claim Blu-ray tiers. H-SBS and H-OU use 3D SBS and 3D OU artwork, suppress generic 3D duplication, and suppress both layouts when metadata contradicts itself. All new markers append to the existing namespace without moving older IDs.

## Cache row in 2.3.2

Debrid-only cache state moved from the title to the start of the container/codec description row. The cache cue never prints for Usenet, HTTP, P2P, live, YouTube, archive or external streams, even when upstream supplies a cached property. Conditional separators appear only between visible fields; a cache cue alone has no trailing dot.

## Badge refinement in 2.3.2

Subtitle language/SUB lettering has no background panel in any skin. The complete flag document sits beside the lettering, exposing the real app background between and around the letters. Source captions retain their previous type size; source/tier glyphs share a compact upper row above the caption. Generic source padding is reduced. Formatter text and matching semantics are unchanged.

## Compact artwork in 2.3.3

DVD REMUX puts DVD above REMUX. Channel artwork is nearly square, with a centered speaker above its channel number, based on the retained imagegen study. Resolution displays use shorter UHD/QHD/FHD captions and reduced side spacing, keeping exact numeric resolutions. Long specials use EXT CUT, THEATR, UNCENS, REMAST, OPEN MT and REGRADE; Criterion keeps its official emblem above the full name. All four skins use matching geometry and retain individual edition hues. These are artwork and label changes; formatter detection and markers are unchanged.

## Complete captions in 2.3.4

HC HDRIP stacks HC above HDRIP; FORCED keeps its full word below the subtitle glyph. Channel artwork removes unused minimum width and reduces side padding without compressing its digits. Edition abbreviations have no periods. Resolution captions now fit fully inside the canvas, and subtitle language/SUB lanes grow to fit their measured lettering with a clear right margin. Generation rejects out-of-bounds layers. Tests compare every resolution caption, subtitle code and SUB caption against the complete font rendering across all four skins. Formatter fields and detection markers are unchanged.

## Reading hierarchy in 2.4.0

Compound badges enlarge the main official mark and reduce secondary HDR, DD+, TrueHD, MA and HD elements. The separator stays quiet and the primary logo cannot be rescaled to make room for a suffix. Channels use a large filled speaker beside bold numbers, replacing the tiny vertical stack.

Formatter wording is shorter: `📚 Pack`, `🌱 125` for seeders and `⬇️ Preload`. Private/freeleech use `🔐` and `🆓` without repeating the icon meaning in words. `📂 Library` remains distinct from a season pack. Preferred-audio and HDR/SDR warnings keep their meaning with shorter text; provider health details and messages remain intact. Equal file/folder sizes print once; a distinct positive folder size still has its `📁` cue. All dot separators remain conditional. The service field's duplicate existence gate was removed to keep both template fields below 15,000 characters. Detection markers, language selection, tiers and cache behavior are unchanged. Refresh both the formatter and badge pack to receive the complete update.

## Paired official marks in 2.4.1

Dolby Vision + HDR10/HDR10+ use balanced brand-logo sizing rather than the small text-suffix treatment. Vision uses 52px height, boxed HDR10 uses 48px, and the much wider HDR10+ mark uses 38px for comparable visual weight without shrinking the entire composition. Both official marks and the separator remain intact across all four skins. Plain HDR text and audio text suffixes retain the smaller hierarchy introduced in 2.4.0. Formatter output and all other badge images are unchanged.

## Detailed rating in 2.4.2

Detailed shows the normalized 0–100 stream-expression score immediately after the stars, for example `🔗 ★★★★☆ · 80`. If a seeder count is shown it follows the rating, such as `🧲 ★★★★☆ · 80 🌱 125`. The number shares the existing star visibility condition (normalized score at least 20); missing scores and lower scores leave no number or separator. This is `nSeScore`, not raw `seScore`, and does not change ranking or badge selection. Compact retains its previous output. Refresh the Detailed formatter to receive this change; badge packs are unchanged.

## Additional channel layouts in 2.5.0

Both presets and all four skins add 3.0, 4.0, 5.0 and 6.0, using the established filled speaker and Manrope numerals. All eleven supported channel layouts remain exact and distinct. A selected audio track supplies its own layout; file-level channel arrays select the highest supported layout regardless of input order. Unknown values are filtered as whole values, so 15.0 cannot produce a 5.0 chip. Four new marker atoms append after all existing allocations; no prior marker changes. Channel emission uses a compact replacement chain after exact selection, keeping both template fields below 15,000 characters. Refresh both the formatter and matching badge pack to receive the additions.
