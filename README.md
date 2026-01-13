# SOURCE

> 实体印刷色彩实操体系 —— 不被定义的色彩：一个基于现实验证的色彩体系

---

## 项目定位

SOURCE 是一个连接数字设计与实体印刷的**色彩标准系统**，由三个核心组件构成：

| 组件 | 职能 | 说明 |
|------|------|------|
| **官网** | 信息门户 | 色彩身份证、生产指导书、打样包入口 |
| **CLI** | 系统接口 | AI/脚本可调用的结构化命令 |
| **插件** | 设计入口 | Adobe PS/AI/ID 插件（独立仓库） |

```
SOURCE 不是一个商城
SOURCE 也不是一个插件
SOURCE 是一个"标准系统"，其它都是围绕它旋转的接口层
```

---

## 核心概念

### 色彩身份证

每个固定色号拥有一页专属的"身份证"，包含：

- **真源数据**：分光仪采集的绝对 Lab 值
- **材质表现**：在 5 种纸张上的实测数据与扫描图
- **油墨配方**：印厂机长可直接依据的调墨比例

### CLI-first AI 架构

```
AI 是放大器，不是基础设施
CLI 是系统接口，不是玩具
```

- AI 只能执行白名单 CLI 命令
- 每次调用都留下审计日志
- 不做提示词工程，用硬接口保证可靠性

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS + Lucide Icons |
| 数据 | PostgreSQL + Prisma + tRPC |
| 状态 | XState v5 + Zustand |
| 认证 | NextAuth.js (Auth.js) |
| CLI | Commander.js |

---

## 目录结构

```
SOURCE/
├── 文档/                          # 项目文档（中文命名）
│   ├── 技术架构规划.md            # 功能与技术设计
│   ├── 产品设计/                  # 产品规范文档
│   ├── 开发进度管理/
│   │   └── 版本计划表.md          # 版本节奏与验收目标
│   └── 运营思路/
│
├── apps/
│   └── web/                       # Next.js 官网应用
│
├── packages/
│   ├── cli/                       # SOURCE CLI
│   ├── color-core/                # 色彩核心逻辑
│   └── api-types/                 # API 类型定义
│
├── pnpm-workspace.yaml
└── README.md
```

---

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### 一键启动（推荐）

```bash
# 首次启动（自动完成所有配置）
./scripts/dev.sh

# 或使用 pnpm
pnpm start
```

脚本会自动：
- ✅ 检查 Node.js/pnpm 版本
- ✅ 启动数据库容器
- ✅ 安装依赖
- ✅ 生成 Prisma Client
- ✅ 创建环境变量文件
- ✅ 启动开发服务器
- ✅ 打开浏览器

### 启动脚本选项

```bash
./scripts/dev.sh              # 正常启动
./scripts/dev.sh --fresh      # 完全重新安装依赖
./scripts/dev.sh --skip-db    # 跳过数据库检查
./scripts/dev.sh --no-open    # 不自动打开浏览器
```

### Docker 容器管理

```bash
# 容器生命周期
pnpm docker:start     # 启动容器
pnpm docker:stop      # 停止容器
pnpm docker:restart   # 重启容器
pnpm docker:status    # 查看状态

# 容器维护
pnpm docker:rebuild   # 重建容器（保留数据）
pnpm docker:reset     # 完全重置（删除数据）⚠️
pnpm docker:clean     # 清理缓存和悬空镜像

# 数据库操作
pnpm docker:logs      # 查看实时日志
pnpm docker:shell     # 进入 psql 命令行
pnpm docker:backup    # 备份数据库

# 恢复数据库
./scripts/docker.sh restore backups/source_backup_xxx.sql.gz
```

### 手动配置（可选）

<details>
<summary>展开手动配置步骤</summary>

#### 1. 启动数据库

```bash
docker compose up -d
```

数据库配置：
- 端口：`5434`（避免与本机 PG 冲突）
- 用户：`source`
- 密码：`source_dev_password`
- 数据库：`source`

#### 2. 配置环境变量

```bash
cd apps/web

cat > .env.local << 'EOF'
DATABASE_URL="postgresql://source:source_dev_password@localhost:5434/source"
NEXTAUTH_SECRET="dev-secret-do-not-use-in-production"
NEXTAUTH_URL="http://localhost:3000"
EOF
```

