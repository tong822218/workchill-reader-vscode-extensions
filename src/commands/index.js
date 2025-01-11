const vscode = require('vscode');
const { registerReadingCommands } = require('./reading');
const { registerSettingsCommands } = require('./settings');

function registerCommands(context) {
  const readingCommands = registerReadingCommands();
  const settingsCommands = registerSettingsCommands();

  context.subscriptions.push(...readingCommands, ...settingsCommands);
}

module.exports = {
  registerCommands
}; 