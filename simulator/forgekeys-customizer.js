(function () {
  if (!window.FORGEKEYS_RENDER_HEALTH_LOADING) {
    window.FORGEKEYS_RENDER_HEALTH_LOADING = true;
    const customizerSource = new URL(document.currentScript.src);
    const healthSource = new URL("./render-health.js", customizerSource);
    healthSource.search = customizerSource.search;
    const healthScript = document.createElement("script");
    healthScript.src = healthSource.href;
    document.head.appendChild(healthScript);
  }

  if (!window.FORGEKEYS_ANALYTICS_LOADING) {
    window.FORGEKEYS_ANALYTICS_LOADING = true;
    const customizerSource = new URL(document.currentScript.src);
    const analyticsSource = new URL("../site-analytics.js", customizerSource);
    analyticsSource.search = customizerSource.search;
    const analyticsScript = document.createElement("script");
    analyticsScript.src = analyticsSource.href;
    analyticsScript.addEventListener("load", () => {
      window.ForgeKeysAnalytics?.track("designer_open", { source: "3d-designer" });
    });
    document.head.appendChild(analyticsScript);
  }

  const trackDesignerEvent = (name, metadata = {}) => {
    window.ForgeKeysAnalytics?.track(name, { source: "3d-designer", ...metadata });
  };

  if (window.FORGEKEYS_CUSTOMIZER_INITIALIZED) return;
  window.FORGEKEYS_CUSTOMIZER_INITIALIZED = true;

  const keyOptions = [
    ["KC_ESC", "Esc"],
    ["KC_F1", "F1"],
    ["KC_F2", "F2"],
    ["KC_F3", "F3"],
    ["KC_F4", "F4"],
    ["KC_F5", "F5"],
    ["KC_F6", "F6"],
    ["KC_F7", "F7"],
    ["KC_F8", "F8"],
    ["KC_F9", "F9"],
    ["KC_F10", "F10"],
    ["KC_F11", "F11"],
    ["KC_F12", "F12"],
    ["KC_1", "1"],
    ["KC_2", "2"],
    ["KC_3", "3"],
    ["KC_4", "4"],
    ["KC_5", "5"],
    ["KC_6", "6"],
    ["KC_7", "7"],
    ["KC_8", "8"],
    ["KC_9", "9"],
    ["KC_0", "0"],
    ["KC_MINS", "Minus"],
    ["KC_EQL", "Equals"],
    ["KC_BSPC", "Backspace"],
    ["KC_TAB", "Tab"],
    ["KC_Q", "Q"],
    ["KC_W", "W"],
    ["KC_E", "E"],
    ["KC_R", "R"],
    ["KC_T", "T"],
    ["KC_Y", "Y"],
    ["KC_U", "U"],
    ["KC_I", "I"],
    ["KC_O", "O"],
    ["KC_P", "P"],
    ["KC_CAPS", "Caps"],
    ["KC_A", "A"],
    ["KC_S", "S"],
    ["KC_D", "D"],
    ["KC_F", "F"],
    ["KC_G", "G"],
    ["KC_H", "H"],
    ["KC_J", "J"],
    ["KC_K", "K"],
    ["KC_L", "L"],
    ["KC_ENT", "Enter"],
    ["KC_LSFT", "Left Shift"],
    ["KC_Z", "Z"],
    ["KC_X", "X"],
    ["KC_C", "C"],
    ["KC_V", "V"],
    ["KC_B", "B"],
    ["KC_N", "N"],
    ["KC_M", "M"],
    ["KC_RSFT", "Right Shift"],
    ["KC_SPC", "Spacebar"],
    ["KC_LCTL", "Left Ctrl"],
    ["KC_LALT", "Left Alt"],
    ["KC_LGUI", "Left Win"],
    ["KC_RALT", "Right Alt"],
    ["KC_RGUI", "Right Win"],
    ["KC_RCTL", "Right Ctrl"],
    ["KC_LEFT", "Left Arrow"],
    ["KC_DOWN", "Down Arrow"],
    ["KC_RGHT", "Right Arrow"],
    ["KC_UP", "Up Arrow"],
    ["KC_DEL", "Delete"],
    ["KC_PGUP", "Page Up"],
    ["KC_PGDN", "Page Down"],
    ["KC_INS", "Insert"],
    ["KC_HOME", "Home"],
    ["KC_END", "End"],
    ["KC_P0", "Numpad 0"],
    ["KC_PENT", "Numpad Enter"],
    ["KC_NO", "Knob / blank key"],
  ];

  const state = {
    baseImage: null,
    baseFile: null,
    baseAsset: null,
    baseMode: "spacebar",
    accents: [],
    selectedAccent: null,
    placements: {},
    bounds: { width: 16, height: 6 },
    keepLegends: false,
    artworkType: "photo",
    stylePreset: "feature",
    baseOpacity: 0.82,
    showroomTheme: null,
    showroomKeyMap: null,
    showroomPalette: null,
    showroomAtlasImage: null,
    showroomAtlasKeys: null,
    showroomDesignData: null,
    showroomMixOverrides: {},
    showroomMixHistory: [],
    showroomMixMode: false,
    showroomMixSelectedKey: "KC_ESC",
    showroomDiagnostics: { applied: [], missing: [], mismatched: [] },
    showroomMode: "set",
    showroomView: "3d",
    switchPreset: "crystal-linear",
    keycapMaterial: "solid",
    switchLighting: "off",
    keycapDisplay: "seated",
  };

  const config = window.FORGEKEYS_CONFIG || {};
  const maxUploadBytes = config.maxUploadBytes || 5 * 1024 * 1024;
  const acceptedMimeTypes = config.acceptedMimeTypes || ["image/jpeg", "image/png", "image/webp"];
  const protectedSubmissionEnabled = config.submissionMode === "endpoint";
  const maxAccentFiles = 2;
  let submissionSucceeded = false;
  const pageParams = new URLSearchParams(window.location.search);
  const isEmbedMode = pageParams.get("embed") === "1";
  const isShowroomMode = pageParams.get("mode") === "showroom";
  if (isEmbedMode) {
    document.body.classList.add("fk-embed-mode");
  }
  if (isShowroomMode) {
    document.body.classList.add("fk-showroom-mode");
    document.documentElement.classList.add("fk-showroom-document");
  }

  const publishShowroomFrameState = () => {
    if (!isShowroomMode || window.parent === window) return;
    window.requestAnimationFrame(() => {
      const targetOrigin = window.location.origin === "null" ? "*" : window.location.origin;
      window.parent.postMessage({
        type: "forgekeys-showroom-state",
        ready: document.body.classList.contains("fk-showroom-ready"),
        height: Math.ceil(document.documentElement.scrollHeight),
      }, targetOrigin);
    });
  };

  const installShowroomFrameBridge = () => {
    if (!isShowroomMode || window.FORGEKEYS_SHOWROOM_FRAME_BRIDGE) return;
    window.FORGEKEYS_SHOWROOM_FRAME_BRIDGE = true;
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(publishShowroomFrameState);
      observer.observe(document.body);
      window.FORGEKEYS_SHOWROOM_FRAME_OBSERVER = observer;
    }
    window.addEventListener("message", (event) => {
      if (event.source !== window.parent || event.data?.type !== "forgekeys-showroom-state-request") return;
      publishShowroomFrameState();
    });
  };

  const boundsMap = {
    "60": { width: 15, height: 5 },
    "65": { width: 16, height: 5 },
    "75": { width: 16, height: 6 },
    "80": { width: 18, height: 6 },
    "96": { width: 19, height: 6 },
    "100": { width: 22.5, height: 6 },
  };

  const sampleVersion = "bloomtop1";
  const sampleUrl = (fileName) => `../assets/customizer-samples/${fileName}?v=${sampleVersion}`;
  const showroomCatalogUrl = new URL(`../assets/keycap-products/catalog.json?v=${sampleVersion}`, window.location.href);
  let showroomSets = [];
  let activeShowroomSet = null;
  const showroomDesignCache = new Map();
  const showroomDesignRequests = new Map();
  const showroomAtlasRequests = new Map();
  let showroomPanelBuilding = false;
  let showroomMaterialSettleTimer = 0;
  let mixCompatibilityRequest = 0;
  let mixApplyRequest = 0;
  let mixCanvasWired = false;
  let mixCanvasWireAttempts = 0;
  let mixPointerStart = null;
  let mixSelectionOutline = null;

  const sampleArtworks = [
    {
      label: "Luxe line",
      url: sampleUrl("feature-spacebar-luxe-line.svg"),
      type: "illustration",
      preset: "feature",
      opacity: 0.94,
      isSvg: true,
      description: "Homepage-style large-key direction",
    },
    {
      label: "Porcelain",
      url: sampleUrl("porcelain-butterfly.svg"),
      type: "illustration",
      preset: "feature",
      opacity: 0.88,
      isSvg: true,
      description: "Soft butterfly artwork direction",
    },
    {
      label: "Brass mark",
      url: sampleUrl("accent-ribbon.svg"),
      type: "logo",
      preset: "accent",
      opacity: 0.94,
      isSvg: true,
      description: "Minimal brass accent-key direction",
    },
  ];

  const resolveCatalogAsset = (relativeUrl) => {
    if (!relativeUrl) return null;
    const assetUrl = new URL(relativeUrl, showroomCatalogUrl);
    if (assetUrl.origin === window.location.origin) assetUrl.searchParams.set("v", sampleVersion);
    return assetUrl.href;
  };
  const escapeMarkup = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  const loadShowroomCatalog = async () => {
    const response = await fetch(showroomCatalogUrl.href);
    if (!response.ok) throw new Error("The keycap product catalog could not be loaded.");
    const catalog = await response.json();
    if (catalog.schemaVersion !== "1.0" || !Array.isArray(catalog.products) || !catalog.products.length) {
      throw new Error("The keycap product catalog is empty or invalid.");
    }
    return catalog.products.filter((product) => product.preview?.threeD).map((product) => {
      const threeD = product.preview?.threeD || null;
      return {
        id: product.id,
        slug: product.slug,
        label: product.name,
        description: product.description,
        studio: product.studio,
        commercialStatus: product.commercialStatus,
        productThumbnailUrl: resolveCatalogAsset(product.product?.thumbnail || product.product?.image),
        availability: product.product?.availability || "Enquire for availability",
        priceAud: product.product?.priceAud,
        purchaseUrl: product.product?.purchaseUrl || null,
        profile: product.preview?.profile || "Profile to be confirmed",
        layouts: product.preview?.layouts || "Compatibility to be confirmed",
        finish: product.preview?.finish || "Finish to be confirmed",
        preferredLayout: product.preview?.preferredLayout || null,
        hasThreeD: Boolean(threeD),
        threeDMode: threeD?.mode || null,
        previewAccuracy: threeD?.accuracy || null,
        renderLegends: threeD?.renderLegends !== false,
        url: resolveCatalogAsset(threeD?.artwork),
        opacity: threeD?.opacity || 0.96,
        transparent: Boolean(threeD?.transparent),
        theme: threeD?.theme || null,
        surfacePreset: threeD?.surface || null,
        lightingPreset: threeD?.lighting || null,
        viewPreset: threeD?.viewPreset || null,
        designDataUrl: resolveCatalogAsset(threeD?.designData),
        keyArtManifestUrl: resolveCatalogAsset(threeD?.keyArtManifest),
      };
    });
  };

  const fitCover = (imageW, imageH, boxW, boxH) => {
    const scale = Math.max(boxW / imageW, boxH / imageH);
    const width = boxW / scale;
    const height = boxH / scale;
    return {
      sx: (imageW - width) / 2,
      sy: (imageH - height) / 2,
      sw: width,
      sh: height,
    };
  };

  const drawCover = (ctx, image, dx, dy, dw, dh, opacity) => {
    if (!image || !image.complete || !image.naturalWidth) return;
    const crop = fitCover(image.naturalWidth, image.naturalHeight, dw, dh);
    ctx.save();
    ctx.globalAlpha = opacity == null ? 1 : opacity;
    ctx.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, dx, dy, dw, dh);
    ctx.restore();
  };

  const drawBaseArtwork = (ctx, canvas, opts) => {
    if (!state.baseImage || !state.baseImage.complete || !state.baseImage.naturalWidth) return;
    if (state.baseMode === "none") return;
    const isAlpha = /^KC_[A-Z]$/.test(opts.code);
    const isMod = !isAlpha;
    if (state.baseMode === "alphas" && !isAlpha) return;
    if (state.baseMode === "mods" && !isMod) return;
    if (state.baseMode === "spacebar" && opts.code !== "KC_SPC") return;

    if (state.baseMode === "spacebar") {
      drawCover(ctx, state.baseImage, 0, 0, canvas.width, canvas.height, state.baseOpacity);
      if (state.stylePreset === "soft" || state.stylePreset === "feature") {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = state.stylePreset === "feature" ? 0.2 : 0.14;
        ctx.fillStyle = "#f7f2ea";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      return;
    }

    const boardW = state.bounds.width * 128;
    const boardH = state.bounds.height * 128;
    const crop = fitCover(state.baseImage.naturalWidth, state.baseImage.naturalHeight, boardW, boardH);
    const x = (opts.x || 0) * 128;
    const y = (opts.y || 0) * 128;
    const w = (opts.w || 1) * 128;
    const h = (opts.h || 1) * 128;
    const sx = crop.sx + (x / boardW) * crop.sw;
    const sy = crop.sy + (y / boardH) * crop.sh;
    const sw = (w / boardW) * crop.sw;
    const sh = (h / boardH) * crop.sh;

    ctx.save();
    ctx.globalAlpha = state.baseOpacity;
    ctx.drawImage(state.baseImage, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    if (state.stylePreset === "soft" || state.stylePreset === "feature") {
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = state.stylePreset === "feature" ? 0.2 : 0.14;
      ctx.fillStyle = "#f7f2ea";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (state.stylePreset === "desk") {
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#315f7d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
  };

  const drawShowroomThemeBase = (ctx, canvas, opts) => {
    if (!state.showroomTheme) return;
    const code = opts.code || "";
    const isAlpha = /^KC_[A-Z]$/.test(code);
    const isFunction = /^KC_F\d+$/.test(code) || code === "KC_ESC" || code === "KC_GESC";
    const isNumber = /^KC_[0-9]$/.test(code) || ["KC_MINS", "KC_EQL", "KC_GRV"].includes(code);
    if (state.showroomTheme === "cat-whiskers") {
      const charcoal = new Set(["KC_F5", "KC_F6", "KC_F7", "KC_F8", "KC_TAB", "KC_CAPS", "KC_LSFT", "KC_RSFT", "KC_LCTL", "KC_RCTL", "KC_LALT", "KC_RALT", "KC_LGUI", "KC_RGUI", "KC_APP", "MO(1)", "KC_DEL", "KC_END", "KC_PGUP", "KC_PGDN", "KC_INS", "KC_HOME", "KC_P0"]);
      const sage = new Set(["KC_NO", "KC_ENT", "KC_LEFT", "KC_DOWN", "KC_RGHT", "KC_UP", "KC_PPLS", "KC_PENT", "KC_PDOT"]);
      const ginger = new Set(["KC_ESC"]);
      let colour = "#f1e6d0";
      if (isFunction) colour = charcoal.has(code) ? "#252525" : "#f1e6d0";
      if (isNumber && [2, 5, 8].includes(Number(code.replace("KC_", "")))) colour = "#252525";
      if (charcoal.has(code)) colour = "#252525";
      if (sage.has(code)) colour = "#8c9a84";
      if (ginger.has(code)) colour = "#c88745";
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (colour === "#252525") {
        gradient.addColorStop(0, "#45433d");
        gradient.addColorStop(1, "#171717");
      } else if (colour === "#8c9a84") {
        gradient.addColorStop(0, "#b8c5ae");
        gradient.addColorStop(1, "#68766e");
      } else if (colour === "#c88745") {
        gradient.addColorStop(0, "#e2ad6d");
        gradient.addColorStop(1, "#a25b2c");
      } else {
        gradient.addColorStop(0, "#fff9ed");
        gradient.addColorStop(1, "#dcccb3");
      }
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const ink = colour === "#252525" ? "#f7e8c7" : "#403a33";
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const motifSize = Math.min(canvas.width, canvas.height);
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.88;
      if (["KC_ESC", "KC_CAPS", "KC_ENT", "KC_PENT"].includes(code)) {
        ctx.beginPath();
        ctx.moveTo(cx - motifSize * 0.22, cy + motifSize * 0.2);
        ctx.lineTo(cx - motifSize * 0.26, cy - motifSize * 0.08);
        ctx.lineTo(cx - motifSize * 0.13, cy - motifSize * 0.2);
        ctx.lineTo(cx - motifSize * 0.02, cy - motifSize * 0.1);
        ctx.lineTo(cx + motifSize * 0.02, cy - motifSize * 0.1);
        ctx.lineTo(cx + motifSize * 0.13, cy - motifSize * 0.2);
        ctx.lineTo(cx + motifSize * 0.26, cy - motifSize * 0.08);
        ctx.lineTo(cx + motifSize * 0.22, cy + motifSize * 0.2);
        ctx.quadraticCurveTo(cx, cy + motifSize * 0.34, cx - motifSize * 0.22, cy + motifSize * 0.2);
        ctx.fill();
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.arc(cx - motifSize * 0.08, cy + motifSize * 0.02, Math.max(1.5, motifSize * 0.025), 0, Math.PI * 2);
        ctx.arc(cx + motifSize * 0.08, cy + motifSize * 0.02, Math.max(1.5, motifSize * 0.025), 0, Math.PI * 2);
        ctx.fill();
      } else if (code === "KC_SPC") {
        ctx.beginPath();
        ctx.arc(cx - motifSize * 0.12, cy + motifSize * 0.03, motifSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - motifSize * 0.26, cy - motifSize * 0.03);
        ctx.lineTo(cx - motifSize * 0.2, cy - motifSize * 0.23);
        ctx.lineTo(cx - motifSize * 0.08, cy - motifSize * 0.1);
        ctx.lineTo(cx + motifSize * 0.1, cy - motifSize * 0.03);
        ctx.quadraticCurveTo(cx + motifSize * 0.2, cy + motifSize * 0.12, cx + motifSize * 0.28, cy + motifSize * 0.15);
        ctx.strokeStyle = ink;
        ctx.lineWidth = Math.max(2, motifSize * 0.035);
        ctx.stroke();
        ctx.fillStyle = "#d8bf79";
        [[0.18, -0.16], [0.33, 0.02], [0.42, -0.2]].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(canvas.width * x, canvas.height * (0.5 + y), Math.max(1.5, motifSize * 0.018), 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (["KC_NO", "KC_LEFT", "KC_DOWN", "KC_RGHT", "KC_UP", "KC_PPLS", "KC_PENT"].includes(code)) {
        ctx.beginPath();
        ctx.arc(cx, cy + motifSize * 0.08, motifSize * 0.11, 0, Math.PI * 2);
        ctx.arc(cx - motifSize * 0.13, cy - motifSize * 0.06, motifSize * 0.055, 0, Math.PI * 2);
        ctx.arc(cx, cy - motifSize * 0.12, motifSize * 0.055, 0, Math.PI * 2);
        ctx.arc(cx + motifSize * 0.13, cy - motifSize * 0.06, motifSize * 0.055, 0, Math.PI * 2);
        ctx.fill();
      } else if (code === "MO(1)") {
        ctx.font = `600 ${Math.max(13, motifSize * 0.22)}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Fn", cx, cy);
      } else if (["KC_F5", "KC_F6", "KC_F7", "KC_F8"].includes(code)) {
        ctx.beginPath();
        for (let point = 0; point < 10; point += 1) {
          const radius = point % 2 ? motifSize * 0.09 : motifSize * 0.2;
          const angle = -Math.PI / 2 + point * Math.PI / 5;
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          if (point === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      return;
    }
    if (state.showroomTheme === "midnight-butterfly") {
      const darkFunctions = new Set(["KC_F5", "KC_F6", "KC_F7", "KC_F8"]);
      const darkKeys = new Set(["KC_ESC", "KC_CAPS", "KC_RSFT", "KC_SPC", "KC_END", "KC_PMNS", "KC_P0", "KC_PENT"]);
      const lilacKeys = new Set(["KC_TAB", "KC_ENT", "KC_LSFT", "KC_LCTL", "KC_RCTL", "KC_LEFT", "KC_DOWN", "KC_RGHT", "KC_UP", "KC_DEL", "KC_PGUP", "KC_PGDN"]);
      const lilacAlphas = new Set(["KC_Z", "KC_X", "KC_C", "KC_V", "KC_B", "KC_N", "KC_M"]);
      let colour = "#f4eee5";
      if (isFunction) colour = darkFunctions.has(code) ? "#26222d" : "#d8c9e7";
      if (isNumber) {
        const number = Number(code.replace("KC_", ""));
        if ([2, 5, 8].includes(number)) colour = "#29252f";
        else if ([3, 6, 9].includes(number)) colour = "#d7c8e7";
      }
      if (lilacAlphas.has(code) || lilacKeys.has(code)) colour = "#d7c8e7";
      if (darkKeys.has(code)) colour = "#28242f";
      if (["KC_LALT", "KC_RALT", "KC_LGUI", "KC_RGUI", "KC_APP", "KC_INS", "KC_HOME"].includes(code)) colour = "#eee8e1";
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (colour === "#28242f" || colour === "#29252f" || colour === "#26222d") {
        gradient.addColorStop(0, "#403947");
        gradient.addColorStop(1, "#17151c");
      } else if (colour === "#d7c8e7" || colour === "#d8c9e7") {
        gradient.addColorStop(0, "#eee5f5");
        gradient.addColorStop(1, "#b7a0ce");
      } else {
        gradient.addColorStop(0, "#fffaf2");
        gradient.addColorStop(1, "#e2d9cf");
      }
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      return;
    }
    if (state.showroomTheme !== "crimson-bloom") return;
    const porcelainFunctions = new Set(["KC_F5", "KC_F6", "KC_F7", "KC_F8"]);
    const porcelainMods = new Set(["KC_TAB", "KC_CAPS", "KC_LSFT", "KC_LEFT", "KC_DOWN", "KC_RGHT", "KC_UP"]);
    const artworkMods = new Set(["KC_ENT", "KC_RSFT", "KC_BSPC", "KC_LCTL", "KC_RCTL"]);
    let colour = "#f6eee5";
    if (isFunction || isNumber) colour = "#ae1d31";
    if (porcelainFunctions.has(code) || porcelainMods.has(code) || isAlpha || code === "KC_SPC") colour = "#f6eee5";
    if (artworkMods.has(code)) colour = "#d7b3aa";
    if (["KC_LALT", "KC_RALT", "KC_LGUI", "KC_RGUI", "KC_APP", "KC_DEL", "KC_PGUP", "KC_PGDN", "KC_HOME", "KC_END"].includes(code)) colour = "#a91b2f";
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, colour === "#f6eee5" ? "#fffaf3" : colour);
    gradient.addColorStop(1, colour === "#f6eee5" ? "#e8ddd2" : "#6f1422");
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  };

  const drawButterflyMark = (ctx, canvas, colour) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const wingW = canvas.width * 0.27;
    const wingH = canvas.height * 0.3;
    ctx.save();
    ctx.fillStyle = colour;
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy);
    ctx.bezierCurveTo(cx - wingW * 0.45, cy - wingH, cx - wingW, cy - wingH * 0.82, cx - wingW, cy - wingH * 0.18);
    ctx.bezierCurveTo(cx - wingW, cy + wingH * 0.55, cx - wingW * 0.35, cy + wingH * 0.62, cx - 2, cy);
    ctx.moveTo(cx + 2, cy);
    ctx.bezierCurveTo(cx + wingW * 0.45, cy - wingH, cx + wingW, cy - wingH * 0.82, cx + wingW, cy - wingH * 0.18);
    ctx.bezierCurveTo(cx + wingW, cy + wingH * 0.55, cx + wingW * 0.35, cy + wingH * 0.62, cx + 2, cy);
    ctx.fill();
    ctx.globalAlpha = 0.95;
    ctx.fillRect(cx - 2, cy - wingH * 0.48, 4, wingH * 0.95);
    ctx.restore();
  };

  const drawChainMark = (ctx, canvas, colour) => {
    const y = canvas.height * 0.58;
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(2, canvas.height * 0.026);
    ctx.globalAlpha = 0.68;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.06, y + canvas.height * 0.08);
    ctx.bezierCurveTo(canvas.width * 0.28, y - canvas.height * 0.14, canvas.width * 0.7, y + canvas.height * 0.14, canvas.width * 0.94, y - canvas.height * 0.08);
    ctx.stroke();
    const links = Math.max(3, Math.round(canvas.width / Math.max(canvas.height * 0.5, 18)));
    for (let index = 0; index < links; index += 1) {
      const x = canvas.width * (0.1 + (index / Math.max(1, links - 1)) * 0.8);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2.5, canvas.height * 0.045), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawBowMark = (ctx, canvas, colour) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.save();
    ctx.fillStyle = colour;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy);
    ctx.bezierCurveTo(cx - canvas.width * 0.28, cy - canvas.height * 0.3, cx - canvas.width * 0.34, cy + canvas.height * 0.28, cx - 3, cy + 3);
    ctx.moveTo(cx + 3, cy);
    ctx.bezierCurveTo(cx + canvas.width * 0.28, cy - canvas.height * 0.3, cx + canvas.width * 0.34, cy + canvas.height * 0.28, cx + 3, cy + 3);
    ctx.fill();
    ctx.fillRect(cx - 4, cy - 4, 8, 8);
    ctx.restore();
  };

  const drawPlaidMark = (ctx, canvas, colour) => {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.globalAlpha = 0.26;
    ctx.lineWidth = Math.max(2, canvas.height * 0.025);
    const spacing = Math.max(14, canvas.height * 0.2);
    for (let x = spacing; x < canvas.width; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = spacing; y < canvas.height; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    ctx.restore();
  };

  const drawSparkMark = (ctx, canvas, colour) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const outer = Math.min(canvas.width, canvas.height) * 0.28;
    const inner = outer * 0.2;
    ctx.save();
    ctx.fillStyle = colour;
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    for (let point = 0; point < 8; point += 1) {
      const angle = -Math.PI / 2 + (Math.PI / 4) * point;
      const radius = point % 2 === 0 ? outer : inner;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (point === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawCageMark = (ctx, canvas, colour) => {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.globalAlpha = 0.66;
    ctx.lineWidth = Math.max(2, canvas.width * 0.025);
    const left = canvas.width * 0.25;
    const right = canvas.width * 0.75;
    const top = canvas.height * 0.2;
    const bottom = canvas.height * 0.82;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, top + canvas.width * 0.25, canvas.width * 0.25, Math.PI, Math.PI * 2);
    ctx.moveTo(left, top + canvas.width * 0.25); ctx.lineTo(left, bottom);
    ctx.moveTo(right, top + canvas.width * 0.25); ctx.lineTo(right, bottom);
    for (let x = left + (right - left) / 4; x < right; x += (right - left) / 4) {
      ctx.moveTo(x, top + canvas.width * 0.13); ctx.lineTo(x, bottom);
    }
    ctx.stroke();
    ctx.restore();
  };

  const keyUnitMatches = (candidate, opts) => {
    const units = candidate?.units;
    if (!units || !Number.isFinite(opts?.w) || !Number.isFinite(opts?.h)) return false;
    return Math.abs(Number(units.width) - Number(opts.w)) < 0.08
      && Math.abs(Number(units.height || 1) - Number(opts.h || 1)) < 0.08;
  };

  const showroomKeyCodeFor = (code, opts, keyMap = state.showroomKeyMap) => {
    // Numpad identity must come from the simulator's physical key code or an
    // explicit set override. Coordinate-based guesses caused main-row keys
    // and numpad keys to borrow each other's artwork.
    const explicitCode = opts?.showroomKeyCode || opts?.artworkCode || opts?.numpadCode;
    return explicitCode && keyMap?.[explicitCode] ? explicitCode : code;
  };

  const showroomKeySpecFor = (key, designData = state.showroomDesignData) => {
    if (state.showroomMode !== "set" || !designData?.keyMap) return null;
    const code = typeof key === "string" ? key : key?.name;
    return code ? designData.keyMap[code] || null : null;
  };

  const showroomSetForId = (id) => showroomSets.find((set) => set.id === id) || null;

  const showroomDataForSet = (set) => {
    if (!set) return null;
    return showroomDesignCache.get(set.id)
      || (set.id === activeShowroomSet?.id ? state.showroomDesignData : null);
  };

  const showroomSourceForKey = (code, opts = null) => {
    const overrideSet = showroomSetForId(state.showroomMixOverrides?.[code]);
    const fallbackSet = activeShowroomSet;
    const fallbackData = showroomDataForSet(fallbackSet);
    if (!overrideSet) return { set: fallbackSet, data: fallbackData };
    const overrideData = showroomDataForSet(overrideSet);
    const overrideKeyMap = overrideData?.keyMap || {};
    const atlasCode = showroomKeyCodeFor(code, opts, overrideKeyMap);
    const mappedKey = overrideKeyMap[code] || overrideKeyMap[atlasCode];
    if (!mappedKey) return { set: fallbackSet, data: fallbackData };
    if (opts && overrideData?.atlasKeys) {
      const artworkCode = mappedKey.artworkCode || mappedKey.artworkId || atlasCode;
      const source = overrideData.atlasKeys[artworkCode];
      const candidates = source ? [source, ...(Array.isArray(source.variants) ? source.variants : [])] : [];
      if (!candidates.some((candidate) => keyUnitMatches(candidate, opts))) {
        return { set: fallbackSet, data: fallbackData };
      }
    }
    return { set: overrideSet, data: overrideData };
  };

  const showroomUsesPerKeyMaterials = () => state.showroomMode === "set"
    && Object.values(state.showroomMixOverrides || {}).some(Boolean)
      || state.showroomMode === "set"
        && Object.values(state.showroomKeyMap || {}).some((key) => key?.material && key.material !== "solid");

  const showroomMaterialModeFor = (key, designData = state.showroomDesignData) => {
    const perKeyMaterial = showroomKeySpecFor(key, designData)?.material;
    // Solid is the set's normal mode: it allows a catalogue to opt individual
    // keys into clear/frosted material while Clear/Frosted remain useful as
    // quick whole-board previews.
    return state.keycapMaterial === "solid" ? (perKeyMaterial || "solid") : state.keycapMaterial;
  };

  const keyUnitSignature = (unitsOrOpts) => {
    const width = Number(unitsOrOpts?.width ?? unitsOrOpts?.w);
    const height = Number(unitsOrOpts?.height ?? unitsOrOpts?.h ?? 1);
    return `${width.toFixed(2)}x${height.toFixed(2)}`;
  };

  const showroomPhysicalKeyIdFor = (code, opts) => {
    const x = Number(opts?.x || 0).toFixed(2);
    const y = Number(opts?.y || 0).toFixed(2);
    return `${showroomKeyCodeFor(code, opts)}@${keyUnitSignature(opts)}@${x},${y}`;
  };

  const resetShowroomDiagnostics = () => {
    state.showroomDiagnostics = { applied: [], missing: [], mismatched: [] };
  };

  const recordShowroomDiagnostic = (type, code, opts, detail = {}) => {
    const list = state.showroomDiagnostics?.[type];
    if (!list) return;
    if (isShowroomMode) {
      const liveKey = keyMeshesFromGroup(keyGroupFromScene()).find((key) => key.name === code);
      const liveUnits = physicalKeyDimensionsFor(liveKey);
      if (!liveKey || !liveUnits || !keyUnitMatches({ units: liveUnits }, opts)) return;
    }
    const entry = {
      id: showroomPhysicalKeyIdFor(code, opts),
      code,
      units: { width: opts?.w, height: opts?.h },
      ...detail,
    };
    if (!list.some((item) => item.id === entry.id)) list.push(entry);
  };

  const publishShowroomDiagnostics = () => {
    const diagnostics = state.showroomDiagnostics || { applied: [], missing: [], mismatched: [] };
    const gapCount = diagnostics.missing.length + diagnostics.mismatched.length;
    document.documentElement.dataset.fkShowroomArtworkStatus = gapCount ? "needs-review" : "ready";
    document.documentElement.dataset.fkShowroomArtworkGaps = String(gapCount);
    document.documentElement.dataset.fkShowroomArtworkGapDetails = JSON.stringify({
      missing: diagnostics.missing.map(({ code, units, artworkCode }) => ({ code, units, artworkCode })),
      mismatched: diagnostics.mismatched.map(({ code, units, artworkCode, availableUnits }) => ({
        code,
        units,
        artworkCode,
        availableUnits,
      })),
    });
    window.ForgeKeysShowroomDiagnostics = JSON.parse(JSON.stringify(diagnostics));
  };

  const showroomArtworkMatchFor = (code, opts, key, designData = state.showroomDesignData) => {
    const atlasKeys = designData?.atlasKeys || {};
    const keyMap = designData?.keyMap || {};
    const atlasCode = showroomKeyCodeFor(code, opts, keyMap);
    const mappedKey = keyMap[code] || keyMap[atlasCode] || key;
    const artworkCode = mappedKey?.artworkCode || mappedKey?.artworkId || atlasCode;
    const source = atlasKeys[artworkCode];
    if (!source) {
      recordShowroomDiagnostic("missing", code, opts, { artworkCode });
      return null;
    }
    const candidates = [source, ...(Array.isArray(source.variants) ? source.variants : [])];
    const atlasKey = candidates.find((candidate) => keyUnitMatches(candidate, opts));
    if (!atlasKey) {
      recordShowroomDiagnostic("mismatched", code, opts, {
        artworkCode,
        availableUnits: candidates.map((candidate) => candidate.units).filter(Boolean),
      });
      return null;
    }
    recordShowroomDiagnostic("applied", code, opts, { artworkCode });
    return { atlasCode, artworkCode, key: mappedKey, atlasKey, palette: designData?.palette || null };
  };

  const drawShowroomArtwork = (ctx, image, source, canvas, style) => {
    if (!source || !canvas.width || !canvas.height) return false;
    const sourceRatio = source.width / source.height;
    const targetRatio = canvas.width / canvas.height;
    if (!Number.isFinite(sourceRatio) || !Number.isFinite(targetRatio)) return false;

    // The manifest owns the complete print face. The physical top canvas can
    // differ from the nominal U ratio; never silently trim its edge legends.

    if (style?.background) {
      ctx.fillStyle = style.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(image, source.x, source.y, source.width, source.height, 0, 0, canvas.width, canvas.height);
    return true;
  };

  const drawShowroomKeyDesign = (ctx, canvas, opts, match = null, designData = state.showroomDesignData) => {
    if (state.showroomMode !== "set" || !designData?.keyMap) return false;
    if (!match) return false;
    const key = match.key || {};
    const palette = designData.palette || state.showroomPalette || {};
    const style = palette[key?.style || "porcelain"] || palette.porcelain;
    if (!style) return false;
    const atlasKey = match.atlasKey;
    const atlasImage = designData.atlasImage;
    if (atlasKey && atlasImage?.complete && atlasImage.naturalWidth) {
      drawShowroomArtwork(
        ctx,
        atlasImage,
        atlasKey,
        canvas,
        style
      );
      opts.color = style.legend;
      opts.background = style.background;
      return true;
    }
    return false;
  };

  const drawAccent = (ctx, canvas, opts) => {
    const placement = state.placements[opts.code];
    if (!placement || !placement.image || !placement.image.complete) return;
    const scale = placement.scale / 100;
    const max = Math.min(canvas.width, canvas.height);
    let w = max * scale;
    let h = max * scale;
    if (placement.mode === "full") {
      drawCover(ctx, placement.image, 0, 0, canvas.width, canvas.height, 0.95);
      return;
    }
    if (placement.mode === "spacebar") {
      w = canvas.width * scale;
      h = canvas.height * 0.72 * scale;
    }
    const x = (canvas.width - w) / 2 + (placement.x / 100) * canvas.width;
    const y = (canvas.height - h) / 2 + (placement.y / 100) * canvas.height;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((placement.rotation * Math.PI) / 180);
    ctx.drawImage(placement.image, -w / 2, -h / 2, w, h);
    ctx.restore();
  };

  const readOriginalLayoutLabel = () => {
    const tabsRoot = document.querySelector("#sidebar .react-tabs");
    if (!tabsRoot) return "";
    const labels = ["75% with Knob", "60% ISO", "Full size", "Full Size", "TKL", "96%", "80%", "75%", "65%", "60%"];
    const visibleLeafText = [...tabsRoot.querySelectorAll("*")]
      .filter((element) => {
        if (element.children.length) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((element) => element.textContent.trim())
      .filter(Boolean);
    return labels.find((label) => visibleLeafText.some((text) => text.includes(label))) || "";
  };

  const syncBoundsFromOriginalLayout = () => {
    const label = readOriginalLayoutLabel();
    const key = (() => {
      if (/full/i.test(label)) return "100";
      if (/96/.test(label)) return "96";
      if (/80|tkl/i.test(label)) return "80";
      if (/75/.test(label)) return "75";
      if (/65/.test(label)) return "65";
      if (/60/.test(label)) return "60";
      return "75";
    })();
    state.bounds = boundsMap[key] || boundsMap["75"];
    return label || "Original simulator layout";
  };

  const refreshTextures = () => {
    scheduleDesignSave();
    resetShowroomDiagnostics();
    syncBoundsFromOriginalLayout();
    document.dispatchEvent(new CustomEvent("force_key_material_update"));
    window.setTimeout(publishShowroomDiagnostics, 0);
    schedule75KnobSync(180);
    if (isShowroomMode) scheduleSwitchPresentation(180);
  };

  const scheduleShowroomMaterialSettle = () => {
    if (!isShowroomMode) return;
    scheduleSwitchPresentation(140);
    window.clearTimeout(showroomMaterialSettleTimer);
    showroomMaterialSettleTimer = window.setTimeout(() => scheduleSwitchPresentation(0), 620);
  };

  window.ForgeKeysKeycapTextures = {
    state,
    draw(ctx, canvas, opts) {
      const source = isShowroomMode && state.showroomMode === "set"
        ? showroomSourceForKey(opts.code, opts)
        : { set: null, data: null };
      const showroomSetActive = Boolean(isShowroomMode && state.showroomMode === "set" && source.data?.keyMap);
      const showroomKey = showroomSetActive
        ? (source.data.keyMap?.[showroomKeyCodeFor(opts.code, opts, source.data.keyMap)] || source.data.keyMap?.[opts.code])
        : null;
      const showroomMatch = showroomSetActive
        ? showroomArtworkMatchFor(opts.code, opts, showroomKey, source.data)
        : null;
      const usedPerKeyDesign = drawShowroomKeyDesign(ctx, canvas, opts, showroomMatch, source.data);
      if (!usedPerKeyDesign && !showroomSetActive) {
        drawShowroomThemeBase(ctx, canvas, opts);
        drawBaseArtwork(ctx, canvas, opts);
      }
      drawAccent(ctx, canvas, opts);
      if (usedPerKeyDesign && showroomMatch?.key) {
        const palette = showroomMatch.palette || state.showroomPalette || {};
        const style = palette[showroomMatch.key.style || "porcelain"] || palette.porcelain;
        if (style?.legend) opts.color = style.legend;
      }
      if (usedPerKeyDesign || (!showroomSetActive && !state.keepLegends)) {
        opts.legend = "";
        opts.sub = "";
        // The simulator falls back to its Cherry legend when legend is blank.
        // Each key texture owns a fresh canvas context, so suppressing text on
        // this context removes both primary and secondary simulator legends.
        ctx.fillText = () => {};
      }
      // The legacy simulator assigns its generated canvas textures after this
      // draw hook returns. Reapply the showroom materials once the last key in
      // that batch has settled so the late texture assignment cannot restore
      // Lambert face materials over the PBT profile.
      scheduleShowroomMaterialSettle();
    },
    refresh: refreshTextures,
  };

  const safeFileName = (name) =>
    (name || "upload")
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^\.+|\.+$/g, "")
      .replace(/^-|-$/g, "")
      .slice(0, 90) || "upload";

  const normalizeEmail = (email) => email.trim().toLowerCase();

  const emailLooksValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);

  const emailDomainCorrections = {
    "gmail.con": "gmail.com",
    "gmai.com": "gmail.com",
    "gmial.com": "gmail.com",
    "gnail.com": "gmail.com",
    "hotmail.con": "hotmail.com",
    "hotmial.com": "hotmail.com",
    "outlook.con": "outlook.com",
    "icloud.con": "icloud.com",
    "yahoo.con": "yahoo.com",
    "qq.con": "qq.com",
    "163.con": "163.com",
  };

  const emailCorrection = (email) => {
    const [local, domain] = normalizeEmail(email).split("@");
    if (!local || !domain) return "";
    return emailDomainCorrections[domain] ? `${local}@${emailDomainCorrections[domain]}` : "";
  };

  const uploadLimitLabel = `${Math.round(maxUploadBytes / 1024 / 1024)} MB`;

  const validateImageFile = (file) => {
    if (!file || !acceptedMimeTypes.includes(file.type)) {
      throw new Error("Please upload a JPG, PNG, or WebP image.");
    }
    if (file.size > maxUploadBytes) {
      throw new Error(`${file.name} is over ${uploadLimitLabel}. Please choose a smaller image before adding it.`);
    }
  };

  const validateImageFiles = (files) => {
    if (!files.length) {
      throw new Error("Please choose at least one image.");
    }
    files.forEach(validateImageFile);
  };

  const loadImageFile = (file) =>
    new Promise((resolve, reject) => {
      try {
        validateImageFile(file);
      } catch (error) {
        reject(error);
        return;
      }
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => resolve({ image, url, name: file.name, size: file.size, type: file.type, file });
      image.onerror = () => reject(new Error("Could not read image."));
      image.src = url;
    });

  const makeFileFromBlob = (blob, name) => {
    try {
      return new File([blob], name, { type: blob.type || "image/jpeg" });
    } catch (error) {
      blob.name = name;
      return blob;
    }
  };

  const rasterizeSvgSample = (blob, name, preserveAlpha = false) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(blob);
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || 1800;
        canvas.height = image.naturalHeight || 900;
        const ctx = canvas.getContext("2d");
        if (!preserveAlpha) {
          ctx.fillStyle = "#f6f2ea";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          (outputBlob) => {
            if (!outputBlob) {
              reject(new Error("Could not prepare sample artwork."));
              return;
            }
            const extension = preserveAlpha ? "png" : "jpg";
            const fileName = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${extension}`;
            resolve(loadImageFile(makeFileFromBlob(outputBlob, fileName)));
          },
          preserveAlpha ? "image/png" : "image/jpeg",
          preserveAlpha ? undefined : 0.9
        );
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read sample artwork."));
      };
      image.src = url;
    });

  const samplePathIsSvg = (sample, blob) => {
    if (sample.isSvg || blob?.type === "image/svg+xml") return true;
    try {
      return new URL(sample.url, window.location.href).pathname.toLowerCase().endsWith(".svg");
    } catch (error) {
      return String(sample.url || "").toLowerCase().includes(".svg");
    }
  };

  const loadSampleViaImage = (sample) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth || 1800;
          canvas.height = image.naturalHeight || 900;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#f6f2ea";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Could not prepare sample artwork."));
                return;
              }
              const fileName = `${sample.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`;
              resolve(loadImageFile(makeFileFromBlob(blob, fileName)));
            },
            "image/jpeg",
            0.9
          );
        } catch (error) {
          reject(new Error("Could not prepare sample artwork. Open the designer through the website or local server, then try again."));
        }
      };
      image.onerror = () => reject(new Error("Could not load sample artwork."));
      image.src = sample.url;
    });

  const loadSampleArtwork = async (sample) => {
    try {
      const response = await fetch(sample.url);
      if (!response.ok) throw new Error("Could not load sample artwork.");
      const blob = await response.blob();
      if (samplePathIsSvg(sample, blob)) {
        return rasterizeSvgSample(blob, sample.label, Boolean(sample.transparent));
      }
      const extension = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const file = makeFileFromBlob(blob, `${sample.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${extension}`);
      return loadImageFile(file);
    } catch (error) {
      return loadSampleViaImage(sample);
    }
  };

  const loadImageUrl = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not load the per-key artwork atlas."));
      image.src = url;
    });

  const setStatus = (message, tone = "info") => {
    const status = document.querySelector("[data-fk-status]");
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
  };

  const setGuide = (message) => {
    const guide = document.querySelector("[data-fk-guide]");
    if (guide) guide.textContent = message;
  };

  const presetCopy = {
    feature: "Best first preview: make the large keys feel like a finished custom set.",
    accent: "Best for logos and icons: use a few hero keys.",
    soft: "Best for patterns and photos: subtle colour and texture.",
    desk: "Best for desk photos: match colours without cutting the photo apart.",
    full: "Advanced only: all-over print can look busy on small keys.",
  };

  const clearAutoPlacements = () => {
    Object.keys(state.placements).forEach((code) => {
      if (state.placements[code]?.auto) {
        delete state.placements[code];
      }
    });
  };

  const placeBaseArtwork = (code, options) => {
    if (!state.baseImage) return;
    state.placements[code] = {
      image: state.baseImage,
      name: state.baseAsset?.name || "Main artwork",
      mode: options.mode || "center",
      scale: options.scale || 76,
      rotation: options.rotation || 0,
      x: options.x || 0,
      y: options.y || 0,
      auto: true,
    };
  };

  const applyAutoPlacements = (preset) => {
    if (!state.baseImage) return;
    if (preset === "feature") {
      placeBaseArtwork("KC_BSPC", { mode: "full", scale: 100, x: 0, y: 0 });
      placeBaseArtwork("KC_TAB", { mode: "full", scale: 100, x: 0, y: 0 });
      placeBaseArtwork("KC_CAPS", { mode: "full", scale: 100, x: 0, y: 0 });
      placeBaseArtwork("KC_ENT", { mode: "full", scale: 100, x: 0, y: 0 });
      placeBaseArtwork("KC_LSFT", { mode: "full", scale: 100, x: 0, y: 0 });
      placeBaseArtwork("KC_RSFT", { mode: "full", scale: 100, x: 0, y: 0 });
    }
    if (preset === "accent") {
      placeBaseArtwork("KC_ESC", { mode: "center", scale: 92, x: 0, y: 0 });
      placeBaseArtwork("KC_ENT", { mode: "center", scale: 88, x: 0, y: 0 });
      placeBaseArtwork("KC_SPC", { mode: "spacebar", scale: 118, x: 0, y: 0 });
    }
  };

  const applyDesignPreset = (panel, preset, options = {}) => {
    state.stylePreset = preset;
    const modeSelect = panel.querySelector("[data-fk-base-mode]");
    const typeSelect = panel.querySelector("[data-fk-artwork-type]");
    const presetSelect = panel.querySelector("[data-fk-style-preset]");

    if (typeSelect && options.type) {
      state.artworkType = options.type;
      typeSelect.value = options.type;
    }
    if (presetSelect) presetSelect.value = preset;

    clearAutoPlacements();

    if (preset === "feature") {
      state.baseMode = "spacebar";
      state.baseOpacity = 0.92;
      applyAutoPlacements("feature");
    } else if (preset === "accent") {
      state.baseMode = "none";
      state.baseOpacity = 0.9;
      applyAutoPlacements("accent");
    } else if (preset === "soft") {
      state.baseMode = "mods";
      state.baseOpacity = 0.46;
    } else if (preset === "desk") {
      state.baseMode = "mods";
      state.baseOpacity = 0.38;
    } else if (preset === "full") {
      state.baseMode = "full";
      state.baseOpacity = 0.62;
    }
    if (modeSelect) modeSelect.value = state.baseMode;
    setGuide(presetCopy[preset] || presetCopy.feature);
    refreshTextures();
  };

  const renderAssets = () => {
    const list = document.querySelector("[data-fk-assets]");
    const select = document.querySelector("[data-fk-accent-select]");
    if (!list || !select) return;
    list.innerHTML = "";
    select.innerHTML = "";
    state.accents.forEach((asset, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fk-asset" + (state.selectedAccent === asset ? " is-active" : "");
      button.title = asset.name;
      button.innerHTML = `<img src="${asset.url}" alt="">`;
      button.addEventListener("click", () => {
        state.selectedAccent = asset;
        renderAssets();
      });
      list.appendChild(button);

      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = asset.name;
      select.appendChild(option);
    });
    if (state.selectedAccent) {
      select.value = String(state.accents.indexOf(state.selectedAccent));
    }
  };

  const uploadToSupabaseStorage = async (path, body, contentType) => {
    if (!config.supabaseUrl || !config.supabaseAnonKey || !config.supabaseBucket) {
      throw new Error("Supabase config is missing in site-config.js.");
    }
    const baseUrl = config.supabaseUrl.replace(/\/$/, "");
    const url = `${baseUrl}/storage/v1/object/${config.supabaseBucket}/${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        "Content-Type": contentType || "application/octet-stream",
      },
      body,
    });
    if (!response.ok) {
      const message = await response.text();
      const error = new Error(message || `Upload failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return { path };
  };

  const submitToProtectedEndpoint = async (design, customerPreviewBlob, standardPreviewBlob) => {
    const verification = window.ForgeKeysTurnstile;
    if (!config.submissionEndpoint || !config.supabaseAnonKey || !verification?.isRequired()) {
      const error = new Error("The protected quote service is not configured.");
      error.code = "backend_not_configured";
      throw error;
    }
    const token = verification.getToken();
    if (!token) {
      const error = new Error("Please complete the human verification before submitting.");
      error.code = "verification_required";
      throw error;
    }

    const form = new FormData();
    form.append("metadata", JSON.stringify(design));
    form.append("turnstileToken", token);
    if (state.baseAsset?.file) form.append("artwork", state.baseAsset.file, state.baseAsset.name);
    state.accents.forEach((asset) => form.append("artwork", asset.file, asset.name));
    form.append("previewCustomer", customerPreviewBlob, "preview-customer-view.png");
    form.append("previewStandard", standardPreviewBlob, "preview-standard.png");

    const response = await fetch(config.submissionEndpoint, {
      method: "POST",
      headers: { apikey: config.supabaseAnonKey },
      body: form,
    });
    let result = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }
    if (!response.ok || result?.ok !== true) {
      const error = new Error(result?.error || "The quote could not be submitted.");
      error.status = response.status;
      error.code = result?.code || "submission_failed";
      throw error;
    }
    return result;
  };

  const waitForPaint = () =>
    new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

  const previewHasKeyboardPixels = (ctx, width, height) => {
    const sampleW = Math.max(1, Math.floor(width / 8));
    const sampleH = Math.max(1, Math.floor(height / 8));
    const x = Math.floor((width - sampleW) / 2);
    const y = Math.floor((height - sampleH) / 2);
    const data = ctx.getImageData(x, y, sampleW, sampleH).data;
    let brightPixels = 0;
    let variedPixels = 0;
    for (let index = 0; index < data.length; index += 16) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      if (a < 12) continue;
      const brightness = r + g + b;
      if (brightness > 115) brightPixels += 1;
      if (Math.max(r, g, b) - Math.min(r, g, b) > 8) variedPixels += 1;
    }
    return brightPixels > 18 || variedPixels > 18;
  };

  const sceneManager = () => window.ForgeKeysSceneManager || null;

  const switchPresets = {
    "crystal-linear": {
      label: "Crystal White",
      housing: "#f4fbfc",
      base: "#eef1ed",
      stem: "#f7f8f4",
      contact: "#c99455",
      spring: "#cfd2cf",
      glow: "#dff7ff",
    },
    "ice-tactile": {
      label: "Ice Tactile",
      housing: "#d8e9ee",
      base: "#35434b",
      stem: "#65b9d1",
      contact: "#c99455",
      spring: "#cfd2cf",
      glow: "#64e6ff",
    },
    "jade-click": {
      label: "Jade Click",
      housing: "#dbeae5",
      base: "#33433d",
      stem: "#59ad7c",
      contact: "#c99455",
      spring: "#cfd2cf",
      glow: "#78ffc0",
    },
  };
  // Correct the switch layer in the keyboard plane for the showroom camera.
  // X moves the complete layer right; Z moves it visually down.
  const SWITCH_GROUP_X_OFFSET = 0.42;
  const SWITCH_GROUP_Z_OFFSET = 0.40;
  let switchSyncTimer = 0;
  let switchSyncAttempts = 0;
  let keycapLiftFrame = 0;

  const keyGroupFromScene = () => sceneManager()?.scene?.getObjectByName?.("KEYS") || null;

  const keyMeshesFromGroup = (keyGroup) => (keyGroup?.children || []).filter((child) =>
    child?.isMesh && /^(?:KC_|MO(?:_|\())/.test(child.name || "")
  );

  const physicalKeyDimensionsFor = (key) => {
    const supplied = key?.options?.dimensions;
    if (Number.isFinite(supplied?.w) && Number.isFinite(supplied?.h)) return supplied;
    key?.geometry?.computeBoundingBox?.();
    const box = key?.geometry?.boundingBox;
    if (!box) return null;
    const toUnits = (span) => Math.max(0.25, Math.round((Number(span) + 0.05) * 4) / 4);
    return {
      w: toUnits(box.max.x - box.min.x),
      h: toUnits(box.max.z - box.min.z),
      x: Number(key.position?.x || 0),
      y: Number(key.position?.z || 0),
    };
  };

  const activeLayoutName = () =>
    window.ForgeKeysStore?.getState?.()?.case?.layout || "";

  const create75KnobGeometry = (template) => {
    const GeometryConstructor = template?.geometry?.constructor;
    const VectorConstructor = template?.geometry?.vertices?.[0]?.constructor;
    const FaceConstructor = template?.geometry?.faces?.[0]?.constructor;
    const UVConstructor = template?.geometry?.faceVertexUvs?.[0]?.[0]?.[0]?.constructor;
    if (!GeometryConstructor || !VectorConstructor || !FaceConstructor) return null;

    const geometry = new GeometryConstructor();
    const segments = 48;
    const centerX = 0.475;
    const centerZ = 0.475;
    const rings = [
      { radius: 0.44, height: 0 },
      { radius: 0.54, height: 0.08 },
      { radius: 0.54, height: 0.15 },
      { radius: 0.49, height: 0.54 },
      { radius: 0.43, height: 0.62 },
      { radius: 0.32, height: 0.62 },
    ];
    rings.forEach((ring) => {
      for (let index = 0; index < segments; index += 1) {
        const angle = (index / segments) * Math.PI * 2;
        geometry.vertices.push(new VectorConstructor(
          centerX + Math.cos(angle) * ring.radius,
          ring.height,
          centerZ + Math.sin(angle) * ring.radius
        ));
      }
    });
    const bottomCenter = geometry.vertices.length;
    geometry.vertices.push(new VectorConstructor(centerX, 0, centerZ));
    const topCenter = geometry.vertices.length;
    geometry.vertices.push(new VectorConstructor(centerX, 0.62, centerZ));

    const addFace = (a, b, c, materialIndex) => {
      const face = new FaceConstructor(a, b, c);
      face.materialIndex = materialIndex;
      geometry.faces.push(face);
      if (UVConstructor && geometry.faceVertexUvs?.[0]) {
        const uvFor = (vertexIndex) => {
          const vertex = geometry.vertices[vertexIndex];
          return new UVConstructor(
            0.5 + (vertex.x - centerX) / 1.08,
            0.5 + (vertex.z - centerZ) / 1.08
          );
        };
        geometry.faceVertexUvs[0].push([uvFor(a), uvFor(b), uvFor(c)]);
      }
    };
    const bandMaterials = [0, 2, 0, 2, 3];
    const markerSegment = Math.round(segments * 0.75);
    for (let ringIndex = 0; ringIndex < rings.length - 1; ringIndex += 1) {
      const currentOffset = ringIndex * segments;
      const nextOffset = (ringIndex + 1) * segments;
      for (let index = 0; index < segments; index += 1) {
        const next = (index + 1) % segments;
        const distanceFromMarker = Math.min(
          Math.abs(index - markerSegment),
          segments - Math.abs(index - markerSegment)
        );
        const materialIndex = ringIndex === rings.length - 2 && distanceFromMarker <= 1
          ? 2
          : bandMaterials[ringIndex];
        addFace(currentOffset + index, nextOffset + index, nextOffset + next, materialIndex);
        addFace(currentOffset + index, nextOffset + next, currentOffset + next, materialIndex);
      }
    }
    const topOffset = (rings.length - 1) * segments;
    for (let index = 0; index < segments; index += 1) {
      const next = (index + 1) % segments;
      addFace(bottomCenter, index, next, 0);
      addFace(topCenter, topOffset + next, topOffset + index, 3);
    }
    geometry.computeFaceNormals?.();
    geometry.computeVertexNormals?.();
    geometry.computeBoundingBox?.();
    return geometry;
  };

  const create75KnobTopTexture = (sourceMaterials) => {
    const templateTexture = sourceMaterials.find((material) => material?.map)?.map;
    if (!templateTexture?.constructor) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) return null;

    const finish = context.createRadialGradient(94, 74, 8, 128, 128, 116);
    finish.addColorStop(0, "#eef2f3");
    finish.addColorStop(0.42, "#9aa2a7");
    finish.addColorStop(1, "#30363a");
    context.fillStyle = finish;
    context.beginPath();
    context.arc(128, 128, 116, 0, Math.PI * 2);
    context.fill();

    context.save();
    context.beginPath();
    context.arc(128, 128, 104, 0, Math.PI * 2);
    context.clip();
    context.strokeStyle = "rgba(255, 255, 255, 0.045)";
    context.lineWidth = 1;
    for (let index = 0; index < 72; index += 1) {
      const angle = (index / 72) * Math.PI * 2;
      context.beginPath();
      context.moveTo(128 + Math.cos(angle) * 32, 128 + Math.sin(angle) * 32);
      context.lineTo(128 + Math.cos(angle) * 104, 128 + Math.sin(angle) * 104);
      context.stroke();
    }
    context.restore();

    context.strokeStyle = "rgba(225, 232, 236, 0.72)";
    context.lineWidth = 5;
    context.beginPath();
    context.arc(128, 128, 108, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = "rgba(9, 12, 14, 0.82)";
    context.lineWidth = 7;
    context.beginPath();
    context.arc(128, 128, 76, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = "rgba(184, 255, 103, 0.94)";
    context.lineWidth = 9;
    context.lineCap = "round";
    context.beginPath();
    context.arc(128, 128, 88, Math.PI * 0.18, Math.PI * 1.82);
    context.stroke();
    context.strokeStyle = "#b8ff67";
    context.lineWidth = 11;
    context.beginPath();
    context.moveTo(128, 27);
    context.lineTo(128, 58);
    context.stroke();

    const texture = new templateTexture.constructor(canvas);
    texture.flipY = templateTexture.flipY;
    if ("colorSpace" in texture && templateTexture.colorSpace) texture.colorSpace = templateTexture.colorSpace;
    if ("encoding" in texture && templateTexture.encoding) texture.encoding = templateTexture.encoding;
    texture.userData = { ...texture.userData, forgeKeys75KnobTexture: true };
    texture.needsUpdate = true;
    return texture;
  };

  const style75KnobMaterial = (source, index, topTexture) => {
    if (!source?.clone) return source;
    const material = source.clone();
    material.map = index === 3 && topTexture ? topTexture : null;
    material.alphaMap = null;
    material.transparent = false;
    material.opacity = 1;
    material.depthWrite = true;
    const colors = ["#24292d", "#b8ff67", "#eef2f3", "#d7dde0"];
    material.color?.set?.(colors[index] || colors[0]);
    if (typeof material.roughness === "number") material.roughness = index === 2 ? 0.32 : index === 3 ? 0.34 : 0.42;
    if (typeof material.metalness === "number") material.metalness = index === 2 ? 0.2 : index === 3 ? 0.28 : 0.68;
    material.emissive?.set?.("#000000");
    material.userData = { ...material.userData, forgeKeysKnobMaterial: true };
    material.needsUpdate = true;
    return material;
  };

  const create75KnobAccentMesh = (knob, sourceMaterials) => {
    const GeometryConstructor = knob?.geometry?.constructor;
    const VectorConstructor = knob?.geometry?.vertices?.[0]?.constructor;
    const FaceConstructor = knob?.geometry?.faces?.[0]?.constructor;
    const MeshConstructor = knob?.constructor;
    const materialTemplate = sourceMaterials.find((material) => material?.isMeshStandardMaterial && material?.clone)
      || sourceMaterials.find((material) => material?.clone);
    if (!GeometryConstructor || !VectorConstructor || !FaceConstructor || !MeshConstructor || !materialTemplate) return null;

    const geometry = new GeometryConstructor();
    const segments = 48;
    const centerX = 0.475;
    const centerZ = 0.475;
    const outerRadius = 0.39;
    const innerRadius = 0.325;
    const markerSegment = Math.round(segments * 0.75);
    for (let index = 0; index < segments; index += 1) {
      const angle = (index / segments) * Math.PI * 2;
      geometry.vertices.push(new VectorConstructor(
        centerX + Math.cos(angle) * outerRadius,
        0.626,
        centerZ + Math.sin(angle) * outerRadius
      ));
      geometry.vertices.push(new VectorConstructor(
        centerX + Math.cos(angle) * innerRadius,
        0.626,
        centerZ + Math.sin(angle) * innerRadius
      ));
    }
    for (let index = 0; index < segments; index += 1) {
      const distanceFromMarker = Math.min(
        Math.abs(index - markerSegment),
        segments - Math.abs(index - markerSegment)
      );
      if (distanceFromMarker <= 1) continue;
      const next = (index + 1) % segments;
      geometry.faces.push(new FaceConstructor(index * 2, index * 2 + 1, next * 2 + 1));
      geometry.faces.push(new FaceConstructor(index * 2, next * 2 + 1, next * 2));
    }
    geometry.computeFaceNormals?.();
    geometry.computeVertexNormals?.();
    geometry.computeBoundingBox?.();

    const material = materialTemplate.clone();
    material.map = null;
    material.alphaMap = null;
    material.transparent = false;
    material.opacity = 1;
    material.depthWrite = true;
    material.color?.set?.("#b8ff67");
    if (typeof material.roughness === "number") material.roughness = 0.42;
    if (typeof material.metalness === "number") material.metalness = 0.14;
    material.emissive?.set?.("#183708");
    if (typeof material.emissiveIntensity === "number") material.emissiveIntensity = 0.16;
    material.userData = { ...material.userData, forgeKeysKnobAccentMaterial: true };
    material.needsUpdate = true;

    const accent = new MeshConstructor(geometry, material);
    accent.name = "FK_KNOB_ACCENT";
    accent.userData.forgeKeys75KnobAccent = true;
    return accent;
  };

  const sync75KnobMesh = (keyGroup) => {
    if (!keyGroup) return;
    const layout = activeLayoutName();
    const existingKnob = (keyGroup.children || []).find((child) =>
      child?.userData?.forgeKeys75Knob
    );
    const hiddenSource = existingKnob?.forgeKeysSourceMesh
      || (keyGroup.children || []).find((child) => child?.userData?.forgeKeys75KnobSource);

    if (layout !== "75knob") {
      if (existingKnob) {
        const accent = existingKnob.getObjectByName?.("FK_KNOB_ACCENT");
        if (accent) {
          existingKnob.remove?.(accent);
          accent.geometry?.dispose?.();
          accent.material?.dispose?.();
        }
        existingKnob.geometry?.dispose?.();
        const currentMaterials = Array.isArray(existingKnob.material)
          ? existingKnob.material
          : [existingKnob.material];
        currentMaterials.forEach((material) => {
          if (material?.map?.userData?.forgeKeys75KnobTexture) material.map.dispose?.();
          if (material?.userData?.forgeKeysKnobMaterial) material.dispose?.();
        });
        existingKnob.parent?.remove?.(existingKnob);
      }
      if (hiddenSource?.parent === keyGroup) {
        hiddenSource.name = hiddenSource.userData.forgeKeysKnobSourceName || "KC_PAUS";
        hiddenSource.visible = hiddenSource.userData.forgeKeysKnobSourceVisible !== false;
        delete hiddenSource.userData.forgeKeys75KnobSource;
        delete hiddenSource.userData.forgeKeysKnobSourceName;
        delete hiddenSource.userData.forgeKeysKnobSourceVisible;
      }
      return;
    }

    if (existingKnob) return;
    const source = (keyGroup.children || []).find((child) => child?.name === "KC_PAUS");
    if (!source?.isMesh || !source.constructor) return;
    const geometry = create75KnobGeometry(source);
    if (!geometry) return;
    const sourceMaterials = Array.isArray(source.material) ? source.material : [source.material];
    const topTexture = create75KnobTopTexture(sourceMaterials);
    const knobMaterials = sourceMaterials.map((material, index) => style75KnobMaterial(material, index, topTexture));
    const knob = new source.constructor(
      geometry,
      Array.isArray(source.material) ? knobMaterials : knobMaterials[0]
    );
    knob.name = "FK_KNOB";
    knob.position.copy?.(source.position);
    knob.quaternion.copy?.(source.quaternion);
    knob.scale.copy?.(source.scale);
    knob.castShadow = false;
    knob.receiveShadow = false;
    knob.userData.forgeKeys75Knob = true;
    knob.forgeKeysSourceMesh = source;
    const accent = create75KnobAccentMesh(knob, knobMaterials);
    if (accent) knob.add(accent);
    source.userData.forgeKeys75KnobSource = true;
    source.userData.forgeKeysKnobSourceName = source.name;
    source.userData.forgeKeysKnobSourceVisible = source.visible;
    source.name = "FK_KNOB_SOURCE";
    source.visible = false;
    keyGroup.add(knob);
  };

  let knobSyncTimer = 0;
  const schedule75KnobSync = (delay = 180) => {
    window.clearTimeout(knobSyncTimer);
    knobSyncTimer = window.setTimeout(() => sync75KnobMesh(keyGroupFromScene()), delay);
  };

  const install75KnobStoreSync = () => {
    const store = window.ForgeKeysStore || window.globalThis?.ForgeKeysStore || document.ForgeKeysStore;
    if (!store?.subscribe) {
      window.setTimeout(install75KnobStoreSync, 120);
      return;
    }
    let previousLayout = "";
    store.subscribe(() => {
      const nextLayout = activeLayoutName();
      if (nextLayout === previousLayout) return;
      previousLayout = nextLayout;
      schedule75KnobSync(220);
      if (isShowroomMode && activeShowroomSet?.viewPreset) {
        window.setTimeout(() => {
          if (activeLayoutName() === nextLayout) {
            applySceneView(showroomSceneView(activeShowroomSet, nextLayout));
          }
        }, 420);
      }
    });
    previousLayout = activeLayoutName();
    schedule75KnobSync(220);
  };

  const restoreShowroomKeySides = (keyGroup) => {
    keyMeshesFromGroup(keyGroup).forEach((key) => {
      const originals = key.userData?.forgeKeysOriginalSideMaterials;
      if (!originals || !Array.isArray(key.material)) return;
      const nextMaterials = key.material.slice();
      [0, 2].forEach((index) => {
        const original = originals[index];
        const current = nextMaterials[index];
        if (!original) return;
        if (current?.userData?.forgeKeysSideClone) current.dispose?.();
        nextMaterials[index] = original;
      });
      key.material = nextMaterials;
      delete key.userData.forgeKeysOriginalSideMaterials;
    });
  };

  const applyShowroomKeySides = (keyGroup) => {
    if (!["crimson-bloom", "midnight-butterfly", "neon-system", "chemical-001", "cat-whiskers"].includes(state.showroomTheme)) return;
    const palette = state.showroomPalette || {
      porcelain: { background: "#f1e6d0" },
      charcoal: { background: "#252525" },
      sage: { background: "#8c9a84" },
      ginger: { background: "#c88745" },
    };
    keyMeshesFromGroup(keyGroup).forEach((key) => {
      if (!Array.isArray(key.material) || key.material.length < 4) return;
      const source = showroomSourceForKey(key.name, physicalKeyDimensionsFor(key));
      const sourceData = source.data;
      const catStyle = () => {
        if (source.set?.theme !== "cat-whiskers") return null;
        if (key.name === "KC_ESC") return "ginger";
        if (["KC_ENT", "KC_LEFT", "KC_DOWN", "KC_RGHT", "KC_UP", "KC_PPLS", "KC_PENT", "KC_PDOT"].includes(key.name)) return "sage";
        if (["KC_F5", "KC_F6", "KC_F7", "KC_F8", "KC_TAB", "KC_CAPS", "KC_LSFT", "KC_RSFT", "KC_LCTL", "KC_RCTL", "KC_LALT", "KC_RALT", "KC_LGUI", "KC_RGUI", "KC_APP", "KC_DEL", "KC_END", "KC_PGUP", "KC_PGDN", "KC_INS", "KC_HOME", "KC_P0"].includes(key.name)) return "charcoal";
        return "porcelain";
      };
      const mappedKey = sourceData?.keyMap?.[key.name];
      if (!mappedKey) return;
      const style = mappedKey.style || catStyle() || "porcelain";
      const palette = sourceData?.palette || state.showroomPalette || {};
      const sideColour = palette[style]?.background || palette.porcelain?.background || "#f4eee5";
      const originals = key.userData.forgeKeysOriginalSideMaterials || {};
      const nextMaterials = key.material.slice();
      [0, 2].forEach((index) => {
        const current = nextMaterials[index];
        if (!current?.clone) return;
        if (!current.userData?.forgeKeysSideClone) originals[index] = current;
        const side = current.userData?.forgeKeysSideClone ? current : current.clone();
        side.userData.forgeKeysSideClone = true;
        side.color?.set?.(sideColour);
        if (typeof side.roughness === "number") side.roughness = style === "clear" ? 0.28 : 0.66;
        if (typeof side.metalness === "number") side.metalness = 0;
        side.needsUpdate = true;
        nextMaterials[index] = side;
      });
      key.userData.forgeKeysOriginalSideMaterials = originals;
      key.material = nextMaterials;
    });
  };

  const syncShowroomLighting = () => {
    const manager = sceneManager();
    if (!manager?.scene) return;
    const studioPbtActive = state.showroomMode === "set"
      && activeShowroomSet?.lightingPreset === "pbt-studio";
    let directionalIndex = 0;
    manager.scene.traverse((light) => {
      if (!light?.isLight) return;
      if (!Number.isFinite(light.userData?.forgeKeysBaseIntensity)) {
        light.userData.forgeKeysBaseIntensity = light.intensity;
      }
      if (!studioPbtActive) {
        light.intensity = light.userData.forgeKeysBaseIntensity;
        return;
      }
      if (light.isAmbientLight) {
        light.intensity = 0.4;
      } else if (light.isDirectionalLight) {
        light.intensity = directionalIndex === 0 ? 0.88 : 0.28;
        directionalIndex += 1;
      }
    });
    document.documentElement.dataset.fkLightingProfile = studioPbtActive ? "pbt-studio" : "default";
  };

  const restoreKeycapMaterials = (keyGroup) => {
    keyMeshesFromGroup(keyGroup).forEach((key) => {
      const originals = key.userData?.forgeKeysOriginalKeycapMaterials;
      if (!originals) return;
      const current = Array.isArray(key.material) ? key.material : [key.material];
      current.forEach((material) => {
        if (material?.userData?.forgeKeysKeycapClone) material.dispose?.();
      });
      key.material = originals;
      delete key.userData.forgeKeysOriginalKeycapMaterials;
    });
  };

  const applyKeycapMaterialProfile = (material, mode, spec, isFace, surfacePreset) => {
    if (mode === "solid") {
      if (surfacePreset !== "pbt-satin") return;
      material.transparent = false;
      material.opacity = 1;
      material.depthWrite = true;
      if (typeof material.roughness === "number") material.roughness = isFace ? 0.7 : 0.76;
      if (typeof material.metalness === "number") material.metalness = 0;
      if (typeof material.envMapIntensity === "number") material.envMapIntensity = isFace ? 0.68 : 0.72;
      if ("transmission" in material) material.transmission = 0;
      material.needsUpdate = true;
      return;
    }
    const isClear = mode === "clear";
    const sideOpacity = isClear ? (Number(spec?.opacity) || 0.42) : 0.64;
    const faceOpacity = isClear
      ? (Number(spec?.printOpacity) || Math.min(0.82, sideOpacity + 0.24))
      : 0.78;
    material.transparent = true;
    material.opacity = isFace ? faceOpacity : sideOpacity;
    material.depthWrite = false;
    if (typeof material.roughness === "number") material.roughness = isClear ? 0.2 : 0.78;
    if (typeof material.metalness === "number") material.metalness = 0;
    if (typeof material.envMapIntensity === "number") material.envMapIntensity = isClear ? 0.96 : 0.74;
    if ("transmission" in material) material.transmission = isClear ? 0.18 : 0.04;
    if ("ior" in material) material.ior = 1.46;
    if ("thickness" in material) material.thickness = 0.16;
    if (!isFace && spec?.tint) material.color?.set?.(spec.tint);
    material.needsUpdate = true;
  };

  const standardMaterialTemplateFromScene = () => {
    let template = null;
    sceneManager()?.scene?.traverse?.((object) => {
      if (template) return;
      const materials = Array.isArray(object?.material) ? object.material : [object?.material];
      template = materials.find((material) => material?.isMeshStandardMaterial) || null;
    });
    return template;
  };

  const applyKeycapMaterial = (keyGroup) => {
    const surfacePreset = activeShowroomSet?.surfacePreset || null;
    keyMeshesFromGroup(keyGroup).forEach((key) => {
      const originals = key.userData?.forgeKeysOriginalKeycapMaterials
        || key.material;
      if (!key.userData.forgeKeysOriginalKeycapMaterials) {
        key.userData.forgeKeysOriginalKeycapMaterials = originals;
      }
      const sourceData = showroomSourceForKey(key.name, physicalKeyDimensionsFor(key)).data;
      const mode = showroomMaterialModeFor(key, sourceData);
      const spec = showroomKeySpecFor(key, sourceData);
      if (mode === "solid" && !surfacePreset) {
        key.material = originals;
        return;
      }
      const sourceMaterials = Array.isArray(originals) ? originals : [originals];
      const standardTemplate = sourceMaterials.find((material) => material?.isMeshStandardMaterial)
        || standardMaterialTemplateFromScene();
      const nextMaterials = sourceMaterials.map((source, index) => {
        if (!source?.clone) return source;
        const isFace = index === 3;
        const useStandardFace = surfacePreset === "pbt-satin"
          && isFace
          && standardTemplate?.clone
          && !source.isMeshStandardMaterial;
        const material = useStandardFace ? standardTemplate.clone() : source.clone();
        if (useStandardFace) {
          material.map = source.map || null;
          material.alphaMap = source.alphaMap || null;
          material.normalMap = null;
          material.bumpMap = null;
          material.roughnessMap = null;
          material.metalnessMap = null;
          material.color?.copy?.(source.color);
          material.side = source.side;
        }
        material.userData = { ...material.userData, forgeKeysKeycapClone: true };
        applyKeycapMaterialProfile(material, mode, spec, isFace, surfacePreset);
        return material;
      });
      key.material = Array.isArray(originals) ? nextMaterials : nextMaterials[0];
    });
  };

  const cloneSwitchMaterial = (source, options) => {
    const material = source.clone();
    material.map = null;
    material.alphaMap = null;
    material.color?.set?.(options.color);
    material.transparent = Boolean(options.transparent);
    material.opacity = options.opacity;
    material.depthWrite = options.depthWrite !== false;
    if (typeof material.roughness === "number") material.roughness = options.roughness;
    if (typeof material.metalness === "number") material.metalness = options.metalness || 0;
    if (material.emissive?.set) {
      material.emissive.set(options.emissive || "#000000");
      material.emissiveIntensity = options.emissiveIntensity || 0;
    }
    material.needsUpdate = true;
    return material;
  };

  const removeSwitchGroup = (manager) => {
    const existing = manager?.scene?.getObjectByName?.("FORGEKEYS_SWITCHES");
    if (!existing) return;
    Object.values(existing.userData?.forgeKeysMaterials || {}).forEach((material) => material?.dispose?.());
    (existing.userData?.forgeKeysGeometries || []).forEach((geometry) => geometry?.dispose?.());
    existing.parent?.remove(existing);
  };

  const switchLayoutSignature = (keyMeshes) => keyMeshes.map((key) => [
    key.name,
    key.position.x.toFixed(3),
    key.position.z.toFixed(3),
    key.rotation.y.toFixed(3),
  ].join(":" )).join("|");

  const createSwitchBoxGeometry = (template, dimensions) => {
    const GeometryConstructor = template.geometry.constructor;
    const VectorConstructor = template.geometry.vertices?.[0]?.constructor;
    const FaceConstructor = template.geometry.faces?.[0]?.constructor;
    if (!GeometryConstructor || !VectorConstructor || !FaceConstructor) return template.geometry;
    const geometry = new GeometryConstructor();
    const halfWidth = dimensions.width / 2;
    const halfDepth = dimensions.depth / 2;
    const height = dimensions.height;
    geometry.vertices.push(
      new VectorConstructor(-halfWidth, 0, -halfDepth),
      new VectorConstructor(halfWidth, 0, -halfDepth),
      new VectorConstructor(halfWidth, 0, halfDepth),
      new VectorConstructor(-halfWidth, 0, halfDepth),
      new VectorConstructor(-halfWidth, height, -halfDepth),
      new VectorConstructor(halfWidth, height, -halfDepth),
      new VectorConstructor(halfWidth, height, halfDepth),
      new VectorConstructor(-halfWidth, height, halfDepth)
    );
    geometry.faces.push(
      new FaceConstructor(0, 2, 1), new FaceConstructor(0, 3, 2),
      new FaceConstructor(4, 5, 6), new FaceConstructor(4, 6, 7),
      new FaceConstructor(0, 1, 5), new FaceConstructor(0, 5, 4),
      new FaceConstructor(1, 2, 6), new FaceConstructor(1, 6, 5),
      new FaceConstructor(2, 3, 7), new FaceConstructor(2, 7, 6),
      new FaceConstructor(3, 0, 4), new FaceConstructor(3, 4, 7)
    );
    geometry.computeFaceNormals?.();
    geometry.computeVertexNormals?.();
    geometry.computeBoundingBox?.();
    return geometry;
  };

  const createSwitchPiece = (template, material, key, dimensions, yOffset, name, partType, options = {}) => {
    const geometry = options.geometry || template.geometry;
    if (!geometry.boundingBox) geometry.computeBoundingBox?.();
    const box = geometry.boundingBox;
    const geometryWidth = Math.max(0.01, (box?.max.x || 0.5) - (box?.min.x || -0.5));
    const geometryHeight = Math.max(0.01, (box?.max.y || 0.5) - (box?.min.y || 0));
    const geometryDepth = Math.max(0.01, (box?.max.z || 0.5) - (box?.min.z || -0.5));
    const piece = new template.constructor(geometry, material);
    piece.name = name;
    piece.position.set(
      key.position.x + (options.offsetX || 0),
      key.position.y + yOffset,
      key.position.z + (options.offsetZ || 0)
    );
    piece.quaternion.copy(key.quaternion);
    piece.scale.set(
      dimensions.width / geometryWidth,
      dimensions.height / geometryHeight,
      dimensions.depth / geometryDepth
    );
    piece.castShadow = false;
    piece.receiveShadow = false;
    piece.userData.forgeKeysSourceKeyName = key.name;
    piece.userData.forgeKeysSwitchPart = partType || name.split("_")[1]?.toLowerCase() || "unknown";
    return piece;
  };

  const createSwitchAssemblyGeometry = (template, specs) => {
    const GeometryConstructor = template.geometry.constructor;
    const MatrixConstructor = template.matrix?.constructor;
    if (!GeometryConstructor || !MatrixConstructor) return null;
    const assembly = new GeometryConstructor();
    specs.forEach((spec) => {
      const part = createSwitchBoxGeometry(template, spec.dimensions);
      const matrix = new MatrixConstructor();
      matrix.makeTranslation(spec.offsetX || 0, spec.yOffset, spec.offsetZ || 0);
      assembly.merge?.(part, matrix, spec.materialIndex);
      part.dispose?.();
    });
    assembly.computeFaceNormals?.();
    assembly.computeVertexNormals?.();
    assembly.computeBoundingBox?.();
    return assembly;
  };

  const buildSwitchGroup = (manager, keyGroup, keyMeshes, signature) => {
    removeSwitchGroup(manager);
    const template = keyMeshes.find((key) => /^KC_[A-Z0-9]$/.test(key.name)) || keyMeshes[0];
    const sourceMaterial = Array.isArray(template.material)
      ? (template.material[3] || template.material[0])
      : template.material;
    if (!template?.geometry || !sourceMaterial?.clone) return null;

    const GroupConstructor = keyGroup.constructor;
    const group = new GroupConstructor();
    group.name = "FORGEKEYS_SWITCHES";
    group.position.copy(keyGroup.position);
    group.rotation.copy(keyGroup.rotation);
    group.scale.copy(keyGroup.scale);
    group.userData.forgeKeysSignature = signature;

    const materials = {
      base: cloneSwitchMaterial(sourceMaterial, { color: "#eef1ed", opacity: 0.98, roughness: 0.54 }),
      housing: cloneSwitchMaterial(sourceMaterial, { color: "#f4fbfc", opacity: 0.24, transparent: true, depthWrite: false, roughness: 0.08 }),
      stem: cloneSwitchMaterial(sourceMaterial, { color: "#f7f8f4", opacity: 1, roughness: 0.42 }),
      contact: cloneSwitchMaterial(sourceMaterial, { color: "#c99455", opacity: 1, roughness: 0.24, metalness: 0.72 }),
      spring: cloneSwitchMaterial(sourceMaterial, { color: "#cfd2cf", opacity: 1, roughness: 0.2, metalness: 0.78 }),
      glow: cloneSwitchMaterial(sourceMaterial, { color: "#ff6c82", opacity: 0, transparent: true, depthWrite: false, roughness: 0.1 }),
    };
    group.userData.forgeKeysMaterials = materials;

    const materialList = [materials.glow, materials.base, materials.housing, materials.stem, materials.contact, materials.spring];
    const switchSpecs = [
      { name: "FK_GLOW_", materialIndex: 0, dimensions: { width: 0.82, height: 0.025, depth: 0.82 }, yOffset: -0.43 },
      { name: "FK_BASE_", materialIndex: 1, dimensions: { width: 0.68, height: 0.14, depth: 0.68 }, yOffset: -0.36 },
      { name: "FK_DECK_", materialIndex: 1, dimensions: { width: 0.52, height: 0.055, depth: 0.52 }, yOffset: -0.22 },
      { name: "FK_HOUSING_FRONT_", materialIndex: 2, dimensions: { width: 0.74, height: 0.19, depth: 0.09 }, yOffset: -0.165, offsetZ: -0.325 },
      { name: "FK_HOUSING_BACK_", materialIndex: 2, dimensions: { width: 0.74, height: 0.19, depth: 0.09 }, yOffset: -0.165, offsetZ: 0.325 },
      { name: "FK_HOUSING_LEFT_", materialIndex: 2, dimensions: { width: 0.09, height: 0.19, depth: 0.56 }, yOffset: -0.165, offsetX: -0.325 },
      { name: "FK_HOUSING_RIGHT_", materialIndex: 2, dimensions: { width: 0.09, height: 0.19, depth: 0.56 }, yOffset: -0.165, offsetX: 0.325 },
      { name: "FK_CONTACT_", materialIndex: 4, dimensions: { width: 0.08, height: 0.15, depth: 0.32 }, yOffset: -0.115, offsetX: -0.19 },
      { name: "FK_CONTACT_BRIDGE_", materialIndex: 4, dimensions: { width: 0.28, height: 0.035, depth: 0.07 }, yOffset: 0.005, offsetZ: -0.18 },
      { name: "FK_SPRING_LOW_", materialIndex: 5, dimensions: { width: 0.24, height: 0.03, depth: 0.24 }, yOffset: -0.07 },
      { name: "FK_SPRING_HIGH_", materialIndex: 5, dimensions: { width: 0.18, height: 0.03, depth: 0.18 }, yOffset: -0.015 },
      { name: "FK_STEM_", materialIndex: 3, dimensions: { width: 0.2, height: 0.29, depth: 0.2 }, yOffset: 0 },
      { name: "FK_STEM_X_", materialIndex: 3, dimensions: { width: 0.38, height: 0.07, depth: 0.1 }, yOffset: 0.16 },
      { name: "FK_STEM_Z_", materialIndex: 3, dimensions: { width: 0.1, height: 0.07, depth: 0.38 }, yOffset: 0.16 },
      { name: "FK_CLIP_FRONT_", materialIndex: 1, dimensions: { width: 0.16, height: 0.1, depth: 0.07 }, yOffset: -0.275, offsetZ: -0.365 },
      { name: "FK_CLIP_BACK_", materialIndex: 1, dimensions: { width: 0.16, height: 0.1, depth: 0.07 }, yOffset: -0.275, offsetZ: 0.365 },
      { name: "FK_PIN_LEFT_", materialIndex: 4, dimensions: { width: 0.055, height: 0.14, depth: 0.055 }, yOffset: -0.5, offsetX: -0.14 },
      { name: "FK_PIN_RIGHT_", materialIndex: 4, dimensions: { width: 0.055, height: 0.14, depth: 0.055 }, yOffset: -0.5, offsetX: 0.14 },
    ];
    const assemblyGeometry = createSwitchAssemblyGeometry(template, switchSpecs);
    if (!assemblyGeometry) return null;
    group.userData.forgeKeysGeometries = [assemblyGeometry];

    keyMeshes.forEach((key) => {
      const assembly = new template.constructor(assemblyGeometry, materialList);
      assembly.name = `FK_SWITCH_${key.name}`;
      assembly.position.copy(key.position);
      assembly.quaternion.copy(key.quaternion);
      assembly.castShadow = false;
      assembly.receiveShadow = false;
      assembly.userData.forgeKeysSourceKeyName = key.name;
      assembly.userData.forgeKeysSwitchPart = "assembly";
      group.add(assembly);
    });
    keyGroup.parent?.add(group);
    return group;
  };

  const updateSwitchGroupMaterials = (group) => {
    const preset = switchPresets[state.switchPreset] || switchPresets["crystal-linear"];
    const materials = group?.userData?.forgeKeysMaterials;
    if (!materials) return;
    materials.base.color?.set?.(preset.base);
    materials.housing.color?.set?.(preset.housing);
    materials.stem.color?.set?.(preset.stem);
    materials.contact.color?.set?.(preset.contact || "#c99455");
    materials.spring.color?.set?.(preset.spring || "#cfd2cf");
    materials.glow.color?.set?.(preset.glow);
    materials.glow.opacity = state.switchLighting === "on" ? 0.72 : 0;
    if (materials.glow.emissive?.set) {
      materials.glow.emissive.set(state.switchLighting === "on" ? preset.glow : "#000000");
      materials.glow.emissiveIntensity = state.switchLighting === "on" ? 1.25 : 0;
    }
    Object.values(materials).forEach((material) => { material.needsUpdate = true; });
  };

  const animateKeycapLift = (keyGroup) => {
    if (!Number.isFinite(keyGroup.userData.forgeKeysBaseY)) {
      keyGroup.userData.forgeKeysBaseY = keyGroup.position.y;
    }
    const target = keyGroup.userData.forgeKeysBaseY + (state.keycapDisplay === "lifted" ? 1.55 : 0);
    const start = keyGroup.position.y;
    if (Math.abs(target - start) < 0.005) {
      keyGroup.position.y = target;
      return;
    }
    window.cancelAnimationFrame(keycapLiftFrame);
    const startedAt = performance.now();
    const duration = 360;
    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      keyGroup.position.y = start + (target - start) * eased;
      if (progress < 1) keycapLiftFrame = window.requestAnimationFrame(step);
    };
    keycapLiftFrame = window.requestAnimationFrame(step);
  };

  const syncSwitchPresentation = () => {
    if (!isShowroomMode) return true;
    const manager = sceneManager();
    const keyGroup = keyGroupFromScene();
    sync75KnobMesh(keyGroup);
    const keyMeshes = keyMeshesFromGroup(keyGroup);
    if (!manager?.scene || !keyGroup || !keyMeshes.length) return false;
    syncShowroomLighting();
    if (!Number.isFinite(keyGroup.userData.forgeKeysBaseY)) {
      keyGroup.userData.forgeKeysBaseY = keyGroup.position.y;
    }
    const signature = switchLayoutSignature(keyMeshes);
    let switchGroup = manager.scene.getObjectByName?.("FORGEKEYS_SWITCHES");
    if (!switchGroup || switchGroup.userData.forgeKeysSignature !== signature) {
      switchGroup = buildSwitchGroup(manager, keyGroup, keyMeshes, signature);
    }
    if (!switchGroup) return false;
    const keyByName = new Map(keyMeshes.map((key) => [key.name, key]));
    let missingSwitchSources = 0;
    let maximumSwitchOffset = 0;
    let maximumSwitchRotationError = 0;
    switchGroup.children.forEach((piece) => {
      const sourceKey = keyByName.get(piece.userData?.forgeKeysSourceKeyName);
      if (!sourceKey) {
        missingSwitchSources += 1;
        return;
      }
      maximumSwitchOffset = Math.max(maximumSwitchOffset, piece.position.distanceTo(sourceKey.position));
      maximumSwitchRotationError = Math.max(
        maximumSwitchRotationError,
        1 - Math.abs(piece.quaternion.dot(sourceKey.quaternion))
      );
    });
    document.documentElement.dataset.fkSwitchAlignment = [
      keyMeshes.length,
      switchGroup.children.length,
      missingSwitchSources,
      maximumSwitchOffset.toFixed(6),
      maximumSwitchRotationError.toFixed(6),
    ].join(":" );
    switchGroup.position.copy(keyGroup.position);
    switchGroup.position.x += SWITCH_GROUP_X_OFFSET;
    switchGroup.position.y = keyGroup.userData.forgeKeysBaseY;
    switchGroup.position.z += SWITCH_GROUP_Z_OFFSET;
    switchGroup.rotation.copy(keyGroup.rotation);
    switchGroup.scale.copy(keyGroup.scale);
    const keycapsHidden = state.keycapDisplay === "hidden";
    // Hide the complete keycap group. Some layouts include meshes whose names
    // do not match the per-key texture convention, so mesh-only hiding can
    // leave caps behind or let them reappear after a later material refresh.
    keyGroup.visible = !keycapsHidden;
    keyMeshes.forEach((key) => { key.visible = !keycapsHidden; });
    const revealAllSwitches = keycapsHidden
      || state.keycapMaterial !== "solid"
      || state.keycapDisplay === "lifted";
    const revealTransparentSwitches = showroomUsesPerKeyMaterials();
    switchGroup.visible = keycapsHidden
      || revealAllSwitches
      || revealTransparentSwitches;
    switchGroup.children.forEach((piece) => {
      const sourceKeyName = piece.userData?.forgeKeysSourceKeyName;
      const keyMaterial = sourceKeyName ? showroomMaterialModeFor(sourceKeyName) : "solid";
      const switchPart = piece.userData?.forgeKeysSwitchPart;
      const isInsetStem = ["housing", "contact", "spring", "stem", "stem-cross"].includes(switchPart);
      const isSwitchAssembly = switchPart === "assembly";
      const insetStemFitsCase = !["KC_LEFT", "KC_DOWN", "KC_RGHT", "KC_UP"].includes(sourceKeyName);
      piece.visible = revealAllSwitches
        || (keyMaterial !== "solid" && (isSwitchAssembly || isInsetStem) && insetStemFitsCase);
    });
    updateSwitchGroupMaterials(switchGroup);
    restoreKeycapMaterials(keyGroup);
    applyShowroomKeySides(keyGroup);
    applyKeycapMaterial(keyGroup);
    animateKeycapLift(keyGroup);
    document.documentElement.dataset.fkSwitchDisplay = [
      state.switchPreset,
      state.keycapMaterial,
      state.switchLighting,
      state.keycapDisplay,
    ].join(":" );
    document.documentElement.dataset.fkKeycapMaterialMode = showroomUsesPerKeyMaterials() && state.keycapMaterial === "solid"
      ? "per-key"
      : state.keycapMaterial;
    return true;
  };

  function scheduleSwitchPresentation(delay = 120) {
    if (!isShowroomMode) return;
    window.clearTimeout(switchSyncTimer);
    switchSyncTimer = window.setTimeout(() => {
      if (syncSwitchPresentation()) {
        switchSyncAttempts = 0;
        return;
      }
      switchSyncAttempts += 1;
      if (switchSyncAttempts < 24) scheduleSwitchPresentation(180);
    }, delay);
  }

  const updateSwitchControlState = (panel) => {
    panel.querySelectorAll("[data-fk-switch-preset]").forEach((button) => {
      const active = button.dataset.fkSwitchPreset === state.switchPreset;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    panel.querySelectorAll("[data-fk-cap-material]").forEach((button) => {
      const active = button.dataset.fkCapMaterial === state.keycapMaterial;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    panel.querySelectorAll("[data-fk-switch-light]").forEach((button) => {
      const active = button.dataset.fkSwitchLight === state.switchLighting;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    panel.querySelectorAll("[data-fk-cap-display]").forEach((button) => {
      const active = button.dataset.fkCapDisplay === state.keycapDisplay;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const summary = panel.querySelector("[data-fk-switch-summary]");
    if (summary) {
      const capLabel = showroomUsesPerKeyMaterials() && state.keycapMaterial === "solid"
        ? "Set"
        : state.keycapMaterial[0].toUpperCase() + state.keycapMaterial.slice(1);
      const displayLabel = { seated: "caps on", lifted: "caps lifted", hidden: "caps off" }[state.keycapDisplay];
      summary.textContent = `${capLabel} · ${displayLabel} · RGB ${state.switchLighting === "on" ? "on" : "off"}`;
    }
  };

  const wireSwitchDisplayControls = (panel) => {
    panel.querySelectorAll("[data-fk-switch-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        state.switchPreset = button.dataset.fkSwitchPreset;
        updateSwitchControlState(panel);
        scheduleSwitchPresentation(0);
        trackDesignerEvent("showroom_switch_changed", { switchPreset: state.switchPreset });
      });
    });
    panel.querySelectorAll("[data-fk-cap-material]").forEach((button) => {
      button.addEventListener("click", () => {
        state.keycapMaterial = button.dataset.fkCapMaterial;
        updateSwitchControlState(panel);
        scheduleSwitchPresentation(0);
        trackDesignerEvent("showroom_keycap_material_changed", { material: state.keycapMaterial });
      });
    });
    panel.querySelectorAll("[data-fk-switch-light]").forEach((button) => {
      button.addEventListener("click", () => {
        state.switchLighting = button.dataset.fkSwitchLight;
        if (state.switchLighting === "on" && state.keycapMaterial === "solid") state.keycapMaterial = "clear";
        updateSwitchControlState(panel);
        scheduleSwitchPresentation(0);
        trackDesignerEvent("showroom_switch_lighting_changed", { lighting: state.switchLighting });
      });
    });
    panel.querySelectorAll("[data-fk-cap-display]").forEach((button) => {
      button.addEventListener("click", () => {
        state.keycapDisplay = button.dataset.fkCapDisplay;
        updateSwitchControlState(panel);
        scheduleSwitchPresentation(0);
        window.requestAnimationFrame(updateMixSelectionOutline);
        trackDesignerEvent("showroom_keycap_display_changed", { display: state.keycapDisplay });
      });
    });
    updateSwitchControlState(panel);
    scheduleSwitchPresentation(320);
  };

  const currentSceneView = () => {
    const manager = sceneManager();
    if (!manager?.camera || !manager?.controls) return null;
    return {
      camera: {
        x: manager.camera.position.x,
        y: manager.camera.position.y,
        z: manager.camera.position.z,
      },
      target: {
        x: manager.controls.target.x,
        y: manager.controls.target.y,
        z: manager.controls.target.z,
      },
    };
  };

  const applySceneView = async (view) => {
    const manager = sceneManager();
    if (!manager?.camera || !manager?.controls || !view) return false;
    const up = view.up || { x: 0, y: 1, z: 0 };
    manager.camera.up.set(up.x, up.y, up.z);
    manager.camera.position.set(view.camera.x, view.camera.y, view.camera.z);
    manager.controls.target.set(view.target.x, view.target.y, view.target.z);
    manager.controls.update();
    await waitForPaint();
    return true;
  };

  const standardSceneView = () => ({
    camera: { x: 0, y: 15, z: 15 },
    target: { x: 0, y: 0, z: 0 },
  });

  const showroomSceneView = (set, layout = activeLayoutName()) => {
    if (set?.viewPreset === "artwork-inspection") {
      const isMobile = window.innerWidth <= 600;
      const centreX = isMobile ? 8 : 2.4;
      return {
        camera: isMobile
          ? { x: centreX, y: 33, z: 10.7 }
          : { x: centreX, y: 18.5, z: 6 },
        target: { x: centreX, y: 0.25, z: 4.4 },
        up: { x: 0, y: 0, z: -1 },
      };
    }
    if (set?.viewPreset === "full-size-three-quarter") {
      const isFullSize = layout === "100" || layout === "96";
      const isMobile = window.innerWidth <= 600;
      const camera = isFullSize
        ? (isMobile ? { x: 0, y: 20, z: 13.5 } : { x: 0, y: 22, z: 14 })
        : (isMobile ? { x: 0, y: 17, z: 11.5 } : { x: 0, y: 18.5, z: 12.5 });
      return {
        camera,
        target: { x: 0, y: 0.25, z: 0.2 },
      };
    }
    if (set?.id === "FK-KC-002") {
      return {
        camera: { x: 0, y: 17.2, z: 12.4 },
        target: { x: 0, y: 0.3, z: 0 },
      };
    }
    if (set?.id === "FK-KC-003") {
      const cameraHeight = layout === "100" ? 25
        : layout === "80" ? 21.5
          : layout === "75" || layout === "75knob" ? 19
            : layout === "65" ? 18
              : 17;
      const responsiveHeight = window.innerWidth <= 600 ? cameraHeight * 0.74 : cameraHeight;
      return {
        camera: { x: 0, y: responsiveHeight, z: 0.001 },
        target: { x: 0, y: 0.3, z: 0 },
        up: { x: 0, y: 0, z: -1 },
      };
    }
    return standardSceneView();
  };

  const canvasBlob = async () => {
    let output = null;
    let ctx = null;
    for (let attempt = 0; attempt < 24; attempt += 1) {
      await waitForPaint();
      const canvas = document.querySelector("#canvas-wrapper canvas");
      if (!canvas || !canvas.width || !canvas.height) continue;
      output = document.createElement("canvas");
      output.width = canvas.width;
      output.height = canvas.height;
      ctx = output.getContext("2d", { willReadFrequently: true });
      const wrapper = document.querySelector("#canvas-wrapper");
      ctx.fillStyle = wrapper ? getComputedStyle(wrapper).backgroundColor : "#d1c8ba";
      ctx.fillRect(0, 0, output.width, output.height);
      ctx.drawImage(canvas, 0, 0);
      if (previewHasKeyboardPixels(ctx, output.width, output.height)) break;
      output = null;
    }
    if (!output || !ctx) {
      throw new Error("The keyboard preview is still loading. Wait a moment, then submit again.");
    }
    return new Promise((resolve, reject) => {
      output.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not create preview image."));
      }, "image/png");
    });
  };

  const standardCanvasBlob = async () => {
    const originalView = currentSceneView();
    const hasScene = await applySceneView(standardSceneView());
    try {
      return await canvasBlob();
    } finally {
      if (hasScene && originalView) {
        await applySceneView(originalView);
      }
    }
  };

  const collectDesignData = (panel, submissionId) => {
    const placements = Object.entries(state.placements).map(([key, placement]) => ({
      key,
      asset: placement.name,
      placement: placement.mode,
      scale: placement.scale,
      x: placement.x,
      y: placement.y,
      rotation: placement.rotation,
    }));
    const layout = syncBoundsFromOriginalLayout();
    const customerNotes = panel.querySelector("[data-fk-notes]").value.trim();
    const artworkRoles = [
      ...(state.baseAsset?.file ? ["main"] : []),
      ...state.accents.map(() => "accent"),
    ];
    const designer = {
      orderId: submissionId,
      submittedAt: new Date().toISOString(),
      source: "ForgeKey Studio AU 3D Custom Designer",
      layoutCrop: layout,
      baseArtworkMode: state.baseMode,
      artworkType: state.artworkType,
      stylePreset: state.stylePreset,
      requestMode: state.baseAsset || state.accents.length ? "artwork-submission" : "brief-only",
      baseArtwork: state.baseAsset
        ? { name: state.baseAsset.name, size: state.baseAsset.size, type: state.baseAsset.type }
        : null,
      accentImages: state.accents.map((asset) => ({ name: asset.name, size: asset.size, type: asset.type })),
      accentPlacements: placements,
      mixedKeycaps: Object.entries(state.showroomMixOverrides || {}).map(([key, sourceId]) => ({
        key,
        sourceSetId: sourceId,
        sourceSet: showroomSetForId(sourceId)?.label || sourceId,
      })),
      customer: {
        name: panel.querySelector("[data-fk-name]").value.trim(),
        email: normalizeEmail(panel.querySelector("[data-fk-email]").value),
        instagram: panel.querySelector("[data-fk-instagram]").value.trim(),
        keyboardModel: panel.querySelector("[data-fk-keyboard]").value.trim(),
        notes: customerNotes,
      },
      productionNotes: {
        material: "Factory to advise",
        finish: "Matte preview",
        printMethod: "Factory to advise",
        warning: "Preview is for quoting. ForgeKey Studio AU must verify final production templates, safe area, bleed, material, and source resolution before manufacturing.",
      },
    };
    return {
      ...designer,
      schemaVersion: 3,
      submissionKind: "designer",
      submissionId,
      enquirySource: "3d-preview",
      requestType: "Custom keycaps",
      layout,
      budgetRange: "Not sure yet",
      selectedReferenceId: "",
      selectedReference: "3D custom keycap preview",
      brief: customerNotes || `3D custom keycap preview for ${layout}.`,
      artworkRoles,
      consent: {
        artworkRightsConfirmed: panel.querySelector("[data-fk-rights]").checked,
        quoteOnlyConfirmed: panel.querySelector("[data-fk-rights]").checked,
        confirmedAt: new Date().toISOString(),
      },
      page: {
        url: window.location.href,
        referrer: document.referrer || "",
      },
      customer: {
        ...designer.customer,
        city: "",
        socialHandle: designer.customer.instagram,
      },
      designer,
    };
  };

  const setSubmitBusy = (panel, busy) => {
    const button = panel.querySelector("[data-fk-submit]");
    if (!button) return;
    button.disabled = busy || submissionSucceeded;
    button.textContent = submissionSucceeded ? "Request sent" : busy ? "Sending..." : "Send request";
  };

  const submitRequest = async (panel) => {
    if (submissionSucceeded) return;
    trackDesignerEvent("quote_submit_attempt");
    const name = panel.querySelector("[data-fk-name]").value.trim();
    const emailField = panel.querySelector("[data-fk-email]");
    const email = normalizeEmail(emailField.value);
    const confirmEmailField = panel.querySelector("[data-fk-confirm-email]");
    const confirmEmail = normalizeEmail(confirmEmailField.value);
    const correction = emailCorrection(email);
    if (!name) {
      setStatus("Please add your name before submitting.", "error");
      return;
    }
    if (!emailLooksValid(email)) {
      setStatus("Please enter a valid email address.", "error");
      return;
    }
    if (correction) {
      setStatus(`Did you mean ${correction}? Please correct the email before submitting.`, "error");
      emailField.focus();
      return;
    }
    if (email !== confirmEmail) {
      setStatus("The two email addresses do not match. Please check both.", "error");
      confirmEmailField.focus();
      return;
    }
    if (!panel.querySelector("[data-fk-rights]").checked) {
      setStatus("Please confirm that you can use the material and understand this is a quote request.", "error");
      panel.querySelector("[data-fk-rights]").focus();
      return;
    }
    const submissionId = `FK-${Date.now()}`;
    const folder = `${config.supabaseFolder || "submissions"}/${submissionId}`;
    const design = collectDesignData(panel, submissionId);
    setSubmitBusy(panel, true);
    setStatus("Submitting design files...", "info");
    try {
      const customerPreviewBlob = await canvasBlob();
      const standardPreviewBlob = await standardCanvasBlob();
      let submittedReference = submissionId;
      if (protectedSubmissionEnabled) {
        const result = await submitToProtectedEndpoint(design, customerPreviewBlob, standardPreviewBlob);
        submittedReference = result.reference || submissionId;
      } else {
        if (state.baseAsset?.file) {
          await uploadToSupabaseStorage(`${folder}/main-artwork-${safeFileName(state.baseAsset.name)}`, state.baseAsset.file, state.baseAsset.type);
        }
        for (let index = 0; index < state.accents.length; index += 1) {
          const asset = state.accents[index];
          await uploadToSupabaseStorage(`${folder}/accents/${String(index + 1).padStart(2, "0")}-${safeFileName(asset.name)}`, asset.file, asset.type);
        }
        await uploadToSupabaseStorage(`${folder}/preview-customer-view.png`, customerPreviewBlob, "image/png");
        await uploadToSupabaseStorage(`${folder}/preview-standard.png`, standardPreviewBlob, "image/png");
        await uploadToSupabaseStorage(`${folder}/preview.png`, standardPreviewBlob, "image/png");
        const json = JSON.stringify(design, null, 2);
        await uploadToSupabaseStorage(`${folder}/design.json`, new Blob([json], { type: "application/json" }), "application/json");
        await uploadToSupabaseStorage(`${folder}/01-order-details.json`, new Blob([json], { type: "application/json" }), "application/json");
        await uploadToSupabaseStorage(
          `${folder}/00-read-me-first.txt`,
          new Blob([
            [
              `ForgeKey Studio AU custom designer submission: ${submissionId}`,
              "",
              state.baseAsset || state.accents.length
                ? "Open preview-standard.png first to see the customer's design direction in a consistent camera view. preview-customer-view.png shows the angle the customer had on screen."
                : "No artwork was uploaded. Treat this as a brief-only enquiry and reply with recommended next steps.",
              "If artwork was uploaded, original files are included as main-artwork-* and accents/*.",
              "Use design.json for key placement, scale, rotation, and customer contact details.",
              "Do not send to factory without checking final production template, safe area, bleed, material, print method, and source image resolution.",
            ].join("\n"),
          ], { type: "text/plain" }),
          "text/plain"
        );
      }
      submissionSucceeded = true;
      trackDesignerEvent("quote_submit_success");
      setStatus(`Request submitted. Reference ${submittedReference}. We will reply by email with the next step.`, "success");
    } catch (error) {
      console.error("ForgeKeys upload failed", error);
      trackDesignerEvent("quote_submit_error", {
        errorCode: error.code || (error.status ? `http_${error.status}` : "submission_failed"),
      });
      if (protectedSubmissionEnabled) window.ForgeKeysTurnstile?.reset();
      if (error.code === "verification_required" || error.code === "verification_failed") {
        setStatus(error.message, "error");
      } else if (error.status === 429) {
        setStatus("Too many requests were sent. Please wait before trying again.", "error");
      } else if (error.status === 403) {
        setStatus("Upload is blocked by the site storage settings. Please contact ForgeKey Studio AU and quote this page.", "error");
      } else if (error.code === "backend_not_configured") {
        setStatus("The quote service is temporarily unavailable. Please contact ForgeKey Studio AU directly.", "error");
      } else {
        setStatus("Upload failed. Please check your connection and try again.", "error");
      }
    } finally {
      setSubmitBusy(panel, false);
    }
  };

  const mountShowroomPanel = (panel) => {
    const mount = () => {
      const sidebar = document.querySelector("#sidebar");
      if (!sidebar) return false;
      if (!sidebar.contains(panel)) {
        const tabsRoot = sidebar.querySelector(".react-tabs");
        if (tabsRoot?.parentElement) {
          tabsRoot.insertAdjacentElement("beforebegin", panel);
        } else {
          sidebar.appendChild(panel);
        }
      }
      document.body.classList.add("fk-sidebar-mounted", "fk-showroom-ready");
      installShowroomFrameBridge();
      publishShowroomFrameState();
      window.dispatchEvent(new Event("resize"));
      return true;
    };

    if (mount()) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (mount() || attempts > 80) window.clearInterval(timer);
    }, 150);
  };

  const updateShowroomDetails = (panel, set) => {
    panel.querySelector("[data-fk-showroom-name]").textContent = set.label;
    panel.querySelector("[data-fk-showroom-description]").textContent = set.description;
    panel.querySelector("[data-fk-showroom-studio]").textContent = set.studio?.name || "Studio to be confirmed";
    panel.querySelector("[data-fk-showroom-availability]").textContent = set.availability;
    panel.querySelector("[data-fk-showroom-profile]").textContent = set.profile;
    panel.querySelector("[data-fk-showroom-layouts]").textContent = set.layouts;
    panel.querySelector("[data-fk-showroom-finish]").textContent = set.finish;
    const partnerNote = panel.querySelector("[data-fk-showroom-partner-note]");
    if (set.previewAccuracy === "supplier-artwork") {
      partnerNote.textContent = "This 3D view uses studio-supplied per-key artwork. Colour can still vary by screen and lighting.";
    } else {
      partnerNote.textContent = "This 3D view is a concept reconstruction. Final keycap colours and artwork are confirmed before ordering.";
    }
    const quoteParams = new URLSearchParams({
      product: `${set.label} keycap set`,
      ref: set.id,
      type: "Keycap product enquiry",
      source: "3d-keycap-showroom",
    });
    const action = panel.querySelector("[data-fk-showroom-quote]");
    if (set.commercialStatus === "active-partner" && set.purchaseUrl) {
      action.href = set.purchaseUrl;
      action.target = "_blank";
      action.rel = "noopener sponsored";
      action.textContent = `Shop at ${set.studio.name}`;
    } else {
      action.href = `../support.html?${quoteParams.toString()}#quote`;
      action.target = "_parent";
      action.removeAttribute("rel");
      action.textContent = "Ask about it";
    }
  };

  const showThreeDSet = (panel, set) => {
    state.showroomView = "3d";
    const controlsNote = panel.querySelector("[data-fk-showroom-controls-note]");
    controlsNote.querySelector("strong").textContent = "Artwork applied";
    controlsNote.querySelector("span").textContent = "Layout and case can still change.";
    setStatus(`${set.label} preview ready.`, "success");
  };

  const mixKeyLabelFor = (code) => keyOptions.find(([value]) => value === code)?.[1]
    || code.replace(/^KC_/, "").replace(/^MO\((\d+)\)$/, "Layer $1").replaceAll("_", " ");

  const liveMixKeyForCode = (code) => keyMeshesFromGroup(keyGroupFromScene())
    .find((key) => key.name === code) || null;

  const mixKeyDimensionsFor = (code) => physicalKeyDimensionsFor(liveMixKeyForCode(code));

  const ensureMixKeyOption = (select, code) => {
    if (!select || !code || [...select.options].some((option) => option.value === code)) return;
    const option = document.createElement("option");
    option.value = code;
    option.textContent = mixKeyLabelFor(code);
    select.appendChild(option);
  };

  const syncMixKeyOptions = (select, liveKeys) => {
    if (!select || !liveKeys?.length) return;
    const liveCodes = [...new Set(liveKeys.map((key) => key.name).filter(Boolean))];
    const knownOrder = new Map(keyOptions.map(([code], index) => [code, index]));
    liveCodes.sort((left, right) => {
      const leftIndex = knownOrder.has(left) ? knownOrder.get(left) : Number.MAX_SAFE_INTEGER;
      const rightIndex = knownOrder.has(right) ? knownOrder.get(right) : Number.MAX_SAFE_INTEGER;
      return leftIndex - rightIndex || left.localeCompare(right);
    });
    select.replaceChildren(...liveCodes.map((code) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = mixKeyLabelFor(code);
      return option;
    }));
  };

  const mixSourceSupportsKey = (designData, code, opts) => {
    if (!designData?.keyMap || !designData?.atlasKeys || !opts) return false;
    const atlasCode = showroomKeyCodeFor(code, opts, designData.keyMap);
    const mappedKey = designData.keyMap[code] || designData.keyMap[atlasCode];
    if (!mappedKey) return false;
    const artworkCode = mappedKey.artworkCode || mappedKey.artworkId || atlasCode;
    const source = designData.atlasKeys[artworkCode];
    const candidates = source ? [source, ...(Array.isArray(source.variants) ? source.variants : [])] : [];
    return candidates.some((candidate) => keyUnitMatches(candidate, opts));
  };

  const pushMixHistory = (entry) => {
    state.showroomMixHistory.push(entry);
    if (state.showroomMixHistory.length > 30) state.showroomMixHistory.shift();
  };

  const ensureMixSelectionOutline = () => {
    const manager = sceneManager();
    if (!manager?.el) return null;
    if (mixSelectionOutline?.isConnected) return mixSelectionOutline;
    mixSelectionOutline = document.createElement("div");
    mixSelectionOutline.className = "fk-mix-key-outline";
    mixSelectionOutline.hidden = true;
    mixSelectionOutline.innerHTML = "<span></span>";
    manager.el.appendChild(mixSelectionOutline);
    return mixSelectionOutline;
  };

  const updateMixSelectionOutline = () => {
    const outline = ensureMixSelectionOutline();
    const manager = sceneManager();
    const key = liveMixKeyForCode(state.showroomMixSelectedKey);
    const mixLab = document.querySelector("[data-fk-mix-lab]");
    if (!outline || !manager?.camera || !manager?.renderer?.domElement || !key || !mixLab?.open
      || state.showroomMode !== "set" || state.keycapDisplay === "hidden") {
      if (outline) outline.hidden = true;
      return;
    }
    key.geometry?.computeBoundingBox?.();
    const box = key.geometry?.boundingBox;
    const VectorConstructor = key.position?.constructor;
    if (!box || !VectorConstructor) {
      outline.hidden = true;
      return;
    }
    manager.scene?.updateMatrixWorld?.(true);
    key.updateMatrixWorld?.(true);
    const points = [];
    [box.min.x, box.max.x].forEach((x) => {
      [box.min.y, box.max.y].forEach((y) => {
        [box.min.z, box.max.z].forEach((z) => {
          points.push(new VectorConstructor(x, y, z).applyMatrix4(key.matrixWorld).project(manager.camera));
        });
      });
    });
    const canvasRect = manager.renderer.domElement.getBoundingClientRect();
    const hostRect = manager.el.getBoundingClientRect();
    const xs = points.map((point) => canvasRect.left - hostRect.left + ((point.x + 1) / 2) * canvasRect.width);
    const ys = points.map((point) => canvasRect.top - hostRect.top + ((1 - point.y) / 2) * canvasRect.height);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    if (![left, right, top, bottom].every(Number.isFinite) || right < 0 || bottom < 0
      || left > hostRect.width || top > hostRect.height) {
      outline.hidden = true;
      return;
    }
    outline.hidden = false;
    outline.style.left = `${Math.max(0, left - 3)}px`;
    outline.style.top = `${Math.max(0, top - 3)}px`;
    outline.style.width = `${Math.max(20, right - left + 6)}px`;
    outline.style.height = `${Math.max(20, bottom - top + 6)}px`;
    outline.querySelector("span").textContent = mixKeyLabelFor(state.showroomMixSelectedKey);
  };

  const updateMixControlState = (panel) => {
    const keySelect = panel?.querySelector("[data-fk-mix-key]");
    const selectedLabel = panel?.querySelector("[data-fk-mix-selected-label]");
    const summary = panel?.querySelector("[data-fk-mix-summary]");
    if (!keySelect) return;
    ensureMixKeyOption(keySelect, state.showroomMixSelectedKey);
    keySelect.value = state.showroomMixSelectedKey;
    if (selectedLabel) selectedLabel.textContent = mixKeyLabelFor(state.showroomMixSelectedKey);
    const currentSource = state.showroomMixOverrides?.[state.showroomMixSelectedKey] || "current";
    panel.querySelectorAll("[data-fk-mix-source-set]").forEach((button) => {
      const active = button.dataset.fkMixSourceSet === currentSource;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const count = Object.keys(state.showroomMixOverrides || {}).length;
    if (summary) summary.textContent = count ? `${count} key${count === 1 ? "" : "s"} swapped` : "No swaps";
    panel.querySelector("[data-fk-mix-undo]")?.toggleAttribute("disabled", state.showroomMixHistory.length === 0);
    panel.querySelector("[data-fk-mix-reset-key]")?.toggleAttribute("disabled", !state.showroomMixOverrides?.[state.showroomMixSelectedKey]);
    panel.querySelector("[data-fk-mix-reset]")?.toggleAttribute("disabled", count === 0);
    panel.classList.toggle("fk-mix-active", count > 0 && state.showroomMode === "set");
    window.requestAnimationFrame(updateMixSelectionOutline);
  };

  const refreshMixCompatibility = async (panel) => {
    const request = ++mixCompatibilityRequest;
    if (!panel?.querySelector("[data-fk-mix-lab]")?.open) return;
    const liveKeys = keyMeshesFromGroup(keyGroupFromScene());
    syncMixKeyOptions(panel?.querySelector("[data-fk-mix-key]"), liveKeys);
    let code = state.showroomMixSelectedKey;
    let opts = mixKeyDimensionsFor(code);
    const note = panel?.querySelector("[data-fk-mix-compatibility]");
    document.documentElement.dataset.fkMixLiveKeys = String(liveKeys.length);
    document.documentElement.dataset.fkMixSelectedDimensions = JSON.stringify(opts || null);
    if (!opts && state.showroomMode === "set") {
      const fallbackKey = liveMixKeyForCode("KC_GESC")
        || liveMixKeyForCode("KC_ESC")
        || liveKeys[0];
      if (fallbackKey) {
        code = fallbackKey.name;
        opts = physicalKeyDimensionsFor(fallbackKey);
        state.showroomMixSelectedKey = code;
        document.documentElement.dataset.fkMixSelectedDimensions = JSON.stringify(opts || null);
        updateMixControlState(panel);
      }
    }
    panel?.querySelectorAll("[data-fk-mix-source-set]").forEach((button) => {
      button.disabled = true;
      button.classList.add("is-checking");
    });
    if (!opts || state.showroomMode !== "set") {
      panel?.querySelectorAll("[data-fk-mix-source-set]").forEach((button) => button.classList.remove("is-checking"));
      if (note) note.textContent = state.showroomMode === "set" ? "Choose a key on the keyboard." : "Show a keycap set to start mixing.";
      return;
    }
    const results = await Promise.all(showroomSets.map(async (set) => {
      try {
        return { set, data: await loadShowroomDesignDataCached(set, { artwork: false }) };
      } catch (error) {
        return { set, data: null };
      }
    }));
    if (request !== mixCompatibilityRequest || code !== state.showroomMixSelectedKey) return;
    let available = 0;
    panel.querySelectorAll("[data-fk-mix-source-set]").forEach((button) => {
      const sourceId = button.dataset.fkMixSourceSet;
      button.classList.remove("is-checking");
      if (sourceId === "current") {
        const canReset = Boolean(state.showroomMixOverrides?.[code]);
        button.classList.remove("is-unavailable");
        button.disabled = !canReset;
        button.title = canReset ? "Return this key to the base set" : "This key already uses the base set";
        return;
      }
      const result = results.find(({ set }) => set.id === sourceId);
      const compatible = sourceId !== activeShowroomSet?.id && mixSourceSupportsKey(result?.data, code, opts);
      button.disabled = !compatible;
      button.classList.toggle("is-unavailable", !compatible);
      button.title = compatible
        ? `Use ${result.set.label} on ${mixKeyLabelFor(code)}`
        : sourceId === activeShowroomSet?.id
          ? "This is the base set"
          : "No exact key size is available in this set";
      if (compatible) available += 1;
    });
    if (note) note.textContent = available
      ? `${available} compatible set${available === 1 ? "" : "s"} for ${mixKeyLabelFor(code)}.`
      : `No alternate set has an exact ${mixKeyLabelFor(code)} fit.`;
    updateMixControlState(panel);
  };

  const selectMixKey = (panel, code, openPanel = false) => {
    if (!liveMixKeyForCode(code)) return false;
    mixApplyRequest += 1;
    state.showroomMixSelectedKey = code;
    const keySelect = panel.querySelector("[data-fk-mix-key]");
    ensureMixKeyOption(keySelect, code);
    if (openPanel) panel.querySelector("[data-fk-mix-lab]")?.setAttribute("open", "");
    updateMixControlState(panel);
    refreshMixCompatibility(panel);
    return true;
  };

  const refreshMixTextures = () => {
    const keyGroup = keyGroupFromScene();
    restoreKeycapMaterials(keyGroup);
    restoreShowroomKeySides(keyGroup);
    refreshTextures();
  };

  const resetMixKey = (panel, { record = true, announce = true } = {}) => {
    mixApplyRequest += 1;
    const code = state.showroomMixSelectedKey;
    const previous = state.showroomMixOverrides?.[code];
    if (!previous) return false;
    if (record) pushMixHistory({ type: "key", code, previous });
    delete state.showroomMixOverrides[code];
    state.showroomMixMode = Object.keys(state.showroomMixOverrides).length > 0;
    refreshMixTextures();
    updateMixControlState(panel);
    refreshMixCompatibility(panel);
    if (announce) setStatus(`${mixKeyLabelFor(code)} returned to the base set.`, "success");
    return true;
  };

  const applyMixSource = async (panel, sourceId) => {
    const request = ++mixApplyRequest;
    if (state.showroomMode !== "set") return;
    const code = state.showroomMixSelectedKey;
    const opts = mixKeyDimensionsFor(code);
    const baseSet = activeShowroomSet;
    const layout = activeLayoutName();
    const isCurrentRequest = () => request === mixApplyRequest
      && state.showroomMode === "set" && activeShowroomSet === baseSet
      && state.showroomMixSelectedKey === code && activeLayoutName() === layout;
    if (!opts) {
      setStatus("Choose a key on the keyboard first.", "info");
      return;
    }
    if (sourceId === "current" || sourceId === activeShowroomSet?.id) {
      resetMixKey(panel);
      return;
    }
    const sourceSet = showroomSetForId(sourceId);
    if (!sourceSet) return;
    setStatus(`Checking ${sourceSet.label}...`, "info");
    try {
      const sourceData = await loadShowroomDesignDataCached(sourceSet);
      if (!isCurrentRequest()) return;
      if (!mixSourceSupportsKey(sourceData, code, opts)) {
        throw new Error(`${sourceSet.label} has no exact fit for ${mixKeyLabelFor(code)}.`);
      }
      const previous = state.showroomMixOverrides?.[code] || null;
      if (previous === sourceSet.id) return;
      pushMixHistory({ type: "key", code, previous });
      state.showroomMixOverrides[code] = sourceSet.id;
      state.showroomMixMode = true;
      refreshMixTextures();
      updateMixControlState(panel);
      refreshMixCompatibility(panel);
      setStatus(`${mixKeyLabelFor(code)} now uses ${sourceSet.label}.`, "success");
      trackDesignerEvent("showroom_keycap_mixed", { key: code, sourceSet: sourceSet.id });
    } catch (error) {
      if (isCurrentRequest()) setStatus(error.message || "Could not load that keycap source.", "error");
    }
  };

  const undoMixSelection = (panel) => {
    mixApplyRequest += 1;
    const entry = state.showroomMixHistory.pop();
    if (!entry) return;
    if (entry.type === "all") {
      state.showroomMixOverrides = { ...entry.previous };
    } else if (entry.previous) {
      state.showroomMixOverrides[entry.code] = entry.previous;
      state.showroomMixSelectedKey = entry.code;
    } else {
      delete state.showroomMixOverrides[entry.code];
      state.showroomMixSelectedKey = entry.code;
    }
    state.showroomMixMode = Object.keys(state.showroomMixOverrides).length > 0;
    refreshMixTextures();
    updateMixControlState(panel);
    refreshMixCompatibility(panel);
    setStatus("Last keycap change undone.", "success");
  };

  const resetMixSelection = (panel) => {
    mixApplyRequest += 1;
    const previous = { ...state.showroomMixOverrides };
    if (!Object.keys(previous).length) return;
    pushMixHistory({ type: "all", previous });
    state.showroomMixOverrides = {};
    state.showroomMixMode = false;
    refreshMixTextures();
    updateMixControlState(panel);
    refreshMixCompatibility(panel);
    setStatus("All mixed keycaps cleared.", "success");
  };

  const pickMixKeyFromPoint = (clientX, clientY) => {
    const manager = sceneManager();
    const canvas = manager?.renderer?.domElement;
    const keys = keyMeshesFromGroup(keyGroupFromScene()).filter((key) => key.visible !== false);
    if (!manager?.camera || !manager?.mouse || !manager?.raycaster || !canvas || !keys.length) return null;
    const rect = canvas.getBoundingClientRect();
    manager.mouse.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    manager.raycaster.setFromCamera(manager.mouse, manager.camera);
    return manager.raycaster.intersectObjects(keys, false)?.[0]?.object || null;
  };

  const wireMixCanvasSelection = (panel) => {
    if (mixCanvasWired) return;
    const manager = sceneManager();
    if (!manager?.el || !manager?.renderer?.domElement) {
      mixCanvasWireAttempts += 1;
      if (mixCanvasWireAttempts < 80) window.setTimeout(() => wireMixCanvasSelection(panel), 150);
      return;
    }
    mixCanvasWired = true;
    manager.el.addEventListener("pointerdown", (event) => {
      mixPointerStart = { x: event.clientX, y: event.clientY, at: performance.now(), pointerId: event.pointerId };
    });
    manager.el.addEventListener("pointercancel", () => { mixPointerStart = null; });
    manager.el.addEventListener("pointerup", (event) => {
      if (!mixPointerStart || mixPointerStart.pointerId !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - mixPointerStart.x, event.clientY - mixPointerStart.y);
      const duration = performance.now() - mixPointerStart.at;
      mixPointerStart = null;
      if (distance > 8 || duration > 750 || state.showroomMode !== "set" || state.keycapDisplay === "hidden") return;
      const key = pickMixKeyFromPoint(event.clientX, event.clientY);
      if (key && selectMixKey(panel, key.name, true)) {
        setStatus(`${mixKeyLabelFor(key.name)} selected. Choose a set.`, "info");
        trackDesignerEvent("showroom_mix_key_selected", { key: key.name });
      }
    });
    manager.controls?.addEventListener?.("change", updateMixSelectionOutline);
    window.addEventListener("resize", updateMixSelectionOutline);
    ensureMixSelectionOutline();
    refreshMixCompatibility(panel);
  };

  const wireMixControls = (panel) => {
    const keySelect = panel.querySelector("[data-fk-mix-key]");
    keySelect?.addEventListener("change", () => selectMixKey(panel, keySelect.value));
    panel.querySelectorAll("[data-fk-mix-source-set]").forEach((button) => {
      button.addEventListener("click", () => applyMixSource(panel, button.dataset.fkMixSourceSet));
    });
    panel.querySelector("[data-fk-mix-undo]")?.addEventListener("click", () => undoMixSelection(panel));
    panel.querySelector("[data-fk-mix-reset-key]")?.addEventListener("click", () => resetMixKey(panel));
    panel.querySelector("[data-fk-mix-reset]")?.addEventListener("click", () => resetMixSelection(panel));
    panel.querySelector("[data-fk-mix-lab]")?.addEventListener("toggle", () => {
      updateMixSelectionOutline();
      refreshMixCompatibility(panel);
    });
    updateMixControlState(panel);
    refreshMixCompatibility(panel);
    wireMixCanvasSelection(panel);
  };

  const loadShowroomDesignData = async (set) => {
    if (!set.designDataUrl && !set.keyArtManifestUrl) return null;
    const [designResponse, manifestResponse] = await Promise.all([
      set.designDataUrl ? fetch(set.designDataUrl) : Promise.resolve(null),
      set.keyArtManifestUrl ? fetch(set.keyArtManifestUrl) : Promise.resolve(null),
    ]);
    if (designResponse && !designResponse.ok) throw new Error("Could not load the per-key design data.");
    if (manifestResponse && !manifestResponse.ok) throw new Error("Could not load the per-key artwork map.");
    const design = designResponse ? await designResponse.json() : null;
    const keyMap = {};
    (design?.rows || []).forEach((row) => {
      row.forEach((key) => {
        if (key.code) keyMap[key.code] = key;
      });
    });
    if (!manifestResponse) return { keyMap, palette: design.palette, renderLegends: set.renderLegends };
    const manifest = await manifestResponse.json();
    Object.entries(manifest.keys || {}).forEach(([code, key]) => {
      // Manifest metadata such as material, tint, and print opacity applies to
      // both atlas-only sets and sets that also have design rows.
      keyMap[code] = { ...key, ...(keyMap[code] || {}), code };
    });
    const manifestUrl = new URL(set.keyArtManifestUrl, window.location.href);
    const atlasUrl = new URL(manifest.atlas, manifestUrl);
    if (atlasUrl.origin === window.location.origin) atlasUrl.searchParams.set("v", sampleVersion);
    return {
      keyMap,
      palette: design?.palette || manifest.palette,
      atlasUrl: atlasUrl.href,
      atlasImage: null,
      atlasKeys: manifest.keys,
      renderLegends: set.renderLegends ?? manifest.renderLegends ?? true,
    };
  };

  const loadShowroomDesignDataCached = async (set, { artwork = true } = {}) => {
    if (!set) return null;
    if (!showroomDesignCache.has(set.id)) {
      if (!showroomDesignRequests.has(set.id)) {
        const request = loadShowroomDesignData(set).then((data) => {
          showroomDesignCache.set(set.id, data);
        }).finally(() => showroomDesignRequests.delete(set.id));
        showroomDesignRequests.set(set.id, request);
      }
      await showroomDesignRequests.get(set.id);
    }
    const designData = showroomDesignCache.get(set.id);
    // Compatibility needs key codes and sizes, not every set's decoded atlas.
    // Keep resolved data separate from in-flight work for synchronous rendering.
    if (artwork && designData?.atlasUrl && !designData.atlasImage) {
      if (!showroomAtlasRequests.has(set.id)) {
        const request = loadImageUrl(designData.atlasUrl).then((image) => {
          designData.atlasImage = image;
        }).finally(() => showroomAtlasRequests.delete(set.id));
        showroomAtlasRequests.set(set.id, request);
      }
      await showroomAtlasRequests.get(set.id);
    }
    return designData;
  };

  const applyPreferredLayout = (label) => {
    if (!label) return false;
    const listbox = [...document.querySelectorAll('[role="listbox"]')].find((candidate) => {
      const labelledBy = candidate.getAttribute("aria-labelledby");
      return labelledBy && document.getElementById(labelledBy)?.textContent.trim() === "Layout";
    });
    if (!listbox) return false;
    const current = listbox.textContent.replace(/\s+/g, " ").trim();
    if (current === label) return true;
    const selectedOption = listbox.querySelector('[role="option"][aria-selected="true"]');
    if (!selectedOption) return false;
    selectedOption.click();
    window.setTimeout(() => {
      const option = [...document.querySelectorAll('[role="option"]')].find((candidate) =>
        candidate.textContent.replace(/\s+/g, " ").trim().endsWith(label)
      );
      if (!option) return;
      option.click();
      window.setTimeout(refreshTextures, 350);
      window.setTimeout(() => scheduleSwitchPresentation(0), 520);
    }, 60);
    return true;
  };

  let showroomViewRequest = 0;
  let showroomDesignLoading = false;
  let designSaveTimer = 0;
  let lastSavedDesign = "";

  const captureShowroomDesign = () => window.ForgeKeysDesign?.normalize({
    v: 1,
    set: activeShowroomSet?.id,
    layout: activeLayoutName(),
    case: window.ForgeKeysStore?.getState()?.case,
    scene: { color: window.ForgeKeysStore?.getState()?.settings?.sceneColor, auto: window.ForgeKeysStore?.getState()?.settings?.sceneAutoColor },
    mix: state.showroomMixOverrides,
    mode: state.showroomMode,
    switchPreset: state.switchPreset,
    keycapMaterial: state.keycapMaterial,
    switchLighting: state.switchLighting,
    keycapDisplay: state.keycapDisplay,
  });

  const showroomPageUrl = () => new URL("../showroom.html", window.location.href).href;
  const designHost = () => {
    try { if (window.parent.location.pathname.endsWith("/showroom.html")) return window.parent; } catch {}
    return window;
  };
  const saveShowroomDesign = () => {
    if (showroomDesignLoading) return;
    const design = captureShowroomDesign();
    if (!design) return;
    const token = window.ForgeKeysDesign.encode(design);
    if (token === lastSavedDesign) return;
    let saved = false;
    try { saved = window.ForgeKeysDesign.save(window.localStorage, design); } catch {}
    const label = document.querySelector("[data-fk-design-save-state]");
    if (label) label.textContent = saved ? "Saved on this device" : "Device storage unavailable";
    if (saved) lastSavedDesign = token;
    const linkField = document.querySelector("[data-fk-design-link]");
    if (linkField && !linkField.hidden) linkField.value = window.ForgeKeysDesign.link(showroomPageUrl(), design);
    // Keep an opened share URL in sync; reloading must not restore stale choices.
    const host = designHost();
    if (new URLSearchParams(host.location.hash.slice(1)).has("design")) {
      try { host.history.replaceState(null, "", window.ForgeKeysDesign.link(host.location.href, design)); } catch {}
    }
  };
  function scheduleDesignSave() {
    if (!isShowroomMode || showroomDesignLoading) return;
    clearTimeout(designSaveTimer);
    designSaveTimer = setTimeout(saveShowroomDesign, 350);
  }

  const openDesignQuote = async (event, panel) => {
    const action = event.currentTarget;
    if (activeShowroomSet?.commercialStatus === "active-partner" && activeShowroomSet.purchaseUrl) return;
    event.preventDefault();
    if (action.getAttribute("aria-busy") === "true" || showroomDesignLoading) return;
    action.setAttribute("aria-busy", "true");
    action.textContent = "Preparing preview...";
    try {
      const design = captureShowroomDesign();
      if (!design) throw new Error("Wait for the keyboard to finish loading.");
      const token = window.ForgeKeysDesign.encode(design);
      const bitmap = await createImageBitmap(await canvasBlob());
      const preview = document.createElement("canvas");
      const scale = Math.min(1, 1400 / bitmap.width, 1000 / bitmap.height);
      preview.width = Math.round(bitmap.width * scale);
      preview.height = Math.round(bitmap.height * scale);
      preview.getContext("2d").drawImage(bitmap, 0, 0, preview.width, preview.height);
      bitmap.close();
      if (token !== window.ForgeKeysDesign.encode(captureShowroomDesign()) || showroomDesignLoading) {
        throw new Error("The design changed. Please request the preview again.");
      }
      const id = window.ForgeKeysDesign.writeHandoff(window.sessionStorage, design, preview.toDataURL("image/jpeg", 0.88), activeShowroomSet.label);
      saveShowroomDesign();
      const url = new URL("../support.html", window.location.href);
      url.search = new URLSearchParams({ design: id, source: "3d-keycap-showroom", type: "Custom keycaps" });
      url.hash = "quote";
      trackDesignerEvent("showroom_quote_clicked", { referenceId: design.set });
      designHost().location.assign(url.href);
    } catch (error) {
      setStatus(error.message || "Preview could not be attached. Please try again.", "error");
    } finally {
      action.removeAttribute("aria-busy");
      action.textContent = "Ask about it";
    }
  };

  const wireDesignControls = (panel) => {
    panel.querySelector("[data-fk-design-share]").addEventListener("click", async () => {
      if (showroomDesignLoading) return;
      const design = captureShowroomDesign();
      if (!design) return;
      saveShowroomDesign();
      const url = window.ForgeKeysDesign.link(showroomPageUrl(), design);
      const field = panel.querySelector("[data-fk-design-link]");
      field.value = url;
      field.hidden = false;
      try {
        await navigator.clipboard.writeText(url);
        setStatus(/^https:/.test(url) ? "Design link copied." : "Local preview link copied. Publish the site to share publicly.", "success");
      } catch {
        field.focus();
        field.select();
        setStatus("Select and copy the design link.", "info");
      }
    });
    panel.querySelector("[data-fk-design-new]").addEventListener("click", () => {
      const host = designHost();
      try { host.history.replaceState(null, "", host.location.pathname + host.location.search); } catch {}
      const fresh = window.ForgeKeysDesign.normalize({ v: 1, set: showroomSets[0].id, layout: "75", mix: {} });
      loadShowroomSet(panel, showroomSets[0], panel.querySelector('[data-fk-showroom-set="0"]'), fresh)
        .then((loaded) => { if (loaded) setStatus("New design ready.", "success"); });
    });
    window.ForgeKeysStore?.subscribe(scheduleDesignSave);
    panel.addEventListener("click", scheduleDesignSave);
    window.addEventListener("pagehide", saveShowroomDesign);
    document.addEventListener("visibilitychange", () => { if (document.hidden) saveShowroomDesign(); });
  };

  const loadShowroomSet = async (panel, set, button, restoredDesign = null) => {
    const viewRequest = ++showroomViewRequest;
    showroomDesignLoading = true;
    mixApplyRequest += 1;
    setStatus(`Loading ${set.label}...`, "info");
    try {
      const [asset, designData] = await Promise.all([
        set.threeDMode === "whole-board" ? loadSampleArtwork({ ...set, isSvg: true }) : Promise.resolve(null),
        loadShowroomDesignDataCached(set),
      ]);
      if (viewRequest !== showroomViewRequest) return;
      if (restoredDesign) {
        await Promise.all([...new Set(Object.values(restoredDesign.mix))].map((id) => loadShowroomDesignDataCached(showroomSetForId(id))));
        if (viewRequest !== showroomViewRequest) return;
      }
      const sceneKeyGroup = keyGroupFromScene();
      restoreKeycapMaterials(sceneKeyGroup);
      restoreShowroomKeySides(sceneKeyGroup);
      // A curated set should always open as a complete, seated keyboard preview.
      // Inspection choices from the previous set must not leak into this one.
      state.keycapMaterial = "solid";
      state.switchLighting = "off";
      state.keycapDisplay = "seated";
      activeShowroomSet = set;
      state.baseImage = asset?.image || null;
      state.baseFile = null;
      state.baseAsset = null;
      state.baseMode = set.threeDMode === "whole-board" ? "full" : "none";
      state.baseOpacity = set.opacity;
      // Per-key artwork already contains the finished keycap face. Keep the
      // original simulator legends only in the unstyled/original-cap view.
      state.keepLegends = false;
      state.stylePreset = "full";
      state.showroomTheme = set.theme || null;
      state.showroomKeyMap = designData?.keyMap || null;
      state.showroomPalette = designData?.palette || null;
      state.showroomAtlasImage = designData?.atlasImage || null;
      state.showroomAtlasKeys = designData?.atlasKeys || null;
      state.showroomDesignData = designData;
      state.showroomMixOverrides = {};
      state.showroomMixHistory = [];
      state.showroomMixMode = false;
      state.showroomMixSelectedKey = "KC_ESC";
      state.showroomMode = "set";
      document.body.classList.add("fk-curated-set-active");
      state.placements = {};
      panel.querySelectorAll("[data-fk-showroom-set]").forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("is-active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      updateShowroomDetails(panel, set);
      updateShowroomModeState(panel);
      updateMixControlState(panel);
      refreshMixCompatibility(panel);
      updateSwitchControlState(panel);
      refreshTextures();
      if (restoredDesign) {
        const store = window.ForgeKeysStore;
        store.dispatch({ type: "settings/setSceneColor", payload: restoredDesign.scene.color });
        store.dispatch({ type: "settings/setSceneAutoColor", payload: restoredDesign.scene.auto });
        for (const [field, value] of Object.entries(restoredDesign.case)) {
          store.dispatch({ type: `case/set${field[0].toUpperCase()}${field.slice(1)}`, payload: value });
        }
        store.dispatch({ type: "case/setLayout", payload: restoredDesign.layout });
        state.showroomMixOverrides = { ...restoredDesign.mix };
        for (const field of ["switchPreset", "keycapMaterial", "switchLighting", "keycapDisplay"]) state[field] = restoredDesign[field];
        setShowroomMode(panel, restoredDesign.mode);
      } else if (set.hasThreeD) applyPreferredLayout(set.preferredLayout);
      window.setTimeout(() => refreshMixCompatibility(panel), 420);
      window.setTimeout(() => refreshMixCompatibility(panel), 920);
      window.setTimeout(() => {
        if (viewRequest === showroomViewRequest && activeShowroomSet === set) {
          // React replaces the live key meshes after a layout change. Reset and
          // republish diagnostics only after that final layout has settled so a
          // previous board cannot leave stale missing-key entries behind.
          refreshTextures();
        }
      }, set.preferredLayout ? 1120 : 420);
      window.setTimeout(() => {
        if (viewRequest === showroomViewRequest && activeShowroomSet === set) {
          applySceneView(showroomSceneView(set));
        }
      }, set.preferredLayout ? 760 : 220);
      if (state.showroomMode !== "original") showThreeDSet(panel, set);
      trackDesignerEvent("showroom_set_previewed", { referenceId: set.id });
      await new Promise((resolve) => setTimeout(resolve, 1250));
      if (viewRequest === showroomViewRequest) {
        showroomDesignLoading = false;
        saveShowroomDesign();
        if (restoredDesign) setStatus("Saved design restored.", "success");
        return true;
      }
    } catch (error) {
      if (viewRequest === showroomViewRequest) {
        showroomDesignLoading = false;
        setStatus(error.message || "Could not load this keycap set.", "error");
      }
    }
  };

  const updateShowroomModeState = (panel) => {
    panel.querySelectorAll("[data-fk-showroom-mode]").forEach((button) => {
      const active = button.dataset.fkShowroomMode === state.showroomMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };

  const setShowroomMode = (panel, mode) => {
    // Remove the previous surface-profile clones before the legacy simulator
    // regenerates its key textures. Otherwise the delayed material sync can
    // restore stale Original-cap maps over a freshly reapplied showroom set.
    const keyGroup = keyGroupFromScene();
    restoreKeycapMaterials(keyGroup);
    restoreShowroomKeySides(keyGroup);
    state.showroomMode = mode;
    mixApplyRequest += 1;
    document.body.classList.toggle("fk-curated-set-active", mode !== "original");
    const controlsNote = panel.querySelector("[data-fk-showroom-controls-note]");
    if (mode === "original") {
      state.keepLegends = true;
      state.showroomTheme = null;
      state.showroomKeyMap = null;
      state.showroomPalette = null;
      state.showroomAtlasImage = null;
      state.showroomAtlasKeys = null;
      controlsNote.querySelector("strong").textContent = "Bare keyboard";
      controlsNote.querySelector("span").textContent = "Edit colours below.";
      setStatus("Bare keyboard shown.", "success");
    } else if (state.showroomDesignData) {
      state.keepLegends = false;
      state.showroomTheme = activeShowroomSet?.theme || null;
      state.showroomKeyMap = state.showroomDesignData.keyMap || null;
      state.showroomPalette = state.showroomDesignData.palette || null;
      state.showroomAtlasImage = state.showroomDesignData.atlasImage || null;
      state.showroomAtlasKeys = state.showroomDesignData.atlasKeys || null;
      controlsNote.querySelector("strong").textContent = "Artwork applied";
      controlsNote.querySelector("span").textContent = "Layout and case can still change.";
      setStatus(`${activeShowroomSet?.label || "Keycap set"} shown on the keyboard.`, "success");
    }
    updateShowroomModeState(panel);
    updateMixControlState(panel);
    refreshMixCompatibility(panel);
    updateSwitchControlState(panel);
    refreshTextures();
  };

  const buildShowroomPanel = async () => {
    if (document.querySelector("[data-fk-customizer-root]") || showroomPanelBuilding) return;
    showroomPanelBuilding = true;
    try {
      if (!window.ForgeKeysDesign) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = new URL(`../showroom-design.js?v=${sampleVersion}`, window.location.href).href;
          script.onload = resolve;
          script.onerror = () => reject(new Error("Design tools could not load. Please reload the page."));
          document.head.appendChild(script);
        });
      }
      showroomSets = await loadShowroomCatalog();
    } catch (error) {
      const errorPanel = document.createElement("section");
      errorPanel.className = "fk-customizer fk-sidebar-module fk-showroom-panel";
      errorPanel.setAttribute("data-fk-customizer-root", "");
      errorPanel.setAttribute("aria-label", "ForgeKey Studio AU 3D keycap showroom");
      errorPanel.innerHTML = `<div class="fk-panel-body"><p class="fk-status" data-tone="error">${escapeMarkup(error.message || "The keycap catalog could not be loaded.")}</p></div>`;
      document.body.appendChild(errorPanel);
      mountShowroomPanel(errorPanel);
      showroomPanelBuilding = false;
      return;
    }

    const panel = document.createElement("section");
    panel.className = "fk-customizer fk-sidebar-module fk-showroom-panel";
    panel.setAttribute("data-fk-customizer-root", "");
    panel.setAttribute("aria-label", "ForgeKey Studio AU 3D keycap showroom");
    panel.innerHTML = `
      <details class="fk-shell-details" open>
        <summary>Keycap collection <span class="fk-collection-count">${String(showroomSets.length).padStart(2, "0")}</span></summary>
        <div class="fk-panel-body">
          <div class="fk-showroom-sets" aria-label="Keycap set directions">
            ${showroomSets.map((set, index) => `
              <button class="fk-showroom-set" type="button" data-fk-showroom-set="${index}" aria-pressed="false">
                <span class="fk-showroom-set-thumb" data-fk-showroom-thumb="${index}"></span>
                <span class="fk-showroom-set-copy">
                  <strong>${escapeMarkup(set.label)}</strong>
                  <small>${escapeMarkup(set.studio?.name || "Studio")}</small>
                </span>
                <span class="fk-showroom-apply" aria-hidden="true"></span>
              </button>
            `).join("")}
          </div>
          <div class="fk-showroom-mode" role="group" aria-label="Keycap artwork display">
            <button type="button" data-fk-showroom-mode="set" aria-pressed="true">Set caps</button>
            <button type="button" data-fk-showroom-mode="original" aria-pressed="false">Original caps</button>
          </div>
          <details class="fk-mix-lab" data-fk-mix-lab>
            <summary>
              <span>Mix keycaps</span>
              <small data-fk-mix-summary>No swaps</small>
            </summary>
            <div class="fk-mix-lab-body">
              <div class="fk-mix-selection">
                <span>Selected key</span>
                <strong data-fk-mix-selected-label>Esc</strong>
                <select data-fk-mix-key aria-label="Selected keycap">
                  ${keyOptions.map(([value, label]) => `<option value="${escapeMarkup(value)}">${escapeMarkup(label)}</option>`).join("")}
                </select>
              </div>
              <div class="fk-mix-source-grid" role="group" aria-label="Keycap source set">
                <button type="button" data-fk-mix-source-set="current" aria-pressed="true">
                  <span class="fk-mix-source-thumb fk-mix-source-base" aria-hidden="true">↺</span>
                  <span>Base set</span>
                </button>
                ${showroomSets.map((set, index) => `
                  <button type="button" data-fk-mix-source-set="${escapeMarkup(set.id)}" aria-pressed="false">
                    <span class="fk-mix-source-thumb" data-fk-mix-thumb="${index}" aria-hidden="true"></span>
                    <span>${escapeMarkup(set.label)}</span>
                  </button>
                `).join("")}
              </div>
              <small class="fk-mix-note" data-fk-mix-compatibility>Click a key on the keyboard.</small>
              <div class="fk-mix-actions">
                <button type="button" class="fk-button secondary" data-fk-mix-undo disabled>Undo</button>
                <button type="button" class="fk-button secondary" data-fk-mix-reset-key disabled>Reset key</button>
                <button type="button" class="fk-button secondary" data-fk-mix-reset disabled>Clear all</button>
              </div>
            </div>
          </details>
          <article class="fk-showroom-selection">
            <h2 data-fk-showroom-name>${escapeMarkup(showroomSets[0].label)}</h2>
            <span class="fk-selected-status" data-fk-showroom-availability>${escapeMarkup(showroomSets[0].availability)}</span>
            <details class="fk-set-details">
              <summary>Set details</summary>
              <p data-fk-showroom-description>${escapeMarkup(showroomSets[0].description)}</p>
              <dl class="fk-showroom-specs">
                <div><dt>Studio</dt><dd data-fk-showroom-studio>${escapeMarkup(showroomSets[0].studio?.name)}</dd></div>
                <div><dt>Profile</dt><dd data-fk-showroom-profile>${escapeMarkup(showroomSets[0].profile)}</dd></div>
                <div><dt>Layouts</dt><dd data-fk-showroom-layouts>${escapeMarkup(showroomSets[0].layouts)}</dd></div>
                <div><dt>Finish</dt><dd data-fk-showroom-finish>${escapeMarkup(showroomSets[0].finish)}</dd></div>
              </dl>
              <p class="fk-showroom-partner-note" data-fk-showroom-partner-note></p>
            </details>
          </article>
          <details class="fk-switch-lab">
            <summary>
              <span>Switch view</span>
              <small data-fk-switch-summary>Solid · RGB off</small>
            </summary>
            <div class="fk-switch-lab-body">
              <div class="fk-switch-presets" role="group" aria-label="Switch style">
                <button type="button" data-fk-switch-preset="crystal-linear" aria-pressed="true" title="Crystal White switch">
                  <span class="fk-switch-chip" data-switch-colour="white" aria-hidden="true"><i></i></span>
                  <span>Crystal<small>White</small></span>
                </button>
                <button type="button" data-fk-switch-preset="ice-tactile" aria-pressed="false" title="Ice Tactile switch">
                  <span class="fk-switch-chip" data-switch-colour="ice" aria-hidden="true"><i></i></span>
                  <span>Ice<small>Tactile</small></span>
                </button>
                <button type="button" data-fk-switch-preset="jade-click" aria-pressed="false" title="Jade Click switch">
                  <span class="fk-switch-chip" data-switch-colour="jade" aria-hidden="true"><i></i></span>
                  <span>Jade<small>Click</small></span>
                </button>
              </div>
              <div class="fk-switch-control-row">
                <span>Keycap</span>
                <div class="fk-switch-segment" role="group" aria-label="Keycap material">
                  <button type="button" data-fk-cap-material="solid" aria-pressed="true">Solid</button>
                  <button type="button" data-fk-cap-material="clear" aria-pressed="false">Clear</button>
                  <button type="button" data-fk-cap-material="frosted" aria-pressed="false">Frosted</button>
                </div>
              </div>
              <div class="fk-switch-control-row">
                <span>Light</span>
                <div class="fk-switch-segment" role="group" aria-label="Switch lighting">
                  <button type="button" data-fk-switch-light="off" aria-pressed="true">Off</button>
                  <button type="button" data-fk-switch-light="on" aria-pressed="false">RGB</button>
                </div>
              </div>
              <div class="fk-switch-control-row">
                <span>Caps</span>
                <div class="fk-switch-segment" role="group" aria-label="Keycap display">
                  <button type="button" data-fk-cap-display="seated" aria-pressed="true">On</button>
                  <button type="button" data-fk-cap-display="lifted" aria-pressed="false">Lift</button>
                  <button type="button" data-fk-cap-display="hidden" aria-pressed="false">Off</button>
                </div>
              </div>
            </div>
          </details>
          <div class="fk-showroom-controls-note" data-fk-showroom-controls-note>
            <strong>Match your keyboard</strong>
            <span>Use the controls below for layout and case finish.</span>
          </div>
          <p class="fk-status" data-fk-status aria-live="polite">Loading the first showroom set...</p>
        </div>
      </details>
      <div class="fk-design-actions" aria-label="Your keyboard design">
        <small data-fk-design-save-state aria-live="polite">Loading design...</small>
        <button type="button" class="fk-button secondary" data-fk-design-share title="Copy a link to this design">Share design</button>
        <button type="button" class="fk-button secondary" data-fk-design-new title="Start again with the first keycap set">Start new</button>
        <input data-fk-design-link aria-label="Design share link" readonly hidden>
        <a class="fk-button full fk-showroom-quote" data-fk-showroom-quote href="../support.html#quote" target="_parent">Ask about it</a>
      </div>
    `;
    document.body.appendChild(panel);
    mountShowroomPanel(panel);
    document.body.classList.add("fk-curated-set-active");

    const sceneControls = document.createElement("fieldset");
    sceneControls.className = "fk-scene-controls";
    sceneControls.innerHTML = `<legend>Background</legend><div class="fk-scene-swatches">${[["#b7d0c4", "Sage"], ["#e8ebed", "Silver"], ["#24282b", "Graphite"], ["#ccdce6", "Ice"], ["#ddd4e5", "Lilac"]].map(([color, name]) => `<button type="button" data-scene-color="${color}" style="background:${color}" aria-label="${name} background" title="${name}" aria-pressed="false"></button>`).join("")}<input type="color" aria-label="Custom background colour" value="#b7d0c4" title="Custom colour"></div>`;
    panel.querySelector(".fk-panel-body").prepend(sceneControls);
    const sceneStore = window.ForgeKeysStore;
    const setBackground = (color) => {
      if (!/^#[0-9a-f]{6}$/i.test(color)) return;
      sceneStore.dispatch({ type: "settings/setSceneColor", payload: color });
      sceneStore.dispatch({ type: "settings/setSceneAutoColor", payload: false });
      scheduleDesignSave();
    };
    const syncBackground = () => {
      const settings = sceneStore.getState().settings;
      sceneControls.querySelector("input").value = settings.sceneColor;
      sceneControls.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", String(!settings.sceneAutoColor && button.dataset.sceneColor === settings.sceneColor)));
    };
    sceneControls.querySelectorAll("button").forEach(button => button.addEventListener("click", () => setBackground(button.dataset.sceneColor)));
    sceneControls.querySelector("input").addEventListener("input", event => setBackground(event.target.value));
    sceneStore.subscribe(syncBackground);
    setBackground("#b7d0c4");
    syncBackground();

    panel.querySelectorAll("[data-fk-showroom-thumb]").forEach((thumbnail) => {
      const set = showroomSets[Number(thumbnail.dataset.fkShowroomThumb)];
      if (set?.productThumbnailUrl) thumbnail.style.backgroundImage = `url("${set.productThumbnailUrl}")`;
    });
    panel.querySelectorAll("[data-fk-mix-thumb]").forEach((thumbnail) => {
      const set = showroomSets[Number(thumbnail.dataset.fkMixThumb)];
      if (set?.productThumbnailUrl) thumbnail.style.backgroundImage = `url("${set.productThumbnailUrl}")`;
    });

    panel.querySelectorAll("[data-fk-showroom-set]").forEach((button) => {
      button.addEventListener("click", () => {
        const set = showroomSets[Number(button.dataset.fkShowroomSet)];
        if (set) loadShowroomSet(panel, set, button);
      });
    });
    panel.querySelectorAll("[data-fk-showroom-mode]").forEach((button) => {
      button.addEventListener("click", () => setShowroomMode(panel, button.dataset.fkShowroomMode));
    });
    const editorTab = document.querySelector('#sidebar [role="tab"][aria-controls="react-tabs-3"]');
    if (editorTab) {
      editorTab.addEventListener("click", () => {
        if (state.showroomMode !== "original") setShowroomMode(panel, "original");
      });
    }
    panel.querySelector("[data-fk-showroom-quote]").addEventListener("click", (event) => openDesignQuote(event, panel));
    wireSwitchDisplayControls(panel);
    wireMixControls(panel);
    wireDesignControls(panel);
    const firstButton = panel.querySelector('[data-fk-showroom-set="0"]');
    const ids = showroomSets.map((set) => set.id);
    const sharedToken = new URLSearchParams(designHost().location.hash.slice(1)).get("design");
    let saved = null;
    if (sharedToken) saved = window.ForgeKeysDesign.decode(sharedToken, ids);
    const invalidShare = sharedToken && !saved;
    if (!saved) { try { saved = window.ForgeKeysDesign.read(window.localStorage, ids); } catch {} }
    const initialIndex = saved ? showroomSets.findIndex((set) => set.id === saved.set) : 0;
    await loadShowroomSet(panel, showroomSets[initialIndex], panel.querySelector(`[data-fk-showroom-set="${initialIndex}"]`) || firstButton, saved);
    if (invalidShare) setStatus("This design link is invalid or outdated. Your saved design has not been discarded.", "error");
    showroomPanelBuilding = false;
  };

  const buildPanel = () => {
    if (document.querySelector("[data-fk-customizer-root]")) return;
    const panel = document.createElement("section");
    panel.className = "fk-customizer fk-sidebar-module";
    panel.setAttribute("data-fk-customizer-root", "");
    panel.setAttribute("aria-label", "ForgeKey Studio AU keycap image customizer");

    panel.innerHTML = `
      <details class="fk-shell-details">
      <summary>ForgeKey Studio AU artwork quote</summary>
      <div class="fk-panel-head">
        <div class="fk-panel-title">
          <span class="fk-brand-badge">ForgeKey Studio AU</span>
          <strong>Custom Keycap Quote</strong>
          <span>Upload. Direction. Quote.</span>
        </div>
      </div>
      <div class="fk-panel-body">
        <div class="fk-step-row" aria-label="Customizer steps">
          <span>1 Upload</span>
          <span>2 Direction</span>
          <span>3 Quote</span>
        </div>
        <details class="fk-details fk-details-compact">
          <summary>Choose direction</summary>
          <label class="fk-field">Artwork type
            <select data-fk-artwork-type>
              <option value="photo">Photo / portrait / pet</option>
              <option value="logo">Logo / brand mark</option>
              <option value="illustration">Illustration / artwork</option>
              <option value="pattern">Pattern / texture</option>
              <option value="desk">Desk setup photo</option>
            </select>
          </label>
          <label class="fk-field">Preview style
            <select data-fk-style-preset>
              <option value="feature">Feature key</option>
              <option value="accent">Accent key set</option>
              <option value="soft">Soft colour theme</option>
              <option value="desk">Desk colour match</option>
              <option value="full">Full print concept</option>
            </select>
          </label>
          <p class="fk-guide" data-fk-guide>${presetCopy.feature}</p>
        </details>
        <div class="fk-samples" aria-label="Curated design directions">
          <span>Directions</span>
          ${sampleArtworks.map((sample, index) => `
            <button class="fk-sample" type="button" data-fk-sample="${index}" title="${sample.description}" aria-label="${sample.label}: ${sample.description}">
              <span class="fk-sample-thumb" style="background-image: url('${sample.url}')"></span>
              <span>${sample.label}</span>
            </button>
          `).join("")}
        </div>
        <div class="fk-section">
          <span class="fk-kicker">Artwork</span>
        <label class="fk-field">Main artwork <span>Fills the large keys. JPG / PNG / WebP, max 3 MB</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" data-fk-base>
        </label>
        <label class="fk-field">Extra references <span>Optional logos, colours, or desk photos. Up to 2.</span>
          <input type="file" multiple accept="image/png,image/jpeg,image/webp" data-fk-accents>
        </label>
        <div class="fk-assets" data-fk-assets></div>
        </div>
        <details class="fk-details">
          <summary>Fine tune one key</summary>
        <label class="fk-field">Apply main artwork
          <select data-fk-base-mode>
            <option value="spacebar">Spacebar only</option>
            <option value="mods">Modifiers only</option>
            <option value="alphas">Letters only</option>
            <option value="full">Full keyboard</option>
            <option value="none">Do not use main artwork</option>
          </select>
        </label>
        <div class="fk-row">
          <label class="fk-field">Key
            <select data-fk-key>
              ${keyOptions.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}
            </select>
          </label>
          <label class="fk-field">Accent
            <select data-fk-accent-select></select>
          </label>
        </div>
        <label class="fk-field">Placement
          <select data-fk-placement>
            <option value="center">Centered icon</option>
            <option value="full">Full key print</option>
            <option value="spacebar">Spacebar feature</option>
          </select>
        </label>
        <div class="fk-row">
          <label class="fk-field">Scale <input type="range" min="25" max="180" value="85" data-fk-scale></label>
          <label class="fk-field">Rotate <input type="range" min="-90" max="90" value="0" data-fk-rotate></label>
        </div>
        <div class="fk-row">
          <label class="fk-field">Move X <input type="range" min="-45" max="45" value="0" data-fk-x></label>
          <label class="fk-field">Move Y <input type="range" min="-45" max="45" value="0" data-fk-y></label>
        </div>
        <div class="fk-actions">
          <button class="fk-button" type="button" data-fk-apply>Apply to selected key</button>
          <button class="fk-button secondary" type="button" data-fk-clear-key>Clear key</button>
          <button class="fk-button secondary full" type="button" data-fk-clear-all>Reset design</button>
        </div>
        </details>
        <div class="fk-quote-card">
        <div class="fk-quote-head">
          <strong>Send artwork for quote</strong>
          <span>We refine the design before production. No payment now.</span>
        </div>
        <label class="fk-field">Name
          <input type="text" data-fk-name placeholder="Customer name">
        </label>
        <label class="fk-field">Email
          <input type="email" data-fk-email placeholder="name@example.com">
        </label>
        <label class="fk-field">Confirm email
          <input type="email" data-fk-confirm-email placeholder="Enter your email again">
        </label>
        <label class="fk-field">Instagram / social handle
          <input type="text" data-fk-instagram placeholder="@username">
        </label>
        <label class="fk-field">Layout notes
          <input type="text" data-fk-keyboard placeholder="75%, TKL, Alice, keyboard model...">
        </label>
        <label class="fk-field">Notes
          <textarea data-fk-notes placeholder="Theme, budget, deadline, legends, material..."></textarea>
        </label>
        <label class="fk-consent">
          <input type="checkbox" data-fk-rights>
          <span>I can use the material I send, understand this is a quote request, and have read the <a href="../privacy.html" target="_parent">Privacy Policy</a> and <a href="../custom-order-policy.html" target="_parent">Custom Order Policy</a>.</span>
        </label>
        <div class="fk-turnstile" data-fk-turnstile hidden aria-label="Human verification"></div>
        <button class="fk-button full" type="button" data-fk-submit>Send request</button>
        </div>
        <p class="fk-status" data-fk-status>Upload artwork or choose a direction sample.</p>
      </div>
      </details>
    `;
    document.body.appendChild(panel);

    const ensureSimulatorControlsToggle = (tabsRoot, panelElement) => {
      if (!tabsRoot || document.querySelector("[data-fk-sim-toggle]")) {
        return;
      }
      const toggle = document.createElement("div");
      toggle.className = "fk-sim-controls-card";
      toggle.setAttribute("data-fk-sim-toggle", "");
      toggle.innerHTML = `
        <div>
          <strong>Keyboard colour simulator</strong>
          <span>Layouts, colourways, case colours and typing test.</span>
        </div>
        <button type="button" data-fk-sim-toggle-button>Hide</button>
      `;
      if (panelElement?.parentElement === tabsRoot.parentElement) {
        panelElement.insertAdjacentElement("afterend", toggle);
      } else {
        tabsRoot.insertAdjacentElement("beforebegin", toggle);
      }
      const button = toggle.querySelector("[data-fk-sim-toggle-button]");
      button.addEventListener("click", () => {
        const collapsed = document.body.classList.toggle("fk-sim-controls-collapsed");
        button.textContent = collapsed ? "Show" : "Hide";
        window.dispatchEvent(new Event("resize"));
      });
    };

    const mountInsideOriginalSidebar = () => {
      const sidebar = document.querySelector("#sidebar");
      if (!sidebar || sidebar.contains(panel)) {
        const tabsRoot = sidebar?.querySelector(".react-tabs");
        ensureSimulatorControlsToggle(tabsRoot, panel);
        return !!sidebar;
      }
      const tabsRoot = sidebar.querySelector(".react-tabs");
      if (tabsRoot?.parentElement) {
        tabsRoot.insertAdjacentElement("beforebegin", panel);
        ensureSimulatorControlsToggle(tabsRoot, panel);
      } else {
        sidebar.appendChild(panel);
      }
      document.body.classList.add("fk-sidebar-mounted");
      window.dispatchEvent(new Event("resize"));
      return true;
    };

    if (!mountInsideOriginalSidebar()) {
      let mountAttempts = 0;
      const mountTimer = window.setInterval(() => {
        mountAttempts += 1;
        if (mountInsideOriginalSidebar() || mountAttempts > 80) {
          window.clearInterval(mountTimer);
        }
      }, 150);
    }

    panel.querySelector("[data-fk-base-mode]").addEventListener("change", (event) => {
      state.baseMode = event.target.value;
      refreshTextures();
    });
    panel.querySelector("[data-fk-artwork-type]").addEventListener("change", (event) => {
      state.artworkType = event.target.value;
      const recommended = {
        illustration: "accent",
        pattern: "soft",
        photo: "feature",
        logo: "accent",
        desk: "desk",
      }[state.artworkType] || "feature";
      applyDesignPreset(panel, recommended, { type: state.artworkType });
      setStatus(`Direction: ${panel.querySelector("[data-fk-style-preset]").selectedOptions[0]?.textContent || "Custom"}.`, "info");
    });
    panel.querySelector("[data-fk-style-preset]").addEventListener("change", (event) => {
      applyDesignPreset(panel, event.target.value);
      setStatus(`Direction: ${event.target.selectedOptions[0]?.textContent || "Custom"}.`, "info");
    });
    panel.querySelectorAll("[data-fk-sample]").forEach((button) => {
      button.addEventListener("click", async () => {
        const sample = sampleArtworks[Number(button.dataset.fkSample)];
        if (!sample) return;
        try {
          setStatus("Loading sample artwork...", "info");
          const asset = await loadSampleArtwork(sample);
          state.baseImage = asset.image;
          state.baseFile = asset.file;
          state.baseAsset = asset;
          applyDesignPreset(panel, sample.preset, { type: sample.type });
          if (sample.opacity) {
            state.baseOpacity = sample.opacity;
          }
          panel.querySelectorAll("[data-fk-sample]").forEach((sampleButton) => {
            sampleButton.classList.toggle("is-active", sampleButton === button);
          });
          setStatus(`Direction loaded: ${sample.label}.`, "success");
          refreshTextures();
        } catch (error) {
          setStatus(error.message, "error");
        }
      });
    });
    panel.querySelector("[data-fk-base]").addEventListener("change", async (event) => {
      try {
        const files = Array.from(event.target.files || []);
        validateImageFiles(files);
        const asset = await loadImageFile(files[0]);
        state.baseImage = asset.image;
        state.baseFile = asset.file;
        state.baseAsset = asset;
        trackDesignerEvent("artwork_selected", { count: 1 });
        applyDesignPreset(panel, "feature", { type: "photo" });
        panel.querySelectorAll("[data-fk-sample]").forEach((sampleButton) => {
          sampleButton.classList.remove("is-active");
        });
        setStatus(`Loaded: ${asset.name}. Filled the large keys for preview.`, "success");
        refreshTextures();
      } catch (error) {
        event.target.value = "";
        setStatus(error.message, "error");
      }
    });
    panel.querySelector("[data-fk-accents]").addEventListener("change", async (event) => {
      try {
        const files = Array.from(event.target.files || []);
        validateImageFiles(files);
        if (files.length > maxAccentFiles || state.accents.length + files.length > maxAccentFiles) {
          throw new Error(`Choose no more than ${maxAccentFiles} extra reference images.`);
        }
        const loaded = await Promise.all(files.map(loadImageFile));
        state.accents.push(...loaded);
        state.selectedAccent = state.selectedAccent || state.accents[0] || null;
        trackDesignerEvent("artwork_selected", { count: loaded.length });
        renderAssets();
        setStatus(`${loaded.length} reference image${loaded.length === 1 ? "" : "s"} loaded.`, "success");
      } catch (error) {
        event.target.value = "";
        setStatus(error.message, "error");
      }
    });
    panel.querySelector("[data-fk-accent-select]").addEventListener("change", (event) => {
      state.selectedAccent = state.accents[Number(event.target.value)] || null;
      renderAssets();
    });
    panel.querySelector("[data-fk-apply]").addEventListener("click", () => {
      if (!state.selectedAccent) {
        setStatus("Upload and select an accent image first.", "error");
        return;
      }
      const code = panel.querySelector("[data-fk-key]").value;
      state.placements[code] = {
        image: state.selectedAccent.image,
        name: state.selectedAccent.name,
        mode: panel.querySelector("[data-fk-placement]").value,
        scale: Number(panel.querySelector("[data-fk-scale]").value),
        rotation: Number(panel.querySelector("[data-fk-rotate]").value),
        x: Number(panel.querySelector("[data-fk-x]").value),
        y: Number(panel.querySelector("[data-fk-y]").value),
      };
      setStatus(`Placed ${state.selectedAccent.name} on ${code}.`, "success");
      refreshTextures();
    });
    panel.querySelector("[data-fk-clear-key]").addEventListener("click", () => {
      const code = panel.querySelector("[data-fk-key]").value;
      delete state.placements[code];
      setStatus(`Cleared artwork from ${code}.`, "info");
      refreshTextures();
    });
    panel.querySelector("[data-fk-clear-all]").addEventListener("click", () => {
      state.baseImage = null;
      state.baseFile = null;
      state.baseAsset = null;
      state.placements = {};
      applyDesignPreset(panel, "feature", { type: "photo" });
      setStatus("Reset. Upload artwork or choose a direction sample.", "info");
      refreshTextures();
    });
    panel.querySelector("[data-fk-submit]").addEventListener("click", () => submitRequest(panel));

    if (protectedSubmissionEnabled) {
      window.ForgeKeysTurnstile?.mount(panel.querySelector("[data-fk-turnstile]"), {
        theme: "dark",
        expiredCallback: () => setStatus("Human verification expired. Please complete it again.", "info"),
        errorCallback: () => setStatus("Human verification could not be loaded. Refresh and try again.", "error"),
      }).catch((error) => {
        console.error("ForgeKeys verification failed to load", error);
        setStatus("Human verification could not be loaded. Refresh and try again.", "error");
      });
    }

    refreshTextures();
  };

  const installLayoutSelectBridge = () => {
    let lastDispatchLayout = "";
    let lastDispatchAt = 0;
    const handleLayoutSelect = (event) => {
        document.documentElement.dataset.fkLayoutBridgeEvent = `${event.type}:${event.target?.className || event.target?.tagName || ""}`;
        const option = event.target.closest?.(".SelectField_option__2kNtf, .SelectField_optionSelected__XrQNN");
        if (!option) {
          return;
        }
        const field = option.closest(".SelectField_field__2C-ap");
        const label = field?.querySelector("label")?.textContent?.trim();
        const layout = option.dataset.val;
        const store = window.ForgeKeysStore || window.globalThis?.ForgeKeysStore || document.ForgeKeysStore;
        if (label !== "Layout" || !layout || !store?.dispatch) {
          if (label === "Layout" && layout) {
            document.documentElement.dataset.fkLayoutBridgeMiss = layout;
          }
          return;
        }
        const now = performance.now();
        if (layout === lastDispatchLayout && now - lastDispatchAt < 400) return;
        lastDispatchLayout = layout;
        lastDispatchAt = now;
        delete document.documentElement.dataset.fkLayoutBridgeMiss;
        store.dispatch({ type: "case/setLayout", payload: layout });
        document.documentElement.dataset.fkLayoutBridgeLast = layout;
        window.dispatchEvent(new Event("resize"));
        schedule75KnobSync(360);
        if (isShowroomMode) {
          scheduleSwitchPresentation(480);
          // A layout change replaces the live key meshes. Reapply the active
          // set after React finishes the swap so old key-size diagnostics and
          // textures cannot survive from the previous layout.
          window.setTimeout(refreshTextures, 520);
          window.setTimeout(() => {
            const panel = document.querySelector("[data-fk-customizer-root]");
            if (panel) {
              if (!liveMixKeyForCode(state.showroomMixSelectedKey)) state.showroomMixSelectedKey = "KC_ESC";
              updateMixControlState(panel);
              refreshMixCompatibility(panel);
            }
          }, 540);
          if (activeShowroomSet?.id === "FK-KC-003" && state.showroomMode === "set") {
            window.setTimeout(() => applySceneView(showroomSceneView(activeShowroomSet, layout)), 520);
          }
        }
    };
    ["pointerdown", "mousedown", "click"].forEach((type) => {
      document.addEventListener(type, handleLayoutSelect, true);
    });
  };

  installLayoutSelectBridge();
  install75KnobStoreSync();

  const buildActivePanel = isShowroomMode ? buildShowroomPanel : buildPanel;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildActivePanel);
  } else {
    buildActivePanel();
  }
})();
