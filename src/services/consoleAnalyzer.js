const vscode = require("vscode");

const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;

class ConsoleAnalyzer {
  currentdecorationType;

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

  getAllConsoleLogsStatements() {
    const consoleStatements = [];
    const ast = this.generateAst();
    const commentedConsoleStatements = ast.comments.filter((comment) => {
      const commentCode = comment.value.replace(/^[\s*]+/gm, "");
      const regex = /^\s*console\.(log|warn|error|info|debug|trace)\s*\(([\s\S]*?)\)\s*;?(\s*\/\/.*)?$/;
      return regex.test(commentCode);
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

    consoleStatements.push(...commentedConsoleStatements);
    return consoleStatements;
  }

  /**
   * Analyzes code and finds all console statements
   * @param {string} code - The source code to analyze
   * @returns {Array} Array of console statement locations and details
   */
  highlightConsoleStatements() {
    try {
      const consoleStatements = this.getAllConsoleLogsStatements();
      const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: new vscode.ThemeColor("editor.selectionBackground"),
      });

      const decorationRanges = consoleStatements.map((statement) => {
        return new vscode.Range(
          new vscode.Position(statement.loc.start.line - 1, 0),
          new vscode.Position(statement.loc.start.line - 1, Number.MAX_VALUE)
        );
      });

      // Apply the decorations
      vscode.window.activeTextEditor.setDecorations(decorationType, decorationRanges);
      this.currentdecorationType = decorationType;

      return consoleStatements;
    } catch (error) {
      console.error("Error analyzing code:", error);
      return [];
    }
  }

  removeConsoleHighlighting() {
    this?.currentdecorationType?.dispose();
  }

  async removeConsoleLogStatements() {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const document = editor.document;
      const consoleStatements = this.getAllConsoleLogsStatements();

      const sortedStatements = consoleStatements.sort((a, b) => b.loc.start.line - a.loc.start.line);
      const edit = new vscode.WorkspaceEdit();

      sortedStatements.forEach((statement) => {
        const startLine = statement.loc.start.line - 1;
        const range = new vscode.Range(new vscode.Position(startLine, 0), new vscode.Position(startLine + 1, 0));

        // If it's a comment, we need to remove the whole line
        if (statement.type === "CommentBlock" || statement.type === "CommentLine") {
          edit.delete(document.uri, range);
        } else {
          // For active console.log statements, we'll use babel to remove them
          const lineText = document.lineAt(startLine).text;
          if (lineText.trim().startsWith("console.")) {
            edit.delete(document.uri, range);
          }
        }
      });

      // Apply the edits
      const result = vscode.workspace.applyEdit(edit);
      if (result) {
        vscode.window.showInformationMessage("Console statements removed successfully");
      } else {
        vscode.window.showErrorMessage("Failed to remove console statements");
      }
    } catch (error) {
      vscode.window.showErrorMessage("Failed to remove console statements: " + error.message);
    }
  }
}

module.exports = ConsoleAnalyzer;
