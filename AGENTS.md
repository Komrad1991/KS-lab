# AGENTS Guidelines

This document provides the operational and stylistic rules for agentic coding agents that work inside this repository. It covers how to build, lint, and test code, plus coding conventions that keep the codebase clean and maintainable.

## Environment

- Development is performed via **OpenCode** on **Windows 11**.
- Available tools: `bash`, `read`, `glob`, `grep`, `edit`, `write`, `task`, `webfetch`, `todowrite`, `skill`.
- Two operational modes: `Plan` (read-only, planning only) and `Build` (read-write, implementation).

## OpenCode Commands

- `bash`: Run shell commands (with timeout, workdir support)
- `read`: Read file or directory contents
- `glob`: Find files by pattern
- `grep`: Search file contents using regex
- `edit`: Apply exact string replacement in a file (requires prior read)
- `write`: Write a new file or overwrite existing (requires prior read if overwriting)
- `task`: Launch a specialized agent for complex multistep tasks
- `webfetch`: Fetch and convert web content (markdown/text/html)
- `todowrite`: Create and manage a structured task list
- `skill`: Load a specialized skill

Use these tools to navigate, modify, and validate the codebase. Always read files before editing them with `edit`. When creating new files, `write` can be used directly.


Table of contents
- Quick start: common commands
- Running a single test
- Build and lint commands
- Type checking and formatting
- Code style guidelines
- Imports and module structure
- Types and naming conventions
- Error handling and async patterns
- Testing philosophy and conventions
- Documentation and comments
- Cursor rules and Copilot rules
- Repo patterns and conventions
- How to contribute changes

## Quick start: common commands
- Build: npm run build (or the project-specific build script)
- Lint: npm run lint
- Type check: npm run typecheck or tsc -p tsconfig.json
- Test: npm test
- Format: npm run format
- Run a single test: see below under "Running a single test" for common runners.

If your project uses yarn or pnpm, substitute accordingly (e.g. yarn build, pnpm test).

### OpenCode-specific commands
During development with OpenCode, the agent can use the following tools:
- `bash`: Execute shell commands (with timeout and working directory support)
- `read`: Read file or directory contents
- `glob`: Find files by pattern (e.g., `**/*.ts`)
- `grep`: Search file contents using regex
- `edit`: Apply exact string replacement in a file (requires prior `read`)
- `write`: Write a new file or overwrite existing (requires prior `read` if overwriting)
- `task`: Launch a specialized agent for complex multistep tasks
- `webfetch`: Fetch and convert web content (markdown/text/html)
- `todowrite`: Create and manage a structured task list
- `skill`: Load a specialized skill

These tools are used to navigate, modify, and validate the codebase. Always read files before editing them with `edit`. When creating new files, `write` can be used directly.

### Operational Modes
- **Plan Mode**: Read-only, planning only. No code changes, no file edits. Used for analyzing, asking questions, and creating plans.
- **Build Mode**: Read-write, implementation. Allowed to modify files, run commands, and commit changes.

Switch modes as needed to match the phase of work (planning vs. implementation).


## Running a single test
Support varies by test runner. Common patterns:
- Jest
  - Run a single test name: npm test -- -t "name of test"
  - Run a specific file: npm test -- path/to/file.test.js
- Vitest
  - Run by test name: npm test -- -t "name of test"  (or npm test -- --testNamePattern="name")
- Other runners
  - Use the project’s npm script that targets single-test mode, or invoke the runner directly and pass your selector (e.g. test name or path).

If you are unsure which runner is used, try npm test -- --help or inspect package.json "scripts" for clues.

## Build and lint commands
- Build: npm run build
- Lint: npm run lint
- Type check: npm run typecheck
- Test: npm test
- Quick CI-friendly test: npm test -- --runInBand  (useful in limited CPU environments)
- Run a single test (detail above) to save time during development.

For single-test workflows, prefer running the small subset first to catch regressions early.

## Type checking and formatting
- Type checking: npm run typecheck or npx tsc -p tsconfig.json
- Formatting: npm run format (or npx prettier --write .)
- Ensure Prettier/ESLint configurations are respected; fix formatting before submitting patches.

