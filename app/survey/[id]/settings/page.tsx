"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { defaultPublications, loadPublications, Publication } from "@/lib/survey-publication";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

export default function SurveySettingsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const [publications, setPublications] = useState<Publication[]>(defaultPublications);
  const [section, setSection] = useState<"submission" | "collection">("submission");
  const [autoSave, setAutoSave] = useState(true);
  const [notice, setNotice] = useState("");
  const hydrated = useRef(false);

  useEffect(() => {
    setPublications(loadPublications(surveyId));
    setAutoSave(window.localStorage.getItem(`joydata-survey-autosave-${surveyId}`) !== "false");
    hydrated.current = true;
  }, [surveyId]);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(`joydata-survey-publications-${surveyId}`, JSON.stringify(publications));
    window.localStorage.setItem(`joydata-survey-autosave-${surveyId}`, String(autoSave));
  }, [publications, autoSave, surveyId]);

  const selected = publications[0];

  function updateSelected(patch: Partial<Publication>) {
    setPublications((current) =>
      current.map((item, index) => index === 0 ? { ...item, ...patch } : item),
    );
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  if (!selected) return null;

  return (
    <main className="publish-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title">
          <span className="survey-doc-icon">▤</span>
          <div><strong>{surveyTitle}</strong><small><i className="saved" />设置自动保存</small></div>
        </div>
        <SurveyNav surveyId={surveyId} active="settings" />
        <div className="editor-actions">
          <button className="secondary-button" onClick={() => router.push(`/s/${selected.slug}?surveyId=${surveyId}`)}>▣ 预览</button>
          <button className="primary-button" onClick={() => flash("设置已保存")}>保存设置</button>
        </div>
      </header>

      <div className="settings-workspace">
        <section className="settings-main">
          <header className="settings-heading">
            <div>
              <span>FORM SETTINGS</span>
              <h1>问卷设置</h1>
              <p>配置提交完成页和答卷收集规则。发布渠道与链接请前往“发布”。</p>
            </div>
            <span className={`region-pill ${selected.region}`}>
              {selected.region === "global" ? "海外工作区 · GLOBAL" : "国内工作区 · CHINA"}
            </span>
          </header>

          <div className="publish-section-tabs settings-tabs">
            <button className={section === "submission" ? "active" : ""} onClick={() => setSection("submission")}>提交设置</button>
            <button className={section === "collection" ? "active" : ""} onClick={() => setSection("collection")}>回收设置</button>
          </div>

          {section === "submission" ? (
            <div className="publish-config-stack">
              <section className="config-card">
                <header><div><strong>提交成功后</strong><small>设置玩家完成问卷后看到的内容或跳转页面</small></div></header>
                <div className="completion-mode">
                  <button className={selected.completionMode === "message" ? "active" : ""} onClick={() => updateSelected({ completionMode: "message" })}>✓ 显示完成页</button>
                  <button className={selected.completionMode === "redirect" ? "active" : ""} onClick={() => updateSelected({ completionMode: "redirect" })}>↗ 跳转指定网页</button>
                </div>
                {selected.completionMode === "message" ? (
                  <label className="large-config-field"><span>完成提示语</span><textarea value={selected.completionMessage} onChange={(event) => updateSelected({ completionMessage: event.target.value })} /></label>
                ) : (
                  <label className="large-config-field"><span>跳转地址</span><input placeholder="https://" value={selected.redirectUrl} onChange={(event) => updateSelected({ redirectUrl: event.target.value })} /></label>
                )}
                <div className="completion-preview"><span>✓</span><strong>{selected.completionMessage || "提交成功"}</strong><small>玩家完成问卷后看到的效果</small></div>
              </section>

              <section className="config-card">
                <header><div><strong>问卷结束页</strong><small>手动结束、定时结束或达到数量上限后展示</small></div></header>
                <label className="large-config-field"><span>结束提示语</span><textarea value={selected.closedMessage} onChange={(event) => updateSelected({ closedMessage: event.target.value })} /></label>
              </section>
            </div>
          ) : (
            <div className="publish-config-stack">
              <section className="config-card">
                <header><div><strong>收集时间与数量</strong><small>达到任一已启用条件后自动结束收集</small></div><span className="auto-stop-tag">任一满足即结束</span></header>
                <div className="collection-condition-list">
                  <article>
                    <div className="condition-icon">◷</div>
                    <p><strong>定时结束</strong><small>到达指定时间后停止接收新答卷</small></p>
                    <input type="datetime-local" disabled={!selected.scheduleEnabled} value={selected.endAt} onChange={(event) => updateSelected({ endAt: event.target.value })} />
                    <button className={`mini-switch ${selected.scheduleEnabled ? "on" : ""}`} onClick={() => updateSelected({ scheduleEnabled: !selected.scheduleEnabled })}><i /></button>
                  </article>
                  <article>
                    <div className="condition-icon">▤</div>
                    <p><strong>达到答卷数量</strong><small>有效提交达到上限后自动结束</small></p>
                    <div className="condition-number"><input type="number" disabled={!selected.quotaEnabled} value={selected.totalLimit} onChange={(event) => updateSelected({ totalLimit: Number(event.target.value) })} /><span>份</span></div>
                    <button className={`mini-switch ${selected.quotaEnabled ? "on" : ""}`} onClick={() => updateSelected({ quotaEnabled: !selected.quotaEnabled })}><i /></button>
                  </article>
                </div>
                <div className="collection-start-row">
                  <label><span>开始时间</span><input type="datetime-local" value={selected.startAt} onChange={(event) => updateSelected({ startAt: event.target.value })} /></label>
                  <label><span>每个账号最多提交</span><div><input type="number" min={1} value={selected.perAccountLimit} onChange={(event) => updateSelected({ perAccountLimit: Number(event.target.value) })} /><em>次</em></div></label>
                </div>
                <div className="inflight-policy">
                  <span>◷</span><p><strong>结束时正在填写的答卷</strong><small>允许已开始填写的玩家在宽限期内完成提交。</small></p>
                  <select value={selected.graceMinutes} onChange={(event) => updateSelected({ graceMinutes: Number(event.target.value) })}><option value={0}>立即结束</option><option value={10}>宽限 10 分钟</option><option value={30}>宽限 30 分钟</option><option value={60}>宽限 1 小时</option></select>
                </div>
              </section>

              <section className="config-card">
                <header><div><strong>填写与防重复</strong><small>保留通用、跨地区适用的有效设置</small></div></header>
                <div className="setting-switch-list">
                  <div><p><strong>填写过程自动暂存</strong><small>玩家意外关闭页面后可以继续填写</small></p><button className={`mini-switch ${autoSave ? "on" : ""}`} onClick={() => setAutoSave(!autoSave)}><i /></button></div>
                  <div><p><strong>设备防重复</strong><small>同一设备达到账号次数限制后不可再次提交</small></p><button className={`mini-switch ${selected.deviceLimit ? "on" : ""}`} onClick={() => updateSelected({ deviceLimit: !selected.deviceLimit })}><i /></button></div>
                  <div><p><strong>允许匿名填写</strong><small>不要求 JoyID、Line ID 或 JM ID</small></p><button className={`mini-switch ${selected.anonymous ? "on" : ""}`} onClick={() => updateSelected({ anonymous: !selected.anonymous })}><i /></button></div>
                  <div><p><strong>异常行为检测</strong><small>自动标记极速提交、重复答案和可疑来源</small></p><span className="managed-tag">平台统一开启</span></div>
                </div>
              </section>

              <section className="config-card">
                <header><div><strong>区域合规</strong><small>根据创建时选择的工作区应用对应政策</small></div><span className={`region-pill ${selected.region}`}>{selected.region === "global" ? "Global" : "China"}</span></header>
                <div className="setting-switch-list">
                  <div><p><strong>隐私政策确认</strong><small>填写前展示隐私政策并记录同意时间</small></p><button className={`mini-switch ${selected.privacyConsent ? "on" : ""}`} onClick={() => updateSelected({ privacyConsent: !selected.privacyConsent })}><i /></button></div>
                  {selected.region === "global" && <div><p><strong>年龄与监护人确认</strong><small>针对未成年人展示区域化同意流程</small></p><button className={`mini-switch ${selected.ageConsent ? "on" : ""}`} onClick={() => updateSelected({ ageConsent: !selected.ageConsent })}><i /></button></div>}
                  <div><p><strong>数据存储区域</strong><small>{selected.region === "global" ? "答卷只进入海外数据集群" : "答卷只进入国内数据集群"}</small></p><span className="locked-tag">创建后锁定</span></div>
                </div>
              </section>
            </div>
          )}
        </section>
      </div>

      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
