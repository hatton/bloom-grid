import { attachGrid } from "../src";

// Attach after DOMContentLoaded to ensure elements are present
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll<HTMLElement>(".grid").forEach((g) => attachGrid(g));
});
