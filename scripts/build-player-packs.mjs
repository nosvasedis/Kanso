/**
 * Kanso Player packs: Detailed artwork per skin, ids prefixed `kp-`.
 * Nuvio TV 1.1.0-beta.9+ matches the player pack in two phases: decoder text
 * first, then the filename and stream.name for groups the decoder left empty.
 * Decoder groups use player-text patterns (anchored to decoder text); the groups
 * the decoder cannot know keep the stream-list marker patterns, which the
 * formatter places in stream.name.
 */
import fs from 'node:fs';
import { PLAYER_PATTERNS } from './player-badge-patterns.mjs';

export const PLAYER_SKINS = ['solid', 'transparent', 'mono', 'outline'];
export const PLAYER_ID_PREFIX = 'kp-';
export const playerPackFile = skin => `kanso-${skin}-player.json`;
/** Specials, streaming origin, tiers, source and subtitles: read from stream.name. */
export const NAME_GROUPS = new Set(['gst', 'gs', 'gms', 'grl', 'gsub']);

export function buildPlayerPack(skin) {
  const source = JSON.parse(fs.readFileSync(`kanso-${skin}-detailed.json`, 'utf8'));
  const missing = [...PLAYER_PATTERNS.keys()].filter(id => !source.filters.some(f => f.id === id));
  if (missing.length) throw new Error(`${skin}: player badges without artwork: ${missing.join(' ')}`);
  const overlap = source.filters.filter(f => PLAYER_PATTERNS.has(f.id) && NAME_GROUPS.has(f.groupId)).map(f => f.id);
  if (overlap.length) throw new Error(`${skin}: decoder badges inside name groups: ${overlap.join(' ')}`);
  // Keep the stream-list order so the player reads like the stream row.
  const filters = source.filters.filter(f => PLAYER_PATTERNS.has(f.id) || NAME_GROUPS.has(f.groupId)).map(f => ({
    ...f, id: PLAYER_ID_PREFIX + f.id, groupId: PLAYER_ID_PREFIX + f.groupId, pattern: PLAYER_PATTERNS.get(f.id) ?? f.pattern,
  }));
  const used = new Set(filters.map(f => f.groupId));
  const groups = source.groups.map(g => ({ ...g, id: PLAYER_ID_PREFIX + g.id })).filter(g => used.has(g.id));
  return { filters, groups };
}

if (process.argv[1]?.endsWith('build-player-packs.mjs')) {
  for (const skin of PLAYER_SKINS) {
    const pack = buildPlayerPack(skin);
    fs.writeFileSync(playerPackFile(skin), JSON.stringify(pack, null, 2) + '\n');
    console.log(`player ${skin}: ${pack.filters.length} badges`);
  }
}
