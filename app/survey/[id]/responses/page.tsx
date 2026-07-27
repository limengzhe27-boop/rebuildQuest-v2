"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { responseStatusLabel, SurveyResponse, surveyResponses } from "@/lib/survey-responses";
import { LiveSurveyResponse, runtimeLocales } from "@/lib/survey-runtime";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

export default function ResponsesPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const [query, setQuery] = useState("");
  const [locale, setLocale] = useState("all");
  const [status, setStatus] = useState("all");
  const [notice, setNotice] = useState("");
  const [liveResponses, setLiveResponses] = useState<SurveyResponse[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(`joydata-survey-live-responses-${surveyId}`);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as LiveSurveyResponse[];
      setLiveResponses(parsed.map((item): SurveyResponse => {
        const submittedAt = new Date(item.submittedAt);
        return {
          id: item.id,
          submittedAt: submittedAt.toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-"),
          playerId: "Anonymous",
          country: "未知",
          locale: runtimeLocales[item.locale],
          channel: item.source || "直接访问",
          device: "Web",
          duration: `${String(Math.floor(item.durationSeconds / 60)).padStart(2, "0")}:${String(item.durationSeconds % 60).padStart(2, "0")}`,
          status: item.status,
          satisfaction: String(item.answers.welcome ?? "—"),
          nps: Number(item.answers.nps ?? 0),
          feedback: String(item.answers.feedback ?? ""),
        };
      }));
    } catch {
      setLiveResponses([]);
    }
  }, [surveyId]);

  const allResponses = useMemo(() => [...liveResponses, ...surveyResponses], [liveResponses]);
  const rows = useMemo(() => allResponses.filter((item) => {
    const content = `${item.id}${item.playerId}${item.country}${item.channel}${item.satisfaction}${item.feedback}`.toLowerCase();
    return content.includes(query.toLowerCase()) && (locale === "all" || item.locale === locale) && (status === "all" || item.status === status);
  }), [allResponses, locale, query, status]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  return (
    <main className="insights-page response-table-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title"><span className="survey-doc-icon">▤</span><div><strong>{surveyTitle}</strong><small><i className="live-dot" />答卷明细 · 海外数据区</small></div></div>
        <SurveyNav surveyId={surveyId} active="responses" onNotice={flash} />
        <div className="editor-actions"><button className="secondary-button" onClick={() => router.push(`/survey/${surveyId}/analytics`)}>返回答案统计</button><button className="primary-button" onClick={() => flash("答卷明细已开始导出")}>⇩ 导出明细</button></div>
      </header>

      <section className="response-table-shell">
        <header className="response-table-heading">
          <div><span>RESPONSE DATA</span><h1>答卷明细</h1><p>一行代表一份提交，题目答案与提交环境均直接显示在表格中。</p></div>
          <div><small>共</small><strong>{(8421 + liveResponses.length).toLocaleString()}</strong><span>份答卷</span></div>
        </header>

        <div className="responses-toolbar response-table-toolbar">
          <div className="responses-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索答卷、玩家、渠道或答案" /></div>
          <select value={locale} onChange={(event) => setLocale(event.target.value)}><option value="all">全部语言</option><option>English</option><option>繁體中文</option><option>ไทย</option></select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">全部状态</option><option value="valid">有效</option><option value="suspicious">疑似异常</option><option value="partial">部分完成</option></select>
          <span>当前显示 {rows.length} 条</span>
        </div>

        <div className="flat-response-table-wrap">
          <table className="flat-response-table">
            <thead><tr><th>答卷编号</th><th>提交时间</th><th>玩家标识</th><th>国家/地区</th><th>语言</th><th>渠道来源</th><th>设备</th><th>填写时长</th><th>整体满意度</th><th>NPS</th><th>改进建议</th><th>状态</th></tr></thead>
            <tbody>{rows.map((item) => <tr key={item.id}>
              <td><strong>{item.id}</strong></td>
              <td>{item.submittedAt}</td>
              <td>{item.playerId}</td>
              <td>{item.country}</td>
              <td>{item.locale}</td>
              <td>{item.channel}</td>
              <td>{item.device}</td>
              <td>{item.duration}</td>
              <td>{item.satisfaction}</td>
              <td><strong>{item.nps}</strong></td>
              <td className="answer-text-cell" title={item.feedback}>{item.feedback || "—"}</td>
              <td><span className={`response-status ${item.status}`}>{responseStatusLabel[item.status]}</span></td>
            </tr>)}</tbody>
          </table>
          <footer className="table-pagination"><span>第 1–{rows.length} 条，共 {(8421 + liveResponses.length).toLocaleString()} 条</span><div><button disabled>‹</button><button className="active">1</button><button>2</button><button>3</button><button>…</button><button>703</button><button>›</button></div><select><option>20 条/页</option><option>50 条/页</option></select></footer>
        </div>
        <p className="schema-note">字段对应：提交结果 original_data、提交地址 submit_address、系统/浏览器 submit_os 与 submit_browser、渠道 ext_value、填写时长 complete_time、账号信息 joy_user_info / line_user_info。</p>
      </section>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
