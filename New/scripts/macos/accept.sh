#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT"

BASE_URL="http://127.0.0.1:8787"
PORT_VALUE="8787"
SKIP_SCREENSHOTS="0"
NO_PAUSE="0"

print_step() { printf '\n==== %s ====\n' "$1"; }
pause_end() { if [ "$NO_PAUSE" != "1" ]; then read -r -p "按回车键关闭窗口" _; fi; }
fail() { printf '\n验收失败：%s\n' "$1" >&2; pause_end; exit 1; }
check_api() { local path="$1"; echo "检查：$path"; curl -fsS --max-time 8 "$BASE_URL$path" >/dev/null || fail "$path 请求失败。"; echo "通过：$path"; }

while [ "$#" -gt 0 ]; do
  case "$1" in
    --base-url|--base) BASE_URL="${2:-}"; shift 2 ;;
    --port) PORT_VALUE="${2:-8787}"; shift 2 ;;
    --skip-screenshots) SKIP_SCREENSHOTS="1"; shift ;;
    --no-pause) NO_PAUSE="1"; shift ;;
    *) fail "未知参数：$1" ;;
  esac
done

if [ "$PORT_VALUE" = "8787" ]; then PORT_VALUE="$(node -e "const u=new URL(process.argv[1]); process.stdout.write(String(u.port || 80));" "$BASE_URL" 2>/dev/null || echo 8787)"; fi
print_step "cocogames Mac 一键验收"
echo "项目目录：$ROOT"
echo "验收地址：$BASE_URL"
command -v node >/dev/null 2>&1 || fail "没有找到 Node.js。"
command -v npm >/dev/null 2>&1 || fail "没有找到 npm。"
echo "Node：$(node --version)"
echo "npm：$(npm --version)"
[ -d "$ROOT/node_modules" ] || npm install || fail "npm install 失败。"
print_step "代码检查"; npm run lint || fail "npm run lint 失败。"
print_step "构建检查"; npm run build || fail "npm run build 失败。"
print_step "启动或复用本地服务"; bash "$SCRIPT_DIR/start-local.sh" --mode prod --data local --port "$PORT_VALUE" --no-open --no-pause || fail "本地服务启动失败。"
print_step "接口检查"
for path in /api/health /api/lobby/bootstrap /api/games "/api/tournaments?status=upcoming" /api/tournaments/mega-ways /api/events/summer-splash /api/events/summer-splash/ranking /api/shop/products/c3 /api/jackpot/slots /api/daily-rewards /api/profile/vip /api/profile/history /api/profile/achievements /api/profile/wallet /api/admin/snapshot; do check_api "$path"; done
if [ "$SKIP_SCREENSHOTS" != "1" ]; then print_step "截图检查"; node "$ROOT/scripts/capture-screenshots.mjs" --base="$BASE_URL" --out="$ROOT/qa-screens" || fail "截图检查失败。"; else echo "已跳过截图检查。"; fi
print_step "验收完成"
echo "页面地址：$BASE_URL/?server=local"
echo "后台地址：$BASE_URL/?admin=1"
echo "真实账号地址示例：$BASE_URL/?server=real&preferRemote=1&apiBaseUrl=你的真实服务器地址URL编码&uid=真实UID&ig=你的IG"
pause_end
