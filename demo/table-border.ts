import { attachAllGrids } from "./utils/gridAttachment";

// Attach after DOMContentLoaded to ensure elements are present
window.addEventListener("DOMContentLoaded", () => {
  attachAllGrids();
});
