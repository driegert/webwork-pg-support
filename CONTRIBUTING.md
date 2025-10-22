# Contributing to WeBWorK PG File Support

Thank you for your interest in contributing to WeBWorK PG File Support! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- **Node.js** (v18 or later)
- **npm** (comes with Node.js)
- **Positron IDE** (for testing R execution features)
- **Git**

### Setup Steps

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/webwork-pg-support.git
   cd webwork-pg-support
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Compile the Extension**
   ```bash
   npm run compile
   ```

4. **Run in Development Mode**
   - Open the project in Positron IDE or VS Code
   - Press `F5` to launch the Extension Development Host
   - This opens a new window with the extension loaded

## Development Workflow

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Edit files in `src/` for extension logic
   - Edit `syntaxes/perl-pgml-r.tmLanguage.json` for syntax highlighting
   - Update tests if applicable

3. **Compile and Test**
   ```bash
   npm run compile
   ```
   Then press `F5` to test in the Extension Development Host

4. **Test Your Changes**
   - Test with various `.pg` files
   - Verify syntax highlighting works correctly
   - Test R code execution with Ctrl+Enter
   - Ensure cursor advancement works properly

### Watching for Changes

During development, use watch mode for automatic recompilation:

```bash
npm run watch
```

## Building and Packaging

### Local Build

```bash
# Compile TypeScript
npm run compile

# Package into .vsix
npx vsce package
```

### Installing Locally

After packaging, install the `.vsix` file:
1. Open Extensions view (Ctrl+Shift+X)
2. Click "..." menu
3. Select "Install from VSIX..."
4. Choose your generated `.vsix` file

## Coding Guidelines

### TypeScript Style

- Use TypeScript for all source code
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Prefer `const` over `let` where possible

### Code Organization

- Keep extension logic in `src/extension.ts`
- Separate concerns into functions
- Use async/await for asynchronous operations
- Handle errors gracefully

### Example Code Style

```typescript
// Good: Clear function names and error handling
async function executeRExpression(editor: vscode.TextEditor): Promise<void> {
    try {
        const selection = editor.selection;
        const code = getCompleteExpression(editor, selection);
        await sendToRConsole(code);
        moveCursorToNextExpression(editor);
    } catch (error) {
        vscode.window.showErrorMessage(`R execution failed: ${error}`);
    }
}
```

## Testing

### Manual Testing Checklist

- [ ] Syntax highlighting displays correctly for:
  - [ ] Perl code
  - [ ] PGML sections
  - [ ] R code in `rserve_eval` blocks
  - [ ] Comments
  - [ ] String interpolation

- [ ] R code execution (Ctrl+Enter):
  - [ ] Executes current line
  - [ ] Executes selected text
  - [ ] Handles multi-line expressions
  - [ ] Advances cursor correctly

- [ ] Cursor movement:
  - [ ] Skips comments
  - [ ] Skips blank lines
  - [ ] Finds next valid expression

### Test Files

Use `test-sample.pg` for testing, or create your own `.pg` files with various R code patterns.

## Submitting Changes

### Before Submitting

1. **Test Thoroughly**
   - Test all affected features
   - Verify no regressions

2. **Update Documentation**
   - Update README.md if adding features
   - Add entries to CHANGELOG.md
   - Update code comments

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Brief description of changes"
   ```

### Pull Request Process

1. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Go to the [repository](https://github.com/driegert/webwork-pg-support)
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template

3. **PR Description Should Include**
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Any breaking changes
   - Screenshots (if UI changes)

### Example PR Description

```markdown
## Description
Added support for detecting multi-line R expressions that span comments.

## Motivation
Users reported that expressions split across multiple lines with inline
comments were not being detected correctly.

## Changes
- Updated `getCompleteExpression()` to skip inline comments
- Added helper function `stripComments()`
- Updated cursor advancement logic

## Testing
Tested with various multi-line expressions including inline comments.

## Breaking Changes
None
```

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Extension Version**: Check Help > About in Positron
- **IDE Version**: Positron or VS Code version
- **Operating System**: Windows, macOS, or Linux
- **Steps to Reproduce**: Clear steps to reproduce the issue
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Sample Code**: Minimal `.pg` file that demonstrates the issue
- **Screenshots**: If applicable

### Feature Requests

When requesting features, please include:

- **Use Case**: Why this feature would be useful
- **Proposed Solution**: How you envision it working
- **Alternatives**: Other approaches you've considered
- **Examples**: Examples from other tools/extensions

## Code Review Process

All contributions go through code review:

1. Maintainer reviews the PR
2. Feedback is provided (if needed)
3. You make requested changes
4. PR is approved and merged

## Getting Help

- **Issues**: Open an issue on [GitHub](https://github.com/driegert/webwork-pg-support/issues)
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the author for sensitive issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be acknowledged in:
- Release notes
- CHANGELOG.md
- Future CONTRIBUTORS.md file

Thank you for contributing to WeBWorK PG File Support!
