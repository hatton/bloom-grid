import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig(({ command }) => {
  const isProduction = command === "build";

  return {
    plugins: [
      dts({
        insertTypesEntry: true,
      }),
    ],
    // Development server configuration
    server: {
      open: "/example.html",
    },
    // Build configuration (only applies when building)
    build: isProduction
      ? {
          lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "BloomGrid",
            formats: ["es", "umd"],
            fileName: (format) => `bloom-grid.${format}.js`,
          },
          rollupOptions: {
            // Make sure to externalize deps that shouldn't be bundled
            // into your library
            external: [],
            output: {
              // Use named exports to avoid the warning
              exports: "named",
              // Provide global variables to use in the UMD build
              // for externalized deps
              globals: {},
            },
          },
        }
      : {},
  };
});
