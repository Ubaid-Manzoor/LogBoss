const vscode = require("vscode");
const FileSelector = require("./fileSelector.js");

class CommandManager {
  constructor() {
    this.fileSelector = new FileSelector();
    this.commands = [
      {
        label: "$(eye) Highlight Console Logs",
        description: "Highlight all console statements",
        command: "logboss.highlightConsoles",
      },
      {
        label: "$(eye-closed) Remove Highlights",
        description: "Remove console statement highlights",
        command: "logboss.removeHighlights",
      },
      {
        label: "$(comment) Comment Console Logs",
        description: "Add comments to console statements",
        command: "logboss.commentConsoleLogs",
      },
      {
        label: "$(comment-discussion) Uncomment Console Logs",
        description: "Remove comments from console statements",
        command: "logboss.uncommentConsoleLogs",
      },
      {
        label: "$(trash) Remove Console Logs",
        description: "Delete all console statements",
        command: "logboss.removeConsoleLogs",
      },
    ];
  }

  async showCommands() {
    const selection = await vscode.window.showQuickPick(this.commands, {
      placeHolder: "Select LogBoss Action",
    });

    if (!selection) return;

    // For file-based commands, show file selector
    if (["logboss.commentConsoleLogs", "logboss.uncommentConsoleLogs", "logboss.removeConsoleLogs"].includes(selection.command)) {
      const currentFile = vscode.window.activeTextEditor?.document.uri.fsPath;
      const selectedPaths = await this.fileSelector.showFileSelector(currentFile);

      if (!selectedPaths.length) return;

      const filesToProcess = await this.fileSelector.processSelectedPaths(selectedPaths);

      // Execute command for each file
      for (const filePath of filesToProcess) {
        await vscode.commands.executeCommand(selection.command, filePath);
      }
    } else {
      // For highlight commands, execute normally
      await vscode.commands.executeCommand(selection.command);
    }
  }
}

module.exports = CommandManager;
