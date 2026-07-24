"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AccessMode,
  defaultPublications,
  loadPublications,
  Publication,
  publicationUrl,
  Region,
} from "@/lib/survey-publication";
import { SurveyNav } from "../survey-nav";

type Collaborator = {
  id: string;
  name: string;
  department: string;
  role: "owner" | "editor" | "publisher" | "analyst";
  avatar: string;
};

const defaultCollaborators: Collaborator[] = [
  { id: "u1", name: "李孟哲", department: "JoyData 产品", role: "owner", avatar: "李" },
  { id: "u2", name: "Roc 聪", department: "用研中心", role: "publisher", avatar: "R" },
  { id: "u3", name: "庆哥", department: "平台研发", role: "editor", avatar: "庆" },
];

const roleLabels = {
  owner: "所有者",
  editor: "可编辑",
  publisher: "可发布",
  analyst: "仅分析",
};

const accessModes: { key: AccessMode; title: string; description: string; icon: string }[] = [
  { key: "public", title: "公开链接", description: "任何获得链接的玩家均可填写", icon: "◎" },
  { key: "channel", title: "渠道链接", description: "按渠道生成独立链接并追踪来源", icon: "⌁" },
  { key: "assigned", title: "指定玩家", description: "校验账号、Line 或 JM 名单", icon: "♙" },
];

