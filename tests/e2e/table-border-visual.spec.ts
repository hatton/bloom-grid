import { test, expect } from "@playwright/test";
import { attachGridsToPage } from "./utils/grid-attachment";

test.describe("Table Border Visual Validation", () => {
  test("validates border rendering in real browser", async ({ page }) => {
    // Navigate to the table-border demo
    await page.goto("/demo/table-border.html");

    // Wait for the page to load
    await page.waitForSelector(".grid");

    // Manually attach grids since we removed script tags from HTML files
    await attachGridsToPage(page);

    // === Grid 1: Red Cross Pattern (should apply per-side borders) ===
    const grid1 = page.locator("#grid-with-red-cross");
    await expect(grid1).toBeVisible();

    const r1c1 = grid1.locator(".cell").nth(0);
    const r1c2 = grid1.locator(".cell").nth(1);
    const r2c1 = grid1.locator(".cell").nth(2);
    const r2c2 = grid1.locator(".cell").nth(3);

    // Check computed styles for r1c1 (should have red borders applied via per-side CSS borders)
    const r1c1Styles = await r1c1.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        // Individual border styles
        borderTopStyle: computed.borderTopStyle,
        borderRightStyle: computed.borderRightStyle,
        borderBottomStyle: computed.borderBottomStyle,
        borderLeftStyle: computed.borderLeftStyle,
        borderTopColor: computed.borderTopColor,
        borderRightColor: computed.borderRightColor,
        borderBottomColor: computed.borderBottomColor,
        borderLeftColor: computed.borderLeftColor,
      };
    });

    // Verify r1c1 has solid red borders on all sides per the cross pattern
    expect(r1c1Styles.borderTopStyle).toBe("solid");
    expect(r1c1Styles.borderRightStyle).toBe("solid");
    expect(r1c1Styles.borderBottomStyle).toBe("solid");
    expect(r1c1Styles.borderLeftStyle).toBe("solid");
    const redPattern =
      /(rgb\(\s*255\s*,\s*0\s*,\s*0\s*\))|(#ff0000)|(#f00)|\bred\b/i;
    expect(r1c1Styles.borderTopColor).toMatch(redPattern);
    expect(r1c1Styles.borderRightColor).toMatch(redPattern);
    expect(r1c1Styles.borderBottomColor).toMatch(redPattern);
    expect(r1c1Styles.borderLeftColor).toMatch(redPattern);

    // Check r2c2 (should also have red borders)
    const r2c2Styles = await r2c2.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        borderTopStyle: computed.borderTopStyle,
        borderRightStyle: computed.borderRightStyle,
        borderBottomStyle: computed.borderBottomStyle,
        borderLeftStyle: computed.borderLeftStyle,
        borderTopColor: computed.borderTopColor,
        borderRightColor: computed.borderRightColor,
        borderBottomColor: computed.borderBottomColor,
        borderLeftColor: computed.borderLeftColor,
      };
    });

    // In border-only mode, interior shared edges are owned by top/left cells.
    // For bottom-right cell, expect bottom and right to be drawn (perimeter), top/left none.
    expect(r2c2Styles.borderTopStyle).toBe("none");
    expect(r2c2Styles.borderLeftStyle).toBe("none");
    expect(r2c2Styles.borderRightStyle).toBe("solid");
    expect(r2c2Styles.borderBottomStyle).toBe("solid");

    // Check r1c2 and r2c1 (should have no outlines)
    // No specific assertion for r1c2 now; depends on model of cross pattern

    // === Grid 2: External Border Pattern (should use individual borders) ===
    const grid2 = page.locator("#grid-with-external-border");
    await expect(grid2).toBeVisible();

    const grid2r1c1 = grid2.locator(".cell").nth(0);

    const grid2Styles = await grid2r1c1.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        // Should use individual border styles
        borderTopStyle: computed.borderTopStyle,
        borderLeftStyle: computed.borderLeftStyle,
        borderRightStyle: computed.borderRightStyle,
        borderBottomStyle: computed.borderBottomStyle,
        borderTopColor: computed.borderTopColor,
        borderLeftColor: computed.borderLeftColor,
      };
    });

    // Should use individual borders
    expect(grid2Styles.borderTopStyle).toBe("solid");
    expect(grid2Styles.borderLeftStyle).toBe("solid");
    expect(grid2Styles.borderRightStyle).toBe("none");
    expect(grid2Styles.borderBottomStyle).toBe("none");

    // Colors should be black (#000)
    expect(grid2Styles.borderTopColor).toMatch(/(rgb\(0,\s*0,\s*0\)|#000)/);
    expect(grid2Styles.borderLeftColor).toMatch(/(rgb\(0,\s*0,\s*0\)|#000)/);

    // === Grid 3: Red Divider Pattern (should use individual borders) ===
    const grid3 = page.locator("#grid-with-red-border");
    await expect(grid3).toBeVisible();

    const grid3r1c1 = grid3.locator(".cell").nth(0);

    const grid3Styles = await grid3r1c1.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        borderRightStyle: computed.borderRightStyle,
        borderRightColor: computed.borderRightColor,
        borderTopStyle: computed.borderTopStyle,
        borderBottomStyle: computed.borderBottomStyle,
        borderLeftStyle: computed.borderLeftStyle,
      };
    });

    // Should have right border only
    expect(grid3Styles.borderRightStyle).toBe("solid");
    expect(grid3Styles.borderRightColor).toMatch(redPattern);
    expect(grid3Styles.borderTopStyle).toBe("none");
    expect(grid3Styles.borderBottomStyle).toBe("none");
    expect(grid3Styles.borderLeftStyle).toBe("none");
  });

  test("visual regression - grid rendering", async ({ page }) => {
    await page.goto("/demo/table-border.html");
    await page.waitForSelector(".grid");

    // Manually attach grids since we removed script tags from HTML files
    await attachGridsToPage(page);

    // Take a screenshot for visual regression testing
    await expect(page).toHaveScreenshot("table-border-grids.png", {
      maxDiffPixelRatio: 0.03,
    });
  });
});
