#!/bin/bash
set -e
echo "=== 蜜蜂影视管理后台 部署 ==="
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "${DEPLOY_DIR}"

if ! command -v node &> /dev/null; then
  echo "[错误] Node.js 未安装"
  echo "  Synology: 套件中心 -> 安装 Node.js v18+"
  exit 1
fi
echo "Node.js $(node -v) / npm $(npm -v)"

echo "[1/4] 安装依赖..."
npm install --production 2>&1 | tail -3

echo "[2/4] 初始化数据库..."
npx prisma db push 2>&1

echo "[3/4] 配置反向代理..."
cat << 'NGINX'
请在宝塔面板网站设置中添加反向代理:
  目标URL: http://127.0.0.1:3001
  发送域名: $host
  代理: 全部
NGINX

echo ""
echo "[4/4] 启动服务..."
if command -v pm2 &> /dev/null; then
  pm2 delete bee-tv-admin 2>/dev/null || true
  pm2 start dist/src/main.js --name bee-tv-admin --env production
  pm2 save
  pm2 status
else
  echo "PM2 未安装, 请执行: npm install -g pm2"
  echo "然后: pm2 start dist/src/main.js --name bee-tv-admin"
  nohup node dist/src/main.js > bee-tv.log 2>&1 &
  echo "PID: $!"
fi

echo ""
echo "部署完成. 默认账号: admin / admin123"
