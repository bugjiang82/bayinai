# Huabu - AI Canvas Studio

画布模式的 AI 图片生成和处理工具。

## 功能特点

- **画布编辑** - 直观拖拽式画布界面
- **AI 图片生成** - 文字描述生成图片
- **多图参考** - 多张参考图片结合文字描述生成
- **模板风格** - 预设风格模板快速应用
- **批量处理** - 批量 AI 图片生成任务

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端框架 | Vue 3 |
| 后端框架 | Node.js + Express |
| 数据库 | SQLite |
| AI 服务 | Google Gemini API |

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装部署

```bash
# 克隆仓库
git clone https://github.com/bugjiang82/huabu.git
cd huabu

# 安装后端依赖
cd server && npm install

# 安装前端依赖
cd ../client && npm install

# 构建前端
npm run build
```

### 配置

在 `server` 目录创建 `.env` 文件：

```env
PORT=3001
GEMINI_API_KEY=your-google-gemini-api-key
DB_PATH=./data/huabu.db
UPLOAD_DIR=./uploads
```

### 启动服务

```bash
# 启动后端 (3001端口)
cd server && npm start

# 前端已构建到 dist 目录，由后端托管
# 访问 http://localhost:3001
```

## 目录结构

```
huabu/
├── client/                 # Vue 3 前端
│   ├── src/
│   │   ├── components/    # Vue 组件
│   │   ├── views/         # 页面视图
│   │   ├── stores/        # 状态管理
│   │   ├── utils/         # 工具函数
│   │   └── App.vue
│   └── dist/              # 构建产物
├── server/                 # Node.js 后端
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── services/      # 业务逻辑
│   │   ├── db/            # 数据库
│   │   ├── middleware/     # 中间件
│   │   └── utils/         # 工具函数
│   └── index.js
└── README.md
```

## API 接口

### 画布操作

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/canvas/save` | POST | 保存画布状态 |
| `/api/canvas/load/:id` | GET | 加载画布 |
| `/api/canvas/list` | GET | 获取画布列表 |

### AI 生成

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/generate/image` | POST | 文字生成图片 |
| `/api/generate/from-template` | POST | 模板生成图片 |
| `/api/generate/from-images` | POST | 多图参考生成 |

### 模板

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/templates` | GET | 获取模板列表 |
| `/api/templates/:id` | GET | 获取模板详情 |

## 开发

```bash
# 后端开发 (热重载)
cd server && npm run dev

# 前端开发
cd client && npm run dev
```

## 许可证

MIT
