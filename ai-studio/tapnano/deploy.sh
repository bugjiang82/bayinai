#!/bin/bash

# ============================================
# TapNano 自动部署脚本
# ============================================

set -e

echo "========================================"
echo "  TapNano 自动部署脚本"
echo "========================================"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

echo ""
echo "步骤 1/7: 安装系统依赖..."
echo "----------------------------------------"

apt update
apt install -y python3 python3-pip python3-venv nginx git curl
apt install -y python3-dev build-essential libjpeg-dev zlib1g-dev

echo ""
echo "步骤 2/7: 创建用户和目录..."
echo "----------------------------------------"

# 创建用户（如果不存在）
if ! id "nano" &>/dev/null; then
    useradd -m -s /bin/bash nano
    echo "用户 nano 已创建"
else
    echo "用户 nano 已存在"
fi

# 设置目录权限
chown -R nano:nano "$PROJECT_DIR"

echo ""
echo "步骤 3/7: 创建 Python 虚拟环境..."
echo "----------------------------------------"

cd "$PROJECT_DIR"

if [ -d "venv" ]; then
    echo "虚拟环境已存在，跳过创建"
else
    python3 -m venv venv
    echo "虚拟环境已创建"
fi

echo ""
echo "步骤 4/7: 安装 Python 依赖..."
echo "----------------------------------------"

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "步骤 5/7: 初始化数据库..."
echo "----------------------------------------"

if [ -f ".env" ]; then
    echo ".env 文件已存在，跳过创建"
else
    cp .env.template .env
    echo ".env 文件已创建，请编辑配置 API Key"
fi

python3 init_templates.py

echo ""
echo "步骤 6/7: 配置 Nginx..."
echo "----------------------------------------"

cp nginx.conf /etc/nginx/sites-available/tapnano
ln -sf /etc/nginx/sites-available/tapnano /etc/nginx/sites-enabled/

# 移除默认站点（如果存在）
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

nginx -t
systemctl restart nginx
echo "Nginx 已配置并重启"

echo ""
echo "步骤 7/7: 配置 Systemd 服务..."
echo "----------------------------------------"

cat > /etc/systemd/system/tapnano.service << 'EOF'
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
EOF

systemctl daemon-reload
systemctl enable tapnano
systemctl start tapnano

echo ""
echo "========================================"
echo "  部署完成!"
echo "========================================"
echo ""
echo "服务状态:"
systemctl status tapnano --no-pager
echo ""
echo "请编辑 $PROJECT_DIR/.env 文件配置 API Key"
echo "然后访问 http://你的服务器IP"
echo ""
echo "常用命令:"
echo "  查看日志: journalctl -u tapnano -f"
echo "  重启服务: systemctl restart tapnano"
echo "  停止服务: systemctl stop tapnano"
echo "========================================"
