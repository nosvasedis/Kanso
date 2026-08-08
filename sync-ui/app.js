const $ = (id) => document.getElementById(id);

let lastResult = null;
let lastGistPush = null;
let badgesPath = "";
let formatterPath = "";

function isStrict() {
  return $("strict-sync")?.checked === true;
}

async function api(path, opts = {}) {
  let res;
  try {
    res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      throw new Error(
        "Sync helper not reachable — start it with npm run sync (http://127.0.0.1:3847), then retry."
      );
    }
    throw err;
  }
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Sync helper returned non-JSON (${res.status}). Is npm run sync running on port 3847?`
    );
  }
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function setStatus(text, kind = "") {
  const el = $("sync-status");
  el.textContent = text;
  el.className = `status${kind ? ` ${kind}` : ""}`;
}

function renderSummary(result, applied) {
  const box = $("sync-summary");
  box.classList.remove("hidden", "no-changes");

  if (!result.anyChanged) {
    box.classList.add("no-changes");
    const mode = result.strict ? "strict" : "add-only";
    box.innerHTML = `
      <strong>Already up to date</strong> (${mode}).
      No changes needed for your tier badges.
    `;
    return;
  }

  const verb = applied ? "Updated" : "Would update";
  const addPart =
    result.totalAdded > 0
      ? `<strong>+${result.totalAdded}</strong> group(s) added`
      : "";
  const remPart =
    result.strict && result.totalRemoved > 0
      ? `<strong>−${result.totalRemoved}</strong> group(s) removed`
      : "";
  const counts = [addPart, remPart].filter(Boolean).join(", ");

  box.innerHTML = `
    <strong>${verb} ${result.tiersTouched} tier badge(s)</strong> — ${counts}.
    ${result.strict ? "<br>Strict sync was on (matched Vidhin per tier)." : "<br>Add-only mode (default)."}
    ${
      applied
        ? result.formatterRegenerated
          ? "<br>Saved to the v1 tier snapshot and <strong>formatter.json regenerated</strong> — badge JSONs are unchanged, so no gist push is needed."
          : `<br>Saved to the v1 tier snapshot, but formatter.json regeneration ${result.formatterOutput ? `failed: ${escapeHtml(result.formatterOutput)}` : "did not run"}.`
        : "<br>Click <strong>Apply sync</strong> to save."
    }
  `;
}

function renderTierTable(tierResults, strict) {
  const wrap = $("tier-table-wrap");
  const rows = tierResults
    .map((r) => {
      const added =
        r.added?.length > 0
          ? r.added.map((g) => `<span class="tag added">${escapeHtml(g)}</span>`).join("")
          : "—";
      const removed =
        strict && r.removed?.length > 0
          ? r.removed.map((g) => `<span class="tag removed">${escapeHtml(g)}</span>`).join("")
          : "—";
      const skip = r.skipped
        ? `<br><em>${escapeHtml(r.skipReason ?? "Skipped")}</em>`
        : "";
      const err = r.error ? `<br><em>${escapeHtml(r.error)}</em>` : "";
      return `<tr>
        <td>${escapeHtml(r.name || r.badgeId)}</td>
        <td>${r.changed ? "✓" : "—"}</td>
        <td>${r.added?.length ?? 0}</td>
        <td>${strict ? (r.removed?.length ?? 0) : "—"}</td>
        <td>${added}${err}${skip}</td>
        <td>${strict ? removed : "—"}</td>
      </tr>`;
    })
    .join("");

  wrap.innerHTML = `<table class="tier-table">
    <thead><tr><th>Badge</th><th>Δ</th><th>+</th>${strict ? "<th>−</th>" : ""}<th>Added names</th>${strict ? "<th>Removed names</th>" : ""}</tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildChecklist(config, applied, result, gistPush = null) {
  const gist = config.gistUrl?.trim();
  const items = [];

  if (!applied) {
    items.push({
      html: `<strong>Apply sync first</strong> — preview does not change your files.`,
      done: false,
    });
  } else {
    items.push({
      html: `<strong>Done on this PC</strong> — tier release groups saved to the v1 snapshot (<code>backup/v1/oracle/nosvasedis-badges-solid.json</code>)${result?.formatterRegenerated ? " and <strong>formatter.json regenerated</strong>" : ""}.`,
      done: true,
    });
    if (result?.formatterOutput && !result?.formatterRegenerated) {
      items.push({
        html: `⚠️ formatter.json regeneration failed: ${escapeHtml(result.formatterOutput)}`,
        done: false,
      });
    }
  }

  items.push({
    html: `Update the formatter in <strong>AIOStreams</strong>: replace the custom formatter <strong>name</strong> and <strong>description</strong> with the new <code>formatter.json</code> content (or re-import your synced formatter URL).`,
    done: false,
  });

  items.push({
    html: `Your <strong>badge JSON files are unchanged</strong> by a tier sync (their patterns are marker-based) — no need to re-import badges or push badge gists. Use <strong>Push to Gist now</strong> only after a badge patch.`,
    done: false,
  });

  items.push({
    html: `Open <strong>Nuvio</strong> (or your <strong>AIOStreams</strong> addon settings where badges are configured).`,
    done: false,
  });

  if (gist) {
    items.push({
      html: `Badge gists (${escapeHtml(config.gistFilename || "kanso-solid.json")} etc.) are untouched by this sync.`,
      done: false,
    });
  }

  if (config.nuvioNotes) {
    items.push({
      html: `<em>Your note:</em> ${escapeHtml(config.nuvioNotes)}`,
      done: false,
    });
  }

  return items;
}

