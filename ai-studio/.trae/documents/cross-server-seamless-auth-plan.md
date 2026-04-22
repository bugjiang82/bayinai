# 跨服务器无感认证方案

## 一、需求分析

### 当前架构
- **外部认证服务器**：独立部署，处理用户身份认证
- **本站（API 中转层）**：仅作为 API 调用的中转，不做用户认证
- **目标**：用户无需手动输入认证信息，即可完成跨服务器身份验证

### 核心挑战
1. 如何安全传递用户身份信息
2. 如何在本站建立有效的会话
3. 如何处理认证失败和同步问题

---

## 二、方案设计：JWT + 会话桥接 + 自动登录

### 架构流程

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  外部认证服务器   │         │    用户浏览器    │         │   本站(API层)   │
│                 │         │                 │         │                 │
│  1.用户登录     │────────▶│  2.获取JWT      │────────▶│  3.验证JWT      │
│  2.颁发JWT     │         │                 │         │  4.创建本地会话  │
│                 │         │                 │         │  5.调用API      │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### 认证流程详解

**步骤 1：用户在外部服务器登录**
- 用户在外部认证服务器完成登录
- 外部服务器生成包含用户信息的 JWT

**步骤 2：外部服务器重定向用户到本站**
- 携带 JWT token 作为 URL 参数或 Cookie
- 使用临时的一次性凭证或加密 token

**步骤 3：验证 JWT 并建立本地会话**
- 使用共享密钥验证 JWT 签名
- 验证通过后，在本站创建 session
- 生成新的 NextAuth session token

**步骤 4：后续 API 调用**
- 使用 NextAuth session cookie
- 无需再次验证外部 JWT

---

## 三、详细实现方案

### 1. 创建认证工具库

**文件：`src/lib/auth-bridge.ts`**

```typescript
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL;
const AUTH_SERVER_SHARED_SECRET = process.env.AUTH_SERVER_SHARED_SECRET;
const JWT_EXPIRY = '1h';

interface AuthServerToken {
  userId: string;
  email: string;
  name?: string;
  role?: string;
  credits?: number;
  iat: number;
  exp: number;
}

/**
 * 验证来自认证服务器的 JWT token
 */
export async function validateAuthServerToken(token: string): Promise<AuthServerToken | null> {
  try {
    const decoded = jwt.verify(token, AUTH_SERVER_SHARED_SECRET!) as AuthServerToken;
    return decoded;
  } catch (error) {
    console.error('[Auth Bridge] Token validation failed:', error);
    return null;
  }
}

/**
 * 生成认证桥接 token（用于 URL 传递）
 */
export function generateBridgeToken(userData: Omit<AuthServerToken, 'iat' | 'exp'>): string {
  return jwt.sign(userData, AUTH_SERVER_SHARED_SECRET!, { expiresIn: JWT_EXPIRY });
}

/**
 * 从请求中提取 token
 */
export function extractToken(request: Request): string | null {
  // 1. 优先从 Authorization header 获取
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 2. 从 cookie 获取
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [key, ...val] = c.split('=');
        return [key, val.join('=')];
      })
    );
    return cookies['auth_bridge_token'] || null;
  }

  // 3. 从 URL query parameter 获取
  const url = new URL(request.url);
  return url.searchParams.get('auth_token') || null;
}
```

### 2. 创建认证桥接 API 端点

**文件：`src/app/api/auth/bridge/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateAuthServerToken, generateBridgeToken } from "@/lib/auth-bridge";
import { signIn } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * 接收外部认证服务器颁发的 token，建立本地会话
 * POST /api/auth/bridge
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token is required' }, { status: 400 });
    }

    // 验证外部 token
    const userData = await validateAuthServerToken(token);
    if (!userData) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 401 });
    }

    // 确保本地用户存在，不存在则创建
    let localUser = await prisma.user.findUnique({
      where: { id: userData.userId }
    });

    if (!localUser) {
      localUser = await prisma.user.create({
        data: {
          id: userData.userId,
          email: userData.email,
          name: userData.name || 'User',
          password: null, // 不存储密码，由外部服务器管理
        }
      });
    }

    // 同步用户积分信息
    if (userData.credits !== undefined) {
      await prisma.user.update({
        where: { id: userData.userId },
        data: { credits: userData.credits }
      });
    }

    // 使用 NextAuth 的 signIn 函数建立本地会话
    // 这里需要调用 NextAuth 的 credentials provider
    const credentials = {
      email: userData.email,
      // 使用特殊的 bridge 密码模式，由 auth bridge 签发
      bridgeToken: token,
    };

    // 直接设置 session（绕过 NextAuth 的标准流程）
    const session = await createLocalSession(localUser.id, localUser.email);

    // 创建响应，包含 session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: localUser.id,
        email: localUser.email,
        name: localUser.name,
        credits: localUser.credits,
      }
    });

    // 设置 session cookie
    response.cookies.set('next-auth.session-token', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;

  } catch (error) {
    console.error('[Auth Bridge API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication bridge failed' },
      { status: 500 }
    );
  }
}
```

