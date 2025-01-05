const vscode = require("vscode");

const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;

class ConsoleAnalyzer {
  currentdecorationType;
  /**
   * Analyzes code and finds all console statements
   * @param {string} code - The source code to analyze
   * @returns {Array} Array of console statement locations and details
   */
  highlightConsoleStatements(code) {
    const consoleStatements = [];

    try {
      // Parse the code into an AST
      const ast = parse(code, {
        sourceType: "module",
        plugins: ["jsx", "typescript"],
        tokens: true,
        ranges: true,
        comments: true,
      });

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
}

module.exports = ConsoleAnalyzer;
