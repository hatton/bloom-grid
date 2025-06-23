import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig(({ command }) => {
  const isProduction = command === "build";

  return {
    plugins: [
      react(),
      dts({
        insertTypesEntry: true,
      }),
      // Custom plugin to serve API endpoints during development
      {
        name: "demo-api-server",
        configureServer(server) {
          server.middlewares.use("/api/examples", (req, res, next) => {
            if (req.method === "GET") {
              try {
                const demoDir = path.join(__dirname, "demo");
                const files = fs.readdirSync(demoDir);
                const htmlFiles = files
                  .filter(
                    (file) => file.endsWith(".html") && file !== "index.html"
                  )
                  .map((file) => ({
                    name: file
                      .replace(".html", "")
                      .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capitals
                      .replace(/^\w/, (c) => c.toUpperCase()) // Capitalize first letter
                      .replace(/\d+/, (match) => ` ${match}`), // Add space before numbers
                    file: file,
                  }));

                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.end(JSON.stringify(htmlFiles));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Failed to read directory" }));
              }
            } else {
              next();
            }
          });
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
    // Development server configuration
    server: {
      open: "/example.html",
    },
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
