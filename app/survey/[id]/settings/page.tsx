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
  const [section, setSection] = useState<"basic" | "submission" | "collection" | "access">("basic");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [autoSave, setAutoSave] = useState(true);
  const [internalNote, setInternalNote] = useState("");
  const [surveyMeta, setSurveyMeta] = useState({
    game: "RO3",
    group: "3.6版本先锋测试",
    region: "海外工作区",
  });
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPublications(loadPublications(surveyId));
    setQuestions(loadQuestions(surveyId));
    setAutoSave(window.localStorage.getItem(`joydata-survey-autosave-${surveyId}`) !== "false");
    try {
      const drafts = JSON.parse(window.localStorage.getItem("joydata-survey-drafts") || "[]");
      const draft = drafts.find((item: { id?: number | string }) => String(item.id) === surveyId);
      setSurveyMeta({
        game: draft?.game || "RO3",
        group: draft?.group || "3.6版本先锋测试",
        region: draft?.region ? `${draft.region}工作区` : "海外工作区",
      });
      setInternalNote(
        window.localStorage.getItem(`joydata-survey-note-${surveyId}`)
          ?? draft?.note
          ?? (surveyId === "1" ? "面向 RO3 先锋测试玩家，了解整体体验、推荐意愿与改进方向。" : ""),
      );
    } catch {
      setInternalNote(window.localStorage.getItem(`joydata-survey-note-${surveyId}`) || "");
    }
    setHydrated(true);
  }, [surveyId]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(`joydata-survey-publications-${surveyId}`, JSON.stringify(publications));
    window.localStorage.setItem(`joydata-survey-autosave-${surveyId}`, String(autoSave));
    window.localStorage.setItem(`joydata-survey-note-${surveyId}`, internalNote);
    try {
      const drafts = JSON.parse(window.localStorage.getItem("joydata-survey-drafts") || "[]");
      const nextDrafts = drafts.map((item: { id?: number | string }) =>
        String(item.id) === surveyId ? { ...item, note: internalNote } : item,
      );
      window.localStorage.setItem("joydata-survey-drafts", JSON.stringify(nextDrafts));
    } catch {
      // The dedicated note key above remains available even if legacy draft data is invalid.
    }
  }, [publications, autoSave, internalNote, surveyId, hydrated]);

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
      redirectRules: [
        ...selected.redirectRules,
        {
          id: `redirect-${Date.now()}`,
          questionId: question.id,
          operator: "等于",
          value: "",
          url: "",
        },
      ],
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
              <p>配置提交结果、收集边界和玩家访问方式。发布链接与渠道参数请前往“发布”。</p>
            </div>
            <span className={`region-pill ${selected.region}`}>
              {selected.region === "global" ? "海外工作区 · GLOBAL" : "国内工作区 · CHINA"}
            </span>
          </header>

          <div className="publish-section-tabs settings-tabs">
            <button className={section === "basic" ? "active" : ""} onClick={() => setSection("basic")}>基础信息</button>
            <button className={section === "submission" ? "active" : ""} onClick={() => setSection("submission")}>提交设置</button>
            <button className={section === "collection" ? "active" : ""} onClick={() => setSection("collection")}>收集规则</button>
            <button className={section === "access" ? "active" : ""} onClick={() => setSection("access")}>访问与身份</button>
          </div>

          {section === "basic" ? (
            <div className="publish-config-stack">
              <section className="config-card">
                <header>
                  <div>
                    <strong>问卷归属</strong>
                    <small>创建时确定的项目、分组和工作区，用于后台管理与筛选</small>
                  </div>
                </header>
                <div className="survey-basic-grid">
                  <div><span>所属项目</span><strong>{surveyMeta.game}</strong></div>
                  <div><span>项目分组</span><strong>{surveyMeta.group}</strong></div>
                  <div><span>工作区</span><strong>{surveyMeta.region}</strong></div>
                </div>
              </section>

              <section className="config-card">
                <header>
                  <div>
                    <strong>内部备注</strong>
                    <small>记录调研背景、目标玩家、负责人或补充说明；仅后台成员可见</small>
                  </div>
                </header>
                <label className="large-config-field">
                  <span>备注内容</span>
                  <textarea
                    value={internalNote}
                    onChange={(event) => setInternalNote(event.target.value)}
                    placeholder="例如：面向 RO3 先锋测试玩家，用于版本上线前体验评估。"
                  />
                  <small className="field-help">该内容不会出现在玩家填写页、分享页或导出的答卷中。</small>
                </label>
              </section>
            </div>
          ) : section === "submission" ? (
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
                <header>
                  <div><strong>按答案跳转</strong><small>满足条件时优先跳转到指定页面；未命中时使用上方默认结果</small></div>
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

              <section className="config-card">
                <header><div><strong>问卷结束页</strong><small>手动结束、定时结束或达到数量上限后展示</small></div></header>
                <label className="large-config-field"><span>结束提示语</span><textarea value={selected.closedMessage} onChange={(event) => updateSelected({ closedMessage: event.target.value })} /></label>
              </section>
            </div>
          ) : section === "collection" ? (
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
                  <div><p><strong>恢复未完成的填写</strong><small>再次打开同一问卷时，从上次中断的位置继续</small></p><button className={`mini-switch ${selected.resumeEnabled ? "on" : ""}`} onClick={() => updateSelected({ resumeEnabled: !selected.resumeEnabled })}><i /></button></div>
                  <div><p><strong>设备防重复</strong><small>同一设备达到账号次数限制后不可再次提交</small></p><button className={`mini-switch ${selected.deviceLimit ? "on" : ""}`} onClick={() => updateSelected({ deviceLimit: !selected.deviceLimit })}><i /></button></div>
                  <div><p><strong>IP 防重复</strong><small>作为辅助风控信号，避免同一网络环境重复提交</small></p><button className={`mini-switch ${selected.ipLimit ? "on" : ""}`} onClick={() => updateSelected({ ipLimit: !selected.ipLimit })}><i /></button></div>
                  <div><p><strong>异常行为检测</strong><small>自动标记极速提交、重复答案和可疑来源</small></p><span className="managed-tag">平台统一开启</span></div>
                </div>
              </section>

            </div>
          ) : (
            <div className="publish-config-stack">
              <section className="config-card">
                <header><div><strong>玩家访问方式</strong><small>只选择一种入口验证方式，避免多个开关互相冲突</small></div></header>
                <div className="access-gate-grid">
                  {[
                    { key: "open", title: "无需验证", description: "获得链接即可填写，适合公开调研", icon: "◎" },
                    { key: "password", title: "访问密码", description: "输入统一密码后进入问卷", icon: "⌨" },
                    { key: "account", title: "玩家账号", description: "登录后填写，可精确限制次数", icon: "♙" },
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      className={selected.accessGate === mode.key ? "active" : ""}
                      onClick={() => updateSelected({ accessGate: mode.key as Publication["accessGate"], anonymous: mode.key === "open" })}
                    >
                      <span>{mode.icon}</span><p><strong>{mode.title}</strong><small>{mode.description}</small></p><i />
                    </button>
                  ))}
                </div>
                {selected.accessGate === "password" && (
                  <label className="large-config-field compact-config-field"><span>访问密码</span><input type="text" placeholder="设置 4–20 位密码" value={selected.accessPassword} onChange={(event) => updateSelected({ accessPassword: event.target.value })} /></label>
                )}
                {selected.accessGate === "account" && (
                  <div className="account-provider-list">
                    <div><p><strong>JoyMaker / JoyID</strong><small>适用于游戏内与官方账号渠道</small></p><button className={`mini-switch ${selected.joymakerLogin ? "on" : ""}`} onClick={() => updateSelected({ joymakerLogin: !selected.joymakerLogin })}><i /></button></div>
                    {selected.region === "global" && <div><p><strong>LINE 登录</strong><small>适用于已接入 LINE 的海外发行渠道</small></p><button className={`mini-switch ${selected.lineLogin ? "on" : ""}`} onClick={() => updateSelected({ lineLogin: !selected.lineLogin })}><i /></button></div>}
                  </div>
                )}
              </section>

              <section className="config-card">
                <header><div><strong>区域合规</strong><small>按创建问卷时选定的数据工作区应用对应规则</small></div><span className={`region-pill ${selected.region}`}>{selected.region === "global" ? "Global" : "China"}</span></header>
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
