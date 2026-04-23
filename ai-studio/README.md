# AI 创意工作室 - 部署文档

## 环境要求

- Ubuntu 20.04+ / Debian 11+
- Node.js 18+
- Nginx（推荐）
- 2核4G 内存以上（推荐 4核8G）

> **数据库**：本项目使用 SQLite，无需额外安装数据库服务，数据库文件存储在项目目录中。

---

## 一、安装基础环境

### 1.1 安装 Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 1.2 安装 Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 1.3 安装 PM2（进程管理）

```bash
sudo npm install -g pm2
```

---

## 二、配置数据库

### 2.1 初始化表结构

```bash
cd /home/ubuntu/ai-studio
npx prisma db push
```

> SQLite 使用 `npx prisma db push` 即可自动创建数据库文件（`prisma/dev.db`）并同步表结构，无需手动创建数据库。

### 2.2 导入预设数据（管理员账户 + 智能体）

```bash
npx tsx prisma/seed.ts
```

默认管理员账户：
- 邮箱：`admin@admin.com`
- 密码：`123456`

---

## 三、配置环境变量

编辑 `.env` 文件：

```bash
cd /home/ubuntu/ai-studio
nano .env
```

```env
# 数据库连接（SQLite，数据库文件存储在 prisma/dev.db）
DATABASE_URL="file:./dev.db"

# NextAuth 配置（必须和实际访问地址一致）
NEXTAUTH_URL="http://43.164.135.160:5050"
NEXTAUTH_SECRET="b766292bd50ceec70dd64887148ce037172046cbcdec56896a19fa3082a73aa9"

# Google Gemini API Key（图片生成）
GOOGLE_GENAI_API_KEY="你的Gemini API Key"

# 阿里云 DashScope API Key（视频生成）
DASHSCOPE_API_KEY="你的DashScope API Key"

# OpenRouter API Key（Image2 模型图片生成）
OPENROUTER_API_KEY="你的OpenRouter API Key"

# Next.js 只监听本地（配合 Nginx 使用）
HOSTNAME="127.0.0.1"
PORT="3000"
```

> **重要**：`NEXTAUTH_URL` 必须和你实际访问的地址完全一致，否则登录会失败。

---

## 四、构建和启动

### 4.1 安装依赖

```bash
cd /home/ubuntu/ai-studio
npm install
```

### 4.2 构建

```bash
npm run build
```

构建脚本会自动将静态文件复制到 standalone 目录，无需手动操作。

### 4.3 使用 PM2 启动

```bash
pm2 start npm --name "ai-studio" -- start
pm2 startup
pm2 save
```

### 4.4 常用 PM2 命令

```bash
pm2 logs ai-studio    # 查看日志
pm2 restart ai-studio # 重启
pm2 stop ai-studio    # 停止
pm2 monit             # 监控
```

---

## 五、配置 Nginx（推荐）

### 5.1 复制配置文件

```bash
sudo cp /home/ubuntu/ai-studio/nginx.conf /etc/nginx/sites-available/ai-studio
sudo ln -sf /etc/nginx/sites-available/ai-studio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 5.2 测试并重启

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 5.3 Nginx 配置说明

- 监听端口：**5050**
- 静态文件（`/_next/static/`、`/outputs/`、`/agents/`）由 Nginx 直接返回，不经过 Node.js
- 其他请求转发到 `127.0.0.1:3000`
- 开启了 Gzip 压缩和长缓存

---

## 六、防火墙配置

```bash
# 开放 Web 端口
sudo ufw allow 5050/tcp

# 开放 SSH（建议限制为你的固定 IP）
sudo ufw allow from 你的IP to any port 22

# 关闭 Next.js 直连端口（通过 Nginx 访问即可）
sudo ufw deny 3000/tcp

# 启用防火墙
sudo ufw enable
sudo ufw status
```

---

## 七、更新部署

每次修改代码后：

```bash
cd /home/ubuntu/ai-studio

# 1. 上传新代码覆盖（或 git pull）

# 2. 安装新依赖（如果有）
npm install

# 3. 重新构建
npm run build

# 4. 重启服务
pm2 restart ai-studio
```

如果修改了数据库结构（`prisma/schema.prisma`），还需要：

```bash
npx prisma db push
```

---

## 八、性能优化（2核4G 服务器）

### 8.1 添加 Swap

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 8.2 限制 Node.js 内存

在 `.env` 中已通过 `HOSTNAME=127.0.0.1` 让 Next.js 只监听本地。

---

## 九、数据库备份

本项目使用 SQLite，数据库文件为 `prisma/dev.db`。备份非常简单，直接复制文件即可：

### 9.1 手动备份

```bash
# 创建备份目录
mkdir -p /home/ubuntu/backups

