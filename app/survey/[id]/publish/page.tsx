"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { defaultPublications, loadPublications, Publication, publicationUrl } from "@/lib/survey-publication";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

const localeLabels: Record<string, string> = {
  "zh-CN": "简体中文",
  "en-US": "English",
  "zh-TW": "繁體中文",
  "th-TH": "ไทย",
};

const languageCodeToLocale: Record<string, string> = {
  简中: "zh-CN",
  EN: "en-US",
  繁中: "zh-TW",
  ไทย: "th-TH",
};

type SourceLink = {
  id: string;
  name: string;
  key: string;
  url: string;
  createdAt: string;
};

export default function PublishPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const [publications, setPublications] = useState<Publication[]>(defaultPublications);
  const [section, setSection] = useState<"release" | "webhook">("release");
  const [languages, setLanguages] = useState(["en-US", "zh-TW", "th-TH"]);
  const [sourceName, setSourceName] = useState("");
  const [sourceKey, setSourceKey] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState<SourceLink[]>([]);
  const [notice, setNotice] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPublications(loadPublications(surveyId));
    try {
      const drafts = JSON.parse(window.localStorage.getItem("joydata-survey-drafts") || "[]");
      const draft = drafts.find((item: { id?: number | string }) => String(item.id) === surveyId);
      if (draft?.languages?.length) {
        const configured = draft.languages.map((item: string) => languageCodeToLocale[item]).filter(Boolean);
        if (configured.length) setLanguages(configured);
      }
      const savedLinks = JSON.parse(window.localStorage.getItem(`joydata-survey-source-links-${surveyId}`) || "[]");
      if (Array.isArray(savedLinks)) {
        setGeneratedLinks(savedLinks.filter((item): item is SourceLink =>
          Boolean(item && typeof item === "object" && item.id && item.name && item.key && item.url),
        ));
      }
    } catch {}
    setHydrated(true);
  }, [surveyId]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(`joydata-survey-publications-${surveyId}`, JSON.stringify(publications));
  }, [publications, surveyId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(`joydata-survey-source-links-${surveyId}`, JSON.stringify(generatedLinks));
  }, [generatedLinks, surveyId, hydrated]);

  const selected = publications[0];

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

  function copyText(value: string, message: string) {
    navigator.clipboard?.writeText(value);
    flash(message);
  }

  function generateParameterizedLink() {
    const name = sourceName.trim();
    const key = sourceKey.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!name) {
      flash("请输入来源名称");
      return;
    }
    if (!key) {
      flash("请输入仅含字母、数字、短横线或下划线的来源标识");
      return;
    }
    if (generatedLinks.some((item) => item.key === key)) {
      flash("该来源标识已存在");
      return;
    }
    const url = `${publicationUrl(selected)}?source=${encodeURIComponent(key)}`;
    setGeneratedLinks((current) => [{
      id: `${Date.now()}`,
      name,
      key,
      url,
      createdAt: new Date().toLocaleDateString("zh-CN"),
    }, ...current]);
    setSourceName("");
    setSourceKey("");
    flash("来源链接已生成");
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
          <button
            className={selected.status === "active" ? "stop-button" : "primary-button"}
            onClick={() => selected.status === "active" ? setShowStopConfirm(true) : setShowConfirm(true)}
          >
            {selected.status === "active" ? "结束收集" : selected.status === "stopped" ? "重新发布" : "发布问卷"}
          </button>
        </div>
      </header>

      <div className="publish-layout publish-layout-single">
        <section className="publication-main">
          <div className="publication-header-card">
            <div className="publication-title-row">
              <div>
                <span className={`region-pill ${selected.region}`}>
                  {selected.region === "global" ? "海外工作区 · GLOBAL" : "国内工作区 · CHINA"}
                </span>
                <input value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} />
                <p>发布后生成一个稳定链接；工作区和数据存储区域不可在此修改。</p>
              </div>
              <span className={`publication-state-badge ${selected.status}`}>
                {selected.status === "active" ? "收集中" : selected.status === "stopped" ? "已结束" : "未发布"}
              </span>
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
              <section className="config-card public-release-card">
                <header>
                  <div><strong>公开发布</strong><small>发布后，获得链接的用户均可打开并填写问卷</small></div>
                  <button className={`mini-switch ${selected.status === "active" ? "on" : ""}`} onClick={() => selected.status === "active" ? setShowStopConfirm(true) : setShowConfirm(true)}><i /></button>
                </header>
                <div className="public-link-area">
                  <div className="public-link-input"><span>{publicationUrl(selected)}</span><button onClick={() => copyText(publicationUrl(selected), "问卷链接已复制")}>复制</button><button onClick={() => window.open(publicationUrl(selected), "_blank")}>打开</button></div>
                  <div className="qr-placeholder"><span>▦</span><small>问卷二维码</small><button onClick={() => flash("二维码已保存")}>保存二维码</button></div>
                </div>
                <div className="parameter-link-builder">
                  <p><strong>来源链接</strong><small>为不同投放位置生成独立链接。用户通过链接提交后，答案会自动记录来源；主链接访问记为“直接访问”。</small></p>
                  <div className="source-link-form">
                    <label><span>来源名称</span><input value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder="例如：Discord 社区" /></label>
                    <label><span>来源标识</span><div><b>source=</b><input value={sourceKey} onChange={(event) => setSourceKey(event.target.value)} placeholder="discord" /></div></label>
                    <button className="primary-button" onClick={generateParameterizedLink}>生成来源链接</button>
                  </div>
                  <div className="source-link-preview">
                    <span>链接预览</span>
                    <code>{publicationUrl(selected)}?source={sourceKey.trim() || "来源标识"}</code>
                  </div>
                  {generatedLinks.length ? (
                    <div className="source-link-table-wrap">
                      <table className="source-link-table">
                        <thead><tr><th>来源名称</th><th>来源标识</th><th>链接</th><th>创建时间</th><th>操作</th></tr></thead>
                        <tbody>{generatedLinks.map((item) => <tr key={item.id}>
                          <td>{item.name}</td>
                          <td><code>{item.key}</code></td>
                          <td><span title={item.url}>{item.url}</span></td>
                          <td>{item.createdAt}</td>
                          <td><button onClick={() => copyText(item.url, "来源链接已复制")}>复制</button><button className="danger-text" onClick={() => setGeneratedLinks((current) => current.filter((link) => link.id !== item.id))}>删除</button></td>
                        </tr>)}</tbody>
                      </table>
                    </div>
                  ) : <div className="source-link-empty">还没有来源链接。需要区分投放位置时再创建即可。</div>}
                </div>
              </section>

              <section className="config-card">
                <header><div><strong>填写页语言</strong><small>语言切换入口固定展示在玩家问卷页面右上角</small></div></header>
                <div className="language-publish-setting">
                  <div className="language-location-preview"><span>RO3 · PLAYER RESEARCH</span><button>🌐 {localeLabels[selected.defaultLocale] || selected.defaultLocale}⌄</button><p>问卷内容从这里开始</p></div>
                  <div className="setting-switch-list">
                    <div><p><strong>允许用户切换语言</strong><small>开启后，玩家可在页面右上角切换问卷已配置的语言</small></p><button className={`mini-switch ${selected.allowLanguageSwitch ? "on" : ""}`} onClick={() => updateSelected({ allowLanguageSwitch: !selected.allowLanguageSwitch })}><i /></button></div>
                    <div className="setting-with-select"><p><strong>用户语言未匹配时展示</strong><small>仅可选择已添加到问卷的语言</small></p><select value={selected.defaultLocale} onChange={(event) => updateSelected({ defaultLocale: event.target.value })}>{languages.map((locale) => <option key={locale} value={locale}>{localeLabels[locale] || locale}</option>)}</select></div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <section className="config-card">
              <header>
                <div><strong>数据推送 Webhook</strong><small>收到有效答卷后，将填写结果以 JSON 格式推送到第三方系统</small></div>
                <button className={`mini-switch ${selected.webhookEnabled ? "on" : ""}`} onClick={() => updateSelected({ webhookEnabled: !selected.webhookEnabled })}><i /></button>
              </header>
              <div className="webhook-notice"><strong>推送规则</strong><span>答卷提交成功后立即推送；接收方需返回 HTTP 200，否则最多自动重试 3 次。</span></div>
              <div className="webhook-form expanded">
                <label><span>请求类型</span><select disabled={!selected.webhookEnabled}><option>POST</option></select></label>
                <label><span>推送地址</span><input disabled={!selected.webhookEnabled} placeholder="https://your-service.com/webhook" value={selected.webhookUrl} onChange={(event) => updateSelected({ webhookUrl: event.target.value })} /></label>
                <label><span>签名密钥</span><input disabled={!selected.webhookEnabled} placeholder="选填，用于验证请求来源" value={selected.webhookSecret} onChange={(event) => updateSelected({ webhookSecret: event.target.value })} /></label>
                <div><code>application/json</code><span>包含答卷编号、问卷编号、语言、来源、完成时间和答案内容</span><button disabled={!selected.webhookEnabled} onClick={() => flash("测试事件发送成功")}>发送测试</button></div>
                <footer><button className="primary-button" disabled={!selected.webhookEnabled} onClick={() => flash("数据推送设置已保存")}>保存设置</button></footer>
              </div>
            </section>
          )}
        </section>
      </div>

      {showConfirm && (
        <div className="preview-backdrop" onMouseDown={() => setShowConfirm(false)}>
          <section className="publish-confirm-modal" onMouseDown={(event) => event.stopPropagation()}>
            <span className={`confirm-region-icon ${selected.region}`}>{selected.region === "global" ? "海" : "内"}</span>
            <h2>{selected.status === "stopped" ? "重新开启问卷收集？" : "确认公开发布问卷？"}</h2>
            <p>发布后主链接立即生效，答卷会写入创建时选定的数据工作区。</p>
            <div><span>发布方式</span><strong>公开链接</strong><span>未匹配语言</span><strong>{localeLabels[selected.defaultLocale] || selected.defaultLocale}</strong></div>
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
