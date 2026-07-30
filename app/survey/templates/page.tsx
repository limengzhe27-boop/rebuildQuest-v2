"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ComponentTemplate, createQuestion, defaultQuestions, questionLabels } from "@/lib/survey-builder";
import { EndPageTemplate, loadEndPageTemplates, parseInlineLinkSegments, saveEndPageTemplates } from "@/lib/survey-publication";
import { ComponentTemplateEditor, ComponentTemplateDraft } from "@/components/ComponentTemplateEditor";
import { PageTemplateEditor } from "@/components/PageTemplateEditor";

type Region = "global" | "china";
type TemplateMode = "blank" | "full";
type Template = {
  id: string;
  name: string;
  categories: string[];
  description: string;
  questions: number;
  languages: string[];
  useCount: number;
  updatedAt: string;
  updatedBy?: string;
  region: Region | "both";
  mode: TemplateMode;
  custom?: boolean;
  schema?: unknown[];
  appearance?: Record<string, unknown>;
};

const builtinTemplates: Template[] = [
  { id: "game-beta", name: "游戏测试体验调研", categories: ["版本测试", "用户洞察"], description: "覆盖整体满意度、战斗体验、性能表现、NPS 与开放反馈。", questions: 12, languages: ["EN", "繁中", "ไทย"], useCount: 126, updatedAt: "2026-07-20", region: "global", mode: "full" },
  { id: "update", name: "版本更新满意度", categories: ["版本测试", "满意度"], description: "用于海外版本上线后快速了解新内容评价与核心问题。", questions: 9, languages: ["EN", "繁中"], useCount: 84, updatedAt: "2026-07-24", region: "global", mode: "full" },
  { id: "nps", name: "玩家 NPS 追踪", categories: ["满意度", "用户洞察"], description: "标准海外 NPS 问卷，区分推荐者、中立者与贬损者。", questions: 6, languages: ["EN", "繁中", "ไทย"], useCount: 203, updatedAt: "2026-07-18", region: "global", mode: "full" },
  { id: "churn", name: "流失玩家召回调研", categories: ["用户洞察"], description: "了解流失节点、离开原因、回流意愿和激励偏好。", questions: 15, languages: ["EN", "繁中"], useCount: 67, updatedAt: "2026-07-16", region: "global", mode: "blank" },
  { id: "event", name: "国内运营活动复盘", categories: ["运营活动", "满意度"], description: "评估国内活动参与、玩法、奖励与传播效果。", questions: 10, languages: ["简中"], useCount: 92, updatedAt: "2026-07-23", region: "china", mode: "full" },
  { id: "cn-satisfaction", name: "国内玩家满意度", categories: ["满意度"], description: "面向国内玩家的标准满意度与意见反馈模板。", questions: 8, languages: ["简中"], useCount: 76, updatedAt: "2026-07-21", region: "china", mode: "full" },
  { id: "cn-update", name: "国服版本更新反馈", categories: ["版本测试", "满意度"], description: "用于国服版本更新后的内容评价、问题定位与建议收集。", questions: 11, languages: ["简中"], useCount: 61, updatedAt: "2026-07-22", region: "china", mode: "blank" },
  { id: "community", name: "社区玩家画像", categories: ["用户洞察"], description: "收集玩家偏好、游戏习惯、社群参与和内容兴趣。", questions: 18, languages: ["EN", "日本語", "한국어"], useCount: 48, updatedAt: "2026-07-14", region: "global", mode: "full" },
  { id: "support", name: "客服满意度回访", categories: ["服务体验", "满意度"], description: "用于海外工单关闭后评估解决效率、态度与结果。", questions: 7, languages: ["EN", "繁中", "ไทย"], useCount: 118, updatedAt: "2026-07-19", region: "global", mode: "full" },
];

const defaultCategories = ["版本测试", "满意度", "用户洞察", "运营活动", "服务体验", "招募筛选", "其他"];
const navItems = [["⌂", "看板"], ["⌁", "分析"], ["◎", "投放"], ["◇", "营销"], ["☏", "客诉"], ["♙", "用户"], ["▤", "用研"], ["⚙", "管理"], ["▱", "数据"]];

