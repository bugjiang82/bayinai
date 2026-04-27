# AI Creative Studio Code Wiki

## 1. 项目概述

AI Creative Studio 是一个现代化的 AI 创意内容生成平台，支持图片生成、视频生成、图片局部重绘、AI 智能体等多种功能。项目基于 Next.js 16、TypeScript、Prisma 和 Tailwind CSS 构建。

### 核心功能
- **AI 图片生成**：支持 Flash（快速）、Pro（高清）、Image2（超高清）三种模型
- **图片局部重绘**：基于 mask 的精准图像编辑
- **视频生成**：支持文生视频和图生视频
- **AI 智能体**：可配置的 Agent 对话系统
- **积分系统**：完整的积分充值、消费、转移、日志体系
- **团队协作**：多用户团队管理
- **作品展示**：画廊和作品管理

## 2. 技术栈

### 前端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.2.4 | 全栈框架 |
| React | 19.2.4 | UI 库 |
| TypeScript | ^5 | 类型系统 |
| Tailwind CSS | ^4 | 样式框架 |
| Zustand | ^5.0.12 | 状态管理 |
| Framer Motion | ^12.38.0 | 动画库 |
| Konva | ^10.2.5 | Canvas 绘图 |

### 后端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| Prisma | ^5.22.0 | ORM |
| NextAuth | ^5.0.0-beta.31 | 认证 |
| SQLite | - | 数据库 |
| Sharp | ^0.34.5 | 图片处理 |
| OpenAI SDK | ^6.34.0 | OpenAI API |

### AI API
| 服务 | 用途 |
|------|------|
| Google Gemini | 图片生成（Flash/Pro） |
| OpenRouter | Image2 模型调用 |
| 阿里云 DashScope | 视频生成 |

## 3. 目录结构

