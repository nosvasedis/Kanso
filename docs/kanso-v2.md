# Kanso 2.0.1 — original illustrated appearance restored

The illustrated badge images, language flags and emoji formatter presentation are restored. The earlier text-label redesign changed the appearance too broadly. Both Compact and Detailed now use the original PNG artwork and emoji rows; the original title stars are available again.

## Preserved appearance

- All 189 original PNG files are referenced with their original content hashes, including Dolby/DTS/source logos, streaming logos, flag artwork and specialist badges. The build no longer generates plain text replacements.
- Original category colors and three skin treatments are retained. Eight Solid composites contain white artwork: only their backgrounds are corrected to dark audio gray/dark amber; the PNGs are unchanged.
- Transport icons, stars, package/encoding/group icons, file-size cues, cloud/cache cues and other emoji rows are restored. A scored title's stars remain relative expression-score information; duplicate Best/Good/OK badges stay disabled.
- Detailed uses the original numbered tier artwork. The WEB tier image identifies the generic WEB family, rather than visually distinguishing WEB-DL from WEBRip; the classification and accessible name retain that distinction.

## Accuracy fixes retained

No 4K REMUX-to-HDR inference; explicit SDR/HLG/DV/HDR distinctions and conflict warnings; structured source/resolution precedence; preferred language/codec/channel association from one usable track; subtitle/audio separation; cache uncertainty; source, pack and health warnings. Compact and Detailed remain paired content presets, independent of skin.

## Verification

64 fixtures across two presets and three skins against official AIOStreams 2.35.9; 189 original PNG byte hashes; a pinned original-art mapping; 48 white-composite/background checks with a minimum modeled contrast of 6.54:1; tier-sync regressions. This contrast figure applies only to those repaired white composites, not all multicolor artwork.

Actual exported artwork and formatter output were inspected in a browser reconstruction of Nuvio TV geometry. Native Nuvio installation, focus/marquee behavior and playback are not established by that preview. Detailed can exceed the visible native badge-row width.

Both templates fit the current default 15,000-character limit: Compact 10,114/9,528; Detailed 13,019/13,127. The tested engine exposes singular `track.tag`; the build does not assume later documentation's plural field is available.

Refresh both the matching formatter and badge pack to replace the text-label release. The stable install URLs are unchanged. Local original backups and prior public Git/gist revisions remain available for recovery.
