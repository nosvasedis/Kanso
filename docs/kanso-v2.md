# Kanso 2.3.0 — Manrope, Outline, Instant markers

Kanso keeps Instant Unicode matching on structured AIOStreams fields. Outline is the default appearance, with Manrope Semibold for generic labels and original artwork for brand marks. Four skins share consistent geometry: Solid, Transparent, Mono and Outline. Category colors remain gold picture, cyan sound, orchid locale, traffic-light resolution, blue tiers, slate source, brand streaming and distinct specials. See [badge design and source notes](badge-design.md). This release replaces the previous badge appearance and formatter contract.

The formatter never prints a fact an enabled chip already shows. Language, subtitles, channels, source family/tier, CAM/TS/TC/SCR and picture tags are chips. Encode sits beside the container as `🎞️` text, not a chip. The title carries cache (`⚡`/`⏳`/`❔`), transport emoji and stars. Seeders appear on the title only for P2P or uncached streams.

## Inventory

208 detection definitions. Redesigned Compact exports 156 chips; Detailed exports 189, including six WEBRip tier variants. New channel facts cover 1.0, 2.1 and 8.1 without mislabeling 8.1 as 7.1. Best/Good/OK score chips, unranked family chips, MULTI and encoder chips stay retired. Compact hides numbered tiers and streaming origin; Detailed shows them. Hybrid, Criterion, cuts, IMAX and the rest of the specials lead the row on both presets. One source chip wins: numbered tier or generic family, never both. WEBRip remains distinct from WEB-DL.

## Language and subtitles

Forty-eight detected language identities map to 38 display families for both audio and subtitles. ES groups Spanish/Latino, PT groups Portuguese variants, and IN groups nine Indian languages. IN is a geographical family label, not an assertion of Hindi. Compact emits the preferred usable track; Detailed can resolve up to four tracks, with duplicate family badges displayed once. Exact preference selection still precedes grouping. Spoken chips use real-color flags clipped into speech bubbles plus code; subtitles use flag-filled documents behind a vertically stacked language code and SUB. Outline has colored ink matching the border; Transparent has white ink. Unresolved Original/Multi/Dubbed/Unknown values do not become chips.

Chips read left to right as specials (SeaDex, IMAX, 3D, Hybrid, Criterion, cuts, B&W, remaster/proper), then streaming origin, then numbered tier or generic source, then resolution, picture, audio, channels, language and subtitles. Encode is formatter text on the release row (`📦 MKV · 🎞️ HEVC · 👥 GROUP`).

## Verification

337 real-engine fixtures × two presets × four skins on official AIOStreams 2.36.0. Templates fit the default 15,000-character budget: Compact 12,540/12,478; Detailed 14,988/14,988. Every exported badge has a positive structured-metadata fixture.

Refresh the formatter and **replace** the old imported Kanso badge pack. Updating a remote JSON does not automatically delete old entries retained by a merge in the client. Keep Kanso as your custom formatter during Tamtaro template updates.

## Nuvio coverage in 2.3.0

Audio metadata supports AIOStreams 2.36.0 multi-value track tags, with legacy single-tag and codec fallbacks. Audio description (AD) follows the same selected usable audio track as codec and channels. Forced and SDH subtitle indicators follow configured subtitle languages, or known tracks when no preference is configured; flags and descriptive track titles are supported. These indicators describe available file tracks, not the player selection. Hardcoded HDRip has its own HC HDRIP source; DVD REMUX is distinct from Blu-ray REMUX and cannot claim Blu-ray tiers. H-SBS and H-OU use 3D SBS and 3D OU artwork, suppress generic 3D duplication, and suppress both layouts when metadata contradicts itself. All new markers append to the existing namespace without moving older IDs.