```
ai-studio/
├── prisma/                          # Prisma 配置
│   ├── schema.prisma                # 数据库模型定义
│   └── seed.ts                      # 初始化种子数据
├── public/                          # 静态资源
│   ├── agents/                      # Agent 头像等静态图片
│   ├── outputs/                     # 用户生成内容输出目录（按用户 ID 分文件夹）
│   └── uploads/                     # 用户上传内容目录
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # 认证相关路由组（登录、注册）
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (main)/                  # 主应用路由组（需认证）
│   │   │   ├── agents/              # Agent 相关页面
│   │   │   │   ├── [id]/page.tsx    # Agent 详情对话页
│   │   │   │   └── page.tsx         # Agent 列表页
│   │   │   ├── credits/             # 积分管理页
│   │   │   ├── dashboard/           # 仪表板页
│   │   │   ├── gallery/             # 画廊页
│   │   │   ├── generate/            # 生成相关页面
│   │   │   │   ├── architecture/    # 建筑设计生成页
│   │   │   │   ├── edit/            # 图片编辑页
│   │   │   │   ├── image/           # 图片生成页
│   │   │   │   ├── image-to-image/  # 图生图页
│   │   │   │   ├── text-to-image/   # 文生图页
│   │   │   │   ├── video/           # 视频生成页
│   │   │   │   └── page.tsx         # 生成主入口页
│   │   │   ├── profile/             # 个人资料页
│   │   │   ├── settings/            # 设置页
│   │   │   ├── team/                # 团队相关页
│   │   │   │   ├── [id]/page.tsx    # 团队详情页
│   │   │   │   └── page.tsx         # 团队列表页
│   │   │   ├── templates/           # 模板页
│   │   │   ├── layout.tsx           # 主应用布局
│   │   │   └── loading.tsx
│   │   ├── admin/                   # 管理后台
│   │   ├── api/                     # API 路由
│   │   │   ├── admin/               # 管理后台 API
│   │   │   ├── agents/              # Agent API
│   │   │   ├── ai-orchestrator/     # AI 编排 API
│   │   │   ├── auth/[...nextauth]/  # NextAuth 认证
│   │   │   ├── credits/             # 积分 API
│   │   │   ├── extract-prompt/      # 提示词提取 API
│   │   │   ├── gallery/             # 画廊 API
│   │   │   ├── generate/            # 生成 API
│   │   │   ├── team/                # 团队 API
│   │   │   ├── templates/           # 模板 API
│   │   │   ├── upload/              # 上传 API
│   │   │   └── user/                # 用户 API
│   │   ├── layout.tsx               # 根布局
│   │   ├── page.tsx                 # 首页
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   ├── components/                  # React 组件
│   │   ├── agent/                   # Agent 相关组件
│   │   │   ├── ChatArea.tsx
│   │   │   ├── DesignBrief.tsx
│   │   │   ├── GalleryPanel.tsx
│   │   │   ├── MarkdownText.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── OptionCard.tsx
│   │   │   └── WorkflowSteps.tsx
│   │   ├── ai/                      # AI 相关组件
│   │   │   ├── AgentCard.tsx
│   │   │   ├── InteractionView.tsx
│   │   │   └── StepIndicator.tsx
│   │   ├── generate/                # 生成相关组件
│   │   │   ├── AIPanel.tsx
│   │   │   ├── Canvas.tsx
│   │   │   ├── ComparisonSlider.tsx
│   │   │   ├── DropdownSelector.tsx
│   │   │   ├── KonvaCanvas.tsx
│   │   │   ├── ModelSelector.tsx
│   │   │   ├── ParamPanel.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── PromptInput.tsx
│   │   │   ├── SelectionTool.tsx
│   │   │   └── Toolbox.tsx
│   │   ├── layout/                  # 布局组件
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── shared/                  # 共享组件
│   │   │   ├── AnimatedSection.tsx
│   │   │   ├── CreditBadge.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   └── ui/                      # UI 组件库（基于 Radix UI）
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── progress.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── switch.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       └── tooltip.tsx
│   ├── hooks/                       # 自定义 Hooks
│   │   └── use-toast.ts
│   ├── lib/                         # 工具库
│   │   ├── admin.ts
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── utils.ts
│   ├── providers/                   # React Providers
│   │   └── AuthProvider.tsx
│   ├── services/                    # 业务服务层
│   │   ├── agent.service.ts
│   │   ├── cleanup.service.ts
│   │   ├── credit.service.ts
│   │   ├── file.service.ts
│   │   ├── generation.service.ts
│   │   ├── team.service.ts
│   │   ├── template.service.ts
│   │   └── user.service.ts
│   ├── stores/                      # Zustand 状态管理
│   │   ├── agentStore.ts
│   │   ├── aiOrchestratorStore.ts
│   │   ├── generationStore.ts
│   │   └── userStore.ts
│   └── types/                       # TypeScript 类型定义
│       ├── agent.ts
│       ├── ai-agent.ts
│       ├── api.ts
│       └── generation.ts
├── .env.example                     # 环境变量示例
├── next.config.ts                   # Next.js 配置
├── nginx.conf                       # Nginx 配置
├── package.json                     # 项目依赖和脚本
├── tsconfig.json                    # TypeScript 配置
└── README.md                        # 项目部署文档
```

## 4. 核心模块说明

### 4.1 认证模块 (`src/lib/auth.ts`)

认证模块基于 NextAuth 实现，支持邮箱密码登录。

**关键函数：**
- `authorize` - 验证用户凭据
- `jwt` - 处理 JWT token 的生成和更新
- `session` - 将 JWT token 转换为 session 数据

**认证流程：**
```
1. 用户提交邮箱密码 → authorize() 验证
2. 验证成功 → jwt() 生成 token（包含用户 ID、角色、积分缓存）
3. session() 回调将 token 数据注入 session
```

