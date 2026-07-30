(() => {
  const config = window.FORGEKEYS_CONFIG || {};
  const links = config.socialLinks || {};
  const labels = {
    instagram: "Instagram",
    discord: "Discord",
    facebook: "Facebook",
    tiktok: "TikTok",
    youtube: "YouTube"
  };
  const icons = {
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="5"></rect><circle cx="12" cy="12" r="3.5"></circle><circle cx="17" cy="7" r="1"></circle></svg>',
    discord: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 8.5c3-1.4 6-1.4 9 0l1.5 7c-1.6 1.2-3.1 1.8-4.6 2l-.7-1.2c-.5.1-1 .1-1.4 0l-.7 1.2c-1.5-.2-3-.8-4.6-2l1.5-7Z"></path><circle cx="10" cy="12.2" r="1"></circle><circle cx="14" cy="12.2" r="1"></circle></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h2V5h-2.4C10.9 5 10 6.7 10 8.8V11H8v3h2v6h3v-6h2.4l.6-3h-3V9c0-.7.3-1 1-1Z"></path></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5c.4 2.7 1.9 4.3 4.5 4.7v3.1c-1.7-.1-3.2-.6-4.5-1.5v4.2c0 3-2 5-4.8 5-2.6 0-4.7-1.9-4.7-4.4 0-2.7 2.2-4.6 5.4-4.3v3.2c-1.4-.3-2.3.2-2.3 1.1 0 .8.7 1.4 1.6 1.4 1.1 0 1.8-.7 1.8-2.1V5h3Z"></path></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="7" width="17" height="10" rx="3"></rect><path d="m10.5 10 4 2-4 2v-4Z"></path></svg>'
  };

  document.querySelectorAll("[data-social-link]").forEach((link) => {
    const key = link.dataset.socialLink;
    const url = links[key];
    if (!url) {
      link.hidden = true;
      return;
    }
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    link.classList.add("social-link");
    link.setAttribute("aria-label", labels[key] || key);
    link.innerHTML = `${icons[key] || ""}<span class="social-label">${labels[key] || key}</span>`;
  });

  document.querySelectorAll("[data-social-group]").forEach((group) => {
    const visibleLinks = group.querySelectorAll("[data-social-link]:not([hidden])");
    group.hidden = visibleLinks.length === 0;
  });
})();
