import { defineConfig } from "nitro";

export default defineConfig({
  serverDir: "./server",
  experimental: {
    database: true
  },
  database: {
    default: {
      connector: "better-sqlite3",
      options: { name: "db" }
    },
  }
});