export default function PublishPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const [publications, setPublications] = useState<Publication[]>(defaultPublications);
  const [selectedId, setSelectedId] = useState(defaultPublications[0].id);
  const [section, setSection] = useState<"delivery" | "limits" | "completion">("delivery");
  const [notice, setNotice] = useState("");
  const [showPermission, setShowPermission] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [collaborators, setCollaborators] = useState(defaultCollaborators);
  const hydrated = useRef(false);

  useEffect(() => {
    const loaded = loadPublications(surveyId);
    setPublications(loaded);
    setSelectedId(loaded[0]?.id || "");
    hydrated.current = true;
  }, [surveyId]);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(
      `joydata-survey-publications-${surveyId}`,
      JSON.stringify(publications),
    );
  }, [publications, surveyId]);

  const selected = useMemo(
    () => publications.find((item) => item.id === selectedId) || publications[0],
    [publications, selectedId],
  );

  const checks = useMemo(() => {
    if (!selected) return [];
    return [
      { label: "问卷内容完整", done: true, detail: "3 道题，必答设置有效" },
      { label: "语言内容完整", done: selected.region === "china" || selected.defaultLocale === "en-US", detail: selected.region === "global" ? "English 100%，繁中 67%，ไทย 33%" : "简体中文 100%" },
      { label: "隐私政策与同意", done: selected.privacyConsent, detail: selected.region === "global" ? "海外隐私声明已配置" : "国内个人信息保护声明" },
      { label: "投放时间有效", done: Boolean(selected.startAt && selected.endAt), detail: `${selected.startAt.replace("T", " ")} 至 ${selected.endAt.replace("T", " ")}` },
      { label: "访问规则有效", done: selected.accessMode !== "assigned" || !selected.anonymous, detail: selected.accessMode === "assigned" ? "已启用玩家身份校验" : "无需身份名单" },
    ];
  }, [selected]);

  const passCount = checks.filter((item) => item.done).length;

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function updateSelected(patch: Partial<Publication>) {
    setPublications((current) =>
      current.map((item) => (item.id === selected?.id ? { ...item, ...patch } : item)),
    );
  }

  function createPublication(region: Region) {
    const base = defaultPublications.find((item) => item.region === region)!;
    const id = `pub-${region}-${Date.now()}`;
    const next: Publication = {
      ...base,
      id,
      name: region === "global" ? "新的海外投放" : "新的国内投放",
      slug: `${region === "global" ? "global" : "cn"}-${Date.now().toString().slice(-6)}`,
    };
    setPublications((current) => [...current, next]);
    setSelectedId(id);
    flash("已创建新的发布实例");
  }

  function publish() {
    if (!selected) return;
    if (passCount !== checks.length) {
      flash("发布检查未通过，请先完成右侧待办");
      return;
    }
    if (selected.status === "active") {
      updateSelected({ status: "stopped" });
      flash("已停止回收，新答卷将不再进入");
      return;
    }
    setShowConfirm(true);
  }

  function confirmPublish() {
    updateSelected({ status: "active" });
    setShowConfirm(false);
    flash("发布成功，投放链接已生效");
  }

  function copyLink() {
    if (!selected) return;
    navigator.clipboard?.writeText(publicationUrl(selected));
    flash("投放链接已复制");
  }

  if (!selected) return null;

  return (
    <main className="publish-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title">
          <span className="survey-doc-icon">▤</span>
          <div><strong>RO3 先锋测试玩家体验调研</strong><small><i className="saved" />发布配置自动保存</small></div>
        </div>
        <SurveyNav surveyId={surveyId} active="publish" onNotice={flash} />
        <div className="editor-actions">
          <button className="secondary-button" onClick={() => setShowPermission(true)}>♙ 协作权限</button>
          <button
            className={selected.status === "active" ? "stop-button" : "primary-button"}
            onClick={publish}
          >
            {selected.status === "active" ? "停止回收" : selected.status === "stopped" ? "重新发布" : "发布问卷"}
          </button>
        </div>
      </header>

      <div className="publish-layout">
        <aside className="publication-sidebar">
          <div className="publication-side-head">
            <div><strong>发布实例</strong><small>国内与海外数据相互隔离</small></div>
            <button onClick={() => createPublication("global")}>＋</button>
          </div>
          <div className="region-tip"><span>⌾</span><p>同一份问卷可创建多个投放，链接、语言和数据范围彼此独立。</p></div>
          <div className="publication-list">
            {publications.map((item) => (
              <button
                key={item.id}
                className={selected.id === item.id ? "active" : ""}
                onClick={() => setSelectedId(item.id)}
              >
                <span className={`region-flag ${item.region}`}>{item.region === "global" ? "海" : "内"}</span>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.region === "global" ? "海外数据区 · Global" : "国内数据区 · China"}</small>
                </div>
                <i className={`publication-status ${item.status}`} />
              </button>
            ))}
          </div>
          <div className="publication-create">
            <button onClick={() => createPublication("global")}><span>＋</span>创建海外投放</button>
            <button onClick={() => createPublication("china")}><span>＋</span>创建国内投放</button>
          </div>
        </aside>

        <section className="publication-main">
          <div className="publication-header-card">
            <div className="publication-title-row">
              <div>
                <span className={`region-pill ${selected.region}`}>
                  {selected.region === "global" ? "海外数据区" : "国内数据区"}
                </span>
                <input value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} />
                <p>{selected.region === "global" ? "数据存储于海外区域，适用于海外玩家和全球渠道。" : "数据存储于境内区域，适用于国内玩家与国内发行渠道。"}</p>
              </div>
              <span className={`publication-state-badge ${selected.status}`}>
                {selected.status === "active" ? "回收中" : selected.status === "stopped" ? "已停止" : "草稿"}
              </span>
            </div>
            <div className="publication-link-row">
              <span>⌁</span>
              <div><small>玩家访问链接</small><strong>{publicationUrl(selected)}</strong></div>
              <button onClick={copyLink}>复制链接</button>
              <button onClick={() => flash("二维码已生成，可下载用于线下投放")}>▦ 二维码</button>
            </div>
          </div>

          <div className="publish-section-tabs">
            <button className={section === "delivery" ? "active" : ""} onClick={() => setSection("delivery")}>投放与语言</button>
            <button className={section === "limits" ? "active" : ""} onClick={() => setSection("limits")}>回收限制</button>
            <button className={section === "completion" ? "active" : ""} onClick={() => setSection("completion")}>完成后行为</button>
          </div>

          {section === "delivery" && (
            <div className="publish-config-stack">
              <section className="config-card">
                <header><div><strong>访问方式</strong><small>决定哪些玩家可以打开并提交问卷</small></div></header>
                <div className="access-mode-grid">
                  {accessModes.map((mode) => (
                    <button
                      key={mode.key}
                      className={selected.accessMode === mode.key ? "active" : ""}
                      onClick={() => updateSelected({ accessMode: mode.key, anonymous: mode.key !== "assigned" })}
                    >
                      <span>{mode.icon}</span>
                      <div><strong>{mode.title}</strong><small>{mode.description}</small></div>
                      <i />
                    </button>
                  ))}
                </div>
                {selected.accessMode === "channel" && (
                  <div className="channel-table">
                    <div><strong>渠道名称</strong><strong>参数</strong><strong>默认语言</strong><strong>状态</strong></div>
                    <div><span>Discord 社区</span><code>source=discord</code><span>English</span><em>已启用</em></div>
                    <div><span>Facebook Ads</span><code>source=fb_ads</code><span>English</span><em>已启用</em></div>
                    <button onClick={() => flash("已添加一个待配置渠道")}>＋ 添加渠道</button>
                  </div>
                )}
                {selected.accessMode === "assigned" && (
                  <div className="identity-config">
                    <div><span>♙</span><p><strong>玩家身份校验</strong><small>当前使用 JoyMaker 玩家账号名单，已导入 2,846 人。</small></p><button onClick={() => flash("名单管理面板已准备")}>管理名单</button></div>
                    <label><input type="checkbox" defaultChecked /> 允许使用 Line ID 验证</label>
                    <label><input type="checkbox" /> 允许使用 JM ID 验证</label>
                  </div>
                )}
              </section>

              <section className="config-card">
                <header><div><strong>语言匹配</strong><small>运营只维护一个链接，系统自动为玩家选择语言</small></div></header>
                <div className="language-routing">
                  <label><span>默认语言</span><select value={selected.defaultLocale} onChange={(event) => updateSelected({ defaultLocale: event.target.value })}><option value="en-US">English</option><option value="zh-TW">繁體中文</option><option value="th-TH">ไทย</option><option value="zh-CN">简体中文</option></select></label>
                  <div className="routing-rule">
                    <span className="rule-step">1</span><p><strong>渠道指定语言</strong><small>优先使用渠道链接配置的语言</small></p><em>最高优先级</em>
                  </div>
                  <div className="routing-rule">
                    <span className="rule-step">2</span><p><strong>浏览器语言自动匹配</strong><small>匹配问卷中已启用的最接近语言</small></p><button className={`mini-switch ${selected.browserMatch ? "on" : ""}`} onClick={() => updateSelected({ browserMatch: !selected.browserMatch })}><i /></button>
                  </div>
                  <div className="routing-rule">
                    <span className="rule-step">3</span><p><strong>允许玩家手动切换</strong><small>在填写页右上角显示语言入口</small></p><button className={`mini-switch ${selected.allowLanguageSwitch ? "on" : ""}`} onClick={() => updateSelected({ allowLanguageSwitch: !selected.allowLanguageSwitch })}><i /></button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {section === "limits" && (
            <div className="publish-config-stack">
              <section className="config-card">
                <header><div><strong>回收时间与数量</strong><small>达到任一条件后自动停止接收新答卷</small></div></header>
                <div className="limit-form">
                  <label><span>开始时间</span><input type="datetime-local" value={selected.startAt} onChange={(event) => updateSelected({ startAt: event.target.value })} /></label>
                  <label><span>结束时间</span><input type="datetime-local" value={selected.endAt} onChange={(event) => updateSelected({ endAt: event.target.value })} /></label>
                  <label><span>最多回收答卷</span><div><input type="number" value={selected.totalLimit} onChange={(event) => updateSelected({ totalLimit: Number(event.target.value) })} /><em>份</em></div></label>
                  <label><span>每个账号最多提交</span><div><input type="number" value={selected.perAccountLimit} onChange={(event) => updateSelected({ perAccountLimit: Number(event.target.value) })} /><em>次</em></div></label>
                </div>
              </section>
              <section className="config-card">
                <header><div><strong>防重复与身份</strong><small>减少重复、机器人和无效答卷</small></div></header>
                <div className="setting-switch-list">
                  <div><p><strong>设备防重复</strong><small>同一设备达到次数限制后不可再次提交</small></p><button className={`mini-switch ${selected.deviceLimit ? "on" : ""}`} onClick={() => updateSelected({ deviceLimit: !selected.deviceLimit })}><i /></button></div>
                  <div><p><strong>允许匿名填写</strong><small>不采集 JoyID、Line ID 或 JM ID</small></p><button className={`mini-switch ${selected.anonymous ? "on" : ""}`} onClick={() => updateSelected({ anonymous: !selected.anonymous })}><i /></button></div>
                  <div><p><strong>异常行为检测</strong><small>标记极速提交、相同答案和可疑网络来源</small></p><span className="managed-tag">平台统一开启</span></div>
                </div>
              </section>
              <section className="config-card">
                <header><div><strong>区域合规</strong><small>根据发布数据区应用对应政策</small></div><span className={`region-pill ${selected.region}`}>{selected.region === "global" ? "Global" : "China"}</span></header>
                <div className="setting-switch-list">
                  <div><p><strong>隐私政策确认</strong><small>填写前展示隐私政策并记录同意时间</small></p><button className={`mini-switch ${selected.privacyConsent ? "on" : ""}`} onClick={() => updateSelected({ privacyConsent: !selected.privacyConsent })}><i /></button></div>
                  {selected.region === "global" && <div><p><strong>年龄与监护人确认</strong><small>针对未成年人展示区域化同意流程</small></p><button className={`mini-switch ${selected.ageConsent ? "on" : ""}`} onClick={() => updateSelected({ ageConsent: !selected.ageConsent })}><i /></button></div>}
                  <div><p><strong>数据存储区域</strong><small>{selected.region === "global" ? "海外数据仅进入 Global 数据集群" : "国内数据仅进入 China 数据集群"}</small></p><span className="locked-tag">锁定</span></div>
                </div>
              </section>
            </div>
          )}

          {section === "completion" && (
            <div className="publish-config-stack">
              <section className="config-card">
                <header><div><strong>提交成功后</strong><small>玩家提交答卷后的页面与下一步动作</small></div></header>
                <div className="completion-mode">
                  <button className={selected.completionMode === "message" ? "active" : ""} onClick={() => updateSelected({ completionMode: "message" })}>✓ 显示完成页</button>
                  <button className={selected.completionMode === "redirect" ? "active" : ""} onClick={() => updateSelected({ completionMode: "redirect" })}>↗ 跳转到指定地址</button>
                </div>
                {selected.completionMode === "message" ? (
                  <label className="large-config-field"><span>完成提示语</span><textarea value={selected.completionMessage} onChange={(event) => updateSelected({ completionMessage: event.target.value })} /></label>
                ) : (
                  <label className="large-config-field"><span>跳转地址</span><input placeholder="https://" value={selected.redirectUrl} onChange={(event) => updateSelected({ redirectUrl: event.target.value })} /></label>
                )}
                <div className="completion-preview"><span>✓</span><strong>{selected.completionMessage || "提交成功"}</strong><small>玩家填写完成后看到的效果</small></div>
              </section>
              <section className="config-card">
                <header><div><strong>数据通知 Webhook</strong><small>收到答卷后通知业务系统，不跨区域传输答卷正文</small></div><button className={`mini-switch ${selected.webhookEnabled ? "on" : ""}`} onClick={() => updateSelected({ webhookEnabled: !selected.webhookEnabled })}><i /></button></header>
                {selected.webhookEnabled && (
                  <div className="webhook-form">
                    <label><span>Webhook URL</span><input placeholder="https://your-service.com/webhook" value={selected.webhookUrl} onChange={(event) => updateSelected({ webhookUrl: event.target.value })} /></label>
                    <div><code>POST</code><span>仅发送 response_id、publication_id、region 和完成时间</span><button onClick={() => flash("测试事件发送成功")}>发送测试</button></div>
                  </div>
                )}
              </section>
            </div>
          )}
        </section>

        <aside className="publish-check-panel">
          <div className="check-score">
            <div style={{ "--score": `${passCount / checks.length * 360}deg` } as React.CSSProperties}><strong>{passCount}/{checks.length}</strong></div>
            <span><strong>发布检查</strong><small>{passCount === checks.length ? "所有检查均已通过" : "还有配置需要完成"}</small></span>
          </div>
          <div className="check-list">
            {checks.map((check) => (
              <div key={check.label} className={check.done ? "done" : "warning"}>
                <span>{check.done ? "✓" : "!"}</span>
                <p><strong>{check.label}</strong><small>{check.detail}</small></p>
              </div>
            ))}
          </div>
          <div className="data-boundary-card">
            <span>⌾</span>
            <p><strong>数据边界已锁定</strong><small>{selected.region === "global" ? "本实例答卷只存储在海外区域。" : "本实例答卷只存储在境内区域。"}</small></p>
          </div>
          <button className="preview-player-button" onClick={() => flash("玩家端发布预览已生成")}>▣ 预览玩家端</button>
        </aside>
      </div>

      {showPermission && (
        <div className="preview-backdrop" onMouseDown={() => setShowPermission(false)}>
          <section className="permission-modal" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><strong>协作权限</strong><small>权限只作用于当前问卷，不影响项目角色</small></div><button onClick={() => setShowPermission(false)}>×</button></header>
            <div className="permission-invite">
              <input placeholder="输入姓名或 JoyData 账号" />
              <select><option>可编辑</option><option>可发布</option><option>仅分析</option></select>
              <button onClick={() => flash("邀请已发送")}>邀请</button>
            </div>
            <div className="permission-table-head"><span>成员</span><span>权限</span></div>
            <div className="permission-list">
              {collaborators.map((person) => (
                <div key={person.id}>
                  <span className="member-avatar">{person.avatar}</span>
                  <p><strong>{person.name}</strong><small>{person.department}</small></p>
                  <select
                    disabled={person.role === "owner"}
                    value={person.role}
                    onChange={(event) => setCollaborators((current) => current.map((item) => item.id === person.id ? { ...item, role: event.target.value as Collaborator["role"] } : item))}
                  >
                    {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  {person.role !== "owner" && <button onClick={() => setCollaborators((current) => current.filter((item) => item.id !== person.id))}>移除</button>}
                </div>
              ))}
            </div>
            <footer><span>发布、停止回收、导出和跨区域复制操作都会写入审计日志。</span><button onClick={() => setShowPermission(false)}>完成</button></footer>
          </section>
        </div>
      )}

      {showConfirm && (
        <div className="preview-backdrop" onMouseDown={() => setShowConfirm(false)}>
          <section className="publish-confirm-modal" onMouseDown={(event) => event.stopPropagation()}>
            <span className={`confirm-region-icon ${selected.region}`}>{selected.region === "global" ? "海" : "内"}</span>
            <h2>确认发布到{selected.region === "global" ? "海外" : "国内"}数据区？</h2>
            <p>发布后链接立即生效，新答卷只会写入{selected.region === "global" ? "海外" : "境内"}数据集群。数据区域发布后不可修改。</p>
            <div><span>访问方式</span><strong>{accessModes.find((item) => item.key === selected.accessMode)?.title}</strong><span>默认语言</span><strong>{selected.defaultLocale}</strong><span>回收上限</span><strong>{selected.totalLimit.toLocaleString()} 份</strong></div>
            <footer><button className="secondary-button" onClick={() => setShowConfirm(false)}>取消</button><button className="primary-button" onClick={confirmPublish}>确认发布</button></footer>
          </section>
        </div>
      )}

      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
