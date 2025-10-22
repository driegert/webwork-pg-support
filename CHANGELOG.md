# Changelog

All notable changes to the WeBWorK PG File Support extension will be documented in this file.

## [0.0.4] - 2025-10-22

### Changed
- **Package Rename**: Changed package name from `WeBWorK-runR` to `webwork-pg-support`
- Updated display name to "WeBWorK PG File Support"
- Added comprehensive repository metadata (GitHub links, keywords, description)
- Reorganized releases into dedicated `releases/` folder
- Added comprehensive documentation (README, CHANGELOG, CONTRIBUTING, .gitignore)

### Notes
- Version bump to reflect package rename and documentation improvements
- All functionality remains identical to 0.0.3

## [0.0.3] - 2025-10-21

### Fixed
- **Production Build Fix**: Resolved Positron API access issues in production builds
- Properly packaged `@posit-dev/positron` as a runtime dependency
- Extension now works correctly when installed from `.vsix` file
- Fixed runtime module resolution for Positron's runtime API

### Changed
- Moved `@posit-dev/positron` from `devDependencies` to `dependencies`
- Improved build and packaging process

### Notes
- This version resolves the "Cannot find module '@posit-dev/positron'" error
- R code execution now works reliably in installed extension

## [0.0.2] - 2025-10-20

### Attempted
- Attempted fix for Positron API access (unsuccessful)
- Experimented with bundling approaches

### Status
- **Deprecated**: This version did not successfully resolve the dependency issues
- Users should skip this version and use 0.0.3 or later

## [0.0.1] - 2025-10-19

### Added
- **Initial Release**: First working version of the extension
- Syntax highlighting for `.pg` files with embedded R code and PGML markdown
- Interactive R code execution with Ctrl+Enter
- Smart R expression detection and parsing
- Automatic cursor advancement after code execution
- Support for `rserve_eval` blocks in WeBWorK problem files
- Integration with Positron IDE's R runtime

### Features
- Enhanced TextMate grammar for `.pg` files
- Perl, PGML, and R syntax highlighting
- Smart cursor positioning (skips comments and blank lines)
- Complete R expression detection (handles multi-line statements)

---

## Release Notes Summary

- **0.0.4**: Package rename and documentation
- **0.0.3**: Production build fix (recommended version)
- **0.0.2**: Deprecated (skip this version)
- **0.0.1**: Initial release with core features
