# MySQL 数据库迁移与性能优化实施方案（更新版）

> **基准环境**: Ubuntu 24.04.4 LTS | Next.js 16.2.4 | Prisma 5.22 | SQLite 16MB → MySQL 8.0  
> **当前状态**: MySQL 已安装运行中，表结构已创建（但 Generation 表 URL 字段仍为 VARCHAR(2048)），部分数据已导入但不完整  

---

## 迁移前状态检查

### 已完成
- ✅ MySQL 8.0.45 安装并运行
- ✅ 数据库 `ai_studio` 和用户 `ai_studio`/`ai_studio_pass` 已创建
- ✅ `prisma/schema.prisma` 已改为 `provider = "mysql"`，所有 @db.Text/@db.VarChar 注解已添加
- ✅ 首次 `prisma db push` 已完成（12 张表已建）
- ✅ SQLite 数据库已备份: `dev.db.backup.20260528_171134`（16MB）
- ✅ `.env` 已备份: `.env.backup`
- ✅ 数据导出脚本 `/tmp/migrate.js` 已编写
- ✅ SQL 导出文件 `/tmp/mysql_import.sql` 已生成（15MB）

### 当前问题
- ❌ MySQL `Generation` 表 `inputUrl`/`outputUrl`/`thumbnailUrl` 仍为 `varchar(2048)`（schema 改了但未 re-push）
- ❌ 首次导入部分失败：Generation 只有 1 条记录（应有 30 条），其他表有不完整数据
- ❌ `.env` 中 `DATABASE_URL` 仍指向 SQLite（`file:./dev.db`）
- ❌ `generations/route.ts` API 使用 `include` 拉取全字段（含大 TEXT），未做字段选择优化
- ❌ `CreditLog` 表、`Generation` 表缺少复合索引

### 当前 MySQL 数据量（不完整）
| 表 | 期望 | 实际 | 状态 |
|---|---|---|---|
| User | 2 | 2 | ✅ |
| Agent | 5 | 5 | ✅ |
| Generation | 30 | 1 | ❌ 缺少 29 条 |
| Template | 8 | 8 | ✅ |
| CreditLog | 7 | ? | 待验证 |
| CreditPolicy | 29 | ? | 待验证 |
| CanvasProject | 1 | ? | 待验证 |

---

## 执行计划（6 个阶段）

---

### 阶段 0：停服与备份

```
目标: 防止迁移期间数据写入冲突
执行: 手动命令，执行时间 1-2 分钟
```

**0.1 停止 Next.js 服务**
```bash
pkill -f "next dev" || true
```

**0.2 重新备份 SQLite 数据库（当前最新）**
```bash
cp /home/ubuntu/bayinai/ai-studio/prisma/dev.db /home/ubuntu/bayinai/ai-studio/prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)
```

**0.3 验证 SQLite 数据完整性**
```bash
sqlite3 /home/ubuntu/bayinai/ai-studio/prisma/dev.db "
SELECT 'Users' AS tbl, COUNT(*) FROM User
UNION ALL SELECT 'Generations', COUNT(*) FROM Generation
UNION ALL SELECT 'Agents', COUNT(*) FROM Agent
UNION ALL SELECT 'Templates', COUNT(*) FROM Template
UNION ALL SELECT 'CreditLogs', COUNT(*) FROM CreditLog
UNION ALL SELECT 'CreditPolicies', COUNT(*) FROM CreditPolicy
UNION ALL SELECT 'CanvasProjects', COUNT(*) FROM CanvasProject;
"
```

---

### 阶段 1：Schema 重新推送至 MySQL

```
目标: 将 schema.prisma 中已修正的 @db.Text 类型推送到 MySQL
关键: 先清空 MySQL 旧数据 → re-push → 确保表结构与 schema 一致
执行: 手动命令，执行时间 1-2 分钟
```

**1.1 在 MySQL 中删除所有旧表（清除不完整数据）**
```bash
mysql -u ai_studio -pai_studio_pass -e "
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS \`Generation\`, \`CreditLog\`, \`CreditTransfer\`, \`CanvasProject\`, \`Template\`, \`Agent\`, \`TeamMember\`, \`Team\`, \`Account\`, \`Session\`, \`CreditPolicy\`, \`User\`;
SET FOREIGN_KEY_CHECKS = 1;
" ai_studio
```

