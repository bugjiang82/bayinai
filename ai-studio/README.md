# AI 创意工作室 - 部署文档

## 环境要求

- Ubuntu 20.04+ / Debian 11+
- Node.js 20+
- MySQL 8.0+
- Nginx（推荐）
- 2核4G 内存以上（推荐 4核8G）

> **数据库**：本项目使用 MySQL 8.0，需要提前安装并创建数据库。数据库迁移方案参考 [数据库迁移.md](./数据库迁移.md)。

---

## 一、安装基础环境

### 1.1 安装 Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 1.2 安装 MySQL 8.0

```bash
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo mysql_secure_installation
```

创建数据库和用户：

```sql
CREATE DATABASE ai_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ai_studio'@'localhost' IDENTIFIED BY 'ai_studio_2024';
GRANT ALL PRIVILEGES ON ai_studio.* TO 'ai_studio'@'localhost';
FLUSH PRIVILEGES;
```

### 1.3 安装 Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 1.4 安装 PM2（进程管理）

```bash
sudo npm install -g pm2
```

---

## 二、克隆代码

```bash
git clone <仓库地址> /home/ubuntu/bayinai/ai-studio
cd /home/ubuntu/bayinai/ai-studio
npm install
```

---

## 三、配置环境变量

编辑 `.env` 文件：

```bash
nano .env
```

```env
# 数据库连接（MySQL 8.0）
DATABASE_URL="mysql://ai_studio:ai_studio_2024@localhost:3306/ai_studio"

# NextAuth 配置（必须和实际访问地址一致）
NEXTAUTH_URL="http://你的服务器IP或域名:5050"
NEXTAUTH_SECRET="自定义一个随机字符串，至少 32 位"

# Google Gemini API Key（图片生成 — Flash / Pro 模型）
GOOGLE_GENAI_API_KEY="你的Gemini API Key"

# 阿里云 DashScope API Key（视频生成 — 万相 2.2 / 2.7 / HappyHorse）
DASHSCOPE_API_KEY="你的DashScope API Key"

# OpenRouter API Key（Image2 模型图片生成）
OPENROUTER_API_KEY="你的OpenRouter API Key"

# OpenAI API Key（Image2 模型备选）
OPENAI="你的OpenAI API Key"

# 火山引擎 Ark API Key（Seedance 1.5 Pro 视频生成）
ARK_API_KEY="你的Ark API Key"

# Next.js 监听配置（配合 Nginx 使用）
HOSTNAME="127.0.0.1"
PORT="3000"
```

> **重要**：`NEXTAUTH_URL` 必须和你实际访问的地址完全一致（协议、域名/IP、端口），否则登录会失败。

| 环境变量 | 用途 | 对应模型 |
|---------|------|---------|
| `GOOGLE_GENAI_API_KEY` | 图片生成 | Gemini 3 Flash / Pro / Flash Image |
| `DASHSCOPE_API_KEY` | 视频生成 | 万相 2.2 / 2.7（文生/图生）、HappyHorse |
| `OPENROUTER_API_KEY` | 超清图片生成 | Image2（GPT-5.4-image-2） |
| `OPENAI` | Image2 备选 | 同上 |
| `ARK_API_KEY` | 视频生成 | Seedance 1.5 Pro（文生/图生） |

---

## 四、初始化数据库

### 4.1 同步表结构

```bash
npx prisma db push
```

### 4.2 导入预设数据（管理员账户 + 智能体 + 积分策略）

```bash
npx prisma db seed
npx tsx prisma/seed-credit-policies.ts
```

默认管理员账户：
- 邮箱：`admin@admin.com`
- 密码：`123456`

---

## 五、构建和启动

### 5.1 构建

```bash
npm run build
```

构建脚本会自动：
1. 执行 Next.js 构建
2. 将 `public/` 目录复制到 `.next/standalone/public/`
3. 创建 `outputs/` 和 `uploads/` 的符号链接（避免每次构建时复制大量图片文件）

### 5.2 使用 PM2 启动

```bash
pm2 start npm --name "ai-studio" -- start
pm2 startup
pm2 save
```

Next.js 将在 `127.0.0.1:3000` 启动，通过 Nginx 反向代理对外提供 `:5050` 端口服务。

### 5.3 常用 PM2 命令

```bash
pm2 logs ai-studio    # 查看日志
pm2 restart ai-studio # 重启
pm2 stop ai-studio    # 停止
pm2 monit             # 监控
```

---

## 六、配置 Nginx（推荐）

### 6.1 复制配置文件