**Session 数据结构：**
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    role: string;
    credits: number;
  }
}
```

### 4.2 生成服务 (`src/services/generation.service.ts`)

这是项目的核心业务模块，处理所有 AI 生成任务。

**核心功能：**

| 功能 | 说明 | 积分消耗 |
|------|------|----------|
| `generateImage` | 图片生成 | Flash: 1, Pro: 3, Image2: 50 |
| `inpaintImage` | 图片局部重绘 | 2 |
| `generateVideo` | 视频生成 | 按时长 |
| `getHistory` | 获取生成历史记录 | - |
| `getVideoStatus` | 视频生成状态查询 | - |

**图片生成流程 (`generateImage`)：**
```typescript
1. 验证用户积分
2. 创建 Generation 记录（status: PROCESSING）
3. 根据模型调用相应 API
   - Gemini Flash/Pro：@google/genai SDK
   - Image2：OpenRouter API
4. 保存生成的图片到 public/outputs/{userId}/
5. 使用 sharp 生成缩略图
6. 扣除积分（原子事务）
7. 更新 Generation 记录（status: COMPLETED）
8. 返回生成结果
```

**模型映射：**
```typescript
const MODEL_MAP: Record<string, string> = {
  flash: "gemini-3.1-flash-image-preview",
  pro: "gemini-3-pro-image-preview",
  image2: "openai/gpt-5.4-image-2",
};
```

### 4.3 积分服务 (`src/services/credit.service.ts`)

管理用户积分的消费、充值、转账等操作。

**核心函数：**

| 函数 | 说明 |
|------|------|
| `getBalance` | 获取用户积分余额 |
| `addCredits` | 增加用户积分 |
| `deductCredits` | 扣除用户积分（带事务保护） |
| `refundCredits` | 积分退款 |
| `getLogs` | 获取积分变动日志 |
| `transfer` | 积分转账 |

**积分扣减流程 (`deductCredits`)：**
```typescript
1. 参数验证
2. 使用 prisma.$transaction 开启事务
3. 查询当前用户积分（加锁）
4. 验证积分是否充足
5. 更新用户积分余额
6. 创建 CreditLog 记录
7. 提交事务
8. 返回扣减结果
```

**积分类型 (`CreditType`)：**
```typescript
type CreditType = 
  | "RECHARGE"      // 充值
  | "GENERATE"      // 生成消费
  | "TRANSFER_IN"   // 转入
  | "TRANSFER_OUT"  // 转出
  | "BONUS"         // 奖励
  | "SIGN_IN";      // 签到
