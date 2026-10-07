(() => {
  const categoryTabs = [...document.querySelectorAll(".portfolio-category")];
  const categoryPanels = [...document.querySelectorAll(".portfolio-category-panel")];
  categoryTabs.forEach((tab) => tab.addEventListener("click", () => {
    const selected = tab.dataset.category;
    categoryTabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
    categoryPanels.forEach((panel) => {
      const active = panel.dataset.categoryPanel === selected;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
    history.replaceState(null, "", selected === "website" ? "#website-banners" : "#social-designs");
  }));
  if (location.hash === "#website-banners") categoryTabs.find((tab) => tab.dataset.category === "website")?.click();

  const tabs = [...document.querySelectorAll(".showcase-tab")];
  const panels = [...document.querySelectorAll(".client-panel")];
  const activate = (slug, focus = false) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.client === slug;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      if (active && focus) tab.focus();
    });
    panels.forEach((panel) => {
      const active = panel.dataset.panel === slug;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
    history.replaceState(null, "", `#${slug}`);
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(tab.dataset.client));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "ArrowLeft" ? index + 1 : index - 1;
      const target = tabs[(next + tabs.length) % tabs.length];
      activate(target.dataset.client, true);
    });
  });
  const requested = location.hash.slice(1);
  if (requested && tabs.some((tab) => tab.dataset.client === requested)) activate(requested);

  const lightbox = document.querySelector("#showcase-lightbox");
  if (!lightbox) return;
  const lightboxImage = lightbox.querySelector("img");
  const close = () => {
    lightbox.hidden = true;
    lightboxImage.removeAttribute("src");
    document.body.style.overflow = "";
  };
  document.querySelectorAll(".image-button").forEach((button) => button.addEventListener("click", () => {
    lightboxImage.src = button.dataset.full;
    lightboxImage.alt = button.getAttribute("aria-label");
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightbox.querySelector(".lightbox-close").focus();
  }));
  lightbox.querySelector(".lightbox-close").addEventListener("click", close);
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) close(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !lightbox.hidden) close(); });
})();
