"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Region = "海外" | "国内";
type Status = "收集中" | "草稿" | "已结束";

type Survey = {
  id: number;
  name: string;
  group: string;
  game: string;
  region: Region;
  languages: string[];
  status: Status;
  responses: number;
  updated: string;
  owner: string;
};

type ResearchProject = { name: string; region: Region; project: string };

const seedSurveys: Survey[] = [
  {
    id: 1,
    name: "RO3 先锋测试玩家体验调研",
    group: "3.6版本先锋测试",
    game: "RO3",
    region: "海外",
    languages: ["EN", "繁中", "ไทย"],
    status: "收集中",
    responses: 1286,
    updated: "今天 14:21",
    owner: "李孟哲",
  },
  {
    id: 2,
    name: "HMT VIP 满意度调查 · 2026 Q3",
    group: "2026 Q3 VIP满意度",
    game: "HMT",
    region: "海外",
    languages: ["繁中", "EN"],
    status: "收集中",
    responses: 864,
    updated: "今天 11:08",
    owner: "Kevin Ke",
  },
  {
    id: 3,
    name: "新职业平衡性玩家反馈",
    group: "1.8职业平衡调研",
    game: "ROOC",
    region: "海外",
    languages: ["EN", "한국어", "日本語"],
    status: "草稿",
    responses: 0,
    updated: "昨天 18:42",
    owner: "王怡",
  },
  {
    id: 4,
    name: "国服回归玩家流失原因调研",
    group: "2026暑期回归研究",
    game: "RO国服",
    region: "国内",
    languages: ["简中"],
    status: "已结束",
    responses: 2391,
    updated: "07月21日",
    owner: "刘颖",
  },
  {
    id: 5,
    name: "公会战活动满意度回访",
    group: "公会战赛季回访",
    game: "RO国服",
    region: "国内",
    languages: ["简中"],
    status: "收集中",
    responses: 576,
    updated: "07月20日",
    owner: "陈曦",
  },
];

