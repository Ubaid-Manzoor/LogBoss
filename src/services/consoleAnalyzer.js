const vscode = require("vscode");

const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;

class ConsoleAnalyzer {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.currentdecorationType = null;
    this.isHighlighted = false;
    this.isCommented = false;

    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        const state = this.stateManager.getFileState(editor.document.uri.fsPath);
        this.isHighlighted = !state.isHighlighted;
        this.ToggleHighlightConsoleStatements();

        this.isCommented = state.isCommented;
      }
    });
  }

  generateAst() {
    // Parse the code into an AST
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const code = editor.document.getText();
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      tokens: true,
      ranges: true,
      comments: true,
    });
    return ast;
  }

  isCompleteConsoleStatement(text) {
    // Matches complete console statements followed by nothing or a proper comment
    const regex = /^\s*console\.(log|warn|error|info|debug|trace)\s*\(([\s\S]*?\))(\s*;?\s*(\/\/.*)?)?$/;
    return regex.test(text);
  }

  isConsoleStart(text) {
    // Matches the start of a console statement
    const regex = /^\s*console\.(log|warn|error|info|debug|trace)\s*\(/;
    return regex.test(text);
  }

  getAllConsoleLogsStatements() {
    const consoleStatements = [];
    const ast = this.generateAst();

    let currentGroup = [];
    let isCollecting = false;

    ast.comments.forEach((comment) => {
      const commentText = comment.value.replace(/^[\s*]+/gm, "");

      // Check for single-line console statement
      if (this.isCompleteConsoleStatement(commentText)) {
        consoleStatements.push({
          loc: comment.loc,
          type: "CommentLine",
        });
        return;
      }

      // Check for start of multi-line console
      if (this.isConsoleStart(commentText)) {
        currentGroup = [comment];
        isCollecting = true;
        return;
      }

      // If we're collecting and this is an adjacent line
      if (isCollecting && currentGroup.at(-1).loc.start.line + 1 === comment.loc.end.line) {
        currentGroup.push(comment);

        // Check if we have a complete console statement
        const groupText = currentGroup.map((c) => c.value.replace(/^[\s+]+/gm, "")).join("\n");

        if (this.isCompleteConsoleStatement(groupText)) {
          consoleStatements.push({
            loc: {
              start: currentGroup[0].loc.start,
              end: currentGroup[currentGroup.length - 1].loc.end,
            },
            type: "CommentLine",
          });
          currentGroup = [];
          isCollecting = false;
        }
      } else {
        // Reset if we hit a non-adjacent line
        currentGroup = [];
        isCollecting = false;
      }
    });

    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.type === "MemberExpression" && path.node.callee.object.name === "console") {
          const statement = {
            loc: path.node.loc,
          };

          consoleStatements.push(statement);
        }
      },
    });

    return consoleStatements;
  }

  /**
   * Analyzes code and finds all console statements
   * @param {string} code - The source code to analyze
   * @returns {Array} Array of console statement locations and details
   */
  ToggleHighlightConsoleStatements() {
    try {
      if (this.isHighlighted) return this.removeConsoleHighlighting();

      const consoleStatements = this.getAllConsoleLogsStatements();
      const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: new vscode.ThemeColor("editor.selectionBackground"),
      });

      const decorationRanges = consoleStatements.map((statement) => {
        return new vscode.Range(new vscode.Position(statement.loc.start.line - 1, 0), new vscode.Position(statement.loc.end.line - 1, Number.MAX_VALUE));
      });

      // Apply the decorations
      vscode.window.activeTextEditor.setDecorations(decorationType, decorationRanges);
      this.currentdecorationType = decorationType;

      this.isHighlighted = true;
      this.stateManager.updateFileState(vscode.window.activeTextEditor.document.uri.fsPath, {
        isHighlighted: true,
      });
      return consoleStatements;
    } catch (error) {
      console.error("Error analyzing code:", error);
      return [];
    }
  }

  removeConsoleHighlighting() {
    if (this.currentdecorationType) {
      this.currentdecorationType.dispose();
      this.currentdecorationType = null;
    }

    if (vscode.window.activeTextEditor) {
      this.stateManager.updateFileState(vscode.window.activeTextEditor.document.uri.fsPath, {
        isHighlighted: false,
      });
    }
  }

  async removeConsoleLogStatements(filePath = null) {
    try {
      const editor = filePath ? await this.openFile(filePath) : vscode.window.activeTextEditor;

      if (!editor) return;

      const document = editor.document;
      const consoleStatements = this.getAllConsoleLogsStatements();

      const sortedStatements = consoleStatements.sort((a, b) => b.loc.start.line - a.loc.start.line);
      const edit = new vscode.WorkspaceEdit();

      sortedStatements.forEach((statement) => {
        const startLine = statement.loc.start.line - 1;
        const endLine = statement.loc.end.line - 1;
        const range = new vscode.Range(new vscode.Position(startLine, 0), new vscode.Position(endLine + 1, 0));

        // If it's a comment, we need to remove the whole line
        if (statement.type === "CommentBlock" || statement.type === "CommentLine") {
          edit.delete(document.uri, range);
        } else {
          const lineText = document.lineAt(startLine).text;
          if (lineText.trim().startsWith("console.")) {
            edit.delete(document.uri, range);
          }
        }
      });

      // Apply the edits
      const result = await vscode.workspace.applyEdit(edit);
      if (result) {
        await document.save();
        vscode.window.showInformationMessage("Console statements removed successfully");
      } else {
        vscode.window.showErrorMessage("Failed to remove console statements");
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to process ${filePath}: ${error.message}`);
    }
  }

  async toggleConsoleComments(commandManager, filePath = null) {
    const editor = filePath ? await this.openFile(filePath) : vscode.window.activeTextEditor;

    if (!editor) return;

    const document = editor.document;
    const consoleStatements = this.getAllConsoleLogsStatements();

    // Sort statements in reverse order to avoid position shifts
    const sortedStatements = consoleStatements.sort((a, b) => b.loc.start.line - a.loc.start.line);

    await editor.edit(async (editBuilder) => {
      sortedStatements.forEach((statement) => {
        const startLine = statement.loc.start.line - 1;
        const endLine = statement.loc.end.line - 1;

        for (let lineIndex = startLine; lineIndex <= endLine; lineIndex++) {
          const line = document.lineAt(lineIndex);
          const lineText = line.text;
          if (this.isCommented) {
            if (!this.isLineCommented(lineText)) continue; // If not commented, skip

            // Uncomment: Remove // from the start
            const uncommentedText = lineText.replace(/^(\s*)\/\/\s?/, "$1");
            const range = new vscode.Range(new vscode.Position(lineIndex, 0), new vscode.Position(lineIndex, lineText.length));
            editBuilder.replace(range, uncommentedText);
          } else {
            if (this.isLineCommented(lineText)) continue; // If already commented, skip

            // Comment: Add // to the start, preserving indentation
            const indentation = lineText.match(/^\s*/)[0];
            const commentedText = `${indentation}//${lineText.slice(indentation.length)}`;
            const range = new vscode.Range(new vscode.Position(lineIndex, 0), new vscode.Position(lineIndex, lineText.length));
            editBuilder.replace(range, commentedText);
          }
        }
      });
    });

    await document.save();

    this.isCommented = !this.isCommented;
    this.stateManager.updateFileState(editor.document.uri.fsPath, {
      isCommented: this.isCommented,
    });
    commandManager.updateToggleDescription(this.isCommented);
  }

  displayLogMessage() {}

  isLineCommented(lineText) {
    return /^\s*\/\//.test(lineText);
  }

  async openFile(filePath) {
    const document = await vscode.workspace.openTextDocument(filePath);
    return await vscode.window.showTextDocument(document);
  }

  async commentConsoleLogs(filePath = null) {
    const editor = filePath ? await this.openFile(filePath) : vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const consoleStatements = this.getAllConsoleLogsStatements();
    const sortedStatements = consoleStatements.sort((a, b) => b.loc.start.line - a.loc.start.line);

    await editor.edit(async (editBuilder) => {
      sortedStatements.forEach((statement) => {
        const startLine = statement.loc.start.line - 1;
        const endLine = statement.loc.end.line - 1;

        for (let lineIndex = startLine; lineIndex <= endLine; lineIndex++) {
          const line = document.lineAt(lineIndex);
          const lineText = line.text;

          if (this.isLineCommented(lineText)) continue; // If already commented, skip

          // Comment: Add // to the start, preserving indentation
          const indentation = lineText.match(/^\s*/)[0];
          const commentedText = `${indentation}//${lineText.slice(indentation.length)}`;
          const range = new vscode.Range(new vscode.Position(lineIndex, 0), new vscode.Position(lineIndex, lineText.length));
          editBuilder.replace(range, commentedText);
        }
      });
    });

    await document.save();
    this.stateManager.updateFileState(editor.document.uri.fsPath, {
      isCommented: true,
    });
  }

  async uncommentConsoleLogs(filePath = null) {
    const editor = filePath ? await this.openFile(filePath) : vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const consoleStatements = this.getAllConsoleLogsStatements();
    const sortedStatements = consoleStatements.sort((a, b) => b.loc.start.line - a.loc.start.line);

    await editor.edit(async (editBuilder) => {
      sortedStatements.forEach((statement) => {
        const startLine = statement.loc.start.line - 1;
        const endLine = statement.loc.end.line - 1;

        for (let lineIndex = startLine; lineIndex <= endLine; lineIndex++) {
          const line = document.lineAt(lineIndex);
          const lineText = line.text;

          if (!this.isLineCommented(lineText)) continue; // If not commented, skip

          // Uncomment: Remove // from the start
          const uncommentedText = lineText.replace(/^(\s*)\/\/\s?/, "$1");
          const range = new vscode.Range(new vscode.Position(lineIndex, 0), new vscode.Position(lineIndex, lineText.length));
          editBuilder.replace(range, uncommentedText);
        }
      });
    });

    await document.save();
    this.stateManager.updateFileState(editor.document.uri.fsPath, {
      isCommented: false,
    });
  }

  async highlightConsoleStatements() {
    try {
      const consoleStatements = this.getAllConsoleLogsStatements();
      const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: new vscode.ThemeColor("editor.selectionBackground"),
      });

      const decorationRanges = consoleStatements.map((statement) => {
        return new vscode.Range(new vscode.Position(statement.loc.start.line - 1, 0), new vscode.Position(statement.loc.end.line - 1, Number.MAX_VALUE));
      });

      // Apply the decorations
      vscode.window.activeTextEditor.setDecorations(decorationType, decorationRanges);
      this.currentdecorationType = decorationType;

      this.stateManager.updateFileState(vscode.window.activeTextEditor.document.uri.fsPath, {
        isHighlighted: true,
      });
      return consoleStatements;
    } catch (error) {
      console.error("Error analyzing code:", error);
      return [];
    }
  }
}

module.exports = ConsoleAnalyzer;
