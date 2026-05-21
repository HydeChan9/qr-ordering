const config = window.FORGEKEYS_CONFIG || {};

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

updatePaymentCards();
