# Workchill Reader - VSCode Extension

一个用来上班摸鱼的vscode插件，支持txt,epub本地小说阅读，可以自动保存阅读进度，支持切换上下页。

## 功能特性

- 支持txt和epub格式的本地小说阅读
- 自动保存阅读进度
- 支持上下翻页
- 可自定义书籍目录
- 可配置每页显示行数

## 命令说明

| 命令 | 描述 | 快捷键 |
|------|------|--------|
| workchill select book folder | 选择书籍目录 | 无 |
| workchill next line | 下一页 | Page Down |
| workchill previous line | 上一页 | Page Up |
| workchill show settings | 显示设置 | 无 |
| workchill start reading | 开始阅读 | 无 |
| workchill stop reading | 停止阅读 | End |

## 配置项

| 配置项 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| workchill.bookFolder | string | "" | 书籍文件根目录 |
| workchill.linesPerPage | number | 1 | 每次可读几行 |

## 使用说明

1. 使用命令 `workchill select book folder` 选择包含txt/epub书籍的目录
2. 使用命令 `workchill start reading` 开始阅读
3. 使用 Page Up/Page Down 键进行翻页
4. 使用 End 键停止阅读

## Requirements



## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

## For more information


**Enjoy!**
