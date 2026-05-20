const fields = {
  payerName: document.getElementById("payerName"),
  submissionId: document.getElementById("submissionId"),
  paymentStage: document.getElementById("paymentStage"),
  quotedTotal: document.getElementById("quotedTotal"),
  depositAmount: document.getElementById("depositAmount"),
  paymentMethod: document.getElementById("paymentMethod"),
  note: document.getElementById("paymentNote"),
  copy: document.getElementById("copyPaymentNote"),
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

function updatePaymentNote() {
  const amount = Math.max(10, Number(fields.depositAmount.value || 50));
  const quoteId = cleanReference(fields.submissionId.value || "QUOTE-PENDING");
  const customerName = fields.payerName.value.trim() || "Customer";
  const reference = cleanReference(`${quoteId} ${customerName}`);
  const cardDestination = config.paymentCardInvoiceUrl
    ? `Secure card invoice: ${config.paymentCardInvoiceUrl}`
    : "Secure card invoice: request a payment link after quote approval";
  const destinations = {
    PayID: `PayID: ${configured(config.paymentPayId)}`,
    "Bank transfer": [
      `Bank transfer: ${configured(config.paymentBankAccountName || config.paymentBusinessName)}`,
      `BSB: ${configured(config.paymentBankBsb)}`,
      `Account: ${configured(config.paymentBankAccountNumber)}`
    ].join(" / "),
    "Card invoice link": cardDestination
  };

  fields.note.value = [
    "FORGEKEYS AU APPROVED QUOTE PAYMENT",
    `Customer: ${customerName}`,
    `Quote / submission ID: ${quoteId}`,
    `Payment stage: ${fields.paymentStage.value}`,
    `Quoted total: ${money(fields.quotedTotal.value)}`,
    `Amount due now: A$${amount.toFixed(2)}`,
    `Payment method: ${fields.paymentMethod.value}`,
    destinations[fields.paymentMethod.value],
    `Reference: ${reference}`,
    "",
    "Important:",
    "- Please use the exact reference so we can match your payment to the design files.",
    "- Production starts only after payment clears and the final visual proof is approved.",
    "- Do not send new artwork through payment notes; upload it through the designer or email it with the quote ID."
  ].join("\n");
}

Object.values(fields).forEach((field) => {
  if (field && ["INPUT", "SELECT"].includes(field.tagName)) {
    field.addEventListener("input", updatePaymentNote);
    field.addEventListener("change", updatePaymentNote);
  }
});

fields.copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(fields.note.value);
    fields.status.textContent = "Payment note copied.";
  } catch {
    fields.note.select();
    document.execCommand("copy");
    fields.status.textContent = "Payment note selected and copied where supported.";
  }
});

updatePaymentCards();
updatePaymentNote();
