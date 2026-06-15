# Repository Guidelines

## Project Structure & Module Organization

This is a Vue 3 + Vite dashboard for 2026 World Cup schedules, odds, predictions, and charts. Application source lives in `src/`: `views/` contains routed pages, `components/` holds reusable UI and chart pieces, `stores/` contains Pinia state, `composables/` holds shared logic such as stats aggregation, `router/` defines routes, `data/` contains fallback match data, and `styles/` contains global CSS. Static runtime JSON lives in `public/` (`live.json`, `odds.json`, `predictions.json`, `feedback.json`). Data update scripts are in `scripts/`. `dist/` is generated build output; do not edit it by hand.

## Build, Test, and Development Commands

Run `npm install` to install dependencies. Use `npm run dev` to start Vite locally at `http://localhost:5173`. Use `npm run build` to generate the static production bundle in `dist/`, and `npm run preview` to inspect that bundle locally. Data refresh commands are `npm run fetch-data`, which writes football-data.org results to `public/live.json` and requires `FOOTBALL_DATA_TOKEN`, and `npm run fetch-odds`, which updates `public/odds.json` from sporttery.

## Coding Style & Naming Conventions

Use Vue single-file components with `<script setup>`. Follow the existing style: two-space indentation, single quotes in JavaScript imports/strings, no semicolons, and concise comments only where behavior is not obvious. Name Vue components in PascalCase, for example `MatchCard.vue` and `GoalTimeline.vue`. Name composables with the `useX` pattern, for example `useStats.js`. Keep route-level screens in `src/views/` and shared display widgets in `src/components/`.

## Testing Guidelines

No automated test framework is currently configured. Before submitting changes, run `npm run build` as the minimum verification. For data or UI changes, also run `npm run dev` and manually check the affected routes, especially `/schedule`, `/timeline`, `/odds`, `/predictions`, and `/stats`. If tests are added later, prefer colocated `*.spec.js` files near the logic they cover and focus first on pure functions in `src/composables/`.

## Commit & Pull Request Guidelines

This checkout has no accessible Git history, so no repository-specific commit pattern can be inferred. Use short imperative commits, preferably Conventional Commits such as `feat: add predictions accuracy panel` or `fix: handle missing odds data`. Pull requests should include a brief summary, verification steps, linked issue or task when available, and screenshots for visible UI changes. Mention any data files regenerated under `public/`.

## Security & Configuration Tips

Do not commit API tokens. Use `FOOTBALL_DATA_TOKEN` in the shell when fetching live data. Keep generated JSON valid and deterministic where possible so the app can fall back gracefully and avoid blank states.
