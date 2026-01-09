#!/bin/bash
# =============================================================================
# SOURCE Docker 容器管理脚本
# =============================================================================
# 用法: ./scripts/docker.sh <命令> [选项]
# 命令:
#   start       启动所有容器
#   stop        停止所有容器
#   restart     重启所有容器
#   rebuild     重建容器（保留数据）
#   reset       完全重置（删除数据）
#   clean       清理缓存和悬空镜像
#   logs        查看容器日志
#   status      显示容器状态
#   shell       进入数据库容器
#   backup      备份数据库
#   restore     恢复数据库
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# 图标
CHECK="✓"
CROSS="✗"
ARROW="→"
DOCKER="🐳"
DATABASE="🗄️"
TRASH="🗑️"
BACKUP="💾"

# 配置
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
DB_CONTAINER="source-db"
DB_USER="source"
DB_NAME="source"
DB_PORT=5434

# =============================================================================
# 工具函数
# =============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}     ${DOCKER} ${GREEN}SOURCE Docker 管理器${NC}                               ${CYAN}║${NC}"
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
    echo "用法: ./scripts/docker.sh <命令> [选项]"
    echo ""
    echo "命令:"
    echo "  ${GREEN}start${NC}       启动所有容器"
    echo "  ${GREEN}stop${NC}        停止所有容器"
    echo "  ${GREEN}restart${NC}     重启所有容器"
    echo "  ${GREEN}rebuild${NC}     重建容器（保留数据卷）"
    echo "  ${YELLOW}reset${NC}       完全重置（删除所有数据）"
    echo "  ${GREEN}clean${NC}       清理缓存和悬空镜像"
    echo "  ${GREEN}logs${NC}        查看容器日志 [-f 跟踪]"
    echo "  ${GREEN}status${NC}      显示容器状态"
    echo "  ${GREEN}shell${NC}       进入数据库 psql 命令行"
    echo "  ${GREEN}backup${NC}      备份数据库"
    echo "  ${GREEN}restore${NC}     恢复数据库 <backup_file>"
    echo ""
    echo "选项:"
    echo "  -f, --follow    跟踪日志输出（用于 logs 命令）"
    echo "  -y, --yes       跳过确认提示"
    echo "  --help          显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./scripts/docker.sh start           # 启动容器"
    echo "  ./scripts/docker.sh logs -f         # 实时查看日志"
    echo "  ./scripts/docker.sh backup          # 备份数据库"
    echo "  ./scripts/docker.sh restore backup.sql  # 恢复数据库"
    echo "  ./scripts/docker.sh reset -y        # 强制重置（跳过确认）"
    exit 0
}

check_docker() {
    if ! docker info &> /dev/null; then
        print_error "Docker 未运行，请先启动 Docker Desktop"
        exit 1
    fi
}

# =============================================================================
# 命令实现
# =============================================================================

cmd_start() {
    print_header
    check_docker
    
    print_step "${DOCKER} 启动容器..."
    cd "$PROJECT_ROOT"
    docker compose up -d
    
    print_info "等待数据库就绪..."
    for i in {1..30}; do
        if docker exec $DB_CONTAINER pg_isready -U $DB_USER -d $DB_NAME &> /dev/null; then
            print_success "数据库已就绪"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "数据库启动超时"
            exit 1
        fi
        sleep 1
    done
    
    echo ""
    print_success "容器启动完成"
    echo ""
    echo -e "  ${CYAN}PostgreSQL:${NC}  localhost:$DB_PORT"
    echo -e "  ${CYAN}用户名:${NC}      $DB_USER"
    echo -e "  ${CYAN}数据库:${NC}      $DB_NAME"
    echo ""
}

cmd_stop() {
    print_header
    check_docker
    
    print_step "停止容器..."
    cd "$PROJECT_ROOT"
    docker compose down
    
    print_success "容器已停止"
}

cmd_restart() {
    print_header
    check_docker
    
    print_step "重启容器..."
    cd "$PROJECT_ROOT"
    docker compose restart
    
    print_info "等待数据库就绪..."
    sleep 3
    for i in {1..30}; do
        if docker exec $DB_CONTAINER pg_isready -U $DB_USER -d $DB_NAME &> /dev/null; then
            print_success "容器重启完成"
            break
        fi
        sleep 1
    done
}

cmd_rebuild() {
    print_header
    check_docker
    
    print_step "重建容器（保留数据卷）..."
    cd "$PROJECT_ROOT"
    
    # 停止并删除容器（保留卷）
    docker compose down
    
    # 拉取最新镜像
    print_step "拉取最新镜像..."
    docker compose pull
    
    # 重新创建并启动
    print_step "创建新容器..."
    docker compose up -d --force-recreate
    
    print_info "等待数据库就绪..."
    sleep 3
    for i in {1..30}; do
        if docker exec $DB_CONTAINER pg_isready -U $DB_USER -d $DB_NAME &> /dev/null; then
            print_success "容器重建完成（数据已保留）"
            break
        fi
        sleep 1
    done
}

