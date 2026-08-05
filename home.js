(() => {
  const carousel = document.querySelector("[data-home-carousel]");
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll(".home-hero-slide"));
  const dots = Array.from(carousel.querySelectorAll("[data-home-dot]"));
  const previous = carousel.querySelector("[data-home-prev]");
  const next = carousel.querySelector("[data-home-next]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let timerId = 0;

  const showSlide = (nextIndex) => {
    activeIndex = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });
    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  };

  const stop = () => {
    window.clearInterval(timerId);
    timerId = 0;
  };

  const start = () => {
    stop();
    if (reducedMotion.matches || document.hidden) return;
    timerId = window.setInterval(() => showSlide(activeIndex + 1), 6000);
  };

  const select = (nextIndex) => {
    showSlide(nextIndex);
    start();
  };

  previous?.addEventListener("click", () => select(activeIndex - 1));
  next?.addEventListener("click", () => select(activeIndex + 1));
  dots.forEach((dot, index) => dot.addEventListener("click", () => select(index)));

  carousel.addEventListener("pointerenter", stop);
  carousel.addEventListener("pointerleave", start);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", (event) => {
    if (!carousel.contains(event.relatedTarget)) start();
  });
  document.addEventListener("visibilitychange", start);
  reducedMotion.addEventListener?.("change", start);

  showSlide(0);
  start();
})();

(() => {
  const section = document.querySelector("[data-home-film]");
  if (!section) return;

  const player = section.querySelector("[data-film-player]");
  const caption = section.querySelector("[data-film-caption]");
  const choices = Array.from(section.querySelectorAll("[data-film-src]"));
  if (!player || choices.length === 0) return;

  const selectFilm = (choice) => {
    const source = choice.dataset.filmSrc;
    if (!source) return;

    choices.forEach((button) => {
      const isActive = button === choice;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    player.pause();
    player.poster = choice.dataset.filmPoster || "";
    player.src = source;
    player.setAttribute("aria-label", choice.dataset.filmTitle || "ForgeKeys studio film");
    if (caption) caption.textContent = choice.dataset.filmTitle || "";
    player.load();
    player.play().catch(() => {});
  };

  choices.forEach((choice) => {
    choice.addEventListener("click", () => selectFilm(choice));
  });
})();
