const appConfig = window.FORGEKEYS_CONFIG || {};
const maxUploadBytes = appConfig.maxUploadBytes || 3 * 1024 * 1024;
const acceptedMimeTypes = appConfig.acceptedMimeTypes || ["image/jpeg", "image/png", "image/webp"];
const canvas = document.getElementById("keycapCanvas");
const ctx = canvas.getContext("2d");
const upload = document.getElementById("imageUpload");
const assetList = document.getElementById("assetList");
const selectedAssetStatus = document.getElementById("selectedAssetStatus");
const statusText = document.getElementById("uploadStatus");
const selectionStatus = document.getElementById("selectionStatus");
const designSummary = document.getElementById("designSummary");
const selectedKeyInfo = document.getElementById("selectedKeyInfo");
const orderStatus = document.getElementById("orderStatus");
const submitButton = document.getElementById("submitRequest");
const stickyPreview = document.querySelector(".sticky-preview");
const previewDragHandle = document.getElementById("previewDragHandle");
const previewZoomIn = document.getElementById("previewZoomIn");
const previewZoomOut = document.getElementById("previewZoomOut");
const previewZoomLabel = document.getElementById("previewZoomLabel");

const controls = {
  layoutMode: document.getElementById("layoutMode"),
  applyMode: document.getElementById("applyMode"),
  demoStyle: document.getElementById("demoStyle"),
  photoMode: document.getElementById("photoMode"),
  profile: document.getElementById("profile"),
  material: document.getElementById("material"),
  printMethod: document.getElementById("printMethod"),
  finish: document.getElementById("finish"),
  baseColor: document.getElementById("baseColor"),
  legendText: document.getElementById("legendText"),
  textColor: document.getElementById("textColor"),
  imageScale: document.getElementById("imageScale"),
  imageX: document.getElementById("imageX"),
  imageY: document.getElementById("imageY"),
  imageRotate: document.getElementById("imageRotate"),
  keyLegend: document.getElementById("keyLegend"),
  keyColor: document.getElementById("keyColor"),
  keyImageScale: document.getElementById("keyImageScale"),
  keyImageX: document.getElementById("keyImageX"),
  keyImageY: document.getElementById("keyImageY"),
  keyImageRotate: document.getElementById("keyImageRotate"),
  keyPlacement: document.getElementById("keyPlacement"),
  customerName: document.getElementById("customerName"),
  customerEmail: document.getElementById("customerEmail"),
  customerEmailConfirm: document.getElementById("customerEmailConfirm"),
  keyboardModel: document.getElementById("keyboardModel"),
  customerNotes: document.getElementById("customerNotes")
};

const state = {
  assets: [],
  selectedAsset: 0,
  selectedKey: "single",
  assignments: new Map(),
  keyStyles: new Map(),
  boardArtMode: "",
  boardArtworkAsset: 0,
  previewZoom: 1,
  keys: []
};

const productionDefaults = {
  switchMount: "MX cross stem",
  nominalUnitMm: 19.05,
  nominalOneUCapMm: "18.0 x 18.0 mm top footprint, manufacturer template required",
  safePrintArea: "Keep critical artwork inside the factory safe area; request exact bleed and trim template before production",
  artworkResolution: "300 DPI at final print size recommended for raster artwork; do not upscale screenshots",
  sourceFileFormats: "Production source should be transparent PNG, SVG, PDF, AI, or EPS where available",
  colourMatching: "Factory to match HEX as close as possible; Pantone or physical references recommended for final order",
  deliverables: "Watermarked proof PNG, customer summary, original source images, and factory template mapping prepared by ForgeKeys AU"
};

function safeFileName(name) {
  return (name || "upload")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90) || "upload";
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

function canvasBlob(type = "image/png") {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type);
  });
}

function setOrderStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error-text", isError);
  if (orderStatus) {
    orderStatus.textContent = message;
    orderStatus.classList.toggle("error-text", isError);
  }
}

function setSubmitBusy(isBusy) {
  if (!submitButton) return;
  submitButton.disabled = isBusy;
  submitButton.textContent = isBusy ? "Submitting..." : "Submit Design Request";
}

const emailDomainCorrections = {
  "gmail.con": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gnail.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlook.con": "outlook.com",
  "icloud.con": "icloud.com",
  "yahoo.con": "yahoo.com",
  "qq.con": "qq.com",
  "163.con": "163.com"
};

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function emailLooksValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

function emailCorrection(email) {
  const [local, domain] = normalizeEmail(email).split("@");
  if (!local || !domain) return "";
  const correctedDomain = emailDomainCorrections[domain];
  return correctedDomain ? `${local}@${correctedDomain}` : "";
}

const demoArtwork = [
  {
    name: "demo-soft-board-wash.svg",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 720"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f7efe2"/><stop offset="0.52" stop-color="#dcebd5"/><stop offset="1" stop-color="#f8d9d5"/></linearGradient><radialGradient id="glow" cx="50%" cy="45%" r="55%"><stop stop-color="#ffffff" stop-opacity=".82"/><stop offset=".58" stop-color="#cce7c3" stop-opacity=".36"/><stop offset="1" stop-color="#f5c7ce" stop-opacity=".16"/></radialGradient></defs><rect width="1600" height="720" fill="url(#bg)"/><rect width="1600" height="720" fill="url(#glow)"/><g opacity=".18" fill="none" stroke="#315f7d" stroke-width="5"><path d="M145 580C360 260 565 612 790 300s454 60 640-178"/><path d="M116 320c240-142 410-80 620 42s398 148 730-70"/></g><g opacity=".2" fill="#78a86d"><circle cx="260" cy="180" r="46"/><circle cx="1210" cy="450" r="62"/><circle cx="930" cy="122" r="30"/></g></svg>`
  },
  {
    name: "demo-butterfly-transparent.svg",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420"><defs><linearGradient id="wing" x1="0" x2="1"><stop stop-color="#7edc77"/><stop offset=".48" stop-color="#f7f0de"/><stop offset="1" stop-color="#315f7d"/></linearGradient></defs><rect width="420" height="420" fill="none"/><g transform="translate(210 212)"><path d="M-14-68c-48-98-154-112-168-32-13 78 54 126 150 90 18-7 26-25 18-58Z" fill="url(#wing)" stroke="#25282a" stroke-width="10" stroke-linejoin="round"/><path d="M14-68c48-98 154-112 168-32 13 78-54 126-150 90-18-7-26-25-18-58Z" fill="url(#wing)" stroke="#25282a" stroke-width="10" stroke-linejoin="round"/><path d="M-18 2c-55 22-92 84-48 119 48 38 104-17 78-91-6-17-15-25-30-28Z" fill="#f5d7d2" stroke="#25282a" stroke-width="10" stroke-linejoin="round"/><path d="M18 2c55 22 92 84 48 119-48 38-104-17-78-91 6-17 15-25 30-28Z" fill="#f5d7d2" stroke="#25282a" stroke-width="10" stroke-linejoin="round"/><path d="M0-80c18 42 20 123 0 184" stroke="#25282a" stroke-width="16" stroke-linecap="round"/><path d="M-9-74c-24-40-62-58-96-52M9-74c24-40 62-58 96-52" stroke="#25282a" stroke-width="9" stroke-linecap="round"/><circle cx="-68" cy="-82" r="9" fill="#25282a"/><circle cx="68" cy="-82" r="9" fill="#25282a"/></g></svg>`
  },
  {
    name: "demo-leaf-novelty-transparent.svg",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420"><rect width="420" height="420" fill="none"/><g fill="none" stroke="#25282a" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"><path d="M95 270c88-24 172-90 220-188 28 122-35 220-164 230"/><path d="M136 282c44-70 94-121 156-164"/><path d="M152 238c-28-12-51-14-76-8M198 190c-20-20-42-31-70-38M244 148c0-28-8-51-24-76"/></g><circle cx="310" cy="284" r="28" fill="#78e36d" stroke="#25282a" stroke-width="10"/><circle cx="96" cy="128" r="18" fill="#f5d7d2" stroke="#25282a" stroke-width="8"/></svg>`
  }
];

