const vscode = require("vscode")
const fs = require("fs")
const path = require("path")
const cheerio = require("cheerio")

const EPub = require("epub2").EPub

const config = vscode.workspace.getConfiguration("workchill")

let bookFolderPath = "" // 书籍文件根目录
let currentBookLines = "" // 当前阅读书籍的内容
let currentLineIndex = 0 // 阅读第几行
let currentEpub = {}
let bookType = "txt"
let linesPerPage = config.get("linesPerPage") || 1

function activate(context) {
  // 初始化配置
  bookFolderPath = config.get("bookFolder") || context.extensionPath
  config.update("bookFolder", bookFolderPath, true)

  // 注册命令
  const shortcutsDisposable = registerShortcuts()
  context.subscriptions.push(...shortcutsDisposable)

  // 注册设置面板命令
  context.subscriptions.push(
    vscode.commands.registerCommand("workchill.showSettings", () => {
      const panel = vscode.window.createWebviewPanel("workchillSettings", "Workchill Settings", vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
      })

      // 设置Webview内容
      const webviewPath = vscode.Uri.file(path.join(context.extensionPath, "src", "webview", "index.html"))
      panel.webview.html = getWebviewContent(webviewPath)

      // 处理来自Webview的消息
      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "selectDirectory":
              const folderUri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
              })
              if (folderUri && folderUri[0]) {
                bookFolderPath = folderUri[0].fsPath
                config.update("bookFolder", bookFolderPath, true)
                updateFileList(panel)
              }
              break

            case "saveSettings":
              config.update("linesPerPage", message.linesPerPage, true)
              vscode.window.showInformationMessage("设置已保存")
              break

            case "selectFile":
              const bookPath = message.file
              const ext = path.extname(bookPath).toLowerCase()
              if (ext === ".epub") {
                await handleEpubFile(bookPath)
              } else {
                readTxt(bookPath)
              }
              break
          }
        },
        undefined,
        context.subscriptions
      )

      // 初始化时发送当前设置
      panel.webview.postMessage({
        command: "updateSettings",
        settings: {
          linesPerPage: config.get("linesPerPage"),
        },
      })

      // 更新文件列表
      updateFileList(panel)
    })
  )
}

function getWebviewContent(webviewPath) {
  const filePath = webviewPath.fsPath
  const content = fs.readFileSync(filePath, "utf-8")
  return content
}

function updateFileList(panel) {
  if (!fs.existsSync(bookFolderPath)) {
    return
  }

  const files = fs
    .readdirSync(bookFolderPath)
    .filter((file) => [".txt", ".epub"].includes(path.extname(file).toLowerCase()))
    .map((file) => ({
      name: file,
      path: path.join(bookFolderPath, file),
    }))

  panel.webview.postMessage({
    command: "updateFileList",
    files: files,
  })
}

// 读取txt文件
function readTxt(bookPath) {
  bookType = "txt"
  const content = fs.readFileSync(bookPath, "utf-8")
  currentBookLines = content.split("\n").filter((x) => x !== "")
  currentLineIndex = 0
  showCurrentLine()
  vscode.window.showInformationMessage("Start Reading")
}

async function handleEpubFile(bookPath) {
  try {
    const epub = new EPub(bookPath, "/imagewebroot/", "/articlewebroot/")
    currentEpub = epub

    epub.on("error", function (err) {
      console.log("ERROR\n-----")
      throw err
    })

    epub.on("end", async function (err) {
      const res = await saveEpub2Txt(bookPath)
      readTxt(res.bookPath)
    })

    epub.parse()
  } catch (error) {
    console.error("解析EPUB文件失败", error)
    vscode.window.showErrorMessage("解析EPUB文件失败")
  }
}

