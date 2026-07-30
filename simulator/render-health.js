(function () {
  const params = new URLSearchParams(window.location.search);
  const forceFallback = params.get("forceFallback") === "1";
  const startedAt = Date.now();
  let activeCanvas = null;
  let fallbackShown = false;

  function sendStatus(status) {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "forgekeys-render-status", status }, window.location.origin);
    }
  }

  function fallbackElement() {
    return document.getElementById("fkRenderFallback");
  }

  function buildFallback() {
    if (fallbackElement()) return;

    const fallback = document.createElement("div");
    fallback.id = "fkRenderFallback";
    fallback.className = "fk-render-fallback";
    fallback.hidden = true;
    fallback.setAttribute("role", "status");

    const card = document.createElement("div");
    card.className = "fk-render-fallback-card";

    const image = document.createElement("img");
    image.src = "../assets/new-showcase/crimson-art-keyboard-angle-hero.jpg";
    image.alt = "Red and white custom artwork keyboard";

    const copy = document.createElement("div");
    copy.className = "fk-render-fallback-copy";
    const eyebrow = document.createElement("span");
    eyebrow.textContent = "Static preview available";
    const heading = document.createElement("h1");
    heading.textContent = "The 3D preview could not start.";
    const description = document.createElement("p");
    description.textContent = "Your browser may have blocked WebGL or a 3D file may not have finished loading. Retry the preview or send the artwork through the standard quote form.";

    const actions = document.createElement("div");
    actions.className = "fk-render-fallback-actions";
    const quote = document.createElement("a");
    quote.href = "../support.html?product=Custom%20Keycap%20Concept&ref=FK-SVC-002&type=Custom%20keycaps&source=3d-fallback#quote";
    quote.textContent = "Send Artwork Instead";
    const retry = document.createElement("a");
    retry.href = "";
    retry.dataset.fkRenderRetry = "";
    retry.textContent = "Try 3D Again";

    actions.append(quote, retry);
    copy.append(eyebrow, heading, description, actions);
    card.append(image, copy);
    fallback.append(card);
    document.body.append(fallback);
  }

  function showFallback() {
    if (!fallbackElement() && document.body) buildFallback();
    const fallback = fallbackElement();
    if (!fallback) return;
    fallback.hidden = false;
    document.body.classList.add("fk-render-failed");
    fallbackShown = true;
    sendStatus("fallback");
  }

  function hideFallback() {
    if (forceFallback) return;
    const fallback = fallbackElement();
    if (fallback) fallback.hidden = true;
    document.body.classList.remove("fk-render-failed");
    fallbackShown = false;
  }

  function attachCanvasEvents(canvas) {
    if (activeCanvas === canvas) return;
    activeCanvas = canvas;
    canvas.addEventListener("webglcontextlost", function (event) {
      event.preventDefault();
      showFallback();
    });
    canvas.addEventListener("webglcontextrestored", function () {
      hideFallback();
      sendStatus("ready");
    });
  }

  function canvasIsReady(canvas) {
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    return rect.width >= 100 && rect.height >= 100 && canvas.width > 0 && canvas.height > 0;
  }

  function inspectRenderer() {
    if (forceFallback) {
      showFallback();
      return;
    }

    const canvas = document.querySelector("canvas");
    if (canvasIsReady(canvas)) {
      attachCanvasEvents(canvas);
      if (fallbackShown) hideFallback();
      sendStatus("ready");
      return;
    }

    if (!window.WebGLRenderingContext || Date.now() - startedAt >= 15000) showFallback();
  }

  window.addEventListener("error", function (event) {
    const target = event.target;
    if (target instanceof HTMLScriptElement && /static\/js\/(?:2\.|main\.)/.test(target.src)) showFallback();
  }, true);

  function startMonitoring() {
    buildFallback();
    const retry = document.querySelector("[data-fk-render-retry]");
    if (retry) {
      const retryUrl = new URL(window.location.href);
      retryUrl.searchParams.delete("forceFallback");
      retry.href = retryUrl.href;
    }
    inspectRenderer();
    window.setInterval(inspectRenderer, 500);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", startMonitoring, { once: true });
  } else {
    startMonitoring();
  }
}());
