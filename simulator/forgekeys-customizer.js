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
    baseMode: "full",
    accents: [],
    selectedAccent: null,
    placements: {},
    bounds: { width: 16, height: 6 },
    keepLegends: true,
  };

  const config = window.FORGEKEYS_CONFIG || {};
  const maxUploadBytes = config.maxUploadBytes || 5 * 1024 * 1024;
  const acceptedMimeTypes = config.acceptedMimeTypes || ["image/jpeg", "image/png", "image/webp"];

  const boundsMap = {
    "60": { width: 15, height: 5 },
    "65": { width: 16, height: 5 },
    "75": { width: 16, height: 6 },
    "80": { width: 18, height: 6 },
    "96": { width: 19, height: 6 },
    "100": { width: 22.5, height: 6 },
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
    ctx.globalAlpha = 0.88;
    ctx.drawImage(state.baseImage, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
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
      if (!state.keepLegends) {
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

  const loadImageFile = (file) =>
    new Promise((resolve, reject) => {
      if (!file || !acceptedMimeTypes.includes(file.type)) {
        reject(new Error("Please upload an image file."));
        return;
      }
      if (file.size > maxUploadBytes) {
        reject(new Error(`Image is over ${Math.round(maxUploadBytes / 1024 / 1024)} MB. Use a smaller preview file.`));
        return;
      }
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => resolve({ image, url, name: file.name, size: file.size, type: file.type, file });
      image.onerror = () => reject(new Error("Could not read image."));
      image.src = url;
    });

  const setStatus = (message, tone = "info") => {
    const status = document.querySelector("[data-fk-status]");
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
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

  const canvasBlob = async () => {
    await waitForPaint();
    return new Promise((resolve, reject) => {
      const canvas = document.querySelector("#canvas-wrapper canvas");
      if (!canvas) {
        reject(new Error("Preview canvas is not ready yet."));
        return;
      }
      const output = document.createElement("canvas");
      output.width = canvas.width;
      output.height = canvas.height;
      const ctx = output.getContext("2d");
      ctx.fillStyle = "#202024";
      ctx.fillRect(0, 0, output.width, output.height);
      ctx.drawImage(canvas, 0, 0);
      output.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not create preview image."));
      }, "image/png");
    });
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
    button.textContent = busy ? "Submitting..." : "Submit custom request";
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
    if (!state.baseAsset && state.accents.length === 0) {
      setStatus("Please upload at least one artwork image before submitting.", "error");
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
      const previewBlob = await canvasBlob();
      await uploadToSupabaseStorage(`${folder}/preview.png`, previewBlob, "image/png");
      const json = JSON.stringify(design, null, 2);
      await uploadToSupabaseStorage(`${folder}/design.json`, new Blob([json], { type: "application/json" }), "application/json");
      await uploadToSupabaseStorage(`${folder}/01-order-details.json`, new Blob([json], { type: "application/json" }), "application/json");
      await uploadToSupabaseStorage(
        `${folder}/00-read-me-first.txt`,
        new Blob([
          [
            `ForgeKeys AU custom designer submission: ${submissionId}`,
            "",
            "Open preview.png first to see the customer's visual direction.",
            "Original uploaded artwork files are included as main-artwork-* and accents/*.",
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

  const buildPanel = () => {
    const panel = document.createElement("section");
    panel.className = "fk-customizer";
    panel.setAttribute("aria-label", "ForgeKeys keycap image customizer");
    panel.innerHTML = `
      <div class="fk-panel-head">
        <div class="fk-panel-title">
          <strong>ForgeKeys Texture Test</strong>
          <span>Full board image + per-key accents</span>
        </div>
        <button class="fk-toggle" type="button" data-fk-toggle>Hide</button>
      </div>
      <div class="fk-panel-body">
        <label class="fk-field">Main artwork
          <input type="file" accept="image/png,image/jpeg,image/webp" data-fk-base>
        </label>
        <label class="fk-field">Apply main artwork to
          <select data-fk-base-mode>
            <option value="full">Full keyboard</option>
            <option value="alphas">Letters only</option>
            <option value="mods">Modifiers only</option>
            <option value="spacebar">Spacebar only</option>
            <option value="none">Do not use main artwork</option>
          </select>
        </label>
        <label class="fk-field">Artwork layout crop
          <select data-fk-bounds>
            <option value="75">75% / 75% + Knob</option>
            <option value="80">80% / TKL</option>
            <option value="65">65%</option>
            <option value="60">60%</option>
            <option value="100">Full size</option>
            <option value="96">96%</option>
          </select>
        </label>
        <label class="fk-field">Accent images
          <input type="file" multiple accept="image/png,image/jpeg,image/webp" data-fk-accents>
        </label>
        <div class="fk-assets" data-fk-assets></div>
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
          <button class="fk-button" type="button" data-fk-apply>Place on key</button>
          <button class="fk-button secondary" type="button" data-fk-clear-key>Clear key</button>
          <button class="fk-button secondary full" type="button" data-fk-clear-all>Clear all artwork</button>
        </div>
        <p class="fk-help">First choose a layout from the left panel. Use one main image for the board, then add small assets to individual keys.</p>
        <label class="fk-field">Name
          <input type="text" data-fk-name placeholder="Customer name">
        </label>
        <label class="fk-field">Email
          <input type="email" data-fk-email placeholder="name@example.com">
        </label>
        <label class="fk-field">Instagram / social handle
          <input type="text" data-fk-instagram placeholder="@username">
        </label>
        <label class="fk-field">Keyboard model or layout notes
          <input type="text" data-fk-keyboard placeholder="75%, TKL, Alice, keyboard model...">
        </label>
        <label class="fk-field">Request notes
          <textarea data-fk-notes placeholder="Tell us the theme, budget, deadline, legends, material, or factory notes."></textarea>
        </label>
        <button class="fk-button full" type="button" data-fk-submit>Submit custom request</button>
        <p class="fk-status" data-fk-status>Upload a main artwork or accent image to start.</p>
      </div>
    `;
    document.body.appendChild(panel);

    if (window.matchMedia("(max-width: 760px)").matches) {
      panel.classList.add("is-collapsed");
      panel.querySelector("[data-fk-toggle]").textContent = "Edit";
    }

    panel.querySelector("[data-fk-toggle]").addEventListener("click", (event) => {
      panel.classList.toggle("is-collapsed");
      event.currentTarget.textContent = panel.classList.contains("is-collapsed") ? "Edit" : "Hide";
    });
    panel.querySelector("[data-fk-base-mode]").addEventListener("change", (event) => {
      state.baseMode = event.target.value;
      refreshTextures();
    });
    panel.querySelector("[data-fk-bounds]").addEventListener("change", (event) => {
      state.bounds = boundsMap[event.target.value] || boundsMap["75"];
      setStatus(`Artwork crop changed to ${event.target.options[event.target.selectedIndex].textContent}.`, "info");
      refreshTextures();
    });
    panel.querySelector("[data-fk-base]").addEventListener("change", async (event) => {
      try {
        const asset = await loadImageFile(event.target.files[0]);
        state.baseImage = asset.image;
        state.baseFile = asset.file;
        state.baseAsset = asset;
        setStatus(`Main artwork loaded: ${asset.name}`, "success");
        refreshTextures();
      } catch (error) {
        setStatus(error.message, "error");
      }
    });
    panel.querySelector("[data-fk-accents]").addEventListener("change", async (event) => {
      try {
        const files = Array.from(event.target.files || []);
        const loaded = await Promise.all(files.map(loadImageFile));
        state.accents.push(...loaded);
        state.selectedAccent = state.selectedAccent || state.accents[0] || null;
        renderAssets();
        setStatus(`${loaded.length} accent image${loaded.length === 1 ? "" : "s"} loaded.`, "success");
      } catch (error) {
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
      setStatus("Cleared all preview artwork.", "info");
      refreshTextures();
    });
    panel.querySelector("[data-fk-submit]").addEventListener("click", () => submitRequest(panel));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildPanel);
  } else {
    buildPanel();
  }
})();
