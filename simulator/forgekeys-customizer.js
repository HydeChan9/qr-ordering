(function () {
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
    ["KC_LEFT", "Left Arrow"],
    ["KC_DOWN", "Down Arrow"],
    ["KC_RGHT", "Right Arrow"],
    ["KC_UP", "Up Arrow"],
    ["KC_DEL", "Delete"],
    ["KC_PGUP", "Page Up"],
    ["KC_PGDN", "Page Down"],
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
  };

  const config = window.FORGEKEYS_CONFIG || {};
  const maxUploadBytes = config.maxUploadBytes || 5 * 1024 * 1024;
  const acceptedMimeTypes = config.acceptedMimeTypes || ["image/jpeg", "image/png", "image/webp"];
  const isEmbedMode = new URLSearchParams(window.location.search).get("embed") === "1";
  if (isEmbedMode) {
    document.body.classList.add("fk-embed-mode");
  }

  const boundsMap = {
    "60": { width: 15, height: 5 },
    "65": { width: 16, height: 5 },
    "75": { width: 16, height: 6 },
    "80": { width: 18, height: 6 },
    "96": { width: 19, height: 6 },
    "100": { width: 22.5, height: 6 },
  };

  const sampleVersion = "display-stable11";
  const sampleUrl = (fileName) => `../assets/customizer-samples/${fileName}?v=${sampleVersion}`;

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

  const refreshTextures = () => {
    document.dispatchEvent(new CustomEvent("force_key_material_update"));
  };

  window.ForgeKeysKeycapTextures = {
    state,
    draw(ctx, canvas, opts) {
      drawBaseArtwork(ctx, canvas, opts);
      drawAccent(ctx, canvas, opts);
      if (!state.keepLegends && !document.body.classList.contains("fk-advanced-open")) {
        opts.legend = "";
      }
    },
    refresh: refreshTextures,
  };

  const safeFileName = (name) =>
    (name || "upload")
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/-+/g, "-")
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

  const rasterizeSvgSample = (blob, name) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(blob);
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || 1800;
        canvas.height = image.naturalHeight || 900;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#f6f2ea";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          (jpegBlob) => {
            if (!jpegBlob) {
              reject(new Error("Could not prepare sample artwork."));
              return;
            }
            const fileName = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`;
            resolve(loadImageFile(makeFileFromBlob(jpegBlob, fileName)));
          },
          "image/jpeg",
          0.9
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
        return rasterizeSvgSample(blob, sample.label);
      }
      const extension = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const file = makeFileFromBlob(blob, `${sample.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${extension}`);
      return loadImageFile(file);
    } catch (error) {
      return loadSampleViaImage(sample);
    }
  };

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

  const installSceneFallback = () => {
    const wrapper = document.querySelector("#canvas-wrapper");
    if (!wrapper) {
      window.setTimeout(installSceneFallback, 250);
      return;
    }

    if (!wrapper.querySelector(".fk-scene-fallback")) {
      const fallback = document.createElement("div");
      fallback.className = "fk-scene-fallback";
      fallback.setAttribute("aria-hidden", "true");
      wrapper.appendChild(fallback);
    }

    let attempts = 0;
    const checkCanvas = () => {
      attempts += 1;
      const canvas = wrapper.querySelector("canvas");
      let hasKeyboard = false;

      if (canvas && canvas.width && canvas.height) {
        try {
          const probe = document.createElement("canvas");
          probe.width = Math.max(1, Math.floor(canvas.width / 3));
          probe.height = Math.max(1, Math.floor(canvas.height / 3));
          const ctx = probe.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(canvas, 0, 0, probe.width, probe.height);
          hasKeyboard = previewHasKeyboardPixels(ctx, probe.width, probe.height);
        } catch (error) {
          hasKeyboard = false;
        }
      }

      document.body.classList.toggle("fk-scene-fallback-active", !hasKeyboard && attempts >= 8);
      if (hasKeyboard) {
        document.body.classList.remove("fk-scene-fallback-active");
      }
      if (!hasKeyboard && attempts < 30) {
        window.setTimeout(checkCanvas, 500);
      }
    };

    window.setTimeout(checkCanvas, 800);
    window.addEventListener("resize", () => {
      attempts = 0;
      document.body.classList.remove("fk-scene-fallback-active");
      window.setTimeout(checkCanvas, 500);
    });
  };

  const sceneManager = () => window.ForgeKeysSceneManager || null;

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
    return {
      orderId: submissionId,
      submittedAt: new Date().toISOString(),
      source: "ForgeKeys 3D Custom Designer",
      layoutCrop: panel.querySelector("[data-fk-bounds]").selectedOptions[0]?.textContent || "",
      baseArtworkMode: state.baseMode,
      artworkType: state.artworkType,
      stylePreset: state.stylePreset,
      requestMode: state.baseAsset || state.accents.length ? "artwork-submission" : "brief-only",
      baseArtwork: state.baseAsset
        ? { name: state.baseAsset.name, size: state.baseAsset.size, type: state.baseAsset.type }
        : null,
      accentImages: state.accents.map((asset) => ({ name: asset.name, size: asset.size, type: asset.type })),
      accentPlacements: placements,
      customer: {
        name: panel.querySelector("[data-fk-name]").value.trim(),
        email: normalizeEmail(panel.querySelector("[data-fk-email]").value),
        instagram: panel.querySelector("[data-fk-instagram]").value.trim(),
        keyboardModel: panel.querySelector("[data-fk-keyboard]").value.trim(),
        notes: panel.querySelector("[data-fk-notes]").value.trim(),
      },
      productionNotes: {
        material: "Factory to advise",
        finish: "Matte preview",
        printMethod: "Factory to advise",
        warning: "Preview is for quoting. ForgeKeys AU must verify final production templates, safe area, bleed, material, and source resolution before manufacturing.",
      },
    };
  };

  const setSubmitBusy = (panel, busy) => {
    const button = panel.querySelector("[data-fk-submit]");
    if (!button) return;
    button.disabled = busy;
    button.textContent = busy ? "Sending..." : "Send request";
  };

  const submitRequest = async (panel) => {
    const name = panel.querySelector("[data-fk-name]").value.trim();
    const emailField = panel.querySelector("[data-fk-email]");
    const email = normalizeEmail(emailField.value);
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
    const submissionId = `FK-${Date.now()}`;
    const folder = `${config.supabaseFolder || "submissions"}/${submissionId}`;
    const design = collectDesignData(panel, submissionId);
    setSubmitBusy(panel, true);
    setStatus("Submitting design files...", "info");
    try {
      if (state.baseAsset?.file) {
        await uploadToSupabaseStorage(`${folder}/main-artwork-${safeFileName(state.baseAsset.name)}`, state.baseAsset.file, state.baseAsset.type);
      }
      for (let index = 0; index < state.accents.length; index += 1) {
        const asset = state.accents[index];
        await uploadToSupabaseStorage(`${folder}/accents/${String(index + 1).padStart(2, "0")}-${safeFileName(asset.name)}`, asset.file, asset.type);
      }
      const customerPreviewBlob = await canvasBlob();
      await uploadToSupabaseStorage(`${folder}/preview-customer-view.png`, customerPreviewBlob, "image/png");
      const standardPreviewBlob = await standardCanvasBlob();
      await uploadToSupabaseStorage(`${folder}/preview-standard.png`, standardPreviewBlob, "image/png");
      await uploadToSupabaseStorage(`${folder}/preview.png`, standardPreviewBlob, "image/png");
      const json = JSON.stringify(design, null, 2);
      await uploadToSupabaseStorage(`${folder}/design.json`, new Blob([json], { type: "application/json" }), "application/json");
      await uploadToSupabaseStorage(`${folder}/01-order-details.json`, new Blob([json], { type: "application/json" }), "application/json");
      await uploadToSupabaseStorage(
        `${folder}/00-read-me-first.txt`,
        new Blob([
          [
            `ForgeKeys AU custom designer submission: ${submissionId}`,
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
      setStatus(`Request submitted. Reference ${submissionId}. We will reply by email with the next step.`, "success");
    } catch (error) {
      console.error("ForgeKeys upload failed", error);
      if (error.status === 403) {
        setStatus("Upload is blocked by the site storage settings. Please contact ForgeKeys and quote this page.", "error");
      } else {
        setStatus("Upload failed. Please check your connection and try again.", "error");
      }
    } finally {
      setSubmitBusy(panel, false);
    }
  };

  const syncBodyPanelState = (panel) => {
    document.body.classList.toggle("fk-panel-collapsed", panel.classList.contains("is-collapsed"));
    window.dispatchEvent(new Event("resize"));
  };

  const buildPanel = () => {
    const isMobileView = window.matchMedia("(max-width: 900px)").matches;
    if (isMobileView && !document.body.dataset.fkMobileMode) {
      document.body.dataset.fkMobileMode = "preview";
    }

    const panel = document.createElement("section");
    panel.className = `fk-customizer${isMobileView ? " is-collapsed" : ""}`;
    panel.setAttribute("aria-label", "ForgeKeys keycap image customizer");
    const advancedControls = `
        <div class="fk-advanced-card">
          <strong>${isEmbedMode ? "Advanced keyboard setup" : "Fine tune layout"}</strong>
          <span>${isEmbedMode ? "Open the original keyboard layout, case, colourway, and tester-style controls when needed." : "Original layout, case, and colourway controls."}</span>
          <button class="fk-button secondary full" type="button" data-fk-advanced-toggle>Open layout controls</button>
        </div>
      `;

    panel.innerHTML = `
      <div class="fk-panel-head">
        <div class="fk-panel-title">
          <span class="fk-brand-badge">ForgeKeys AU</span>
          <strong>Custom Keycap Quote</strong>
          <span>Upload. Direction. Quote.</span>
        </div>
        <button class="fk-toggle" type="button" data-fk-toggle>Hide</button>
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
        <label class="fk-field">Extra references <span>Optional logos, colours, desk photos.</span>
          <input type="file" multiple accept="image/png,image/jpeg,image/webp" data-fk-accents>
        </label>
        <div class="fk-assets" data-fk-assets></div>
        <label class="fk-field">Layout
          <select data-fk-bounds>
            <option value="75">75% / 75% + Knob</option>
            <option value="80">80% / TKL</option>
            <option value="65">65%</option>
            <option value="60">60%</option>
            <option value="100">Full size</option>
            <option value="96">96%</option>
          </select>
        </label>
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
        ${advancedControls}
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
        <label class="fk-field">Instagram / social handle
          <input type="text" data-fk-instagram placeholder="@username">
        </label>
        <label class="fk-field">Layout notes
          <input type="text" data-fk-keyboard placeholder="75%, TKL, Alice, keyboard model...">
        </label>
        <label class="fk-field">Notes
          <textarea data-fk-notes placeholder="Theme, budget, deadline, legends, material..."></textarea>
        </label>
        <button class="fk-button full" type="button" data-fk-submit>Send request</button>
        </div>
        <p class="fk-status" data-fk-status>Upload artwork or choose a direction sample.</p>
      </div>
    `;
    document.body.appendChild(panel);

    const syncPanelCollapsed = () => {
      syncBodyPanelState(panel);
    };

    const setAdvancedOpen = (open) => {
      document.body.classList.toggle("fk-advanced-open", open);
      const advancedToggle = panel.querySelector("[data-fk-advanced-toggle]");
      if (advancedToggle) {
        advancedToggle.textContent = open ? "Hide layout controls" : "Open layout controls";
      }
      refreshTextures();
      window.dispatchEvent(new Event("resize"));
    };

    const setMobileMode = (mode) => {
      document.body.dataset.fkMobileMode = mode;
      if (mode === "edit") {
        panel.classList.remove("is-collapsed");
        panel.querySelector("[data-fk-toggle]").textContent = "Hide";
      } else {
        panel.classList.add("is-collapsed");
        panel.querySelector("[data-fk-toggle]").textContent = "Edit";
      }
      syncPanelCollapsed();
    };

    if (isMobileView) {
      document.body.dataset.fkMobileMode = "preview";
      panel.classList.remove("is-collapsed");
      panel.querySelector("[data-fk-toggle]").textContent = "Hide";
      syncPanelCollapsed();
    }

    panel.querySelector("[data-fk-toggle]").addEventListener("click", (event) => {
      panel.classList.toggle("is-collapsed");
      event.currentTarget.textContent = panel.classList.contains("is-collapsed") ? "Edit" : "Hide";
      syncPanelCollapsed();
      if (window.matchMedia("(max-width: 900px)").matches) {
        setMobileMode(panel.classList.contains("is-collapsed") ? "preview" : "edit");
      }
    });
    const advancedToggle = panel.querySelector("[data-fk-advanced-toggle]");
    if (advancedToggle) {
      advancedToggle.addEventListener("click", () => {
        setAdvancedOpen(!document.body.classList.contains("fk-advanced-open"));
      });
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
    panel.querySelector("[data-fk-bounds]").addEventListener("change", (event) => {
      state.bounds = boundsMap[event.target.value] || boundsMap["75"];
      setStatus(`Layout: ${event.target.options[event.target.selectedIndex].textContent}.`, "info");
      refreshTextures();
    });
    panel.querySelector("[data-fk-base]").addEventListener("change", async (event) => {
      try {
        const files = Array.from(event.target.files || []);
        validateImageFiles(files);
        const asset = await loadImageFile(files[0]);
        state.baseImage = asset.image;
        state.baseFile = asset.file;
        state.baseAsset = asset;
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
        const loaded = await Promise.all(files.map(loadImageFile));
        state.accents.push(...loaded);
        state.selectedAccent = state.selectedAccent || state.accents[0] || null;
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

    let cameraAttempts = 0;
    const fitCustomerPreview = () => {
      cameraAttempts += 1;
      const manager = sceneManager();
      if (manager?.camera && manager?.controls) {
        const compactPreview = window.matchMedia("(max-width: 900px)").matches;
        manager.camera.position.set(0, compactPreview ? 18 : 15, compactPreview ? 24 : 15);
        manager.controls.target.set(0, 0, 0);
        manager.controls.update();
        window.dispatchEvent(new Event("resize"));
        return;
      }
      if (cameraAttempts < 40) {
        window.setTimeout(fitCustomerPreview, 250);
      }
    };
    fitCustomerPreview();
    installSceneFallback();
    refreshTextures();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildPanel);
  } else {
    buildPanel();
  }
})();
