import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

function trySSL() {
  try {
    return {
      https: {
        key: fs.readFileSync(".cert/key.pem"),
        cert: fs.readFileSync(".cert/cert.pem"),
      },
      host: true, // allows LAN access
    };
  } catch (err) {
    console.warn("no SSL cert found, falling back to HTTP");
    return undefined;
  }
}

export default defineConfig({
  plugins: [react()],
  build: { outDir: "build" },
  server: trySSL(),
});
