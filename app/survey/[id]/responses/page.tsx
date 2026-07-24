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
  const [selected, setSelected] = useState<SurveyResponse | null>(surveyResponses[0]);
  const [checked, setChecked] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [liveResponses, setLiveResponses] = useState<SurveyResponse[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(`joydata-survey-live-responses-${surveyId}`);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as LiveSurveyResponse[];
      const mapped = parsed.map((item): SurveyResponse => {
        const durationMinutes = Math.floor(item.durationSeconds / 60);
        const durationSeconds = item.durationSeconds % 60;
        const submittedAt = new Date(item.submittedAt);
        const satisfaction = item.answers.welcome;
        const feedback = item.answers.feedback;
        const nps = item.answers.nps;

        return {
          id: item.id,
          submittedAt: submittedAt.toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).replaceAll("/", "-"),
          playerId: "Anonymous",
          country: "未知",
          locale: runtimeLocales[item.locale],
          channel: item.source || "直接访问",
          device: "Web",
          duration: `${String(durationMinutes).padStart(2, "0")}:${String(durationSeconds).padStart(2, "0")}`,
          status: item.status,
          satisfaction: Array.isArray(satisfaction) ? satisfaction.join("、") : String(satisfaction ?? "—"),
          nps: typeof nps === "number" ? nps : Number(nps ?? 0),
          feedback: Array.isArray(feedback) ? feedback.join("、") : String(feedback ?? ""),
        };
      });
      setLiveResponses(mapped);
      if (mapped[0]) setSelected(mapped[0]);
    } catch {
      setLiveResponses([]);
    }
  }, [surveyId]);

  const allResponses = useMemo(() => [...liveResponses, ...surveyResponses], [liveResponses]);
  const rows = useMemo(() => allResponses.filter((item) => {
    const matchedQuery = `${item.id}${item.playerId}${item.country}${item.channel}`.toLowerCase().includes(query.toLowerCase());
    return matchedQuery && (locale === "all" || item.locale === locale) && (status === "all" || item.status === status);
  }), [allResponses, query, locale, status]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function toggleAll() {
    setChecked(checked.length === rows.length ? [] : rows.map((item) => item.id));
  }

  return (
    <main className="insights-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title"><span className="survey-doc-icon">▤</span><div><strong>{surveyTitle}</strong><small><i className="live-dot" />海外玩家正式投放 · 回收中</small></div></div>
        <SurveyNav surveyId={surveyId} active="responses" onNotice={flash} />
        <div className="editor-actions"><button className="secondary-button" onClick={() => flash("已生成脱敏导出任务，可在消息中心查看进度")}>⇩ 导出答卷</button><button className="primary-button" onClick={() => router.push(`/survey/${surveyId}/analytics`)}>查看分析</button></div>
      </header>

      <section className="response-summary-strip">
        <div><span className="metric-icon blue">▤</span><p><small>已提交答卷</small><strong>{(8421 + liveResponses.length).toLocaleString()}</strong><em>{liveResponses.length > 0 ? `本机体验 +${liveResponses.length}` : "今日 +1,286"}</em></p></div>
        <div><span className="metric-icon green">✓</span><p><small>有效答卷率</small><strong>96.8%</strong><em>较昨日 +1.2%</em></p></div>
        <div><span className="metric-icon orange">◷</span><p><small>平均填写时长</small><strong>3m 42s</strong><em>中位数 3m 18s</em></p></div>
        <div><span className="metric-icon violet">◎</span><p><small>完成率</small><strong>82.4%</strong><em>进入问卷 10,220</em></p></div>
        <div className="region-data-badge"><span>海</span><p><strong>海外数据区</strong><small>答卷明细不会跨区传输</small></p></div>
      </section>

      <div className="responses-toolbar">
        <div className="responses-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索答卷 ID、玩家、国家或渠道" /></div>
        <select value={locale} onChange={(event) => setLocale(event.target.value)}><option value="all">全部语言</option><option>English</option><option>繁體中文</option><option>ไทย</option></select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">全部状态</option><option value="valid">有效</option><option value="suspicious">疑似异常</option><option value="partial">部分完成</option></select>
        <button onClick={() => flash("高级筛选已保存到当前视图")}>☷ 高级筛选</button>
        <span>{rows.length} 条结果</span>
      </div>

      <div className={`responses-workspace ${selected ? "with-detail" : ""}`}>
        <section className="responses-table-wrap">
          {checked.length > 0 && <div className="batch-bar"><strong>已选择 {checked.length} 项</strong><button onClick={() => flash("已将所选答卷标记为有效")}>标记有效</button><button onClick={() => flash("已加入异常复核")}>加入复核</button><button onClick={() => setChecked([])}>取消选择</button></div>}
          <table className="responses-table">
            <thead><tr><th><input type="checkbox" checked={rows.length > 0 && checked.length === rows.length} onChange={toggleAll} /></th><th>提交时间</th><th>玩家标识</th><th>国家/地区</th><th>语言</th><th>渠道</th><th>设备</th><th>填写时长</th><th>状态</th></tr></thead>
            <tbody>
              {rows.map((item) => <tr key={item.id} className={selected?.id === item.id ? "selected" : ""} onClick={() => setSelected(item)}>
                <td onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={checked.includes(item.id)} onChange={() => setChecked((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} /></td>
                <td><strong>{item.submittedAt.slice(11)}</strong><small>{item.submittedAt.slice(0, 10)}</small></td>
                <td><strong className="response-id">{item.id}</strong><small>{item.playerId}</small></td>
                <td>{item.country}</td><td><span className="locale-tag">{item.locale}</span></td><td>{item.channel}</td><td>{item.device}</td><td>{item.duration}</td>
                <td><span className={`response-status ${item.status}`}>{responseStatusLabel[item.status]}</span></td>
              </tr>)}
            </tbody>
          </table>
          <footer className="table-pagination"><span>第 1–{rows.length} 条，共 {(8421 + liveResponses.length).toLocaleString()} 条</span><div><button disabled>‹</button><button className="active">1</button><button>2</button><button>3</button><button>…</button><button>703</button><button>›</button></div><select><option>20 条/页</option><option>50 条/页</option></select></footer>
        </section>

        {selected && <aside className="response-detail">
          <header><div><span className={`response-status ${selected.status}`}>{responseStatusLabel[selected.status]}</span><strong>{selected.id}</strong><small>提交于 {selected.submittedAt}</small></div><button onClick={() => setSelected(null)}>×</button></header>
          <div className="response-profile"><div><span>玩家</span><strong>{selected.playerId}</strong></div><div><span>国家/语言</span><strong>{selected.country} · {selected.locale}</strong></div><div><span>渠道/设备</span><strong>{selected.channel} · {selected.device}</strong></div><div><span>填写时长</span><strong>{selected.duration}</strong></div></div>
          {selected.status === "suspicious" && <div className="risk-callout"><span>!</span><p><strong>疑似极速提交</strong><small>填写时长低于同语言答卷 P1，建议人工复核。</small></p></div>}
          <div className="response-answers">
            <h3>答卷内容 <span>3 题</span></h3>
            <article><small>01 · 单选题</small><strong>您对本次先锋测试的整体体验如何？</strong><p>{selected.satisfaction}</p></article>
            <article><small>02 · NPS</small><strong>您有多大可能向朋友推荐这款游戏？</strong><div className="answer-score"><span>{selected.nps}</span><em>/ 10</em></div></article>
            <article><small>03 · 文本题</small><strong>还有哪些体验可以改进？</strong><p>{selected.feedback || "未作答"}</p></article>
          </div>
          <footer><button onClick={() => flash("复核状态已更新")}>{selected.status === "suspicious" ? "标记为有效" : "标记异常"}</button><button onClick={() => flash("该答卷已生成单独导出文件")}>⇩ 导出</button></footer>
        </aside>}
      </div>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
