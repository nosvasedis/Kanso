# Kanso 2.1.2 — preferred language in the formatter; retired badges deleted

Language is represented once: in the emoji formatter. Compact uses a native Unicode flag, such as `🎧 🇬🇧`; Detailed adds channels, such as `🎧 🇬🇧 5.1`, with the selected codec in its original image badge. The separate image flag badges are removed.

In 2.1.2, consecutive tracks sharing a language use one flag: `🎧 🇬🇧 7.1 · DD 5.1` beside the TrueHD/Atmos image. The selected codec, matching alternates and canonical/raw aliases are omitted from text when the image already owns them. Different alternate formats stay visible. A language change gets a new flag, including a return to a previously shown language. Track order, codec selection and the four-track limit remain unchanged. Spoken audio is above subtitles; the subtitle cue is the bottom visible row, after provider messages.

The title's invisible U+200E anchor fixes Nuvio TV 1.0.0's first-strong-character alignment: hidden RLM markers no longer choose the title's side. Existing marker identities and all visible icons/stars are preserved. HDR and DTS hierarchy corrections remove redundant generic format badges; structured file audio cannot borrow unrelated filename codecs. Repeated addon/indexer identities are collapsed. Optional groups and compact replacements keep both templates within the engine limit without truncation.

The generic release warning is replaced by `🚩` followed by the actual matched rule name, omitting Radarr/Sonarr prefixes. The existing Bad-rule trigger now ignores case. It reports the rule name without inferring a playback defect. Recording warnings spell out Telesync/Telecine/Screener with recording emoji; HDR/SDR conflicts and upscaling remain explicit. NZB health messages preserve status and full details without redundant speech-bubble decoration. Unknown provider messages retain their original content.

## Actual deletion

Deleted all 37 retired definitions from the active inventory and artwork mapping: 21 language/MULTI badges, four channel badges, nine Best/Good/OK badges and three Unranked tier badges. They are removed from all published packs rather than disabled. Empty groups are removed. Entries unused by Compact are omitted there, while their useful Detailed counterparts remain available.

Compact has 52 active badges; Detailed has 93, including six WEBRip tier variants. The 87 retained canonical definitions preserve their original illustrated artwork. All 136 currently referenced PNGs retain their original bytes. Historical backups and Git/gist revisions support recovery.

## Language behavior and Tamtaro

The current official Tamtaro Complete SEL Setup v3.2.9 (2026-10-05) was inspected. It populates AIOStreams preferred/required language fields with chosen languages, optional passthroughs and fallback values. Kanso reads that resolved engine context. No Tamtaro SEL, sort order, ranking rule or live profile setting is changed.

With track metadata, commentary tracks are excluded. Compact uses the first matching usable track in file order; the retained codec badge corresponds to that track. Detailed lists up to four matching preferred tracks with consecutive language groups, channels and nonduplicate alternate codecs; unrelated languages are excluded. With no preferences, the first usable tracks can be shown. This is a preference-membership rule; it does not reorder track arrays by preference priority.

`Original` resolves to the media language when AIOStreams provides it. Unresolved Original/Multi/Dubbed/Unknown values do not become native language assertions. Without track metadata, only probe/indexer language data produces a language row, selecting the first available preferred language in the engine’s preference order. It does not attach global codec/channel tags to a particular language. Filename-only language hints remain quiet. Greek subtitles use the separate `💬 ELˢ` cue and do not assert Greek audio.

The formatter-owned diagnostic labels removed in 2.0.2 stay absent. Emoji cache/provider/addon rows, transport icons, stars and original artwork for remaining categories are preserved. Other accuracy fixes, source warnings and health messages remain.

## Verification and upgrade

194 real-engine fixtures × two presets × three skins; retired-ID absence, no disabled entries/empty groups, native preferred-language assertions, Tamtaro-style Original/required-language cases, Swedish outside the old image inventory, all 136 retained PNG hashes and tier-sync regressions. Templates fit the default 15,000-character budget: Compact 7,461/7,993; Detailed 14,993/14,978. Engine validation uses official AIOStreams 2.35.9.

Refresh the formatter and replace the old imported Kanso badge pack with the matching new pack. Updating a remote JSON does not automatically delete old entries retained by a merge in the client. Keep Kanso as your custom formatter during Tamtaro template updates.

All 52 Compact/93 Detailed filters have positive structured-metadata coverage. Java compiled all 435 native pack regexes, matched 1,164 cases and verified 388 LTR titles; removing the anchor reproduced 63 RTL titles. The direction logic was inspected in Nuvio TV 1.0.0, commit `9f17e8bf4abc799dc8c832d2894a8b3b166e4353`. This is native Character/Pattern validation, not TV UI/playback validation. Disable Nuvio's own file-size badges to avoid repeating Kanso's size row; the app enables them by default and the pack cannot change that setting.

Preview screenshots reconstruct Nuvio TV geometry in a browser; native Nuvio rendering/playback and the user's live Tamtaro profile were not verified. Native Unicode flag appearance depends on the client font.
