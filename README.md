# WeBWorK PG File Support

Comprehensive language support for WeBWorK problem files (.pg) in Positron IDE. Provides syntax highlighting for embedded R code (rserve_eval blocks) and PGML markdown sections, plus interactive R code execution with smart expression detection and automatic cursor advancement.

## Features

- **Syntax Highlighting**: Enhanced syntax highlighting for `.pg` files including:
  - Perl code
  - PGML markdown sections
  - Embedded R code blocks (`rserve_eval`)
  - String interpolation and variable expansion

- **Interactive R Code Execution**: Execute R code directly from `.pg` files using **Ctrl+Enter**
  - Smart expression detection: automatically identifies complete R expressions
  - Automatic cursor advancement: moves to the next expression after execution
  - Works seamlessly with Positron's R console

- **Cursor Movement**: Intelligent cursor positioning after code execution
  - Skips comments and blank lines
  - Finds the next valid R expression
  - Smooth workflow for iterative development

## Requirements

- **Positron IDE** (required for R code execution features)
  - Download from: https://github.com/posit-dev/positron
  - R execution uses Positron's built-in R runtime API
  - Syntax highlighting works in other VS Code-based editors, but R execution requires Positron

## Installation

### From .vsix File

1. Download the latest `.vsix` file from the [releases](https://github.com/driegert/webwork-pg-support/tree/main/releases) folder
2. In Positron IDE, open the Extensions view (Ctrl+Shift+X)
3. Click the "..." menu at the top of the Extensions view
4. Select "Install from VSIX..."
5. Choose the downloaded `.vsix` file

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/driegert/webwork-pg-support.git
   cd webwork-pg-support
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Package the extension:
   ```bash
   npx vsce package
   ```

5. Install the generated `.vsix` file in Positron IDE

## Usage

### R Code Execution

1. Open a `.pg` file in Positron IDE
2. Ensure you have an active R console running
3. Place your cursor on or select R code within an `rserve_eval` block
4. Press **Ctrl+Enter** to execute the code
5. The cursor automatically advances to the next R expression

### Example .pg File Structure

```perl
DOCUMENT();

loadMacros(
    "PGstandard.pl",
    "PGML.pl",
    "RserveClient.pl"
);

# R code block
rserve_eval('{
    # Generate random data
    x <- rnorm(100, mean = 50, sd = 10)
    mean_x <- mean(x)
    sd_x <- sd(x)
}');

$mean_x = rserve_eval('mean_x');
$sd_x = rserve_eval('sd_x');

BEGIN_PGML
The mean of the dataset is [@ $mean_x @]*.

The standard deviation is [@ $sd_x @]*.
END_PGML

ENDDOCUMENT();
```

Press Ctrl+Enter on each R line to execute it interactively. This extension will work with multiline R expressions and selections as well. To run an entire `reserve_eval()` block, you can press Ctrl+Enter while on either line with either of `{` or `}`.

## Compatibility

### IDE Compatibility Status

| IDE | Syntax Highlighting | R Execution | Status |
|-----|-------------------|-------------|---------|
| **Positron IDE** | ✅ Working | ✅ Working | Fully supported |
| **VS Code** | ⚠️ Needs testing | ❌ Not available | Partial support |
| **VS Codium** | ⚠️ Needs testing | ❌ Not available | Partial support |
| **Cursor** | ⚠️ Needs testing | ❌ Not available | Partial support |

**Notes:**
- R code execution requires Positron IDE's R runtime API
- Syntax highlighting should work in all VS Code-based editors
- Compatibility testing is ongoing for non-Positron editors

## Development

### Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 in VS Code/Positron to launch the extension development host

### Building

```bash
# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Package extension
npx vsce package
```

### Project Structure

```
webwork-pg-support/
├── src/
│   └── extension.ts          # Main extension code
├── syntaxes/
│   └── perl-pgml-r.tmLanguage.json  # Syntax highlighting grammar
├── releases/                 # Version history (.vsix files)
├── package.json             # Extension manifest
└── README.md               # This file
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see LICENSE file for details

## Author

**David L. Riegert**

## Repository

https://github.com/driegert/webwork-pg-support

## Issues

Report bugs and request features at: https://github.com/driegert/webwork-pg-support/issues

# Acknowledgement

This extension was developed with Claude Code AI. Some help from Perplexity AI and minor manual intervention or edits from me. This includes the README file (except for this part ;) ). I made minor edits to the examples within the README as well.