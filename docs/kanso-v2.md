# Kanso 2 release notes

Compact becomes the default; Detailed is a separately paired formatter/badge preset. All three skins remain available. Import both halves of the selected pair when upgrading.

## Fixed

- Removed 2160p REMUX → HDR inference; preserved explicit SDR, HLG and DV/HDR combinations, with a warning for contradictory metadata.
- Corrected source/resolution precedence, sparse WEB metadata and actual WEBRip labeling. Known tiers are merged into the Detailed source badge, without another Unranked or plain-source pill.
- Replaced unreadable white-on-white and low-contrast composite artwork. PNG ink now matches the exported background; text is measured with the renderer and padded consistently.
- Removed duplicate star/Best/Good/OK judgments from the active presets. Underlying sorting and tier rules remain intact.
- Associated preferred language, codec and channels with one usable track, excluding known commentary. File-level fallback data is presented with appropriate uncertainty; Greek subtitles do not claim Greek audio.
- Kept meaningful cuts/presentation variants, SeaDex, source warnings, pack context, health messages and real delivery/cache state. Technical provenance belongs in Detailed.
- Local builds never auto-publish. Release publication preserves remote files/history and other gist files, verifies ownership, backs up pre-write revisions and reads content back.

## Verified scope

Official AIOStreams 2.35.9 syntax and output; 64 fixtures across both presets and all skins; 166 unique exported PNGs; file hashes, embedded ink, glyph padding and modeled small-text contrast of at least 4.86:1; tier-sync regressions. Actual PNG/output previews were inspected at desktop and mobile browser sizes.

A browser reconstruction of Nuvio TV geometry was used. Native Nuvio installation, focus/marquee behavior, screen-reader behavior and playback are not established by that preview. Transparent requires a suitable dark background. Detailed can exceed the visible native badge-row width.

The default template budget is 15,000 per field. The two presets are validated under it; host overrides and later engine schema changes can require separate verification. The verified engine exposes singular `track.tag`; the build does not assume newer documentation's plural track field is supported.

The old 124-filter inventory is preserved, with legacy ranking/channel entries disabled in the new presets. Detailed includes six extra WEBRip tier label variants. Existing content-hashed artwork remains available for rollback.
