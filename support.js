const quoteFields = {
  form: document.getElementById("quoteForm"),
  name: document.getElementById("quoteName"),
  email: document.getElementById("quoteEmail"),
  confirmEmail: document.getElementById("quoteConfirmEmail"),
  city: document.getElementById("quoteCity"),
  type: document.getElementById("quoteType"),
  layout: document.getElementById("quoteLayout"),
  budget: document.getElementById("quoteBudget"),
  referenceId: document.getElementById("quoteReferenceId"),
  source: document.getElementById("quoteSource"),
  product: document.getElementById("quoteProduct"),
  brief: document.getElementById("quoteBrief"),
  files: document.getElementById("quoteFiles"),
  fileList: document.getElementById("quoteFileList"),
  rights: document.getElementById("quoteRights"),
  turnstile: document.getElementById("quoteTurnstile"),
  submit: document.getElementById("submitQuoteRequest"),
  status: document.getElementById("quoteStatus")
};

const supportConfig = window.FORGEKEYS_CONFIG || {};
const maxUploadBytes = Number(supportConfig.maxUploadBytes) || 3 * 1024 * 1024;
const maxUploadFiles = 3;
const acceptedMimeTypes = Array.isArray(supportConfig.acceptedMimeTypes)
  ? supportConfig.acceptedMimeTypes
  : ["image/jpeg", "image/png", "image/webp"];
const uploadLimitLabel = `${Math.round(maxUploadBytes / 1024 / 1024)} MB`;
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
  "163.con": "163.com"
};

let selectedFiles = [];
let submissionSucceeded = false;
let quoteFormStarted = false;
const protectedSubmissionEnabled = supportConfig.submissionMode === "endpoint";

function trackQuoteEvent(name, metadata = {}) {
  window.ForgeKeysAnalytics?.track(name, metadata);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function emailLooksValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

function emailCorrection(email) {
  const [local, domain] = normalizeEmail(email).split("@");
  if (!local || !domain || !emailDomainCorrections[domain]) return "";
  return `${local}@${emailDomainCorrections[domain]}`;
}

function safeFileName(value) {
  return String(value || "upload")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+|\.+$/g, "")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "upload";
}

function fileSizeLabel(bytes) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function setStatus(message, state = "info") {
  quoteFields.status.textContent = message;
  quoteFields.status.dataset.state = state;
}

function setFieldError(field, message) {
  setStatus(message, "error");
  field.setAttribute("aria-invalid", "true");
  field.focus();
}

function clearFieldErrors() {
  [
    quoteFields.name,
    quoteFields.email,
    quoteFields.confirmEmail,
    quoteFields.type,
    quoteFields.layout,
    quoteFields.budget,
    quoteFields.brief,
    quoteFields.files,
    quoteFields.rights
  ].forEach((field) => field.removeAttribute("aria-invalid"));
}

function validateImageFile(file) {
  if (!acceptedMimeTypes.includes(file.type)) {
    return `${file.name} is not a supported image. Choose a JPG, PNG, or WebP file.`;
  }
  if (file.size > maxUploadBytes) {
    return `${file.name} is over ${uploadLimitLabel}. Choose a smaller image before continuing.`;
  }
  return "";
}

function renderSelectedFiles() {
  quoteFields.fileList.replaceChildren();
  selectedFiles.forEach((file) => {
    const item = document.createElement("li");
    item.textContent = `${file.name} · ${fileSizeLabel(file.size)}`;
    quoteFields.fileList.appendChild(item);
  });
}

