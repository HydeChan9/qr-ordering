const fields = {
  payerName: document.getElementById("payerName"),
  submissionId: document.getElementById("submissionId"),
  paymentStage: document.getElementById("paymentStage"),
  quotedTotal: document.getElementById("quotedTotal"),
  depositAmount: document.getElementById("depositAmount"),
  paymentMethod: document.getElementById("paymentMethod"),
  reference: document.getElementById("paymentReference"),
  status: document.getElementById("copyStatus")
};

const config = window.FORGEKEYS_CONFIG || {};

function cleanReference(value) {
  return value
    .trim()
    .replace(/[^a-z0-9 -]/gi, "")
    .replace(/\s+/g, "-")
    .toUpperCase()
    .slice(0, 34) || "CUSTOM-ORDER";
}

function money(value) {
  const amount = Math.max(0, Number(value || 0));
  return amount ? `A$${amount.toFixed(2)}` : "To be confirmed";
}

function configured(value, fallback = "Provided on approved quote") {
  return value && String(value).trim() ? String(value).trim() : fallback;
}

function updatePaymentCards() {
  const payId = document.querySelector("[data-payment-payid]");
  const accountName = document.querySelector("[data-payment-account-name]");
  const bsb = document.querySelector("[data-payment-bsb]");
  const accountNumber = document.querySelector("[data-payment-account-number]");
  const cardLink = document.querySelector("[data-card-invoice-link]");

  if (payId) payId.textContent = configured(config.paymentPayId);
  if (accountName) accountName.textContent = configured(config.paymentBankAccountName || config.paymentBusinessName);
  if (bsb) bsb.textContent = configured(config.paymentBankBsb);
  if (accountNumber) accountNumber.textContent = configured(config.paymentBankAccountNumber);
  if (cardLink && config.paymentCardInvoiceUrl) {
    cardLink.href = config.paymentCardInvoiceUrl;
    cardLink.textContent = "Open secure card invoice";
  }
}

function getStoredQuote() {
  try {
    return JSON.parse(sessionStorage.getItem("forgekeysLastQuote") || "null");
  } catch {
    return null;
  }
}

function applyStoredQuote() {
  const storedQuote = getStoredQuote();
  if (!storedQuote) return;
  if (!fields.submissionId.value) fields.submissionId.value = storedQuote.quoteId || "";
  if (!fields.payerName.value) fields.payerName.value = storedQuote.name || "";
}

function updatePaymentReference() {
  const amount = Math.max(10, Number(fields.depositAmount.value || 50));
  const quoteId = cleanReference(fields.submissionId.value || "QUOTE-PENDING");
  const customerName = fields.payerName.value.trim() || "Customer";
  const reference = cleanReference(`${quoteId} ${customerName}`);
  fields.reference.textContent = `Reference: ${reference} · ${fields.paymentStage.value} · Amount due now: A$${amount.toFixed(2)}`;
  fields.status.textContent = `Quoted total: ${money(fields.quotedTotal.value)}. Production starts only after payment clears and the final visual proof is approved.`;
}

Object.values(fields).forEach((field) => {
  if (field && ["INPUT", "SELECT"].includes(field.tagName)) {
    field.addEventListener("input", updatePaymentReference);
    field.addEventListener("change", updatePaymentReference);
  }
});

updatePaymentCards();
applyStoredQuote();
updatePaymentReference();