#### 3. 安装依赖

```bash
cd ../..
pnpm install
pnpm --filter @source/web db:generate
pnpm --filter @source/web db:push
pnpm --filter @source/web db:seed
```

#### 4. 启动开发服务器

```bash
pnpm dev
```

</details>

### 数据库管理

```bash
pnpm db:studio    # 打开 Prisma Studio（可视化管理）
pnpm db:push      # 同步数据库结构
pnpm db:seed      # 填充种子数据
pnpm db:reset     # 重置数据库（清空并重新填充）
```

---

## CLI 命令

### 安装与配置

```bash
# 构建 CLI
pnpm build:cli

# 配置服务器地址（开发环境）
SOURCE_SERVER_URL=http://localhost:3000 pnpm cli config test

# 设置 API Key
pnpm cli config set-key sk_source_your_api_key

# 查看当前配置
pnpm cli config show
```

### 常用命令

```bash
# 获取色彩身份证
pnpm cli color get CN-Song-04

# 获取色彩列表
pnpm cli color list --limit 10

# 获取纸张表现数据
pnpm cli color paper CN-Song-04

# 搜索色彩
pnpm cli search "青"

# 纸张推荐
pnpm cli color recommend CN-Song-04 --goal fidelity

# 成本估算
pnpm cli cost estimate --paper art-coated --quantity 1000 --size A4 --colors 4

# 工程分析
pnpm cli analyze --file ./my-design.sourcepack.json

# 审计日志
pnpm cli audit list --limit 10

# 查看可用工具
pnpm cli config tools
```

### JSON 输出模式（AI/脚本调用）

```bash
# 所有命令都支持 --json 参数
pnpm cli --json color get CN-Song-04
pnpm cli --json search "青"
pnpm cli --json analyze --file ./design.json
```

---

## 开发规范

### 强制约束

- UI 组件：**仅使用 shadcn/ui**
- 图标：**仅使用 Lucide Icons**（禁止 Emoji）
- 文档命名：**中文**
- 流程建模：**状态机**（禁止页面驱动流程）

### AI 可操作性检查

每个功能上线前，必须通过：

- [ ] 该功能是否有对应的 tRPC procedure？
- [ ] AI 是否能通过 CLI 完成该操作，无需 UI？
- [ ] 流程是否用状态机建模？
- [ ] 错误信息是否结构化（code + message）？

---

## 版本计划

| 版本 | 代号 | 核心目标 | 状态 |
|------|------|---------|------|
| 0.1.x | Foundation | 项目脚手架、基础框架、AI-ready 基建 | ✅ 完成 |
| 0.2.x | Identity | 色彩身份证 + 数据录入 | ✅ 完成 |
| 0.3.x | Bridge | 履约桥（SKU + 购买意图） | ✅ 完成 |
| 0.4.x | Access | 权限体系、插件授权 | ✅ 完成 |
| 0.5.x | Admin | 管理后台 | ✅ 完成 |
| 0.6.x | Analyze | 工程色彩分析系统 | ✅ 完成 |
| 1.0.0 | Genesis | 正式版发布 | 🚧 准备中 |

### 当前进度 (v0.6.3)

**已完成功能：**

- [x] 色彩身份证系统（双模式：设计师/专家）
- [x] 色彩库（搜索、筛选、三种视图模式）
- [x] 色彩簿管理
- [x] 社区作品展示
- [x] 用户账户系统
- [x] 共建者体系（印厂/纸商/油墨商/实验室/顾问）
- [x] 数据录入工具（CSV/JSON 导入）
- [x] 履约桥（SKU + 购买意图）
- [x] 激活码系统
- [x] 插件授权 API
- [x] SOURCE CLI（15+ 命令）
- [x] 管理后台（完整数据管理）
- [x] 工程色彩分析（上传、推荐、报告）
- [x] E2E 测试（5 测试套件）

详见 [版本计划表](./文档/开发进度管理/版本计划表.md)

---

## 页面路由

### 前台页面

