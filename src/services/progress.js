const fs = require('fs');
const path = require('path');
const { getExtensionContext } = require('../utils/extensionState');

const PROGRESS_FILE = 'reading-progress.json';

function saveReadingProgress(bookPath, currentLine, totalLines) {
  const context = getExtensionContext();
  if (!context) {
    console.error('Extension context not available');
    return;
  }

  const progressFilePath = path.join(context.extensionPath, PROGRESS_FILE);
  let progress = {};

  if (fs.existsSync(progressFilePath)) {
    progress = JSON.parse(fs.readFileSync(progressFilePath, 'utf-8'));
  }

  progress[bookPath] = {
    currentLine,
    timestamp: new Date().getTime(),
    totalLines,
  };

  fs.writeFileSync(progressFilePath, JSON.stringify(progress, null, 2));
}

function getReadingProgress() {
  const context = getExtensionContext();
  if (!context) {
    console.error('Extension context not available');
    return {};
  }

  const progressFilePath = path.join(context.extensionPath, PROGRESS_FILE);
  if (fs.existsSync(progressFilePath)) {
    return JSON.parse(fs.readFileSync(progressFilePath, 'utf-8'));
  }
  return {};
}

module.exports = {
  saveReadingProgress,
  getReadingProgress
}; 