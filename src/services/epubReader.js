const vscode = require('vscode');
const EPub = require('epub2').EPub;
const cheerio = require('cheerio');
const fs = require('fs');
const bookReader = require('./bookReader');

/**
 * EPUB 管理器类
 * 负责处理 EPUB 格式电子书的解析和转换
 */
class EpubManager {
  constructor() {
    this.epub = null;
  }

  /**
   * 处理 EPUB 文件
   * @param {string} bookPath EPUB 文件路径
   */
  async handleEpubFile(bookPath) {
    try {
      // 创建 EPUB 实例
      this.epub = new EPub(bookPath, '/imagewebroot/', '/articlewebroot/');

      return new Promise((resolve, reject) => {
        // 监听错误事件
        this.epub.on('error', (err) => {
          console.error('ERROR\n-----', err);
          reject(err);
        });

        // 监听解析完成事件
        this.epub.on('end', async () => {
          try {
            // 将 EPUB 转换为 TXT
            const res = await this.saveEpub2Txt(bookPath);
            // 开始阅读转换后的 TXT
            bookReader.readTxt(res.bookPath);
            resolve();
          } catch (err) {
            reject(err);
          }
        });

        // 开始解析
        this.epub.parse();
      });
    } catch (error) {
      console.error('解析EPUB文件失败', error);
      vscode.window.showErrorMessage('解析EPUB文件失败');
      throw error;
    }
  }

  /**
   * 将 EPUB 转换为 TXT
   * @param {string} selectedBook EPUB 文件路径
   */
  async saveEpub2Txt(selectedBook) {
    return new Promise((resolve, reject) => {
      const txtPath = selectedBook.split('.epub')[0] + '.txt';
      if (fs.existsSync(txtPath)) {
        fs.unlinkSync(txtPath);
      }

      const contents = this.epub.spine.contents;
      let processedChapters = 0;

      contents.forEach(async (item) => {
        try {
          const { text } = await this.getEpubChapter(item.id);
          fs.appendFileSync(txtPath, text);
          processedChapters++;

          if (processedChapters === contents.length) {
            resolve({ bookPath: txtPath });
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * 获取 EPUB 章节内容
   * @param {string} contentId 章节ID
   */
  async getEpubChapter(contentId) {
    return new Promise((resolve, reject) => {
      this.epub.getChapter(contentId, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        const $ = cheerio.load(data);
        let cleanText = $.text() + '\n';
        resolve({ text: cleanText });
      });
    });
  }
}

// 创建单例实例
const epubManager = new EpubManager();

/**
 * 处理 EPUB 文件的入口函数
 * @param {string} bookPath EPUB 文件路径
 */
async function handleEpubFile(bookPath) {
  try {
    await epubManager.handleEpubFile(bookPath);
  } catch (error) {
    vscode.window.showErrorMessage(`处理EPUB文件失败: ${error.message}`);
  }
}

module.exports = {
  handleEpubFile
}; 