## Code style guidelines
- General philosophy: clarity, consistency, and safety. Small, testable units with explicit behavior.
- Formatting: rely on project tooling (Prettier/ESLint). Do not manually reformat deeply; let tooling do it.
- Line length: typical max 100-120 chars; wrap long expressions to improve readability.
- Comments: comment non-obvious business logic. Avoid excessive comments that state the obvious.
- Documentation: export public APIs with clear JSDoc/TSdoc annotations.
- Accessibility: where relevant, consider accessibility implications in UI code.
- Internationalization: avoid hard-coded strings; use i18n hooks/utilities if available.
- Security: validate inputs, avoid leaking secrets, use environment variables for config.
- Testing: unit tests for critical paths; aim for deterministic tests.
- Performance: avoid premature optimization; prefer readable code and small functions.
- Versioning/CI: commit messages should explain why, not just what changed. Follow conventional commits style when required by the project.

## Imports and module structure
- Import order: builtins, external packages, internal modules, relative paths (with blank lines between groups).
- Use absolute imports when importing from internal modules that live at project root alias; prefer path aliases if configured.
- Avoid default exports where possible; prefer named exports for tree-shaping and easier testing.
- Barrel files: create barrel index.ts only when it reduces complexity; avoid to prevent circulars.
- Side effects: import modules should not execute code unless side effects are intentional and documented.

## Types and naming conventions
- Use TypeScript types explicitly. Avoid any; prefer unknown when representing external data.
- Naming:
  - Variables/functions: camelCase
  - Classes/Types/Interfaces: PascalCase
  - Constants: ALL_CAPS with underscores
  - Async functions: name ends with "Async" if not obvious from context
- Interfaces should describe data shapes; type aliases for union shapes when appropriate.
- Prefer explicit return types on exported functions/classes.
- Use discriminated unions for complex state machines; keep code readable.

## Error handling and async patterns
- Use try/catch around async operations that can fail; preserve stack traces.
- Throw descriptive errors with contextual messages; include relevant identifiers.
- Do not swallow errors; rethrow or convert to domain-specific error types.
- Avoid throwing strings; throw Error objects with meaningful messages.
- Use finally where necessary to release resources.
- When using external calls, validate their results before proceeding.

## Testing philosophy and conventions
- Tests should be deterministic and isolated.
- Name tests clearly: describe blocks state the scenario; it blocks state the expectation.
- Use a single assertion per test when possible to improve failure locality; group with logical test suites otherwise.
- Mock external dependencies; restore mocks after tests.
- Coverage: ensure critical paths are covered; document gaps in test plans.
- End-to-end tests should be clearly separated from unit tests.

## Documentation and comments
- Public APIs must be documented with JSDoc/TSdoc; describe parameters, return values, and side effects.
- Inline comments should explain why, not what, unless the code is intentionally tricky.
- Use typed examples in docs generally; avoid relying on runtime types.

## Cursor rules
If Cursor rules exist in the repository, honor them exactly as configured. Look for:
- .cursor/rules/ or .cursorrules directories.
- Any per-project constraints on editing style, navigation, or command usage.
If you cannot find them, document the absence and proceed with standard conventions.

## Copilot rules
If Copilot rules exist (e.g., .github/copilot-instructions.md), follow them. If not present, proceed with default safety and readability practices.

## Repository patterns and conventions
- Use existing project layout; avoid creating new patterns unless they simplify maintenance.
- Tests, lint, and builds should be runnable from the repo root without special tooling beyond npm/yarn/pnpm.
- Include a short rationale in commit messages about why a change was made, not just what changed.

## How to contribute changes
- Create a small, focused patch that passes lint and tests locally.
- Run single-test commands when debugging tests to reduce feedback time.
- Add or update tests to cover new behavior; ensure no regressions.
- Update AGENTS.md when project conventions evolve; keep it near the repo root.

## Example commands (quick copy-paste)
- Build: npm run build
- Lint: npm run lint
- Typecheck: npm run typecheck
- Test: npm test
- Run a single Jest test: npm test -- -t "my test name"
- Run a single Vitest test: npm test -- -g "my test name"
- Run a specific test file: npm test -- tests/my.test.ts

Appendix: Troubleshooting and quick references
- If tests fail, run with verbose: npm test -- --runInBand --verbose
- Check node_modules integrity: rm -rf node_modules && npm install
- Use npm ci when using package-lock.json for deterministic installs

Appendix: Accessibility and internationalization reminders
- Ensure UI components provide aria-labels or equivalent for screen readers
- Do not hard-code strings; extract into i18n catalogs when available

- End of AGENTS.md

- WhatsNext: Next steps and verification
- Run the full test suite locally and verify no lint errors.
- If adding new rules, update tests and docs accordingly.
- Consider adding a pre-commit hook to enforce lint/format.
