"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Template = {
  id: string;
  name: string;
  categories: string[];
  description: string;
  questions: number;
  languages: string[];
  useCount: number;
  updatedAt: string;
  color: string;
  icon: string;
  custom?: boolean;
  region: "global" | "china" | "both";
};

const builtinTemplates: Template[] = [
  { id: "game-beta", name: "游戏测试体验调研", categories: ["版本测试", "用户洞察"], description: "覆盖整体满意度、战斗体验、性能表现、NPS 与开放反馈。", questions: 12, languages: ["EN", "繁中", "ไทย"], useCount: 126, updatedAt: "2026-07-20", color: "#4B7FE9", icon: "⚔", region: "global" },
  { id: "update", name: "版本更新满意度", categories: ["版本测试", "满意度"], description: "用于海外版本上线后快速了解新内容评价与核心问题。", questions: 9, languages: ["EN", "繁中"], useCount: 84, updatedAt: "2026-07-24", color: "#7A65DD", icon: "↗", region: "global" },
  { id: "nps", name: "玩家 NPS 追踪", categories: ["满意度", "用户洞察"], description: "标准海外 NPS 问卷，区分推荐者、中立者与贬损者。", questions: 6, languages: ["EN", "繁中", "ไทย"], useCount: 203, updatedAt: "2026-07-18", color: "#31A773", icon: "10", region: "global" },
  { id: "churn", name: "流失玩家召回调研", categories: ["用户洞察"], description: "了解流失节点、离开原因、回流意愿和激励偏好。", questions: 15, languages: ["EN", "繁中"], useCount: 67, updatedAt: "2026-07-16", color: "#E47A43", icon: "↺", region: "global" },
  { id: "event", name: "国内运营活动复盘", categories: ["运营活动", "满意度"], description: "评估国内活动参与、玩法、奖励与传播效果。", questions: 10, languages: ["简中"], useCount: 92, updatedAt: "2026-07-23", color: "#E2A337", icon: "★", region: "china" },
  { id: "cn-satisfaction", name: "国内玩家满意度", categories: ["满意度"], description: "面向国内玩家的标准满意度与意见反馈模板。", questions: 8, languages: ["简中"], useCount: 76, updatedAt: "2026-07-21", color: "#3E91D8", icon: "✓", region: "china" },
  { id: "cn-update", name: "国服版本更新反馈", categories: ["版本测试", "满意度"], description: "用于国服版本更新后的内容评价、问题定位与建议收集。", questions: 11, languages: ["简中"], useCount: 61, updatedAt: "2026-07-22", color: "#6F78D8", icon: "更", region: "china" },
  { id: "community", name: "社区玩家画像", categories: ["用户洞察"], description: "收集玩家偏好、游戏习惯、社群参与和内容兴趣。", questions: 18, languages: ["EN", "日本語", "한국어"], useCount: 48, updatedAt: "2026-07-14", color: "#4CA4B8", icon: "♙", region: "global" },
  { id: "support", name: "客服满意度回访", categories: ["服务体验", "满意度"], description: "用于海外工单关闭后评估解决效率、态度与结果。", questions: 7, languages: ["EN", "繁中", "ไทย"], useCount: 118, updatedAt: "2026-07-19", color: "#D85D78", icon: "☏", region: "global" },
];

const defaultCategories = ["版本测试", "满意度", "用户洞察", "运营活动", "服务体验", "招募筛选", "其他"];

