import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ── GitHub Pages ──────────────────────────────────────────────────
// Change this to match the repository name on GitHub.
const REPO_NAME = 'editor-mapes'
// ─────────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [react()],
  // In production builds the base path is /<repo>/ so that all asset
  // URLs resolve correctly on GitHub Pages.
  // In local dev (npm run dev) base stays '/' — no change needed.
  base: process.env.NODE_ENV === 'production' ? `/${REPO_NAME}/` : '/',
})
