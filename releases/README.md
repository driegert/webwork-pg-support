# WeBWorK PG File Support - Releases

This folder contains all released versions of the WeBWorK PG File Support extension.

## Installation

To install a specific version:

1. Download the desired `.vsix` file
2. Open Positron IDE
3. Open the Extensions view (Ctrl+Shift+X)
4. Click the "..." menu at the top
5. Select "Install from VSIX..."
6. Choose the downloaded `.vsix` file

## Version History

### Latest Releases

| Version | Package Name | Date | Status | Notes |
|---------|-------------|------|---------|-------|
| **0.0.4** | `webwork-pg-support-0.0.4.vsix` | 2025-10-22 | ✅ **Recommended** | Package rename, comprehensive documentation |
| **0.0.3** | `WeBWorK-runR-0.0.3.vsix` | 2025-10-21 | ✅ Stable | Production build fix, dependency packaging |
| **0.0.2** | `WeBWorK-runR-0.0.2.vsix` | 2025-10-20 | ❌ Deprecated | Skip this version - unsuccessful fix attempt |
| **0.0.1** | `WeBWorK-runR-0.0.1.vsix` | 2025-10-19 | ✅ Works | Initial release, works in dev mode only |

## Recommended Version

**Use version 0.0.4** - This is the latest stable release with:
- Proper package naming (`webwork-pg-support`)
- Complete documentation
- Production-ready build
- All features working correctly

## Version Details

### v0.0.4 (Current)
**File**: `webwork-pg-support-0.0.4.vsix`

**Changes**:
- Package renamed from `WeBWorK-runR` to `webwork-pg-support`
- Display name: "WeBWorK PG File Support"
- Added comprehensive documentation (README, CHANGELOG, CONTRIBUTING)
- Organized releases into dedicated folder
- Added repository metadata and GitHub links

**Features**:
- ✅ Syntax highlighting for .pg files
- ✅ R code execution (Ctrl+Enter)
- ✅ Smart expression detection
- ✅ Automatic cursor advancement
- ✅ Works in production builds

---

### v0.0.3
**File**: `WeBWorK-runR-0.0.3.vsix`

**Changes**:
- Fixed Positron API access in production builds
- Moved `@posit-dev/positron` to runtime dependencies
- Extension now works when installed from .vsix

**Features**:
- ✅ Syntax highlighting for .pg files
- ✅ R code execution (Ctrl+Enter)
- ✅ Smart expression detection
- ✅ Automatic cursor advancement

**Known Issues**:
- Old package name (`WeBWorK-runR`)
- Limited documentation

---

### v0.0.2 (Deprecated)
**File**: `WeBWorK-runR-0.0.2.vsix`

**Status**: ❌ **Do not use** - This version has unresolved dependency issues

**Issues**:
- Attempted but failed to fix Positron API access
- Extension may not work in production
- Superseded by v0.0.3

**Recommendation**: Skip this version and use 0.0.3 or later

---

### v0.0.1
**File**: `WeBWorK-runR-0.0.1.vsix`

**Changes**:
- Initial release
- First implementation of syntax highlighting
- First implementation of R code execution

**Features**:
- ✅ Syntax highlighting for .pg files (Perl, PGML, R)
- ✅ R code execution (Ctrl+Enter)
- ⚠️ Works in development mode only

**Known Issues**:
- Does not work when installed from .vsix (dependency issue)
- Use v0.0.3 or later for production use

---

## Migration Guide

### From 0.0.1 or 0.0.2 to 0.0.3+

1. Uninstall the old version
2. Install the new `.vsix` file
3. No configuration changes needed
4. R execution should now work correctly

### From 0.0.3 to 0.0.4

1. Uninstall `WeBWorK-runR`
2. Install `webwork-pg-support-0.0.4.vsix`
3. Package name has changed but functionality is identical
4. All keybindings and features remain the same

## Support

For issues with any version:
- **GitHub Issues**: https://github.com/driegert/webwork-pg-support/issues
- **Repository**: https://github.com/driegert/webwork-pg-support

## Future Releases

Future releases will be added to this folder with the naming pattern:
`webwork-pg-support-X.Y.Z.vsix`

Check the main [CHANGELOG.md](../CHANGELOG.md) for detailed release notes.