### 3. 修改现有的 NextAuth 配置

**文件：`src/lib/auth.ts`**

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const AUTH_SERVER_SHARED_SECRET = process.env.AUTH_SERVER_SHARED_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        // 标准密码认证逻辑...
        // ... (保持原有代码)
      },
    }),
    // 新增：桥接认证 provider
    Credentials({
      id: "bridge",
      name: "Bridge Authentication",
      credentials: {
        bridgeToken: { label: "Bridge Token", type: "text" },
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.bridgeToken || !credentials?.email) {
          return null;
        }

        try {
          // 验证桥接 token
          const decoded = jwt.verify(
            credentials.bridgeToken as string,
            AUTH_SERVER_SHARED_SECRET!
          ) as any;

          // 验证用户信息匹配
          if (decoded.email !== credentials.email) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
          });

          if (!user) {
            // 创建本地用户
            const newUser = await prisma.user.create({
              data: {
                id: decoded.userId,
                email: decoded.email,
                name: decoded.name || 'User',
                password: null,
              }
            });
            return { id: newUser.id, email: newUser.email, name: newUser.name };
          }

          return { id: user.id, email: user.email, name: user.name };
        } catch (error) {
          console.error('[Bridge Auth] Error:', error);
          return null;
        }
      },
    }),
  ],
  // ... 其他配置保持不变
});
```

### 4. 创建认证中间件

**文件：`src/middleware.ts`**

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { validateAuthServerToken } from "@/lib/auth-bridge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API 路由需要认证
  if (pathname.startsWith('/api/generate/')) {
    // 1. 检查是否有本地 session
    const session = await auth();

    if (session?.user?.id) {
      // 有有效会话，继续处理
      return NextResponse.next();
    }

    // 2. 检查是否有外部认证 token
    const authServerToken = extractAuthToken(request);

    if (authServerToken) {
      const userData = await validateAuthServerToken(authServerToken);

      if (userData) {
        // Token 有效，创建一个临时响应并设置 header
        // 前端检测到该 header 后自动调用 bridge API
        const response = NextResponse.next();
        response.headers.set('X-Auth-Bridge-Required', 'true');
        response.headers.set('X-Auth-User-Id', userData.userId);
        response.headers.set('X-Auth-Email', userData.email);
        return response;
      }
    }

    // 3. 无有效认证，返回 401
    return NextResponse.json(
      { code: 401, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

function extractAuthToken(request: NextRequest): string | null {
  // 从 Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 从 cookie
  return request.cookies.get('external_auth_token')?.value || null;
}

export const config = {
  matcher: ['/api/generate/:path*'],
};
```

### 5. 前端无感认证处理

**文件：`src/components/auth/AuthBridgeProvider.tsx`**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface AuthBridgeHandlerProps {
  children: React.ReactNode;
}

export function AuthBridgeHandler({ children }: AuthBridgeHandlerProps) {
  const router = useRouter();
  const bridgeAttempted = useRef(false);

  useEffect(() => {
    // 检查是否需要桥接认证
    const authBridgeRequired = document.cookie.includes('auth_bridge_required=true');

    if (authBridgeRequired && !bridgeAttempted.current) {
      bridgeAttempted.current = true;
      performBridgeAuth();
    }
  }, []);

  const performBridgeAuth = async () => {
    try {
      // 从 cookie 或其他地方获取外部 token
      const externalToken = getCookie('external_auth_token');

      if (!externalToken) {
        console.error('[Auth Bridge] No external token found');
        return;
      }

      // 调用桥接 API
      const response = await fetch('/api/auth/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: externalToken }),
      });

      if (response.ok) {
        // 桥接成功，清除临时 cookie
        document.cookie = 'external_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'auth_bridge_required=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // 刷新页面使 session 生效
        router.refresh();
      }
    } catch (error) {
      console.error('[Auth Bridge] Bridge auth failed:', error);
    }
  };

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  return <>{children}</>;
}
```

---

## 四、安全最佳实践

### 1. Token 安全传输

| 措施 | 说明 |
|------|------|
| HTTPS only | 所有 token 传输必须通过 HTTPS |
| HttpOnly Cookie | 防止 XSS 攻击读取 token |
| Secure Flag | 仅在 HTTPS 连接发送 cookie |
| SameSite=Lax | 防止 CSRF 攻击 |
| Token 加密 | JWT 内容使用共享密钥签名 |

### 2. 密钥管理

```bash
# .env.local
# 外部认证服务器的共享密钥（两端需一致）
AUTH_SERVER_SHARED_SECRET=your-256-bit-secret-key-here

