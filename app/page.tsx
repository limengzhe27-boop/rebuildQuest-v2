"use client";

import { useMemo, useState } from "react";

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
  completion: number;
  updated: string;
  owner: string;
};

const seedSurveys: Survey[] = [
  {
    id: 1,
    name: "RO3 先锋测试玩家体验调研",
    group: "RO3 / 版本调研",
    game: "RO3",
    region: "海外",
    languages: ["EN", "繁中", "ไทย"],
    status: "收集中",
    responses: 1286,
    completion: 84.2,
    updated: "今天 14:21",
    owner: "李孟哲",
  },
  {
    id: 2,
    name: "HMT VIP 满意度调查 · 2026 Q3",
    group: "HMT / 满意度",
    game: "RO仙境传说",
    region: "海外",
    languages: ["繁中", "EN"],
    status: "收集中",
    responses: 864,
    completion: 78.6,
    updated: "今天 11:08",
    owner: "Kevin Ke",
  },
  {
    id: 3,
    name: "新职业平衡性玩家反馈",
    group: "ROOC / 版本调研",
    game: "ROOC",
    region: "海外",
    languages: ["EN", "한국어", "日本語"],
    status: "草稿",
    responses: 0,
    completion: 0,
    updated: "昨天 18:42",
    owner: "王怡",
  },
  {
    id: 4,
    name: "国服回归玩家流失原因调研",
    group: "国内 / 用户研究",
    game: "RO国服",
    region: "国内",
    languages: ["简中"],
    status: "已结束",
    responses: 2391,
    completion: 91.4,
    updated: "07月21日",
    owner: "刘颖",
  },
  {
    id: 5,
    name: "公会战活动满意度回访",
    group: "国内 / 运营活动",
    game: "RO国服",
    region: "国内",
    languages: ["简中"],
    status: "收集中",
    responses: 576,
    completion: 76.8,
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

const quickGroups = [
  ["全部问卷", 12],
  ["我创建的", 5],
  ["与我协作", 3],
  ["草稿", 2],
  ["回收站", 1],
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export default function Home() {
  const [region, setRegion] = useState<Region>("海外");
  const [activeGroup, setActiveGroup] = useState("全部问卷");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"全部" | Status>("全部");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Survey | null>(null);
  const [surveys, setSurveys] = useState(seedSurveys);
  const [toast, setToast] = useState("");
  const [newName, setNewName] = useState("");
  const [newLanguages, setNewLanguages] = useState(["EN"]);

  const visible = useMemo(() => {
    return surveys.filter((survey) => {
      const byRegion = survey.region === region;
      const byStatus = status === "全部" || survey.status === status;
      const byQuery =
        !query ||
        survey.name.toLowerCase().includes(query.toLowerCase()) ||
        survey.game.toLowerCase().includes(query.toLowerCase());
      return byRegion && byStatus && byQuery;
    });
  }, [query, region, status, surveys]);

  const metrics = useMemo(() => {
    const current = surveys.filter((item) => item.region === region);
    const responses = current.reduce((sum, item) => sum + item.responses, 0);
    const collecting = current.filter((item) => item.status === "收集中").length;
    const active = current.filter((item) => item.responses > 0);
    const completion =
      active.reduce((sum, item) => sum + item.completion, 0) / (active.length || 1);
    return { responses, collecting, completion };
  }, [region, surveys]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
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
      group: `${region} / 未分组`,
      game: "RO3",
      region,
      languages: newLanguages.length ? newLanguages : ["EN"],
      status: "草稿",
      responses: 0,
      completion: 0,
      updated: "刚刚",
      owner: "李孟哲",
    };
    setSurveys((current) => [newSurvey, ...current]);
    setShowCreate(false);
    setNewName("");
    setNewLanguages(["EN"]);
    notify("问卷草稿已创建");
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
              RO3 东南亚服 <span>⌄</span>
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
          <aside className="survey-sidebar">
            <div className="sidebar-heading">
              <div>
                <small>USER RESEARCH</small>
                <h2>用研中心</h2>
              </div>
              <button aria-label="新建分组" onClick={() => notify("新建分组")}>＋</button>
            </div>
            <nav aria-label="问卷导航">
              <p className="sidebar-label">问卷管理</p>
              {quickGroups.map(([label, count]) => (
                <button
                  key={label}
                  className={activeGroup === label ? "active" : ""}
                  onClick={() => setActiveGroup(String(label))}
                >
                  <span className="folder-icon">{label === "回收站" ? "⌫" : "▱"}</span>
                  <span>{label}</span>
                  <em>{count}</em>
                </button>
              ))}
              <p className="sidebar-label with-action">
                项目分组 <button onClick={() => notify("新建项目分组")}>＋</button>
              </p>
              <button onClick={() => setActiveGroup("版本调研")}>
                <span className="folder-icon">▹</span>
                <span>版本调研</span>
                <em>4</em>
              </button>
              <button onClick={() => setActiveGroup("满意度")}>
                <span className="folder-icon">▹</span>
                <span>满意度</span>
                <em>3</em>
              </button>
              <button onClick={() => setActiveGroup("运营活动")}>
                <span className="folder-icon">▹</span>
                <span>运营活动</span>
                <em>2</em>
              </button>
              <p className="sidebar-label">资源</p>
              <button onClick={() => notify("模板中心已打开")}>
                <span className="folder-icon">▦</span>
                <span>模板中心</span>
              </button>
              <button onClick={() => notify("主题中心已打开")}>
                <span className="folder-icon">◫</span>
                <span>主题中心</span>
              </button>
            </nav>
            <div className="sidebar-tip">
              <span>i</span>
              <p><strong>多语言问卷</strong><br />自动匹配玩家语言，也支持手动切换。</p>
            </div>
          </aside>

          <section className="main-content">
            <div className="page-heading">
              <div>
                <div className="breadcrumb">用研中心 <span>/</span> 问卷工作台</div>
                <h1>问卷工作台</h1>
                <p>创建、发布并分析面向全球玩家的多语言问卷。</p>
              </div>
              <div className="heading-actions">
                <button className="secondary-button" onClick={() => notify("已进入模板中心")}>
                  ▦ 模板中心
                </button>
                <button className="primary-button" onClick={() => setShowCreate(true)}>
                  ＋ 创建问卷
                </button>
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
                    onClick={() => setRegion(item)}
                  >
                    {item === "海外" ? "海外 GLOBAL" : "国内 CHINA"}
                  </button>
                ))}
              </div>
            </div>

            <div className="metric-grid">
              <article className="metric-card">
                <div className="metric-icon blue">▤</div>
                <div>
                  <p>当前问卷</p>
                  <strong>{surveys.filter((item) => item.region === region).length}</strong>
                  <small><i className="green-dot" /> {metrics.collecting} 份正在收集</small>
                </div>
              </article>
              <article className="metric-card">
                <div className="metric-icon violet">↗</div>
                <div>
                  <p>近 30 天回收</p>
                  <strong>{formatNumber(metrics.responses)}</strong>
                  <small className="up">↑ 12.8% 较上月</small>
                </div>
              </article>
              <article className="metric-card">
                <div className="metric-icon amber">✓</div>
                <div>
                  <p>平均完成率</p>
                  <strong>{metrics.completion.toFixed(1)}%</strong>
                  <small>整体填写质量良好</small>
                </div>
              </article>
              <article className="metric-card language-card">
                <div className="metric-icon cyan">文</div>
                <div>
                  <p>覆盖语言</p>
                  <strong>{region === "海外" ? "7" : "1"}</strong>
                  <small>{region === "海外" ? "英语、繁中、泰语等" : "简体中文"}</small>
                </div>
              </article>
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
                <div className="filter-tabs" aria-label="状态筛选">
                  {(["全部", "收集中", "草稿", "已结束"] as const).map((item) => (
                    <button
                      key={item}
                      className={status === item ? "active" : ""}
                      onClick={() => setStatus(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <button className="filter-button" onClick={() => notify("更多筛选已打开")}>
                  ≡ 筛选
                </button>
                <button className="icon-button" aria-label="刷新" onClick={() => notify("数据已刷新")}>↻</button>
                <button className="icon-button" aria-label="更多操作" onClick={() => notify("更多操作")}>•••</button>
              </div>

              <div className="survey-table" role="table" aria-label="问卷列表">
                <div className="table-head" role="row">
                  <div role="columnheader">问卷名称</div>
                  <div role="columnheader">语言</div>
                  <div role="columnheader">状态</div>
                  <div role="columnheader">回收数</div>
                  <div role="columnheader">完成率</div>
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
                      <div className="language-list" role="cell">
                        {survey.languages.slice(0, 2).map((language) => (
                          <span key={language}>{language}</span>
                        ))}
                        {survey.languages.length > 2 && <span>+{survey.languages.length - 2}</span>}
                      </div>
                      <div role="cell">
                        <span className={`status-badge status-${survey.status}`}>
                          <i /> {survey.status}
                        </span>
                      </div>
                      <div className="number-cell" role="cell">{formatNumber(survey.responses)}</div>
                      <div className="completion-cell" role="cell">
                        <div className="progress-track">
                          <i style={{ width: `${survey.completion}%` }} />
                        </div>
                        <span>{survey.completion ? `${survey.completion}%` : "—"}</span>
                      </div>
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
                            notify("已打开问卷操作菜单");
                          }}
                        >
                          •••
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div>⌕</div>
                    <strong>没有找到相关问卷</strong>
                    <p>调整搜索条件或创建一份新问卷。</p>
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
                  <button className="select-field">RO3 东南亚服 <span>⌄</span></button>
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
              <div><span>完成率</span><strong>{selected.completion || 0}%</strong></div>
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
              <div className="detail-line"><span>所属游戏</span><strong>{selected.game}</strong></div>
              <div className="detail-line"><span>创建人</span><strong>{selected.owner}</strong></div>
              <div className="detail-line"><span>最后更新</span><strong>{selected.updated}</strong></div>
            </div>
            <div className="drawer-actions">
              <button className="secondary-button" onClick={() => notify("已复制问卷链接")}>复制链接</button>
              <button className="primary-button" onClick={() => notify("进入问卷编辑器")}>进入编辑器 →</button>
            </div>
          </aside>
        </div>
      )}

      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}
