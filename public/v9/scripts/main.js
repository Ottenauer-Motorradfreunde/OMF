(() => {
  const header = document.getElementById("header");
  const menuBtn = document.getElementById("menuBtn");
  const drawer = document.getElementById("drawer");
  const countdown = document.getElementById("countdown");

  if (!header || !menuBtn || !drawer) return;

  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 24);
  };

  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const seal = document.querySelector(".anniversary-seal");
  if (seal && "IntersectionObserver" in window) {
    const sealObserver = new IntersectionObserver(([entry]) => {
      seal.classList.toggle("is-visible", entry.isIntersecting);
    });
    sealObserver.observe(seal);
  } else if (seal) {
    seal.classList.add("is-visible");
  }

  const mapHost = document.getElementById("venue-map-frame");
  const mapLoad = document.querySelector("[data-map-load]");
  const mapUnload = document.querySelector("[data-map-unload]");
  const mapPlaceholder = document.querySelector("[data-map-placeholder]");
  const mapStatus = document.querySelector("[data-map-status]");
  const mapPreview = document.querySelector("[data-map-preview]");
  const mapOpen = document.querySelector("[data-map-open]");
  const mapCancel = document.querySelector("[data-map-cancel]");
  if (
    mapHost &&
    mapLoad &&
    mapUnload &&
    mapPlaceholder &&
    mapStatus &&
    mapPreview &&
    mapOpen &&
    mapCancel
  ) {
    mapOpen.hidden = false;
    const showPreview = () => {
      mapHost.replaceChildren();
      mapHost.hidden = true;
      mapPlaceholder.hidden = true;
      mapPreview.hidden = false;
      mapUnload.hidden = true;
      mapOpen.setAttribute("aria-expanded", "false");
      mapOpen.focus();
    };
    mapOpen.addEventListener("click", () => {
      mapPreview.hidden = true;
      mapPlaceholder.hidden = false;
      mapOpen.setAttribute("aria-expanded", "true");
      mapStatus.textContent = "";
      mapLoad.focus();
    });
    mapCancel.addEventListener("click", showPreview);
    mapLoad.addEventListener("click", () => {
      if (mapHost.querySelector("iframe")) return;
      const mapUrl = new URL(mapHost.dataset.mapUrl);
      if (
        mapUrl.origin !== "https://www.openstreetmap.org" ||
        mapUrl.pathname !== "/export/embed.html"
      )
        return;
      // No iframe, connection or stored consent exists before this explicit click.
      const frame = document.createElement("iframe");
      frame.title = "Standortkarte der Merkurhalle Ottenau – OpenStreetMap";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.src = mapUrl.href;
      mapHost.replaceChildren(frame);
      mapHost.hidden = false;
      mapPlaceholder.hidden = true;
      mapUnload.hidden = false;
      mapStatus.textContent = "OpenStreetMap ist aktiviert.";
      mapUnload.focus();
    });
    mapUnload.addEventListener("click", () => {
      showPreview();
      mapStatus.textContent = "Die interaktive Karte ist deaktiviert.";
    });
  }

  const setDrawer = (open) => {
    drawer.classList.toggle("open", open);
    menuBtn.classList.toggle("active", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    drawer.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  };

  menuBtn.addEventListener("click", () => {
    setDrawer(!drawer.classList.contains("open"));
  });

  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setDrawer(false));
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    reveals.forEach((element) => observer.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add("in"));
  }

  if (countdown) {
    const target = new Date(countdown.dataset.target).getTime();
    let countdownTimer;
    const countdownStatus = document.getElementById("countdown-status");
    const countValues = Object.fromEntries(
      Array.from(countdown.querySelectorAll("[data-count]")).map((element) => [
        element.dataset.count,
        element,
      ]),
    );

    function tick() {
      if (!countdown.isConnected) {
        clearInterval(countdownTimer);
        return;
      }
      const diff = target - Date.now();
      if (diff <= 0) {
        countdown.hidden = true;
        if (countdownStatus) countdownStatus.hidden = false;
        clearInterval(countdownTimer);
        return;
      }
      const values = {
        days: Math.floor(diff / 86400000),
        hours: Math.floor(diff / 3600000) % 24,
        minutes: Math.floor(diff / 60000) % 60,
        seconds: Math.floor(diff / 1000) % 60,
      };
      for (const [unit, value] of Object.entries(values)) {
        const element = countValues[unit];
        const text =
          unit === "days" ? String(value) : String(value).padStart(2, "0");
        if (element && element.textContent !== text) element.textContent = text;
      }
    }

    tick();
    if (Number.isFinite(target) && target > Date.now())
      countdownTimer = setInterval(tick, 1000);
  }

  const viewer = document.getElementById("photo-viewer");
  const viewerImage = document.getElementById("photo-viewer-image");
  const viewerCaption = document.getElementById("photo-viewer-caption");
  const viewerCounter = document.getElementById("photo-viewer-counter");
  const photoLinks = Array.from(
    document.querySelectorAll("a[data-photo-caption]"),
  );
  // Repeated photos (e.g. anniversary card and story) appear only once in the viewer.
  const photos = Array.from(
    new Map(photoLinks.map((link) => [link.href, link])).values(),
  );

  if (
    viewer &&
    viewerImage &&
    viewerCaption &&
    viewerCounter &&
    typeof viewer.showModal === "function"
  ) {
    let photoIndex = 0;
    let previousOverflow = "";
    const showPhoto = (index) => {
      photoIndex = (index + photos.length) % photos.length;
      const photo = photos[photoIndex];
      viewerImage.src = photo.href;
      viewerImage.alt = photo.dataset.photoAlt;
      viewerCaption.textContent = photo.dataset.photoCaption;
      viewerCounter.textContent = `${photoIndex + 1} / ${photos.length}`;
    };

    photoLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        if (
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        showPhoto(photos.findIndex((photo) => photo.href === link.href));
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        viewer.showModal();
      });
    });
    viewer
      .querySelector(".photo-viewer__close")
      .addEventListener("click", () => viewer.close());
    viewer
      .querySelector("[data-photo-prev]")
      .addEventListener("click", () => showPhoto(photoIndex - 1));
    viewer
      .querySelector("[data-photo-next]")
      .addEventListener("click", () => showPhoto(photoIndex + 1));
    viewer.addEventListener("click", (event) => {
      if (event.target === viewer) viewer.close();
    });
    viewer.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        showPhoto(photoIndex + (event.key === "ArrowLeft" ? -1 : 1));
      }
    });
    viewer.addEventListener("close", () => {
      document.body.style.overflow = previousOverflow;
      viewerImage.removeAttribute("src");
    });
  }

  addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("open")) {
      setDrawer(false);
      menuBtn.focus();
    }
  });
})();
