(function (root) {
  "use strict";
  const storageKey = "forgekeys.showroom.design.v1";
  const layouts = { "60": "60%", "60iso": "60% ISO", "65": "65%", "75": "75%", "75knob": "75% + Knob", "80": "TKL / 80%", "100": "Full size / 100%" };
  const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
  const choice = (value, values, fallback) => values.includes(value) ? value : fallback;
  const colour = (value, fallback = "#eeeeee") => /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
  const setId = (value) => typeof value === "string" && /^FK-KC-\d{3}$/.test(value);

  function normalize(raw, availableIds) {
    if (!isObject(raw) || raw.v !== 1 || !Object.hasOwn(layouts, raw.layout) || !setId(raw.set)) return null;
    if (availableIds && !availableIds.includes(raw.set)) return null;
    if (!isObject(raw.mix) || Object.keys(raw.mix).length > 130) return null;
    const mix = {};
    for (const [key, source] of Object.entries(raw.mix).sort()) {
      if (!/^(KC_[A-Z0-9_]{1,16}|MO\([0-9]\))$/.test(key) || !setId(source)) return null;
      if (availableIds && !availableIds.includes(source)) return null;
      if (source !== raw.set) mix[key] = source;
    }
    const shell = isObject(raw.case) ? raw.case : {};
    return {
      v: 1, set: raw.set, layout: raw.layout,
      scene: { color: colour(raw.scene?.color, "#b7d0c4"), auto: raw.scene?.auto === true },
      case: {
        primaryColor: colour(shell.primaryColor),
        secondaryColor: colour(shell.secondaryColor),
        style: choice(shell.style, ["CASE_1", "CASE_2"], "CASE_2"),
        material: choice(shell.material, ["matte", "brushed", "glossy"], "brushed"),
        autoColor: shell.autoColor === true
      },
      mix,
      mode: choice(raw.mode, ["set", "original"], "set"),
      switchPreset: choice(raw.switchPreset, ["crystal-linear", "ice-tactile", "jade-click"], "crystal-linear"),
      keycapMaterial: choice(raw.keycapMaterial, ["solid", "clear", "frosted"], "solid"),
      switchLighting: choice(raw.switchLighting, ["off", "on"], "off"),
      keycapDisplay: choice(raw.keycapDisplay, ["seated", "lifted", "hidden"], "seated")
    };
  }

  function encode(design) {
    const normalized = normalize(design);
    if (!normalized) throw new Error("This design could not be saved.");
    return btoa(JSON.stringify(normalized)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  }

  function decode(token, availableIds) {
    if (typeof token !== "string" || token.length > 8192 || !/^[\w-]+$/.test(token)) return null;
    try { return normalize(JSON.parse(atob(token.replaceAll("-", "+").replaceAll("_", "/"))), availableIds); }
    catch { return null; }
  }

  function read(storage, availableIds) {
    try { return decode(storage.getItem(storageKey), availableIds); }
    catch { return null; }
  }

  function save(storage, design) {
    try { storage.setItem(storageKey, encode(design)); return true; }
    catch { return false; }
  }

  function link(pageUrl, design) {
    const url = new URL(pageUrl);
    url.search = "";
    url.hash = `design=${encode(design)}`;
    return url.href;
  }

  function writeHandoff(storage, design, preview, label) {
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(preview) || preview.length > 1500000) {
      throw new Error("The preview is too large. Please try again.");
    }
    const previous = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!/^fk-design-[\da-f-]{36}$/.test(key || "")) continue;
      try { previous.push({ key, time: JSON.parse(storage.getItem(key)).createdAt || 0 }); }
      catch { previous.push({ key, time: 0 }); }
    }
    // Keep one previous handoff for Back navigation without filling tab storage.
    previous.sort((a, b) => b.time - a.time).forEach((item, index) => {
      if (index > 0 || Date.now() - item.time > 86400000) storage.removeItem(item.key);
    });
    const id = `fk-design-${root.crypto.randomUUID()}`;
    storage.setItem(id, JSON.stringify({ design: normalize(design), preview, label, createdAt: Date.now() }));
    return id;
  }

  function readHandoff(storage, id) {
    if (!/^fk-design-[\da-f-]{36}$/.test(id || "")) return null;
    try {
      const raw = JSON.parse(storage.getItem(id));
      const design = normalize(raw?.design);
      if (!design || !Number.isFinite(raw.createdAt) || Date.now() - raw.createdAt > 86400000) {
        storage.removeItem(id);
        return null;
      }
      if (typeof raw.preview !== "string" || raw.preview.length > 1500000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(raw.preview)) return null;
      return { design, preview: raw.preview, label: String(raw.label || design.set).slice(0, 100) };
    } catch { return null; }
  }

  const api = { normalize, encode, decode, read, save, link, writeHandoff, readHandoff, storageKey, layouts };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ForgeKeysDesign = api;
})(typeof window === "undefined" ? globalThis : window);
