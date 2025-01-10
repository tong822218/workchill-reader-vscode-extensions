const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const EPub = require("epub2").EPub;

const config = vscode.workspace.getConfiguration("workchill");

let bookFolderPath = ""; // 书籍文件根目录
let currentBookLines = ""; // 当前阅读书籍的内容
let currentLineIndex = 0; // 阅读第几行
let currentEpub = {};
let bookType = "txt";
let linesPerPage = config.get("linesPerPage") || 1;

function activate(context) {
  bookFolderPath = config.get("bookFolder") || context.extensionPath;
  config.update("bookFolder", bookFolderPath, true);
  const shortcutsDisposable = registerShortcuts();
  context.subscriptions.push(...shortcutsDisposable);
}

// 读取txt文件
function readTxt(bookPath) {
  bookType = "txt";
  const content = fs.readFileSync(bookPath, "utf-8");
  currentBookLines = content.split("\n").filter((x) => x !== "");
  currentLineIndex = 0;
  showCurrentLine();
}
// 注册快捷键
function registerShortcuts() {
  // 下一页快捷键
  let nextLineDisposable = vscode.commands.registerCommand(
    "workchill.nextLine",
    () => {
      // 确保不会超出总行数
      if (currentLineIndex + linesPerPage < currentBookLines.length) {
        currentLineIndex += linesPerPage;
        showCurrentLine();
      } else {
        // 如果已经到达最后一页，停在最后
        currentLineIndex = Math.max(0, currentBookLines.length - linesPerPage);
        showCurrentLine();
      }
    }
  );

  // 上一页快捷键
  let previousLineDisposable = vscode.commands.registerCommand(
    "workchill.previousLine",
    () => {
      // 向上翻页，确保不会小于0
      if (currentLineIndex >= linesPerPage) {
        currentLineIndex -= linesPerPage;
      } else {
        // 如果已经在开头，保持为0
        currentLineIndex = 0;
      }
      showCurrentLine();
    }
  );

  // 注册隐藏插件快捷键
  let clearContentDisposable = vscode.commands.registerCommand(
    "workchill.clearContent",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && currentDecorationType) {
        editor.setDecorations(currentDecorationType, []);
        currentDecorationType.dispose();
        currentDecorationType = undefined;

        // 清除方向键导航
        nextLineDisposable.dispose();
        previousLineDisposable.dispose();
      }
    }
  );

  // 注册选择书籍目录命令
  let selectFolderDisposable = vscode.commands.registerCommand(
    "workchill.selectBookFolder",
    async () => {
      const folderUri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
      });

      if (folderUri && folderUri[0]) {
        bookFolderPath = folderUri[0].fsPath;
        config.update("bookFolder", bookFolderPath, true);
        vscode.window.showInformationMessage(
          `书籍目录已设置为：${bookFolderPath}`
        );
      }
    }
  );

  // // 注册显示书籍内容命令
  let showBookDisposable = vscode.commands.registerCommand(
    "workchill.showBook",
    async () => {
      if (!bookFolderPath) {
        vscode.window.showErrorMessage("请先选择书籍目录");
        return;
      }

      // 获取书籍目录下的文件列表
      const bookFiles = fs
        .readdirSync(bookFolderPath)
        .filter((file) =>
          [".txt", ".md", ".epub"].includes(path.extname(file).toLowerCase())
        );

      if (bookFiles.length === 0) {
        vscode.window.showErrorMessage("书籍目录中没有找到可用的书籍文件");
        return;
      }

      // 让用户选择书籍
      const selectedBook = await vscode.window.showQuickPick(bookFiles);
      if (!selectedBook) return;

      const bookPath = path.join(bookFolderPath, selectedBook);
      const ext = path.extname(selectedBook).toLowerCase();

      if (ext === ".epub") {
        bookType = "epub";
        try {
          var epub = new EPub(bookPath, "/imagewebroot/", "/articlewebroot/");
          currentEpub = epub;

          epub.on("error", function (err) {
            console.log("ERROR\n-----");
            throw err;
          });

          epub.on("end", async function (err) {
            const res = await saveEpub2Txt(selectedBook);
            readTxt(res.bookPath);
          });

          epub.parse();
        } catch (error) {
          console.error("解析EPUB文件失败", error);
          vscode.window.showErrorMessage("解析EPUB文件失败");
        }
      } else {
        readTxt(bookPath);
      }
    }
  );

  // 监听配置变更
  let configChangeDisposable = vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration("workchill")) {
        const newConfig = vscode.workspace.getConfiguration("workchill");
        linesPerPage = newConfig.get("linesPerPage", 1);
        bookFolderPath = newConfig.get("bookFolder", context.extensionPath);
        console.log(linesPerPage);
        console.log("变更了");
      }
    }
  );

  return [
    nextLineDisposable,
    previousLineDisposable,
    clearContentDisposable,
    showBookDisposable,
    selectFolderDisposable,
    configChangeDisposable,
  ];
}