**1.2 重新推送 Schema**
```bash
cd /home/ubuntu/bayinai/ai-studio
DATABASE_URL="mysql://ai_studio:ai_studio_pass@localhost:3306/ai_studio" npx prisma db push
```

**1.3 验证 Generation 表字段类型已更新为 TEXT**
```bash
mysql -u ai_studio -pai_studio_pass -e "DESCRIBE \`Generation\`;" ai_studio
```
- 期望: `inputUrl`, `outputUrl`, `thumbnailUrl` 显示为 `text` 类型

---

### 阶段 2：数据导出与导入

```
目标: 从 SQLite 完整导出数据，正确转换后导入 MySQL
关键: 使用已有的 /tmp/migrate.js 脚本，确保 100% 数据导入
执行: 手动命令，执行时间 2-3 分钟
```

**2.1 重新执行数据导出脚本**
```bash
cd /home/ubuntu/bayinai/ai-studio
node /tmp/migrate.js
```
- 输出文件: `/tmp/mysql_import.sql`（覆盖旧的）

**2.2 导入 MySQL**
```bash
mysql -u ai_studio -pai_studio_pass ai_studio < /tmp/mysql_import.sql
```

**2.3 验证数据完整性（导出失败时对照 SQLite 逐个排查）**
```bash
mysql -u ai_studio -pai_studio_pass -e "
SELECT 'Users' AS tbl, COUNT(*) AS cnt FROM User
UNION ALL SELECT 'Generations', COUNT(*) FROM \`Generation\`
UNION ALL SELECT 'Agents', COUNT(*) FROM Agent
UNION ALL SELECT 'Templates', COUNT(*) FROM Template
UNION ALL SELECT 'CreditLogs', COUNT(*) FROM CreditLog
UNION ALL SELECT 'CreditPolicies', COUNT(*) FROM CreditPolicy
UNION ALL SELECT 'CanvasProjects', COUNT(*) FROM CanvasProject;
" ai_studio
```
- 与阶段 0.3 的 SQLite 数据量对比，确保完全一致

**2.4 验证关键数据样例**
```bash
mysql -u ai_studio -pai_studio_pass -e "SELECT id, name, email, role FROM User;" ai_studio
mysql -u ai_studio -pai_studio_pass -e "SELECT id, type, status, LEFT(prompt, 50) AS prompt_preview FROM \`Generation\` LIMIT 5;" ai_studio
```

---

### 阶段 3：更新环境变量

```
目标: 切换 .env 中的数据库连接至 MySQL
执行: 使用 SearchReplace 工具修改 .env 文件，执行时间 <1 分钟
```

**3.1 修改 .env 文件**

搜索并替换:
```
DATABASE_URL="file:./dev.db"
→ DATABASE_URL="mysql://ai_studio:ai_studio_pass@localhost:3306/ai_studio"
```

**3.2 重新生成 Prisma Client**
```bash
cd /home/ubuntu/bayinai/ai-studio
npx prisma generate
```

---

### 阶段 4：性能优化 — 数据库层

```
目标: 为高频查询路径添加复合索引，优化 MySQL 配置
执行: 修改 schema.prisma（SearchReplace） + 编辑 my.cnf（Write），执行时间 3-5 分钟
```

**4.1 添加 Generation 复合索引**

在 `schema.prisma` 的 `Generation` 模型末尾（第 127 行之前）新增两个复合索引:

```prisma
  @@index([type, status, createdAt])
  @@index([userId, createdAt])
```
- `type + status + createdAt`: 覆盖内容管理页的筛选查询（最左前缀原则）
- `userId + createdAt`: 覆盖"用户最近生成记录"查询

**4.2 添加 CreditLog 复合索引**

在 `CreditLog` 模型末尾新增:

```prisma
  @@index([userId, type])
```
- 覆盖 stats API 的积分统计查询

**4.3 推送索引到 MySQL**
```bash
cd /home/ubuntu/bayinai/ai-studio
DATABASE_URL="mysql://ai_studio:ai_studio_pass@localhost:3306/ai_studio" npx prisma db push
```

**4.4 MySQL my.cnf 配置优化**

编辑 `/etc/mysql/mysql.conf.d/mysqld.cnf`，在 `[mysqld]` 段末尾添加:

```ini
# ========== AI Studio 优化配置 ==========
# InnoDB 缓冲池（可用内存的 50%-70%，当前服务器约 4G 内存）
innodb_buffer_pool_size = 1G

# 排序和读取缓冲区
sort_buffer_size = 4M
read_buffer_size = 2M

# 最大连接数
max_connections = 100

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

重启 MySQL 使配置生效:
```bash
sudo systemctl restart mysql
```

---

### 阶段 5：性能优化 — 应用层

```
目标: 优化 API 查询模式，减少数据传输量，缓存重复 auth 调用
执行: 使用 SearchReplace 工具修改 5 个文件，执行时间 5-8 分钟
```

**5.1 generations API — 添加字段选择（select）**

**文件**: `src/app/api/admin/generations/route.ts`

将 `include` 改为 `select`，只查询列表所需字段（排除大 TEXT 字段: `prompt`, `negativePrompt`, `params`, `inputUrl`, `outputUrl`, `thumbnailUrl`, `errorMsg`）:

```typescript
// 修改前 (第 20-29 行)
    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.generation.count({ where }),
    ]);

// 修改后
    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where,
        select: {
          id: true,
          type: true,
          status: true,
          cost: true,
          createdAt: true,
          favorited: true,
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.generation.count({ where }),
    ]);
```

**5.2 users API — 已有 select，无需修改** ✅

当前 `users/route.ts` 已正确使用 `select` 限定字段。

**5.3 users/[id] API — 已有 select，无需修改** ✅

**5.4 stats API — 优化 creditLog 聚合查询**

**文件**: `src/app/api/admin/stats/route.ts`

当前 `creditLog.aggregate` 按 `type: "GENERATE"` 过滤，需确保 `CreditLog` 表有对应的复合索引（阶段 4.2 已添加）。Stats API 代码无需改动。

**5.5 requireAdmin — 添加 React.cache()**

**文件**: `src/lib/admin.ts`

```typescript
// 修改前
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await auth();
  ...
}

// 修改后
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cache } from "react";

const cachedAuth = cache(() => auth());

export async function requireAdmin() {
  const session = await cachedAuth();
  ...
}
```
- 效果: 同一请求内的多次 `requireAdmin()` 调用共享一次 `auth()` 结果

---

### 阶段 6：启动与验证

```
目标: 启动服务，执行 12 项功能验证 + 数据完整性验证 + 性能对比
执行: 手动命令 + 浏览器验证，执行时间 5-8 分钟
```

**6.1 启动 Next.js 开发服务**
```bash
cd /home/ubuntu/bayinai/ai-studio
npm run dev
```

**6.2 功能验证清单（12 项）**

| # | 测试项 | URL | 验证要点 |
|---|--------|-----|----------|
| 1 | 用户登录 | `/login` | 能否正常登录 |
| 2 | 用户注册 | `/register` | 能否正常注册 |
| 3 | 管理后台概览 | `/admin/overview` | 统计数据是否正确显示 |
| 4 | 用户管理 | `/admin/users` | 用户列表、搜索、编辑、删除 |
| 5 | 内容管理 | `/admin/content` | 生成记录列表、筛选、分页 |
| 6 | 系统设置 | `/admin/settings` | 系统信息、积分策略 |
| 7 | 积分策略 | `/admin/credit-policies` | 策略列表、编辑、重置 |
| 8 | 开发文档 | `/admin/docs` | 文档页面正常渲染 |
| 9 | 图像生成 | `/generate/image` | 能否正常生成图像 |
| 10 | 视频生成 | `/generate/video` | 能否正常提交视频任务 |
| 11 | 画廊 | `/gallery` | 历史作品正常展示 |
| 12 | 画布模式 | `/workflow/workspace` | 画布加载、节点编辑 |

**6.3 数据完整性验证**
```bash
# 数据库行数对比
echo "=== MySQL ==="
mysql -u ai_studio -pai_studio_pass -e "
SELECT 'Users' AS tbl, COUNT(*) AS cnt FROM User
UNION ALL SELECT 'Generations', COUNT(*) FROM \`Generation\`
UNION ALL SELECT 'Agents', COUNT(*) FROM Agent
UNION ALL SELECT 'Templates', COUNT(*) FROM Template
UNION ALL SELECT 'CreditLogs', COUNT(*) FROM CreditLog
UNION ALL SELECT 'CreditPolicies', COUNT(*) FROM CreditPolicy;
" ai_studio

echo "=== SQLite (备份) ==="
sqlite3 /home/ubuntu/bayinai/ai-studio/prisma/dev.db.backup.20260528_171134 "
SELECT 'Users' AS tbl, COUNT(*) FROM User
UNION ALL SELECT 'Generations', COUNT(*) FROM Generation
UNION ALL SELECT 'Agents', COUNT(*) FROM Agent
UNION ALL SELECT 'Templates', COUNT(*) FROM Template
UNION ALL SELECT 'CreditLogs', COUNT(*) FROM CreditLog
UNION ALL SELECT 'CreditPolicies', COUNT(*) FROM CreditPolicy;
"
```
- 要求: MySQL 和 SQLite 备份中每张表的行数完全一致