const layoutRows = {
  "40": [
    ["Esc", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["Tab:1.25", "A", "S", "D", "F", "G", "H", "J", "K", "L", "Enter:1.75"],
    ["Shift:1.75", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "Shift:1.25"],
    ["Ctrl:1.25", "Alt:1.25", "Space:3", "Fn:1.25", "Lower:1.25", "Raise:1.25"]
  ],
  "60": [
    ["Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Back:2"],
    ["Tab:1.5", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\:1.5"],
    ["Caps:1.75", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter:2.25"],
    ["Shift:2.25", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift:2.75"],
    ["Ctrl:1.25", "Win:1.25", "Alt:1.25", "Space:6.25", "Alt:1.25", "Fn:1.25", "Menu:1.25", "Ctrl:1.25"]
  ],
  "65": [
    ["Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Back:2", "Del"],
    ["Tab:1.5", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\:1.5", "PgUp"],
    ["Caps:1.75", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter:2.25", "PgDn"],
    ["Shift:2.25", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift:1.75", "Up", "End"],
    ["Ctrl:1.25", "Win:1.25", "Alt:1.25", "Space:6.25", "Alt:1.25", "Fn:1.25", "Left", "Down", "Right"]
  ],
  "75": [
    ["Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Del"],
    ["Tab:1.5", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[:1", "]:1", "\\:1.5"],
    ["Caps:1.75", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter:2.25"],
    ["Shift:2.25", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift:1.75", "Up"],
    ["Ctrl:1.25", "Win:1.25", "Alt:1.25", "Space:6.25", "Alt:1.25", "Fn:1.25", "Left", "Down", "Right"]
  ],
  "80": [
    ["Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Prt", "Scr", "Pause"],
    ["`:1", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Back:2", "Ins", "Home"],
    ["Tab:1.5", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\:1.5", "Del", "End"],
    ["Caps:1.75", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter:2.25", "PgUp"],
    ["Shift:2.25", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift:2.75", "Up", "PgDn"],
    ["Ctrl:1.25", "Win:1.25", "Alt:1.25", "Space:6.25", "Alt:1.25", "Fn:1.25", "Menu:1.25", "Ctrl:1.25", "Left", "Down", "Right"]
  ],
  "96": [
    ["Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Back:2", "Num", "/", "*", "-"],
    ["Tab:1.5", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\:1.5", "7", "8", "9", "+"],
    ["Caps:1.75", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter:2.25", "4", "5", "6", "+"],
    ["Shift:2.25", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift:1.75", "Up", "1", "2", "3", "Enter"],
    ["Ctrl:1.25", "Win:1.25", "Alt:1.25", "Space:6.25", "Alt:1.25", "Fn:1.25", "Left", "Down", "Right", "0:2", "."]
  ],
  "100": [
    ["Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Prt", "Scr", "Pause"],
    ["`:1", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Back:2", "Ins", "Home", "PgUp", "Num", "/", "*", "-"],
    ["Tab:1.5", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\:1.5", "Del", "End", "PgDn", "7", "8", "9", "+"],
    ["Caps:1.75", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter:2.25", "4", "5", "6", "+"],
    ["Shift:2.25", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift:2.75", "Up", "1", "2", "3", "Enter"],
    ["Ctrl:1.25", "Win:1.25", "Alt:1.25", "Space:6.25", "Alt:1.25", "Fn:1.25", "Menu:1.25", "Ctrl:1.25", "Left", "Down", "Right", "0:2", "."]
  ],
  "alice": [
    ["Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Back:2"],
    ["Tab:1.5", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\:1.5"],
    ["Caps:1.75", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter:2.25"],
    ["Shift:2.25", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift:1.75", "Up"],
    ["Ctrl:1.25", "Win:1.25", "Alt:1.25", "Space:2.25", "Space:2.75", "Alt:1.25", "Fn:1.25", "Left", "Down", "Right"]
  ],
  "numpad": [
    ["Esc", "Num", "/", "*"],
    ["7", "8", "9", "-"],
    ["4", "5", "6", "+"],
    ["1", "2", "3", "Enter"],
    ["0:2", "."]
  ]
};

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function parseKey(token, rowIndex, index) {
  const [label, unitValue] = token.split(":");
  return {
    id: `${rowIndex}-${index}-${label}`,
    label,
    unit: Number(unitValue || 1)
  };
}

function createKeys() {
  if (controls.layoutMode.value === "single") {
    state.keys = [{ id: "single", label: controls.legendText.value || "FK", x: 420, y: 126, w: 440, h: 360, single: true }];
    state.selectedKey = "single";
    return;
  }

  const rows = layoutRows[controls.layoutMode.value] || layoutRows["75"];
  const layout = controls.layoutMode.value;
  if (layout === "alice") {
    createAliceKeys();
    if (!state.keys.some((key) => key.id === state.selectedKey)) {
      state.selectedKey = state.keys[0].id;
    }
    return;
  }
  createStandardKeys(layout, rows);

  if (!state.keys.some((key) => key.id === state.selectedKey)) {
    state.selectedKey = state.keys[0].id;
  }
}

const layoutSpacing = {
  "40": {
    startY: 166,
    sectionGaps: {},
    rowOffsets: [0, 0, 0, 0]
  },
  "60": {
    startY: 136,
    sectionGaps: {},
    rowOffsets: [0, 0, 0, 0, 0]
  },
  "65": {
    startY: 132,
    sectionGaps: {
      0: { 13: 0.45 },
      1: { 13: 0.45 },
      2: { 12: 0.45 },
      3: { 11: 0.45 },
      4: { 5: 0.45 }
    },
    rowOffsets: [0, 0, 0, 0, 0]
  },
  "75": {
    startY: 126,
    sectionGaps: {
      0: { 12: 0.45 },
      1: { 13: 0.45 },
      2: { 12: 0.45 },
      3: { 11: 0.45 },
      4: { 5: 0.45 }
    },
    rowOffsets: [0, 0, 0, 0, 0]
  },
  "80": {
    startY: 94,
    sectionGaps: {
      0: { 0: 0.55, 4: 0.55, 8: 0.55, 12: 0.55 },
      1: { 13: 0.75 },
      2: { 13: 0.75 },
      3: { 12: 0.75 },
      4: { 11: 0.75, 12: 0.25 },
      5: { 7: 0.75 }
    },
    rowOffsets: [0, 0, 0, 0, 0, 0]
  },
  "96": {
    startY: 128,
    sectionGaps: {
      0: { 13: 0.35 },
      1: { 13: 0.35 },
      2: { 12: 0.35 },
      3: { 12: 0.35 },
      4: { 8: 0.35 }
    },
    rowOffsets: [0, 0, 0, 0, 0]
  },
  "100": {
    startY: 94,
    sectionGaps: {
      0: { 0: 0.55, 4: 0.55, 8: 0.55, 12: 0.55 },
      1: { 13: 0.7, 16: 0.7 },
      2: { 13: 0.7, 16: 0.7 },
      3: { 12: 0.7, 15: 0.7 },
      4: { 11: 0.7, 12: 0.25, 15: 0.7 },
      5: { 7: 0.7, 10: 0.7 }
    },
    rowOffsets: [0, 0, 0, 0, 0, 0]
  },
  numpad: {
    startY: 140,
    sectionGaps: {},
    rowOffsets: [0, 0, 0, 0, 0]
  }
};

function rowWidthUnits(row, rowIndex, spacing) {
  const sectionGaps = spacing.sectionGaps[rowIndex] || {};
  return row.reduce((sum, token, index) => {
    const key = parseKey(token, rowIndex, index);
    return sum + key.unit + (sectionGaps[index] || 0);
  }, Math.max(0, (row.length - 1) * 0.12));
}

function createStandardKeys(layout, rows) {
  const spacing = layoutSpacing[layout] || layoutSpacing["75"];
  const maxUnits = Math.max(...rows.map((row, index) => rowWidthUnits(row, index, spacing) + (spacing.rowOffsets[index] || 0)));
  const unit = Math.min(62, Math.floor((canvas.width - 108) / maxUnits));
  const gap = Math.max(5, unit * 0.12);
  const keyHeight = Math.min(54, Math.max(40, unit * 0.86));
  const rowGap = layout === "80" || layout === "100" ? 10 : 12;
  const startX = (canvas.width - (maxUnits * unit + (maxUnits - 1) * gap * 0.12)) / 2;

  state.keys = [];
  rows.forEach((row, rowIndex) => {
    const parsed = row.map((token, index) => parseKey(token, rowIndex, index));
    const extraGaps = spacing.sectionGaps[rowIndex] || {};
    let x = startX + (spacing.rowOffsets[rowIndex] || 0) * unit;
    const y = spacing.startY + rowIndex * (keyHeight + rowGap);
    parsed.forEach((key, index) => {
      const w = key.unit * unit + Math.max(0, key.unit - 1) * gap;
      state.keys.push({ ...key, x, y, w, h: keyHeight, angle: 0 });
      x += w + gap + (extraGaps[index] || 0) * unit;
    });
  });
}

function createAliceKeys() {
  const unit = 49;
  const gap = 6;
  const keyHeight = 46;
  const centerX = canvas.width / 2;
  const startY = 112;
  const leftRows = [
    ["Esc", "F1", "F2", "F3", "F4", "F5"],
    ["`:1", "1", "2", "3", "4", "5"],
    ["Tab:1.5", "Q", "W", "E", "R", "T"],
    ["Caps:1.75", "A", "S", "D", "F", "G"],
    ["Shift:2.25", "Z", "X", "C", "V", "B"],
    ["Ctrl:1.25", "Win:1.25", "Alt:1.25", "Space:2.25"]
  ];
  const rightRows = [
    ["F6", "F7", "F8", "F9", "F10", "F11", "F12"],
    ["6", "7", "8", "9", "0", "-", "=", "Back:2"],
    ["Y", "U", "I", "O", "P", "[", "]", "\\:1.5"],
    ["H", "J", "K", "L", ";", "'", "Enter:2.25"],
    ["B", "N", "M", ",", ".", "/", "Shift:1.75"],
    ["Space:2.75", "Alt:1.25", "Fn:1.25"]
  ];
  state.keys = [];

  const placeHalf = (rows, side) => {
    const direction = side === "left" ? 1 : -1;
    const rowAngles = [3.75, 5.4, 6.35, 6.55, 6.25, 4.9];
    const rowInnerGaps = [34, 46, 60, 74, 92, 118];
    const rowStaggers = [-8, -2, 7, 17, 30, 48];
    const rowYCurve = [-8, -2, 4, 8, 11, 6];
    const origin = {
      x: side === "left" ? centerX - 16 : centerX + 16,
      y: startY + 176
    };
    rows.forEach((row, rowIndex) => {
      const parsed = row.map((token, index) => parseKey(token, rowIndex, index));
      const width = parsed.reduce((sum, key) => sum + key.unit * unit, 0) + (parsed.length - 1) * gap;
      const angle = rowAngles[rowIndex] * direction;
      const innerGap = rowInnerGaps[rowIndex];
      const rowStagger = rowStaggers[rowIndex];
      let x = side === "left"
        ? centerX - innerGap - width - rowStagger
        : centerX + innerGap + rowStagger;
      const y = startY + rowIndex * (keyHeight + 14) + rowYCurve[rowIndex];
      parsed.forEach((key, index) => {
        const w = key.unit * unit;
        const idLabel = side === "right" && key.label === "B" ? "B2" : key.label;
        const rotated = rotatePoint(x + w / 2, y + keyHeight / 2, origin.x, origin.y, angle);
        state.keys.push({
          ...key,
          id: `${side}-${rowIndex}-${index}-${idLabel}`,
          label: idLabel,
          x: rotated.x - w / 2,
          y: rotated.y - keyHeight / 2,
          w,
          h: keyHeight,
          angle
        });
        x += w + gap;
      });
    });
  };

  placeHalf(leftRows, "left");
  placeHalf(rightRows, "right");

  state.keys.push(
    { id: "alice-extra-0-Del", label: "Del", unit: 1, x: centerX + 590, y: startY + 50, w: unit, h: keyHeight, angle: 0 },
    { id: "alice-extra-1-Home", label: "Home", unit: 1, x: centerX + 590, y: startY + 108, w: unit, h: keyHeight, angle: 0 },
    { id: "alice-extra-2-PgUp", label: "PgUp", unit: 1, x: centerX + 590, y: startY + 166, w: unit, h: keyHeight, angle: 0 },
    { id: "alice-extra-3-PgDn", label: "PgDn", unit: 1, x: centerX + 590, y: startY + 224, w: unit, h: keyHeight, angle: 0 }
  );
}

function rotatePoint(x, y, cx, cy, degrees) {
  const angle = degrees * Math.PI / 180;
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: dx * Math.cos(angle) - dy * Math.sin(angle) + cx,
    y: dx * Math.sin(angle) + dy * Math.cos(angle) + cy
  };
}

function isRenderableAsset(asset) {
  return asset?.image?.naturalWidth > 0 || (asset?.image?.width > 0 && asset?.image?.height > 0);
}

function imageSize(asset) {
  return {
    width: asset.image.naturalWidth || asset.image.width,
    height: asset.image.naturalHeight || asset.image.height
  };
}

function drawImageCover(asset, x, y, width, height, scalePercent = 100, offsetX = 0, offsetY = 0, rotateDegrees = 0, alpha = 0.92) {
  if (!isRenderableAsset(asset) || width <= 0 || height <= 0) return;
  const size = imageSize(asset);
  const safeScale = Math.max(0.25, Number(scalePercent) / 100 || 1);
  const coverScale = Math.max(width / size.width, height / size.height) * safeScale;
  const drawW = size.width * coverScale;
  const drawH = size.height * coverScale;

  ctx.save();
  ctx.translate(x + width / 2 + offsetX, y + height / 2 + offsetY);
  ctx.rotate((Number(rotateDegrees) || 0) * Math.PI / 180);
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(asset.image, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

function drawArtworkInKey(key, assetIndex) {
  const asset = state.assets[assetIndex];
  if (!isRenderableAsset(asset)) return;
  const style = state.keyStyles.get(key.id) || {};

  const scale = Number(style.imageScale ?? controls.imageScale.value);
  const offsetX = Number(style.imageX ?? controls.imageX.value) * (key.w / 160);
  const offsetY = Number(style.imageY ?? controls.imageY.value) * (key.h / 100);
  const rotate = Number(style.imageRotate ?? controls.imageRotate.value);

  withKeyTransform(key, () => {
    const inset = key.single ? 14 : 5;
    roundedRect(key.x + inset, key.y + inset, key.w - inset * 2, key.h - inset * 2, key.single ? 34 : 8);
    ctx.clip();
    drawImageCover(asset, key.x + inset, key.y + inset, key.w - inset * 2, key.h - inset * 2, scale, offsetX, offsetY, rotate, 0.9);
  });
}

function withKeyTransform(key, callback) {
  ctx.save();
  const angle = (key.angle || 0) * Math.PI / 180;
  if (angle) {
    ctx.translate(key.x + key.w / 2, key.y + key.h / 2);
    ctx.rotate(angle);
    ctx.translate(-(key.x + key.w / 2), -(key.y + key.h / 2));
  }
  callback();
  ctx.restore();
}

function keyPath(key) {
  roundedRect(key.x + 5, key.y + 5, key.w - 10, key.h - 10, key.single ? 34 : 8);
}

function boardBounds() {
  const minX = Math.min(...state.keys.map((key) => key.x));
  const minY = Math.min(...state.keys.map((key) => key.y));
  const maxX = Math.max(...state.keys.map((key) => key.x + key.w));
  const maxY = Math.max(...state.keys.map((key) => key.y + key.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function drawBoardArtworkInKey(key) {
  if (!state.boardArtMode || !state.assets.length) return;
  const bounds = boardBounds();

  withKeyTransform(key, () => {
    roundedRect(key.x + 5, key.y + 5, key.w - 10, key.h - 10, key.single ? 34 : 8);
    ctx.clip();

    if (state.boardArtMode === "panorama") {
      const asset = state.assets[state.boardArtworkAsset];
      drawImageCover(
        asset,
        bounds.x,
        bounds.y,
        bounds.w,
        bounds.h,
        controls.imageScale.value,
        Number(controls.imageX.value),
        Number(controls.imageY.value),
        Number(controls.imageRotate.value),
        0.92
      );
    }

    if (state.boardArtMode === "collage") {
      const cols = Math.max(1, Math.ceil(Math.sqrt(state.assets.length)));
      const rows = Math.max(1, Math.ceil(state.assets.length / cols));
      const tileW = bounds.w / cols;
      const tileH = bounds.h / rows;
      state.assets.forEach((asset, index) => {
        if (!isRenderableAsset(asset)) return;
        const col = index % cols;
        const row = Math.floor(index / cols);
        const tileX = bounds.x + col * tileW;
        const tileY = bounds.y + row * tileH;
        drawImageCover(asset, tileX, tileY, tileW, tileH, 100, 0, 0, 0, 0.9);
      });
    }
  });
}

function drawKey(key) {
  const style = state.keyStyles.get(key.id) || {};
  const base = style.baseColor || controls.baseColor.value;
  const radius = key.single ? 42 : 9;
  const selected = key.id === state.selectedKey;

  withKeyTransform(key, () => {
    ctx.fillStyle = "rgba(37, 40, 42, 0.12)";
    roundedRect(key.x + 5, key.y + 9, key.w, key.h, radius);
    ctx.fill();

    const gradient = ctx.createLinearGradient(key.x, key.y, key.x + key.w, key.y + key.h);
    gradient.addColorStop(0, "#fffdfa");
    gradient.addColorStop(0.5, base);
    gradient.addColorStop(1, "#c8c0b5");
    ctx.fillStyle = gradient;
    roundedRect(key.x, key.y, key.w, key.h, radius);
    ctx.fill();
  });

  drawBoardArtworkInKey(key);
  const assetIndex = state.assignments.get(key.id);
  drawArtworkInKey(key, assetIndex);

  withKeyTransform(key, () => {
    ctx.strokeStyle = selected ? "#315f7d" : "rgba(37, 40, 42, 0.18)";
    ctx.lineWidth = selected ? 4 : 1.5;
    roundedRect(key.x, key.y, key.w, key.h, radius);
    ctx.stroke();

    const legend = style.legend || (key.single ? (controls.legendText.value || "FK") : key.label);
    ctx.fillStyle = style.legendColor || controls.textColor.value;
    ctx.font = key.single ? "800 64px Inter, system-ui, sans-serif" : "800 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(legend, key.x + key.w / 2, key.y + key.h / 2);
  });
}

function drawCanvas() {
  createKeys();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e8e0d5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawKeyboardCase();

  ctx.fillStyle = "#25282a";
  ctx.font = "900 24px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(layoutTitle(), 44, 56);
  ctx.fillStyle = "#66625b";
  ctx.font = "700 15px Inter, system-ui, sans-serif";
  ctx.fillText("Click a key to select it. Uploaded artwork is clipped to each keycap top.", 44, 84);

  state.keys.forEach(drawKey);
  updateSummary();
}

function drawKeyboardCase() {
  if (!state.keys.length) return;
  if (controls.layoutMode.value === "alice") {
    drawAliceCase();
    return;
  }
  const bounds = boardBounds();
  ctx.save();
  ctx.fillStyle = "rgba(37, 40, 42, 0.08)";
  roundedRect(bounds.x - 24, bounds.y - 24, bounds.w + 48, bounds.h + 48, 22);
  ctx.fill();
  ctx.strokeStyle = "rgba(37, 40, 42, 0.12)";
  ctx.lineWidth = 2;
  roundedRect(bounds.x - 24, bounds.y - 24, bounds.w + 48, bounds.h + 48, 22);
  ctx.stroke();
  ctx.restore();
}

function drawAliceCase() {
  const bounds = boardBounds();
  const padX = 42;
  const padTop = 34;
  const padBottom = 42;
  const valley = 34;
  const left = bounds.x - padX;
  const right = bounds.x + bounds.w + padX;
  const top = bounds.y - padTop;
  const bottom = bounds.y + bounds.h + padBottom;
  const center = canvas.width / 2;
  ctx.save();
  ctx.fillStyle = "rgba(37, 40, 42, 0.08)";
  ctx.beginPath();
  ctx.moveTo(left, top + 42);
  ctx.quadraticCurveTo(bounds.x + 170, top - 16, center - valley, top + 20);
  ctx.quadraticCurveTo(center, top + 48, center + valley, top + 20);
  ctx.quadraticCurveTo(bounds.x + bounds.w - 170, top - 16, right, top + 42);
  ctx.lineTo(right, bottom - 18);
  ctx.quadraticCurveTo(center + 150, bottom + 26, center + 42, bottom - 10);
  ctx.quadraticCurveTo(center, bottom - 26, center - 42, bottom - 10);
  ctx.quadraticCurveTo(center - 150, bottom + 26, left, bottom - 18);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(37, 40, 42, 0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawProofWatermark() {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#25282a";
  ctx.font = "900 28px Inter, system-ui, sans-serif";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 8);
  for (let y = -canvas.height; y < canvas.height; y += 120) {
    for (let x = -canvas.width; x < canvas.width; x += 420) {
      ctx.fillText("FORGEKEYS AU PROOF ONLY", x, y);
    }
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "rgba(37, 40, 42, 0.88)";
  roundedRect(canvas.width - 296, canvas.height - 86, 252, 52, 10);
  ctx.fill();
  ctx.fillStyle = "#fffdf9";
  ctx.font = "900 18px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("ForgeKeys AU", canvas.width - 276, canvas.height - 54);
  ctx.font = "800 11px Inter, system-ui, sans-serif";
  ctx.fillText("WATERMARKED CUSTOMER PROOF", canvas.width - 276, canvas.height - 34);
  ctx.restore();
}

function keyProductionRecord(key) {
  const assetIndex = state.assignments.get(key.id);
  const asset = state.assets[assetIndex];
  const legend = key.single ? (controls.legendText.value || "FK") : key.label;
  const style = state.keyStyles.get(key.id) || {};
  return {
    keyId: key.id,
    legend: style.legend || legend,
    unitWidth: key.unit || 1,
    profile: controls.profile.value,
    row: key.id.split("-")[0] || "single",
    material: controls.material.value,
    productionMethod: controls.printMethod.value,
    finish: controls.finish.value,
    baseColor: style.baseColor || controls.baseColor.value,
    legendColor: style.legendColor || controls.textColor.value,
    assignedArtwork: asset?.name || "",
    boardArtworkMode: state.boardArtMode || "",
    boardArtworkFile: state.boardArtMode === "panorama" ? state.assets[state.boardArtworkAsset]?.name || "" : state.boardArtMode === "collage" ? "collage of uploaded assets" : "",
    artworkScalePercent: Number(style.imageScale ?? controls.imageScale.value),
    artworkOffsetX: Number(style.imageX ?? controls.imageX.value),
    artworkOffsetY: Number(style.imageY ?? controls.imageY.value),
    artworkRotationDegrees: Number(style.imageRotate ?? controls.imageRotate.value),
    capPositionPx: { x: Math.round(key.x), y: Math.round(key.y), width: Math.round(key.w), height: Math.round(key.h) },
    angleDegrees: key.angle || 0,
    nominalWidthMm: Number(((key.unit || 1) * productionDefaults.nominalUnitMm).toFixed(2)),
    notes: asset ? "Artwork clipped to printable top face in proof." : "No artwork assigned; legend/base colour only."
  };
}

function productionSpec() {
  createKeys();
  return {
    project: "ForgeKeys AU custom keycap factory pack",
    generatedAt: new Date().toISOString(),
    layout: layoutTitle(),
    manufacturingAssumptions: productionDefaults,
    globalOptions: {
      profile: controls.profile.value,
      material: controls.material.value,
      productionMethod: controls.printMethod.value,
      finish: controls.finish.value,
      baseColor: controls.baseColor.value,
      legendText: controls.legendText.value,
      legendColor: controls.textColor.value,
      imageScalePercent: Number(controls.imageScale.value),
      imageOffsetX: Number(controls.imageX.value),
      imageOffsetY: Number(controls.imageY.value),
      imageRotationDegrees: Number(controls.imageRotate.value)
    },
    boardArtwork: {
      mode: state.boardArtMode || "per-key",
      panoramaFile: state.boardArtMode === "panorama" ? state.assets[state.boardArtworkAsset]?.name || "" : "",
      collageFiles: state.boardArtMode === "collage" ? state.assets.map((asset) => asset.name) : []
    },
    assets: state.assets.map((asset, index) => ({
      assetIndex: index,
      fileName: asset.name,
      sourceType: "customer upload",
      embeddedPreviewDataUrl: asset.src
    })),
    keys: state.keys.map(keyProductionRecord),
    factoryChecklist: [
      "Confirm exact keycap profile rows and mould availability.",
      "Confirm stem type and keyboard compatibility before production.",
      "Confirm print method supports selected artwork coverage and colours.",
      "Ask factory for bleed, safe area, and DPI template before final print.",
      "Approve physical sample before batch production."
    ]
  };
}

function submissionSpec() {
  const spec = productionSpec();
  return {
    ...spec,
    assets: state.assets.map((asset, index) => ({
      assetIndex: index,
      fileName: asset.name,
      sourceType: asset.demo ? "demo asset" : "customer upload",
      uploadedToStorage: true
    }))
  };
}

async function uploadToSupabaseStorage(config, path, body, contentType) {
  const baseUrl = config.supabaseUrl?.replace(/\/$/, "");
  const bucket = config.supabaseBucket || "design-submissions";
  const url = `${baseUrl}/storage/v1/object/${bucket}/${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      "Content-Type": contentType,
      "x-upsert": "false"
    },
    body
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase upload failed ${response.status}: ${message}`);
  }
  return path;
}

async function uploadSubmissionToSupabase(config, submissionId, summary, customer) {
  if (!config.supabaseUrl || !config.supabaseAnonKey || !config.supabaseBucket) {
    throw new Error("Supabase config is missing. Add supabaseUrl, supabaseAnonKey, and supabaseBucket in site-config.js.");
  }

  const folder = `${config.supabaseFolder || "submissions"}/${submissionId}`;
  const uploadedAssets = [];
  const customerAssets = state.assets
    .map((asset, assetIndex) => ({ asset, assetIndex }))
    .filter(({ asset }) => !asset.demo);

  statusText.textContent = "Uploading original artwork files...";
  for (const [uploadIndex, { asset, assetIndex }] of customerAssets.entries()) {
    const fileName = `${String(uploadIndex + 1).padStart(2, "0")}-${safeFileName(asset.name)}`;
    const body = asset.file || dataUrlToBlob(asset.src);
    const contentType = asset.file?.type || body.type || "application/octet-stream";
    const path = `${folder}/originals/${fileName}`;
    await uploadToSupabaseStorage(config, path, body, contentType);
    uploadedAssets.push({
      assetIndex,
      fileName: asset.name,
      storagePath: path,
      sourceType: "customer upload"
    });
  }

  statusText.textContent = "Uploading proof image...";
  drawCanvas();
  drawProofWatermark();
  const proof = await canvasBlob("image/png");
  drawCanvas();
  const proofPath = `${folder}/00-open-design-proof.png`;
  const legacyProofPath = `${folder}/proof/forgekeys-proof.png`;
  if (proof) {
    await uploadToSupabaseStorage(config, proofPath, proof, "image/png");
    await uploadToSupabaseStorage(config, legacyProofPath, proof, "image/png");
  }

  const payload = {
    submissionId,
    submittedAt: new Date().toISOString(),
    customer,
    summary,
    pageUrl: window.location.href,
    adminQuickView: {
      openFirst: proofPath,
      originalsFolder: `${folder}/originals/`,
      orderJson: `${folder}/01-order-details.json`,
      legacyProof: legacyProofPath,
      note: "Open 00-open-design-proof.png first to see the customer's visual design. Use originals/ for factory artwork review."
    },
    uploadedAssets,
    spec: submissionSpec()
  };
  const json = JSON.stringify(payload, null, 2);
  const readMe = [
    "FORGEKEYS AU DESIGN REQUEST",
    "",
    "Open first:",
    "00-open-design-proof.png",
    "",
    "Customer:",
    `${customer.name} <${customer.email}>`,
    "",
    "Keyboard model:",
    customer.keyboardModel || "not provided",
    "",
    "Original artwork folder:",
    "originals/",
    "",
    "Order data:",
    "01-order-details.json",
    "",
    "Notes:",
    customer.notes || "none"
  ].join("\n");
  await uploadToSupabaseStorage(config, `${folder}/00-read-me-first.txt`, new Blob([readMe], { type: "text/plain" }), "text/plain");
  await uploadToSupabaseStorage(config, `${folder}/01-order-details.json`, new Blob([json], { type: "application/json" }), "application/json");
  await uploadToSupabaseStorage(config, `${folder}/submission.json`, new Blob([json], { type: "application/json" }), "application/json");
  return { folder, proofPath, uploadedAssets };
}

function layoutTitle() {
  if (controls.layoutMode.value === "40") return "40% compact custom keycap layout";
  if (controls.layoutMode.value === "60") return "60% custom keycap layout";
  if (controls.layoutMode.value === "65") return "65% custom keycap layout";
  if (controls.layoutMode.value === "75") return "75% custom keycap layout";
  if (controls.layoutMode.value === "80") return "80% / TKL custom keycap layout";
  if (controls.layoutMode.value === "96") return "96% compact full-size custom keycap layout";
  if (controls.layoutMode.value === "100") return "100% full-size custom keycap layout";
  if (controls.layoutMode.value === "alice") return "Alice / ergonomic custom keycap layout";
  if (controls.layoutMode.value === "numpad") return "Numpad / macro pad custom keycap layout";
  return "Single custom keycap";
}

function accentKeys() {
  return state.keys.filter((key) => {
    const label = key.label.toLowerCase();
    return key.unit > 1.5 || ["esc", "enter", "space", "del", "up", "down", "left", "right"].includes(label);
  });
}

function applyArtwork() {
  if (!state.assets.length) {
    statusText.textContent = "Upload at least one image before applying artwork.";
    statusText.classList.add("error-text");
    return;
  }

  const mode = controls.applyMode.value;
  if (mode === "selected") {
    state.assignments.set(state.selectedKey, state.selectedAsset);
  }
  if (mode === "all") {
    state.keys.forEach((key) => state.assignments.set(key.id, state.selectedAsset));
  }
  if (mode === "sequence") {
    state.keys.forEach((key, index) => state.assignments.set(key.id, index % state.assets.length));
  }
  if (mode === "accents") {
    accentKeys().forEach((key, index) => state.assignments.set(key.id, index % state.assets.length));
  }
  if (mode === "panorama") {
    state.boardArtMode = "panorama";
    state.boardArtworkAsset = state.selectedAsset;
    state.assignments.clear();
  }
  if (mode === "collage") {
    state.boardArtMode = "collage";
    state.assignments.clear();
  }

  statusText.textContent = "Artwork applied. Click another key or change the layout to keep editing.";
  statusText.classList.remove("error-text");
  drawCanvas();
}

function applyPhotoMode() {
  const asset = state.assets[state.selectedAsset];
  if (!asset) {
    statusText.textContent = "Upload and select a photo or artwork first.";
    statusText.classList.add("error-text");
    return;
  }

  createKeys();
  const mode = controls.photoMode.value;
  state.boardArtMode = "";
  state.assignments.clear();

  if (mode === "full-board") {
    controls.applyMode.value = "panorama";
    controls.imageScale.value = "100";
    controls.imageX.value = "0";
    controls.imageY.value = "0";
    controls.imageRotate.value = "0";
    state.boardArtMode = "panorama";
    state.boardArtworkAsset = state.selectedAsset;
    statusText.textContent = "Photo applied across the full keyboard. Best for mood images, scenery, cars, pets, and illustration backgrounds.";
  }

  if (mode === "spacebar") {
    const target = state.keys.find((key) => key.label === "Space") || state.keys.find((key) => (key.unit || 1) > 2) || state.keys[0];
    if (target) {
      state.selectedKey = target.id;
      state.assignments.set(target.id, state.selectedAsset);
      state.keyStyles.set(target.id, {
        ...(state.keyStyles.get(target.id) || {}),
        imageScale: "68",
        imageX: "0",
        imageY: "0",
        imageRotate: "0",
        legend: ""
      });
    }
    statusText.textContent = "Photo placed on the spacebar or largest key. This is the safest mode for faces, pets, and detailed subjects.";
  }

  if (mode === "selected-key") {
    const selected = state.keys.find((key) => key.id === state.selectedKey) || state.keys[0];
    if (selected) {
      state.selectedKey = selected.id;
      state.assignments.set(selected.id, state.selectedAsset);
      const values = placementValues(selected, "center");
      state.keyStyles.set(selected.id, {
        ...(state.keyStyles.get(selected.id) || {}),
        ...values,
        legend: ""
      });
    }
    statusText.textContent = "Photo cropped into the selected key. Use this for simple icons, logos, pets, and small artwork.";
  }

  if (mode === "soft-accent") {
    controls.imageScale.value = "100";
    state.boardArtMode = "panorama";
    state.boardArtworkAsset = state.selectedAsset;
    accentKeys().forEach((key) => {
      state.keyStyles.set(key.id, { ...(state.keyStyles.get(key.id) || {}), baseColor: "#f8f0e4" });
    });
    statusText.textContent = "Photo used as a soft full-board background with accent keys highlighted. Best when the image is busy.";
  }

  statusText.classList.remove("error-text");
  drawCanvas();
}

function renderAssetList() {
  assetList.innerHTML = "";
  state.assets.forEach((asset, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === state.selectedAsset ? "asset-item active" : "asset-item";
    button.innerHTML = `<img src="${asset.src}" alt=""><span>${asset.name}</span>`;
    button.addEventListener("click", () => {
      state.selectedAsset = index;
      renderAssetList();
      drawCanvas();
    });
    assetList.appendChild(button);
  });
  updateSelectedAssetStatus();
}

function updateSelectedAssetStatus() {
  if (!selectedAssetStatus) return;
  const asset = state.assets[state.selectedAsset];
  selectedAssetStatus.textContent = asset
    ? `Selected image: ${asset.name} (${state.selectedAsset + 1} of ${state.assets.length})`
    : "Selected image: none";
}

function selectRelativeAsset(direction) {
  if (!state.assets.length) {
    statusText.textContent = "Upload more than one image to switch artwork assets.";
    statusText.classList.add("error-text");
    return;
  }
  state.selectedAsset = (state.selectedAsset + direction + state.assets.length) % state.assets.length;
  statusText.textContent = `${state.assets[state.selectedAsset].name} selected.`;
  statusText.classList.remove("error-text");
  renderAssetList();
  drawCanvas();
}

function loadSvgAsset(asset) {
  return new Promise((resolve, reject) => {
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(asset.svg)}`;
    const image = new Image();
    image.onload = () => resolve({ name: asset.name, image, src, demo: true });
    image.onerror = reject;
    image.src = src;
  });
}

async function loadButterflyDemo() {
  const demoStyle = controls.demoStyle.value;
  statusText.textContent = "Loading demo assets...";
  statusText.classList.remove("error-text");
  try {
    controls.layoutMode.value = "75";
    controls.applyMode.value = demoStyle === "panorama" ? "panorama" : "selected";
    controls.baseColor.value = "#f3eee6";
    controls.textColor.value = "#25282a";
    controls.imageScale.value = "100";
    controls.imageX.value = "0";
    controls.imageY.value = "0";
    controls.imageRotate.value = "0";
    controls.keyImageScale.value = "145";
    controls.keyImageX.value = "0";
    controls.keyImageY.value = "0";
    controls.keyImageRotate.value = "0";
    state.assignments.clear();
    state.keyStyles.clear();
    state.boardArtMode = "";
    state.assets = state.assets.filter((asset) => !asset.demo);
    const loaded = await Promise.all(demoArtwork.map(loadSvgAsset));
    state.assets.push(...loaded);
    const backgroundIndex = state.assets.findIndex((asset) => asset.name === "demo-soft-board-wash.svg");
    const butterflyIndex = state.assets.findIndex((asset) => asset.name === "demo-butterfly-transparent.svg");
    const leafIndex = state.assets.findIndex((asset) => asset.name === "demo-leaf-novelty-transparent.svg");
    state.selectedAsset = butterflyIndex;
    createKeys();
    state.boardArtMode = "panorama";
    state.boardArtworkAsset = backgroundIndex;
    state.keys.forEach((key) => {
      const label = key.label.toLowerCase();
      const accent = key.unit > 1.5 || ["esc", "enter", "del", "up", "down", "left", "right"].includes(label);
      if (accent) {
        state.keyStyles.set(key.id, { baseColor: "#f1eadf" });
      }
    });

    if (demoStyle === "novelty") {
      const butterflyTargets = ["Esc", "Enter", "Del"];
      const leafTargets = ["Tab", "Caps", "Shift", "Fn"];
      state.keys.forEach((key) => {
        if (butterflyTargets.includes(key.label)) {
          state.assignments.set(key.id, butterflyIndex);
          state.keyStyles.set(key.id, { ...(state.keyStyles.get(key.id) || {}), imageScale: key.label === "Enter" ? "105" : "118", imageX: "0", imageY: "0", imageRotate: key.label === "Enter" ? "8" : "0", legend: "" });
        }
        if (leafTargets.includes(key.label)) {
          state.assignments.set(key.id, leafIndex);
          state.keyStyles.set(key.id, { ...(state.keyStyles.get(key.id) || {}), imageScale: "82", imageX: "18", imageY: "12", imageRotate: key.label === "Shift" ? "-8" : "0", legend: "" });
        }
      });
      statusText.textContent = "Demo 1 loaded: closest style for the homepage look. It uses a soft board wash plus butterfly novelty keys.";
    }

    if (demoStyle === "panorama") {
      state.keys.forEach((key) => {
        const label = key.label.toLowerCase();
        if (["esc", "enter", "space", "del"].includes(label) || key.unit > 1.5) {
          state.keyStyles.set(key.id, { ...(state.keyStyles.get(key.id) || {}), baseColor: "#fff7ec" });
        }
      });
      statusText.textContent = "Demo 2 loaded: full-board artwork wash. This is best for subtle background graphics, not detailed butterflies.";
    }

    if (demoStyle === "spacebar") {
      state.keys.forEach((key) => {
        if (key.label === "Space") {
          state.assignments.set(key.id, butterflyIndex);
          state.keyStyles.set(key.id, { ...(state.keyStyles.get(key.id) || {}), imageScale: "68", imageX: "0", imageY: "0", imageRotate: "0", legend: "" });
        }
        if (["Esc", "Del", "Enter"].includes(key.label)) {
          state.assignments.set(key.id, leafIndex);
          state.keyStyles.set(key.id, { ...(state.keyStyles.get(key.id) || {}), imageScale: "82", imageX: "0", imageY: "0", imageRotate: key.label === "Enter" ? "10" : "0", legend: "" });
        }
      });
      statusText.textContent = "Demo 3 loaded: butterfly spacebar feature with smaller accent icons.";
    }

    renderAssetList();
    drawCanvas();
  } catch {
    statusText.textContent = "Demo assets could not load in this browser. Try uploading transparent PNG artwork instead.";
    statusText.classList.add("error-text");
  }
}

function setupPreviewDrag() {
  if (!stickyPreview || !previewDragHandle) return;
  stickyPreview.classList.remove("floating", "dragging", "pinned");
  stickyPreview.style.left = "";
  stickyPreview.style.top = "";
  stickyPreview.style.right = "";
}

function setPreviewZoom(nextZoom) {
  if (!stickyPreview) return;
  state.previewZoom = Math.min(1.25, Math.max(0.75, nextZoom));
  canvas.style.width = `${Math.round(state.previewZoom * 100)}%`;
  if (previewZoomLabel) {
    previewZoomLabel.textContent = `${Math.round(state.previewZoom * 100)}%`;
  }
}

function updateSummary() {
  const selected = state.keys.find((key) => key.id === state.selectedKey);
  const assignedCount = [...state.assignments.keys()].filter((id) => state.keys.some((key) => key.id === id)).length;
  selectionStatus.textContent = `${layoutTitle()}. Selected key: ${selected?.label || "none"}. ${assignedCount} key${assignedCount === 1 ? "" : "s"} have artwork assigned.`;
  updateSelectedKeyPanel(selected);
  const spec = productionSpec();
  designSummary.value = [
    "CUSTOMER DESIGN SUMMARY",
    `Layout: ${spec.layout}`,
    `Profile: ${spec.globalOptions.profile}`,
    `Material: ${spec.globalOptions.material}`,
    `Production method: ${spec.globalOptions.productionMethod}`,
    `Finish: ${spec.globalOptions.finish}`,
    `Switch mount: ${spec.manufacturingAssumptions.switchMount}`,
    `Nominal unit: ${spec.manufacturingAssumptions.nominalUnitMm} mm`,
    `Safe print area: ${spec.manufacturingAssumptions.safePrintArea}`,
    `Raster artwork target: ${spec.manufacturingAssumptions.artworkResolution}`,
    `Preferred production source: ${spec.manufacturingAssumptions.sourceFileFormats}`,
    `Selected key: ${selected?.label || "none"}`,
    `Selected key unit: ${selected?.unit || 1}u`,
    `Individually customised keys: ${state.keyStyles.size}`,
    `Artwork files: ${state.assets.map((asset) => asset.name).join(", ") || "none"}`,
    `Full-board artwork mode: ${spec.boardArtwork.mode}`,
    `Keys with artwork: ${assignedCount}`,
    `Base colour: ${controls.baseColor.value}`,
    `Legend text: ${controls.legendText.value || "layout legends only"}`,
    `Text colour: ${controls.textColor.value}`,
    `Image scale: ${controls.imageScale.value}%`,
    `Image offset: X ${controls.imageX.value}, Y ${controls.imageY.value}`,
    `Rotation: ${controls.imageRotate.value} degrees`,
    "",
    "Submit original uploads to ForgeKeys AU for artwork review, quoting, factory templates, and manufacturer handoff."
  ].join("\n");
}

function updateSelectedKeyPanel(selected) {
  if (!selected) {
    selectedKeyInfo.textContent = "Click a key on the preview to edit it individually.";
    return;
  }
  const style = state.keyStyles.get(selected.id) || {};
  selectedKeyInfo.textContent = `${selected.label} / ${selected.unit || 1}u keycap selected. Large keys such as Space, Shift, Enter, and Backspace use their actual unit width.`;
  controls.keyLegend.value = style.legend || "";
  controls.keyColor.value = style.baseColor || controls.baseColor.value;
  controls.keyImageScale.value = style.imageScale || "100";
  controls.keyImageX.value = style.imageX || "0";
  controls.keyImageY.value = style.imageY || "0";
  controls.keyImageRotate.value = style.imageRotate || "0";
}

function applyKeyStyle() {
  const selected = state.keys.find((key) => key.id === state.selectedKey);
  if (!selected) {
    statusText.textContent = "Select a printable keycap before applying individual key settings.";
    statusText.classList.add("error-text");
    return;
  }
  const existing = state.keyStyles.get(selected.id) || {};
  const next = {
    ...existing,
    legend: controls.keyLegend.value.trim(),
    baseColor: controls.keyColor.value,
    imageScale: controls.keyImageScale.value,
    imageX: controls.keyImageX.value,
    imageY: controls.keyImageY.value,
    imageRotate: controls.keyImageRotate.value
  };
  state.keyStyles.set(selected.id, next);
  if (state.assets.length && !state.assignments.has(selected.id)) {
    state.assignments.set(selected.id, state.selectedAsset);
  }
  statusText.textContent = `${selected.label} customised.`;
  statusText.classList.remove("error-text");
  drawCanvas();
}

function applySelectedAssetToKey() {
  const selected = state.keys.find((key) => key.id === state.selectedKey);
  const asset = state.assets[state.selectedAsset];
  if (!selected) {
    statusText.textContent = "Select a keycap on the preview before applying artwork to one key.";
    statusText.classList.add("error-text");
    return;
  }
  if (!asset) {
    statusText.textContent = "Upload and select an image before applying artwork to this key.";
    statusText.classList.add("error-text");
    return;
  }
  const existing = state.keyStyles.get(selected.id) || {};
  state.assignments.set(selected.id, state.selectedAsset);
  state.keyStyles.set(selected.id, {
    ...existing,
    imageScale: controls.keyImageScale.value,
    imageX: controls.keyImageX.value,
    imageY: controls.keyImageY.value,
    imageRotate: controls.keyImageRotate.value
  });
  statusText.textContent = `${asset.name} applied to ${selected.label}.`;
  statusText.classList.remove("error-text");
  drawCanvas();
}

function placementValues(key, placement) {
  const largeKey = (key.unit || 1) > 2;
  if (placement === "full") return { imageScale: largeKey ? "92" : "165", imageX: "0", imageY: "0", imageRotate: "0" };
  if (placement === "top-left") return { imageScale: largeKey ? "48" : "72", imageX: "-46", imageY: "-28", imageRotate: "-8" };
  if (placement === "bottom-right") return { imageScale: largeKey ? "48" : "72", imageX: "46", imageY: "26", imageRotate: "8" };
  if (placement === "spacebar") return { imageScale: largeKey ? "68" : "110", imageX: "0", imageY: "0", imageRotate: "0" };
  return { imageScale: largeKey ? "72" : "118", imageX: "0", imageY: "0", imageRotate: "0" };
}

function applyPlacementTemplate() {
  const selected = state.keys.find((key) => key.id === state.selectedKey);
  if (!selected) {
    statusText.textContent = "Select a keycap before applying an artwork placement.";
    statusText.classList.add("error-text");
    return;
  }
  const values = placementValues(selected, controls.keyPlacement.value);
  controls.keyImageScale.value = values.imageScale;
  controls.keyImageX.value = values.imageX;
  controls.keyImageY.value = values.imageY;
  controls.keyImageRotate.value = values.imageRotate;
  statusText.textContent = `${controls.keyPlacement.options[controls.keyPlacement.selectedIndex].text} placement prepared for ${selected.label}. Apply an image to the key when ready.`;
  statusText.classList.remove("error-text");
  if (state.assets[state.selectedAsset]) {
    applySelectedAssetToKey();
  } else {
    applyKeyStyle();
  }
}

function clearKeyStyle() {
  const selected = state.keys.find((key) => key.id === state.selectedKey);
  if (!selected) return;
  state.keyStyles.delete(selected.id);
  state.assignments.delete(selected.id);
  statusText.textContent = `${selected.label} reset to layout defaults.`;
  statusText.classList.remove("error-text");
  drawCanvas();
}

function downloadFile(fileName, mimeType, content) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadProofPng() {
  drawCanvas();
  drawProofWatermark();
  canvas.toBlob((blob) => {
    if (blob) {
      downloadFile(`forgekeys-${controls.layoutMode.value}-proof.png`, "image/png", blob);
      drawCanvas();
      setOrderStatus("Proof downloaded. Use Submit Design Request to send the artwork and request details to ForgeKeys AU.");
    }
  }, "image/png");
}

async function prepareSubmission() {
  const spec = submissionSpec();
  const assetNames = state.assets.map((asset) => asset.name).join(", ") || "no uploaded assets yet";
  const config = window.FORGEKEYS_CONFIG || {};
  const hasEndpoint = config.submissionMode === "endpoint" && config.submissionEndpoint;
  const hasSupabase = config.submissionMode === "supabase";
  const customerEmail = normalizeEmail(controls.customerEmail.value);
  const customerEmailConfirm = normalizeEmail(controls.customerEmailConfirm.value);
  if (!controls.customerName.value.trim()) {
    setOrderStatus("Please add your name before submitting the design request.", true);
    return;
  }
  if (!customerEmail || !emailLooksValid(customerEmail)) {
    setOrderStatus("Please enter a valid email address before submitting the design request.", true);
    return;
  }
  const suggestedEmail = emailCorrection(customerEmail);
  if (suggestedEmail) {
    setOrderStatus(`Please check the email address. Did you mean ${suggestedEmail}?`, true);
    return;
  }
  if (!customerEmailConfirm || customerEmailConfirm !== customerEmail) {
    setOrderStatus("Please retype the same email address in Confirm email.", true);
    return;
  }
  const customerAssetCount = state.assets.filter((asset) => !asset.demo).length;
  if (hasSupabase && customerAssetCount === 0) {
    setOrderStatus("Please upload at least one artwork or photo before submitting the design request.", true);
    return;
  }
  const submissionId = `FK-${Date.now()}`;
  setSubmitBusy(true);
  setOrderStatus("Preparing your design request...");
  const summary = [
    designSummary.value,
    "",
    "ENQUIRY CHECKLIST",
    `Submission ID: ${submissionId}`,
    `Customer: ${controls.customerName.value.trim()}`,
    `Email: ${customerEmail}`,
    `Keyboard model: ${controls.keyboardModel.value.trim() || "not provided"}`,
    `Notes: ${controls.customerNotes.value.trim() || "none"}`,
    `Original image files to submit: ${assetNames}`,
    `Layout records prepared for studio review: ${spec.keys.length} keys`,
    hasSupabase
      ? "Supabase Storage submission configured."
      : "",
    hasEndpoint
      ? "Secure submission endpoint configured."
      : hasSupabase
        ? "Files will upload to Supabase Storage."
        : "Draft mode active. Configure Supabase Storage or a secure endpoint to receive files.",
    "ForgeKeys AU will confirm print method, material, factory template, and quote before production."
  ].join("\n");
  designSummary.value = summary;

  const customer = {
    name: controls.customerName.value.trim(),
    email: customerEmail,
    keyboardModel: controls.keyboardModel.value.trim(),
    notes: controls.customerNotes.value.trim()
  };

  if (hasSupabase) {
    try {
      setOrderStatus("Uploading artwork, proof, and request details to ForgeKeys AU...");
      const result = await uploadSubmissionToSupabase(config, submissionId, summary, customer);
      setOrderStatus(`Request submitted. Open ${result.proofPath} in Supabase to view the design.`);
      designSummary.value = [
        summary,
        "",
        "UPLOAD STATUS",
        `Supabase folder: ${result.folder}`,
        `Open proof first: ${result.proofPath}`,
        `Uploaded assets: ${result.uploadedAssets.length}`,
        "ForgeKeys AU can now open 00-open-design-proof.png first, then review originals/ and 01-order-details.json."
      ].join("\n");
      setSubmitBusy(false);
      return;
    } catch (error) {
      console.error(error);
      setOrderStatus("Upload failed. Please check Supabase Storage bucket policy and try again.", true);
      setSubmitBusy(false);
      return;
    }
  }

  if (!hasEndpoint) {
    setOrderStatus("Draft request prepared. Add Supabase Storage config in site-config.js when you are ready to receive files.");
    setSubmitBusy(false);
    return;
  }

  try {
    const payload = {
      submissionId,
      customer,
      summary,
      spec,
      assets: state.assets.map((asset) => ({
        name: asset.name,
        dataUrl: asset.src
      }))
    };
    const response = await fetch(config.submissionEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    setOrderStatus("Request submitted. ForgeKeys AU will review the design and reply with next steps.");
  } catch (error) {
    setOrderStatus("Submission endpoint failed. Your summary is still prepared; please send the original files manually.", true);
  } finally {
    setSubmitBusy(false);
  }
}

function selectKeyAtPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);
  const hit = state.keys.find((key) => pointInKey(x, y, key));
  if (hit) {
    state.selectedKey = hit.id;
    drawCanvas();
  }
}

function pointInKey(x, y, key) {
  const angle = -(key.angle || 0) * Math.PI / 180;
  const cx = key.x + key.w / 2;
  const cy = key.y + key.h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const rx = dx * Math.cos(angle) - dy * Math.sin(angle) + cx;
  const ry = dx * Math.sin(angle) + dy * Math.cos(angle) + cy;
  return rx >= key.x && rx <= key.x + key.w && ry >= key.y && ry <= key.y + key.h;
}

upload.addEventListener("change", () => {
  const files = [...upload.files];
  if (!files.length) return;

  const rejected = files.filter((file) => file.size > maxUploadBytes);
  const unsupported = files.filter((file) => !acceptedMimeTypes.includes(file.type));
  const acceptedFiles = files.filter((file) => file.size <= maxUploadBytes && acceptedMimeTypes.includes(file.type));
  if (rejected.length) {
    statusText.textContent = `${rejected.length} file(s) rejected. Each image must be under ${Math.round(maxUploadBytes / 1024 / 1024)} MB.`;
    statusText.classList.add("error-text");
  } else if (unsupported.length) {
    statusText.textContent = `${unsupported.length} file(s) rejected. Please upload JPG, PNG, or WebP only.`;
    statusText.classList.add("error-text");
  } else {
    statusText.textContent = `${acceptedFiles.length} image file(s) loading. Choose an asset and apply it to the layout.`;
    statusText.classList.remove("error-text");
  }

  acceptedFiles.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        state.assets.push({ name: file.name, image, src: reader.result, file });
        state.selectedAsset = state.assets.length - 1;
        renderAssetList();
        statusText.textContent = `${file.name} loaded. Artwork will stay clipped to the selected keyboard layout.`;
        statusText.classList.remove("error-text");
        drawCanvas();
      };
      image.onerror = () => {
        statusText.textContent = `${file.name} could not be decoded by this browser. Use JPG, PNG, or WebP for the live designer.`;
        statusText.classList.add("error-text");
      };
      image.src = reader.result;
    };
    reader.onerror = () => {
      statusText.textContent = `${file.name} could not be read. Please try exporting it as JPG or PNG.`;
      statusText.classList.add("error-text");
    };
    reader.readAsDataURL(file);
  });
});

canvas.addEventListener("click", (event) => selectKeyAtPoint(event.clientX, event.clientY));
canvas.addEventListener("pointerdown", (event) => selectKeyAtPoint(event.clientX, event.clientY));
document.getElementById("applyPhotoMode").addEventListener("click", applyPhotoMode);
document.getElementById("loadButterflyDemo").addEventListener("click", loadButterflyDemo);
document.getElementById("applyPlacement").addEventListener("click", applyPlacementTemplate);
document.getElementById("applyKeyStyle").addEventListener("click", applyKeyStyle);
document.getElementById("applyAssetToKey").addEventListener("click", applySelectedAssetToKey);
document.getElementById("clearKeyStyle").addEventListener("click", clearKeyStyle);
document.getElementById("prevAsset").addEventListener("click", () => selectRelativeAsset(-1));
document.getElementById("nextAsset").addEventListener("click", () => selectRelativeAsset(1));
previewZoomOut?.addEventListener("click", () => setPreviewZoom(state.previewZoom - 0.1));
previewZoomIn?.addEventListener("click", () => setPreviewZoom(state.previewZoom + 0.1));
document.getElementById("downloadProof").addEventListener("click", downloadProofPng);
document.getElementById("submitRequest").addEventListener("click", prepareSubmission);
document.getElementById("copySpec").addEventListener("click", async () => {
  const text = designSummary.value;
  try {
    await navigator.clipboard.writeText(text);
    statusText.textContent = "Customer summary copied.";
  } catch {
    designSummary.select();
    document.execCommand("copy");
    statusText.textContent = "Customer summary selected and copied where supported.";
  }
});

Object.values(controls).forEach((control) => {
  control.addEventListener("input", drawCanvas);
  control.addEventListener("change", drawCanvas);
});

document.getElementById("resetDesign").addEventListener("click", () => {
  state.assets = [];
  state.selectedAsset = 0;
  state.selectedKey = "single";
  state.assignments.clear();
  state.keyStyles.clear();
  state.boardArtMode = "";
  state.boardArtworkAsset = 0;
  upload.value = "";
  controls.layoutMode.value = "single";
  controls.applyMode.value = "selected";
  controls.photoMode.value = "full-board";
  controls.demoStyle.value = "novelty";
  controls.profile.value = "Cherry profile";
  controls.material.value = "PBT";
  controls.printMethod.value = "Dye sublimation";
  controls.finish.value = "Matte";
  controls.baseColor.value = "#f3eee6";
  controls.legendText.value = "";
  controls.textColor.value = "#25282a";
  controls.imageScale.value = "80";
  controls.imageX.value = "0";
  controls.imageY.value = "0";
  controls.imageRotate.value = "0";
  controls.keyPlacement.value = "center";
  controls.customerName.value = "";
  controls.customerEmail.value = "";
  controls.customerEmailConfirm.value = "";
  controls.keyboardModel.value = "";
  controls.customerNotes.value = "";
  statusText.textContent = "Images are clipped inside each keycap. Upload photos or artwork, then choose a simple photo mode.";
  statusText.classList.remove("error-text");
  if (orderStatus) {
    orderStatus.textContent = "No request submitted yet.";
    orderStatus.classList.remove("error-text");
  }
  setSubmitBusy(false);
  renderAssetList();
  drawCanvas();
});

drawCanvas();
setupPreviewDrag();
setPreviewZoom(1);
