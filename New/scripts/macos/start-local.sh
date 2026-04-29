#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT"

MODE=""
DATA_MODE=""
API_BASE_URL=""
UID_VALUE=""
ROOM=""
ROOM_TYPE=""
IG=""
PORT_VALUE="8787"
NO_OPEN="0"
NO_PAUSE="0"

print_step() { printf '\n==== %s ====\n' "$1"; }
pause_end() { if [ "$NO_PAUSE" != "1" ]; then read -r -p "按回车键关闭窗口" _; fi; }
fail() { printf '\n启动失败：%s\n' "$1" >&2; pause_end; exit 1; }
urlencode() { node -e "process.stdout.write(encodeURIComponent(process.argv[1] || ''))" "$1"; }
port_pid() { lsof -tiTCP:"$1" -sTCP:LISTEN 2>/dev/null | head -n 1 || true; }
is_port_open() { [ -n "$(port_pid "$1")" ]; }

is_cocogames_service() {
  local base="http://127.0.0.1:$PORT_VALUE"
  curl -fsS --max-time 2 "$base/api/health" >/dev/null 2>&1 || return 1
  curl -fsS --max-time 2 "$base/api/admin/snapshot" >/dev/null 2>&1 || return 1
  curl -fsS --max-time 2 "$base/api/jackpot/slots" >/dev/null 2>&1 || return 1
  local count
  count="$(curl -fsS --max-time 2 "$base/api/daily-rewards" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);process.stdout.write(String((j.dailyRewards||[]).length));})" 2>/dev/null || echo 0)"
  [ "$count" = "7" ]
}

ensure_backend_port() {
  if ! is_port_open "$PORT_VALUE"; then return; fi
  if is_cocogames_service; then echo "端口 $PORT_VALUE 已经运行当前 cocogames 服务，将复用该服务。"; return; fi
  echo "端口 $PORT_VALUE 已被旧服务或其它程序占用，当前项目接口不完整。"
  if [ "$NO_PAUSE" = "1" ]; then
    echo "无人值守模式：关闭旧服务并重新启动当前项目。"
    kill -9 "$(port_pid "$PORT_VALUE")" || true
    sleep 1
    return
  fi
  read -r -p "是否关闭占用 $PORT_VALUE 的旧服务并重新启动？输入 Y 确认，直接回车取消：" answer
  if [ "$answer" = "Y" ] || [ "$answer" = "y" ]; then kill -9 "$(port_pid "$PORT_VALUE")" || true; sleep 1; else fail "端口 $PORT_VALUE 被占用。"; fi
}

add_query_param() { local name="$1"; local value="$2"; if [ -n "$value" ]; then QUERY_PARTS+=("$name=$(urlencode "$value")"); fi; }
build_open_url() {
  local base="$1"
  QUERY_PARTS=()
  if [ "$DATA_MODE" = "real" ]; then
    add_query_param "server" "real"; add_query_param "preferRemote" "1"; add_query_param "apiBaseUrl" "$API_BASE_URL"; add_query_param "uid" "$UID_VALUE"; add_query_param "room" "$ROOM"; add_query_param "roomType" "$ROOM_TYPE"; add_query_param "ig" "$IG"
  else
    add_query_param "server" "local"
  fi
  if [ "${#QUERY_PARTS[@]}" -eq 0 ]; then printf '%s' "$base"; else local joined; joined="$(IFS='&'; echo "${QUERY_PARTS[*]}")"; printf '%s/?%s' "$base" "$joined"; fi
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --mode|-m) MODE="${2:-}"; shift 2 ;;
    --data|--data-mode|-d) DATA_MODE="${2:-}"; shift 2 ;;
    --api-base-url|--api) API_BASE_URL="${2:-}"; shift 2 ;;
    --uid) UID_VALUE="${2:-}"; shift 2 ;;
    --room) ROOM="${2:-}"; shift 2 ;;
    --room-type|--roomType) ROOM_TYPE="${2:-}"; shift 2 ;;
    --ig) IG="${2:-}"; shift 2 ;;
    --port) PORT_VALUE="${2:-8787}"; shift 2 ;;
    --no-open) NO_OPEN="1"; shift ;;
    --no-pause) NO_PAUSE="1"; shift ;;
    *) fail "未知参数：$1" ;;
  esac
done

