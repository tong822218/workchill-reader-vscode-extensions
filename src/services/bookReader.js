const fs = require('fs');
const vscode = require('vscode');
const { getLinesPerPage, getFontSize, getFontColor, addConfigChangeListener } = require('../config');
const { saveReadingProgress } = require('./progress');

/**
 * 阅读器类
 * 负责处理文本阅读的核心功能
 */
class BookReader {
  constructor() {
    // 当前正在阅读的书籍路径
    this.currentBookPath = null;
    // 当前书籍的所有行
    this.currentBookLines = [];
    // 当前阅读到的行索引
    this.currentLineIndex = 0;
    // 当前文本装饰类型
    this.currentDecorationType = null;

    // 监听配置变更，实时更新显示
    addConfigChangeListener((key, value) => {
      if ((key === 'linesPerPage' || key === 'fontSize' || key === 'fontColor') && this.isReading()) {
        this.showCurrentLine();
      }
    });
  }

  /**
   * 检查是否正在阅读
   */
  isReading() {
    return this.currentBookPath !== null && this.currentBookLines.length > 0;
  }

  /**
   * 读取文本文件
   * @param {string} bookPath 书籍路径
   * @param {number} startLine 开始行数
   */
  readTxt(bookPath, startLine = 0) {
    this.currentBookPath = bookPath;
    const content = fs.readFileSync(bookPath, 'utf-8');
    this.currentBookLines = content.split('\n').filter(x => x !== '');
    this.currentLineIndex = startLine;
    this.showCurrentLine();
    vscode.window.showInformationMessage('开始阅读');
    return true;
  }

  /**
   * 显示当前行
   * 使用 VS Code 的装饰器功能在编辑器中显示文本
   */
  showCurrentLine() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // 清除旧的装饰器
    if (this.currentDecorationType) {
      editor.setDecorations(this.currentDecorationType, []);
      this.currentDecorationType.dispose();
    }

    // 获取要显示的行数
    const linesCount = getLinesPerPage();
    const startPosition = editor.selection.active;
    const decorations = [];

    // 计算每行应该显示的内容
    for (let i = 0; i < linesCount; i++) {
      const currentLineIndex = this.currentLineIndex + i;
      if (currentLineIndex >= this.currentBookLines.length) break;

      const lineText = this.currentBookLines[currentLineIndex];
      const position = new vscode.Position(startPosition.line + i, 0);
      decorations.push({
        range: new vscode.Range(position, position),
        renderOptions: {
          after: {
            contentText: lineText,
            fontStyle: `normal`,
            fontWeight: 'normal',
            fontSize: `${getFontSize()}px`,
            color: getFontColor(),
            margin: '0 0 0 2em',
          }
        }
      });
    }

    // 创建新的装饰器类型
    this.currentDecorationType = vscode.window.createTextEditorDecorationType({});

    // 应用所有装饰器
    editor.setDecorations(this.currentDecorationType, decorations);

    // 保存阅读进度
    saveReadingProgress(this.currentBookPath, this.currentLineIndex, this.currentBookLines.length);
  }

  /**
   * 下一页
   */
  nextPage() {
    if (this.currentLineIndex + getLinesPerPage() < this.currentBookLines.length) {
      this.currentLineIndex += getLinesPerPage();
      this.showCurrentLine();
    }
  }

  /**
   * 上一页
   */
  previousPage() {
    if (this.currentLineIndex >= getLinesPerPage()) {
      this.currentLineIndex -= getLinesPerPage();
    } else {
      this.currentLineIndex = 0;
    }
    this.showCurrentLine();
  }

  /**
   * 停止阅读
   */
  stop() {
    if (this.currentDecorationType) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.setDecorations(this.currentDecorationType, []);
        this.currentDecorationType.dispose();
      }
      this.currentDecorationType = null;
      this.currentBookLines = [];
      this.currentLineIndex = 0;
    }
  }
}

// 导出单例实例
module.exports = new BookReader(); 