// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const ConsoleAnalyzer = require("./services/consoleAnalyzer.js");
const CommandManager = require("./services/commandManager.js");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const consoleAnalyzer = new ConsoleAnalyzer();
  const commandManager = new CommandManager();

  // Create status bar item
  const logBossStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

  logBossStatusBar.text = "$(coffee) Boss";
  logBossStatusBar.tooltip = "Click to manage console logs";
  logBossStatusBar.command = "logboss.showCommands";
  logBossStatusBar.show();

  // Register commands
  let showCommands = vscode.commands.registerCommand("logboss.showCommands", () => commandManager.showCommands());
  let highlightConsoles = vscode.commands.registerCommand("logboss.highlightConsoles", () => consoleAnalyzer.highlightConsoleStatements());
  let removeConsoleHighlighting = vscode.commands.registerCommand("logboss.removeConsoleHighlighting", () => consoleAnalyzer.removeConsoleHighlighting());
  let removeConsoleLogStatements = vscode.commands.registerCommand("logboss.removeConsoleLogs", () => consoleAnalyzer.removeConsoleLogStatements());

  context.subscriptions.push(logBossStatusBar, showCommands, highlightConsoles, removeConsoleHighlighting, removeConsoleLogStatements);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
