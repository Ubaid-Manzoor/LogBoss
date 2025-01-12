const vscode = require("vscode");
const path = require("path");

class FileSelector {
  async showFileSelector(defaultFile = null) {
    const options = await this.getSelectionOptions();
    
    // Find and mark the default file as picked
    if (defaultFile) {
      const defaultOption = options.find(opt => opt.fsPath === defaultFile);
      if (defaultOption) {
        defaultOption.picked = true;
      }
    }

    const selection = await vscode.window.showQuickPick(options, {
      placeHolder: 'Select files/folders',
      canPickMany: true,
      ignoreFocusOut: true
    });

    return selection?.map(item => item.fsPath) ?? [];
  }

  async getSelectionOptions() {
    const options = [];
    const currentFile = vscode.window.activeTextEditor?.document.uri.fsPath;
    
    // Add workspace folders
    if (vscode.workspace.workspaceFolders) {
      options.push(...vscode.workspace.workspaceFolders.map(folder => ({
        label: `📁 ${folder.name}`,
        description: 'Workspace Folder',
        fsPath: folder.uri.fsPath,
        picked: false
      })));
    }

    // Add all JavaScript/TypeScript files
    const files = await vscode.workspace.findFiles(
      '{**/*.js,**/*.ts,**/*.jsx,**/*.tsx}',
      '**/node_modules/**'
    );

    options.push(...files.map(file => ({
      label: `📄 ${path.basename(file.fsPath)}`,
      description: vscode.workspace.asRelativePath(file.fsPath),
      fsPath: file.fsPath,
      picked: file.fsPath === currentFile
    })));

    // Sort to put current file first
    options.sort((a, b) => {
      if (a.fsPath === currentFile) return -1;
      if (b.fsPath === currentFile) return 1;
      return 0;
    });

    return options;
  }

  async processSelectedPaths(paths) {
    const allFiles = [];
    
    for (const selectedPath of paths) {
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(selectedPath));
      
      if (stat.type === vscode.FileType.Directory) {
        // If directory, get all JS/TS files within
        const files = await vscode.workspace.findFiles(
          new vscode.RelativePattern(selectedPath, '{**/*.js,**/*.ts,**/*.jsx,**/*.tsx}'),
          '**/node_modules/**'
        );
        allFiles.push(...files.map(f => f.fsPath));
      } else {
        allFiles.push(selectedPath);
      }
    }
    
    return [...new Set(allFiles)]; // Remove duplicates
  }
}

module.exports = FileSelector;
