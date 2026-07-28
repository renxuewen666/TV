# 蜜蜂影视管理后台 - 部署指南

## 部署包下载

部署包: `https://3001-c15868fac9d34f56.monkeycode-ai.online/bee-tv-deploy.tar.gz`
(800KB, 包含构建产物和部署脚本)

## 部署步骤

### 1. 上传部署包到NAS

通过宝塔面板文件管理器:
- 打开宝塔面板 -> 网站 -> Bee-TV -> 文件管理
- 进入站点根目录 (如 `/www/wwwroot/Bee-TV`)
- 上传 `bee-tv-deploy.tar.gz`
- 解压: `tar xzf bee-tv-deploy.tar.gz`

### 2. 确认Node.js环境

```bash
node -v   # 需要 v18+
npm -v
```

Synology NAS安装方式: 套件中心 -> Node.js v18/v20

### 3. 安装依赖并初始化

```bash
cd /www/wwwroot/Bee-TV
npm install --production
npx prisma db push
```

### 4. 配置宝塔反向代理

宝塔面板 -> 网站 -> Bee-TV -> 设置 -> 反向代理:
```
目标URL: http://127.0.0.1:3001
发送域名: $host
```

这样 `mf.xuewen.plus:7443` 的请求会被转发到 Node.js 的 3001 端口。

### 5. 启动服务

```bash
npm install -g pm2
pm2 start dist/src/main.js --name bee-tv-admin
pm2 save
pm2 startup   # 设置开机自启
```

### 6. 验证

访问 `http://mf.xuewen.plus:7443`
- 默认账号: `admin`
- 默认密码: `admin123`

## 环境变量 (.env)

```
PORT=3001
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=bee-tv-prod-secret-2026
JWT_EXPIRES_IN=7d
```

生产环境建议修改 `JWT_SECRET` 为随机字符串。

## 更新部署

每次代码更新后:
```bash
cd /www/wwwroot/Bee-TV
pm2 stop bee-tv-admin
# 上传新的 dist/ 和 web/dist/
npm install --production   # 如有新增依赖
npx prisma db push         # 如有数据库变更
pm2 start bee-tv-admin
```
