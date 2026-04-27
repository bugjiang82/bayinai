# AI 创意工作室部署文档

## 1. 环境要求

- Node.js 18.0 或更高版本
- npm 9.0 或更高版本
- SQLite 数据库（默认内置）
- Google Gemini API 密钥（用于图像生成）
- OpenRouter API 密钥（可选，用于某些模型）

## 2. 安装步骤

### 2.1 克隆代码

```bash
git clone <repository-url>
cd ai-studio
```

### 2.2 安装依赖

```bash
npm install
```

### 2.3 配置环境变量

创建 `.env` 文件，添加以下内容：

```env
# 数据库
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:5050"
NEXTAUTH_SECRET="your-secret-key-here"

# AI API Keys
GOOGLE_GENAI_API_KEY="your-google-gemini-api-key"
DASHSCOPE_API_KEY="your-dashscope-api-key"
OPENROUTER_API_KEY="your-openrouter-api-key"
```

### 2.4 数据库初始化

```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送数据库 schema
npx prisma db push

# 种子数据（可选）
npx tsx prisma/seed.ts
```

### 2.5 构建项目

```bash
npm run build
```

### 2.6 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 3. 部署选项

### 3.1 Vercel 部署

1. 登录 Vercel 账号
2. 导入项目
3. 配置环境变量
4. 部署项目

### 3.2 本地服务器部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

### 3.3 Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

构建和运行：

```bash
docker build -t ai-studio .
docker run -p 3000:3000 ai-studio
```

## 4. 功能说明

### 4.1 核心功能

- **图像生成**：基于文本描述生成图像
- **视频生成**：基于文本描述生成视频
- **图片编辑**：支持图像编辑和局部重绘
- **进阶设计**：建筑和室内设计生成
- **画布模式**：基于节点的可视化编辑工具

### 4.2 积分系统

- 新用户注册获得 20 积分
- 不同模型消耗不同积分：
  - flash 模型：1 积分/张
  - pro 模型：3 积分/张
  - image2 模型：50 积分/张

## 5. 故障排除

### 5.1 常见问题

- **API 密钥错误**：检查环境变量中的 API 密钥是否正确
- **数据库连接错误**：确保 DATABASE_URL 配置正确
- **积分不足**：用户积分不足时会收到错误提示
- **生成失败**：可能是 API 限制或网络问题，尝试重试

### 5.2 日志查看

```bash
# 开发模式日志
npm run dev

# 生产模式日志
npm start
```

## 6. 维护和更新

### 6.1 更新代码

```bash
git pull
npm install
npm run build
npm start
```

### 6.2 数据库迁移

```bash
npx prisma db push
```

## 7. 安全注意事项

- 不要在代码中硬编码 API 密钥
- 定期更新依赖包
- 配置适当的 CORS 策略
- 监控 API 使用情况，避免滥用

## 8. 联系和支持

- 如有问题，请联系技术支持
- 查看项目文档获取更多信息
