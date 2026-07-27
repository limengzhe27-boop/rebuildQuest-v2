"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AccessMode,
  defaultPublications,
  loadPublications,
  Publication,
  publicationUrl,
} from "@/lib/survey-publication";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

const accessModes: { key: Exclude<AccessMode, "assigned">; title: string; description: string; icon: string }[] = [
  { key: "public", title: "公开链接", description: "任何获得链接的玩家均可填写", icon: "◎" },
  { key: "channel", title: "渠道链接", description: "为不同渠道生成参数并追踪来源", icon: "⌁" },
];

export default function PublishPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const [publications, setPublications] = useState<Publication[]>(defaultPublications);
  const [section, setSection] = useState<"release" | "webhook">("release");
  const [notice, setNotice] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    setPublications(loadPublications(surveyId));
    hydrated.current = true;
  }, [surveyId]);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(`joydata-survey-publications-${surveyId}`, JSON.stringify(publications));
  }, [publications, surveyId]);

  const selected = publications[0];
  const checks = useMemo(() => selected ? [
    { label: "问卷内容完整", done: true, detail: "题目与必答规则检查通过" },
    { label: "语言内容完整", done: true, detail: selected.region === "global" ? "默认 English，已启用自动匹配" : "默认简体中文" },
    { label: "访问与合规", done: selected.privacyConsent && (selected.accessGate !== "password" || Boolean(selected.accessPassword)), detail: selected.accessGate === "password" && !selected.accessPassword ? "访问密码尚未设置" : "身份方式与隐私声明已配置" },
    { label: "收集规则有效", done: Boolean(selected.startAt && selected.endAt), detail: "时间与回收限制已配置" },
  ] : [], [selected]);
  const passCount = checks.filter((item) => item.done).length;

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function updateSelected(patch: Partial<Publication>) {
    setPublications((current) =>
      current.map((item, index) => index === 0 ? { ...item, ...patch } : item),
    );
  }

  function confirmPublish() {
    updateSelected({ status: "active", stoppedAt: undefined, stopReason: undefined });
    setShowConfirm(false);
    flash("发布成功，玩家链接已生效");
  }

  function confirmStop() {
    updateSelected({ status: "stopped", stoppedAt: "刚刚", stopReason: "手动结束" });
    setShowStopConfirm(false);
    flash("已结束收集，历史答卷不受影响");
  }

  function copyLink() {
    if (!selected) return;
    navigator.clipboard?.writeText(publicationUrl(selected));
    flash("问卷链接已复制");
  }

  function copyChannelLink(parameter: string) {
    const separator = publicationUrl(selected).includes("?") ? "&" : "?";
    navigator.clipboard?.writeText(`${publicationUrl(selected)}${separator}${parameter}`);
    flash("渠道链接已复制");
  }

  function addChannel() {
    updateSelected({
      accessMode: "channel",
      channels: [
        ...selected.channels,
        {
          id: `channel-${Date.now()}`,
          name: "新渠道",
          parameter: `source=channel_${selected.channels.length + 1}`,
          locale: selected.defaultLocale,
          enabled: true,
        },
      ],
    });
    flash("已添加渠道，可直接修改名称与参数");
  }

  function updateChannel(channelId: string, patch: Partial<Publication["channels"][number]>) {
    updateSelected({
      channels: selected.channels.map((channel) =>
        channel.id === channelId ? { ...channel, ...patch } : channel,
      ),
    });
  }

  if (!selected) return null;

  return (
    <main className="publish-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title">
          <span className="survey-doc-icon">▤</span>
          <div><strong>{surveyTitle}</strong><small><i className="saved" />发布配置自动保存</small></div>
        </div>
        <SurveyNav surveyId={surveyId} active="publish" />
        <div className="editor-actions">
          <button className="secondary-button" onClick={() => router.push(`/s/${selected.slug}?surveyId=${surveyId}`)}>▣ 预览</button>
          <button
            className={selected.status === "active" ? "stop-button" : "primary-button"}
            onClick={() => selected.status === "active" ? setShowStopConfirm(true) : setShowConfirm(true)}
          >
            {selected.status === "active" ? "结束收集" : selected.status === "stopped" ? "重新发布" : "发布问卷"}
          </button>
        </div>
      </header>

      <div className="publish-layout publish-layout-simple">
        <section className="publication-main">
          <div className="publication-header-card">
            <div className="publication-title-row">
              <div>
                <span className={`region-pill ${selected.region}`}>
                  {selected.region === "global" ? "海外工作区 · GLOBAL" : "国内工作区 · CHINA"}
                </span>
                <input value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} />
                <p>工作区在创建问卷时确定，此处不再重复选择；发布后数据写入对应区域。</p>
              </div>
              <span className={`publication-state-badge ${selected.status}`}>
                {selected.status === "active" ? "收集中" : selected.status === "stopped" ? "已结束" : "未发布"}
              </span>
            </div>
            <div className="publication-link-row">
              <span>⌁</span>
              <div><small>玩家访问链接</small><strong>{publicationUrl(selected)}</strong></div>
              <button onClick={copyLink}>复制链接</button>
              <button onClick={() => flash("二维码已生成")}>▦ 二维码</button>
            </div>
            <div className="publication-summary-row">
              <span><small>访问验证</small><strong>{selected.accessGate === "open" ? "无需验证" : selected.accessGate === "password" ? "访问密码" : "玩家账号"}</strong></span>
              <span><small>收集边界</small><strong>{selected.scheduleEnabled ? `定时结束 · ${selected.endAt.replace("T", " ")}` : selected.quotaEnabled ? `${selected.totalLimit} 份后结束` : "手动结束"}</strong></span>
              <button onClick={() => router.push(`/survey/${surveyId}/settings`)}>修改设置 →</button>
            </div>
          </div>

          {selected.status === "stopped" && (
            <div className="collection-ended-banner">
              <span>■</span>
              <p><strong>问卷收集已结束</strong><small>玩家打开原链接会看到结束提示，历史答卷仍可查看。</small></p>
              <button onClick={() => setShowConfirm(true)}>重新开启</button>
            </div>
          )}

          <div className="publish-section-tabs">
            <button className={section === "release" ? "active" : ""} onClick={() => setSection("release")}>公开发布</button>
            <button className={section === "webhook" ? "active" : ""} onClick={() => setSection("webhook")}>数据推送</button>
          </div>

          {section === "release" ? (
            <div className="publish-config-stack">
              <section className="config-card">
                <header><div><strong>访问与渠道</strong><small>生成一个主链接，也可以通过渠道参数区分答案来源</small></div></header>
                <div className="access-mode-grid two-columns">
                  {accessModes.map((mode) => (
                    <button
                      key={mode.key}
                      className={selected.accessMode === mode.key ? "active" : ""}
                      onClick={() => updateSelected({ accessMode: mode.key, anonymous: true })}
                    >
                      <span>{mode.icon}</span>
                      <div><strong>{mode.title}</strong><small>{mode.description}</small></div>
                      <i />
                    </button>
                  ))}
                </div>
                {selected.accessMode === "channel" && (
                  <div className="channel-table">
                    <div className="channel-table-head"><strong>渠道名称</strong><strong>渠道参数</strong><strong>默认语言</strong><strong>状态</strong><strong>操作</strong></div>
                    {selected.channels.map((channel) => (
                      <div className="channel-table-row" key={channel.id}>
                        <input value={channel.name} onChange={(event) => updateChannel(channel.id, { name: event.target.value })} />
                        <input value={channel.parameter} onChange={(event) => updateChannel(channel.id, { parameter: event.target.value.replace(/^\?/, "") })} />
                        <select value={channel.locale} onChange={(event) => updateChannel(channel.id, { locale: event.target.value })}>
                          <option value="en-US">English</option>
                          <option value="zh-TW">繁體中文</option>
                          <option value="th-TH">ไทย</option>
                          <option value="zh-CN">简体中文</option>
                        </select>
                        <button className={`mini-switch ${channel.enabled ? "on" : ""}`} onClick={() => updateChannel(channel.id, { enabled: !channel.enabled })}><i /></button>
                        <span className="channel-row-actions">
                          <button onClick={() => copyChannelLink(channel.parameter)}>复制</button>
                          <button className="danger" onClick={() => updateSelected({ channels: selected.channels.filter((item) => item.id !== channel.id) })}>删除</button>
                        </span>
                      </div>
                    ))}
                    {!selected.channels.length && <div className="channel-empty">还没有渠道链接。添加后可按来源和默认语言区分答卷。</div>}
                    <button onClick={addChannel}>＋ 添加渠道</button>
                  </div>
                )}
              </section>

              <section className="config-card">
                <header><div><strong>语言展示</strong><small>同一链接根据渠道和玩家浏览器语言自动展示对应版本</small></div></header>
                <div className="language-routing">
                  <label>
                    <span>未匹配时的默认语言</span>
                    <select value={selected.defaultLocale} onChange={(event) => updateSelected({ defaultLocale: event.target.value })}>
                      <option value="en-US">English</option>
                      <option value="zh-TW">繁體中文</option>
                      <option value="th-TH">ไทย</option>
                      <option value="zh-CN">简体中文</option>
                    </select>
                  </label>
                  <div className="routing-rule"><span className="rule-step">1</span><p><strong>渠道指定语言</strong><small>优先采用渠道配置</small></p><em>最高优先级</em></div>
                  <div className="routing-rule"><span className="rule-step">2</span><p><strong>自动匹配浏览器语言</strong><small>只匹配问卷中已启用的语言</small></p><button className={`mini-switch ${selected.browserMatch ? "on" : ""}`} onClick={() => updateSelected({ browserMatch: !selected.browserMatch })}><i /></button></div>
                  <div className="routing-rule"><span className="rule-step">3</span><p><strong>允许玩家手动切换</strong><small>填写页显示语言切换入口</small></p><button className={`mini-switch ${selected.allowLanguageSwitch ? "on" : ""}`} onClick={() => updateSelected({ allowLanguageSwitch: !selected.allowLanguageSwitch })}><i /></button></div>
                </div>
              </section>
            </div>
          ) : (
            <section className="config-card">
              <header>
                <div><strong>数据推送 Webhook</strong><small>收到有效答卷后，将事件通知给指定业务系统</small></div>
                <button className={`mini-switch ${selected.webhookEnabled ? "on" : ""}`} onClick={() => updateSelected({ webhookEnabled: !selected.webhookEnabled })}><i /></button>
              </header>
              <div className="webhook-form">
                <label><span>Webhook URL</span><input disabled={!selected.webhookEnabled} placeholder="https://your-service.com/webhook" value={selected.webhookUrl} onChange={(event) => updateSelected({ webhookUrl: event.target.value })} /></label>
                <div><code>POST</code><span>推送答卷编号、问卷编号、渠道与完成时间</span><button disabled={!selected.webhookEnabled} onClick={() => flash("测试事件发送成功")}>发送测试</button></div>
              </div>
            </section>
          )}
        </section>

        <aside className="publish-check-panel">
          <div className="check-score">
            <div style={{ "--score": `${passCount / checks.length * 360}deg` } as React.CSSProperties}><strong>{passCount}/{checks.length}</strong></div>
            <span><strong>发布检查</strong><small>{passCount === checks.length ? "可以发布" : "仍有配置未完成"}</small></span>
          </div>
          <div className="check-list">
            {checks.map((check) => (
              <div key={check.label} className={check.done ? "done" : "warning"}>
                <span>{check.done ? "✓" : "!"}</span><p><strong>{check.label}</strong><small>{check.detail}</small></p>
              </div>
            ))}
          </div>
          <div className="data-boundary-card"><span>◎</span><p><strong>数据区域已锁定</strong><small>{selected.region === "global" ? "答卷只存储在海外数据区。" : "答卷只存储在国内数据区。"}</small></p></div>
        </aside>
      </div>

      {showConfirm && (
        <div className="preview-backdrop" onMouseDown={() => setShowConfirm(false)}>
          <section className="publish-confirm-modal" onMouseDown={(event) => event.stopPropagation()}>
            <span className={`confirm-region-icon ${selected.region}`}>{selected.region === "global" ? "海" : "内"}</span>
            <h2>{selected.status === "stopped" ? "重新开启问卷收集？" : "确认发布问卷？"}</h2>
            <p>发布后当前链接立即生效，答卷会写入创建时选定的数据工作区。</p>
            <div><span>访问方式</span><strong>{accessModes.find((item) => item.key === selected.accessMode)?.title || "公开链接"}</strong><span>默认语言</span><strong>{selected.defaultLocale}</strong></div>
            <footer><button className="secondary-button" onClick={() => setShowConfirm(false)}>取消</button><button className="primary-button" onClick={confirmPublish}>确认发布</button></footer>
          </section>
        </div>
      )}

      {showStopConfirm && (
        <div className="preview-backdrop" onMouseDown={() => setShowStopConfirm(false)}>
          <section className="stop-collection-modal" onMouseDown={(event) => event.stopPropagation()}>
            <span className="stop-collection-icon">■</span>
            <h2>确认手动结束收集？</h2>
            <p>结束后新玩家无法填写，原链接显示结束提示；历史答卷不会被删除。</p>
            <footer><button className="secondary-button" onClick={() => setShowStopConfirm(false)}>取消</button><button className="stop-confirm-button" onClick={confirmStop}>确认结束收集</button></footer>
          </section>
        </div>
      )}

      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
