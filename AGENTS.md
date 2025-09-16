# AGENTS.md - Development Guide for LLM Coding Agents

This document provides comprehensive guidance for LLM coding agents working on the WeakAuras Companion project.

## Project Overview

WeakAuras Companion is a cross-platform desktop application built with Electron that serves as a bridge between [Wago.io](https://wago.io) and the WeakAuras World of Warcraft addon. It enables automatic fetching and updating of WeakAuras configurations without manual copy-paste operations.

### Key Features
- Automatic WeakAuras updates from Wago.io
- Support for Plater profiles, mods, and scripts
- Cross-platform support (Windows, macOS, Linux)
- Automatic backup functionality
- Multi-language support

## Technology Stack

- **Runtime**: Electron 35.x (Node.js >= 22 required)
- **Frontend**: Vue 3 + TypeScript
- **Build Tool**: Vite with custom configuration
- **Styling**: UnoCSS with custom presets
- **Package Manager**: pnpm (strictly enforced via `.npmrc`)
- **Linting**: ESLint + Prettier with TypeScript support
- **Internationalization**: Vue i18n with extraction tools
- **Testing**: Vitest (minimal setup)
- **State Management**: Pinia with persistence

## Development Environment Setup

### Prerequisites
```bash
# Node.js version 22 or higher (specified in package.json engines)
node --version  # Should be >= 22

# Install pnpm globally if not already installed
npm install -g pnpm
```

### Initial Setup
```bash
# Clone the repository (if not already done)
git clone https://github.com/WeakAuras/WeakAuras-Companion.git
cd WeakAuras-Companion

# Install dependencies (pnpm is enforced via preinstall script)
pnpm install

# Start development server
pnpm run dev
```

## Available Commands

### Development
- `pnpm run dev` - Start development server with hot reload at localhost:9080
- `pnpm run build` - Build for production (includes TypeScript compilation, Vite build, and Electron packaging)

### Code Quality
- `pnpm run lint` - Run ESLint on ./src and Prettier format check
- `pnpm run lint:fix` - Auto-fix ESLint issues and format with Prettier

### Internationalization
- `pnpm run i18n` - Extract translation strings to i18n/*.json files
- `pnpm run i18n-report` - Generate i18n usage report

### Utilities
- `pnpm run clean` - Clean generated files and dependencies
- `pnpm run compile-tools` - Compile TypeScript tools

## File Structure and Architecture

```
WeakAuras-Companion/
├── .github/                    # GitHub workflows and templates
│   ├── workflows/             # CI/CD for Windows, macOS, Linux builds
│   └── ISSUE_TEMPLATE/        # Issue templates
├── electron/                  # Electron main and preload processes
│   ├── main/                  # Main process code
│   └── preload/               # Preload scripts
├── src/                       # Vue 3 frontend source code
│   ├── components/            # Vue components
│   ├── stores/                # Pinia stores
│   ├── libs/                  # Utility libraries
│   ├── assets/                # Static assets
│   └── App.vue                # Root Vue component
├── i18n/                      # Internationalization files
├── tools/                     # Build and development tools
├── public/                    # Static public assets
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── eslint.config.mjs          # ESLint configuration
├── uno.config.ts              # UnoCSS configuration
└── electron-builder.json     # Electron packaging configuration
```

### Key Configuration Files

#### TypeScript Configuration (`tsconfig.json`)
- Target: ES2022 with DOM support
- Module: preserve (for Vite)
- Strict mode enabled with some relaxed rules (`strictNullChecks: false`, `noImplicitAny: false`)
- Path mapping: `@/*` → `src/*`

#### Vite Configuration (`vite.config.ts`)
- Electron integration via `vite-plugin-electron`
- Vue 3 support with Vue DevTools
- UnoCSS integration
- Web font downloading
- Vue i18n plugin
- Custom resolve configuration

#### ESLint Configuration (`eslint.config.mjs`)
- Flat config format with TypeScript integration
- Vue 3 specific rules
- UnoCSS integration
- Custom rule overrides for TypeScript strictness

## Common Development Tasks

### Adding New Features
1. Create Vue components in `src/components/`
2. Add Pinia stores in `src/stores/` if state management needed
3. Update internationalization strings using `pnpm run i18n`
4. Test with `pnpm run dev`
5. Lint with `pnpm run lint:fix`

### Working with Electron
- Main process code: `electron/main/`
- Preload scripts: `electron/preload/`
- IPC communication patterns established in existing code
- Use `electron-log` for logging
- Use `electron-store` for persistent configuration

### Internationalization Workflow
1. Add translation keys in Vue templates: `{{ $t('key.name') }}`
2. Run `pnpm run i18n` to extract new strings
3. Update translation files in `i18n/*.json`
4. Supported locales: en, es, de, fr, ru, tr, zh-cn

### Styling with UnoCSS
- Utility-first CSS framework
- Custom configuration in `uno.config.ts`
- Icon support via `@iconify` packages
- Web fonts integration

## Testing Strategy

- **Unit Tests**: Vitest configured but minimal test coverage currently
- **Manual Testing**: Use `pnpm run dev` for development testing
- **CI/CD**: Automated builds on Windows, macOS, and Linux via GitHub Actions
- **Code Quality**: ESLint + Prettier enforce code standards

## Build and Release Process

### Development Build
```bash
pnpm run dev  # Development server with hot reload
```

### Production Build
```bash
pnpm run build  # Full production build with electron-builder
```

### CI/CD Pipeline
- **Triggers**: Push to main, pull requests
- **Platforms**: Windows, macOS, Linux builds in parallel
- **Security**: CodeQL analysis enabled
- **Dependencies**: Dependabot for automated updates

## Important Considerations for Agents

### Package Management
- **MUST use pnpm**: The project enforces pnpm via preinstall script
- **Node.js version**: Requires Node.js >= 22 (may show warnings on older versions)
- **Architecture support**: Configured for x64 and arm64 on Windows, macOS, and Linux

### Code Style and Quality
- **ESLint rules**: Some TypeScript strict rules are relaxed for pragmatic development
- **Vue component order**: Script/template first, then style
- **Import sorting**: Handled by Prettier plugin
- **File naming**: Follow existing patterns in the codebase

### Electron-Specific Guidelines
- Use established IPC patterns for main/renderer communication
- Respect security best practices with preload scripts
- Handle platform-specific code paths (Windows/macOS/Linux)
- Use electron-builder configuration for packaging

### Performance Considerations
- Vite provides fast HMR for development
- UnoCSS generates minimal CSS bundles
- Lazy loading for Vue components where appropriate
- Efficient asset handling via Vite

### Security
- Preload scripts isolate main process from renderer
- CSP headers configured via Vite
- No direct Node.js access from renderer process
- Regular dependency updates via Dependabot

## Debugging and Troubleshooting

### Common Issues
1. **Node.js version**: Ensure Node.js >= 22 for optimal compatibility
2. **Package manager**: Only pnpm is supported; npm/yarn will fail
3. **Build failures**: Check `dist-electron` cleanup in vite config
4. **Electron issues**: Check main process logs via electron-log

### Development Tools
- Vue DevTools integrated in development
- Electron DevTools available in development builds
- Source maps enabled for debugging
- TypeScript strict checking in IDE

## Contributing Guidelines

### Before Making Changes
1. Run `pnpm run lint` to ensure code quality
2. Test your changes with `pnpm run dev`
3. Verify builds work with `pnpm run build` (if modifying build configuration)
4. Update translations if adding user-facing text

### Pull Request Checklist
- [ ] Code follows ESLint and Prettier rules
- [ ] New features include appropriate internationalization
- [ ] Changes tested on development server
- [ ] No console errors or warnings introduced
- [ ] Build process still works correctly

## Resources and Documentation

- [Electron Documentation](https://www.electronjs.org/docs)
- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [UnoCSS Documentation](https://unocss.dev/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue i18n Documentation](https://vue-i18n.intlify.dev/)

---

*This document should be updated as the project evolves. When making significant architectural changes, please update this guide accordingly.*