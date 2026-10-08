(() => {
  const root = document.documentElement;
  const deadline = Date.parse(root.dataset.anniversaryEndsAt);
  if (!Number.isFinite(deadline)) return;
  let timer;

  const check = () => {
    clearTimeout(timer);
    if (root.dataset.anniversaryExpired === "true" || Date.now() >= deadline) {
      // Runs in the head: hide stale hints before the body can be painted.
      root.dataset.anniversaryExpired = "true";
      root.classList.add("anniversary-expired");
      if (document.readyState === "loading") return;
      document
        .querySelectorAll("[data-anniversary-event]")
        .forEach((node) => node.remove());
      const button = document.querySelector("[data-anniversary-cta]");
      if (button) {
        button.setAttribute("href", "#geschichte");
        button.textContent = "Unsere Geschichte";
        button.removeAttribute("data-anniversary-pending");
      }
      const history = document.querySelector("[data-anniversary-history]");
      if (history) {
        history.textContent = root.dataset.anniversaryHistoryText;
        history.removeAttribute("data-anniversary-pending");
      }
      return;
    }
    // Also switches an already open page; clamp long waits to the browser limit.
    timer = setTimeout(
      check,
      Math.max(1, Math.min(deadline - Date.now(), 2147483647)),
    );
  };

  document.addEventListener("DOMContentLoaded", check, { once: true });
  document.addEventListener("visibilitychange", check);
  window.addEventListener("pageshow", check);
  check();
})();
