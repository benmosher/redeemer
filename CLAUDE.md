# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Redeemer is a small single-page React app for batch-scanning Marvel Unlimited QR codes. Users scan codes via their phone camera, then click REDEEM to open Marvel's redemption page with all codes at once. Deployed to GitHub Pages at https://benmosher.github.io/redeemer/.

## Commands

- `pnpm i` — install dependencies
- `pnpm start` — run dev server (HTTPS if certs exist, see below)
- `pnpm build` — production build to `build/` directory
- `pnpm create-dev-cert` — generate self-signed SSL cert in `.cert/` (needed for camera access on mobile)

For GitHub Pages deployment, the build uses `--base="/redeemer/"`. This is handled by the CI workflow, not needed locally.

## Architecture

This is a minimal single-component Vite + React + TypeScript app. There is no router, no state management library beyond `use-immer`, and no test framework.

- `src/App.tsx` — the entire application: QR scanner setup via `@zxing/browser`, scanned code state, redeem logic, and all UI
- `src/index.tsx` — React root mount
- `vite.config.ts` — Vite config with optional HTTPS (reads `.cert/` if present for mobile dev)

The app uses `useImmer` for state (scanned codes array + previous batches array). The QR scanner runs in a `useEffect` and writes to state via immer drafts. Camera access requires HTTPS, hence the dev cert setup.
