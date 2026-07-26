import path from "path";
import { defineConfig } from "vite";
import RubyPlugin from "vite-plugin-ruby";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [RubyPlugin(), svelte()],
  resolve: {
    alias: {
      "$frontendlib": path.resolve(__dirname, "frontend/src/lib"),
      "$frontendsrc": path.resolve(__dirname, "frontend/src"),
    },
  },
});