function showAfterSteps(config, applied, result, gistPush = lastGistPush) {
  const section = $("step-after");
  section.classList.remove("hidden");
  const list = $("checklist");
  list.innerHTML = buildChecklist(config, applied, result, gistPush)
    .map((item) => `<li class="${item.done ? "done" : ""}">${item.html}</li>`)
    .join("");
}

async function pushGistNow() {
  const btn = $("btn-push-gist");
  if (btn) btn.disabled = true;
  try {
    const { results } = await api("/api/push-gist", { method: "POST", body: "{}" });
    lastGistPush = results;
    const updated = results.filter((r) => r.ok);
    const skipped = results.filter((r) => r.skipped);
    if (updated.length) {
      setStatus(
        `Gist updated: ${updated.map((r) => r.theme).join(", ")} (${updated.length}/3).`,
        "ok"
      );
      const config = await loadConfigFromServer();
      showAfterSteps(config, true, lastResult, results);
    } else if (skipped.some((r) => r.reason === "no_token")) {
      setStatus("Add GITHUB_TOKEN to .env (see .env.example), then try again.", "warn");
    } else {
      setStatus("Could not push gists — check URLs in preferences.", "warn");
    }
    await refreshGistStatus();
    return results;
  } catch (err) {
    setStatus(`Gist push failed: ${err.message}`, "warn");
    throw err;
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function refreshGistStatus() {
  const el = $("gist-status");
  if (!el) return;
  try {
    const data = await api("/api/gist-status");
    if (data.canPush) {
      el.textContent =
        "Auto-push ready — solid, transparent, and mono gists update after each patch.";
      el.className = "gist-status ready";
    } else if (data.hasToken) {
      const configured = data.themes?.filter((t) => t.gistId).length ?? 0;
      el.textContent = `${configured}/3 gist URLs configured.`;
      el.className = "gist-status";
    } else if (data.themes?.some((t) => t.gistId)) {
      el.textContent = "Gist URLs saved — add GITHUB_TOKEN to .env to enable auto-push.";
      el.className = "gist-status missing";
    } else {
      el.textContent = "Paste your Gist URLs below to enable auto-push.";
      el.className = "gist-status missing";
    }
  } catch {
    el.textContent = "";
  }
}

async function runSync(dryRun) {
  const strict = isStrict();
  const btnPreview = $("btn-preview");
  const btnApply = $("btn-apply");
  btnPreview.disabled = true;
  btnApply.disabled = true;
  setStatus(
    dryRun
      ? strict
        ? "Preview (strict): checking Vidhin…"
        : "Preview (add-only): checking Vidhin…"
      : "Downloading Vidhin and applying…",
    "busy"
  );

  try {
    const path = dryRun ? "/api/preview" : "/api/sync";
    const { result } = await api(path, {
      method: "POST",
      body: JSON.stringify({ dryRun, strict }),
    });
    const config = await loadConfigFromServer();

    lastResult = result;
    renderSummary(result, !dryRun);
    renderTierTable(result.tierResults, strict);
    $("tier-details").open = result.anyChanged;

    if (!dryRun) {
      const parts = [];
      if (result.totalAdded > 0) parts.push(`${result.totalAdded} added`);
      if (result.strict && result.totalRemoved > 0) parts.push(`${result.totalRemoved} removed`);
      let statusMsg = result.anyChanged
        ? `Sync complete — ${parts.join(", ")}.`
        : "Sync complete — no changes.";
      if (result.formatterRegenerated) {
        statusMsg += " formatter.json regenerated.";
      } else if (result.formatterOutput) {
        statusMsg += " formatter.json regeneration failed — see Step 2.";
      }
      statusMsg += " Badge JSONs unchanged (no gist push). See Step 2 below.";
      setStatus(statusMsg, result.formatterRegenerated || !result.anyChanged ? "ok" : "warn");
      showAfterSteps(config, true, result, null);
      await refreshGistStatus();
    } else {
      const parts = [];
      if (result.totalAdded > 0) parts.push(`${result.totalAdded} would be added`);
      if (result.strict && result.totalRemoved > 0) {
        parts.push(`${result.totalRemoved} would be removed`);
      }
      setStatus(
        result.anyChanged
          ? `Preview ready — ${parts.join("; ")}.`
          : `Preview — up to date (${strict ? "strict" : "add-only"}).`,
        result.anyChanged ? "warn" : "ok"
      );
      showAfterSteps(config, false, result);
    }
  } catch (err) {
    setStatus(`Error: ${err.message}`, "warn");
  } finally {
    btnPreview.disabled = false;
    btnApply.disabled = false;
  }
}

async function loadConfigFromServer() {
  return api("/api/config");
}

async function init() {
  try {
    const status = await api("/api/status");
    badgesPath = status.badgesPath;
    formatterPath = status.formatterJsonPath ?? "";
    $("gist-url").value = status.config?.gistUrl ?? "";
    $("gist-filename").value =
      status.config?.gistFilename ?? "kanso-solid.json";
    $("nuvio-notes").value = status.config?.nuvioNotes ?? "";
    await refreshGistStatus();
    if (!status.badgesExists) {
      setStatus("Warning: kanso-solid.json not found in project folder.", "warn");
    }
  } catch (err) {
    setStatus(`Could not reach server: ${err.message}`, "warn");
  }

  $("btn-preview").addEventListener("click", () => runSync(true));
  $("btn-apply").addEventListener("click", () => {
    const strict = isStrict();
    let msg =
      "Apply sync?\n\nThis updates the tier release-group lists in backup/v1/oracle/nosvasedis-badges-solid.json on your computer and regenerates formatter.json (the AIOStreams formatter name + description). You will still need to paste the new formatter into AIOStreams (see Step 2).";
    if (strict && lastResult?.totalRemoved > 0) {
      msg += `\n\nSTRICT: ${lastResult.totalRemoved} release group(s) will be REMOVED. Preview first if you have not.`;
    } else if (strict) {
      msg += "\n\nStrict mode is on (add + remove to match Vidhin).";
    }
    if (!confirm(msg)) return;
    runSync(false);
  });

  $("btn-save-config").addEventListener("click", async () => {
    try {
      await api("/api/config", {
        method: "POST",
        body: JSON.stringify({
          gistUrl: $("gist-url").value,
          gistFilename: $("gist-filename").value,
          nuvioNotes: $("nuvio-notes").value,
        }),
      });
      setStatus("Preferences saved.", "ok");
      await refreshGistStatus();
    } catch (err) {
      setStatus(`Could not save: ${err.message}`, "warn");
    }
  });

  $("btn-push-gist")?.addEventListener("click", () => {
    pushGistNow().catch(() => {});
  });

  $("btn-copy-path").addEventListener("click", async () => {
    await navigator.clipboard.writeText(formatterPath || badgesPath);
    setStatus("Copied formatter.json path to clipboard.", "ok");
  });

  $("btn-copy-json").addEventListener("click", async () => {
    try {
      const { name, description } = await api("/api/formatter-json");
      await navigator.clipboard.writeText(
        `NAME:\n${name}\n\nDESCRIPTION:\n${description}`
      );
      setStatus("Copied formatter name + description — paste into AIOStreams.", "ok");
    } catch (err) {
      setStatus(`Copy failed: ${err.message}`, "warn");
    }
  });

  $("btn-open-folder").addEventListener("click", async () => {
    try {
      await api("/api/reveal", { method: "POST", body: "{}" });
      setStatus("Opened File Explorer with formatter.json selected.", "ok");
    } catch {
      if (formatterPath) await navigator.clipboard.writeText(formatterPath);
      setStatus("Copied formatter.json path — paste into Explorer address bar.", "ok");
    }
  });
}

init();