function handleFileSelection() {
  quoteFields.files.removeAttribute("aria-invalid");
  const files = Array.from(quoteFields.files.files || []);

  if (files.length > maxUploadFiles) {
    selectedFiles = [];
    quoteFields.files.value = "";
    renderSelectedFiles();
    setFieldError(quoteFields.files, `Choose no more than ${maxUploadFiles} images.`);
    return;
  }

  for (const file of files) {
    const error = validateImageFile(file);
    if (error) {
      selectedFiles = [];
      quoteFields.files.value = "";
      renderSelectedFiles();
      setFieldError(quoteFields.files, error);
      return;
    }
  }

  selectedFiles = files;
  renderSelectedFiles();
  if (files.length) trackQuoteEvent("artwork_selected", { count: files.length, source: "quote-form" });
  setStatus(
    files.length
      ? `${files.length} image${files.length === 1 ? "" : "s"} ready to attach. You can submit when the other details are complete.`
      : "Artwork is optional. You can submit the written idea without an image."
  );
}

function collectQuoteData(quoteId, artworkFiles) {
  return {
    schemaVersion: 3,
    submissionKind: "quote",
    submissionId: quoteId,
    quoteId,
    submittedAt: new Date().toISOString(),
    source: "ForgeKeys AU quote form",
    enquirySource: quoteFields.source.value.trim() || "direct",
    selectedReferenceId: quoteFields.referenceId.value.trim(),
    selectedReference: quoteFields.product.value.trim(),
    requestType: quoteFields.type.value,
    layout: quoteFields.layout.value,
    budgetRange: quoteFields.budget.value,
    customer: {
      name: quoteFields.name.value.trim(),
      email: normalizeEmail(quoteFields.email.value),
      city: quoteFields.city.value.trim()
    },
    brief: quoteFields.brief.value.trim(),
    artwork: {
      supplied: artworkFiles.length > 0,
      files: artworkFiles
    },
    artworkRoles: artworkFiles.map(() => "artwork"),
    consent: {
      artworkRightsConfirmed: quoteFields.rights.checked,
      quoteOnlyConfirmed: quoteFields.rights.checked,
      confirmedAt: new Date().toISOString()
    },
    page: {
      url: window.location.href,
      referrer: document.referrer || ""
    },
    notes: {
      nextStep: "Review layout, budget, artwork quality, compatibility, availability, and quote before requesting payment.",
      warning: "This is a quote enquiry only. Confirm scope, proof, price, payment stage, and artwork rights before production."
    }
  };
}

