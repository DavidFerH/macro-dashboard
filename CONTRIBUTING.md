# Repository Guidelines

## Project Structure & Module Organization

`src/components/` contains Vue controls, cards, and the accessible chart dialog.
`src/catalog/charts.ts` declares the 44 charts. Keep financial calculations in
`src/domain/`, independent of Vue. `pipeline/` downloads and normalizes source
observations. `contracts/` owns the shared JSON schema and source registry.
`tests/unit/` covers TypeScript rules; `pipeline/tests/` covers acquisition;
`tests/e2e/` exercises desktop and mobile journeys. Font assets are bundled locally.

## Build, Test, and Development Commands

- `pnpm install --frozen-lockfile`: install reproducible frontend dependencies.
- `pnpm dev`: serve the dashboard under `/macro-dashboard/`.
- `python -m pipeline.build`: acquire real data using the private environment key.
- `pnpm data:validate`: check the snapshot and derived calculations.
- `pnpm build`: type-check and compile both HTML entry points.
- `pnpm test` and `python -m pytest`: run domain and ingestion tests.
- Generate `.local/demo.json` with `python -m pipeline.build --demo --output .local/demo.json`
  before `pnpm test:e2e`.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, PascalCase Vue filenames, and
descriptive camelCase functions. Python uses four spaces and snake_case.
Prettier owns formatting; ESLint checks TypeScript and Vue. Run `pnpm lint`,
`pnpm typecheck`, and relevant tests before proposing changes. Do not implement
financial formulas inside components or duplicate them in Python.

## Testing Guidelines

Name TypeScript tests `*.test.ts`, Python tests `test_*.py`, and browser tests
`*.spec.ts`. Cover threshold boundaries, missing months, null values, revisions,
units, and incomplete coverage. Use deterministic fixtures for UI tests.
Never replace missing production observations with synthetic data.

## Commit & Pull Request Guidelines

The initial Git history contains only “first commit”; no established convention
exists. Use descriptive scoped messages such as `feat(charts): add curve comparison`.
PRs should describe behavior, methodology changes, validation performed, and linked
issues where relevant. Include screenshots for visual changes and explicitly state
any provider or publication restrictions.

## Security & Configuration

Keep credentials exclusively in ignored `.env` files and GitHub Secrets.
Never prefix a secret with `VITE_`. Preserve user changes and repository instructions.
