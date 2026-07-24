# JoyData 问卷系统开发方案

## 1. 技术目标

- 使用 Next.js 和 TypeScript 构建可拆分、可逐步上线的前端。
- 页面遵循 JoyData 导航、间距、颜色和表格规范。
- 后端接口通过领域服务封装，前端不直接依赖旧问卷接口结构。
- 国内和海外使用统一代码库，通过工作空间配置切换前台域名和合规能力。
- 核心配置支持草稿、自动保存、版本记录和发布快照。

## 2. 推荐架构

```text
JoyData Web
├─ Survey UI
│  ├─ Workbench
│  ├─ Builder
│  ├─ Languages
│  ├─ Publishing
│  ├─ Responses
│  └─ Analytics
├─ Survey Domain API
│  ├─ Survey Service
│  ├─ Translation Service
│  ├─ Publication Service
│  ├─ Response Service
│  └─ Permission Service
├─ Regional Delivery
│  ├─ China Form Runtime
│  └─ Global Form Runtime
└─ Infrastructure
   ├─ JoyData SSO / Project / RBAC
   ├─ Regional Databases
   ├─ Object Storage
   ├─ Queue / Webhook
   └─ Audit Log
```

## 3. 前端路由

```text
/survey                         问卷工作台
/survey/new                     创建问卷
/survey/:id                     问卷概览
/survey/:id/edit                编辑器
/survey/:id/languages           多语言
/survey/:id/logic               逻辑
/survey/:id/appearance          外观
/survey/:id/publish             发布与回收
/survey/:id/responses           答卷数据
/survey/:id/analytics           分析报告
/survey/:id/collaborators       协作权限
/survey/templates               模板中心
/survey/themes                  主题中心
```

## 4. 核心接口草案

### 问卷

- `GET /api/projects/:projectId/surveys`
- `POST /api/projects/:projectId/surveys`
- `GET /api/surveys/:surveyId`
- `PATCH /api/surveys/:surveyId`
- `POST /api/surveys/:surveyId/copy`
- `DELETE /api/surveys/:surveyId`

### 结构与自动保存

- `GET /api/surveys/:surveyId/schema`
- `PUT /api/surveys/:surveyId/schema`
- `POST /api/surveys/:surveyId/versions`
- `GET /api/surveys/:surveyId/versions`

自动保存请求需携带 `revision`，后端使用乐观锁避免协作者互相覆盖。

### 多语言

- `GET /api/surveys/:surveyId/languages`
- `POST /api/surveys/:surveyId/languages`
- `PUT /api/surveys/:surveyId/languages/:locale`
- `POST /api/surveys/:surveyId/languages/:locale/validate`

### 发布

- `GET /api/surveys/:surveyId/publications`
- `POST /api/surveys/:surveyId/publications`
- `POST /api/publications/:publicationId/publish`
- `POST /api/publications/:publicationId/stop`
- `POST /api/publications/:publicationId/test-webhook`

### 答卷与分析

- `GET /api/surveys/:surveyId/responses`
- `GET /api/responses/:responseId`
- `POST /api/surveys/:surveyId/responses/export`
- `GET /api/surveys/:surveyId/analytics/overview`
- `GET /api/surveys/:surveyId/analytics/questions`

## 5. 状态管理

- 服务端状态：使用 JoyData 统一请求层和缓存方案。
- 编辑器草稿：本地状态 + 定时自动保存。
- 用户偏好：浏览器存储，仅用于表格密度、最近筛选和侧栏状态。
- 权限和项目上下文：复用 JoyData 全局上下文。

## 6. 数据隔离

- 所有业务表必须包含 `workspace_id` 和 `project_id`。
- 发布实例和答卷按区域物理隔离。
- 后台聚合仅展示统计结果，不直接跨区域拼接答卷明细。
- 跨区域复制通过异步任务完成，并重新生成问卷 ID、发布配置和访问链接。

## 7. 安全与合规

- 接口必须校验项目成员身份和问卷级权限。
- 答卷导出、删除、发布和跨区域复制写入审计日志。
- Webhook 密钥加密存储，前端只显示脱敏结果。
- 文件上传限制类型、大小和病毒扫描。
- 发布前运行区域合规校验，阻止缺少必要声明的问卷发布。

## 8. 分阶段计划

### 阶段一：工作台与创建流程

交付范围：

- JoyData 用研入口和问卷工作台。
- 国内/海外工作空间切换。
- 搜索、筛选、分组、状态和详情。
- 创建问卷四步向导。
- 本地演示数据持久化，预留真实 API 适配层。

验收标准：

- 用户能够在 3 分钟内创建一份包含区域和语言的问卷草稿。
- 国内和海外问卷不会显示在错误工作空间。
- 列表筛选、详情和创建结果可连续操作。

### 阶段二：编辑器与多语言

交付范围：

- 三栏编辑器。
- 核心题型。
- 拖拽排序、复制、删除和必填。
- 题目属性配置。
- 多语言翻译工作台和翻译状态。
- 自动保存和撤销/重做。

验收标准：

- 能够创建至少 20 题的问卷并保存。
- 修改原文后能正确标记受影响翻译。
- PC 和移动端预览一致。

### 阶段三：发布、回收和权限

交付范围：

- 公开发布、渠道链接和指定填写。
- JM/Line/匿名填写。
- 时间、次数、账号、设备和总量限制。
- 国内/海外合规校验。
- 完成页、跳转和 Webhook。
- 协作者和问卷级权限。

验收标准：

- 无法将不满足合规要求的问卷发布。
- 每个发布实例拥有独立链接、语言规则和数据范围。
- 权限测试覆盖编辑、发布、查看和导出。

### 阶段四：答卷与分析

交付范围：

- 答卷表格、详情和导出。
- 单题统计和总体指标。
- 语言、国家、渠道和设备对比。
- 报告筛选、保存和分享。

验收标准：

- 数据按问卷实例隔离。
- 10 万条答卷条件下分页和筛选可用。
- 导出任务异步执行并可追踪。

### 阶段五：迁移与上线

交付范围：

- 旧问卷和模板迁移工具。
- 双写或灰度切流方案。
- 操作手册和培训。
- 监控、告警和回滚。

验收标准：

- 抽样迁移数据一致率达到 99.9%。
- 旧链接保留跳转策略。
- 灰度期间可随时回滚旧系统。

## 9. 开发顺序

每个阶段按以下步骤执行：

1. 明确用户任务和验收场景。
2. 固化页面状态和接口契约。
3. 完成可交互前端。
4. 接入模拟接口并完成异常状态。
5. 接入真实接口。
6. 进行权限、区域和多语言测试。
7. 发布到验收环境。
8. 根据业务反馈调整后进入下一阶段。

## 10. 当前进度

- [x] JoyData 风格工作台首版
- [x] 国内/海外切换
- [x] 搜索、状态筛选和问卷详情
- [x] 创建问卷基础交互
- [x] 阶段一独立创建向导
- [x] 前端领域模型与本地持久化
- [x] 三栏问卷编辑器与移动端预览
- [x] 多语言翻译工作台与质量检查
- [x] 国内/海外发布实例与语言匹配
- [x] 渠道链接、指定玩家和回收限制
- [x] 区域合规检查、完成页与 Webhook
- [x] 问卷级协作权限
- [x] 答卷列表、筛选、详情与批量复核
- [x] 脱敏导出与区域数据边界提示
- [x] 回收趋势、NPS、完成率与渠道分析
- [x] 语言/国家对比与逐题分析
