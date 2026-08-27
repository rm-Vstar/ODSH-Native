# CUA 桌面执行

ODSH-Native 通过 cua-driver（trycua/cua）本地运行桌面/视觉，经 odsh.cua 工具。无 SSH 隧道、不抢焦点（同一宿主机）。

## 启用
- 安装 cua-driver（见 github.com/trycua/cua）：Windows PowerShell / macOS-Linux curl。
- 若二进制不在 PATH，在 .env 设 CUA_DRIVER。

## 工具
- odsh.cua —— list-tools / screenshot / click / browser / CDP，后台且 focus-safe。

## 安全
- 工具名白名单（runtime/cua.mjs）。
- 仅本地宿主运行；配置由操作者提供。