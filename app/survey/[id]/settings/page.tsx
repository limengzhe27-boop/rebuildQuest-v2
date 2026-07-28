"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { defaultPublications, loadPublications, Publication } from "@/lib/survey-publication";
import { loadQuestions, Question } from "@/lib/survey-builder";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

export default function SurveySettingsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const [publications, setPublications] = useState<Publication[]>(defaultPublications);
  const [section, setSection] = useState<"submission" | "collection">("submission");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [autoSave, setAutoSave] = useState(true);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPublications(loadPublications(surveyId));
    setQuestions(loadQuestions(surveyId));
    setAutoSave(window.localStorage.getItem(`joydata-survey-autosave-${surveyId}`) !== "false");
    setHydrated(true);
  }, [surveyId]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(`joydata-survey-publications-${surveyId}`, JSON.stringify(publications));
    window.localStorage.setItem(`joydata-survey-autosave-${surveyId}`, String(autoSave));
  }, [publications, autoSave, surveyId, hydrated]);

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

  function addRedirectRule() {
    const question = questions.find((item) => !["divider", "description", "imageDisplay", "carousel", "pageBreak"].includes(item.type));
    if (!question) {
      flash("请先在编辑器中添加可作判断的题目");
      return;
    }
    updateSelected({
      redirectRules: [...selected.redirectRules, {
        id: `redirect-${Date.now()}`,
        questionId: question.id,
        operator: "等于",
        value: "",
        url: "",
      }],
    });
  }

  function updateRedirectRule(ruleId: string, patch: Partial<Publication["redirectRules"][number]>) {
    updateSelected({
      redirectRules: selected.redirectRules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...patch } : rule,
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
          <div><strong>{surveyTitle}</strong><small><i className="saved" />设置自动保存</small></div>
        </div>
        <SurveyNav surveyId={surveyId} active="settings" />
        <div className="editor-actions">
          <button className="primary-button" onClick={() => flash("设置已保存")}>保存设置</button>
        </div>
      </header>

      <div className="settings-workspace">
        <section className="settings-main">
          <header className="settings-heading">
            <div>
              <span>FORM SETTINGS</span>
              <h1>问卷设置</h1>
              <p>设置提交后的反馈，以及问卷收集时间、填写方式和防重复规则。</p>
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
                <header><div><strong>提交成功后</strong><small>设置玩家提交答卷后看到的内容</small></div></header>
                <div className="completion-mode">
                  <button className={selected.completionMode === "message" ? "active" : ""} onClick={() => updateSelected({ completionMode: "message" })}>✓ 显示完成页</button>
                  <button className={selected.completionMode === "redirect" ? "active" : ""} onClick={() => updateSelected({ completionMode: "redirect" })}>↗ 跳转指定网页</button>
                </div>
                {selected.completionMode === "message" ? (
                  <label className="large-config-field"><span>提交成功提示语</span><textarea value={selected.completionMessage} onChange={(event) => updateSelected({ completionMessage: event.target.value })} /></label>
                ) : (
                  <label className="large-config-field"><span>跳转地址</span><input placeholder="https://" value={selected.redirectUrl} onChange={(event) => updateSelected({ redirectUrl: event.target.value })} /></label>
                )}
                <div className="completion-preview"><span>✓</span><strong>{selected.completionMessage || "提交成功"}</strong><small>玩家完成问卷后看到的效果</small></div>
              </section>

              <section className="config-card">
                <header>
                  <div><strong>按答案跳转</strong><small>满足条件时跳转到指定页面；没有命中时使用默认提交结果</small></div>
                  <button className="config-add-button" onClick={addRedirectRule}>＋ 添加规则</button>
                </header>
                {selected.redirectRules.length ? (
                  <div className="redirect-rule-list">
                    {selected.redirectRules.map((rule) => (
                      <article key={rule.id}>
                        <span>当</span>
                        <select value={rule.questionId} onChange={(event) => updateRedirectRule(rule.id, { questionId: event.target.value })}>
                          {questions.map((question, index) => <option key={question.id} value={question.id}>{index + 1}. {question.title}</option>)}
                        </select>
                        <select value={rule.operator} onChange={(event) => updateRedirectRule(rule.id, { operator: event.target.value as typeof rule.operator })}>
                          <option>等于</option><option>不等于</option><option>包含</option><option>不包含</option>
                        </select>
                        <input placeholder="答案或选项" value={rule.value} onChange={(event) => updateRedirectRule(rule.id, { value: event.target.value })} />
                        <span>跳转至</span>
                        <input className="redirect-url-input" placeholder="https://" value={rule.url} onChange={(event) => updateRedirectRule(rule.id, { url: event.target.value })} />
                        <button aria-label="删除跳转规则" onClick={() => updateSelected({ redirectRules: selected.redirectRules.filter((item) => item.id !== rule.id) })}>×</button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="config-empty-state"><span>↗</span><p><strong>暂无条件跳转</strong><small>适合按满意度、玩家类型等答案进入不同感谢页或招募页。</small></p></div>
                )}
              </section>

            </div>
          ) : (
            <div className="publish-config-stack">
              <section className="config-card">
                <header><div><strong>填写数据</strong><small>控制填写过程中的暂存、预填和登录方式</small></div></header>
                <div className="setting-switch-list">
                  <div><p><strong>填写时自动暂存数据</strong><small>玩家中途关闭后，再次打开可以继续填写</small></p><button className={`mini-switch ${autoSave ? "on" : ""}`} onClick={() => setAutoSave(!autoSave)}><i /></button></div>
                  <div><p><strong>填充上次填写数据</strong><small>同一账号再次填写时，预填上一次已提交的答案</small></p><button className={`mini-switch ${selected.prefillLastSubmission ? "on" : ""}`} onClick={() => updateSelected({ prefillLastSubmission: !selected.prefillLastSubmission })}><i /></button></div>
                  <div className="setting-with-input"><p><strong>密码填写</strong><small>玩家输入统一密码后才能进入问卷</small></p><input disabled={selected.accessGate !== "password"} value={selected.accessPassword} onChange={(event) => updateSelected({ accessPassword: event.target.value })} placeholder="设置访问密码" /><button className={`mini-switch ${selected.accessGate === "password" ? "on" : ""}`} onClick={() => updateSelected({ accessGate: selected.accessGate === "password" ? "open" : "password" })}><i /></button></div>
                  <div><p><strong>JoyMaker 登录填写</strong><small>使用 JoyMaker / JoyID 识别玩家账号</small></p><button className={`mini-switch ${selected.joymakerLogin ? "on" : ""}`} onClick={() => updateSelected({ joymakerLogin: !selected.joymakerLogin })}><i /></button></div>
                  {selected.region === "global" && <div><p><strong>LINE 登录填写</strong><small>适用于已接入 LINE 的海外发行渠道</small></p><button className={`mini-switch ${selected.lineLogin ? "on" : ""}`} onClick={() => updateSelected({ lineLogin: !selected.lineLogin })}><i /></button></div>}
                  <div><p><strong>记录登录用户基础信息</strong><small>记录账号标识、地区和已授权的基础属性</small></p><button className={`mini-switch ${selected.captureUserProfile ? "on" : ""}`} onClick={() => updateSelected({ captureUserProfile: !selected.captureUserProfile })}><i /></button></div>
                </div>
              </section>

              <section className="config-card">
                <header><div><strong>回收时间与总量</strong><small>达到任一启用条件后停止接收新答卷</small></div><span className="auto-stop-tag">任一满足即结束</span></header>
                <div className="collection-condition-list">
                  <article>
                    <div className="condition-icon">◷</div>
                    <p><strong>允许填写时间</strong><small>仅在开始与结束时间范围内接收答卷</small></p>
                    <input type="datetime-local" value={selected.endAt} onChange={(event) => updateSelected({ endAt: event.target.value, scheduleEnabled: true })} />
                    <button className={`mini-switch ${selected.scheduleEnabled ? "on" : ""}`} onClick={() => updateSelected({ scheduleEnabled: !selected.scheduleEnabled })}><i /></button>
                  </article>
                  <article>
                    <div className="condition-icon">▤</div>
                    <p><strong>设定答题次数上限</strong><small>有效答卷达到数量上限后自动结束</small></p>
                    <div className="condition-number"><input type="number" disabled={!selected.quotaEnabled} value={selected.totalLimit} onChange={(event) => updateSelected({ totalLimit: Number(event.target.value) })} /><span>份</span></div>
                    <button className={`mini-switch ${selected.quotaEnabled ? "on" : ""}`} onClick={() => updateSelected({ quotaEnabled: !selected.quotaEnabled })}><i /></button>
                  </article>
                  <article>
                    <div className="condition-icon">◴</div>
                    <p><strong>每日允许访问时段</strong><small>每天仅在设定时间段内允许打开和填写问卷</small></p>
                    <div className="daily-time-range">
                      <input type="time" disabled={!selected.dailyWindowEnabled} value={selected.dailyStartTime} onChange={(event) => updateSelected({ dailyStartTime: event.target.value })} />
                      <span>至</span>
                      <input type="time" disabled={!selected.dailyWindowEnabled} value={selected.dailyEndTime} onChange={(event) => updateSelected({ dailyEndTime: event.target.value })} />
                    </div>
                    <button className={`mini-switch ${selected.dailyWindowEnabled ? "on" : ""}`} onClick={() => updateSelected({ dailyWindowEnabled: !selected.dailyWindowEnabled })}><i /></button>
                  </article>
                </div>
                <div className="collection-start-row">
                  <label><span>开始时间</span><input type="datetime-local" disabled={!selected.scheduleEnabled} value={selected.startAt} onChange={(event) => updateSelected({ startAt: event.target.value })} /></label>
                  <label><span>结束时间</span><input type="datetime-local" disabled={!selected.scheduleEnabled} value={selected.endAt} onChange={(event) => updateSelected({ endAt: event.target.value })} /></label>
                </div>
              </section>

              <section className="config-card">
                <header><div><strong>停止收集后页面</strong><small>手动结束、定时结束、达到数量上限或当前不在允许访问时段时展示</small></div></header>
                <label className="large-config-field"><span>停止收集提示语</span><textarea value={selected.closedMessage} onChange={(event) => updateSelected({ closedMessage: event.target.value })} /></label>
              </section>

              <section className="config-card">
                <header><div><strong>单个用户与环境限制</strong><small>减少重复提交；相关标识仅用于问卷风控</small></div></header>
                <div className="setting-switch-list">
                  <div className="setting-with-input"><p><strong>每个账号答题次数限制</strong><small>需要登录后才能精确识别账号</small></p><input disabled={!selected.accountLimitEnabled} type="number" min={1} value={selected.perAccountLimit} onChange={(event) => updateSelected({ perAccountLimit: Number(event.target.value) })} /><button className={`mini-switch ${selected.accountLimitEnabled ? "on" : ""}`} onClick={() => updateSelected({ accountLimitEnabled: !selected.accountLimitEnabled })}><i /></button></div>
                  <div className="setting-with-input"><p><strong>每个 IP 答题次数限制</strong><small>作为辅助风控信号，避免同一网络环境重复提交</small></p><input disabled={!selected.ipLimit} type="number" min={1} value={selected.perIpLimit} onChange={(event) => updateSelected({ perIpLimit: Number(event.target.value) })} /><button className={`mini-switch ${selected.ipLimit ? "on" : ""}`} onClick={() => updateSelected({ ipLimit: !selected.ipLimit })}><i /></button></div>
                  <div className="setting-with-input"><p><strong>每台设备答题次数限制</strong><small>通过匿名设备标识限制重复提交</small></p><input disabled={!selected.deviceLimit} type="number" min={1} value={selected.perDeviceLimit} onChange={(event) => updateSelected({ perDeviceLimit: Number(event.target.value) })} /><button className={`mini-switch ${selected.deviceLimit ? "on" : ""}`} onClick={() => updateSelected({ deviceLimit: !selected.deviceLimit })}><i /></button></div>
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
