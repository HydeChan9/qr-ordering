(() => {
  const catalog = window.FORGEKEYS_CONFIG?.buildCatalog || {};
  const formatter = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0
  });

  document.querySelectorAll("[data-build-price]").forEach((element) => {
    const item = catalog[element.dataset.buildPrice];
    if (!item || !Number.isFinite(item.priceAud)) return;
    element.textContent = `From AUD ${formatter.format(item.priceAud)}`;
  });

  document.querySelectorAll("[data-build-status]").forEach((element) => {
    const item = catalog[element.dataset.buildStatus];
    if (!item?.status) return;
    element.textContent = item.status;
  });
})();
