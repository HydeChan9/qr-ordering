const quoteFields = {
  form: document.getElementById("quoteForm"),
  name: document.getElementById("quoteName"),
  email: document.getElementById("quoteEmail"),
  city: document.getElementById("quoteCity"),
  type: document.getElementById("quoteType"),
  product: document.getElementById("quoteProduct"),
  brief: document.getElementById("quoteBrief"),
  submit: document.getElementById("submitQuoteRequest"),
  status: document.getElementById("quoteStatus")
};

const supportConfig = window.FORGEKEYS_CONFIG || {};

function cleanText(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function emailLooksValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

function safeFileName(value) {
  return String(value || "quote-request")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "quote-request";
}

function collectQuoteData(quoteId) {
  return {
    quoteId,
    submittedAt: new Date().toISOString(),
    source: "ForgeKeys build reference quote form",
    selectedReference: quoteFields.product.value.trim(),
    requestType: quoteFields.type.value,
    customer: {
      name: quoteFields.name.value.trim(),
      email: normalizeEmail(quoteFields.email.value),
      city: quoteFields.city.value.trim()
    },
    brief: quoteFields.brief.value.trim(),
    page: {
      url: window.location.href,
      referrer: document.referrer || ""
    },
    notes: {
      nextStep: "Reply with layout, budget, availability, recommended parts, and whether artwork upload is needed.",
      warning: "This is a quote enquiry only. Confirm price, parts availability, payment stage, and artwork rights before taking payment."
    }
  };
}

function setFieldError(field, message) {
  quoteFields.status.textContent = message;
  field.focus();
  field.setAttribute("aria-invalid", "true");
}

function clearFieldErrors() {
  [quoteFields.name, quoteFields.email, quoteFields.brief].forEach((field) => {
    field.removeAttribute("aria-invalid");
  });
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
  quoteFields.submit.disabled = busy;
  quoteFields.submit.textContent = busy ? "Submitting..." : "Submit Quote Request";
}

async function submitQuoteRequest() {
  clearFieldErrors();
  const name = quoteFields.name.value.trim();
  const email = normalizeEmail(quoteFields.email.value);
  const product = quoteFields.product.value.trim();
  const brief = quoteFields.brief.value.trim();

  if (!name) {
    setFieldError(quoteFields.name, "Please add your name before submitting.");
    return;
  }
  if (!emailLooksValid(email)) {
    setFieldError(quoteFields.email, "Please enter a valid email address, for example name@example.com.");
    return;
  }
  if (!product && brief.length < 12) {
    setFieldError(quoteFields.brief, "Please choose a build reference or write a short brief so we know what to quote.");
    return;
  }

  const quoteId = `FQ-${Date.now()}`;
  const folder = `${supportConfig.supabaseFolder || "submissions"}/${quoteId}`;
  const data = collectQuoteData(quoteId);
  const json = JSON.stringify(data, null, 2);
  const readme = [
    `ForgeKeys AU build reference quote request: ${quoteId}`,
    "",
    `Selected reference: ${data.selectedReference || "Not selected"}`,
    `Customer: ${data.customer.name} <${data.customer.email}>`,
    `City: ${data.customer.city || "Not provided"}`,
    "",
    "Open 01-quote-request.json for the full customer brief.",
    "This is not a paid order yet. Reply with recommendations, availability, and quote before payment."
  ].join("\n");

  setSubmitBusy(true);
  quoteFields.status.textContent = "Submitting quote request...";
  try {
    await uploadToSupabaseStorage(`${folder}/01-quote-request-${safeFileName(product || quoteFields.type.value)}.json`, new Blob([json], { type: "application/json" }), "application/json");
    await uploadToSupabaseStorage(`${folder}/00-read-me-first.txt`, new Blob([readme], { type: "text/plain" }), "text/plain");
    sessionStorage.setItem("forgekeysLastQuote", JSON.stringify({
      quoteId,
      name: data.customer.name,
      email: data.customer.email,
      selectedReference: data.selectedReference,
      submittedAt: data.submittedAt
    }));
    quoteFields.status.textContent = `Quote request submitted. Reference ${quoteId}. We will reply by email before any payment is needed.`;
    quoteFields.form.dataset.submitted = "true";
  } catch (error) {
    console.error("ForgeKeys quote request upload failed", error);
    if (error.status === 403) {
      quoteFields.status.textContent = "Quote request upload is blocked by the site storage settings. Please contact ForgeKeys directly.";
    } else {
      quoteFields.status.textContent = "Quote request upload failed. Please try again or contact ForgeKeys AU directly.";
    }
  } finally {
    setSubmitBusy(false);
  }
}

function applySelectedProduct() {
  const params = new URLSearchParams(window.location.search);
  const product = params.get("product") || sessionStorage.getItem("forgekeysSelectedReference");
  if (!product) return;
  quoteFields.product.value = product;
  quoteFields.type.value = "Build reference request";
  quoteFields.brief.value = [
    `I am interested in the ${product} reference.`,
    "Please quote a similar custom build and recommend layout, keycaps, switches, desk setup options, budget, and timeline."
  ].join("\n");
  quoteFields.status.textContent = `Selected reference added: ${product}. Add your contact details, then submit the request.`;
}

Object.values(quoteFields).forEach((field) => {
  if (field && ["INPUT", "SELECT", "TEXTAREA"].includes(field.tagName)) {
    field.addEventListener("input", () => field.removeAttribute("aria-invalid"));
    field.addEventListener("change", () => field.removeAttribute("aria-invalid"));
  }
});

quoteFields.submit.addEventListener("click", submitQuoteRequest);

applySelectedProduct();
