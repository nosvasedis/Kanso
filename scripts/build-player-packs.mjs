/** Kanso Player packs: Detailed artwork per skin, player-text patterns, ids prefixed `kp-`. */
import fs from 'node:fs';
import { PLAYER_PATTERNS } from './player-badge-patterns.mjs';

export const PLAYER_SKINS = ['solid', 'transparent', 'mono', 'outline'];
export const PLAYER_ID_PREFIX = 'kp-';
export const playerPackFile = skin => `kanso-player-${skin}.json`;

export function buildPlayerPack(skin) {
  const source = JSON.parse(fs.readFileSync(`kanso-${skin}-detailed.json`, 'utf8'));
  const missing = [...PLAYER_PATTERNS.keys()].filter(id => !source.filters.some(f => f.id === id));
  if (missing.length) throw new Error(`${skin}: player badges without artwork: ${missing.join(' ')}`);
  // Keep the stream-list order so the player reads like the stream row.
  const filters = source.filters.filter(f => PLAYER_PATTERNS.has(f.id)).map(f => ({
    ...f, id: PLAYER_ID_PREFIX + f.id, groupId: PLAYER_ID_PREFIX + f.groupId, pattern: PLAYER_PATTERNS.get(f.id),
  }));
  const used = new Set(filters.map(f => f.groupId));
  const groups = source.groups.map(g => ({ ...g, id: PLAYER_ID_PREFIX + g.id })).filter(g => used.has(g.id));
  return { filters, groups };
}

if (import.meta.url === `file:///${process.argv[1].replaceAll('\\', '/')}` || process.argv[1]?.endsWith('build-player-packs.mjs')) {
  for (const skin of PLAYER_SKINS) {
    const pack = buildPlayerPack(skin);
    fs.writeFileSync(playerPackFile(skin), JSON.stringify(pack, null, 2) + '\n');
    console.log(`player ${skin}: ${pack.filters.length} badges`);
  }
}
