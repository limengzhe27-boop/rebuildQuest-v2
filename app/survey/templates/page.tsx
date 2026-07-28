"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  region: Region | "both";
  mode: TemplateMode;
  custom?: boolean;
  schema?: unknown[];
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
  const [region, setRegion] = useState<Region>("global");
  const [category, setCategory] = useState("全部分类");
  const [categories, setCategories] = useState(defaultCategories);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"使用最多" | "最近更新">("使用最多");
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [editing, setEditing] = useState<Template | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [notice, setNotice] = useState("");

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
        mode?: TemplateMode; schema?: unknown[];
      }) => ({
        id: item.id,
        name: item.label || item.name || "未命名模板",
        categories: item.categories?.length ? item.categories : [item.category || "其他"],
        description: item.description || "",
        questions: item.questions || item.schema?.length || 0,
        languages: item.languages?.length ? item.languages : ["简中"],
        useCount: item.useCount || 0,
        updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
        region: item.region === "国内" || item.region === "china" ? "china" : "global",
        mode: item.mode || "full",
        schema: item.schema,
        custom: true,
      })));
    } catch {}
  }, []);

  const allTemplates = useMemo(() => [...customTemplates, ...builtinTemplates], [customTemplates]);
  const visible = useMemo(() => allTemplates
    .filter((item) =>
      (item.region === region || item.region === "both")
      && (category === "全部分类" || item.categories.includes(category))
      && `${item.name}${item.description}${item.categories.join("")}`.toLowerCase().includes(query.trim().toLowerCase()),
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

  function openEditor(template: Template) {
    setEditing(template);
    setEditName(template.name);
    setEditDescription(template.description);
    setEditCategories(template.categories);
  }

  function saveTemplateEdit() {
    if (!editing || !editName.trim() || !editCategories.length) return;
    const nextTemplate = { ...editing, name: editName.trim(), description: editDescription.trim(), categories: editCategories, updatedAt: new Date().toISOString(), custom: true };
    const next = customTemplates.some((item) => item.id === editing.id)
      ? customTemplates.map((item) => item.id === editing.id ? nextTemplate : item)
      : [nextTemplate, ...customTemplates];
    setCustomTemplates(next);
    const stored = next.map((item) => ({
      ...item,
      label: item.name,
      category: item.categories[0],
      region: item.region === "china" ? "国内" : "海外",
    }));
    window.localStorage.setItem("joydata-survey-templates", JSON.stringify(stored));
    setEditing(null);
    flash("模板已更新");
  }

  return (
    <main className="app-shell">
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
          <section className="main-content">
            <div className="page-heading compact-page-heading">
              <div className="compact-heading-copy"><div className="breadcrumb">用研中心 <span>/</span> 模板中心</div><h1>模板中心</h1><span>{region === "global" ? "海外" : "国内"}工作区 · {visible.length} 个模板</span></div>
              <div className="heading-actions"><button className="secondary-button" onClick={() => router.push("/")}>返回问卷工作台</button><button className="primary-button" onClick={() => router.push(`/survey/new?region=${region}`)}>＋ 创建问卷</button></div>
            </div>

            <section className="survey-panel template-list-panel">
              <div className="panel-toolbar template-toolbar">
                <div className="region-switch compact-region-switch"><button className={region === "global" ? "active" : ""} onClick={() => setRegion("global")}>海外</button><button className={region === "china" ? "active" : ""} onClick={() => setRegion("china")}>国内</button></div>
                <div className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模板名称或分类" /></div>
                <select className="owner-filter" value={category} onChange={(event) => setCategory(event.target.value)}><option>全部分类</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
                <button className="secondary-button compact-button" onClick={() => setShowAddCategory(true)}>＋ 添加分类</button>
                <select className="owner-filter template-sort" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option>使用最多</option><option>最近更新</option></select>
              </div>

              <div className="template-list-table" role="table">
                <div className="template-list-head" role="row"><div>模板名称</div><div>模板类型</div><div>题目</div><div>使用情况</div><div>最后更新</div><div /></div>
                {visible.length ? visible.map((template) => (
                  <div className="template-list-row" role="row" key={template.id}>
                    <div className="template-name-cell"><span>▦</span><p><strong>{template.name}</strong><small>{template.categories.join(" · ")}</small></p></div>
                    <div><span className={`template-type-badge ${template.mode}`}>{template.mode === "blank" ? "空白模板" : "完整模板"}</span></div>
                    <div><strong>{template.questions}</strong><small> 题</small></div>
                    <div><strong>{template.useCount}</strong><small> 次使用</small></div>
                    <div><span>{new Date(template.updatedAt).toLocaleDateString("zh-CN")}</span><small>{template.languages.join(" · ")}</small></div>
                    <div className="template-row-actions"><button onClick={() => setSelected(template)}>预览</button><button onClick={() => openEditor(template)}>编辑</button><button className="primary-button" onClick={() => router.push(`/survey/new?template=${template.id}&region=${region}`)}>使用模板</button></div>
                  </div>
                )) : <div className="empty-state"><strong>没有匹配的模板</strong><p>调整搜索或分类条件后再试。</p></div>}
              </div>
              <footer className="panel-footer"><span>共 {visible.length} 个模板</span></footer>
            </section>
          </section>
        </div>
      </section>

      {showAddCategory && <div className="preview-backdrop" onMouseDown={() => setShowAddCategory(false)}><section className="template-category-modal" onMouseDown={(event) => event.stopPropagation()}><header><strong>添加模板分类</strong><button onClick={() => setShowAddCategory(false)}>×</button></header><label><span>分类名称</span><input autoFocus maxLength={20} value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="例如：版本上线后回访" /></label><footer><button className="secondary-button" onClick={() => setShowAddCategory(false)}>取消</button><button className="primary-button" onClick={addCategory}>确认添加</button></footer></section></div>}

      {editing && <div className="preview-backdrop" onMouseDown={() => setEditing(null)}><section className="template-category-modal template-edit-modal" onMouseDown={(event) => event.stopPropagation()}><header><strong>编辑模板</strong><button onClick={() => setEditing(null)}>×</button></header><label><span>模板名称</span><input value={editName} onChange={(event) => setEditName(event.target.value)} /></label><label><span>模板说明</span><textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} /></label><label><span>所属分类（可多选）</span><div className="template-category-checks inline-category-checks">{categories.map((item) => <button key={item} className={editCategories.includes(item) ? "selected" : ""} onClick={() => setEditCategories((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])}><i>{editCategories.includes(item) ? "✓" : ""}</i>{item}</button>)}</div></label><footer><button className="secondary-button" onClick={() => setEditing(null)}>取消</button><button className="primary-button" onClick={saveTemplateEdit}>保存</button></footer></section></div>}

      {selected && <div className="preview-backdrop" onMouseDown={() => setSelected(null)}><section className="template-preview-modal compact-template-preview" onMouseDown={(event) => event.stopPropagation()}><header><div><span>▦</span><p><small>{selected.categories.join(" · ")}</small><strong>{selected.name}</strong></p></div><button onClick={() => setSelected(null)}>×</button></header><div className="template-preview-summary"><span className={`template-type-badge ${selected.mode}`}>{selected.mode === "blank" ? "空白模板" : "完整模板"}</span><p>{selected.description}</p><dl><div><dt>题目</dt><dd>{selected.questions}</dd></div><div><dt>语言</dt><dd>{selected.languages.join("、")}</dd></div><div><dt>使用次数</dt><dd>{selected.useCount}</dd></div></dl></div><footer><button className="secondary-button" onClick={() => setSelected(null)}>关闭</button><button className="primary-button" onClick={() => router.push(`/survey/new?template=${selected.id}&region=${region}`)}>使用模板</button></footer></section></div>}
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
