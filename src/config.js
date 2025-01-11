const vscode = require('vscode');

// 配置相关变量
let config;
let bookFolderPath;
let linesPerPage;
let configChangeListeners = [];

/**
 * 初始化配置
 * @param {vscode.ExtensionContext} context 扩展上下文
 */
function initializeConfig(context) {
  config = vscode.workspace.getConfiguration('workchill');
  bookFolderPath = config.get('bookFolder') || context.extensionPath;
  linesPerPage = config.get('linesPerPage') || 1;
  
  // 监听配置变更
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(handleConfigChange)
  );
}

/**
 * 处理配置变更
 * @param {vscode.ConfigurationChangeEvent} event 配置变更事件
 */
function handleConfigChange(event) {
  if (event.affectsConfiguration('workchill')) {
    config = vscode.workspace.getConfiguration('workchill');

    if (event.affectsConfiguration('workchill.bookFolder')) {
      bookFolderPath = config.get('bookFolder');
    }
    
    if (event.affectsConfiguration('workchill.linesPerPage')) {
      linesPerPage = config.get('linesPerPage');
      notifyConfigChange('linesPerPage', linesPerPage);
    }
  }
}

/**
 * 添加配置变更监听器
 * @param {Function} listener 监听器函数
 */
function addConfigChangeListener(listener) {
  configChangeListeners.push(listener);
}

/**
 * 通知配置变更
 * @param {string} key 配置键
 * @param {any} value 配置值
 */
function notifyConfigChange(key, value) {
  configChangeListeners.forEach(listener => {
    listener(key, value);
  });
}

/**
 * 更新配置
 * @param {string} key 配置键
 * @param {any} value 配置值
 */
async function updateConfig(key, value) {
  await config.update(key, value, true);
  return value;
}

module.exports = {
  initializeConfig,
  getConfig: () => config,
  getBookFolderPath: () => bookFolderPath,
  getLinesPerPage: () => linesPerPage,
  updateConfig,
  addConfigChangeListener
}; 