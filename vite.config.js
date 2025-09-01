// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/qr-ordering/",   // 👈 跟 repo 名稱一樣
});
