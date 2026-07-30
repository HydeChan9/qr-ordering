(function () {
  const config = window.FORGEKEYS_CONFIG || {};
  const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  const enabled =
    config.submissionMode === "endpoint" &&
    Boolean(config.submissionEndpoint) &&
    Boolean(config.turnstileSiteKey);
  let scriptPromise = null;
  let widgetId = null;
  let mountedContainer = null;

  function loadScript() {
    if (!enabled) return Promise.resolve(null);
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
      const script = existing || document.createElement("script");
      const timeout = window.setTimeout(() => reject(new Error("Human verification could not be loaded.")), 12000);

      const finish = () => {
        window.clearTimeout(timeout);
        if (window.turnstile) resolve(window.turnstile);
        else reject(new Error("Human verification is unavailable."));
      };
      const fail = () => {
        window.clearTimeout(timeout);
        reject(new Error("Human verification could not be loaded."));
      };

      script.addEventListener("load", finish, { once: true });
      script.addEventListener("error", fail, { once: true });
      if (!existing) {
        script.src = SCRIPT_URL;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    });
    return scriptPromise;
  }

  async function mount(container, options = {}) {
    if (!enabled || !container) return null;
    const turnstile = await loadScript();
    container.hidden = false;
    if (mountedContainer === container && widgetId !== null) return widgetId;
    if (widgetId !== null) turnstile.remove(widgetId);

    mountedContainer = container;
    widgetId = turnstile.render(container, {
      sitekey: config.turnstileSiteKey,
      theme: options.theme || "auto",
      size: "flexible",
      action: "quote_submit",
      callback: options.callback,
      "error-callback": options.errorCallback,
      "expired-callback": options.expiredCallback,
    });
    return widgetId;
  }

  function getToken() {
    if (!enabled) return "";
    if (!window.turnstile || widgetId === null) return "";
    return window.turnstile.getResponse(widgetId) || "";
  }

  function reset() {
    if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
  }

  window.ForgeKeysTurnstile = {
    isRequired: () => enabled,
    mount,
    getToken,
    reset,
  };
})();
