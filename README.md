# JoyData Survey Workspace

面向游戏用户研究团队的多语言问卷工作台原型，覆盖问卷创建、逻辑配置、样式设计、发布投放、回复收集和数据分析等环节。

## 主要功能

- 按游戏、地区、项目和状态管理问卷
- 从模板创建问卷，编辑题目和页面结构
- 配置跳题逻辑、显示条件和多语言版本
- 自定义问卷外观、发布设置与公开访问地址
- 查看回复列表和可视化分析结果
- 支持国内与海外研究项目的分组管理
- 示例数据展示玩家体验、满意度和流失原因等研究场景

## 技术栈

- Next.js 16、React 19、TypeScript
- vinext、Vite、Cloudflare Vite Plugin
- Tailwind CSS 4
- Drizzle ORM，可选 Cloudflare D1 数据存储

## 环境要求

- Node.js `>=22.13.0`

## 本地运行

```bash
npm install
npm run dev
```

## 构建与检查

```bash
npm run build
npm test
npm run lint
```

## 主要页面

```text
app/
├── page.tsx                       # 问卷看板
├── survey/new/                    # 新建问卷
├── survey/templates/              # 问卷模板
├── survey/[id]/edit/              # 内容编辑
├── survey/[id]/logic/             # 逻辑配置
├── survey/[id]/languages/         # 多语言管理
├── survey/[id]/appearance/        # 样式设计
├── survey/[id]/publish/           # 发布设置
├── survey/[id]/responses/         # 回复数据
└── survey/[id]/analytics/         # 数据分析
```

## 当前状态

这是用于验证游戏用户研究工作流和交互设计的产品原型。仓库包含示例业务数据；正式上线前需要接入真实数据库、身份认证、权限体系和数据合规策略。
