const fields = {
  payerName: document.getElementById("payerName"),
  orderType: document.getElementById("orderType"),
  depositAmount: document.getElementById("depositAmount"),
  paymentMethod: document.getElementById("paymentMethod"),
  note: document.getElementById("paymentNote"),
  copy: document.getElementById("copyPaymentNote"),
  status: document.getElementById("copyStatus")
};

function cleanReference(value) {
  return value
    .trim()
    .replace(/[^a-z0-9 ]/gi, "")
    .replace(/\s+/g, "-")
    .toUpperCase()
    .slice(0, 28) || "CUSTOM-ORDER";
}

function updatePaymentNote() {
  const amount = Math.max(10, Number(fields.depositAmount.value || 30));
  const reference = cleanReference(`${fields.payerName.value} ${fields.orderType.value}`);
  const destination = fields.paymentMethod.value === "PayID"
    ? "PayID: payments@forgekeys.au"
    : "Bank transfer: ForgeKeys AU / BSB 000-000 / Account 0000 0000";

  fields.note.value = [
    "ForgeKeys AU custom order deposit",
    `Order type: ${fields.orderType.value}`,
    `Deposit amount: A$${amount.toFixed(2)}`,
    `Payment method: ${fields.paymentMethod.value}`,
    destination,
    `Reference: ${reference}`,
    "Next step: send payment receipt and design brief for proof approval."
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

updatePaymentNote();
