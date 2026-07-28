"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { defaultPublications, loadPublications, Publication, publicationUrl } from "@/lib/survey-publication";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

type ExtensionLink = {
  id: string;
  value: string;
  url: string;
};

export default function PublishPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const [publications, setPublications] = useState<Publication[]>(defaultPublications);
  const [section, setSection] = useState<"release" | "webhook">("release");
  const [extensionValue, setExtensionValue] = useState("");
  const [generatedLinks, setGeneratedLinks] = useState<ExtensionLink[]>([]);
  const [notice, setNotice] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPublications(loadPublications(surveyId));
    try {
      const savedLinks = JSON.parse(window.localStorage.getItem(`joydata-survey-extension-links-${surveyId}`) || "[]");
      if (Array.isArray(savedLinks)) {
        setGeneratedLinks(savedLinks.filter((item): item is ExtensionLink =>
          Boolean(item && typeof item === "object" && item.id && item.value && item.url),
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
    window.localStorage.setItem(`joydata-survey-extension-links-${surveyId}`, JSON.stringify(generatedLinks));
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
    const value = extensionValue.trim();
    if (!value) {
      flash("请输入扩展值");
      return;
    }
    if (generatedLinks.some((item) => item.value === value)) {
      flash("该扩展值已经生成过链接");
      return;
    }
    const url = `${publicationUrl(selected).replace(/\/$/, "")}/?ext_value=${encodeURIComponent(value)}`;
    setGeneratedLinks((current) => [{
      id: `${Date.now()}`,
      value,
      url,
    }, ...current]);
    setExtensionValue("");
    flash("扩展链接已生成");
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
                  <p><strong>添加链接扩展</strong><small>给主链接添加扩展属性值，可生成多个链接并投放到不同位置，用于区分答卷数据。</small></p>
                  <div className="extension-link-form">
                    <span>{publicationUrl(selected).replace(/\/$/, "")}/</span>
                    <em>?ext_value=</em>
                    <input value={extensionValue} onChange={(event) => setExtensionValue(event.target.value)} placeholder="扩展值" />
                    <button onClick={generateParameterizedLink}>生成链接</button>
                  </div>
                  {generatedLinks.length > 0 && <div className="extension-link-list">
                    {generatedLinks.map((item) => <div key={item.id}>
                      <strong>{item.value}</strong>
                      <span title={item.url}>{item.url}</span>
                      <button onClick={() => copyText(item.url, "扩展链接已复制")}>复制</button>
                      <button onClick={() => setGeneratedLinks((current) => current.filter((link) => link.id !== item.id))}>删除</button>
                    </div>)}
                  </div>}
                </div>
              </section>
            </div>
          ) : (
            <section className="config-card">
              <header>
                <div><strong>数据推送 Webhook</strong><small>收到有效答卷后，将填写结果以 JSON 格式推送到第三方系统</small></div>
              </header>
              <div className="webhook-notice"><strong>温馨提示</strong><span>数据提交后，将向填写的 Webhook 地址发送 JSON 格式的填写结果；接收方需返回 HTTP 200，否则平台认为出现异常，最多重试 3 次。</span></div>
              <div className="webhook-enabled-row"><span>关闭</span><button className={`mini-switch ${selected.webhookEnabled ? "on" : ""}`} onClick={() => updateSelected({ webhookEnabled: !selected.webhookEnabled })}><i /></button><strong>开启</strong></div>
              <div className="webhook-form legacy">
                <label><span><b>*</b> 请求类型</span><select disabled={!selected.webhookEnabled} value={selected.webhookMethod} onChange={(event) => updateSelected({ webhookMethod: event.target.value as "POST" | "GET" })}><option>POST</option><option>GET</option></select></label>
                <label><span><b>*</b> 推送地址</span><input disabled={!selected.webhookEnabled} placeholder="https://your-service.com/webhook" value={selected.webhookUrl} onChange={(event) => updateSelected({ webhookUrl: event.target.value })} /></label>
                <footer><button className="primary-button" disabled={!selected.webhookEnabled} onClick={() => flash("数据推送设置已保存")}>保存设置</button><button className="secondary-button" disabled={!selected.webhookEnabled} onClick={() => flash("测试事件发送成功")}>发送测试</button></footer>
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
            <div><span>发布方式</span><strong>公开链接</strong><span>数据工作区</span><strong>{selected.region === "global" ? "海外" : "国内"}</strong></div>
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
