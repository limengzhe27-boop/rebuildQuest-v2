# JoyData Survey Workspace

> 为游戏用户研究团队设计的多语言问卷工作台原型，覆盖创建、编辑、翻译、发布、回收与分析。

通用表单工具通常难以同时处理游戏项目、地区、语言版本和研究批次。JoyData Survey Workspace 围绕游戏用研场景组织问卷资产，让团队能够按项目管理研究任务，并在同一工作流中完成投放与结果回看。

## 使用场景

- 先锋测试与版本体验调研
- 玩家满意度和 NPS 回访
- 新职业、活动和数值平衡反馈
- 回归玩家流失原因研究
- VIP 用户与公会活动研究
- 多地区、多语言问卷投放

## 从创建到分析

```mermaid
flowchart LR
    A[选择模板 / 新建问卷] --> B[编辑题目]
    B --> C[配置逻辑]
    C --> D[管理语言版本]
    D --> E[设计外观]
    E --> F[发布与投放]
    F --> G[回复列表]
    G --> H[分析看板]
```

## 功能地图

| 功能域 | 已实现的原型页面 |
|---|---|
| 项目管理 | 国内/海外区域、游戏项目、研究分组和自定义项目 |
| 问卷看板 | 搜索、状态筛选、创建人筛选、回复数和更新时间 |
| 内容设计 | 问卷编辑与模板创建入口 |
| 研究逻辑 | 跳题与显示逻辑配置界面 |
| 国际化 | 多语言版本管理 |
| 品牌体验 | 问卷外观和发布设置 |
| 数据回收 | 公开填写地址与回复列表 |
| 研究分析 | 单问卷分析页面 |

## 路由结构

| 路径 | 说明 |
|---|---|
| `/` | 问卷与研究项目看板 |
| `/survey/new` | 新建问卷 |
| `/survey/templates` | 模板库 |
| `/survey/[id]/edit` | 内容编辑 |
| `/survey/[id]/logic` | 逻辑配置 |
| `/survey/[id]/languages` | 多语言管理 |
| `/survey/[id]/appearance` | 外观设计 |
| `/survey/[id]/settings` | 问卷设置 |
| `/survey/[id]/publish` | 发布投放 |
| `/survey/[id]/responses` | 回复数据 |
| `/survey/[id]/analytics` | 分析结果 |
| `/s/[slug]` | 公开问卷填写页 |

## 技术架构

| 层级 | 技术 |
|---|---|
| 应用 | Next.js 16、React 19、TypeScript |
| 构建 | vinext、Vite 8、Cloudflare Vite Plugin |
| 样式 | Tailwind CSS 4 |
| 数据层 | Drizzle ORM；预留 Cloudflare D1 |
| 部署 | OpenAI Sites / Cloudflare 运行时配置 |

仓库目前的 `db/schema.ts` 为空，`.openai/hosting.json` 也没有声明 D1 或 R2 绑定，因此现阶段数据主要用于交互演示，并非完整持久化业务系统。

## 本地开发

### 环境要求

- Node.js `>=22.13.0`
- npm

```bash
npm install
npm run dev
```

### 构建与检查

```bash
npm run lint
npm test          # 当前等价于生产构建验证
npm run build
```

在实际增加 Drizzle 表结构后，可运行：

```bash
npm run db:generate
```

## 目录概览

```text
app/                         # 页面、问卷路由与样式
db/schema.ts                 # Drizzle 数据模型（当前为空）
examples/d1/                 # 可选 D1 示例
.openai/hosting.json         # Sites 托管配置
drizzle.config.ts            # 迁移生成配置
vite.config.ts               # vinext / Cloudflare 本地构建配置
```

## 当前边界

这是高保真产品原型，不应被误认为已经上线的研究数据系统：

- 示例问卷、回复数、创建人和更新时间均为演示数据。
- 尚未建立真实问卷数据模型、回复持久化和文件存储。
- 身份信息相关代码只提供可选 ChatGPT 身份接入辅助，不等同于组织成员权限控制。
- 生产环境需要补充 RBAC、审计日志、数据导出、匿名化、删除策略和地区合规要求。
- 玩家研究可能涉及敏感个人信息，必须明确告知、最小化采集并限制访问范围。

## 下一步建议

1. 定义问卷、题目、逻辑、语言版本、投放和回复的数据模型。
2. 接入 D1/PostgreSQL 与对象存储，完成端到端持久化。
3. 建立团队、角色和项目级权限。
4. 为公开问卷增加防刷、限流、草稿恢复和无障碍支持。
5. 为分析结果增加交叉筛选、导出和可复现统计口径。
