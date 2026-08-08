#!/usr/bin/env node
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { BADGE_GIST_DEFAULTS, parseGistId } from "./gist-config.mjs";

const localFiles = {
  solid: "kanso-solid.json",
  transparent: "kanso-transparent.json",
  mono: "kanso-mono.json",
};
const hash = (text) => crypto.createHash("sha256").update(text).digest("hex");
let drift = 0;

for (const theme of Object.keys(localFiles)) {
  const target = BADGE_GIST_DEFAULTS[theme];
  const id = parseGistId(target.url);
  const response = await fetch(`https://api.github.com/gists/${id}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "nosvasedis-audit" },
  });
  if (!response.ok) throw new Error(`${theme}: GitHub ${response.status}`);
  const gist = await response.json();
  const remoteFile = gist.files[target.filename] ?? Object.values(gist.files)[0];
  let remote = remoteFile.content;
  if (remoteFile.truncated) remote = await (await fetch(remoteFile.raw_url)).text();
  const local = await fs.readFile(localFiles[theme], "utf8");
  const remoteData = JSON.parse(remote);
  const localData = JSON.parse(local);
  const same = hash(remote) === hash(local);
  if (!same) drift++;
  console.log(`${theme}: ${same ? "SYNCED" : "DRIFT"} local=${localData.filters.length} remote=${remoteData.filters.length} markerOnly=${remoteData.filters.filter((f) => f.pattern?.startsWith("(?s)^")).length}/${remoteData.filters.length}`);
}
process.exitCode = drift ? 2 : 0;
