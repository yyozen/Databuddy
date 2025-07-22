# Contributing Guide

Thank you for your interest in contributing!

## Monorepo Structure
- This project uses a monorepo with multiple packages in `packages/` and apps in `apps/`.
- Each package may have its own scripts. Most can be run from the root using `bun run <script>` (see below).

## How to Contribute
- Open issues for bugs, questions, or feature requests.
- Fork the repository and create a new branch for your changes.
- Open a pull request with a clear description of your changes to STAGING branch.
- Follow the code style and naming conventions.
- Write concise, clear, and testable code.

## Running and Testing Packages
- Use `bun install` at the root to install all dependencies.
- To run scripts for a package from the root, use:
  - `bun run db:studio` (Drizzle Studio)
  - `bun run clickhouse:init` (Initialize ClickHouse tables)
  - `bun run sdk:build` (Build SDK)
  - `bun run email:dev` (Email dev server)
  - See `package.json` for more root-level scripts.
- You can also `cd` into any package and run its scripts directly.

## Adding New Scripts
- If you add a script to a package, consider adding a forwarding script in the root `package.json` for convenience.
- Use the format: `<package>:<script>` (e.g., `db:push`, `sdk:build`).

## Initializing Databases
- For Postgres (Drizzle):
  - `bun run db:push` to apply migrations
  - `bun run db:studio` to open Drizzle Studio
- For ClickHouse:
  - `bun run clickhouse:init` to create all required tables

## Code Style & Linting
- Follow the existing code style and naming conventions (see code and lint configs).
- Avoid using `any`, keep logic simple, and prefer type safety.

## Pull Request Best Practices
- Keep PRs focused and minimal.
- Add tests for new features or bug fixes.
- Update documentation as needed.
- Ensure all checks pass before requesting review.

## Reporting Issues
- Use the GitHub issue templates for bug reports and feature requests.
- Provide as much detail as possible, including steps to reproduce, environment, and screenshots if relevant.

## Code of Conduct
By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). 