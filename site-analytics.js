(function () {
  if (window.ForgeKeysAnalytics) return;

  const config = window.FORGEKEYS_CONFIG?.analytics || {};
  const allowedEvents = new Set([
    "page_view",
    "reference_view",
    "quote_click",
    "designer_open",
    "quote_form_start",
    "artwork_selected",
    "quote_submit_attempt",
    "quote_submit_success",
    "quote_submit_error",
    "payment_open",
    "social_click"
  ]);
  const eventEndpoint = validHttpsUrl(config.eventEndpoint);

  function validHttpsUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function cleanToken(value, pattern, maxLength) {
    const token = String(value || "").trim();
    return token.length <= maxLength && pattern.test(token) ? token : "";
  }

  function viewportGroup() {
    const width = Number(window.innerWidth) || 0;
    if (width < 600) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  function safeMetadata(metadata) {
    const input = metadata && typeof metadata === "object" ? metadata : {};
    const output = {};
    const source = cleanToken(input.source, /^[a-z0-9-]+$/i, 40);
    const reference = cleanToken(input.reference, /^FK-(?:BLD|SVC)-[A-Z0-9-]+$/i, 48);
    const errorCode = cleanToken(input.errorCode, /^[a-z0-9_-]+$/i, 40);

    if (source) output.source = source.toLowerCase();
    if (reference) output.reference = reference.toUpperCase();
    if (errorCode) output.errorCode = errorCode.toLowerCase();
    if (Number.isInteger(input.count) && input.count >= 0 && input.count <= 3) {
      output.count = input.count;
    }
    return output;
  }

  function track(name, metadata) {
    if (!allowedEvents.has(name)) return false;
    const payload = {
      event: name,
      page: window.location.pathname || "/",
      viewport: viewportGroup(),
      occurredAt: new Date().toISOString(),
      ...safeMetadata(metadata)
    };

    window.dispatchEvent?.(new CustomEvent("forgekeys:analytics", { detail: payload }));
    if (!eventEndpoint) return true;

    fetch(eventEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit",
      keepalive: true
    }).catch(() => {});
    return true;
  }

  function linkDetails(link) {
    try {
      const url = new URL(link.href, window.location.href);
      return {
        url,
        source: cleanToken(url.searchParams.get("source") || link.dataset.analyticsSource, /^[a-z0-9-]+$/i, 40),
        reference: cleanToken(url.searchParams.get("ref") || link.dataset.referenceId, /^FK-(?:BLD|SVC)-[A-Z0-9-]+$/i, 48)
      };
    } catch {
      return null;
    }
  }

  function bindLinks() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest?.("a[href]");
      if (!link) return;
      const details = linkDetails(link);
      if (!details) return;
      const path = details.url.pathname.toLowerCase();
      const metadata = {
        source: details.source || document.body?.dataset.analyticsPage || "site",
        reference: details.reference
      };

      if (path.endsWith("/support.html") && details.url.hash === "#quote") {
        track("quote_click", metadata);
      } else if (path.includes("/simulator/") || path.endsWith("/preview.html")) {
        track("designer_open", metadata);
      } else if (path.endsWith("/checkout.html")) {
        track("payment_open", metadata);
      } else if (link.matches("[data-social], .social-link")) {
        track("social_click", { source: link.dataset.social || link.dataset.socialLink || "social" });
      }
    });
  }

  function bindReferenceViews() {
    const references = Array.from(document.querySelectorAll("[data-reference-id]"));
    if (!references.length || typeof window.IntersectionObserver !== "function") return;
    const observer = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
        const reference = entry.target.dataset.referenceId;
        track("reference_view", {
          source: document.body?.dataset.analyticsPage || "site",
          reference
        });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    references.forEach((reference) => observer.observe(reference));
  }

  function loadCloudflareAnalytics() {
    const token = cleanToken(config.cloudflareToken, /^[a-z0-9_-]+$/i, 80);
    if (!token) return;
    const script = document.createElement("script");
    script.defer = true;
    script.src = "https://static.cloudflareinsights.com/beacon.min.js";
    script.dataset.cfBeacon = JSON.stringify({ token });
    document.head.appendChild(script);
  }

  window.ForgeKeysAnalytics = Object.freeze({
    eventEndpointEnabled: Boolean(eventEndpoint),
    track
  });

  loadCloudflareAnalytics();
  bindLinks();
  bindReferenceViews();
  track("page_view", { source: document.body?.dataset.analyticsPage || "site" });
})();
