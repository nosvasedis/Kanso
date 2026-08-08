/**
 * Regression tests for metadata fragment guards + DV+DDP standalone visual.
 */
import { applyFilterMeta } from "./badge-filter-meta.mjs";

function re(id) {
  const p = applyFilterMeta({ id, pattern: "" }).pattern;
  const inline = p.startsWith("(?i)");
  return new RegExp(inline ? p.slice(4) : p, inline ? "i" : "");
}

function assert(label, pass) {
  console.log(`${pass ? "OK" : "FAIL"} ${label}`);
  return pass;
}

let ok = true;
const check = (label, pass) => {
  if (!assert(label, pass)) ok = false;
};

const aAtDp = re("a-at-dp");
const aAtTh = re("a-at-th");
const aDv = re("a-dv");
const aDp = re("a-dp");

check("codec-only fragment: DDP Atmos does not match a-at-dp", !aAtDp.test("DDP Atmos"));
check("codec-only fragment: Atmos TrueHD does not match a-at-th", !aAtTh.test("Atmos TrueHD"));

check(
  "contextual metadata: Dolby Vision Atmos DDP matches v-at-dv not a-at-dp",
  !aAtDp.test("Dolby Vision Atmos DDP 5.1") &&
    re("v-at-dv").test("Dolby Vision Atmos DDP 5.1")
);

check(
  "contextual metadata: 2160p WEB-DL Atmos DDP matches a-at-dp",
  aAtDp.test("2160p WEB-DL DDP5.1 Atmos")
);

check(
  "DV+DDP filename shows visual DV + audio DDP",
  aDv.test("Movie.2024.2160p.UHD.BluRay.DV.DDP5.1-GROUP") &&
    aDp.test("Movie.2024.2160p.UHD.BluRay.DV.DDP5.1-GROUP")
);

check(
  "DV+HDR10+ + DDP suppresses standalone a-dv (merge owns DV)",
  !aDv.test("Movie.2024.2160p.HEVC.HDR10+.DV.DDP-GROUP") &&
    aDp.test("Movie.2024.2160p.HEVC.HDR10+.DV.DDP-GROUP")
);

check(
  "DV+Atmos suppresses standalone a-dv (v-at-dv owns headline)",
  !aDv.test("Movie.2024.2160p.UHD.BluRay.DV.Atmos.7.1-GROUP") &&
    re("v-at-dv").test("Movie.2024.2160p.UHD.BluRay.DV.Atmos.7.1-GROUP")
);

const forAllMankindAtmos =
  "For.All.Mankind.S03E07.Bring.It.Down.2160p.ATVP.WEB-DL.DDP.5.1.Atmos.DoVi.HDR.HEVC.RGzs";

const forAllMankindDts =
  "For All Mankind S03E07 Bring It Down 2160p ATVP WEB-DL DTS-HD MA 6 1 DV HDR10Plus H 265";

check(
  "ATV WEB-DL DoVi+Atmos+HDR shows Atmos·DV not DV·HDR",
  re("v-at-dv").test(forAllMankindAtmos) &&
    !re("v-dv-hdr").test(forAllMankindAtmos) &&
    !re("v-dv-hdr10p").test(forAllMankindAtmos)
);

check(
  "DV+Atmos+HDR10+ shows Atmos·DV not DV·HDR10+",
  re("v-at-dv").test(
    "Spider-Noir S01E01 Step Into My Office 2160p AMZN WEB-DL DDP5 1 Atmos DV HDR10Plus H265-Kitsune.mkv"
  ) &&
    !re("v-dv-hdr10p").test(
      "Spider-Noir S01E01 Step Into My Office 2160p AMZN WEB-DL DDP5 1 Atmos DV HDR10Plus H265-Kitsune.mkv"
    )
);

check(
  "ATV WEB-DL DV+HDR10+ space-separated shows DV·HDR10+ on filename alone",
  re("v-dv-hdr10p").test(forAllMankindDts) && !re("a-dv").test(forAllMankindDts)
);

check(
  "DV HDR shorthand fragment alone does not badge (Nuvio visual tag slice)",
  !re("v-dv-hdr").test("DV HDR")
);

check(
  "DV+HDR with release context still shows DV·HDR when no Atmos",
  re("v-dv-hdr").test("2160p WEB-DL Dolby Vision HDR")
);

console.log(ok ? "All metadata/DV edge-case tests passed" : "metadata/DV edge-case failures");
process.exit(ok ? 0 : 1);
