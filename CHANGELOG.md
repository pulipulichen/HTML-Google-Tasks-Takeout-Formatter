# Changelog

## [0.0.1] - 2026-05-17

- Added the initial Google Tasks Takeout formatter for converting exported JSON task lists into CSV files grouped by task list and status.
- Added individual CSV downloads and ZIP export with generated filenames based on parsed task list names.
- Added PWA metadata, favicon links, and a service worker cache for offline-friendly app loading.
- Moved app styles and task processing logic into dedicated `styles/style.css` and `scripts/main.js` files for easier maintenance.
- Added Docker Compose and Playwright E2E coverage to load the app, verify the page title, and detect console errors.
- Added a GitHub Actions workflow for running Docker-based E2E tests on pushes, pull requests, and manual dispatches.
- Added project ignore rules for environment files, editor settings, dependencies, and Playwright report artifacts.
