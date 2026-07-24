"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Template = {
  id: string;
  name: string;
  category: string;
  description: string;
  questions: number;
  languages: string[];
  uses: string;
  color: string;
  icon: string;
  recommended?: boolean;
};

const templates: Template[] = [
  { id: "game-beta", name: "游戏测试体验调研", category: "版本测试", description: "覆盖整体满意度、战斗体验、性能表现、NPS 与开放反馈。", questions: 12, languages: ["EN", "繁中", "ไทย"], uses: "126 次使用", color: "#4B7FE9", icon: "⚔", recommended: true },
  { id: "update", name: "版本更新满意度", category: "版本测试", description: "用于版本上线后快速了解新内容评价与核心问题。", questions: 9, languages: ["EN", "繁中"], uses: "84 次使用", color: "#7A65DD", icon: "↗" },
  { id: "nps", name: "玩家 NPS 追踪", category: "满意度", description: "标准 NPS 问卷，自动区分推荐者、中立者与贬损者。", questions: 6, languages: ["EN", "繁中", "ไทย"], uses: "203 次使用", color: "#31A773", icon: "10", recommended: true },
  { id: "churn", name: "流失玩家召回调研", category: "用户洞察", description: "了解流失节点、离开原因、回流意愿和激励偏好。", questions: 15, languages: ["EN", "繁中"], uses: "67 次使用", color: "#E47A43", icon: "↺" },
  { id: "event", name: "运营活动复盘", category: "运营活动", description: "评估活动参与、玩法、奖励与传播效果。", questions: 10, languages: ["简中"], uses: "92 次使用", color: "#E2A337", icon: "★" },
  { id: "community", name: "社区玩家画像", category: "用户洞察", description: "收集玩家偏好、游戏习惯、社群参与和内容兴趣。", questions: 18, languages: ["EN", "日本語", "한국어"], uses: "48 次使用", color: "#4CA4B8", icon: "♙" },
  { id: "support", name: "客服满意度回访", category: "服务体验", description: "用于工单关闭后评估解决效率、态度与结果。", questions: 7, languages: ["EN", "繁中", "ไทย"], uses: "118 次使用", color: "#D85D78", icon: "☏" },
  { id: "blank", name: "空白问卷", category: "基础", description: "从空白画布开始，自由添加题目、逻辑和语言。", questions: 0, languages: ["自定义"], uses: "自由创建", color: "#758197", icon: "＋" },
];

const categories = ["全部模板", "版本测试", "满意度", "用户洞察", "运营活动", "服务体验"];

