(() => {
  const board = document.querySelector("[data-design-board]");
  const details = document.querySelector("[data-key-details]");
  const notes = document.querySelector("[data-production-notes]");

  const showKey = (key, design) => {
    const colour = design.palette[key.style];
    details.querySelector("h2").textContent = `${key.label} · ${key.code}`;
    details.querySelector("dl").innerHTML = [
      ["Size", `${key.u || 1}U${key.h ? ` × ${key.h}U` : ""}`],
      ["Surface", key.style],
      ["Background", colour.background],
      ["Legend", colour.legend],
      ["Artwork", key.artwork],
    ].map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join("");
  };

  fetch("assets/keycap-designs/midnight-butterfly.json?v=design-data1")
    .then((response) => {
      if (!response.ok) throw new Error("Could not load the design data.");
      return response.json();
    })
    .then((design) => {
      design.rows.forEach((row) => {
        const rowElement = document.createElement("div");
        rowElement.className = "key-row";
        row.forEach((key) => {
          if (key.gap) {
            const gap = document.createElement("span");
            gap.className = "gap";
            gap.style.setProperty("--u", key.gap);
            rowElement.append(gap);
            return;
          }
          const colour = design.palette[key.style];
          const button = document.createElement("button");
          button.className = "key";
          button.type = "button";
          button.textContent = key.label;
          button.dataset.artwork = key.artwork;
          button.style.setProperty("--u", key.u || 1);
          button.style.setProperty("--key", colour.background);
          button.style.setProperty("--legend", colour.legend);
          button.setAttribute("aria-label", `${key.label}, ${key.code}`);
          button.addEventListener("click", () => showKey(key, design));
          rowElement.append(button);
        });
        board.append(rowElement);
      });
      const factoryStatus = design.manufacturingReady ? "Factory specification confirmed" : "Awaiting original factory specification";
      notes.innerHTML = `<h2>${factoryStatus}</h2><ul>${design.productionNotes.map((note) => `<li>${note}</li>`).join("")}</ul>`;
    })
    .catch((error) => {
      board.innerHTML = `<p class="error">${error.message}</p>`;
    });
})();
