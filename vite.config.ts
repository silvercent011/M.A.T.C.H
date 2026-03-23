import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import router from "vue-router/vite";

export default defineConfig({
  plugins: [
    nitro(),

    router({
      routesFolder: [
        {
          src: "app/pages",
          path: "",
          exclude: (excluded) => excluded,
          filePatterns: (filePatterns) => filePatterns,
          extensions: (extensions) => extensions,
        },
      ],
    }),
    vue(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
