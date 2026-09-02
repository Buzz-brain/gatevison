import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!/[\\/]node_modules[\\/]/.test(id)) return undefined;
          const rel = id.split(/[\\/]node_modules[\\/]/).pop()!;
          const segments = rel.split("/");
          let pkg = segments[0]!;
          if (pkg.startsWith("@")) pkg = `${pkg}/${segments[1]!}`;
          if (pkg === "react" || pkg === "react-dom" || pkg === "scheduler" || pkg === "react-is" || pkg === "loose-envify" || pkg === "js-tokens") return "vendor-react";
          if (pkg.startsWith("@tanstack/")) return "vendor-router";
          if (pkg === "framer-motion" || pkg === "motion" || pkg.startsWith("motion-")) return "vendor-motion";
          if (pkg.startsWith("@radix-ui/")) return "vendor-radix";
          if (pkg === "lucide-react") return "vendor-icons";
          if (pkg === "axios") return "vendor-http";
          if (pkg === "zustand") return "vendor-state";
          if (pkg === "zod" || pkg === "react-hook-form" || pkg.startsWith("@hookform/") || pkg === "class-variance-authority" || pkg === "clsx" || pkg === "tailwind-merge") return "vendor-utils";
          return "vendor-misc";
        },
      },
    },
  },
});
