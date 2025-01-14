# Workchill Reader - VSCode Extension

一个用来上班摸鱼的 VSCode 阅读插件。支持在编辑区域阅读本地 txt、epub 小说。隐蔽性极高，支持自动保存阅读进度，设置每次展示行数，设置字体大小，颜色等。

## 效果预览

### 阅读界面(每页读一行)
![阅读界面](https://github.com/user-attachments/assets/f3a2db4c-c4d2-48dc-a006-40811277c2a0)

### 阅读界面(每页读三行)
![阅读界面](https://github.com/user-attachments/assets/3287b1c7-25dc-4de8-ac0e-56eb9101887d)

### 设置界面
![设置界面](https://github.com/user-attachments/assets/1ed4cefc-70db-4671-8cb5-eea8211d957b)


## 功能特性

- 支持 txt 和 epub 格式的本地小说阅读
- 自动保存阅读进度，可以继续上次阅读位置
- 支持上下翻页快捷键操作
- 可自定义书籍目录
- 可配置每页显示行数
- 支持自定义阅读字体大小
- 支持自定义阅读字体颜色
- 支持浅色/深色主题自适应
- epub 文件自动转换为 txt 格式

## 使用说明

直接在代码编辑区域鼠标右键，选择 workchill show settings 打开设置页面
![1736815976806](https://github.com/user-attachments/assets/cd38789a-7671-4e64-b1f2-d5db2ab8ded9)

或者通过命令的方式：
1. 按 `Ctrl + Shift + P` (mac 是 `Cmd + Shift + P`) 打开命令面板
2. 输入 `workchill show settings` 打开设置页面
   - 点击选择目录，选择一个书籍目录（默认插件根目录）
   - 可以设置每页显示行数
   - 可以设置阅读字体大小
   - 可以设置阅读字体颜色
   - 可以查看和管理书籍列表
3. 选择要阅读的书籍
   - 点击"开始阅读"从头开始
   - 点击"继续阅读"从上次位置继续
4. 在编辑器代码页面随便选中一行（使编辑器聚焦），按 Page Up/Page Down 键进行翻页阅读（注意不是上下箭头，是page up， page down）
5. 使用 End 键停止阅读


## 命令说明

| 命令 | 描述 | 快捷键 |
|------|------|--------|
| workchill show settings | 显示设置页面 | 无 |
| workchill next line | 下一页 | Page Down |
| workchill previous line | 上一页 | Page Up |
| workchill start reading | 开始阅读 | 无 |
| workchill stop reading | 停止阅读 | End |
| workchill select book folder | 选择书籍目录 | 无 |


## 配置项

| 配置项 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| workchill.bookFolder | string | "" | 书籍文件根目录 |
| workchill.linesPerPage | number | 1 | 每次显示的行数 |
| workchill.fontSize | number | 14 | 阅读文字大小(px) |
| workchill.fontColor | string | "#A8A8A8" | 阅读文字颜色 |


## 注意事项

1. epub 文件首次打开时会自动转换为同名的 txt 文件，实际阅读的是转换后的 txt 文件
2. 阅读进度会自动保存，重启 VSCode 后仍然有效
3. 字体颜色设置支持任何有效的 CSS 颜色值（如：#FF0000、rgb(255,0,0)等）
4. 字体大小建议设置在 8-72px 之间以获得最佳阅读体验

## 问题反馈

如果你在使用过程中遇到任何问题，或者有功能建议，欢迎在 GitHub 仓库提交 Issue：
[https://github.com/tong822218/workchill-reader-vscode-extensions](https://github.com/tong822218/workchill-reader-vscode-extensions)

weixin: tong822527
email: 327637616@qq.com


## License

MIT