export default function TemplatesPage() {
  const router = useRouter();
  const [category, setCategory] = useState("全部模板");
  const [categories, setCategories] = useState(defaultCategories);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Template | null>(null);
  const [region, setRegion] = useState<"global" | "china">("global");
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [sort, setSort] = useState<"使用最多" | "最近更新">("使用最多");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("region");
    if (requested === "china" || requested === "global") setRegion(requested);
    try {
      const savedCategories = JSON.parse(window.localStorage.getItem("joydata-template-categories") || "[]");
      if (savedCategories.length) setCategories(Array.from(new Set([...defaultCategories, ...savedCategories])) as string[]);
      const saved = JSON.parse(window.localStorage.getItem("joydata-survey-templates") || "[]");
      setCustomTemplates(saved.map((item: {
        id: string; label: string; category?: string; categories?: string[]; description: string; questions: number;
        languages: string[]; region: string; useCount?: number; updatedAt?: string; createdAt?: string;
      }) => ({
        id: item.id,
        name: item.label,
        categories: item.categories?.length ? item.categories : [item.category || "其他"],
        description: item.description,
        questions: item.questions,
        languages: item.languages,
        useCount: item.useCount || 0,
        updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
        color: "#4B7FE9",
        icon: "▦",
        custom: true,
        region: item.region === "国内" ? "china" : "global",
      })));
    } catch {}
  }, []);

  const allTemplates = useMemo(() => [...customTemplates, ...builtinTemplates], [customTemplates]);
  const visible = useMemo(() => allTemplates
    .filter((item) =>
      (item.region === region || item.region === "both") &&
      (!onlyMine || item.custom) &&
      (category === "全部模板" || item.categories.includes(category)) &&
      `${item.name}${item.description}${item.categories.join("")}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => sort === "使用最多"
      ? b.useCount - a.useCount
      : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  [allTemplates, category, query, region, onlyMine, sort]);

  function useTemplate(template: Template) {
    router.push(`/survey/new?template=${template.id}&region=${template.region}`);
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function addCategory() {
    const value = newCategory.trim();
    if (!value) return;
    if (categories.includes(value)) {
      flash("该模板分类已存在");
      return;
    }
    const next = [...categories, value];
    setCategories(next);
    window.localStorage.setItem("joydata-template-categories", JSON.stringify(next.filter((item) => !defaultCategories.includes(item))));
    setNewCategory("");
    setShowAddCategory(false);
    setCategory(value);
    flash("模板分类已创建");
  }

  return <main className="template-page">
    <header className="template-topbar"><button onClick={() => router.push("/")}>‹</button><div><span className="wordmark-symbol">✦</span><strong>JoyData 用研中心</strong><i>/</i><span>模板中心</span></div><aside><button className={onlyMine ? "active" : ""} onClick={() => setOnlyMine(!onlyMine)}>{onlyMine ? "查看全部模板" : "我的模板"}</button><button className="primary-button" onClick={() => router.push("/survey/new")}>＋ 创建空白问卷</button></aside></header>
    <section className="template-hero"><div><span>TEMPLATE LIBRARY</span><h1>从同工作区的用研模板开始</h1><p>模板可归入多个分类；国内、海外模板仍按工作区隔离。</p><div className="template-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模板、分类或研究场景" /></div></div><aside className="template-region-switch"><small>模板工作区</small><div><button className={region === "global" ? "active" : ""} onClick={() => setRegion("global")}>海外 GLOBAL</button><button className={region === "china" ? "active" : ""} onClick={() => setRegion("china")}>国内 CHINA</button></div><p>当前只展示可用于该工作区的模板</p></aside></section>
    <div className="template-body">
      <aside className="template-categories">
        <div className="template-category-heading"><strong>模板分类</strong><button onClick={() => setShowAddCategory(true)}>＋</button></div>
        {["全部模板", ...categories].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}><span>{item === "全部模板" ? "▦" : "▱"}</span>{item}<em>{allTemplates.filter((template) => (template.region === region || template.region === "both") && (!onlyMine || template.custom) && (item === "全部模板" || template.categories.includes(item))).length}</em></button>)}
        <button className="add-template-category-button" onClick={() => setShowAddCategory(true)}>＋ 添加分类</button>
      </aside>
      <section className="template-gallery"><header><div><strong>{category}</strong><small>{visible.length} 个可用模板</small></div><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option>使用最多</option><option>最近更新</option></select></header>
        {visible.length ? <div className="template-grid">{visible.map((template) => <article key={template.id}>
          <div className="template-cover" style={{ "--card-color": template.color } as React.CSSProperties}><span>{template.icon}</span><i/><i/><i/>{template.custom && <em>团队模板</em>}</div>
          <div className="template-card-content"><span>{template.categories.join(" · ")} · {template.region === "global" ? "海外" : "国内"}</span><h2>{template.name}</h2><p>{template.description}</p><div><small>{template.questions} 题</small><small>{template.languages.join(" · ")}</small></div><footer><span>{template.useCount} 次使用</span><div><button onClick={() => setSelected(template)}>预览</button><button onClick={() => useTemplate(template)}>使用模板</button></div></footer></div>
        </article>)}</div> : <div className="template-empty"><span>⌕</span><strong>没有匹配的模板</strong><p>换个关键词或查看全部模板。</p><button onClick={() => { setQuery(""); setCategory("全部模板"); }}>清除筛选</button></div>}
      </section>
    </div>

    {showAddCategory && <div className="preview-backdrop" onMouseDown={() => setShowAddCategory(false)}><section className="template-category-modal" onMouseDown={(event) => event.stopPropagation()}><header><strong>添加模板分类</strong><button onClick={() => setShowAddCategory(false)}>×</button></header><label><span>分类名称</span><input autoFocus maxLength={20} value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="例如：版本上线后回访" /></label><p>新分类会用于模板筛选，不影响模板所属工作区。</p><footer><button className="secondary-button" onClick={() => setShowAddCategory(false)}>取消</button><button className="primary-button" onClick={addCategory}>确认添加</button></footer></section></div>}

    {selected && <div className="preview-backdrop" onMouseDown={() => setSelected(null)}><section className="template-preview-modal" onMouseDown={(event) => event.stopPropagation()}><header><div><span style={{ background: selected.color }}>{selected.icon}</span><p><small>{selected.categories.join(" · ")}</small><strong>{selected.name}</strong></p></div><button onClick={() => setSelected(null)}>×</button></header><div className="template-preview-body"><section><h3>模板说明</h3><p>{selected.description}</p><div><span><strong>{selected.questions}</strong><small>题目数量</small></span><span><strong>{selected.languages.length}</strong><small>预置语言</small></span><span><strong>{selected.useCount}</strong><small>团队使用</small></span></div><h3>所属分类</h3><div className="template-category-tags">{selected.categories.map((item) => <span key={item}>{item}</span>)}</div></section><aside><div className="template-phone"><span>RO3 · PLAYER RESEARCH</span><h2>{selected.name}</h2><p>感谢您参与本次调研，您的反馈将帮助我们持续优化游戏体验。</p><small>01 / {selected.questions || 1}</small><strong>您对本次体验的整体满意度如何？</strong>{["非常满意", "满意", "一般"].map((item) => <i key={item}>○ {item}</i>)}</div></aside></div><footer><span>使用后可自由修改所有题目、语言和外观。</span><button className="secondary-button" onClick={() => setSelected(null)}>取消</button><button className="primary-button" onClick={() => useTemplate(selected)}>使用此模板</button></footer></section></div>}
    {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
  </main>;
}