async function submitToProtectedEndpoint(data) {
  const verification = window.ForgeKeysTurnstile;
  if (!supportConfig.submissionEndpoint || !supportConfig.supabaseAnonKey || !verification?.isRequired()) {
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
  form.append("metadata", JSON.stringify(data));
  form.append("turnstileToken", token);
  selectedFiles.forEach((file) => form.append("artwork", file, file.name));

  const response = await fetch(supportConfig.submissionEndpoint, {
    method: "POST",
    headers: { apikey: supportConfig.supabaseAnonKey },
    body: form
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
}

async function uploadToSupabaseStorage(path, body, contentType) {
  if (!supportConfig.supabaseUrl || !supportConfig.supabaseAnonKey || !supportConfig.supabaseBucket) {
    throw new Error("Supabase config is missing in site-config.js.");
  }

  const baseUrl = supportConfig.supabaseUrl.replace(/\/$/, "");
  const url = `${baseUrl}/storage/v1/object/${supportConfig.supabaseBucket}/${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: supportConfig.supabaseAnonKey,
      Authorization: `Bearer ${supportConfig.supabaseAnonKey}`,
      "Content-Type": contentType || "application/octet-stream"
    },
    body
  });

  if (!response.ok) {
    const message = await response.text();
    const error = new Error(message || `Upload failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return { path };
}

function setSubmitBusy(busy) {
  quoteFields.submit.disabled = busy || submissionSucceeded;
  quoteFields.submit.textContent = submissionSucceeded
    ? "Request Submitted"
    : busy
      ? "Submitting..."
      : "Submit Quote Request";
}

function validateQuote() {
  clearFieldErrors();
  const name = quoteFields.name.value.trim();
  const email = normalizeEmail(quoteFields.email.value);
  const confirmEmail = normalizeEmail(quoteFields.confirmEmail.value);
  const correction = emailCorrection(email);
  const brief = quoteFields.brief.value.trim();

  if (!name) {
    setFieldError(quoteFields.name, "Please add your name before submitting.");
    return false;
  }
  if (!emailLooksValid(email)) {
    setFieldError(quoteFields.email, "Please enter a valid email address, for example name@example.com.");
    return false;
  }
  if (correction) {
    setFieldError(quoteFields.email, `Please check your email. Did you mean ${correction}?`);
    return false;
  }
  if (!confirmEmail) {
    setFieldError(quoteFields.confirmEmail, "Please enter your email again so we can confirm it.");
    return false;
  }
  if (email !== confirmEmail) {
    setFieldError(quoteFields.confirmEmail, "The two email addresses do not match. Please check both before submitting.");
    return false;
  }
  if (brief.length < 12) {
    setFieldError(quoteFields.brief, "Please add a short description of the look or service you want.");
    return false;
  }
  if (!quoteFields.rights.checked) {
    setFieldError(quoteFields.rights, "Please confirm the material and quote statement before submitting.");
    return false;
  }
  if (selectedFiles.length > maxUploadFiles) {
    setFieldError(quoteFields.files, `Choose no more than ${maxUploadFiles} images.`);
    return false;
  }
  for (const file of selectedFiles) {
    const error = validateImageFile(file);
    if (error) {
      setFieldError(quoteFields.files, error);
      return false;
    }
  }
  return true;
}

async function submitQuoteRequest(event) {
  event.preventDefault();
  trackQuoteEvent("quote_submit_attempt", { source: "quote-form" });
  if (submissionSucceeded || !validateQuote()) return;

  const quoteId = `FQ-${Date.now()}`;
  const folder = `${supportConfig.supabaseFolder || "submissions"}/${quoteId}`;
  const artworkFiles = selectedFiles.map((file, index) => ({
    originalName: file.name,
    type: file.type,
    size: file.size,
    storagePath: `${folder}/artwork/${String(index + 1).padStart(2, "0")}-${safeFileName(file.name)}`
  }));
  const data = collectQuoteData(quoteId, artworkFiles);

  setSubmitBusy(true);
  setStatus(selectedFiles.length ? "Uploading your images and quote details..." : "Submitting your quote details...");

  try {
    let submittedReference = quoteId;
    if (protectedSubmissionEnabled) {
      const result = await submitToProtectedEndpoint(data);
      submittedReference = result.reference || quoteId;
    } else {
      for (let index = 0; index < selectedFiles.length; index += 1) {
        const file = selectedFiles[index];
        setStatus(`Uploading image ${index + 1} of ${selectedFiles.length}...`);
        await uploadToSupabaseStorage(artworkFiles[index].storagePath, file, file.type);
      }

      const json = JSON.stringify(data, null, 2);
      const readme = [
        `ForgeKeys AU quote request: ${quoteId}`,
        "",
        `Request type: ${data.requestType}`,
        `Layout: ${data.layout}`,
        `Budget: ${data.budgetRange}`,
        `Selected reference: ${data.selectedReference || "Not selected"}`,
        `Reference ID: ${data.selectedReferenceId || "Not provided"}`,
        `Source: ${data.enquirySource}`,
        `Customer: ${data.customer.name} <${data.customer.email}>`,
        `City: ${data.customer.city || "Not provided"}`,
        `Artwork files: ${data.artwork.files.length}`,
        "",
        "Open 01-quote-request.json for the complete brief and artwork paths.",
        "This is not a paid order. Confirm scope, proof, availability, price, and payment stage before production."
      ].join("\n");

      setStatus("Saving your quote details...");
      await uploadToSupabaseStorage(
        `${folder}/01-quote-request.json`,
        new Blob([json], { type: "application/json" }),
        "application/json"
      );
      await uploadToSupabaseStorage(
        `${folder}/00-read-me-first.txt`,
        new Blob([readme], { type: "text/plain" }),
        "text/plain"
      );
    }

    sessionStorage.setItem("forgekeysLastQuote", JSON.stringify({
      quoteId: submittedReference,
      name: data.customer.name,
      email: data.customer.email,
      selectedReference: data.selectedReference,
      submittedAt: data.submittedAt
    }));

    submissionSucceeded = true;
    quoteFields.form.dataset.submitted = "true";
    trackQuoteEvent("quote_submit_success", { source: "quote-form" });
    setStatus(`Quote request submitted. Your reference is ${submittedReference}. We will reply by email before any payment is needed.`, "success");
  } catch (error) {
    console.error("ForgeKeys quote request upload failed", error);
    trackQuoteEvent("quote_submit_error", {
      source: "quote-form",
      errorCode: error.code || (error.status ? `http_${error.status}` : "submission_failed")
    });
    if (protectedSubmissionEnabled) window.ForgeKeysTurnstile?.reset();
    if (error.code === "verification_required" || error.code === "verification_failed") {
      setStatus(error.message, "error");
    } else if (error.status === 429) {
      setStatus("Too many quote requests were sent. Please wait before trying again.", "error");
    } else if (error.status === 403) {
      setStatus("The quote could not be saved because the site storage permission is blocked. Please contact ForgeKeys AU directly.", "error");
    } else if (error.code === "backend_not_configured") {
      setStatus("The quote service is temporarily unavailable. Please contact ForgeKeys AU directly.", "error");
    } else {
      setStatus("The quote could not be submitted. Please check your connection and try again.", "error");
    }
  } finally {
    setSubmitBusy(false);
  }
}

function applySelectedProduct() {
  const params = new URLSearchParams(window.location.search);
  const product = params.get("product") || sessionStorage.getItem("forgekeysSelectedReference");
  const referenceId = params.get("ref") || "";
  const enquirySource = params.get("source") || "direct";
  const requestedType = params.get("type") || "Build reference request";
  const availableTypes = Array.from(quoteFields.type.options, (option) => option.value);

  quoteFields.referenceId.value = referenceId;
  quoteFields.source.value = enquirySource;
  quoteFields.type.value = availableTypes.includes(requestedType) ? requestedType : "Build reference request";

  if (!product) return;

  quoteFields.product.value = product;
  if (quoteFields.type.value === "Build reference request") {
    quoteFields.brief.value = `I am interested in the ${product} reference. Please recommend a similar direction for my layout and budget.`;
  } else if (quoteFields.type.value === "Custom keycaps") {
    quoteFields.brief.value = "I would like a custom keycap concept. I will add my preferred theme, colours, keys, and artwork details here.";
  } else {
    quoteFields.brief.value = `I am interested in the ${product} service. Please recommend the right scope for my layout and budget.`;
  }

  const referenceLabel = referenceId ? ` (${referenceId})` : "";
  setStatus(`Selection added: ${product}${referenceLabel}. Complete the details below to request a quote.`);
}

Object.values(quoteFields).forEach((field) => {
  if (field && ["INPUT", "SELECT", "TEXTAREA"].includes(field.tagName)) {
    field.addEventListener("focus", () => {
      if (quoteFormStarted) return;
      quoteFormStarted = true;
      trackQuoteEvent("quote_form_start", { source: "quote-form" });
    });
    field.addEventListener("input", () => field.removeAttribute("aria-invalid"));
    field.addEventListener("change", () => field.removeAttribute("aria-invalid"));
  }
});

quoteFields.files.addEventListener("change", handleFileSelection);
quoteFields.form.addEventListener("submit", submitQuoteRequest);
applySelectedProduct();

if (protectedSubmissionEnabled) {
  window.ForgeKeysTurnstile?.mount(quoteFields.turnstile, {
    theme: "light",
    expiredCallback: () => setStatus("Human verification expired. Please complete it again."),
    errorCallback: () => setStatus("Human verification could not be loaded. Please refresh and try again.", "error")
  }).catch((error) => {
    console.error("ForgeKeys verification failed to load", error);
    setStatus("Human verification could not be loaded. Please refresh and try again.", "error");
  });
}
