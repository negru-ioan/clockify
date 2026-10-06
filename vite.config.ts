import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	publicDir: path.resolve(__dirname, "./public/"),
	server: {
		port: 9999,
		strictPort: true,
		proxy: { "/api": "http://127.0.0.1:3001" },
	},
});