**6.4 内容管理页面性能对比**
```bash
# 测量 API 响应时间
time curl -s -o /dev/null -w "HTTP %{http_code}, Time: %{time_total}s\n" "http://localhost:5050/api/admin/generations?limit=20"
```
- 期望: 响应时间从秒级降至 200-500ms 以内

**6.5 检查无错误日志**
```bash
# 观察终端输出，确保无 Prisma/MySQL 连接错误
```

---

## 回退方案

如果迁移后出现严重问题：

```bash
# 1. 停止服务
pkill -f "next dev"

# 2. 恢复 .env
cp /home/ubuntu/bayinai/ai-studio/.env.backup /home/ubuntu/bayinai/ai-studio/.env

# 3. 恢复 schema（将 provider 改回 "sqlite"，移除 @db.* 注解和新增 @@index）
#    或直接: git checkout prisma/schema.prisma

# 4. 恢复数据库
cp /home/ubuntu/bayinai/ai-studio/prisma/dev.db.backup.20260528_171134 /home/ubuntu/bayinai/ai-studio/prisma/dev.db

# 5. 重新生成 Prisma Client
cd /home/ubuntu/bayinai/ai-studio && npx prisma generate

# 6. 重启服务
npm run dev
```

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 大字段（Base64 URL）再次导致导入失败 | 低 | 高 | schema 已改为 @db.Text，无长度限制 |
| 外键约束导致导入顺序错误 | 低 | 中 | SQL 中已 SET FOREIGN_KEY_CHECKS=0 |
| DateTime 时区偏移 | 低 | 中 | 导出脚本已使用 FROM_UNIXTIME() 转换 |
| Boolean 字段丢失 | 低 | 中 | 导出脚本已转换为 1/0 |
| 服务重启后 API 异常 | 低 | 高 | 完整 12 项功能验证清单 |
| MySQL 配置不当导致性能下降 | 低 | 低 | 保守配置，可随时回滚 |
| Prisma Client 缓存导致仍连 SQLite | 中 | 高 | 阶段 3.2 强制执行 prisma generate |

---

## 执行顺序速览

```
阶段 0: 停服 + 备份（重新备份 SQLite）
  └── 验证 SQLite 数据完整性（记录各表行数作为基准）

阶段 1: Schema 重新推送
  ├── 1.1 清空 MySQL 所有旧表
  ├── 1.2 prisma db push（MySQL）
  └── 1.3 验证 Generation 表字段类型

阶段 2: 数据导出导入
  ├── 2.1 执行 /tmp/migrate.js 重新导出
  ├── 2.2 mysql < 导入
  └── 2.3-2.4 数据完整性验证 + 样例检查

阶段 3: 环境变量
  ├── 3.1 .env DATABASE_URL → MySQL
  └── 3.2 prisma generate

阶段 4: 数据库层优化
  ├── 4.1-4.2 添加复合索引到 schema.prisma
  ├── 4.3 prisma db push
  └── 4.4 MySQL my.cnf 配置 + 重启

阶段 5: 应用层优化
  ├── 5.1 generations/route.ts 添加 select
  ├── 5.2-5.4 users/stats 确认无问题
  └── 5.5 admin.ts 添加 React.cache()

阶段 6: 启动验证
  ├── 6.1 npm run dev
  ├── 6.2 12 项功能验证
  ├── 6.3 数据完整性验证
  └── 6.4-6.5 性能对比 + 错误检查
```

---

## 关键文件修改汇总

| 文件 | 操作 | 工具 |
|------|------|------|
| `.env` | 替换 DATABASE_URL | SearchReplace |
| `prisma/schema.prisma` | 添加 3 个 @@index | SearchReplace |
| `src/app/api/admin/generations/route.ts` | include → select | SearchReplace |
| `src/lib/admin.ts` | 添加 React.cache() | SearchReplace |
| `/etc/mysql/mysql.conf.d/mysqld.cnf` | 添加 InnoDB 配置 | Write（需 sudo） |