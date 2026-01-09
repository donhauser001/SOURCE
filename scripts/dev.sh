#!/bin/bash
# =============================================================================
# SOURCE 前端快速启动脚本
# =============================================================================
# 用法: ./scripts/dev.sh [选项]
# 选项:
#   --fresh     完全重新安装依赖
#   --skip-db   跳过数据库检查
#   --no-open   不自动打开浏览器
#   --help      显示帮助信息
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 图标
CHECK="✓"
CROSS="✗"
ARROW="→"
ROCKET="🚀"
DATABASE="🗄️"
PACKAGE="📦"

# 配置
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$PROJECT_ROOT/apps/web"
DEFAULT_PORT=3000
DB_PORT=5434

# 参数
FRESH_INSTALL=false
SKIP_DB=false
AUTO_OPEN=true

# =============================================================================
# 工具函数
# =============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}     ${ROCKET} ${GREEN}SOURCE 开发环境启动器${NC}                              ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}${ARROW}${NC} $1"
}

print_success() {
    echo -e "${GREEN}${CHECK}${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_error() {
    echo -e "${RED}${CROSS}${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

show_help() {
    echo "用法: ./scripts/dev.sh [选项]"
    echo ""
    echo "选项:"
    echo "  --fresh     完全重新安装依赖（删除 node_modules）"
    echo "  --skip-db   跳过数据库检查"
    echo "  --no-open   不自动打开浏览器"
    echo "  --help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./scripts/dev.sh              # 正常启动"
    echo "  ./scripts/dev.sh --fresh      # 重新安装依赖后启动"
    echo "  ./scripts/dev.sh --skip-db    # 跳过数据库检查"
    exit 0
}

# =============================================================================
# 解析参数
# =============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --fresh)
            FRESH_INSTALL=true
            shift
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --no-open)
            AUTO_OPEN=false
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            print_error "未知参数: $1"
            echo "使用 --help 查看帮助"
            exit 1
            ;;
    esac
done

# =============================================================================
# 主流程
# =============================================================================

cd "$PROJECT_ROOT"

print_header

# 1. 检查 Node.js 版本
print_step "检查 Node.js 版本..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js 版本过低，需要 v20+，当前版本: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v)"

# 2. 检查 pnpm
print_step "检查 pnpm..."
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm 未安装，正在安装..."
    npm install -g pnpm@9
fi
print_success "pnpm $(pnpm -v)"

# 3. 检查数据库
if [ "$SKIP_DB" = false ]; then
    print_step "${DATABASE} 检查数据库连接..."
    
    # 检查 Docker 是否运行
    if ! docker info &> /dev/null; then
        print_error "Docker 未运行，请先启动 Docker"
        echo "  或使用 --skip-db 跳过数据库检查"
        exit 1
    fi
    
    # 检查容器是否存在
    if ! docker ps -a --format '{{.Names}}' | grep -q "source-db"; then
        print_warning "数据库容器不存在，正在创建..."
        docker compose up -d db
        sleep 3
    fi
    
    # 检查容器是否运行
    if ! docker ps --format '{{.Names}}' | grep -q "source-db"; then
        print_warning "数据库容器未运行，正在启动..."
        docker compose up -d db
        sleep 3
    fi
    
    # 等待数据库就绪
    print_info "等待数据库就绪..."
    for i in {1..30}; do
        if docker exec source-db pg_isready -U source -d source &> /dev/null; then
            print_success "数据库已就绪 (localhost:$DB_PORT)"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "数据库启动超时"
            exit 1
        fi
        sleep 1
    done
fi

# 4. 安装依赖
print_step "${PACKAGE} 安装依赖..."
if [ "$FRESH_INSTALL" = true ]; then
    print_info "清理旧依赖..."
    rm -rf node_modules
    rm -rf apps/*/node_modules
    rm -rf packages/*/node_modules
    pnpm install
else
    # 检查是否需要安装
    if [ ! -d "node_modules" ]; then
        pnpm install
    else
        pnpm install --prefer-offline
    fi
fi
print_success "依赖安装完成"

# 5. 生成 Prisma Client
print_step "生成 Prisma Client..."
cd "$WEB_DIR"
pnpm db:generate
print_success "Prisma Client 已生成"
cd "$PROJECT_ROOT"

# 6. 检查环境变量
print_step "检查环境变量..."
if [ ! -f "$WEB_DIR/.env" ] && [ ! -f "$WEB_DIR/.env.local" ]; then
    print_warning "未找到环境变量文件，创建默认配置..."
    cat > "$WEB_DIR/.env.local" << 'EOF'
# 数据库连接
DATABASE_URL="postgresql://source:source_dev_password@localhost:5434/source"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"

# 邮件验证（开发环境使用控制台输出）
EMAIL_SERVER=""
EMAIL_FROM=""
EOF
    print_success "已创建 .env.local"
else
    print_success "环境变量文件存在"
fi

# 7. 检查端口
print_step "检查端口 $DEFAULT_PORT..."
if lsof -Pi :$DEFAULT_PORT -sTCP:LISTEN -t &> /dev/null; then
    print_warning "端口 $DEFAULT_PORT 已被占用"
    PID=$(lsof -Pi :$DEFAULT_PORT -sTCP:LISTEN -t)
    read -p "是否终止进程 $PID？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $PID 2>/dev/null || true
        print_success "已终止进程"
    else
        print_info "将尝试使用其他端口"
    fi
fi

# 8. 启动开发服务器
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ${ROCKET} 启动开发服务器...${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}Web:${NC}      http://localhost:$DEFAULT_PORT"
echo -e "  ${CYAN}API:${NC}      http://localhost:$DEFAULT_PORT/api"
echo -e "  ${CYAN}tRPC:${NC}     http://localhost:$DEFAULT_PORT/api/trpc"
echo -e "  ${CYAN}数据库:${NC}   postgresql://localhost:$DB_PORT/source"
echo ""
echo -e "  ${YELLOW}按 Ctrl+C 停止服务器${NC}"
echo ""

# 自动打开浏览器
if [ "$AUTO_OPEN" = true ]; then
    (sleep 3 && open "http://localhost:$DEFAULT_PORT" 2>/dev/null || xdg-open "http://localhost:$DEFAULT_PORT" 2>/dev/null) &
fi

# 启动 Next.js
pnpm dev
