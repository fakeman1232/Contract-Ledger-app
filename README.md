<div align="center">

# 📋 Contract Ledger Management System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org/)

**一款功能完备的合同台账管理系统，支持 PDF 智能识别、合同全生命周期管理、计价与付款跟踪等核心功能**

[快速开始](#快速开始) • [功能特性](#功能特性) • [使用文档](#使用文档) • [贡献指南](#贡献指南)

</div>

---

## 📖 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [演示截图](#演示截图)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [使用文档](#使用文档)
- [API 文档](#api-文档)
- [开发指南](#开发指南)
- [测试](#测试)
- [部署](#部署)
- [常见问题](#常见问题)
- [路线图](#路线图)
- [贡献指南](#贡献指南)
- [许可证](#许可证)
- [联系方式](#联系方式)
- [致谢](#致谢)

---

## 📝 项目简介

Contract Ledger Management System 是一款专为工程项目打造的合同台账管理工具。通过智能 PDF 识别技术，自动提取合同关键信息，大幅减少手工录入工作量。系统提供完整的合同生命周期管理功能，包括合同创建、计价跟踪、付款管理、数据验证和报表导出等，帮助团队高效管理项目合同数据。

### ✨ 核心价值

- **🤖 智能识别**：PDF 文档自动解析，一键提取合同信息
- **📊 可视化跟踪**：月度时间轴直观展示计价与付款进度
- **🔒 数据安全**：本地 SQLite 数据库，数据完全自主掌控
- **🎨 跨平台**：支持 Windows、macOS、Linux 多平台运行
- **🚀 开箱即用**：无需复杂配置，几分钟内即可投入使用

---

## 🚀 功能特性

| 功能模块 | 功能描述 | 状态 |
|---------|---------|------|
| **PDF 智能识别** | 自动从 PDF 文件中提取分包方、计价编号、计价金额等信息 | ✅ 已实现 |
| **合同管理** | 支持合同的创建、编辑、删除、查询等全生命周期管理 | ✅ 已实现 |
| **项目管理** | 多项目支持，项目级别的数据隔离与权限管理 | ✅ 已实现 |
| **计价跟踪** | 月度计价时间轴，自动计算累计计价金额 | ✅ 已实现 |
| **付款管理** | 月度付款跟踪，实时计算累计付款和支付比例 | ✅ 已实现 |
| **数据验证** | 自动验证计价数据一致性，发现差异自动预警 | ✅ 已实现 |
| **Excel 导出** | 支持导出合同列表到 Excel 格式，包含完整字段信息 | ✅ 已实现 |
| **模板管理** | 支持保存合同模板，快速创建新合同 | ✅ 已实现 |
| **分类管理** | 支持劳务分包、专业分包、技术服务、物资租赁等多分类 | ✅ 已实现 |
| **用户认证** | 基于 JWT 的安全认证系统，支持用户注册与登录 | ✅ 已实现 |
| **权限管理** | 管理员与普通用户权限区分 | ✅ 已实现 |

---

## 🛠 技术栈

### 前端技术

| 技术 | 版本 | 说明 |
|-----|------|------|
| [Next.js](https://nextjs.org/) | 16.1.6 | React 全栈框架，支持 App Router |
| [React](https://reactjs.org/) | 19.2.3 | 用户界面库 |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | JavaScript 超集，提供类型安全 |
| [React Bootstrap](https://react-bootstrap.github.io/) | 2.10.10 | Bootstrap 组件库 |
| [Bootstrap](https://getbootstrap.com/) | 5.3.8 | CSS 框架 |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | 原子化 CSS 框架 |

### 后端技术

| 技术 | 版本 | 说明 |
|-----|------|------|
| [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) | 16.1.6 | 服务端 API |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | 12.6.2 | 同步 SQLite 数据库驱动 |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 3.0.3 | 密码加密 |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 9.0.3 | JWT 令牌生成与验证 |
| [PDF.js](https://mozilla.github.io/pdf.js/) | 5.4.624 | PDF 文档解析 |
| [XLSX](https://github.com/SheetJS/sheetjs) | 0.18.5 | Excel 文件导出 |

### 开发工具

- [ESLint](https://eslint.org/) - 代码质量检查
- [PostCSS](https://postcss.org/) - CSS 处理
- [TypeScript](https://www.typescriptlang.org/) - 类型检查

---

## 📸 演示截图

![截屏1](images/截屏2026-02-15%2021.22.15.png)
![截屏2](images/截屏2026-02-15%2021.22.56.png)
![截屏3](images/截屏2026-02-15%2021.23.11.png)
![截屏4](images/截屏2026-02-15%2021.23.24.png)
![截屏5](images/截屏2026-02-15%2021.23.35.png)
![截屏6](images/截屏2026-02-15%2021.23.55.png)
![截屏7](images/截屏2026-02-15%2021.24.02.png)
![截屏8](images/截屏2026-02-15%2021.24.13.png)

---

## 💻 环境要求

| 要求 | 最低版本 | 推荐版本 |
|-----|---------|---------|
| Node.js | 18.x | 20.x 或更高 |
| npm | 9.x | 10.x 或更高 |
| 操作系统 | Windows 10+, macOS 12+, Ubuntu 20.04+ | 最新版本 |
| 浏览器 | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ | 最新版本 |

---

## 🚀 快速开始

### 前置要求

在开始之前，请确保已安装：
- Node.js 18.x 或更高版本
- npm 9.x 或更高版本

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/fakeman1232/Contract-Ledger-app.git
cd Contract-Ledger-app

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local

# 4. 启动开发服务器
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 环境变量配置

项目使用 `.env.local` 文件存储环境变量，从 `.env.example` 复制：

```bash
cp .env.example .env.local
```

`.env.local` 包含以下配置：

```env
# JWT 密钥配置
# 请在生产环境中使用强随机字符串
JWT_SECRET=your-secret-key-change-in-production-use-random-string-here
```

⚠️ **重要**：在生产环境中，请将 `JWT_SECRET` 替换为强随机字符串。

### 数据库初始化

首次运行 `npm run dev` 时，系统会自动：
1. 创建 `data/contract-ledger.db` 数据库文件
2. 创建所有必要的表结构
3. 创建默认管理员账号

详细的数据库结构说明请查看 [INIT_DB.md](INIT_DB.md)

### 默认账号

系统预置了管理员账号，首次登录后请及时修改密码：

| 用户名 | 密码 | 权限 |
|-------|------|------|
| admin | admin123 | 管理员 |

⚠️ **安全提示**：生产环境部署前请务必修改默认管理员密码！

### 使用启动脚本（可选）

#### macOS 用户

双击项目根目录下的 `launch-app.command` 文件即可启动应用。

#### Windows 用户

双击项目根目录下的 `启动应用.bat` 文件即可启动应用。

启动脚本会自动完成以下操作：
- ✅ 检查 Node.js 是否安装
- ✅ 首次运行时自动安装依赖
- ✅ 初始化 SQLite 数据库
- ✅ 启动开发服务器
- ✅ 自动在浏览器中打开应用

---

## 📂 项目结构

```
contract-ledger-app/
├── app/                          # Next.js App Router 目录
│   ├── api/                     # API 路由
│   │   ├── auth/                # 认证相关 API
│   │   │   ├── login/           # 登录接口
│   │   │   └── register/        # 注册接口
│   │   ├── contracts/           # 合同管理 API
│   │   │   ├── route.ts         # 合同列表与创建
│   │   │   └── [id]/            # 合同详情与更新
│   │   ├── projects/            # 项目管理 API
│   │   │   ├── route.ts         # 项目列表与创建
│   │   │   ├── [id]/            # 项目详情与删除
│   │   │   └── members/         # 项目成员管理
│   │   └── templates/           # 模板管理 API
│   ├── contract/[id]/           # 合同详情页面
│   ├── login/                   # 登录页面
│   ├── register/                # 注册页面
│   ├── select-project/          # 项目选择页面
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 主页面
│   └── globals.css              # 全局样式
├── lib/                         # 工具库
│   ├── api.ts                   # API 客户端封装
│   └── db.ts                    # 数据库配置与初始化
├── data/                        # 数据库文件目录
│   └── contract-ledger.db       # SQLite 数据库文件
├── public/                      # 静态资源
│   └── pdf.worker.min.mjs       # PDF.js Web Worker
├── .gitignore                   # Git 忽略配置
├── .env.local                   # 环境变量（本地）
├── eslint.config.mjs            # ESLint 配置
├── next.config.mjs              # Next.js 配置
├── package.json                 # 项目依赖配置
├── tsconfig.json                # TypeScript 配置
├── LICENSE                      # MIT 许可证
├── README.md                    # 项目文档
├── launch-app.command           # macOS 启动脚本
└── 启动应用.bat                  # Windows 启动脚本
```

---

## 📖 使用文档

### 1. 项目管理

#### 创建项目

只有管理员可以创建项目：

1. 使用管理员账号登录系统
2. 进入项目选择页面
3. 点击"创建新项目"按钮
4. 填写项目名称和描述
5. 点击确认完成创建

#### 切换项目

点击顶部导航栏的"🔄 切换项目"按钮，选择其他项目进行管理。

### 2. 合同管理

#### 创建合同

**方式一：手动创建**

1. 点击"➕ 新建合同"按钮
2. 填写合同信息（合同名称、供应单位、合同编号等）
3. 点击"保存"完成创建

**方式二：PDF 智能识别**

1. 点击"📤 上传PDF"按钮
2. 选择或拖拽 PDF 文件到上传区域
3. 系统自动提取合同信息并填充表单
4. 审核并补充必要信息后保存

支持识别的 PDF 字段：
- 分包方名称
- 计价编号
- 本期计价金额
- 累计计价金额
- 计价日期

#### 编辑合同

1. 在合同列表中找到目标合同
2. 点击"编辑"按钮
3. 修改合同信息
4. 点击"保存"完成更新

#### 删除合同

1. 在合同列表中找到目标合同
2. 点击"删除"按钮
3. 确认删除操作

⚠️ **注意**：删除操作不可恢复，请谨慎操作。

### 3. 计价与付款管理

#### 查看合同详情

1. 在合同列表中点击"查看"按钮
2. 进入合同详情页面
3. 查看合同基本信息和计价付款记录

#### 生成时间轴

1. 在合同详情页面，点击"生成时间轴"按钮
2. 系统会根据合同创建日期到当前日期生成月度时间轴
3. 每个月份都会显示计价和付款输入框

#### 填写月度数据

1. 在时间轴中找到对应的月份
2. 填写计价金额（不含税）
3. 填写付款金额（含税）
4. 系统自动计算：
   - 累计计价（含税/不含税）
   - 累计付款（含税/不含税）
   - 支付比例（累计付款 / 累计计价 × 100%）

#### 同步累计计价

如果月度计价总计与累计计价不一致：
1. 系统会显示验证警告
2. 点击"同步累计计价"按钮
3. 系统自动修正累计计价数据

### 4. 数据导出

#### 导出合同列表

1. 选择要导出的合同分类（总览、劳务分包等）
2. 点击"📥 导出Excel"按钮
3. 系统自动生成并下载 Excel 文件

导出的 Excel 文件包含以下字段：
- 合同名称
- 供应单位
- 合同编号
- 合同签订时间
- 合同金额
- 累计计价（含税/不含税）
- 累计付款（含税/不含税）
- 支付比例
- 分类
- 创建时间

### 5. 模板管理

#### 保存模板

1. 在创建或编辑合同时，点击"保存为模板"按钮
2. 填写模板名称
3. 点击确认保存

#### 使用模板

1. 点击"➕ 新建合同"按钮
2. 点击"从模板导入"链接
3. 选择要使用的模板
4. 系统自动填充模板信息
5. 补充其他必要信息后保存

---

## 🔌 API 文档

### 认证接口

#### POST /api/auth/login

用户登录

**请求体：**

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应：**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

#### POST /api/auth/register

用户注册

**请求体：**

```json
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com"
}
```

**响应：**

```json
{
  "user": {
    "id": 2,
    "username": "newuser",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### 项目接口

#### GET /api/projects

获取项目列表

**响应：**

```json
{
  "projects": [
    {
      "id": 1,
      "name": "示例项目",
      "description": "项目描述",
      "created_at": "2026-02-15T10:00:00Z"
    }
  ]
}
```

#### POST /api/projects

创建项目

**请求体：**

```json
{
  "name": "新项目",
  "description": "项目描述"
}
```

**响应：**

```json
{
  "project": {
    "id": 2,
    "name": "新项目",
    "description": "项目描述",
    "created_at": "2026-02-15T10:00:00Z"
  }
}
```

#### DELETE /api/projects/[id]

删除项目

**响应：**

```json
{
  "message": "项目已删除"
}
```

### 合同接口

#### GET /api/contracts?projectId=[id]

获取合同列表

**响应：**

```json
{
  "contracts": [
    {
      "id": 1,
      "contract_name": "合同名称",
      "supplier": "供应单位",
      "contract_number": "合同编号",
      "contract_amount": "1000000",
      "total_billing_tax_included": "500000",
      "total_payment_tax_included": "100000",
      "category": "labor",
      "project_id": 1
    }
  ]
}
```

#### POST /api/contracts

创建合同

**请求体：**

```json
{
  "contractName": "新合同",
  "supplier": "供应单位",
  "contractNumber": "合同编号",
  "contractAmount": "1000000",
  "taxRate": 9,
  "category": "labor",
  "projectId": 1
}
```

**响应：**

```json
{
  "contract": {
    "id": 2,
    "contract_name": "新合同",
    "supplier": "供应单位",
    "contract_number": "合同编号",
    "contract_amount": "1000000",
    "taxRate": 9,
    "category": "labor",
    "project_id": 1
  }
}
```

#### PUT /api/contracts/[id]

更新合同

**请求体：**

```json
{
  "contractName": "更新后的合同名称",
  "supplier": "供应单位",
  "contractAmount": "2000000",
  "taxRate": 9
}
```

**响应：**

```json
{
  "message": "合同已更新"
}
```

#### DELETE /api/contracts/[id]

删除合同

**响应：**

```json
{
  "message": "合同已删除"
}
```

---

## 🛠 开发指南

### 环境配置

1. **克隆仓库**

```bash
git clone https://github.com/fakeman1232/Contract-Ledger-app.git
cd Contract-Ledger-app
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

复制环境变量示例文件并修改（可选，系统有默认值）：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
JWT_SECRET=your-secret-key-change-in-production
```

4. **启动开发服务器**

```bash
npm run dev
```

### 可用脚本

| 命令 | 说明 |
|-----|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint 检查 |

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码（推荐）
- 提交前运行 `npm run lint` 检查代码质量

### 数据库迁移

当前版本使用 SQLite 数据库，数据库文件位于 `data/contract-ledger.db`。

数据库会在首次启动时自动初始化，无需手动执行迁移。

---

## 🧪 测试

当前版本暂未包含自动化测试，计划在后续版本中添加：

- [ ] 单元测试
- [ ] 集成测试
- [ ] E2E 测试

---

## 🚀 部署

### 开发环境

```bash
npm run dev
```

### 生产环境

#### 构建项目

```bash
npm run build
```

#### 启动生产服务器

```bash
npm start
```

### 推荐部署平台

| 平台 | 说明 |
|-----|------|
| [Vercel](https://vercel.com/) | Next.js 官方推荐平台，支持自动部署 |
| [Railway](https://railway.app/) | 全栈应用部署平台 |
| [Render](https://render.com/) | 云应用托管平台 |
| [Docker](https://www.docker.com/) | 容器化部署 |

### Docker 部署（计划中）

```dockerfile
# Dockerfile 示例（待添加）
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## ❓ 常见问题

### 1. 如何修改默认管理员密码？

登录系统后，在数据库中手动修改或等待用户管理功能上线。

### 2. 数据存储在哪里？

当前版本使用 SQLite 数据库，数据存储在 `data/contract-ledger.db` 文件中。

### 3. 如何备份数据？

直接复制 `data/contract-ledger.db` 文件即可完成备份。

### 4. 支持多用户同时使用吗？

支持，但当前版本的数据是实时同步的，建议在测试环境中使用。

### 5. PDF 识别失败怎么办？

- 检查 PDF 文件格式是否正确
- 确认 PDF 文件大小不超过 10MB
- 尝试手动填写合同信息

### 6. 如何更改端口？

修改 `package.json` 中的 dev 脚本：

```json
{
  "scripts": {
    "dev": "next dev -p 3001"
  }
}
```

---

## 🗺 路线图

### v1.1.0（计划中）

- [ ] 增强数据导入功能
- [ ] 批量操作支持
- [ ] 合同模板管理优化
- [ ] 更多导出格式（CSV、PDF）
- [ ] 数据统计图表

### v2.0.0（远期计划）

- [ ] 云端数据库支持（PostgreSQL/MySQL）
- [ ] 多语言支持（i18n）
- [ ] 数据备份与恢复
- [ ] 高级报表与数据分析
- [ ] 移动端响应式优化
- [ ] 微信/钉钉通知集成
- [ ] 权限系统升级
- [ ] 审计日志

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是 Bug 报告、功能建议还是代码提交。

### 如何贡献

1. **Fork** 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 **Pull Request**

### 代码规范

- 遵循 TypeScript 最佳实践
- 使用 ESLint 进行代码检查：`npm run lint`
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范
- 为新功能添加必要的测试用例

### Issue 提交

提交 Issue 时，请尽可能提供以下信息：

- 问题描述和重现步骤
- 期望行为
- 实际行为
- 环境信息（操作系统、Node.js 版本、浏览器版本）
- 相关截图或日志

### 开发流程

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/fakeman1232/Contract-Ledger-app.git
cd Contract-Ledger-app

# 2. 创建开发分支
git checkout -b feature/your-feature-name

# 3. 进行开发
npm install
npm run dev

# 4. 提交更改
git add .
git commit -m "feat: add your feature"

# 5. 推送到你的 Fork
git push origin feature/your-feature-name

# 6. 创建 Pull Request
```

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

```
Copyright (c) 2026 Wei Liu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📬 联系方式

- **作者**：Wei Liu
- **项目地址**：[https://github.com/fakeman1232/Contract-Ledger-app](https://github.com/fakeman1232/Contract-Ledger-app)
- **问题反馈**：[GitHub Issues](https://github.com/fakeman1232/Contract-Ledger-app/issues)

---

## 🙏 致谢

感谢以下优秀的开源项目：

| 项目 | 许可证 | 用途 |
|-----|--------|------|
| [Next.js](https://nextjs.org/) | MIT | 全栈框架 |
| [React](https://reactjs.org/) | MIT | UI 库 |
| [React Bootstrap](https://react-bootstrap.github.io/) | MIT | UI 组件 |
| [PDF.js](https://mozilla.github.io/pdf.js/) | Apache-2.0 | PDF 解析 |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | MIT | 数据库驱动 |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | MIT | 密码加密 |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | MIT | JWT 认证 |
| [XLSX](https://github.com/SheetJS/sheetjs) | Apache-2.0 | Excel 导出 |

---

## 📝 更新日志

### [1.0.0] - 2026-02-15

#### 新增
- 🎉 首次发布
- ✅ 完整的合同管理功能（创建、编辑、删除）
- ✅ PDF 智能识别功能，自动提取合同信息
- ✅ 月度计价与付款跟踪
- ✅ 数据一致性验证
- ✅ Excel 导出功能（包含合同签订时间等完整字段）
- ✅ 用户认证系统（JWT + bcryptjs）
- ✅ 项目管理功能
- ✅ 多分类合同管理（劳务分包、专业分包、技术服务、物资租赁）
- ✅ 模板管理功能
- ✅ 跨平台启动脚本（macOS / Windows）

#### 技术栈
- Next.js 16.1.6 (App Router)
- React 19.2.3
- TypeScript 5.x
- SQLite 数据库
- PDF.js 5.4.624
- XLSX 0.18.5

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！**

Made with ❤️ by Wei Liu

</div>