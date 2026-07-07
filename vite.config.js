import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: 'base' must match your GitHub repo name exactly, with slashes on both sides.
// e.g. if your repo is github.com/yourname/aurynox-planner, base should be '/aurynox-planner/'.
// If it's wrong, the page will load but show a blank screen (assets 404 silently).
export default defineConfig({
  plugins: [react()],
  base: "/aurynox-planner/",
});