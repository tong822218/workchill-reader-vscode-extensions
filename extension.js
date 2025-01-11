const vscode = require('vscode');
const { registerCommands } = require('./src/commands');
const { initializeConfig } = require('./src/config');
const { setExtensionContext } = require('./src/utils/extensionState');

function activate(context) {
  // 保存 context 到状态管理模块
  setExtensionContext(context);
  
  // 初始化配置
  initializeConfig(context);
  
  // 注册所有命令
  registerCommands(context);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
