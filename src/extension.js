// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const ConsoleAnalyzer = require("./services/consoleAnalyzer.js");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const consoleAnalyzer = new ConsoleAnalyzer();

  // Example command to analyze console statements
  let highlightConsoles = vscode.commands.registerCommand("logboss.highlightConsoles", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const code = editor.document.getText();
    consoleAnalyzer.highlightConsoleStatements(code);
  });

  // Example command to analyze console statements
  let removeConsoleHighlighting = vscode.commands.registerCommand("logboss.removeConsoleHighlighting", () => {
    consoleAnalyzer.removeConsoleHighlighting();
  });

  context.subscriptions.push(highlightConsoles);
  context.subscriptions.push(removeConsoleHighlighting);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