function registerShortcuts() {
  let nextLineDisposable
  let previousLineDisposable

  function registerReadingShortcuts() {
    if (nextLineDisposable) {
      nextLineDisposable.dispose()
    }
    if (previousLineDisposable) {
      previousLineDisposable.dispose()
    }

    // 下一页快捷键
    nextLineDisposable = vscode.commands.registerCommand("workchill.nextLine", () => {
      console.log("下一页")

      // 确保不会超出总行数
      if (currentLineIndex + linesPerPage < currentBookLines.length) {
        currentLineIndex += linesPerPage
        showCurrentLine()
      } else {
        // 如果已经到达最后一页，停在最后
        currentLineIndex = Math.max(0, currentBookLines.length - linesPerPage)
        showCurrentLine()
      }
    })

    // 上一页快捷键
    previousLineDisposable = vscode.commands.registerCommand("workchill.previousLine", () => {
      // 向上翻页，确保不会小于0
      if (currentLineIndex >= linesPerPage) {
        currentLineIndex -= linesPerPage
      } else {
        // 如果已经在开头，保持为0
        currentLineIndex = 0
      }
      showCurrentLine()
    })
  }

  function unregisterReadingShortcuts() {
    if (nextLineDisposable) {
      nextLineDisposable.dispose()
    }
    if (previousLineDisposable) {
      previousLineDisposable.dispose()
    }

    nextLineDisposable = vscode.commands.registerCommand("workchill.nextLine", () => {})
    previousLineDisposable = vscode.commands.registerCommand("workchill.previousLine", () => {})
  }

  // 注册选择书籍目录命令
  let selectFolderDisposable = vscode.commands.registerCommand("workchill.selectBookFolder", async () => {
    const folderUri = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
    })

    if (folderUri && folderUri[0]) {
      bookFolderPath = folderUri[0].fsPath
      config.update("bookFolder", bookFolderPath, true)
      vscode.window.showInformationMessage(`书籍目录已设置为：${bookFolderPath}`)
    }
  })

  // 监听配置变更
  let configChangeDisposable = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("workchill")) {
      const newConfig = vscode.workspace.getConfiguration("workchill")
      linesPerPage = newConfig.get("linesPerPage", 1)
      bookFolderPath = newConfig.get("bookFolder", context.extensionPath)
      console.log(linesPerPage)
      console.log("变更了")
    }
  })

  // 注册开始阅读命令
  let startReadingDisposable = vscode.commands.registerCommand("workchill.startReading", async () => {
    if (!bookFolderPath) {
      vscode.window.showErrorMessage("请先选择书籍目录")
      return
    }

    // 获取书籍目录下的文件列表
    const bookFiles = fs.readdirSync(bookFolderPath).filter((file) => [".txt", ".epub"].includes(path.extname(file).toLowerCase()))

    if (bookFiles.length === 0) {
      vscode.window.showErrorMessage("书籍目录中没有找到可用的书籍文件")
      return
    }

    // 让用户选择书籍
    const selectedBook = await vscode.window.showQuickPick(bookFiles)
    if (!selectedBook) return

    const bookPath = path.join(bookFolderPath, selectedBook)
    const ext = path.extname(selectedBook).toLowerCase()

    if (ext === ".epub") {
      await handleEpubFile(bookPath)
    } else {
      readTxt(bookPath)
    }
    registerReadingShortcuts()
  })

  // 注册停止阅读命令
  let stopReadingDisposable = vscode.commands.registerCommand("workchill.stopReading", () => {
    if (currentDecorationType) {
      const editor = vscode.window.activeTextEditor
      if (editor) {
        editor.setDecorations(currentDecorationType, [])
        currentDecorationType.dispose()
        currentDecorationType = undefined
      }
      currentBookLines = []
      currentLineIndex = 0
      // vscode.window.showInformationMessage("Stop Reading");
    }
    unregisterReadingShortcuts()
  })

  return [nextLineDisposable, previousLineDisposable, selectFolderDisposable, configChangeDisposable, startReadingDisposable, stopReadingDisposable]
}

let currentDecorationType

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

  const editor = vscode.window.activeTextEditor
  if (editor) {
    // 清除之前的装饰
    if (currentDecorationType) {
      editor.setDecorations(currentDecorationType, [])
      currentDecorationType.dispose()
    }

    // 获取要显示的多行内容
    const linesToShow = currentBookLines.slice(currentLineIndex, currentLineIndex + linesPerPage)

    const cursor = editor.selection.active

    // 创建装饰选项数组
    const decorationOptions = linesToShow.map((line, index) => ({
      range: new vscode.Range(new vscode.Position(cursor.line + index, cursor.character), new vscode.Position(cursor.line + index, Number.MAX_VALUE)),
      renderOptions: {
        after: {
          contentText: line,
          color: "#999999",
          margin: "0 0 0 1em",
        },
      },
    }))

    // 创建装饰类型

    currentDecorationType = vscode.window.createTextEditorDecorationType({
      // isWholeLine: true,
    })

    editor.setDecorations(currentDecorationType, decorationOptions)
  }
}
// 将epub书籍保存为 同名的 txt
function saveEpub2Txt(selectedBook) {
  return new Promise(async (resolve, reject) => {
    const txtPath = selectedBook.split(".epub")[0] + ".txt"
    // 如果txtPath 已经存在就先删除txtPath
    if (fs.existsSync(txtPath)) {
      fs.unlinkSync(txtPath)
      console.log("删除成功")
    }
    const contents = currentEpub.spine.contents

    for (let i = 0; i < contents.length; i++) {
      const item = contents[i]
      const { text } = await getEpubChapter(item.id)
      // 在新的一行追加

      try {
        fs.appendFileSync(txtPath, text)
        console.log("内容已追加")
        if (i >= contents.length - 1) {
          console.log("txt文件创建完毕")
          resolve({ bookPath: txtPath })
        }
      } catch (err) {
        reject(err)
        console.error(err)
      }
    }
  })
}

async function getEpubChapter(contentId) {
  return new Promise((resolve, reject) => {
    currentEpub.getChapter(contentId, function (err, data) {
      if (err) {
        console.log(err)
        reject()
      }
      const $ = cheerio.load(data)
      let cleanText = $.text() + "\n"
      resolve({ text: cleanText })
    })
  })
}

function deactivate() {}

module.exports = {
  activate: activate,
  deactivate: deactivate,
}
