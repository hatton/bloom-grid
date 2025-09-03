import { Page } from "@playwright/test";

/**
 * Utility function to attach grids to HTML pages that don't have their own script tags.
 * This is needed for lightweight HTML examples that rely on tests to handle grid attachment.
 */
export async function attachGridsToPage(page: Page): Promise<void> {
  await page.addScriptTag({
    type: "module",
    content: `
      import { attachGrid } from "/src/attach.js";
      document.querySelectorAll(".grid").forEach((grid) => {
        attachGrid(grid);
      });
    `,
  });

  // Wait a bit for grid attachment to complete
  await page.waitForTimeout(100);
}