print_step "cocogames Mac 一键启动脚本"
echo "项目目录：$ROOT"
if [ -z "$MODE" ]; then
  echo "请选择启动模式：1. 开发模式  2. 生产模式"
  read -r -p "请输入 1 或 2，直接回车默认 1：" mode_choice
  if [ "$mode_choice" = "2" ]; then MODE="prod"; else MODE="dev"; fi
fi
[ "$MODE" = "dev" ] || [ "$MODE" = "prod" ] || fail "启动模式只能是 dev 或 prod。"
command -v node >/dev/null 2>&1 || fail "没有找到 Node.js，请先安装 Node.js 20.19 或更高版本。"
command -v npm >/dev/null 2>&1 || fail "没有找到 npm。"

if [ -z "$DATA_MODE" ]; then
  echo "请选择数据模式：1. 本地模拟数据  2. 真实服务器账号"
  read -r -p "请输入 1 或 2，直接回车默认 1：" data_choice
  if [ "$data_choice" = "2" ]; then DATA_MODE="real"; else DATA_MODE="local"; fi
fi
[ "$DATA_MODE" = "local" ] || [ "$DATA_MODE" = "real" ] || fail "数据模式只能是 local 或 real。"

if [ "$DATA_MODE" = "real" ]; then
  if [ -z "$API_BASE_URL" ]; then read -r -p "请输入真实服务器 API 地址：" API_BASE_URL; [ -n "$API_BASE_URL" ] || fail "真实服务器模式必须填写 API 地址。"; fi
  if [ -z "$UID_VALUE" ]; then read -r -p "请输入真实账号 uid：" UID_VALUE; [ -n "$UID_VALUE" ] || fail "真实服务器模式必须填写 uid。"; fi
  if [ -z "$ROOM" ]; then read -r -p "请输入 room，可直接回车为空：" ROOM; fi
  if [ -z "$ROOM_TYPE" ]; then read -r -p "请输入 roomType/type，可直接回车为空：" ROOM_TYPE; fi
  if [ -z "$IG" ]; then read -r -p "请输入 ig，若服务器不需要可直接回车为空：" IG; fi
  export VITE_PREFER_REMOTE="1" VITE_API_BASE_URL="$API_BASE_URL" VITE_TEST_UID="$UID_VALUE" VITE_ROOM="$ROOM" VITE_ROOM_TYPE="$ROOM_TYPE" VITE_IG="$IG"
else
  print_step "本地模拟数据模式"
  echo "使用本地 Node 后端和 server/mockData.js 数据。"
fi

if [ ! -d "$ROOT/node_modules" ]; then print_step "首次启动，正在安装依赖"; npm install || fail "npm install 失败。"; fi
mkdir -p "$ROOT/logs"

if [ "$MODE" = "prod" ]; then
  print_step "生产模式：构建前端并启动一体化服务"
  npm run build || fail "npm run build 失败。"
  ensure_backend_port
  if is_port_open "$PORT_VALUE"; then echo "服务已经在运行，不重复启动。"; else PORT="$PORT_VALUE" nohup npm start > "$ROOT/logs/mac-prod.log" 2>&1 & sleep 2; fi
  OPEN_URL="$(build_open_url "http://127.0.0.1:$PORT_VALUE")"
  [ "$NO_OPEN" = "1" ] || open "$OPEN_URL"
  echo "生产访问地址：$OPEN_URL"
else
  print_step "开发模式：分别启动后端和前端"
  ensure_backend_port
  if is_port_open "$PORT_VALUE"; then echo "后端端口 $PORT_VALUE 已经运行，跳过后端启动。"; else PORT="$PORT_VALUE" nohup npm run dev:server > "$ROOT/logs/mac-backend.log" 2>&1 & echo "已启动后端：http://127.0.0.1:$PORT_VALUE"; fi
  if is_port_open 5173; then echo "前端端口 5173 已经运行，跳过前端启动。"; else nohup npm run dev -- --host 0.0.0.0 > "$ROOT/logs/mac-frontend.log" 2>&1 & echo "已启动前端：http://localhost:5173"; fi
  sleep 3
  OPEN_URL="$(build_open_url "http://localhost:5173")"
  [ "$NO_OPEN" = "1" ] || open "$OPEN_URL"
  echo "前端地址：$OPEN_URL"
  echo "后端地址：http://127.0.0.1:$PORT_VALUE"
fi
pause_end