export default function TemplatesPage() {
  const router = useRouter();
  const [centerTab, setCenterTab] = useState<"survey" | "component" | "page">("survey");
  const [region, setRegion] = useState<Region>("global");
  const [category, setCategory] = useState("全部分类");
  const [categories, setCategories] = useState(defaultCategories);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"使用最多" | "最近更新">("使用最多");
  const [pageSize, setPageSize] = useState(50);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [notice, setNotice] = useState("");
  const [componentTemplates, setComponentTemplates] = useState<ComponentTemplate[]>([]);
  const [componentDraft, setComponentDraft] = useState<ComponentTemplateDraft | null>(null);
  const [pageTemplates, setPageTemplates] = useState<EndPageTemplate[]>([]);
  const [pageTemplateTab, setPageTemplateTab] = useState<"limit" | "closed">("limit");
  const [pageTemplateDraft, setPageTemplateDraft] = useState<EndPageTemplate | null>(null);
  const [pageTemplatePreview, setPageTemplatePreview] = useState<EndPageTemplate | null>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("region");
    if (requested === "china" || requested === "global") setRegion(requested);
    try {
      const savedCategories = JSON.parse(window.localStorage.getItem("joydata-template-categories") || "[]");
      if (savedCategories.length) setCategories(Array.from(new Set([...defaultCategories, ...savedCategories])));
      const saved = JSON.parse(window.localStorage.getItem("joydata-survey-templates") || "[]");
      setCustomTemplates(saved.map((item: {
        id: string; label?: string; name?: string; category?: string; categories?: string[]; description?: string;
        questions?: number; languages?: string[]; region?: string; useCount?: number; updatedAt?: string; createdAt?: string;
        mode?: TemplateMode; schema?: unknown[]; updatedBy?: string; appearance?: Record<string, unknown>;
      }) => ({
        id: item.id,
        name: item.label || item.name || "未命名模板",
        categories: item.categories?.length ? item.categories : [item.category || "其他"],
        description: item.description || "",
        questions: item.questions || item.schema?.length || 0,
        languages: item.languages?.length ? item.languages : ["简中"],
        useCount: item.useCount || 0,
        updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
        updatedBy: item.updatedBy || "李孟哲",
        region: item.region === "国内" || item.region === "china" ? "china" : "global",
        mode: item.mode || "full",
        schema: item.schema,
        appearance: item.appearance,
        custom: true,
      })));
      setComponentTemplates(JSON.parse(window.localStorage.getItem("joydata-survey-component-templates") || "[]"));
      setPageTemplates(loadEndPageTemplates());
    } catch {}
  }, []);

  const allTemplates = useMemo(() => [...customTemplates, ...builtinTemplates], [customTemplates]);
  const visible = useMemo(() => allTemplates
    .filter((item) =>
      (item.region === region || item.region === "both")
      && (category === "全部分类" || item.categories.includes(category))
      && `${item.name}${item.categories.join("")}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => sort === "使用最多"
      ? b.useCount - a.useCount
      : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  [allTemplates, category, query, region, sort]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function addCategory() {
    const value = newCategory.trim();
    if (!value || categories.includes(value)) return;
    const next = [...categories, value];
    setCategories(next);
    window.localStorage.setItem("joydata-template-categories", JSON.stringify(next.filter((item) => !defaultCategories.includes(item))));
    setNewCategory("");
    setShowAddCategory(false);
    setCategory(value);
    flash("模板分类已创建");
  }

  function previewTemplate(template: Template) {
    const previewId = `template-preview-${template.id}`;
    window.localStorage.setItem(`joydata-survey-schema-${previewId}`, JSON.stringify(template.schema?.length ? template.schema : defaultQuestions));
    window.localStorage.setItem(`joydata-survey-appearance-${previewId}`, JSON.stringify(template.appearance || {
      theme: "RO3 先锋",
      primary: "#356FE6",
      radius: 10,
      density: "comfortable",
      fontSize: "standard",
      buttonStyle: "filled",
      progress: true,
      languageSwitch: true,
      background: "soft",
    }));
    try {
      const drafts = JSON.parse(window.localStorage.getItem("joydata-survey-drafts") || "[]");
      const next = [{ id: previewId, name: template.name, languages: template.languages, region: template.region === "china" ? "国内" : "海外", defaultLanguage: template.languages[0] }, ...drafts.filter((item: { id?: string | number }) => String(item.id) !== previewId)];
      window.localStorage.setItem("joydata-survey-drafts", JSON.stringify(next));
    } catch {}
    router.push(`/s/template-preview?surveyId=${encodeURIComponent(previewId)}`);
  }

  function editTemplate(template: Template) {
    try {
      const saved = JSON.parse(window.localStorage.getItem("joydata-survey-templates") || "[]");
      const editable = {
        ...template,
        label: template.name,
        name: template.name,
        category: template.categories[0],
        region: template.region === "china" ? "国内" : "海外",
        schema: template.schema?.length ? template.schema : defaultQuestions,
        updatedBy: template.updatedBy || "李孟哲",
      };
      const next = [editable, ...saved.filter((item: { id?: string }) => item.id !== template.id)];
      window.localStorage.setItem("joydata-survey-templates", JSON.stringify(next));
    } catch {}
    router.push(`/survey/template-${template.id}/edit?templateId=${encodeURIComponent(template.id)}`);
  }

  function persistComponentTemplates(next: ComponentTemplate[]) {
    setComponentTemplates(next);
    window.localStorage.setItem("joydata-survey-component-templates", JSON.stringify(next));
  }

  function saveComponentTemplate(draft: ComponentTemplateDraft) {
    const isNew = !draft.id;
    const template: ComponentTemplate = { id: draft.id || `component-${Date.now()}`, name: draft.name, question: draft.question };
    persistComponentTemplates(isNew ? [template, ...componentTemplates] : componentTemplates.map((item) => item.id === template.id ? template : item));
    setComponentDraft(null);
    flash(isNew ? "组件已创建" : "组件已更新");
  }

  function removeComponentTemplate(id: string) {
    persistComponentTemplates(componentTemplates.filter((item) => item.id !== id));
    flash("组件已删除");
  }

  function savePageTemplate(template: EndPageTemplate) {
    const isNew = !pageTemplates.some((item) => item.id === template.id);
    const next = isNew ? [template, ...pageTemplates] : pageTemplates.map((item) => item.id === template.id ? template : item);
    setPageTemplates(next);
    saveEndPageTemplates(next);
    setPageTemplateDraft(null);
    flash(isNew ? "页面模板已创建" : "页面模板已更新");
  }

  function removePageTemplate(id: string) {
    const next = pageTemplates.filter((item) => item.id !== id);
    setPageTemplates(next);
    saveEndPageTemplates(next);
    flash("页面模板已删除");
  }

  return (
    <main className="app-shell embedded-app-shell">
      <aside className="global-nav" aria-label="JoyData 主导航">
        <div className="brand-mark"><span>✦</span></div>
        <div className="global-nav-list">{navItems.map(([icon, label]) => <button className={`global-nav-item ${label === "用研" ? "active" : ""}`} key={label}><span className="global-nav-icon">{icon}</span><span>{label}</span></button>)}</div>
        <button className="global-settings" aria-label="系统设置">⚙</button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="wordmark"><span className="wordmark-symbol">✦</span><div><strong>欢乐互娱</strong><small>JOY DATA</small></div></div>
          <button className="topbar-project"><small>当前项目</small><strong>全项目视图</strong><span>⌄</span></button>
          <div className="topbar-actions"><button>?</button><button>◌</button><button className="timezone">UTC +8</button><div className="avatar">孟</div><button className="profile">李孟哲 <span>⌄</span></button></div>
        </header>

        <div className="content-layout">
          <section className="main-content compact-list-content">
            <div className="page-heading compact-page-heading">
              <div className="compact-heading-copy"><div className="breadcrumb">用研中心 <span>/</span> 模板中心</div><h1>模板中心</h1><span>{centerTab === "survey" ? `${region === "global" ? "海外" : "国内"}工作区 · ${visible.length} 个问卷模板` : centerTab === "component" ? `${componentTemplates.length} 个组件模板` : `${pageTemplates.length} 个页面模板`}</span></div>
              <div className="heading-actions"><button className="secondary-button" onClick={() => router.push("/")}>返回问卷工作台</button>{centerTab === "survey" && <button className="primary-button" onClick={() => router.push(`/survey/new?region=${region}`)}>＋ 创建问卷</button>}</div>
            </div>

            <div className="template-center-tabs">
              <button className={centerTab === "survey" ? "active" : ""} onClick={() => setCenterTab("survey")}>问卷模板</button>
              <button className={centerTab === "component" ? "active" : ""} onClick={() => setCenterTab("component")}>组件模板</button>
              <button className={centerTab === "page" ? "active" : ""} onClick={() => setCenterTab("page")}>页面模板</button>
            </div>

            {centerTab === "survey" && (
            <section className="survey-panel template-list-panel">
              <div className="panel-toolbar template-toolbar">
                <div className="region-switch compact-region-switch"><button className={region === "global" ? "active" : ""} onClick={() => setRegion("global")}>海外</button><button className={region === "china" ? "active" : ""} onClick={() => setRegion("china")}>国内</button></div>
                <div className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模板名称或分类" /></div>
                <select className="owner-filter" value={category} onChange={(event) => setCategory(event.target.value)}><option>全部分类</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
                <button className="secondary-button compact-button" onClick={() => setShowAddCategory(true)}>＋ 添加分类</button>
                <select className="owner-filter template-sort" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option>使用最多</option><option>最近更新</option></select>
              </div>

              <div className="template-list-table" role="table">
                <div className="template-list-head" role="row"><div>模板名称</div><div>模板类型</div><div>题目</div><div>使用情况</div><div>最后修改</div><div /></div>
                {visible.length ? visible.slice(0, pageSize).map((template) => (
                  <div className="template-list-row" role="row" key={template.id}>
                    <div className="template-name-cell"><span>▦</span><p><strong>{template.name}</strong><small>{template.categories.join(" · ")}</small></p></div>
                    <div><span className={`template-type-badge ${template.mode}`}>{template.mode === "blank" ? "空白模板" : "完整模板"}</span></div>
                    <div><strong>{template.questions}</strong><small> 题</small></div>
                    <div><strong>{template.useCount}</strong><small> 次使用</small></div>
                    <div><span>{new Date(template.updatedAt).toLocaleDateString("zh-CN")}</span><small>{template.updatedBy || "系统模板"}</small></div>
                    <div className="template-row-actions"><button onClick={() => previewTemplate(template)}>阅览</button><button onClick={() => editTemplate(template)}>编辑</button><button className="primary-button" onClick={() => router.push(`/survey/new?template=${template.id}&region=${region}`)}>使用模板</button></div>
                  </div>
                )) : <div className="empty-state"><strong>没有匹配的模板</strong><p>调整搜索或分类条件后再试。</p></div>}
              </div>
              <footer className="panel-footer"><span>共 {visible.length} 个模板</span><div><button disabled>‹</button><button className="active">1</button><button disabled>›</button><select className="page-size-select" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}><option value={20}>20 条/页</option><option value={50}>50 条/页</option><option value={100}>100 条/页</option></select></div></footer>
            </section>
            )}

            {centerTab === "component" && (
            <section className="survey-panel template-component-panel">
              <div className="panel-toolbar template-toolbar">
                <span className="template-panel-hint">组件模板可在问卷编辑器左侧「自定义组件」中直接添加，保留已配置的标题与选项。</span>
                <button className="primary-button" onClick={() => setComponentDraft({ id: "", name: "", question: createQuestion("single") })}>＋ 新建组件</button>
              </div>
              {componentTemplates.length ? (
                <div className="template-component-grid">
                  {componentTemplates.map((template) => (
                    <article className="template-component-card" key={template.id}>
                      <header><span>◇</span><div><strong>{template.name}</strong><small>{questionLabels[template.question.type]}</small></div></header>
                      {template.question.title && <p>{template.question.title}</p>}
                      <footer><button onClick={() => setComponentDraft({ id: template.id, name: template.name, question: template.question })}>编辑</button><button className="text-danger" onClick={() => removeComponentTemplate(template.id)}>删除</button></footer>
                    </article>
                  ))}
                </div>
              ) : <div className="empty-state"><strong>暂无自定义组件</strong><p>在问卷编辑器中将题目保存为组件，或点击上方按钮新建。</p></div>}
            </section>
            )}

            {centerTab === "page" && (
            <section className="survey-panel template-component-panel">
              <div className="panel-toolbar template-toolbar">
                <span className="template-panel-hint">页面模板可在问卷「问卷结束页」「停止收集后页面」设置中直接选用。</span>
                <button className="primary-button" onClick={() => setPageTemplateDraft({ id: `end-page-${Date.now()}`, name: "新建页面模板", image: "", pageType: pageTemplateTab, content: { title: "", body: "", links: [] } })}>＋ 新建页面模板</button>
              </div>
              <div className="page-template-sub-tabs">
                <button className={pageTemplateTab === "limit" ? "active" : ""} onClick={() => setPageTemplateTab("limit")}>提交页（问卷结束页）</button>
                <button className={pageTemplateTab === "closed" ? "active" : ""} onClick={() => setPageTemplateTab("closed")}>结束页（停止收集页）</button>
              </div>
              <div className="template-component-grid">
                {pageTemplates.filter((template) => (template.pageType || "limit") === pageTemplateTab).map((template) => (
                  <article className="template-page-card" key={template.id}>
                    {template.image ? <div className="template-page-card-cover" style={{ backgroundImage: `url(${template.image})` }} /> : <div className="template-page-card-cover empty">无背景图</div>}
                    <div className="template-page-card-body">
                      <strong>{template.name}</strong>
                      {template.content?.title && <p>{template.content.title}</p>}
                      <footer><button onClick={() => setPageTemplatePreview(template)}>查看</button><button onClick={() => setPageTemplateDraft(template)}>编辑</button><button className="text-danger" onClick={() => removePageTemplate(template.id)}>删除</button></footer>
                    </div>
                  </article>
                ))}
                {!pageTemplates.some((template) => (template.pageType || "limit") === pageTemplateTab) && <div className="empty-state small"><p>{pageTemplateTab === "limit" ? "暂无提交页模板" : "暂无结束页模板"}，可在问卷设置中保存或点击上方按钮新建。</p></div>}
              </div>
            </section>
            )}
          </section>
        </div>
      </section>

      {showAddCategory && <div className="preview-backdrop" onMouseDown={() => setShowAddCategory(false)}><section className="template-category-modal" onMouseDown={(event) => event.stopPropagation()}><header><strong>添加模板分类</strong><button onClick={() => setShowAddCategory(false)}>×</button></header><label><span>分类名称</span><input autoFocus maxLength={20} value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="例如：版本上线后回访" /></label><footer><button className="secondary-button" onClick={() => setShowAddCategory(false)}>取消</button><button className="primary-button" onClick={addCategory}>确认添加</button></footer></section></div>}

      {componentDraft && <ComponentTemplateEditor draft={componentDraft} onCancel={() => setComponentDraft(null)} onSave={saveComponentTemplate} />}

      {pageTemplateDraft && <PageTemplateEditor template={pageTemplateDraft} onCancel={() => setPageTemplateDraft(null)} onSave={savePageTemplate} />}

      {pageTemplatePreview && (
        <div className="preview-backdrop" onMouseDown={() => setPageTemplatePreview(null)}>
          <section className="page-template-preview-modal" onMouseDown={(event) => event.stopPropagation()}>
            <header><strong>{pageTemplatePreview.name}</strong><span className="template-type-badge full">{(pageTemplatePreview.pageType || "limit") === "closed" ? "结束页" : "提交页"}</span><button onClick={() => setPageTemplatePreview(null)}>×</button></header>
            <div className={`limit-result-preview ${pageTemplatePreview.image ? "custom" : ""}`} style={pageTemplatePreview.image ? { backgroundImage: `url(${pageTemplatePreview.image})` } : undefined}>
              <article>
                {pageTemplatePreview.content?.title && <h3>{pageTemplatePreview.content.title}</h3>}
                <p>{pageTemplatePreview.content && parseInlineLinkSegments(pageTemplatePreview.content).map((segment) => segment.type === "link"
                  ? <a key={segment.key} href={segment.url || undefined} onClick={(event) => event.preventDefault()}>{segment.text}</a>
                  : <span key={segment.key}>{segment.value}</span>)}</p>
              </article>
            </div>
          </section>
        </div>
      )}

      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}