```

### 4.4 Agent 服务 (`src/services/agent.service.ts`)

管理 AI 智能体的创建、对话等功能。

**主要功能：**
- Agent 创建和配置
- Agent 对话流程管理
- Agent 列表查询

### 4.5 团队服务 (`src/services/team.service.ts`)

管理团队协作相关功能。

**主要功能：**
- 团队创建和管理
- 团队成员管理
- 团队权限控制

## 5. 数据模型 (`prisma/schema.prisma`)

### User - 用户表
```prisma
model User {
  id          String   @id @default(cuid())
  email       String?  @unique
  phone       String?  @unique
  password    String?
  name        String
  avatar      String?
  role        String   @default("USER")
  credits     Int      @default(20)
  industry    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  // 关联字段
  accounts    Account[]
  agents      Agent[]
  creditLogs  CreditLog[]
  generations Generation[]
  sessions    Session[]
  ownedTeams  Team[]     @relation("TeamOwner")
  teamMembers TeamMember[]
  templates   Template[]
}
```

### Generation - 生成记录表
```prisma
model Generation {
  id             String    @id @default(cuid())
  userId         String
  agentId        String?
  type           String    @default("TEXT_TO_IMAGE")
  status         String    @default("PENDING")
  prompt         String
  negativePrompt String?
  params         String    @default("{}") // JSON 格式的参数
  inputUrl       String?
  outputUrl      String?
  thumbnailUrl   String?
  width          Int?
  height         Int?
  seed           Int?
  cost           Int       @default(0)
  errorMsg       String?
  startedAt      DateTime?
  completedAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  favorited      Boolean   @default(false)
  favoritedAt    DateTime?
  // 关联
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  agent          Agent?    @relation(fields: [agentId], references: [id])
  // 索引
  @@index([userId])
  @@index([agentId])
  @@index([status])
  @@index([createdAt])
  @@index([favorited])
}
```

### Agent - 智能体表
```prisma
model Agent {
  id          String    @id @default(cuid())
  name        String
  description String?
  avatar      String?
  systemPrompt String
  config      String    @default("{}")
  isPublic    Boolean   @default(false)
  sortOrder   Int       @default(0)
  userId      String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  // 关联
  user        User?     @relation(fields: [userId], references: [id])
  generations Generation[]
}
```

### CreditLog - 积分日志表
```prisma
model CreditLog {
  id        String   @id @default(cuid())
  userId    String
  type      String   @default("RECHARGE")
  amount    Int      // 正数为增加，负数为扣除
  balance   Int      // 变动后余额
  remark    String?
  refId     String?  // 关联 ID（如 Generation ID）
  createdAt DateTime @default(now())
  // 关联
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // 索引
  @@index([userId])
  @@index([type])
  @@index([createdAt])
}
```

### Team - 团队表
```prisma
model Team {
  id          String       @id @default(cuid())
  name        String
  description String?
  avatar      String?
  ownerId     String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  // 关联
  owner       User         @relation("TeamOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     TeamMember[]
}
```

## 6. API 路由说明

### 认证相关
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/auth/[...nextauth]` | ALL | NextAuth 认证处理 |
| `/api/auth/register` | POST | 用户注册 |

### 生成相关
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/generate/image` | POST | 图片生成 |
| `/api/generate/inpaint` | POST | 图片局部重绘 |
| `/api/generate/video` | POST | 视频生成 |
| `/api/generate/history` | GET | 获取生成历史 |
| `/api/generate/favorite` | POST | 收藏/取消收藏作品 |

### 积分相关
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/credits/balance` | GET | 获取积分余额 |
| `/api/credits/logs` | GET | 获取积分日志 |
| `/api/credits/recharge` | POST | 积分充值 |
| `/api/credits/transfer` | POST | 积分转账 |

### Agent 相关
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/agents` | GET/POST | Agent 列表/创建 |
| `/api/agents/[id]` | GET/PUT/DELETE | Agent 详情/更新/删除 |
| `/api/agents/[id]/chat` | POST | Agent 对话 |

## 7. 状态管理 (`src/stores/`)

项目使用 Zustand 进行状态管理。

### generationStore.ts - 生成状态
```typescript
// 主要状态
state: {
  currentParams: GenerationParams;
  isGenerating: boolean;
  progress: number;
  results: GenerationResult[];
  history: GenerationResult[];
}

// 主要 actions
actions: {
  setParams: (params: Partial<GenerationParams>) => void;
  resetParams: () => void;
  startGeneration: () => void;
  updateProgress: (progress: number) => void;
  completeGeneration: (result: GenerationResult) => void;
  failGeneration: () => void;
  addResults: (results: GenerationResult[]) => void;
  clearResults: () => void;
  loadHistory: (history: GenerationResult[]) => void;
  reset: () => void;
}
```

## 8. 环境变量

项目使用以下环境变量（参考 `.env.example`）：

```env
# 数据库
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"

# AI API Keys
GOOGLE_GENAI_API_KEY="your-gemini-key"
DASHSCOPE_API_KEY="your-dashscope-key"
OPENROUTER_API_KEY="your-openrouter-key"
```

## 9. 部署说明

详细部署请参考 `README.md`，主要步骤：

1. 安装依赖：`npm install`
2. 初始化数据库：`npx prisma db push && npx tsx prisma/seed.ts`
3. 构建项目：`npm run build`
4. 启动服务：`pm2 start npm --name "ai-studio" -- start`

---

**最后更新时间：2026-04-27**
