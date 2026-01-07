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

### 1. 启动数据库（Docker）

```bash
# 启动 PostgreSQL 容器
docker compose up -d

# 查看容器状态
docker compose ps
```

数据库配置：
- 端口：`5434`（避免与本机 PG 冲突）
- 用户：`source`
- 密码：`source_dev_password`
- 数据库：`source`

### 2. 配置环境变量

```bash
cd apps/web

# 创建 .env 文件
cat > .env << 'EOF'
DATABASE_URL="postgresql://source:source_dev_password@localhost:5434/source"
NEXTAUTH_SECRET="dev-secret-do-not-use-in-production"
NEXTAUTH_URL="http://localhost:3000"
EOF
```

### 3. 安装依赖并初始化数据库

```bash
# 回到项目根目录
cd ../..

# 安装依赖
pnpm install

# 生成 Prisma Client
pnpm --filter @source/web db:generate

# 推送数据库 Schema
pnpm --filter @source/web db:push

# 填充种子数据
pnpm --filter @source/web db:seed
```

### 4. 启动开发服务器

```bash
# 启动 Next.js（支持热更新）
pnpm --filter @source/web dev
```

访问 http://localhost:3000

### 数据库管理

```bash
# 打开 Prisma Studio（可视化数据库管理）
pnpm --filter @source/web db:studio

# 重置数据库（清空并重新填充）
pnpm --filter @source/web db:reset

# 创建数据库迁移
pnpm --filter @source/web db:migrate
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

# 查看可用工具
pnpm cli config tools
```

### JSON 输出模式（AI/脚本调用）

```bash
# 所有命令都支持 --json 参数
pnpm cli --json color get CN-Song-04
pnpm cli --json search "青"
pnpm cli --json config show
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
| 0.2.x | Identity | 色彩身份证 + 数据录入 | 🚧 进行中 |
| 0.3.x | Bridge | 履约桥（SKU + 购买意图） | 待开发 |
| 0.4.x | Access | 权限体系、插件授权 | 待开发 |
| 0.5.x | Admin | 管理后台 | 待开发 |
| 0.6.x | Analyze | 工程色彩分析系统 | 待开发 |
| 1.0.0 | Genesis | 正式版发布 | 待开发 |

### 当前进度 (v0.2.1)

- [x] v0.1.0 项目脚手架
- [x] v0.1.1 数据库与 ORM
- [x] v0.1.2 API 层与认证
- [x] v0.1.3 AI-ready 基建
- [x] v0.1.4 SOURCE CLI 骨架
- [x] v0.2.0 色彩数据 CRUD
- [x] v0.2.1 色彩身份证页面
- [ ] v0.2.2 色彩搜索
- [ ] v0.2.3 CLI 色彩命令
- [ ] v0.2.4 数据录入工具

详见 [版本计划表](./文档/开发进度管理/版本计划表.md)

---

## 页面路由

| 路由 | 说明 |
|------|------|
| `/` | 首页 |
| `/colors` | 色彩库列表 |
| `/color/[id]` | 色彩身份证详情 |
| `/analyze` | 工程分析（占位） |
| `/docs` | 文档首页 |
| `/docs/color-identity` | 色彩身份证文档 |
| `/docs/cli` | CLI 命令参考 |
| `/docs/api` | API 参考 |
| `/login` | 登录页面 |
| `/settings` | 用户设置 |

---

## 文档索引

| 文档 | 说明 |
|------|------|
| [技术架构规划](./文档/技术架构规划.md) | 功能设计、技术选型、数据模型 |
| [版本计划表](./文档/开发进度管理/版本计划表.md) | 版本节奏、验收标准、时间线 |
| [色彩身份证字段规范](./文档/产品设计/色彩身份证字段规范.md) | Color Identity v1.0 字段定义 |

## 用户角色体系

| 角色 | 代码 | 权限说明 |
|------|------|----------|
| 管理员 | `ADMIN` | 全部权限 |
| 运营人员 | `OPERATOR` | 数据管理、内容发布 |
| 审计成员 | `AUDITOR` | 数据审核、质量把控 |
| 合作方用户 | `PARTNER` | 关联到 Partner，查看相关数据 |
| 普通用户 | `USER` | 基础访问 |

## 合作者体系

| 类型 | 代码 | 说明 |
|------|------|------|
| 印厂 | `PRINTER` | 印刷打样、生产验证 |
| 纸商 | `PAPER_VENDOR` | 提供纸张、纸张数据 |
| 油墨商 | `INK_VENDOR` | 提供油墨、配方建议 |
| 实验室 | `LAB` | 检测机构、数据采集 |
| 顾问 | `CONSULTANT` | 专家顾问、研究合作 |

### 颜色参与关联（ColorParticipation）

核心关联表，记录任何"人/机构/合作者"与 Color ID 的参与关系：

- **entityType**: 参与者类型（Partner / User / External）
- **roleInColor**: 在该颜色中承担的角色（印厂/纸商/油墨商/审计/共建/测试）
- **scope**: 参与范围（身份证/配方/批次/研究）
- **status**: 状态（active / inactive / revoked / expired）
- **evidence**: 证据链（报告/批次/ColLab/文档）

---

## License

Private - All Rights Reserved

---

*不被定义的色彩：一个基于现实验证的色彩体系*

