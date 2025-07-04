import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { getExamples, handleSaveExampleRequest } from "./demo/example-api";

export default defineConfig(({ command }) => {
  const isProduction = command === "build";

  return {
    plugins: [
      react(),
      dts({
        insertTypesEntry: true,
      }),
      {
        name: "save-example-api",
        configureServer(server) {
          server.middlewares.use("/api/save-example", handleSaveExampleRequest);
        },
      },
      {
        name: "demo-api-server",
        configureServer(server) {
          server.middlewares.use("/api/examples", getExamples);
        },
      },
      // Custom plugin to copy CSS file to dist folder
      {
        name: "copy-css-file",
        writeBundle() {
          if (fs.existsSync("src/bloom-grid.css")) {
            if (!fs.existsSync("dist")) {
              fs.mkdirSync("dist");
            }
            fs.copyFileSync(
              "src/bloom-grid.css",
              path.join("dist", "bloom-grid.css")
            );
          }
        },
      },
    ],

    // Build configuration (only applies when building)
    build: isProduction
      ? {
          lib: {
            entry: resolve(__dirname, "src/index.tsx"),
            name: "BloomGrid",
            formats: ["es", "umd"],
            fileName: (format) => `bloom-grid.${format}.js`,
          },
          rollupOptions: {
            // Make sure to externalize deps that shouldn't be bundled
            // into your library
            external: ["react", "react-dom"],
            output: {
              // Use named exports to avoid the warning
              exports: "named",
              // Provide global variables to use in the UMD build
              // for externalized deps
              globals: {
                react: "React",
                "react-dom": "ReactDOM",
              },
            },
          },
        }
      : {},
  };
});
