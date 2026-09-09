import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue()],
  base: "/macro-dashboard/",
  build: {
    rollupOptions: {
      input: { index: resolve("index.html"), macro: resolve("macro.html") },
    },
  },
});
