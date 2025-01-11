const path = require('path');

class StateManager {
  constructor(context) {
    this.context = context;
    this.stateKey = 'logboss.fileStates';
    this.states = this.loadStates();
  }

  loadStates() {
    return this.context.workspaceState.get(this.stateKey, {});
  }

  saveStates() {
    return this.context.workspaceState.update(this.stateKey, this.states);
  }

  getFileState(filePath) {
    const normalizedPath = this.normalizePath(filePath);
    return this.states[normalizedPath] || {
      isCommented: false,
      isHighlighted: false,
      lastModified: null
    };
  }

  updateFileState(filePath, updates) {
    const normalizedPath = this.normalizePath(filePath);
    this.states[normalizedPath] = {
      ...this.getFileState(filePath),
      ...updates,
      lastModified: new Date().toISOString()
    };
    return this.saveStates();
  }

  clearFileState(filePath) {
    const normalizedPath = this.normalizePath(filePath);
    delete this.states[normalizedPath];
    return this.saveStates();
  }

  normalizePath(filePath) {
    return path.normalize(filePath);
  }
}

module.exports = StateManager; 