const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { getExtensionContext } = require('../utils/extensionState');
const { handleWebviewMessage, updateFileList } = require('../webview/handler');
const { getBookFolderPath, getConfig } = require('../config');

function registerSettingsCommands() {
  const commands = [];

  // 注册选择书籍目录命令
  commands.push(
    vscode.commands.registerCommand('workchill.selectBookFolder', async () => {
      const folderUri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
      });

      if (folderUri && folderUri[0]) {
        await updateConfig('bookFolder', folderUri[0].fsPath);
        vscode.window.showInformationMessage(`书籍目录已设置为：${folderUri[0].fsPath}`);
      }
    })
  );

  // 注册设置面板命令
  commands.push(
    vscode.commands.registerCommand('workchill.showSettings', () => {
      const context = getExtensionContext();
      if (!context) {
        vscode.window.showErrorMessage('Extension context not available');
        return;
      }

      const panel = vscode.window.createWebviewPanel(
        'workchillSettings',
        'Workchill Settings',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      // 设置Webview内容
      const webviewPath = vscode.Uri.file(
        path.join(context.extensionPath, 'src', 'webview', 'index.html')
      );
      panel.webview.html = fs.readFileSync(webviewPath.fsPath, 'utf-8');

      // 处理来自Webview的消息
      panel.webview.onDidReceiveMessage(
        message => handleWebviewMessage(message, panel),
        undefined,
        context.subscriptions
      );

      // 获取当前配置
      const config = getConfig();

      // 初始化时发送当前设置
      panel.webview.postMessage({
        command: 'updateSettings',
        settings: {
          linesPerPage: config.get('linesPerPage') || 1,
          fontSize: config.get('fontSize') || 14,
          fontColor: config.get('fontColor') || '#A8A8A8',
          bookFolderPath: getBookFolderPath()
        },
      });

      // 初始化时更新文件列表
      updateFileList(panel);
    })
  );

  return commands;
}

module.exports = {
  registerSettingsCommands
}; 