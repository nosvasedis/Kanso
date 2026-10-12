# Kanso 2.0.2 — cleaner emoji presentation

Both presets preserve the original illustrated badge artwork, language flags, transport emoji and title stars. This update removes the formatter's audio provenance labels and makes the emoji rows more cohesive.

## Presentation changes

- Removed "Audio: file tags", "Audio unverified" and "File channels" from both presets. No replacement confidence-label row is added.
- Cache and provider form one unit: `✅ ☁️ RD`. The addon cue stays with its name: `🧩 Comet` or `🛡️ Comet` for a proxy path, rather than a detached icon and separator.
- Detailed channel values use `🔊 5.1` or `🔊 5.1/2.0`. Known track summaries use `🎧 EN: AAC 2.0`. Missing values and commentary-only track lists do not leave orphaned speaker/headphone glyphs.
- Greek subtitle cues use `💬 ELˢ` for structured information and `💬 ELˢ?` for filename-only hints. Greek audio remains a separate language badge.
- Upscaled files use `🔼`; warnings retain useful text with an emoji cue. Folder size uses `📁` without an extra diagnostic label.

## Preserved artwork and metadata rules

All 189 original PNGs remain byte-identical. Original category colors and three skin treatments remain. Eight white Solid composites keep their original art with the corrected dark audio/dark amber backgrounds introduced in 2.0.1.

Language badges still select one usable preferred track and associate its codec/channels with that track. Multiple preferences select the first matching usable track in file order. File-level fallback codec/channel data remains a summary of the file; removing diagnostic wording does not make it a verified language-to-codec association. Unreliable filename language hints still do not produce confident audio flags. Detailed can list up to four usable tracks.

Other retained fixes include no 4K REMUX-to-HDR inference, explicit SDR/HLG/DV/HDR distinctions, conflict warnings, structured source/resolution precedence, subtitle/audio separation, cache uncertainty, release warnings and health messages. Duplicate Best/Good/OK score badges stay disabled.

## Verification

69 fixtures across two presets and three skins against official AIOStreams 2.35.9; 189 original PNG byte hashes; the pinned original-art mapping; 48 white-composite/background checks; tier-sync regressions. Runtime assertions reject all three removed labels and orphaned emoji rows.

Actual exported artwork and formatter output are previewed in a browser reconstruction of Nuvio TV geometry. Native Nuvio installation, focus/marquee behavior and playback are not established by that preview.

Both templates fit the 15,000-character default limit: Compact 10,114/9,419; Detailed 13,019/13,187. The tested engine exposes singular `track.tag`.

Refresh the matching formatter to receive the cleaner rows. Badge image references and the stable import URLs are preserved. Original local backups and previous public Git/gist revisions remain available for recovery.
