const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { handleEpubFile } = require('../services/epubReader');
const bookReader = require('../services/bookReader');

function registerReadingCommands() {
  const commands = [];

  // 注册开始阅读命令
  commands.push(
    vscode.commands.registerCommand('workchill.startReading', async () => {
      const bookFolderPath = vscode.workspace.getConfiguration('workchill').get('bookFolder');
      if (!bookFolderPath) {
        vscode.window.showErrorMessage('请先选择书籍目录');
        return;
      }

      // 获取书籍目录下的文件列表
      const bookFiles = fs.readdirSync(bookFolderPath)
        .filter(file => ['.txt', '.epub'].includes(path.extname(file).toLowerCase()));

      if (bookFiles.length === 0) {
        vscode.window.showErrorMessage('书籍目录中没有找到可用的书籍文件');
        return;
      }

      // 让用户选择书籍
      const selectedBook = await vscode.window.showQuickPick(bookFiles);
      if (!selectedBook) return;

      const bookPath = path.join(bookFolderPath, selectedBook);
      const ext = path.extname(selectedBook).toLowerCase();

      if (ext === '.epub') {
        await handleEpubFile(bookPath);
      } else {
        bookReader.readTxt(bookPath);
      }
    })
  );

  // 注册停止阅读命令
  commands.push(
    vscode.commands.registerCommand('workchill.stopReading', () => {
      bookReader.stop();
    })
  );

  // 注册下一页命令
  commands.push(
    vscode.commands.registerCommand('workchill.nextLine', () => {
      bookReader.nextPage();
    })
  );

  // 注册上一页命令
  commands.push(
    vscode.commands.registerCommand('workchill.previousLine', () => {
      bookReader.previousPage();
    })
  );

  return commands;
}

module.exports = {
  registerReadingCommands
}; 