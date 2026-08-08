/**
 * AIOStreams formatter syntax gate — conditional brackets require ["true"||"false"].
 */
import {
  FORMATTER_V2_NAME,
  FORMATTER_VISIBLE_DESCRIPTION,
} from "./formatter-budget.mjs";
import { FORMATTER_V2_INJECT_DESCRIPTION_TAIL } from "./formatter-v2-inject.mjs";
import { FORMATTER_MAX_LENGTH } from "./formatter-layout.mjs";

let failed = 0;

function assert(label, ok) {
  if (!ok) {
    console.log("FAIL", label);
    failed++;
  }
}

const checkRe =
  /\[(?<mod_check>"(?<mod_check_true>[^"]*)"\|\|"(?<mod_check_false>[^"]*)")\]/g;

const badNestedRe =
  /::exists\["\{stream\.[^"]+::(join|replace)\([^"]*\}"\]\}/g;

const falseArm = '||""]';

const fullDescription =
  FORMATTER_VISIBLE_DESCRIPTION + FORMATTER_V2_INJECT_DESCRIPTION_TAIL;

for (const [label, template] of [
  ["name", FORMATTER_V2_NAME],
  ["description", fullDescription],
]) {
  assert(
    `${label}: no resolution::join (resolution is a string)`,
    !template.includes("stream.resolution::join")
  );

  const badNested = [...template.matchAll(badNestedRe)];
  assert(
    `${label}: nested replace/join exists chains use ${falseArm} (${badNested.length} missing)`,
    badNested.length === 0
  );
}

assert(
  "name: tier RG uses ::in membership",
  FORMATTER_V2_NAME.includes("stream.releaseGroup::in(") &&
    FORMATTER_V2_NAME.includes("'FLUX'") &&
    !FORMATTER_V2_NAME.includes("releaseGroup::~^(") &&
    !FORMATTER_V2_NAME.includes("releaseGroup::string::~") &&
    !FORMATTER_V2_NAME.includes("::replace({stream.releaseGroup}")
);
assert(
  "name: tier gates remain under the configured formatter limit",
  FORMATTER_V2_NAME.length < FORMATTER_MAX_LENGTH
);
assert(
  "name: under configured formatter limit (self-hosted MAX_FORMATTER_TEMPLATE_LENGTH)",
  FORMATTER_V2_NAME.length < FORMATTER_MAX_LENGTH
);
assert(
  "description: visual/audio/channel marker-only gates and resolution chain",
  !fullDescription.includes("visualTags::join") &&
    !fullDescription.includes("audioTags::join") &&
    !fullDescription.includes("audioChannels::join") &&
    fullDescription.includes("visualTags::~HLG") &&
    fullDescription.includes("audioTags::~Atmos") &&
    fullDescription.includes("audioChannels::~5.1") &&
    fullDescription.includes('resolution::exists["{stream.resolution::replace')
);

assert(
  "name: tier RSE uses per-rule gates (no join bleed)",
  !FORMATTER_V2_NAME.includes("rseMatched::join") &&
    FORMATTER_V2_NAME.includes("rseMatched::~Web T1")
);
assert(
  "name: unranked tier gates use safe no-RSE check",
  FORMATTER_V2_NAME.includes("rseMatched::length::=0")
);
assert(
  "name: unranked tier source uses parsed quality",
  FORMATTER_V2_NAME.includes("rseMatched::length::=0::and::stream.releaseGroup::exists::and::stream.quality::~WEB")
);
assert(
  "name: tier RG ::in gates + anime guard",
  FORMATTER_V2_NAME.includes("stream.releaseGroup::in(") &&
    FORMATTER_V2_NAME.includes("'FLUX'") &&
    FORMATTER_V2_NAME.includes(
      "stream.quality::~BluRay::and::stream.releaseGroup::in('CtrlHD')"
    ) &&
    FORMATTER_V2_NAME.includes("metadata.isAnime::istrue::isfalse") &&
    FORMATTER_V2_NAME.includes(falseArm)
);

const samples = [
  '{stream.visualTags::exists["{stream.visualTags::join(\'|\')::replace(\'DV\',\'x\')}"||""]}',
  '{stream.resolution::exists["{stream.resolution::replace(\'1080p\',\'x\')}"||""]}',
  '{stream.rseMatched::exists["{stream.rseMatched::join(\' \')::replace(\'Web T1\',\'x\')}"||""]}',
];

for (const s of samples) {
  const m = s.match(checkRe);
  assert(`check regex matches: ${s.slice(0, 50)}…`, Boolean(m));
}

if (failed) {
  console.error(`test-formatter-aiostreams-syntax: ${failed} failure(s)`);
  process.exit(1);
}
console.log("test-formatter-aiostreams-syntax: OK");
