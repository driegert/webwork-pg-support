// typescript
import * as vscode from 'vscode';
import { tryAcquirePositronApi } from '@posit-dev/positron';

export function activate(context: vscode.ExtensionContext) {
  const out = vscode.window.createOutputChannel('wwRmd');
  context.subscriptions.push(out);
  out.appendLine('wwRmd: extension activated');

  // Acquire Positron API using official method
  const positronApi = tryAcquirePositronApi();
  if (positronApi) {
    out.appendLine('wwRmd: Positron API acquired successfully');
  } else {
    out.appendLine('wwRmd: Not running in Positron (API not available)');
  }

  const rScheme = 'rserve';
  const pgmlScheme = 'pgml';

  // shared storage: uriStr -> content
  const snippets = new Map<string, string>();
  const providerEmitter = new vscode.EventEmitter<vscode.Uri>();

  const provider: vscode.TextDocumentContentProvider = {
    onDidChange: providerEmitter.event,
    provideTextDocumentContent(uri: vscode.Uri): string {
      return snippets.get(uri.toString()) ?? '';
    }
  };

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(rScheme, provider),
    vscode.workspace.registerTextDocumentContentProvider(pgmlScheme, provider)
  );

  // Regex to capture the single-quoted literal passed to rserve_eval(...)
  // It captures the inner characters of the single quoted string (including escaped quotes).
  const rserveOuterRegex = /rserve_eval\(\s*'([\s\S]*?)'\s*\)/g;

  // PGML blocks
  const pgmlRegex = /BEGIN_PGML([\s\S]*?)END_PGML/g;
  const pgmlSolutionRegex = /BEGIN_PGML_SOLUTION([\s\S]*?)END_PGML_SOLUTION/g;

  function makeSnippetUriFor(doc: vscode.TextDocument, scheme: string, idx: number, kind = '') {
    // include filename and snippet index; add kind (.R or .md) as query to hint tools
    const base = encodeURIComponent(doc.uri.path);
    return vscode.Uri.parse(`${scheme}://${base}/${idx}${kind ? `?kind=${kind}` : ''}`);
  }

  // Unescape a Perl single-quoted string: only \' and \\ are meaningful.
  function extractPerlSingleQuotedContent(s: string): string {
    return s.replace(/\\\\/g, '\\').replace(/\\'/g, "'");
  }

  // Find the first balanced {...} block in s. Ignores braces inside single/double quotes and respects escapes.
  function extractFirstBracedBlock(s: string): string | null {
    const start = s.indexOf('{');
    if (start === -1) return null;

    let i = start;
    const n = s.length;
    let depth = 0;
    let inSingle = false;
    let inDouble = false;
    while (i < n) {
      const ch = s[i];

      if (ch === "'" && !inDouble) {
        // toggle single-quote state unless escaped
        const prev = s[i - 1];
        if (!(prev === '\\')) inSingle = !inSingle;
        i += 1;
        continue;
      }

      if (ch === '"' && !inSingle) {
        const prev = s[i - 1];
        if (!(prev === '\\')) inDouble = !inDouble;
        i += 1;
        continue;
      }

      if (inSingle || inDouble) {
        // inside string, ignore braces
        i += 1;
        continue;
      }

      if (ch === '{') {
        depth += 1;
      } else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          // include the closing brace
          return s.slice(start, i + 1);
        }
      }
      i += 1;
    }
    return null; // unmatched
  }

  async function ensureSnippetsForDocument(doc: vscode.TextDocument) {
    out.appendLine(`wwRmd: scanning ${doc.uri.toString()} (languageId=${doc.languageId})`);

    // Only operate on Perl/pg files
    const isPerlLike = doc.languageId === 'perl' || doc.fileName.endsWith('.pg');
    if (!isPerlLike) return;

    const text = doc.getText();

    // Collect new URIs for this doc so we can clean up stale ones.
    const newUris: string[] = [];

    // 1) R snippets
    rserveOuterRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    let rIdx = 0;
    while ((match = rserveOuterRegex.exec(text)) !== null) {
      const innerLiteral = match[1]; // raw between single quotes, still with Perl escapes
      const unescaped = extractPerlSingleQuotedContent(innerLiteral);
      const braced = extractFirstBracedBlock(unescaped) ?? unescaped; // fallback to whole content

      const uri = makeSnippetUriFor(doc, rScheme, rIdx, '.R');
      const uriStr = uri.toString();
      newUris.push(uriStr);

      const prev = snippets.get(uriStr);
      if (prev !== braced) {
        snippets.set(uriStr, braced);
        providerEmitter.fire(uri);
      }

      out.appendLine(`wwRmd: r-snippet ${rIdx} -> ${uriStr} (len=${braced.length})`);

      // open and set language to R so R LSP attaches
      try {
        const td = await vscode.workspace.openTextDocument(uri);
        await vscode.languages.setTextDocumentLanguage(td, 'r');
      } catch {
        // ignore failures (openTextDocument may throw if provider returns nothing synchronously)
      }

      out.appendLine(`wwRmd: opened rserve doc ${uriStr}`);

      rIdx += 1;
    }

    // 2) PGML blocks (regular and solution)
    let pgIdx = 0;

    // mark async so we can await inside
    async function handlePgmlRegex(rx: RegExp) {
      rx.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = rx.exec(text)) !== null) {
        const content = m[1];
        const uri = makeSnippetUriFor(doc, pgmlScheme, pgIdx, '.md');
        const uriStr = uri.toString();
        newUris.push(uriStr);

        const prev = snippets.get(uriStr);
        if (prev !== content) {
          snippets.set(uriStr, content);
          providerEmitter.fire(uri);
        }

        out.appendLine(`wwRmd: pgml-snippet ${pgIdx} -> ${uriStr} (len=${content.length})`);


        try {
          const d = await vscode.workspace.openTextDocument(uri);
          await vscode.languages.setTextDocumentLanguage(d, 'markdown');
        } catch {
          /* ignore */
        }

        out.appendLine(`wwRmd: opened pgml doc ${uriStr}`);

        pgIdx += 1;
      }
    }

    // await the async handlers
    await handlePgmlRegex(pgmlRegex);
    await handlePgmlRegex(pgmlSolutionRegex);

    // remove stale snippets for this document (both schemes)
    const docBase = encodeURIComponent(doc.uri.path);
    const toRemove: string[] = [];
    for (const key of snippets.keys()) {
      if ((key.startsWith(`${rScheme}://${docBase}`) || key.startsWith(`${pgmlScheme}://${docBase}`)) && !newUris.includes(key)) {
        toRemove.push(key);
      }
    }
    for (const k of toRemove) {
      snippets.delete(k);
      providerEmitter.fire(vscode.Uri.parse(k));
    }
  }

  // Run for currently open docs
  for (const d of vscode.workspace.textDocuments) {
    void ensureSnippetsForDocument(d);
  }

  // Keep in sync
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(ensureSnippetsForDocument),
    vscode.workspace.onDidChangeTextDocument(ev => ensureSnippetsForDocument(ev.document)),
    vscode.workspace.onDidSaveTextDocument(ensureSnippetsForDocument),
    vscode.workspace.onDidCloseTextDocument(doc => {
      const docBase = encodeURIComponent(doc.uri.path);
      for (const key of Array.from(snippets.keys())) {
        if (key.startsWith(`${rScheme}://${docBase}`) || key.startsWith(`${pgmlScheme}://${docBase}`)) {
          snippets.delete(key);
          providerEmitter.fire(vscode.Uri.parse(key));
        }
      }
    })
  );

  // Register command for executing R code (Ctrl+Enter)
  const executeRCodeCommand = vscode.commands.registerCommand('webwork-pg.executeRCode', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    // Get the current selection or line
    const selection = editor.selection;
    const document = editor.document;
    const hadNoSelection = selection.isEmpty;
    let codeToExecute = '';
    let executionEndLine = -1;

    if (!hadNoSelection) {
      // User has selected text
      codeToExecute = document.getText(selection);
      executionEndLine = selection.end.line;
    } else {
      // No selection, get the complete R expression at cursor position
      const position = selection.active;
      const exprResult = getCompleteExpression(document, position);
      codeToExecute = exprResult.code;
      executionEndLine = exprResult.endLine;
    }

    // Extract R code if we're inside an rserve_eval block
    codeToExecute = extractRCodeFromBlock(document, selection, codeToExecute);

    if (!codeToExecute.trim()) {
      vscode.window.showInformationMessage('No R code to execute');
      return;
    }

    // Execute the code using Positron API if available
    if (positronApi?.runtime) {
      try {
        // Set focus to false to keep focus on the editor
        await positronApi.runtime.executeCode('r', codeToExecute, false);

        // Move cursor to next expression if no selection was made
        if (hadNoSelection && executionEndLine !== -1) {
          const blockRange = getRserveBlockRange(document, selection.active);
          if (blockRange) {
            const nextLine = findNextRExpression(document, executionEndLine, blockRange);
            if (nextLine !== -1) {
              // Move cursor to the beginning of the next expression
              const newPosition = new vscode.Position(nextLine, 0);
              editor.selection = new vscode.Selection(newPosition, newPosition);
              // Optionally scroll to reveal the new cursor position
              editor.revealRange(new vscode.Range(newPosition, newPosition), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
            }
          }
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to execute R code: ${error}`);
      }
    } else {
      vscode.window.showWarningMessage('Positron API not available. R code execution requires Positron IDE.');
    }
  });

  context.subscriptions.push(executeRCodeCommand);

  // Register command for inserting R pipe operator (Ctrl+Shift+M)
  const insertPipeCommand = vscode.commands.registerCommand('webwork-pg.insertPipe', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const position = editor.selection.active;
    const document = editor.document;

    // Check if we're in a .pg file
    if (!document.fileName.endsWith('.pg')) {
      return;
    }

    // Insert the R native pipe operator
    await editor.edit(editBuilder => {
      editBuilder.insert(position, ' |> ');
    });
  });

  context.subscriptions.push(insertPipeCommand);

  /**
   * Get the complete R expression at the cursor position
   * Handles multi-line expressions with balanced brackets
   * @returns Object with code text and the ending line number
   */
  function getCompleteExpression(document: vscode.TextDocument, position: vscode.Position): { code: string; endLine: number } {
    const currentLine = position.line;
    const totalLines = document.lineCount;
    const currentLineText = document.lineAt(currentLine).text;

    // Start with the current line
    let startLine = currentLine;
    let endLine = currentLine;

    // Helper function to check if brackets are balanced in a text range
    function isBalanced(text: string): { balanced: boolean; depth: number } {
      let parenDepth = 0;
      let bracketDepth = 0;
      let braceDepth = 0;
      let inSingleQuote = false;
      let inDoubleQuote = false;
      let inComment = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const prevChar = i > 0 ? text[i - 1] : '';

        // Handle comments - ignore everything after #
        if (char === '#' && !inSingleQuote && !inDoubleQuote) {
          inComment = true;
        }
        if (char === '\n') {
          inComment = false;
        }
        if (inComment) {
          continue;
        }

        // Handle string escapes
        if (char === '\\' && (inSingleQuote || inDoubleQuote) && i < text.length - 1) {
          i++; // Skip next character
          continue;
        }

        // Toggle quote states
        if (char === "'" && !inDoubleQuote && prevChar !== '\\') {
          inSingleQuote = !inSingleQuote;
          continue;
        }
        if (char === '"' && !inSingleQuote && prevChar !== '\\') {
          inDoubleQuote = !inDoubleQuote;
          continue;
        }

        // Count brackets only outside of strings
        if (!inSingleQuote && !inDoubleQuote) {
          if (char === '(') parenDepth++;
          else if (char === ')') parenDepth--;
          else if (char === '[') bracketDepth++;
          else if (char === ']') bracketDepth--;
          else if (char === '{') braceDepth++;
          else if (char === '}') braceDepth--;
        }
      }

      const totalDepth = parenDepth + bracketDepth + braceDepth;
      const balanced = totalDepth === 0 && !inSingleQuote && !inDoubleQuote;
      return { balanced, depth: totalDepth };
    }

    // Helper to check if a line is blank or only whitespace/comments
    function isBlankOrComment(line: string): boolean {
      const trimmed = line.trim();
      return trimmed === '' || trimmed.startsWith('#');
    }

    // Helper to check if line ends with a continuation indicator
    function needsContinuation(line: string): boolean {
      const trimmed = line.trim();
      // Remove trailing comments
      const withoutComment = trimmed.split('#')[0].trim();
      if (!withoutComment) return false;

      // Check if ends with operators or comma that suggest continuation
      return /[+\-*/%,]$/.test(withoutComment) ||
             /%>%\s*$/.test(withoutComment) ||
             /\|>\s*$/.test(withoutComment);
    }

    // FIRST: Check if the current line is self-contained and balanced
    const currentLineBalance = isBalanced(currentLineText);
    if (currentLineBalance.balanced && !needsContinuation(currentLineText)) {
      // Current line is complete on its own, return just this line
      return { code: currentLineText.trim(), endLine: currentLine };
    }

    // Current line is incomplete, so expand to find the complete expression
    // Expand upwards to find the start of the expression
    let textSoFar = currentLineText;
    while (startLine > 0) {
      const prevLineText = document.lineAt(startLine - 1).text;

      // Don't cross blank lines (usually indicates new expression)
      if (isBlankOrComment(prevLineText) && isBalanced(textSoFar).balanced) {
        break;
      }

      // Try including the previous line
      const testText = prevLineText + '\n' + textSoFar;
      const balanceResult = isBalanced(testText);

      // If we have negative depth, we need to include this line
      if (balanceResult.depth < 0 || !isBlankOrComment(prevLineText)) {
        textSoFar = testText;
        startLine--;
      } else {
        break;
      }
    }

    // Expand downwards to find the end of the expression
    textSoFar = '';
    for (let i = startLine; i <= currentLine; i++) {
      textSoFar += document.lineAt(i).text + '\n';
    }

    let balanceCheck = isBalanced(textSoFar.trimEnd());

    // If not balanced, expand downwards
    while (endLine < totalLines - 1 && !balanceCheck.balanced) {
      endLine++;
      textSoFar += document.lineAt(endLine).text + '\n';
      balanceCheck = isBalanced(textSoFar.trimEnd());

      // Stop at blank lines if we're already balanced
      if (isBlankOrComment(document.lineAt(endLine).text) && balanceCheck.balanced) {
        break;
      }
    }

    // Extract the final expression
    const range = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
    return { code: document.getText(range).trim(), endLine: endLine };
  }

  /**
   * Extract R code if we're inside an rserve_eval block
   */
  function extractRCodeFromBlock(document: vscode.TextDocument, selection: vscode.Selection, codeToExecute: string): string {
    const position = selection.active;
    let foundStart = false;
    let startLine = -1;
    let quoteChar = '';

    // Search backwards for rserve_eval (up to 100 lines)
    for (let i = position.line; i >= 0 && i >= position.line - 100; i--) {
      const lineText = document.lineAt(i).text;
      const singleQuoteMatch = lineText.match(/rserve_eval\s*\(\s*'/);
      const doubleQuoteMatch = lineText.match(/rserve_eval\s*\(\s*"/);

      if (singleQuoteMatch) {
        foundStart = true;
        startLine = i;
        quoteChar = "'";
        break;
      } else if (doubleQuoteMatch) {
        foundStart = true;
        startLine = i;
        quoteChar = '"';
        break;
      }
    }

    if (!foundStart) {
      // Not in an rserve_eval block, return empty to prevent execution
      return '';
    }

    // Check if we're still inside the block (haven't hit the closing quote + paren)
    const endPattern = quoteChar === "'" ? /'\s*\)/ : /"\s*\)/;
    for (let i = startLine; i <= position.line; i++) {
      const lineText = document.lineAt(i).text;
      if (i > startLine && endPattern.test(lineText)) {
        // We're past the end of the block, return empty to prevent execution
        return '';
      }
    }

    // We're inside an rserve_eval block
    // Extract just the R code part from the selection/line
    if (selection.isEmpty) {
      // For single line, remove rserve_eval wrapper if present on the same line
      let cleanedCode = codeToExecute;

      // Remove rserve_eval( and opening quote if present
      cleanedCode = cleanedCode.replace(/.*rserve_eval\s*\(\s*['"]/, '');

      // Remove closing quote and paren if present
      cleanedCode = cleanedCode.replace(/['"]\s*\);?\s*$/, '');

      return cleanedCode;
    } else {
      // For multi-line selections, assume user selected just the R code they want
      return codeToExecute;
    }
  }

  /**
   * Get the line range of the rserve_eval block containing the current position
   * @returns Object with startLine and endLine, or null if not in a block
   */
  function getRserveBlockRange(document: vscode.TextDocument, position: vscode.Position): { startLine: number; endLine: number } | null {
    let startLine = -1;
    let endLine = -1;
    let quoteChar = '';

    // Search backwards for rserve_eval opening
    for (let i = position.line; i >= 0 && i >= position.line - 200; i--) {
      const lineText = document.lineAt(i).text;
      const singleQuoteMatch = lineText.match(/rserve_eval\s*\(\s*'/);
      const doubleQuoteMatch = lineText.match(/rserve_eval\s*\(\s*"/);

      if (singleQuoteMatch) {
        startLine = i;
        quoteChar = "'";
        break;
      } else if (doubleQuoteMatch) {
        startLine = i;
        quoteChar = '"';
        break;
      }
    }

    if (startLine === -1) {
      return null; // Not in a rserve_eval block
    }

    // Search forwards for the closing quote + paren
    const endPattern = quoteChar === "'" ? /'\s*\);?\s*$/ : /"\s*\);?\s*$/;
    for (let i = startLine; i < document.lineCount && i < startLine + 200; i++) {
      const lineText = document.lineAt(i).text;
      if (endPattern.test(lineText)) {
        endLine = i;
        break;
      }
    }

    if (endLine === -1) {
      return null; // Couldn't find closing
    }

    return { startLine, endLine };
  }

  /**
   * Find the next non-blank, non-comment R expression line within a block
   * @param fromLine Start searching from the line after this
   * @param blockRange The rserve_eval block boundaries
   * @returns Line number of next expression, or -1 if none found
   */
  function findNextRExpression(document: vscode.TextDocument, fromLine: number, blockRange: { startLine: number; endLine: number }): number {
    // Start searching from the line after fromLine
    for (let i = fromLine + 1; i < blockRange.endLine; i++) {
      const lineText = document.lineAt(i).text.trim();

      // Skip blank lines
      if (lineText === '') {
        continue;
      }

      // Skip comment-only lines
      if (lineText.startsWith('#')) {
        continue;
      }

      // Skip lines that are just closing braces (not really new expressions)
      if (/^[\}\)]+\s*$/.test(lineText)) {
        continue;
      }

      // Found a line with actual R code
      return i;
    }

    // No next expression found
    return -1;
  }
}

export function deactivate() {
  // nothing special
}