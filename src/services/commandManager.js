const vscode = require("vscode");

class CommandManager {
  constructor() {
    this.commands = [
      {
        label: "$(search) Toggle Console Highlights",
        description: "Highlight/unhighlight console statements",
        command: "logboss.toggleHighlightConsoles",
      },
      {
        label: "$(comment) Toggle Console Comments",
        description: "Comment/uncomment console statements",
        command: "logboss.toggleConsoleComments",
      },
      {
        label: "$(trash) Remove Console Logs",
        description: "Remove all console statements",
        command: "logboss.removeConsoleLogs",
      },
    ];
  }

  updateToggleDescription(isCommented) {
    const toggleCommand = this.commands.find((cmd) => cmd.command === "logboss.toggleConsoleComments");
    if (toggleCommand) {
      toggleCommand.label = isCommented ? "$(comment) // Toggle Console Comments" : "$(comment) Toggle Console Comment";
    }
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
