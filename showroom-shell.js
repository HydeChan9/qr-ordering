(() => {
  const stage = document.querySelector(".showroom-stage");
  const frame = stage?.querySelector(".showroom-frame");
  if (!stage || !frame) return;

  const compactViewport = window.matchMedia("(max-width: 900px)");
  let reportedHeight = 0;

  const requestState = () => {
    if (!frame.contentWindow) return;
    const frameOrigin = new URL(frame.src, window.location.href).origin;
    frame.contentWindow.postMessage(
      { type: "forgekeys-showroom-state-request" },
      frameOrigin === "null" ? "*" : frameOrigin,
    );
  };

  const applyFrameHeight = () => {
    if (!compactViewport.matches || !reportedHeight) {
      frame.style.removeProperty("height");
      return;
    }
    const height = Math.max(560, Math.min(12000, reportedHeight));
    if (Math.abs(frame.getBoundingClientRect().height - height) > 1) frame.style.height = `${height}px`;
  };

  const reveal = () => {
    stage.classList.add("is-ready");
    stage.setAttribute("aria-busy", "false");
  };

  window.addEventListener("message", (event) => {
    if (event.source !== frame.contentWindow || event.data?.type !== "forgekeys-showroom-state") return;
    if (Number.isFinite(event.data.height)) reportedHeight = event.data.height;
    applyFrameHeight();
    if (event.data.ready) reveal();
  });

  frame.addEventListener("load", () => {
    window.setTimeout(requestState, 50);
    window.setTimeout(requestState, 500);
  });
  compactViewport.addEventListener?.("change", () => {
    applyFrameHeight();
    requestState();
  });
  window.addEventListener("resize", requestState);

  window.setTimeout(() => {
    if (!stage.classList.contains("is-ready")) reveal();
  }, 10000);
})();
