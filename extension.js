const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const EPub = require("epub2").EPub;

let bookFolderPath = "";
let currentBookLines = "";
let currentLineIndex = 0;
let currentEpub = {};
let bookType = "txt";

function activate(context) {
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
            console.log("METADATA:\n");
            console.log(epub.metadata);

            console.log("\nSPINE:\n");
            console.log(epub.flow);

            console.log("\nTOC:\n");
            console.log(epub.toc);

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

  function readTxt(bookPath) {
    bookType = "txt";
    const content = fs.readFileSync(bookPath, "utf-8");
    currentBookLines = content.split("\n").filter((x) => x !== "");
    currentLineIndex = 0;
    showCurrentLine();
  }

  // 注册方向键导航
  let nextLineDisposable = vscode.commands.registerCommand(
    "workchill.nextLine",
    () => {
      if (currentLineIndex < currentBookLines.length - 1) {
        currentLineIndex++;
        showCurrentLine();
      }
    }
  );

  let previousLineDisposable = vscode.commands.registerCommand(
    "workchill.previousLine",
    () => {
      if (currentLineIndex > 0) {
        currentLineIndex--;
        showCurrentLine();
      }
    }
  );

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

  context.subscriptions.push(
    nextLineDisposable,
    previousLineDisposable,
    clearContentDisposable
  );

  context.subscriptions.push(selectFolderDisposable, showBookDisposable);
}

let currentDecorationType;

function showCurrentLine() {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    // 清除之前的装饰
    if (currentDecorationType) {
      editor.setDecorations(currentDecorationType, []);
      currentDecorationType.dispose();
    }

    // 创建新的装饰器样式
    currentDecorationType = vscode.window.createTextEditorDecorationType({
      after: {
        contentText: currentBookLines[currentLineIndex],
        color: "#999999",
        margin: "0 0 0 1em",
      },
    });

    // 在光标位置显示当前行内容
    const position = editor.selection.active;
    const decoration = {
      range: new vscode.Range(position, position),
      hoverMessage: "书籍内容",
    };
    editor.setDecorations(currentDecorationType, [decoration]);
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