```bash
sudo cp /home/ubuntu/bayinai/ai-studio/nginx.conf /etc/nginx/sites-available/ai-studio
sudo ln -sf /etc/nginx/sites-available/ai-studio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 6.2 修改服务器域名/IP

编辑 `/etc/nginx/sites-available/ai-studio`，将 `server_name` 改为你的实际域名或 IP：

```nginx
server_name 你的IP 你的域名;
```

### 6.3 测试并重启

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 6.4 Nginx 配置说明

- **监听端口**：`5050`
- **`/outputs/`**：由 Nginx 直接提供静态文件（`alias` 到 `public/outputs/`），支持用户生成的图片
- **`/agents/`**：智能体头像，Nginx 直接提供
- **其他请求**：全部转发到 `127.0.0.1:3000`（Next.js），已配置 WebSocket 支持、Cookie 转发和长超时
- **Gzip**：已开启压缩
- **上传限制**：`client_max_body_size 50m`

---

## 七、防火墙配置

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

## 八、更新部署

每次修改代码后：

```bash
cd /home/ubuntu/ai-studio

# 1. 拉取最新代码
git pull

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

## 九、性能优化（2核4G 服务器）

### 9.1 添加 Swap

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 9.2 限制 Node.js 内存

Next.js 已通过 `.env` 中 `HOSTNAME=127.0.0.1` 只监听本地，不对外暴露。

---

## 十、数据库备份（MySQL）

### 10.1 手动备份

```bash
mkdir -p /home/ubuntu/backups
mysqldump -u ai_studio -p ai_studio > "/home/ubuntu/backups/ai_studio_$(date +%Y%m%d_%H%M%S).sql"
```

### 10.2 自动备份（定时任务）

```bash
crontab -e

# 添加每天凌晨 3 点自动备份
0 3 * * * mkdir -p /home/ubuntu/backups && mysqldump -u ai_studio -p'ai_studio_2024' ai_studio > "/home/ubuntu/backups/ai_studio_$(date +\%Y\%m\%d_\%H\%M\%S).sql"
```

### 10.3 数据恢复

```bash
# 停止服务
pm2 stop ai-studio

# 恢复数据库
mysql -u ai_studio -p ai_studio < /home/ubuntu/backups/ai_studio_20260401_030000.sql

# 重启服务
pm2 start ai-studio
```

---

## 十一、积分系统说明

### 11.1 图片生成积分

| 模型 | 分辨率 | 积分消耗 |
|------|--------|---------|
| Flash | 1K | 1 积分/张 |
| Pro | 1K / 2K / 4K | 3/5/11 积分/张 |
| Image2 | 1K / 2K / 4K | 50/80/120 积分/张 |

### 11.2 视频生成积分（按秒计费）

| 模型 | 分辨率 | 积分消耗 |
|------|--------|---------|
| 万相 2.2 | 480P / 720P / 1080P | 20/35/55 积分/秒 |
| 万相 2.7 (图生) | 720P / 1080P | 60/90 积分/秒 |
| 万相 2.7 (文生) | 720P / 1080P | 40/60 积分/秒 |
| HappyHorse (文生) | 720P / 1080P | 35/55 积分/秒 |
| HappyHorse (图生) | 720P / 1080P | 35/55 积分/秒 |
| Seedance 1.5 Pro | 480P / 720P / 1080P | 30/50/80 积分/秒 |

### 11.3 其他功能积分

| 功能 | 积分消耗 |
|------|---------|
| 图片局部重绘 | 2 积分/次 |
| 进阶设计（建筑渲染） | 3 积分/次 |
| 扩图 | 2 积分/次 |

### 11.4 积分扣减流程

1. 用户提交生成请求时前端校验积分
2. 后端使用 Prisma 事务原子性扣减积分
3. 生成失败时自动回滚积分
4. 所有积分变动记录在 `CreditLog` 表

---

## 十二、常见问题

### Q: 页面 CSS 加载不出来

确认是否执行了 `npm run build`（build 脚本会自动复制静态文件到 standalone 目录）。

### Q: 登录失败 / 登录后跳转错误

检查 `.env` 中 `NEXTAUTH_URL` 是否和实际访问地址完全一致。

### Q: 图片生成后无法显示（404）

**根本原因**：Next.js 生产模式（`next start`）在启动时会枚举并缓存 `public/` 目录的文件列表，此后运行时新增的图片文件不会被静态文件服务识别，即使文件确实保存在正确路径下，浏览器访问时也会返回 404。

**解决方案**：本项目已通过以下方式解决：
1. `next.config.ts` 中配置了 rewrite 规则：`/outputs/:path*` → `/api/outputs/:path*`
2. `/api/outputs/[...path]/route.ts` 动态 API 路由，直接从文件系统读取并返回图片（支持 jpeg/png/webp/gif/mp4 等格式）

这套方案对前端完全透明，无需修改数据库中的 `outputUrl` 字段。确保代码为最新版本即可。

### Q: 图片生成不工作

