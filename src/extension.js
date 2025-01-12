// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const ConsoleAnalyzer = require("./services/consoleAnalyzer.js");
const CommandManager = require("./services/commandManager.js");
const StateManager = require("./services/stateManager");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const stateManager = new StateManager(context);
  const consoleAnalyzer = new ConsoleAnalyzer(stateManager);
  const commandManager = new CommandManager();

  // Create status bar item
  const logBossStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  logBossStatusBar.text = "☕ oss";
  logBossStatusBar.tooltip = "Manage Console Logs";
  logBossStatusBar.command = "logboss.showCommands";
  logBossStatusBar.show();

  // Register commands
  let disposables = [
    vscode.commands.registerCommand("logboss.showCommands", () => commandManager.showCommands()),
    vscode.commands.registerCommand("logboss.highlightConsoles", () => consoleAnalyzer.highlightConsoleStatements()),
    vscode.commands.registerCommand("logboss.removeHighlights", () => consoleAnalyzer.removeConsoleHighlighting()),
    vscode.commands.registerCommand("logboss.commentConsoleLogs", async (filePath) => await consoleAnalyzer.commentConsoleLogs(filePath)),
    vscode.commands.registerCommand("logboss.uncommentConsoleLogs", async (filePath) => await consoleAnalyzer.uncommentConsoleLogs(filePath)),
    vscode.commands.registerCommand("logboss.removeConsoleLogs", async (filePath) => await consoleAnalyzer.removeConsoleLogStatements(filePath)),
  ];

  context.subscriptions.push(logBossStatusBar, ...disposables);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
