import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/qr-ordering/",  // ⚡ 一定要和 repo 名稱相同
  plugins: [react()],
});
