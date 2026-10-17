# ODSH-Native 产品方向

当前交付为 OpenClaw 原生工具插件，提供本地命令、桌面操作、截图/OCR、worker 派发与可选单进程桌面租约。

- 当前结构及能力边界见[架构](docs/ARCHITECTURE-v2.md)。
- 使用前提与安装见[快速开始](docs/QUICKSTART.zh.md)。
- 后续工作见[路线图](ROADMAP.md)。

DSH 风格插件发现通过独立注册表提供；常驻 watcher/scheduler 为显式调用的库能力。上下文隔离由宿主 OpenClaw 的执行语义决定。桌面支持与焦点行为取决于所用后端及命令。
