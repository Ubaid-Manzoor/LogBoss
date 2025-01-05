# LogBoss

LogBoss is a VS Code extension that helps you manage console.log statements effortlessly. Quickly highlight or remove logs in your current file keeping your code clean and production-ready. 🚀

## Features

### 1. Highlight Console Statements
Command: `LogBoss: Highlight Console Statements`
- Highlights all console statements in the current file
- Supports all console methods (log, warn, error, info, debug, trace)
- Detects both active and single-line commented console statements

### 2. Toggle Console Statement Comments
Command: `LogBoss: Remove Console Highlighting`
- remove console highlighting in the current file

### 3. Remove Console Statements
Command: `LogBoss: Remove Console Statements`
- Removes all console statements from the current file
- Handles both active and single-line commented console statements
- Preserves code formatting and structure



## Usage

1. Open a JavaScript/TypeScript file
2. Access commands through:
   - Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
   - Right-click context menu
   - Custom keyboard shortcuts


## Coming Soon 🚀

### 1. Comment/Uncomment Console Statements
- Toggle comments for console statements with a single command
- Smart indentation preservation
- Batch comment/uncomment support

### 2. Full Directory Support
- Process console statements across entire directories
- Selective file filtering (e.g., ignore node_modules)
- Support for workspace-wide changes


## Tips

- Use the highlight feature to review all console statements before removing them
- The extension preserves code formatting when removing or commenting statements
- Works with both JavaScript and TypeScript files