| 路由 | 说明 |
|------|------|
| `/` | 首页 |
| `/colors` | 色彩库列表 |
| `/color/[id]` | 色彩身份证详情 |
| `/color-books` | 色彩簿列表 |
| `/color-book/[slug]` | 色彩簿详情 |
| `/works` | 社区作品 |
| `/partners` | 共建者列表 |
| `/partners/[id]` | 共建者详情 |
| `/analyze` | 工程分析 |
| `/analyze/[id]` | 分析报告 |
| `/docs` | 支持文档首页 |
| `/docs/color-identity` | 色彩身份证文档 |
| `/docs/cli` | CLI 命令参考 |
| `/docs/api` | API 参考 |

### 用户账户

| 路由 | 说明 |
|------|------|
| `/login` | 登录 |
| `/register` | 注册 |
| `/forgot-password` | 忘记密码 |
| `/activate` | 激活码激活 |
| `/account` | 账户概览 |
| `/account/profile` | 个人资料 |
| `/account/security` | 安全设置 |
| `/account/api-keys` | API 密钥管理 |
| `/account/assets` | 色彩资产 |
| `/account/works` | 我的作品 |
| `/settings` | 用户设置 |

### 管理后台

| 路由 | 说明 |
|------|------|
| `/admin` | 仪表盘 |
| `/admin/colors` | 色彩管理 |
| `/admin/color-books` | 色彩簿管理 |
| `/admin/partners` | 共建者管理 |
| `/admin/recipes` | 配方管理 |
| `/admin/inks` | 油墨管理 |
| `/admin/paper-types` | 纸张类型管理 |
| `/admin/batches` | 批次管理 |
| `/admin/proofing-packs` | 打样包管理 |
| `/admin/users` | 用户管理 |
| `/admin/api-keys` | API 密钥管理 |
| `/admin/activation-codes` | 激活码管理 |
| `/admin/buy-intents` | 购买意图统计 |
| `/admin/audit-logs` | 审计日志 |
| `/admin/audit-notes` | 审计注记 |
| `/admin/import` | 数据导入 |

---

## 文档索引

| 文档 | 说明 |
|------|------|
| [技术架构规划](./文档/技术架构规划.md) | 功能设计、技术选型、数据模型 |
| [版本计划表](./文档/开发进度管理/版本计划表.md) | 版本节奏、验收标准、时间线 |
| [色彩身份证字段规范](./文档/产品设计/色彩身份证字段规范.md) | Color Identity v1.0 字段定义 |
| [列表页面视觉交互规范](./文档/产品设计/列表页面视觉交互规范.md) | 前台列表页设计标准 |
| [部署指南](./文档/部署指南.md) | 生产环境部署说明 |

---

## 用户角色体系

| 角色 | 代码 | 权限说明 |
|------|------|----------|
| 管理员 | `ADMIN` | 全部权限 |
| 运营人员 | `OPERATOR` | 数据管理、内容发布 |
| 审计成员 | `AUDITOR` | 数据审核、质量把控 |
| 合作方用户 | `PARTNER` | 关联到 Partner，查看相关数据 |
| 普通用户 | `USER` | 基础访问 |

## 共建者体系

| 类型 | 代码 | 说明 |
|------|------|------|
| 印厂 | `PRINTER` | 印刷打样、生产验证 |
| 纸商 | `PAPER_VENDOR` | 提供纸张、纸张数据 |
| 油墨商 | `INK_VENDOR` | 提供油墨、配方建议 |
| 实验室 | `LAB` | 检测机构、数据采集 |
| 顾问 | `CONSULTANT` | 专家顾问、研究合作 |

### 颜色参与关联（ColorParticipation）

核心关联表，记录任何"人/机构/共建者"与 Color ID 的参与关系：

- **entityType**: 共建者类型（Partner / User / External）
- **roleInColor**: 在该颜色中承担的角色（印厂/纸商/油墨商/审计/共建/测试）
- **scope**: 参与范围（身份证/配方/批次/研究）
- **status**: 状态（active / inactive / revoked / expired）
- **evidence**: 证据链（报告/批次/ColLab/文档）

---

## License

Private - All Rights Reserved

---

*不被定义的色彩：一个基于现实验证的色彩体系*