# 复制数据库文件（带时间戳）
cp /home/ubuntu/ai-studio/prisma/dev.db "/home/ubuntu/backups/dev.db.$(date +%Y%m%d_%H%M%S)"
```

### 9.2 自动备份（定时任务）

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 3 点自动备份
0 3 * * * mkdir -p /home/ubuntu/backups && cp /home/ubuntu/ai-studio/prisma/dev.db "/home/ubuntu/backups/dev.db.$(date +\%Y\%m\%d_\%H\%M\%S)"
```

### 9.3 数据恢复

```bash
# 停止服务
pm2 stop ai-studio

# 恢复数据库文件
cp /home/ubuntu/backups/dev.db.20260401_030000 /home/ubuntu/ai-studio/prisma/dev.db

# 重启服务
pm2 start ai-studio
```

> **注意**：恢复数据库前请确保已停止 Node.js 服务，避免写入冲突。

---

## 十、积分系统说明

### 10.1 积分规则

| 功能 | 积分消耗 | 说明 |
|------|---------|------|
| 图片生成 (Flash) | 1 积分/张 | 快速生成 |
| 图片生成 (Pro) | 3 积分/张 | 高清质量 |
| 图片生成 (Image2) | 50 积分/张 | 超清质量，需 OpenRouter API |
| 图片局部重绘 | 2 积分/次 | 编辑功能 |
| 进阶设计 | 3 积分/次 | 建筑渲染 |
| 视频生成 | 50 积分/秒 | 按生成时长扣费 |

### 10.2 积分扣减流程

1. 用户提交生成请求时前端校验积分
2. 后端使用 Prisma 事务原子性扣减积分
3. 生成失败时自动回滚积分
4. 所有积分变动记录在 `CreditLog` 表

### 10.3 用户积分查询

用户积分显示在页面右上角 Header 区域，实时从数据库同步。

---

## 十一、常见问题

### Q: 页面 CSS 加载不出来

确认是否执行了 `npm run build`（build 脚本会自动复制静态文件到 standalone 目录）。

### Q: 登录失败 / 登录后跳转错误

检查 `.env` 中 `NEXTAUTH_URL` 是否和实际访问地址完全一致。

### Q: 图片生成不工作

1. 确认 `.env` 中 `GOOGLE_GENAI_API_KEY` 配置了有效的 API Key
2. 确认服务器能访问 Google API（某些地区需要代理）

### Q: 视频生成不工作

确认 `.env` 中 `DASHSCOPE_API_KEY` 配置了有效的阿里云 DashScope API Key。

### Q: Image2 模型不工作

1. 确认 `.env` 中 `OPENROUTER_API_KEY` 配置了有效的 API Key
2. Image2 使用 OpenRouter API 调用 GPT-5.4-image-2 模型

### Q: 内存不足 OOM

参考 [第八节：性能优化](#八性能优化2核4g-服务器)，添加 Swap。

### Q: 修改代码后需要重启吗

- 生产模式（`npm start`）：需要 `npm run build && pm2 restart ai-studio`
- 开发模式（`npm run dev`）：不需要，自动热更新

### Q: 数据库文件在哪里

SQLite 数据库文件位于 `prisma/dev.db`。可以直接复制该文件进行备份或迁移。

### Q: 积分显示为 100 不变

这是旧代码的 bug，请确保已更新到最新代码并重新构建。

---

## 十二、项目结构

```
ai-studio/
├── prisma/
│   ├── schema.prisma      # 数据库模型
│   ├── dev.db             # SQLite 数据库文件
│   └── seed.ts            # 初始化数据
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (main)/        # 已登录页面组
│   │   │   ├── generate/  # 生成功能页面
│   │   │   └── gallery/   # 作品展示页面
│   │   └── api/           # API 路由
│   │       ├── auth/      # 认证相关 API
│   │       ├── credits/   # 积分相关 API
│   │       └── generate/  # 生成任务 API
│   ├── components/        # React 组件
│   ├── services/          # 业务逻辑服务
│   │   ├── auth.service.ts
│   │   ├── credit.service.ts
│   │   └── generation.service.ts
│   ├── stores/            # Zustand 状态管理
│   └── lib/               # 工具函数
├── public/
│   ├── outputs/           # 生成的文件存储
│   └── uploads/           # 用户上传文件
├── nginx.conf             # Nginx 配置
└── .env                   # 环境变量
```

---

## 十三、API 接口一览

### 认证相关
- `POST /api/auth/[...nextauth]` - NextAuth 认证

### 积分相关
- `GET /api/credits/balance` - 获取用户积分余额

### 生成任务
- `POST /api/generate/image` - 图片生成
- `POST /api/generate/inpaint` - 图片局部重绘
- `POST /api/generate/video` - 视频生成
- `GET /api/generate/history` - 获取生成历史
- `DELETE /api/generate/[id]` - 删除生成记录

### 作品管理
- `GET /api/gallery` - 获取作品列表
- `POST /api/generate/favorite` - 收藏/取消收藏
