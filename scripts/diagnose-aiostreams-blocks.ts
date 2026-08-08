import fs from "node:fs";
import { CustomFormatter } from "../.vendor/AIOStreams/packages/core/src/formatters/custom.ts";

function blocks(input: string) {
  const out: string[] = [];
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== "{") continue;
    const start = i;
    let depth = 1;
    while (++i < input.length && depth) {
      if (input[i] === "{") depth++;
      else if (input[i] === "}") depth--;
    }
    if (!depth) out.push(input.slice(start, i + 1));
  }
  return out;
}

const stream: any = {
  filename: "Show.S01.2160p.AMZN.WEB-DL.DDP5.1.Atmos.DV.HDR10Plus-FLUX.mkv",
  type: "debrid", streamExpressionScore: 80, rankedStreamExpressionsMatched: [],
  parsedFile: { quality: "WEB", resolution: "2160p", releaseGroup: "FLUX", visualTags: ["DV", "HDR10+"], audioTags: ["Atmos", "DD+"], audioChannels: ["5.1"], languages: ["English"], network: "Amazon" },
  addon: { name: "Comet" }, service: { id: "realdebrid", cached: true }, proxied: false,
};
const template = fs.readFileSync("formatter-export-description.txt", "utf8").trimEnd();
let failures = 0;
for (const [index, block] of blocks(template).entries()) {
  const formatter = new CustomFormatter("", block, { userData: {}, maxSeScore: 100 } as any);
  const output = (await formatter.format(stream)).description;
  if (/\{(?:cannot_|unknown_|unable_)/.test(output)) {
    failures++;
    console.log(`BLOCK ${index}: ${block.slice(0, 500)}\nOUTPUT: ${output}\n`);
  }
}
console.log(`diagnose-aiostreams-blocks: ${failures} failing blocks`);