export default function TemplatesPage() {
  const router = useRouter();
  const [category, setCategory] = useState("全部模板");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Template | null>(null);
  const [notice, setNotice] = useState("");

  const visible = useMemo(() => templates.filter((item) =>
    (category === "全部模板" || item.category === category) &&
    `${item.name}${item.description}`.toLowerCase().includes(query.toLowerCase()),
  ), [category, query]);

  function useTemplate(template: Template) {
    const id = Date.now();
    const draft = {
      id, name: template.id === "blank" ? "未命名问卷" : `${template.name} · 新问卷`,
      group: "海外 / 未分组", game: "RO3", region: "海外", languages: template.languages[0] === "自定义" ? ["EN"] : template.languages,
      status: "草稿", responses: 0, completion: 0, updated: "刚刚", owner: "李孟哲",
    };
    const saved = JSON.parse(window.localStorage.getItem("joydata-survey-drafts") || "[]");
    window.localStorage.setItem("joydata-survey-drafts", JSON.stringify([draft, ...saved]));
    router.push(`/survey/${id}/edit`);
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  return <main className="template-page">
    <header className="template-topbar"><button onClick={() => router.push("/")}>‹</button><div><span className="wordmark-symbol">✦</span><strong>JoyData 用研中心</strong><i>/</i><span>模板中心</span></div><aside><button onClick={() => flash("我的模板管理已打开")}>我的模板</button><button className="primary-button" onClick={() => router.push("/survey/new")}>＋ 创建空白问卷</button></aside></header>
    <section className="template-hero"><div><span>TEMPLATE LIBRARY</span><h1>从成熟的用研方案开始</h1><p>复用经过验证的游戏调研结构，并根据项目、地区和语言快速调整。</p><div className="template-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模板或研究场景" /></div></div><aside><div><strong>8</strong><small>官方模板</small></div><div><strong>7</strong><small>覆盖语言</small></div><div><strong>738</strong><small>累计使用</small></div></aside></section>
    <div className="template-body">
      <aside className="template-categories"><strong>模板分类</strong>{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}><span>{item === "全部模板" ? "▦" : "▱"}</span>{item}<em>{item === "全部模板" ? templates.length : templates.filter((template) => template.category === item).length}</em></button>)}<div><span>✦</span><p><strong>创建团队模板</strong><small>把常用问卷保存为团队资产，统一研究标准。</small></p><button onClick={() => flash("保存团队模板功能已打开")}>了解更多</button></div></aside>
      <section className="template-gallery"><header><div><strong>{category}</strong><small>{visible.length} 个可用模板</small></div><select><option>推荐排序</option><option>使用最多</option><option>最近更新</option></select></header>
        {visible.length ? <div className="template-grid">{visible.map((template) => <article key={template.id}>
          <div className="template-cover" style={{"--card-color":template.color} as React.CSSProperties}><span>{template.icon}</span><i/><i/><i/>{template.recommended && <em>官方推荐</em>}</div>
          <div className="template-card-content"><span>{template.category}</span><h2>{template.name}</h2><p>{template.description}</p><div><small>{template.questions || "自由"} 题</small><small>{template.languages.join(" · ")}</small></div><footer><span>{template.uses}</span><div><button onClick={() => setSelected(template)}>预览</button><button onClick={() => useTemplate(template)}>使用模板</button></div></footer></div>
        </article>)}</div> : <div className="template-empty"><span>⌕</span><strong>没有匹配的模板</strong><p>换个关键词或查看全部模板。</p><button onClick={() => { setQuery(""); setCategory("全部模板"); }}>清除筛选</button></div>}
      </section>
    </div>
    {selected && <div className="preview-backdrop" onMouseDown={() => setSelected(null)}><section className="template-preview-modal" onMouseDown={(event) => event.stopPropagation()}><header><div><span style={{background:selected.color}}>{selected.icon}</span><p><small>{selected.category}</small><strong>{selected.name}</strong></p></div><button onClick={() => setSelected(null)}>×</button></header><div className="template-preview-body"><section><h3>模板说明</h3><p>{selected.description}</p><div><span><strong>{selected.questions || "自由"}</strong><small>题目数量</small></span><span><strong>{selected.languages.length}</strong><small>预置语言</small></span><span><strong>{selected.uses.replace(" 次使用","")}</strong><small>团队使用</small></span></div><h3>问卷结构</h3>{["整体体验与满意度","核心玩法体验","性能与设备表现","推荐意愿 NPS","开放反馈与改进建议"].slice(0,selected.id==="blank"?0:5).map((item,index)=><article key={item}><span>{String(index+1).padStart(2,"0")}</span><p><strong>{item}</strong><small>{index===3?"NPS":"题组"}</small></p><em>›</em></article>)}</section><aside><div className="template-phone"><span>RO3 · PLAYER RESEARCH</span><h2>{selected.name}</h2><p>感谢您参与本次调研，您的反馈将帮助我们持续优化游戏体验。</p><small>01 / {selected.questions || 1}</small><strong>您对本次体验的整体满意度如何？</strong>{["非常满意","满意","一般"].map((item)=><i key={item}>○ {item}</i>)}</div></aside></div><footer><span>使用后可自由修改所有题目、语言和外观。</span><button className="secondary-button" onClick={() => setSelected(null)}>取消</button><button className="primary-button" onClick={() => useTemplate(selected)}>使用此模板</button></footer></section></div>}
    {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
  </main>;
}
