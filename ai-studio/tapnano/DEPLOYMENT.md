# TapNano 网站部署指南

## 目录

- [概述](#概述)
- [系统要求](#系统要求)
- [快速部署](#快速部署)
- [详细部署步骤](#详细部署步骤)
- [配置说明](#配置说明)
- [启动服务](#启动服务)
- [Nginx 配置](#nginx-配置)
- [验证部署](#验证部署)
- [故障排除](#故障排除)
- [安全建议](#安全建议)
- [备份与恢复](#备份与恢复)
- [目录结构](#目录结构)

---

## 概述

TapNano 是一个基于 Flask 的 AI 多功能网站，支持：
- AI 图片生成（文字生成、图片参考生成、图片编辑）
- AI 视频创作（首尾帧视频生成）
- 批量任务处理
- 用户管理

### 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | Vanilla JS + HTML + CSS |
| 后端 | Python Flask |
| 数据库 | SQLite |
| Web 服务器 | Nginx |
| AI 服务 | Google Gemini API、阿里云百炼 API |

---

## 系统要求

- **操作系统**: Ubuntu 20.04+ / Debian 11+
- **Python**: 3.10+
- **内存**: 最低 2GB，推荐 4GB+
- **磁盘**: 至少 10GB 可用空间
- **Nginx**: 1.18+

---

## 快速部署

### 一键部署脚本

```bash
# 下载或上传部署包后执行：
cd /var/www
tar -xzf tapnano.tar.gz
cd tapnano

# 运行自动部署脚本
chmod +x deploy.sh
./deploy.sh
```

部署脚本会自动完成：
- 系统依赖安装
- Python 虚拟环境创建
- Python 依赖安装
- 数据库初始化
- 服务配置

---

## 详细部署步骤

### 1. 系统准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y python3 python3-pip python3-venv nginx git curl

# 安装 Python 开发包（用于编译依赖）
sudo apt install -y python3-dev build-essential
```

### 2. 创建用户（推荐）

```bash
# 创建专用用户
sudo useradd -m -s /bin/bash nano

# 创建目录并设置权限
sudo mkdir -p /var/www
sudo chown nano:nano /var/www
```

### 3. 上传并解压项目

```bash
# 上传 tapnano.tar.gz 到 /var/www

cd /var/www
sudo tar -xzf tapnano.tar.gz
sudo mv tapnano /var/www/
sudo chown -R nano:nano /var/www/tapnano
```

### 4. 创建 Python 虚拟环境

```bash
cd /var/www/tapnano

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 升级 pip
pip install --upgrade pip

# 安装依赖
pip install -r requirements.txt
```

### 5. 配置环境变量

```bash
cd /var/www/tapnano

# 复制环境变量模板
cp .env.template .env

# 编辑配置文件
nano .env
```

**必须配置项：**

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| SECRET_KEY | 是 | Flask 密钥 | `openssl rand -hex 32` |
| GOOGLE_API_KEY | 是 | Gemini API Key | `AIza...` |
| DASHSCOPE_API_KEY | 否 | 阿里云百炼 API Key（用于视频生成） | `sk-...` |
| DASHSCOPE_REGION | 否 | API 地域 | `singapore` 或 `beijing` |
| FLASK_ENV | 否 | 运行环境 | `production` |
| PORT | 否 | 应用端口 | `5000` |

### 6. 初始化数据库

```bash
cd /var/www/tapnano
source venv/bin/activate

# 初始化数据库
python3 init_templates.py
```

### 7. 配置 Nginx

```bash
# 复制 Nginx 配置
sudo cp nginx.conf /etc/nginx/sites-available/tapnano

# 检查配置语法
sudo nginx -t

# 启用站点
sudo ln -sf /etc/nginx/sites-available/tapnano /etc/nginx/sites-enabled/

# 重启 Nginx
sudo systemctl restart nginx
```

### 8. 启动应用

```bash
cd /var/www/tapnano
source venv/bin/activate

# 测试运行
python3 app.py
```

按 `Ctrl+C` 停止，然后配置为后台服务。

---

## 配置说明

### 环境变量 (.env)

```bash
# ============================================
# TapNano 网站环境变量配置
# ============================================

# Flask 配置
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=your-secret-key-change-this-in-production

# Google Gemini API 配置（必须）
GOOGLE_API_KEY=your-google-api-key-here

# 阿里云百炼 API 配置（可选，用于视频生成）
DASHSCOPE_API_KEY=your-dashscope-api-key-here
DASHSCOPE_REGION=singapore

# 服务器配置
HOST=0.0.0.0
PORT=5000

# 日志配置
LOG_LEVEL=INFO
```

### 获取 API Key

#### Google Gemini API Key

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录 Google 账号
3. 点击 "Create API Key"
4. 复制生成的密钥到 `.env` 文件

#### 阿里云百炼 API Key

1. 访问 [阿里云百炼控制台](https://bailian.console.aliyun.com)
2. 获取 API Key
3. 如需视频生成功能，确保开通相应模型服务

---

## 启动服务

### 方式一：直接运行（开发/测试）

```bash
cd /var/www/tapnano
source venv/bin/activate
python3 app.py
```

### 方式二：使用 Systemd 服务（生产环境推荐）

创建服务文件 `/etc/systemd/system/tapnano.service`:

```ini
[Unit]
Description=TapNano Flask Application
After=network.target

[Service]
User=nano
Group=nano
WorkingDirectory=/var/www/tapnano
Environment=PATH=/var/www/tapnano/venv/bin
Environment=PYTHONPATH=/var/www/tapnano
ExecStart=/var/www/tapnano/venv/bin/python /var/www/tapnano/app.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启用开机自启
sudo systemctl enable tapnano

# 启动服务
sudo systemctl start tapnano

# 检查服务状态
sudo systemctl status tapnano
```

### 方式三：使用 Gunicorn（高性能生产环境）

```bash
# 安装 gunicorn
pip install gunicorn

# 使用 gunicorn 启动
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## Nginx 配置

配置文件 `nginx.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 300s;
        proxy_read_timeout 300s;
    }

    location /static/ {
        alias /var/www/tapnano/static/;
        expires 30d;
    }

    location /data/ {
        alias /var/www/tapnano/data/;
        expires 7d;
    }
}
```

---

## 验证部署

### 1. 检查服务状态

```bash
# 检查 Flask 应用
curl http://127.0.0.1:5000

# 检查 Nginx
sudo systemctl status nginx

# 检查应用服务
sudo systemctl status tapnano
```

### 2. 访问网站

在浏览器中打开：`http://your-server-ip`

### 3. 测试功能

1. **注册/登录** - 创建测试账号
2. **文字生成图片** - 输入提示词测试
3. **视频创作** - 上传首尾帧测试（如果配置了 API Key）

---

## 故障排除

### 1. Nginx 502 Bad Gateway

```bash
# 检查 Flask 是否运行
curl http://127.0.0.1:5000

# 检查应用日志
sudo journalctl -u tapnano -f

# 检查 Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

### 2. 数据库错误

```bash
# 重新初始化数据库
cd /var/www/tapnano
source venv/bin/activate
python3 init_templates.py
```

### 3. 权限错误

```bash
# 修复权限
sudo chown -R nano:nano /var/www/tapnano
sudo chmod -R 755 /var/www/tapnano
sudo chmod -R 777 /var/www/tapnano/data
```

### 4. API Key 无效

确保 `.env` 文件中的 API Key 正确：
- Google API Key 需在 Google AI Studio 启用
- 阿里云 API Key 需开通相应服务

### 5. 依赖安装失败

```bash
# 安装编译依赖
sudo apt install -y python3-dev build-essential libjpeg-dev zlib1g-dev

# 重新安装依赖
cd /var/www/tapnano
source venv/bin/activate
pip uninstall -y Pillow
pip install --no-cache-dir Pillow
```

---

## 安全建议

1. **修改 SECRET_KEY** - 使用随机字符串：`openssl rand -hex 32`
2. **启用 HTTPS** - 配置 SSL 证书（推荐使用 Let's Encrypt）
3. **限制文件上传** - 验证文件类型和大小
4. **定期备份** - 备份数据库和用户数据
5. **防火墙** - 只开放必要端口 (80, 443)
6. **用户认证** - 确保启用强密码策略
7. **API Key 安全** - 不要将包含真实 Key 的 .env 提交到代码仓库

### HTTPS 配置（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

---

## 备份与恢复

### 备份

```bash
# 创建备份目录
mkdir -p /backup

# 备份数据库和用户数据
tar -czf /backup/tapnano-backup-$(date +%Y%m%d).tar.gz \
  /var/www/tapnano/database.db \
  /var/www/tapnano/data/user_data \
  /var/www/tapnano/.env
```

### 恢复

```bash
# 停止服务
sudo systemctl stop tapnano

# 恢复文件
tar -xzf /backup/tapnano-backup-YYYYMMDD.tar.gz -C /

# 重启服务
sudo systemctl start tapnano
```

---

## 目录结构

```
tapnano/
├── app.py                 # Flask 应用入口
├── auth.py               # 认证模块
├── database.py           # 数据库操作
├── requirements.txt      # Python 依赖
├── .env.template        # 环境变量模板
├── nginx.conf           # Nginx 配置
├── init_templates.py    # 数据库初始化脚本
├── templates/           # HTML 模板
│   ├── index.html       # 首页（文字生成）
│   ├── upload.html      # 图片参考生成
│   ├── edit.html        # 图片编辑
│   ├── video_create.html # 视频创作
│   ├── batch.html       # 批量任务
│   ├── admin.html       # 用户管理
│   └── login.html       # 登录页
├── static/              # 静态资源
│   ├── style.css        # 主样式
│   ├── script.js        # 主脚本
│   ├── video_create.js  # 视频创作脚本
│   ├── upload.js        # 上传脚本
│   ├── edit.js          # 编辑脚本
│   ├── template-images/ # 模板图片
│   └── ...
├── data/                # 数据目录
│   ├── templates/      # 模板图片源文件
│   └── {user_id}/      # 用户数据（按用户 ID 组织）
│       ├── images/     # 用户生成的图片
│       └── videos/     # 用户生成的视频
├── venv/                # Python 虚拟环境
└── DEPLOYMENT.md       # 本部署文档
```

---

## 视频生成功能说明

### 阿里云百炼 API 配置

视频生成功能使用阿里云百炼的 Wanx 模型，需要：

1. **获取 API Key**
   - 注册阿里云百炼账号
   - 获取 API Key

2. **配置环境变量**
   ```bash
   DASHSCOPE_API_KEY=your-api-key
   DASHSCOPE_REGION=singapore  # 或 beijing
   ```

3. **支持的模型**
   - `wan2.7-i2v` - 高质量视频生成
   - `wan2.2-kf2v-flash` - 快速视频生成

4. **功能特点**
   - 支持首尾帧视频生成
   - 可选分辨率：480P/720P/1080P
   - 可选时长：3/5/10/15 秒
   - 支持 Prompt 智能改写

---

*文档版本: 1.0*
*最后更新: 2026-04-15*
