const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { getBookFolderPath, updateConfig } = require('../config');
const bookReader = require('../services/bookReader');
const { handleEpubFile } = require('../services/epubReader');
const { getReadingProgress } = require('../services/progress');

function handleWebviewMessage(message, panel) {
  switch (message.command) {
    case 'selectDirectory':
      handleSelectDirectory(panel);
      break;
    case 'saveSettings':
      handleSaveSettings(message);
      break;
    case 'selectFile':
      handleSelectFile(message, panel);
      break;
  }
}

async function handleSelectDirectory(panel) {
  const folderUri = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
  });

  if (folderUri && folderUri[0]) {
    await updateConfig('bookFolder', folderUri[0].fsPath);
    updateFileList(panel);
  }
}

function updateFileList(panel) {
  const bookFolderPath = getBookFolderPath();
  if (!bookFolderPath || !fs.existsSync(bookFolderPath)) {
    panel.webview.postMessage({
      command: 'updateFileList',
      currentFolder: bookFolderPath || '未设置书籍目录',
      files: []
    });
    return;
  }

  const progress = getReadingProgress();
  const files = fs.readdirSync(bookFolderPath)
    .filter(file => ['.txt', '.epub'].includes(path.extname(file).toLowerCase()))
    .map(file => {
      const filePath = path.join(bookFolderPath, file);
      return {
        name: file,
        path: filePath,
        progress: progress[filePath] || {}
      };
    });

  panel.webview.postMessage({
    command: 'updateFileList',
    currentFolder: bookFolderPath,
    files: files
  });
}

async function handleSaveSettings(message) {
  try {
    await updateConfig('linesPerPage', parseInt(message.linesPerPage));
    await updateConfig('fontSize', parseInt(message.fontSize));
    await updateConfig('fontColor', message.fontColor);
    vscode.window.showInformationMessage('设置已保存并生效');
  } catch (error) {
    vscode.window.showErrorMessage('保存设置失败: ' + error.message);
  }
}

async function handleSelectFile(message, panel) {
  const ext = path.extname(message.file).toLowerCase();
  if (ext === '.epub') {
    await handleEpubFile(message.file);
  } else {
    bookReader.readTxt(message.file, message.startLine || 0);
  }
  panel.dispose();
}

module.exports = {
  handleWebviewMessage,
  updateFileList
}; 