1. 确认 `.env` 中 `GOOGLE_GENAI_API_KEY` 配置了有效的 API Key
2. 确认服务器能访问 Google API（需要代理的话请在服务器上配置 `https_proxy` 环境变量）

### Q: 视频生成不工作

- 万相/HappyHorse：确认 `DASHSCOPE_API_KEY` 有效
- Seedance：确认 `ARK_API_KEY` 有效

### Q: Image2 模型不工作

1. 确认 `OPENROUTER_API_KEY` 或 `OPENAI` 配置了有效的 API Key
2. Image2 使用 OpenRouter API 调用 GPT-5.4-image-2 模型

### Q: 内存不足 OOM

参考 [第九节：性能优化](#九性能优化2核4g-服务器)，添加 Swap。

### Q: 修改代码后需要重启吗

- 生产模式（`npm start`）：需要 `npm run build && pm2 restart ai-studio`
- 开发模式（`npm run dev`）：不需要，自动热更新

### Q: MySQL 连接失败

1. 确认 MySQL 服务已启动：`sudo systemctl status mysql`
2. 确认数据库和用户已正确创建
3. 检查 `.env` 中 `DATABASE_URL` 格式是否正确

### Q: 如何从 SQLite 迁移到 MySQL

参考项目中的 [数据库迁移.md](./数据库迁移.md) 文档。

---

## 十三、项目结构

```
ai-studio/
├── prisma/
│   ├── schema.prisma          # 数据库模型（MySQL）
│   ├── seed.ts                # 初始化数据（管理员 + 智能体）
│   └── seed-credit-policies.ts # 积分策略初始化
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (main)/            # 已登录页面组
│   │   │   ├── dashboard/     # 仪表盘
│   │   │   ├── gallery/       # 作品画廊
│   │   │   ├── generate/      # 生成功能页
│   │   │   │   ├── text-to-image/  # 文生图
│   │   │   │   ├── image-to-image/ # 图生图
│   │   │   │   ├── image/          # 统一图片生成
│   │   │   │   ├── edit/           # 图片编辑（局部重绘 + 扩图）
│   │   │   │   ├── video/          # 视频生成
│   │   │   │   └── architecture/   # 建筑渲染
│   │   │   ├── agents/        # AI 智能体
│   │   │   ├── credits/       # 积分管理
│   │   │   ├── templates/     # 提示词模板
│   │   │   ├── team/          # 团队管理
│   │   │   ├── profile/       # 个人主页
│   │   │   └── settings/      # 设置
│   │   ├── workflow/          # 工作流画布
│   │   ├── workflow/workspace/  # 工作空间
│   │   ├── admin/             # 管理后台
│   │   ├── login/             # 登录页
│   │   ├── register/          # 注册页
│   │   └── api/               # API 路由（47 个接口）
│   │       ├── auth/          # 认证（NextAuth）
│   │       ├── credits/       # 积分（余额/计算/日志/策略/充值/转账）
│   │       ├── generate/      # 生成任务（图片/视频/局部重绘/扩图/收藏/历史）
│   │       ├── gallery/       # 作品管理
│   │       ├── outputs/       # 输出文件动态服务
│   │       ├── workflow/      # 工作流（图片/视频/文本生成/项目管理）
│   │       ├── agents/        # 智能体管理
│   │       ├── team/          # 团队管理
│   │       ├── templates/     # 模板管理
│   │       ├── admin/         # 管理接口
│   │       ├── upload/        # 文件上传
│   │       ├── cron/          # 定时任务（清理）
│   │       └── ai-orchestrator/ # AI 编排器
│   ├── components/
│   │   └── workflow/          # 工作流画布组件（节点/服务/AI服务）
│   ├── services/              # 业务逻辑层
│   │   ├── generation.service.ts   # 生成服务（图片/视频/扩图/局部重绘）
│   │   ├── credit.service.ts       # 积分服务
│   │   ├── creditPolicy.service.ts # 积分策略服务
│   │   ├── agent.service.ts        # 智能体服务
│   │   ├── user.service.ts         # 用户服务
│   │   ├── team.service.ts         # 团队服务
│   │   ├── template.service.ts     # 模板服务
│   │   ├── file.service.ts         # 文件服务
│   │   ├── projectService.ts       # 项目管理服务
│   │   ├── cleanup.service.ts      # 清理服务
│   │   └── tasks/                  # 任务工厂模式
│   │       ├── BaseGenerateService.ts  # 基类（创建记录/保存图片/扣积分）
│   │       ├── TaskFactory.ts          # 任务工厂
│   │       ├── TextToImageTask.ts      # 文生图/图生图任务
│   │       ├── InpaintTask.ts          # 局部重绘任务
│   │       ├── AgentImageTask.ts       # AI 绘画大师任务
│   │       └── ArchitectureTask.ts     # 建筑设计任务
│   ├── models/                # 模型配置
│   │   ├── imageModels.ts     # 图片模型（Flash/Pro/Image2）
│   │   ├── videoModels.ts     # 视频模型（万相/HappyHorse/Seedance）
│   │   ├── creditRules.ts     # 积分规则
│   │   └── types.ts           # 类型定义
│   ├── stores/                # Zustand 状态管理
│   │   ├── generationStore.ts     # 生成状态
│   │   ├── canvasStore.ts         # 画布状态
│   │   ├── userStore.ts           # 用户状态
│   │   ├── agentStore.ts          # 智能体状态
│   │   └── aiOrchestratorStore.ts # AI 编排器状态
│   ├── lib/                   # 工具函数和基础设施
│   │   ├── prisma.ts          # Prisma 客户端
│   │   ├── auth.ts            # NextAuth 配置
│   │   ├── ai-apis.ts         # AI API 调用（Gemini/DashScope/Ark/OpenRouter）
│   │   └── utils.ts           # 通用工具
│   └── types/                 # 全局类型定义
├── public/
│   ├── outputs/               # 用户生成的图片/视频文件
│   ├── uploads/               # 用户上传文件
│   └── agents/                # 智能体头像
├── nginx.conf                 # Nginx 配置
├── next.config.ts             # Next.js 配置（rewrites 等）
├── .env                       # 环境变量
└── package.json
```

---

## 十四、技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 16.2.4 (App Router) |
| 语言 | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 + Radix UI |
| 状态管理 | Zustand 5 |
| 工作流画布 | @xyflow/react (React Flow) |
| 图片编辑 | Konva + react-konva |
| 动画 | Framer Motion |
| CSS | Tailwind CSS 4 + class-variance-authority |
| 数据库 ORM | Prisma 5 |
| 数据库 | MySQL 8.0 |
| 认证 | NextAuth v5 (Credentials Provider) |
| 图片处理 | Sharp |
| 缓存 | LRU Cache（内存） |
| 进程管理 | PM2 |
| 反向代理 | Nginx |
| 测试 | Vitest |
| API 模型调用 | Google Gemini SDK / OpenAI SDK / 阿里云 DashScope / OpenRouter / 火山引擎 Ark |

---

## 十五、API 接口一览

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/[...nextauth]` - NextAuth 认证

### 积分
- `GET /api/credits/balance` - 获取积分余额
- `POST /api/credits/calculate` - 计算生成消耗
- `GET /api/credits/logs` - 积分变动记录
- `GET /api/credits/policies` - 积分策略列表
- `POST /api/credits/recharge` - 积分充值（管理端）
- `POST /api/credits/transfer` - 积分转账

### 图片生成
- `POST /api/generate/image` - 文生图 / 图生图
- `POST /api/generate/inpaint` - 图片局部重绘
- `POST /api/generate/outpaint` - 图片扩图
- `POST /api/generate/agent-image` - AI 绘画大师
- `POST /api/generate/architecture` - 建筑渲染
- `POST /api/workflow/generate/image` - 工作流画布图片生成

### 视频生成
- `POST /api/generate/video` - 视频生成
- `POST /api/workflow/generate/video` - 工作流画布视频生成
- `GET /api/workflow/video/status` - 视频任务状态查询

### 作品管理
- `GET /api/gallery` - 作品列表（支持类型/时间/搜索/收藏筛选）
- `POST /api/gallery/[id]` - 收藏/取消收藏
- `DELETE /api/gallery/[id]` - 删除作品
- `GET /api/generate/history` - 生成历史
- `DELETE /api/generate/[id]` - 删除生成记录
- `POST /api/generate/favorite` - 收藏操作

### 文件服务
- `GET /api/outputs/[...path]` - 输出文件动态服务
- `POST /api/upload` - 文件上传

### 工作流
- `GET/POST /api/workflow/projects` - 项目列表/创建
- `GET/PUT/DELETE /api/workflow/projects/[id]` - 项目详情/更新/删除
- `POST /api/workflow/generate/text` - 文本生成
- `POST /api/workflow/generate/image` - 图片生成

### 其他
- `GET/POST /api/agents` - 智能体列表/创建
- `GET/PUT/DELETE /api/agents/[id]` - 智能体详情/更新/删除
- `POST /api/agents/[id]/chat` - 智能体对话
- `GET/POST /api/templates` - 模板管理
- `GET/POST /api/team` - 团队管理
- `POST /api/extract-prompt` - 提示词提取
- `GET /api/cron/cleanup` - 定时清理
- `POST /api/ai-orchestrator/decompose` - AI 编排器分解
- `POST /api/ai-orchestrator/execute` - AI 编排器执行
- `GET /api/user/profile` - 用户信息
- `PUT /api/user/password` - 修改密码