cmd_reset() {
    print_header
    check_docker
    
    if [ "$SKIP_CONFIRM" != true ]; then
        echo -e "${RED}⚠️  警告: 此操作将删除所有数据！${NC}"
        echo ""
        read -p "确定要继续吗？输入 'yes' 确认: " confirm
        if [ "$confirm" != "yes" ]; then
            print_info "操作已取消"
            exit 0
        fi
    fi
    
    print_step "${TRASH} 完全重置..."
    cd "$PROJECT_ROOT"
    
    # 停止并删除容器和卷
    docker compose down -v
    
    # 删除命名卷
    docker volume rm source_postgres_data 2>/dev/null || true
    
    print_success "容器和数据卷已删除"
    
    # 重新创建
    print_step "重新创建容器..."
    docker compose up -d
    
    print_info "等待数据库就绪..."
    sleep 5
    for i in {1..30}; do
        if docker exec $DB_CONTAINER pg_isready -U $DB_USER -d $DB_NAME &> /dev/null; then
            break
        fi
        sleep 1
    done
    
    # 提示运行 seed
    echo ""
    print_success "重置完成"
    echo ""
    print_info "数据库已清空，请运行以下命令初始化数据："
    echo ""
    echo -e "  ${CYAN}pnpm db:push${NC}      # 同步数据库结构"
    echo -e "  ${CYAN}pnpm db:seed${NC}      # 填充初始数据"
    echo ""
}

cmd_clean() {
    print_header
    check_docker
    
    print_step "${TRASH} 清理 Docker 缓存..."
    
    # 清理悬空镜像
    print_info "清理悬空镜像..."
    DANGLING=$(docker images -f "dangling=true" -q)
    if [ -n "$DANGLING" ]; then
        docker rmi $DANGLING
        print_success "悬空镜像已清理"
    else
        print_info "没有悬空镜像"
    fi
    
    # 清理未使用的网络
    print_info "清理未使用的网络..."
    docker network prune -f
    
    # 清理构建缓存
    print_info "清理构建缓存..."
    docker builder prune -f
    
    # 显示空间使用
    echo ""
    print_success "清理完成"
    echo ""
    docker system df
}

cmd_logs() {
    check_docker
    
    cd "$PROJECT_ROOT"
    if [ "$FOLLOW_LOGS" = true ]; then
        docker compose logs -f
    else
        docker compose logs --tail=100
    fi
}

cmd_status() {
    print_header
    check_docker
    
    echo -e "${CYAN}容器状态:${NC}"
    echo ""
    docker compose ps
    echo ""
    
    # 检查数据库连接
    if docker exec $DB_CONTAINER pg_isready -U $DB_USER -d $DB_NAME &> /dev/null; then
        echo -e "${GREEN}${CHECK} 数据库连接正常${NC}"
    else
        echo -e "${RED}${CROSS} 数据库连接失败${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}资源使用:${NC}"
    echo ""
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || true
}

cmd_shell() {
    check_docker
    
    print_info "进入数据库命令行..."
    echo ""
    docker exec -it $DB_CONTAINER psql -U $DB_USER -d $DB_NAME
}

cmd_backup() {
    print_header
    check_docker
    
    # 创建备份目录
    mkdir -p "$BACKUP_DIR"
    
    # 生成备份文件名
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/source_backup_$TIMESTAMP.sql"
    
    print_step "${BACKUP} 备份数据库..."
    
    docker exec $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME > "$BACKUP_FILE"
    
    # 压缩
    gzip "$BACKUP_FILE"
    
    print_success "备份完成"
    echo ""
    echo -e "  ${CYAN}文件:${NC} ${BACKUP_FILE}.gz"
    echo -e "  ${CYAN}大小:${NC} $(du -h "${BACKUP_FILE}.gz" | cut -f1)"
    echo ""
}

cmd_restore() {
    print_header
    check_docker
    
    if [ -z "$RESTORE_FILE" ]; then
        print_error "请指定备份文件"
        echo ""
        echo "用法: ./scripts/docker.sh restore <backup_file>"
        echo ""
        echo "可用备份:"
        ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  没有找到备份文件"
        exit 1
    fi
    
    if [ ! -f "$RESTORE_FILE" ]; then
        print_error "备份文件不存在: $RESTORE_FILE"
        exit 1
    fi
    
    if [ "$SKIP_CONFIRM" != true ]; then
        echo -e "${YELLOW}⚠️  警告: 此操作将覆盖现有数据！${NC}"
        echo ""
        read -p "确定要继续吗？(y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "操作已取消"
            exit 0
        fi
    fi
    
    print_step "恢复数据库..."
    
    # 解压（如果是 .gz 文件）
    if [[ "$RESTORE_FILE" == *.gz ]]; then
        print_info "解压备份文件..."
        gunzip -c "$RESTORE_FILE" | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME
    else
        docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < "$RESTORE_FILE"
    fi
    
    print_success "数据库恢复完成"
}

# =============================================================================
# 参数解析
# =============================================================================

COMMAND=""
FOLLOW_LOGS=false
SKIP_CONFIRM=false
RESTORE_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        start|stop|restart|rebuild|reset|clean|logs|status|shell|backup|restore)
            COMMAND=$1
            shift
            ;;
        -f|--follow)
            FOLLOW_LOGS=true
            shift
            ;;
        -y|--yes)
            SKIP_CONFIRM=true
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            if [ "$COMMAND" = "restore" ] && [ -z "$RESTORE_FILE" ]; then
                RESTORE_FILE=$1
            else
                print_error "未知参数: $1"
                echo "使用 --help 查看帮助"
                exit 1
            fi
            shift
            ;;
    esac
done

# =============================================================================
# 执行命令
# =============================================================================

cd "$PROJECT_ROOT"

case $COMMAND in
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    rebuild)
        cmd_rebuild
        ;;
    reset)
        cmd_reset
        ;;
    clean)
        cmd_clean
        ;;
    logs)
        cmd_logs
        ;;
    status)
        cmd_status
        ;;
    shell)
        cmd_shell
        ;;
    backup)
        cmd_backup
        ;;
    restore)
        cmd_restore
        ;;
    *)
        show_help
        ;;
esac
