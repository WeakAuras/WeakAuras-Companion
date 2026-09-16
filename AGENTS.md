# AGENTS.md - Development Guide for LLM Coding Agents

## Project Overview

WeakAuras Companion is a cross-platform desktop application built with
Electron. It is the bridge between [Wago.io](https://wago.io) and the WeakAuras
World of Warcraft addon. It fetches and installs WeakAuras updates without
manual copy and paste.

### Key Features

- Automatic WeakAuras updates from Wago.io
- Support for Plater profiles, mods, and scripts
- Cross-platform support (Windows, macOS, Linux)
- Automatic backups of the WeakAuras saved variables
- Stop motion (GIF to TGA) conversion for WeakAuras textures

## Technology Stack

- **Runtime**: Electron with Node.js. The required versions are in `engines`
  and `devEngines` in `package.json`.
- **Frontend**: Vue 3 with `<script setup lang="ts">` in every component
- **Build Tool**: Vite+ (`vp`), which bundles Vite, Rolldown, Vitest, Oxlint
  and Oxfmt. Versions are pinned in the `catalog` in `pnpm-workspace.yaml`.
- **Styling**: UnoCSS with `presetWind4`, `presetIcons` and `presetWebFonts`
- **Package Manager**: pnpm (declared in `packageManager` and `devEngines`)
- **Linting and Formatting**: Oxlint and Oxfmt through Vite+, configured in the
  `lint` and `fmt` blocks of `vite.config.ts`
- **Internationalization**: Vue i18n with a custom extraction script
- **Testing**: Vitest through `vp test` with the `happy-dom` environment
- **State Management**: Pinia setup stores with `pinia-plugin-persistedstate-2`
- **Packaging**: electron-builder, auto updates through `electron-updater`

## Development Environment Setup

### Prerequisites

- **Node.js and pnpm** at the versions declared in `package.json`. The
  `devEngines` block downloads the pinned versions on demand if the installed
  ones do not match.
- **Vite+ (`vp`)**. The `dev`, `build`, `lint` and `test` scripts and the
  pre-commit hook all run through `vp`. Install it globally from
  [viteplus.dev](https://viteplus.dev/),

```bash
node --version
pnpm --version
vp --version
```

### Initial Setup

```bash
git clone https://github.com/WeakAuras/WeakAuras-Companion.git
cd WeakAuras-Companion

# Installs dependencies, runs `install-electron` (postinstall) and
# `vp config --no-agent` (prepare)
pnpm install

pnpm run dev
```

## Available Commands

### Development

- `pnpm run dev` - Start the Vite dev server and launch Electron with hot
  reload. Vite picks a free port, usually 5173. The VS Code debug flow uses
  `http://127.0.0.1:3344/` instead (see `.vscode/launch.json`).
- `pnpm run build` - Run `vue-tsc`, then `vp build`, then `electron-builder`.
  Output goes to `dist`, `dist-electron` and `release/<version>`.

### Code Quality

- `pnpm run lint` - Run Oxlint on `./src` and the Oxfmt format check
- `pnpm run lint:fix` - Auto-fix Oxlint issues and format with Oxfmt
- `vp check` - Run format, lint and type checks on the whole project. This is
  also the pre-commit hook (`.vite-hooks/pre-commit` runs `vp staged`, which
  runs `vp check --fix` on staged `js`, `mjs`, `ts` and `vue` files).

### Testing

- `pnpm test` or `vp test run` - Run the Vitest suite once
- `pnpm run test:ui` - Run Vitest with the browser UI

Note: `vp test` is a Vite+ built-in and does not run the npm `test` script.
Use `vpr test` if you want the npm script.

### Internationalization

- `pnpm run i18n` - Compile `tools/` with `tsc`, then extract translation keys
  from `src/components/**/*.vue` and `src/libs/*.ts` into `i18n/*.json`
- `pnpm run i18n-report` - Generate a vue-i18n-extract usage report

### Utilities

- `pnpm run clean` - `git clean -xdf node_modules dist dist-electron`
- `pnpm run compile-tools` - Compile the TypeScript in `tools/` (output `.js`
  files are git-ignored)
- `./generate_changelog.sh` - Build a changelog from git tags

## File Structure and Architecture

### Key Configuration Files

#### TypeScript (`tsconfig.json`)

- Target ES2022 with DOM libs, `module: preserve`, `noEmit`
- `strict: true` with `strictNullChecks: false` and `noImplicitAny: false`
- `verbatimModuleSyntax: true`, so use `import type` for types
- Path alias `@/*` maps to `src/*`. Vite resolves it with
  `resolve.tsconfigPaths: true`.
- `tools/tsconfig.json` is a separate NodeNext config for the i18n script

#### Vite (`vite.config.ts`)

- `vite-plugin-electron` builds `electron/main/index.ts` and
  `electron/preload/index.ts` as ESM (`.mjs`) into `dist-electron`
- `vite-plugin-electron-renderer` exposes `archiver`, `regedit`, `sharp`,
  `tga` and `got` to the renderer
- Vue, Vue DevTools, UnoCSS, Vue i18n (`i18n/**`) and web font download plugins
- `define` exposes `__APP_VERSION__` and `__APP_LICENSE__` to the renderer
- `test` block: `happy-dom`, globals on, includes only
  `src/**/*.{test,spec}.{js,ts,jsx,tsx}`. `tools/scripts/Utils.spec.ts` is not
  part of this run.
- `staged` block: `vp check --fix` on staged source files

#### Lint and Format (`vite.config.ts`)

- `lint` block: Oxlint with the `oxc`, `typescript`, `unicorn`, `react` and
  `vue` plugins plus the `vite-plus` JS plugin. Type-aware rules are on.
- Several strict TypeScript rules are off on purpose: `no-explicit-any`,
  `no-floating-promises`, `no-unsafe-*`, `require-await`
- `fmt` block: Oxfmt with 80 columns, trailing commas, one attribute per line
  and sorted imports. Import groups in order: Node builtins, `electron`, `vue`,
  external, then internal, parent, sibling, index. A blank line separates the
  groups.
- Oxfmt ignores `.github`, `.vscode`, `i18n`, YAML, Markdown and JSON except
  `package.json`

#### Packaging (`electron-builder.json`)

- App id `wtf.weakauras.companion`, output `release/${version}`
- macOS: universal binary, `LSUIElement` (no Dock icon), `sharp` unpacked
- Windows: NSIS, publishes to GitHub releases, ships `regedit` VBS helpers
- Linux: AppImage, snap, deb and rpm
- Registers the `weakauras-companion://` protocol

## Architecture Notes

### Electron Process Model

- The renderer runs with `nodeIntegration: true` and
  `contextIsolation: false`. Renderer code imports `node:fs`, `node:path` and
  `electron` directly. There is no context bridge.
- The preload script only shows and removes the loading spinner.
- IPC uses `ipcMain.handle` in `electron/main/index.ts` and
  `ipcRenderer.invoke` in the renderer. Handlers include `openDialog`,
  `minimize`, `close`, `installUpdates`, `autoStart`, `checkUpdates`,
  `refreshWago`, `getStore`, `setStore`, `deleteStore` and `getLang`.
- `electron-store` is the single persistence layer. The main process owns the
  store. The renderer reaches it through the `getStore`, `setStore` and
  `deleteStore` IPC handlers.
- `electron-log` is used in the main process only.
- `webSecurity` is off in development and on in production.

### State Management

- Stores are Pinia setup stores (`defineStore(id, () => { ... })`).
- `pinia-plugin-persistedstate-2` persists every store through the IPC store
  handlers above. `config` is persisted. `auras` and `stopmotion` set
  `persistedState: { persist: false }`.

### Vue Components

- Every component uses `<script setup lang="ts">`.
- Block order is script, template, then style.

## Common Development Tasks

### Adding New Features

1. Create Vue components in `src/components/UI/`
2. Add or extend Pinia stores in `src/stores/` if state is needed
3. Add translation keys with `$t('key.name')` and run `pnpm run i18n`
4. Test with `pnpm run dev`
5. Run `vp check` before you commit

### Internationalization Workflow

1. Add translation keys in Vue templates: `{{ $t('key.name') }}`
2. Run `pnpm run i18n` to extract new keys into `i18n/*.json`
3. Add the translations in the other locale files
4. Follow `i18n/README.md` for plural forms
5. Supported locales come from `package.json` `config.supported-locales`:
   en, es, de, fr, ru, tr, zh-cn

### Styling with UnoCSS

- Utility-first classes with `presetWind4`
- Icons from `@iconify-json/mdi` and `@iconify-json/fa6-brands` through
  `presetIcons`, plus a custom `social` icon set loaded from
  `src/assets/social-icons`
- Web fonts through `presetWebFonts`, downloaded at build time

### Working with the Vendored Skills

- `.agents/skills/` holds skills from third parties. Do not edit them
  by hand. `skills-lock.json` records the source and hash.
- `.claude/skills/` contains symlinks to the same folders.

## Testing Strategy

- **Unit tests**: four spec files in `src/libs/` with Vitest and `happy-dom`.
  Coverage is small.
- **Manual testing**: `pnpm run dev`
- **CI**: lint runs on every push and pull request. Builds run only on `main`.

## Build and Release Process

### Development Build

```bash
pnpm run dev
```

### Production Build

```bash
pnpm run build
```

### CI/CD Pipeline

- **Workflows**: `windows.yml`, `macos.yml` and `linux.yml` run on every push,
  tag and pull request. They install with pnpm and run
  `pnpm run lint`. The build step runs only on `main`.
- **macOS**: rebuilds `sharp` for x64 and arm64 before the universal build
- **CodeQL**: runs on push and pull request to `main` and weekly on a schedule
- **Dependabot**: npm monthly, GitHub Actions weekly, both with a
  cooldown. Dependabot ignores `luaparse` updates.
- **Releases**: publish to GitHub releases, which `electron-updater` reads

## Important Considerations for Agents

### Package Management

- `pnpm-workspace.yaml` holds a `catalog` for `vite`, `vitest`, `vite-plus`
  and `@vitest/ui`. `vite` resolves to `@voidzero-dev/vite-plus-core`. Keep
  these versions in the catalog, not in `package.json`.
- `allowBuilds` lists the packages that may run install scripts: `electron`,
  `electron-winstaller`, `esbuild`, `sharp`, `vue-demi`. Add new packages there
  if they need a build step.

### Code Style and Quality

- Run `vp check` before you commit. The pre-commit hook runs it too.
- Let Oxfmt sort imports. Do not sort by hand.
- Use `import type` for type-only imports (`verbatimModuleSyntax`).
- Follow the file naming in each folder: kebab-case in `src/libs/`, PascalCase
  for Vue components.
- Add new words to `cspell.json` if the spell checker flags them.

### Electron-Specific Guidelines

- Add new main process features as `ipcMain.handle` handlers and call them
  with `ipcRenderer.invoke`.
- The renderer has full Node access. Treat all data from Wago.io and from the
  WoW saved variables files as untrusted before you use it in file paths or
  in the DOM.
- Handle platform-specific code paths with `process.platform` checks. Windows
  uses `regedit` to find the WoW install.
- Use `electron-log` in the main process, not `console.log`.

### Security

- The CSP is a `<meta http-equiv="Content-Security-Policy">` tag in
  `index.html`, not a Vite setting.
- Isolation between main and renderer is not in place. Do not describe the
  preload script as a security boundary.

## Contributing Guidelines

### Before Making Changes

1. Run `vp check`
2. Run `pnpm test`
3. Test your changes with `pnpm run dev`
4. Run `pnpm run build` if you change the build configuration
5. Run `pnpm run i18n` if you add user-facing text

### Pull Request Checklist

- [ ] `vp check` passes
- [ ] `pnpm test` passes
- [ ] New user-facing text has i18n keys
- [ ] Changes tested on the development server
- [ ] No new console errors or warnings
- [ ] Build process still works

## Resources and Documentation

- [Electron Documentation](https://www.electronjs.org/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [Vite+ Documentation](https://viteplus.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [UnoCSS Documentation](https://unocss.dev/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue i18n Documentation](https://vue-i18n.intlify.dev/)

---

*Update this document when the stack, the scripts or the architecture change.*