let currentDecorationType;

// 显示当前行到编辑器
function showCurrentLine() {
  // 创建或获取输出通道
  // if (!this.outputChannel) {
  //   this.outputChannel = vscode.window.createOutputChannel("Book Content");
  // }
  // // 获取要显示的多行内容
  // const linesToShow = currentBookLines
  //   .slice(currentLineIndex, currentLineIndex + linesPerPage)
  //   .join("\n");

  // // 清除之前的内容并显示新内容
  // this.outputChannel.clear();
  // this.outputChannel.appendLine(linesToShow);
  // this.outputChannel.show(true);
  // return;

  const editor = vscode.window.activeTextEditor;
  if (editor) {
    // 清除之前的装饰
    if (currentDecorationType) {
      editor.setDecorations(currentDecorationType, []);
      currentDecorationType.dispose();
    }

    // 获取要显示的多行内容
    const linesToShow = currentBookLines.slice(
      currentLineIndex,
      currentLineIndex + linesPerPage
    );

    // 创建装饰选项数组
    const decorationOptions = linesToShow.map((line, index) => ({
      range: new vscode.Range(
        new vscode.Position(editor.selection.active.line + index, 0),
        new vscode.Position(editor.selection.active.line + index, 0)
      ),
      renderOptions: {
        after: {
          contentText: line,
          color: "#999999",
          margin: "0 0 0 1em",
        },
      },
    }));

    // 创建装饰类型
    
    currentDecorationType = vscode.window.createTextEditorDecorationType({
      // isWholeLine: true,
    });

    editor.setDecorations(currentDecorationType, decorationOptions);
  }
}
// 将epub书籍保存为 同名的 txt
function saveEpub2Txt(selectedBook) {
  return new Promise(async (resolve, reject) => {
    const txtPath =
      path.join(bookFolderPath, selectedBook).split(".epub")[0] + ".txt";
    // 如果txtPath 已经存在就先删除txtPath
    if (fs.existsSync(txtPath)) {
      fs.unlinkSync(txtPath);
      console.log("删除成功");
    }
    const contents = currentEpub.spine.contents;

    for (let i = 0; i < contents.length; i++) {
      const item = contents[i];
      const { text } = await getEpubChapter(item.id);
      // 在新的一行追加

      try {
        fs.appendFileSync(txtPath, text);
        console.log("内容已追加");
        if (i >= contents.length - 1) {
          console.log("txt文件创建完毕");
          resolve({ bookPath: txtPath });
        }
      } catch (err) {
        reject(err);
        console.error(err);
      }
    }
  });
}

async function getEpubChapter(contentId) {
  return new Promise((resolve, reject) => {
    currentEpub.getChapter(contentId, function (err, data) {
      if (err) {
        console.log(err);
        reject();
      }
      const $ = cheerio.load(data);
      let cleanText = $.text() + "\n";
      resolve({ text: cleanText });
    });
  });
}

function deactivate() {}

module.exports = {
  activate: activate,
  deactivate: deactivate,
};
