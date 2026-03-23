import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import vue from '@vitejs/plugin-vue'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [nitro(), vue(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
});
