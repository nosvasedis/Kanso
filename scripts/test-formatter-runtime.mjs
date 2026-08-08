import assert from "node:assert/strict";
import fs from "node:fs";

const template = fs.readFileSync("formatter-export-name.txt", "utf8").trim();

function topLevelBlocks(input) {
  const blocks = [];
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== "{") continue;
    const start = i;
    let depth = 1;
    while (++i < input.length && depth) {
      if (input[i] === "{") depth++;
      else if (input[i] === "}") depth--;
    }
    if (!depth) blocks.push(input.slice(start, i + 1));
  }
  return blocks;
}

function exists(value) {
  return value !== null && value !== undefined && value !== "" &&
    (!Array.isArray(value) || value.length > 0);
}

function resolveOperand(operand, fixture) {
  const [path, ...mods] = operand.split("::");
  const [scope, key] = path.split(".");
  let value = fixture[scope]?.[key] ?? null;
  for (const rawMod of mods) {
    const mod = rawMod.toLowerCase();
    if (mod === "exists") value = exists(value);
    else if (mod === "length") value = value?.length;
    else if (mod === "istrue") value = value === true;
    else if (mod === "isfalse") value = value === false;
    else if (mod.startsWith("in(") && mod.endsWith(")")) {
      const args = [...rawMod.matchAll(/'([^']*)'/g)].map((m) => m[1].toLowerCase());
      if (!exists(value)) value = false;
      else if (Array.isArray(value)) {
        value = value.some((item) => args.includes(String(item).toLowerCase()));
      } else {
        value = args.includes(String(value).toLowerCase());
      }
    } else if (mod.startsWith(">=")) value = Number(value) >= Number(mod.slice(2));
    else if (mod.startsWith("<=")) value = Number(value) <= Number(mod.slice(2));
    else if (mod.startsWith(">")) value = Number(value) > Number(mod.slice(1));
    else if (mod.startsWith("<")) value = Number(value) < Number(mod.slice(1));
    else if (mod.startsWith("=")) value = exists(value) && String(value).toLowerCase() === mod.slice(1);
    else if (mod.startsWith("~")) {
      if (!exists(value)) value = false;
      else if (Array.isArray(value)) value = value.some((item) => String(item).toLowerCase().includes(mod.slice(1)));
      else value = new RegExp(rawMod.slice(1), "i").test(String(value));
    } else {
      throw new Error(`unsupported conditional modifier ${rawMod} in ${operand}`);
    }
  }
  return value;
}

function evaluateCondition(condition, fixture) {
  const parts = condition.split(/::(and|or|xor)::/);
  let result = resolveOperand(parts[0], fixture);
  for (let i = 1; i < parts.length; i += 2) {
    const next = resolveOperand(parts[i + 1], fixture);
    if (parts[i] === "and") result = result && next;
    else if (parts[i] === "or") result = result || next;
    else result = Boolean(result) !== Boolean(next);
  }
  return result;
}

const fixtures = [
  { name: "debrid-null-filename", stream: { type: "debrid", filename: null, quality: "WEB", releaseGroup: "BlackTV", rseMatched: [], nSeScore: 100, proxied: false } },
  { name: "sparse-debrid", stream: { type: "debrid", filename: null, quality: null, releaseGroup: null, rseMatched: [], nSeScore: 100, proxied: false } },
  { name: "custom-rse", stream: { type: "debrid", filename: null, quality: "WEB", releaseGroup: "ObscureGrp", rseMatched: ["Some Custom Boost Rule"], nSeScore: 80, proxied: false } },
  { name: "prime-pack", stream: { type: "debrid", filename: "Show.S01.2160p.AMZN.WEB-DL.mkv", quality: "WEB", releaseGroup: "ObscureGrp", rseMatched: [], nSeScore: 90, proxied: false } },
];

const conditionalBlocks = topLevelBlocks(template).filter((block) => block.includes('["'));
assert.ok(conditionalBlocks.length > 20, "expected the generated name's conditional gates");

for (const fixture of fixtures) {
  for (const block of conditionalBlocks) {
    const condition = block.slice(1, block.indexOf('["'));
    const result = evaluateCondition(condition, fixture);
    assert.equal(typeof result, "boolean", `${fixture.name}: non-boolean condition ${condition} -> ${String(result)}`);
  }
}

assert.doesNotMatch(template, /stream\.releaseGroup::string::~/, "releaseGroup is already a string; ::string can resolve undefined before a check");
console.log(`Formatter runtime gates: ${conditionalBlocks.length} blocks × ${fixtures.length} fixtures OK`);
