const quoteFields = {
  name: document.getElementById("quoteName"),
  email: document.getElementById("quoteEmail"),
  city: document.getElementById("quoteCity"),
  type: document.getElementById("quoteType"),
  product: document.getElementById("quoteProduct"),
  brief: document.getElementById("quoteBrief"),
  message: document.getElementById("quoteMessage"),
  copy: document.getElementById("copyQuoteMessage"),
  emailButton: document.getElementById("emailQuoteRequest"),
  status: document.getElementById("quoteStatus")
};

const supportConfig = window.FORGEKEYS_CONFIG || {};

function cleanText(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function buildQuoteMessage() {
  const selectedReference = cleanText(quoteFields.product.value, "No specific build reference selected");
  return [
    "FORGEKEYS AU QUOTE REQUEST",
    `Selected reference: ${selectedReference}`,
    `Customer name: ${cleanText(quoteFields.name.value, "Not provided")}`,
    `Customer email: ${cleanText(quoteFields.email.value, "Not provided")}`,
    `City: ${cleanText(quoteFields.city.value, "Not provided")}`,
    `Request type: ${quoteFields.type.value}`,
    "",
    "Customer brief:",
    cleanText(quoteFields.brief.value, "Not provided yet"),
    "",
    "Next step:",
    "Please reply with layout, budget, availability, recommended parts, and whether artwork upload is needed."
  ].join("\n");
}

function updateQuoteMessage() {
  const message = buildQuoteMessage();
  const subjectReference = cleanText(quoteFields.product.value, "Custom keyboard quote");
  quoteFields.message.value = message;

  if (supportConfig.contactEmail) {
    const subject = `ForgeKeys quote request - ${subjectReference}`;
    quoteFields.emailButton.href = `mailto:${encodeURIComponent(supportConfig.contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    quoteFields.emailButton.textContent = "Email Quote Request";
  } else {
    quoteFields.emailButton.href = "#";
    quoteFields.emailButton.textContent = "Copy first, then send to ForgeKeys";
  }
}

function applySelectedProduct() {
  const params = new URLSearchParams(window.location.search);
  const product = params.get("product");
  if (!product) return;
  quoteFields.product.value = product;
  quoteFields.type.value = "Build reference request";
  quoteFields.brief.value = [
    `I am interested in the ${product} reference.`,
    "Please quote a similar custom build and recommend layout, keycaps, switches, desk setup options, budget, and timeline."
  ].join("\n");
  quoteFields.status.textContent = `Selected reference added: ${product}. Add your contact details, then copy or email the request.`;
}

Object.values(quoteFields).forEach((field) => {
  if (field && ["INPUT", "SELECT", "TEXTAREA"].includes(field.tagName) && field !== quoteFields.message) {
    field.addEventListener("input", updateQuoteMessage);
    field.addEventListener("change", updateQuoteMessage);
  }
});

quoteFields.copy.addEventListener("click", async () => {
  updateQuoteMessage();
  try {
    await navigator.clipboard.writeText(quoteFields.message.value);
    quoteFields.status.textContent = "Request details copied. Send them by email, Instagram, SMS, or your preferred contact channel.";
  } catch {
    quoteFields.message.select();
    document.execCommand("copy");
    quoteFields.status.textContent = "Request details selected and copied where supported.";
  }
});

quoteFields.emailButton.addEventListener("click", (event) => {
  updateQuoteMessage();
  if (!supportConfig.contactEmail) {
    event.preventDefault();
    quoteFields.status.textContent = "Add contactEmail in site-config.js to enable direct email. For now, copy the request details and send them manually.";
  }
});

applySelectedProduct();
updateQuoteMessage();
