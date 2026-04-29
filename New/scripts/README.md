# 脚本目录说明

脚本按平台分目录维护，根目录脚本继续保留，方便旧流程使用。

## Windows

目录：

```text
scripts/windows/
```

启动：

```powershell
.\scripts\windows\一键启动.ps1
```

验收：

```powershell
.\scripts\windows\一键验收.ps1 -SkipScreenshots -NoPause
```

指定端口启动，适合 8787 已被旧服务占用时使用：

```powershell
.\一键启动.ps1 -Mode prod -DataMode local -Port 8877
```

真实账号启动：

```powershell
.\一键启动.ps1 -Mode prod -DataMode real -ApiBaseUrl "https://你的真实服务器地址" -Uid "真实UID" -Ig "你的IG"
```

双击启动：

```text
scripts/windows/一键启动.bat
```

## macOS

目录：

```text
scripts/macos/
```

启动：

```bash
bash scripts/macos/start-local.sh
```

验收：

```bash
bash scripts/macos/accept.sh --skip-screenshots --no-pause
```

指定端口：

```bash
bash scripts/macos/start-local.sh --mode prod --data local --port 8877
```

真实账号启动：

```bash
bash scripts/macos/start-local.sh --mode prod --data real --api-base-url "https://你的真实服务器地址" --uid "真实UID" --ig "你的IG"
```

如果要双击 `.command` 文件，需要先在 Mac 终端执行：

```bash
chmod +x scripts/macos/*.sh scripts/macos/*.command
```

然后可以双击：

```text
scripts/macos/一键启动.command
scripts/macos/一键验收.command
```

## 重要规则

- Windows 脚本使用 PowerShell。
- macOS 脚本使用 bash，并保持 LF 换行。
- Mac 脚本会把日志写到项目根目录 `logs/`。
- 启动脚本会检查 `/api/jackpot/slots` 和 7 日每日奖励，避免复用旧服务。
- 修改脚本后必须运行平台语法检查或对应一键验收。