const navItems = [
  ["⌂", "看板"],
  ["⌁", "分析"],
  ["◎", "投放"],
  ["◇", "营销"],
  ["☏", "客诉"],
  ["♙", "用户"],
  ["▤", "用研"],
  ["⚙", "管理"],
  ["▱", "数据"],
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export default function Home() {
  const router = useRouter();
  const [region, setRegion] = useState<Region>("海外");
  const [activeGroup, setActiveGroup] = useState("全部问卷");
  const [activeProjectGroup, setActiveProjectGroup] = useState<string | null>(null);
  const [activeBusinessProject, setActiveBusinessProject] = useState("全部项目");
  const [projectQuery, setProjectQuery] = useState("");
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showProjectCreate, setShowProjectCreate] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ name: string; count: number; project: string } | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectParent, setNewProjectParent] = useState("RO3");
  const [customProjects, setCustomProjects] = useState<ResearchProject[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"全部" | Status>("全部");
  const [ownerScope, setOwnerScope] = useState<"全部创建人" | "我创建的">("全部创建人");
  const [showWorkspaceMore, setShowWorkspaceMore] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Survey | null>(null);
  const [surveys, setSurveys] = useState(seedSurveys);
  const [trashedIds, setTrashedIds] = useState<number[]>([]);
  const [menuSurvey, setMenuSurvey] = useState<Survey | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Survey | null>(null);
  const [toast, setToast] = useState("");
  const [newName, setNewName] = useState("");
  const [newLanguages, setNewLanguages] = useState(["EN"]);

  useEffect(() => {
    const saved = window.localStorage.getItem("joydata-survey-drafts");
    if (!saved) return;
    try {
      const drafts = JSON.parse(saved) as Survey[];
      setSurveys((current) => {
        const ids = new Set(current.map((item) => item.id));
        return [...drafts.filter((item) => !ids.has(item.id)), ...current];
      });
    } catch {
      window.localStorage.removeItem("joydata-survey-drafts");
    }
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("joydata-survey-projects");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as Array<ResearchProject & { project?: string }>;
      setCustomProjects(parsed.map((item) => ({ ...item, project: item.project || "通用" })));
    } catch {
      window.localStorage.removeItem("joydata-survey-projects");
    }
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("joydata-survey-trash");
    if (saved) setTrashedIds(JSON.parse(saved));
  }, []);

  const visible = useMemo(() => {
    return surveys.filter((survey) => {
      const isTrashed = trashedIds.includes(survey.id);
      const byTrash = activeGroup === "回收站" ? isTrashed : !isTrashed;
      const byRegion = survey.region === region;
      const byBusinessProject = activeBusinessProject === "全部项目" || survey.game === activeBusinessProject;
      const byStatus = status === "全部" || survey.status === status;
      const byView = activeGroup === "全部问卷" || activeGroup === "回收站";
      const byOwner = ownerScope === "全部创建人" || survey.owner === "李孟哲";
      const byProject = !activeProjectGroup || survey.group === activeProjectGroup;
      const byQuery =
        !query ||
        survey.name.toLowerCase().includes(query.toLowerCase()) ||
        survey.game.toLowerCase().includes(query.toLowerCase()) ||
        survey.group.toLowerCase().includes(query.toLowerCase());
      return byTrash && byRegion && byBusinessProject && byStatus && byView && byOwner && byProject && byQuery;
    });
  }, [activeBusinessProject, activeGroup, activeProjectGroup, ownerScope, query, region, status, surveys, trashedIds]);

  const projectGroups = useMemo(() => {
    const groups = new Map<string, { name: string; count: number; project: string }>();
    surveys
      .filter((survey) => survey.region === region && !trashedIds.includes(survey.id) && (activeBusinessProject === "全部项目" || survey.game === activeBusinessProject))
      .forEach((survey) => {
        const key = `${survey.game}::${survey.group}`;
        const current = groups.get(key);
        groups.set(key, { name: survey.group, project: survey.game, count: (current?.count || 0) + 1 });
      });
    customProjects
      .filter((group) => group.region === region && (activeBusinessProject === "全部项目" || group.project === activeBusinessProject))
      .forEach((group) => {
        const key = `${group.project}::${group.name}`;
        if (!groups.has(key)) groups.set(key, { name: group.name, project: group.project, count: 0 });
      });
    return Array.from(groups.values());
  }, [activeBusinessProject, customProjects, region, surveys, trashedIds]);

  const matchingProjectGroups = useMemo(() => {
    const normalizedQuery = projectQuery.trim().toLowerCase();
    if (!normalizedQuery) return projectGroups;
    return projectGroups.filter((group) => group.name.toLowerCase().includes(normalizedQuery));
  }, [projectGroups, projectQuery]);

  const statusCounts = useMemo(() => {
    const current = surveys.filter((survey) => {
      const isTrashed = trashedIds.includes(survey.id);
      const byTrash = activeGroup === "回收站" ? isTrashed : !isTrashed;
      const byView = activeGroup === "全部问卷" || activeGroup === "回收站";
      const byOwner = ownerScope === "全部创建人" || survey.owner === "李孟哲";
      const byBusinessProject = activeBusinessProject === "全部项目" || survey.game === activeBusinessProject;
      const byProject = !activeProjectGroup || survey.group === activeProjectGroup;
      return byTrash && byView && byOwner && byBusinessProject && byProject && survey.region === region;
    });

    return {
      全部: current.length,
      收集中: current.filter((item) => item.status === "收集中").length,
      草稿: current.filter((item) => item.status === "草稿").length,
      已结束: current.filter((item) => item.status === "已结束").length,
    };
  }, [activeBusinessProject, activeGroup, activeProjectGroup, ownerScope, region, surveys, trashedIds]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function createProject() {
    const name = newProjectName.trim();
    if (!name) {
      notify("请输入项目分组名称");
      return;
    }
    if (projectGroups.some((group) => group.name === name && group.project === newProjectParent)) {
      setActiveBusinessProject(newProjectParent);
      setActiveProjectGroup(name);
      setShowProjectCreate(false);
      setNewProjectName("");
      notify("已切换至该项目分组");
      return;
    }
    const next = [...customProjects, { name, region, project: newProjectParent }];
    setCustomProjects(next);
    window.localStorage.setItem("joydata-survey-projects", JSON.stringify(next));
    setActiveProjectGroup(name);
    setActiveGroup("全部问卷");
    setShowProjectCreate(false);
    setNewProjectName("");
    notify("项目分组已创建，可在该分组下创建问卷");
  }

  function deleteProject() {
    if (!projectToDelete) return;
    const { name, count, project } = projectToDelete;
    if (count > 0) {
      setSurveys((current) => current.map((survey) => survey.group === name && survey.game === project ? { ...survey, group: "未归入分组" } : survey));
    }
    const next = customProjects.filter((group) => group.name !== name || group.region !== region || group.project !== project);
    setCustomProjects(next);
    window.localStorage.setItem("joydata-survey-projects", JSON.stringify(next));
    if (activeProjectGroup === name) setActiveProjectGroup(null);
    setProjectToDelete(null);
    setShowProjectManager(false);
    notify(count > 0 ? `已将 ${count} 份问卷移至“未归入分组”，原分组已删除` : "项目分组已删除");
  }

  function toggleLanguage(language: string) {
    setNewLanguages((current) =>
      current.includes(language)
        ? current.filter((item) => item !== language)
        : [...current, language],
    );
  }

  function createSurvey() {
    if (!newName.trim()) {
      notify("请先填写问卷名称");
      return;
    }
    const newSurvey: Survey = {
      id: Date.now(),
      name: newName.trim(),
      group: activeProjectGroup || "未分组",
      game: "RO3",
      region,
      languages: newLanguages.length ? newLanguages : ["EN"],
      status: "草稿",
      responses: 0,
      updated: "刚刚",
      owner: "李孟哲",
    };
    setSurveys((current) => [newSurvey, ...current]);
    setShowCreate(false);
    setNewName("");
    setNewLanguages(["EN"]);
    notify("问卷草稿已创建");
  }

  function duplicateSurvey(survey: Survey) {
    const copy: Survey = {
      ...survey,
      id: Date.now(),
      name: `${survey.name}（副本）`,
      status: "草稿",
      responses: 0,
      updated: "刚刚",
      owner: "李孟哲",
    };
    setSurveys((current) => [copy, ...current]);
    setMenuSurvey(null);
    notify("已复制为新的问卷草稿");
  }

  function moveToTrash(survey: Survey) {
    const next = [...trashedIds, survey.id];
    setTrashedIds(next);
    window.localStorage.setItem("joydata-survey-trash", JSON.stringify(next));
    setConfirmDelete(null);
    setMenuSurvey(null);
    setSelected(null);
    notify("已移入回收站，可在 30 天内恢复");
  }

  function restoreSurvey(survey: Survey) {
    const next = trashedIds.filter((id) => id !== survey.id);
    setTrashedIds(next);
    window.localStorage.setItem("joydata-survey-trash", JSON.stringify(next));
    setMenuSurvey(null);
    notify("问卷已恢复");
  }

  return (
    <main className="app-shell">
      <aside className="global-nav" aria-label="JoyData 主导航">
        <div className="brand-mark" aria-label="欢乐互娱">
          <span>✦</span>
        </div>
        <div className="global-nav-list">
          {navItems.map(([icon, label]) => (
            <button
              className={`global-nav-item ${label === "用研" ? "active" : ""}`}
              key={label}
              aria-current={label === "用研" ? "page" : undefined}
              onClick={() => label !== "用研" && notify(`${label}模块暂未在本页展开`)}
            >
              <span className="global-nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <button className="global-settings" onClick={() => notify("设置已打开")}>
          ⚙
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="wordmark">
            <span className="wordmark-symbol">✦</span>
            <div>
              <strong>欢乐互娱</strong>
              <small>JOY DATA</small>
            </div>
          </div>
          <div className="topbar-project">
            <span className="muted">当前项目</span>
            <button onClick={() => notify("项目切换器已打开")}>
              全项目视图 <span>⌄</span>
            </button>
          </div>
          <div className="topbar-actions">
            <button aria-label="帮助" onClick={() => notify("帮助中心")}>?</button>
            <button aria-label="消息" className="has-dot" onClick={() => notify("暂无新消息")}>◌</button>
            <button className="timezone" onClick={() => notify("时区：UTC+8")}>UTC +8</button>
            <div className="avatar">孟</div>
            <button className="profile" onClick={() => notify("账号菜单")}>
              李孟哲 <span>⌄</span>
            </button>
          </div>
        </header>

        <div className="content-layout">
          <section className="main-content">
            <div className="page-heading">
              <div>
                <div className="breadcrumb">用研中心 <span>/</span> {activeGroup === "回收站" ? "回收站" : "问卷工作台"}</div>
                <h1>{activeGroup === "回收站" ? "回收站" : "问卷工作台"}</h1>
                <p>{activeGroup === "回收站" ? "已删除的问卷会保留 30 天，可恢复后继续使用。" : "创建、发布并查看面向全球玩家的多语言问卷。"}</p>
              </div>
              <div className="heading-actions">
                {activeGroup === "回收站" ? <button className="secondary-button" onClick={() => setActiveGroup("全部问卷")}>← 返回工作台</button> : <><button className="secondary-button" onClick={() => router.push("/survey/templates")}>
                  ▦ 模板中心
                </button><button className="primary-button" onClick={() => router.push(`/survey/new?project=${encodeURIComponent(activeBusinessProject === "全部项目" ? "RO3" : activeBusinessProject)}${activeProjectGroup ? `&group=${encodeURIComponent(activeProjectGroup)}` : ""}`)}>
                  ＋ 创建问卷
                </button></>}
              </div>
            </div>

            <div className="region-banner">
              <div className="region-copy">
                <span className="globe-icon">◎</span>
                <div>
                  <strong>{region}工作空间</strong>
                  <p>
                    {region === "海外"
                      ? "数据存储于海外区域，适用于全球发行与多语言玩家调研。"
                      : "数据存储于中国区域，适用于国内玩家调研与本地合规要求。"}
                  </p>
                </div>
              </div>
              <div className="region-switch" aria-label="区域切换">
                {(["海外", "国内"] as Region[]).map((item) => (
                  <button
                    key={item}
                    className={region === item ? "active" : ""}
                    onClick={() => {
                      setRegion(item);
                      setActiveProjectGroup(null);
                      setProjectQuery("");
                    }}
                  >
                    {item === "海外" ? "海外 GLOBAL" : "国内 CHINA"}
                  </button>
                ))}
              </div>
            </div>

            <section className="survey-panel">
              <div className="panel-toolbar">
                <div className="search-box">
                  <span>⌕</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索问卷名称或游戏"
                    aria-label="搜索问卷"
                  />
                </div>
                <select className="owner-filter project-scope-filter" value={activeBusinessProject} onChange={(event) => { setActiveBusinessProject(event.target.value); setActiveProjectGroup(null); }} aria-label="项目筛选">
                  <option>全部项目</option><option>RO3</option><option>ROOC</option><option>HMT</option><option>RO国服</option><option>通用</option>
                </select>
                <button className={`project-filter-trigger ${activeProjectGroup ? "selected" : ""}`} onClick={() => setShowProjectPicker((current) => !current)}>
                  <span>分组</span><strong>{activeProjectGroup || "全部分组"}</strong><i>⌄</i>
                </button>
                {showProjectPicker && (
                  <div className="project-picker" role="dialog" aria-label="选择项目分组">
                    <div className="project-picker-header"><strong>选择项目分组</strong><button aria-label="关闭分组选择" onClick={() => setShowProjectPicker(false)}>×</button></div>
                    <div className="project-picker-search"><span>⌕</span><input autoFocus value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="搜索分组名称，例如 3.6版本" /></div>
                    <small>分组隶属于项目，用于归档同一版本或同一调研任务下的问卷。</small>
                    <button className="project-create-trigger" onClick={() => setShowProjectCreate((current) => !current)}>＋ 新建项目分组</button>
                    {showProjectCreate && <div className="project-create-stack"><select value={newProjectParent} onChange={(event) => setNewProjectParent(event.target.value)}><option>RO3</option><option>ROOC</option><option>HMT</option><option>RO国服</option><option>通用</option></select><div className="project-create-form"><input autoFocus value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && createProject()} placeholder="例如：3.7版本回归调研" /><button onClick={createProject}>创建</button></div></div>}
                    <button className="project-manager-trigger" onClick={() => { setShowProjectPicker(false); setShowProjectManager(true); }}>管理项目分组</button>
                    <div className="project-picker-list">
                      <button className={!activeProjectGroup ? "selected" : ""} onClick={() => { setActiveProjectGroup(null); setShowProjectPicker(false); }}>全部分组 <em>{projectGroups.reduce((total, group) => total + group.count, 0)}</em></button>
                      {matchingProjectGroups.map((group) => <button key={`${group.project}-${group.name}`} className={activeProjectGroup === group.name && activeBusinessProject === group.project ? "selected" : ""} onClick={() => { setActiveBusinessProject(group.project); setActiveProjectGroup(group.name); setActiveGroup("全部问卷"); setShowProjectPicker(false); }}><span><b>{group.project}</b>{group.name}</span><em>{group.count}</em></button>)}
                      {!matchingProjectGroups.length && <p>未找到匹配分组</p>}
                    </div>
                  </div>
                )}
                <select className="owner-filter" value={ownerScope} onChange={(event) => setOwnerScope(event.target.value as "全部创建人" | "我创建的")} aria-label="创建人筛选">
                  <option>全部创建人</option>
                  <option>我创建的</option>
                </select>
                <div className="filter-tabs" aria-label="状态筛选">
                  {(["全部", "收集中", "草稿", "已结束"] as const).map((item) => (
                    <button
                      key={item}
                      className={status === item ? "active" : ""}
                      onClick={() => setStatus(item)}
                    >
                      {item}
                      <span className="filter-count">{statusCounts[item]}</span>
                    </button>
                  ))}
                </div>
                <button className="filter-button" onClick={() => notify("更多筛选已打开")}>
                  ≡ 筛选
                </button>
                <button className="icon-button" aria-label="刷新" onClick={() => notify("数据已刷新")}>↻</button>
                <div className="workspace-more">
                  <button className="icon-button" aria-label="更多操作" onClick={() => setShowWorkspaceMore((current) => !current)}>•••</button>
                  {showWorkspaceMore && <div className="workspace-more-menu"><button onClick={() => { setActiveGroup("回收站"); setStatus("全部"); setShowWorkspaceMore(false); }}>⌫ 回收站 <em>{trashedIds.length}</em></button></div>}
                </div>
              </div>

              <div className="survey-table" role="table" aria-label="问卷列表">
                <div className="table-head" role="row">
                  <div role="columnheader">问卷名称</div>
                  <div role="columnheader">状态</div>
                  <div role="columnheader">回收数</div>
                  <div role="columnheader">最后更新</div>
                  <div role="columnheader" aria-label="操作" />
                </div>
                {visible.length ? (
                  visible.map((survey) => (
                    <div
                      className="table-row"
                      role="row"
                      key={survey.id}
                      onClick={() => setSelected(survey)}
                    >
                      <div className="survey-name-cell" role="cell">
                        <div className="survey-doc-icon">▤</div>
                        <div>
                          <strong>{survey.name}</strong>
                          <span>{survey.group} · {survey.game}</span>
                        </div>
                      </div>
                      <div role="cell">
                        <span className={`status-badge status-${survey.status}`}>
                          <i /> {survey.status}
                        </span>
                      </div>
                      <div className="number-cell" role="cell">{formatNumber(survey.responses)}</div>
                      <div className="updated-cell" role="cell">
                        <span>{survey.updated}</span>
                        <small>{survey.owner}</small>
                      </div>
                      <div role="cell">
                        <button
                          className="row-menu"
                          aria-label={`${survey.name}的更多操作`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuSurvey(menuSurvey?.id === survey.id ? null : survey);
                          }}
                        >
                          •••
                        </button>
                        {menuSurvey?.id === survey.id && (
                          <div className="survey-operation-menu" onClick={(event) => event.stopPropagation()}>
                            {activeGroup === "回收站" ? (
                              <button onClick={() => restoreSurvey(survey)}>↺ 恢复问卷</button>
                            ) : (
                              <>
                                <button onClick={() => router.push(`/survey/${survey.id}/analytics`)}>▥ 查看数据看板</button>
                                <button onClick={() => router.push(`/survey/${survey.id}/edit`)}>✎ 进入编辑器</button>
                                <button onClick={() => duplicateSurvey(survey)}>⧉ 复制问卷</button>
                                <button onClick={() => notify("移动分组面板已打开")}>▱ 移动到分组</button>
                                <button onClick={() => notify("协作权限面板已打开")}>♙ 协作权限</button>
                                <i />
                                <button className="danger" onClick={() => { setConfirmDelete(survey); setMenuSurvey(null); }}>⌫ 移入回收站</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div>⌕</div>
                    <strong>没有找到相关问卷</strong>
                    <p>{activeGroup === "回收站" ? "回收站中暂无问卷。" : "调整搜索条件或创建一份新问卷。"}</p>
                    {(query || status !== "全部") && (
                      <button className="secondary-button" onClick={() => { setQuery(""); setStatus("全部"); }}>
                        清除筛选
                      </button>
                    )}
                  </div>
                )}
              </div>
              <footer className="panel-footer">
                <span>共 {visible.length} 份问卷</span>
                <div>
                  <button disabled>‹</button>
                  <button className="active">1</button>
                  <button disabled>›</button>
                  <button className="page-size">10 条/页⌄</button>
                </div>
              </footer>
            </section>
          </section>
        </div>
      </section>

      {showCreate && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowCreate(false)}>
          <section
            className="create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span className="modal-eyebrow">NEW SURVEY</span>
                <h2 id="create-title">创建多语言问卷</h2>
                <p>先填写基础信息，题目和逻辑可在编辑器中继续配置。</p>
              </div>
              <button aria-label="关闭" onClick={() => setShowCreate(false)}>×</button>
            </header>
            <div className="modal-content">
              <label>
                <span>问卷名称 <b>*</b></span>
                <input
                  autoFocus
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="例如：RO3 版本满意度调研"
                />
              </label>
              <div className="form-row">
                <label>
                  <span>所属工作空间</span>
                  <div className="static-field">
                    <i className={region === "海外" ? "blue-dot" : "red-dot"} />
                    {region}工作空间
                    <small>{region === "海外" ? "GLOBAL" : "CHINA"}</small>
                  </div>
                </label>
                <label>
                  <span>所属项目</span>
                  <button className="select-field">{activeBusinessProject === "全部项目" ? "RO3" : activeBusinessProject} <span>⌄</span></button>
                </label>
              </div>
              <label>
                <span>问卷语言 <b>*</b></span>
                <div className="language-options">
                  {(region === "海外"
                    ? ["EN", "繁中", "ไทย", "한국어", "日本語"]
                    : ["简中"]
                  ).map((language) => (
                    <button
                      key={language}
                      className={newLanguages.includes(language) ? "selected" : ""}
                      onClick={() => toggleLanguage(language)}
                    >
                      <i>{newLanguages.includes(language) ? "✓" : ""}</i>{language}
                    </button>
                  ))}
                </div>
                <small className="field-help">玩家打开链接时，将优先匹配渠道和浏览器语言。</small>
              </label>
              <div className="smart-default">
                <span>✦</span>
                <div>
                  <strong>已启用智能语言匹配</strong>
                  <p>系统会自动选择最适合玩家的语言，玩家也可以手动切换。</p>
                </div>
                <span className="switch-on"><i /></span>
              </div>
            </div>
            <footer>
              <button className="secondary-button" onClick={() => setShowCreate(false)}>取消</button>
              <button className="primary-button" onClick={createSurvey}>创建并进入编辑器</button>
            </footer>
          </section>
        </div>
      )}

      {showProjectManager && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowProjectManager(false)}>
          <section className="project-manager-modal" role="dialog" aria-modal="true" aria-labelledby="project-manager-title" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span className="modal-eyebrow">GROUP MANAGEMENT</span><h2 id="project-manager-title">管理项目分组</h2><p>分组必须隶属于某个项目；删除分组不会删除问卷或答卷。</p></div><button aria-label="关闭" onClick={() => setShowProjectManager(false)}>×</button></header>
            <div className="project-manager-list">{projectGroups.length ? projectGroups.map((group) => <div key={`${group.project}-${group.name}`}><div><strong>{group.name}</strong><small>{group.project} · {group.count ? `包含 ${group.count} 份问卷` : "暂无问卷"}</small></div><button onClick={() => setProjectToDelete(group)}>删除</button></div>) : <p>当前项目暂无分组。</p>}</div>
            <footer><button className="secondary-button" onClick={() => setShowProjectManager(false)}>关闭</button></footer>
          </section>
        </div>
      )}

      {projectToDelete && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setProjectToDelete(null)}>
          <section className="project-delete-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <span className="delete-warning">!</span><h2>删除“{projectToDelete.name}”分组吗？</h2><p>{projectToDelete.count ? `该分组属于 ${projectToDelete.project}，包含 ${projectToDelete.count} 份问卷。删除后问卷会保留并转移至“未归入分组”，答卷数据不会受影响。` : `该分组属于 ${projectToDelete.project}，当前暂无问卷，删除后不可恢复。`}</p><footer><button className="secondary-button" onClick={() => setProjectToDelete(null)}>取消</button><button className="danger-button" onClick={deleteProject}>确认删除</button></footer>
          </section>
        </div>
      )}

      {selected && (
        <div className="drawer-backdrop" onMouseDown={() => setSelected(null)}>
          <aside
            className="survey-drawer"
            aria-label="问卷详情"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div className="survey-doc-icon large">▤</div>
              <button aria-label="关闭详情" onClick={() => setSelected(null)}>×</button>
            </header>
            <div className="drawer-title">
              <span className={`status-badge status-${selected.status}`}><i /> {selected.status}</span>
              <h2>{selected.name}</h2>
              <p>{selected.group}</p>
            </div>
            <div className="drawer-metrics">
              <div><span>回收数</span><strong>{formatNumber(selected.responses)}</strong></div>
              <div><span>语言</span><strong>{selected.languages.length}</strong></div>
            </div>
            <div className="drawer-section">
              <h3>语言版本</h3>
              {selected.languages.map((language, index) => (
                <div className="language-row" key={language}>
                  <span>{language}</span>
                  <small>{index === 0 ? "默认语言" : "翻译已完成"}</small>
                  <i>✓</i>
                </div>
              ))}
            </div>
            <div className="drawer-section">
              <h3>发布信息</h3>
              <div className="detail-line"><span>工作空间</span><strong>{selected.region}</strong></div>
              <div className="detail-line"><span>所属项目</span><strong>{selected.game}</strong></div>
              <div className="detail-line"><span>创建人</span><strong>{selected.owner}</strong></div>
              <div className="detail-line"><span>最后更新</span><strong>{selected.updated}</strong></div>
            </div>
            <div className="drawer-actions">
              <button className="secondary-button" onClick={() => notify("已复制问卷链接")}>复制链接</button>
              <button className="secondary-button" onClick={() => router.push(`/survey/${selected.id}/edit`)}>进入编辑器</button>
              <button className="primary-button" onClick={() => router.push(`/survey/${selected.id}/analytics`)}>查看数据看板 →</button>
            </div>
          </aside>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-backdrop" onMouseDown={() => setConfirmDelete(null)}>
          <section className="delete-confirm-modal" onMouseDown={(event) => event.stopPropagation()}>
            <span>⌫</span>
            <h2>将问卷移入回收站？</h2>
            <p>“{confirmDelete.name}”将停止回收并移入回收站，30 天内可以恢复。</p>
            <div>
              <button className="secondary-button" onClick={() => setConfirmDelete(null)}>取消</button>
              <button className="danger-button" onClick={() => moveToTrash(confirmDelete)}>移入回收站</button>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
