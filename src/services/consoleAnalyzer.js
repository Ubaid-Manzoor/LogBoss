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
        comments: true, // Enable comment parsing
      });

      // First collect all comment ranges
      const commentedConsoleStatements = ast.comments
        .filter((comment) => {
          const commentCode = comment.value.replace(/^[\s*]+/gm, "");
          const regex = /^\s*console\.(log|warn|error|info|debug|trace)\s*\(([\s\S]*?)\)\s*;?(\s*\/\/.*)?$/;

          // Test if the comment matches the pattern
          return regex.test(commentCode);
        })
        .map((comment) => {
          return {
            ...comment,
            value: comment.value.replace(/^[\s*]+/gm, ""),
          };
        });

      // Traverse the AST to find console statements
      traverse(ast, {
        CallExpression(path) {
          if (path.node.callee.type === "MemberExpression" && path.node.callee.object.name === "console") {
            const statement = {
              type: path.node.callee.property.name,
              start: path.node.start,
              end: path.node.end,
              line: path.node.loc.start.line,
              column: path.node.loc.start.column,
              loc: path.node.loc,
              value: code.slice(path.node.start, path.node.end),
            };

            consoleStatements.push(statement);
          }
        },
      });

      consoleStatements.push(...commentedConsoleStatements);

      const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: new vscode.ThemeColor("editor.selectionBackground"),
      });

      // Convert the console statements to ranges

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
