const vscode = require("vscode");

class CommandManager {
  constructor() {
    this.commands = [
      {
        label: "$(search) Highlight Console Logs",
        description: "Highlight all console statements",
        command: "logboss.highlightConsoles",
      },
      {
        label: "$(clear-all) Remove Highlighting",
        description: "Remove console highlighting",
        command: "logboss.removeConsoleHighlighting",
      },
      {
        label: "$(trash) Remove Console Logs",
        description: "Remove all console statements",
        command: "logboss.removeConsoleLogs",
      },
    ];
  }

  showCommands() {
    return vscode.window
      .showQuickPick(this.commands, {
        placeHolder: "Select LogBoss Action",
      })
      .then((selection) => {
        if (selection) {
          vscode.commands.executeCommand(selection.command);
        }
      });
  }
}

module.exports = CommandManager; 