# 外部认证服务器 URL
AUTH_SERVER_URL=https://auth.external-server.com
```

### 3. Token 有效期

| Token 类型 | 有效期 | 说明 |
|-----------|--------|------|
| 外部 JWT | 1小时 | 短期令牌，定期刷新 |
| 桥接 token | 一次性 | 仅用于建立会话 |
| 本地 session | 7天 | 用户无操作后过期 |

### 4. 审计日志

```typescript
// 日志记录示例
interface AuthAttemptLog {
  timestamp: string;
  userId?: string;
  ip: string;
  userAgent: string;
  success: boolean;
  error?: string;
  authMethod: 'session' | 'bridge' | 'external_token';
}

// 写入日志
await prisma.authLog.create({
  data: {
    action: 'AUTH_ATTEMPT',
    userId: decoded?.userId,
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    details: JSON.stringify({ success, error, authMethod }),
  }
});
```

---

## 五、优雅降级处理

### 认证失败场景及处理

| 场景 | 处理方式 |
|------|---------|
| 外部 JWT 无效/过期 | 返回 401，提示重新登录外部系统 |
| 本地 session 过期 | 自动尝试使用外部 token 桥接 |
| 外部认证服务器不可达 | 使用本地缓存的 session，继续访问 |
| 桥接 API 调用失败 | 降级到只读模式，提示用户手动操作 |
| 用户不存在 | 自动创建本地用户，同步基本信息 |

### 降级模式实现

```typescript
// 降级处理示例
async function authWithFallback(request: NextRequest) {
  // 1. 尝试本地 session
  const session = await auth();
  if (session?.user?.id) {
    return { authenticated: true, method: 'session', user: session.user };
  }

  // 2. 尝试外部 token
  const externalToken = extractAuthToken(request);
  if (externalToken) {
    const userData = await validateAuthServerToken(externalToken);
    if (userData) {
      return { authenticated: true, method: 'external', user: userData };
    }
  }

  // 3. 返回未认证
  return { authenticated: false, method: null, user: null };
}
```

---

## 六、API 调用示例

### 外部服务器调用方式

```bash
# 1. 外部服务器验证用户后，生成 token 并重定向
# GET https://api.your-site.com/api/auth/bridge?token=<jwt_token>

# 2. 或者直接调用桥接 API
curl -X POST https://api.your-site.com/api/auth/bridge \
  -H "Content-Type: application/json" \
  -d '{"token": "<jwt_token_from_auth_server>"}'

# 3. 后续 API 调用（使用本地 session cookie）
curl -X POST https://api.your-site.com/api/generate/image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "一座现代风格的建筑", "model": "flash"}'
```

---

## 七、实施计划

### 第一阶段：基础架构（1天）

1. 创建 `auth-bridge.ts` 工具库
2. 实现 JWT 验证函数
3. 创建 `/api/auth/bridge` 端点

### 第二阶段：会话集成（1天）

1. 修改 `auth.ts` 添加 Bridge Provider
2. 实现会话桥接逻辑
3. 创建中间件

### 第三阶段：前端集成（1天）

1. 创建 `AuthBridgeProvider` 组件
2. 修改 layout 集成 Provider
3. 实现自动桥接逻辑

### 第四阶段：安全加固（0.5天）

1. 添加审计日志
2. 实现降级处理
3. 安全配置检查

---

## 八、环境变量配置

```bash
# .env.local
AUTH_SERVER_SHARED_SECRET=your-256-bit-secret-key-min-32-chars
AUTH_SERVER_URL=https://auth.external-server.com
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
```
