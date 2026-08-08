/**
 * Write production formatter.json (v2 marker inject layout).
 */
import { writeFileSync } from "fs";
import { FORMATTER_MAX_LENGTH } from "./formatter-layout.mjs";
import { MESSAGE_BLOCK } from "./formatter-layout.mjs";
import {
  FORMATTER_V2_LAYOUT,
  FORMATTER_V2_NAME,
  FORMATTER_VISIBLE_DESCRIPTION,
} from "./formatter-budget.mjs";
import { FORMATTER_V2_INJECT_DESCRIPTION_TAIL } from "./formatter-v2-inject.mjs";
import { STREAMING_MARKERS } from "./streaming-formatter-patterns.mjs";

const data = {
  name: FORMATTER_V2_NAME,
  description:
    FORMATTER_VISIBLE_DESCRIPTION + FORMATTER_V2_INJECT_DESCRIPTION_TAIL + MESSAGE_BLOCK,
};

if (data.name.length > FORMATTER_MAX_LENGTH) {
  console.error(
    `formatter.json: name is ${data.name.length} chars (max ${FORMATTER_MAX_LENGTH})`
  );
  process.exit(1);
}
if (data.description.length > FORMATTER_MAX_LENGTH) {
  console.error(
    `formatter.json: description is ${data.description.length} chars (max ${FORMATTER_MAX_LENGTH})`
  );
  process.exit(1);
}
if (FORMATTER_V2_LAYOUT.shardedSegmentIds.length) {
  console.error(
    `formatter.json: ${FORMATTER_V2_LAYOUT.shardedSegmentIds.length} inject segments sharded — cannot ship`
  );
  process.exit(1);
}

writeFileSync("formatter.json", JSON.stringify(data, null, 2) + "\n");
writeFileSync("formatter-export-name.txt", data.name + "\n");
writeFileSync("formatter-export-description.txt", data.description + "\n");

const nameHeadroom = FORMATTER_MAX_LENGTH - data.name.length;
const descHeadroom = FORMATTER_MAX_LENGTH - data.description.length;

console.log(
  `formatter.json: written (name ${data.name.length}, description ${data.description.length})`
);
console.log(
  `formatter.json: headroom name ${nameHeadroom}, description ${descHeadroom} (limit ${FORMATTER_MAX_LENGTH})`
);
console.log(
  data.description.includes(STREAMING_MARKERS["s-nflx"])
    ? "formatter.json: streaming haystack inject present"
    : "formatter.json: streaming haystack inject missing"
);
console.log(
  data.name.includes("nSeScore::pstar")
    ? "formatter.json: title visual pstar rank present"
    : "formatter.json: WARNING title rank missing"
);
console.log(
  data.name.includes("stream.rseMatched::~")
    ? "formatter.json: tier RSE inject present"
    : "formatter.json: WARNING tier RSE inject missing"
);
