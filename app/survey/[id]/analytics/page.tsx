"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

const totalResponses = 8421;
const satisfaction = [
  ["非常满意", 3251],
  ["满意", 3134],
  ["一般", 1378],
  ["不满意", 497],
  ["非常不满意", 161],
] as const;
const npsGroups = [
  ["推荐者（9–10 分）", 4987],
  ["中立者（7–8 分）", 1674],
  ["贬损者（0–6 分）", 1718],
] as const;
const textTopics = [
  ["战斗流畅度", 1842],
  ["职业平衡", 1376],
  ["新手引导", 968],
  ["匹配机制", 742],
  ["性能与卡顿", 617],
] as const;

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const [locale, setLocale] = useState("全部语言");
  const [range, setRange] = useState("全部时间");
  const [notice, setNotice] = useState("");
  const satisfactionMax = useMemo(() => Math.max(...satisfaction.map((item) => item[1])), []);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  return (
    <main className="insights-page analytics-simple-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title"><span className="survey-doc-icon">▤</span><div><strong>{surveyTitle}</strong><small><i className="live-dot" />统计数据更新于 2 分钟前</small></div></div>
        <SurveyNav surveyId={surveyId} active="analytics" onNotice={flash} />
        <div className="editor-actions"><button className="secondary-button" onClick={() => router.push(`/survey/${surveyId}/responses`)}>查看答卷明细</button><button className="primary-button" onClick={() => flash("统计结果已开始导出")}>⇩ 导出统计</button></div>
      </header>

      <section className="analytics-simple-shell">
        <header className="analytics-simple-heading">
          <div><span>ANSWER STATISTICS</span><h1>答案统计</h1><p>按题目展示所有已提交答卷的统计结果。</p></div>
          <div className="answer-total"><small>共收到</small><strong>{totalResponses.toLocaleString()}</strong><span>份答卷</span></div>
        </header>

        <div className="analytics-simple-filters">
          <label>语言<select value={locale} onChange={(event) => setLocale(event.target.value)}><option>全部语言</option><option>English</option><option>繁體中文</option><option>ไทย</option></select></label>
          <label>提交时间<select value={range} onChange={(event) => setRange(event.target.value)}><option>全部时间</option><option>今日</option><option>近 7 天</option><option>近 30 天</option></select></label>
          <span>当前口径：已提交答卷</span>
        </div>

        <div className="question-stat-list">
          <article className="question-stat-card">
            <header><div><span>第 1 题 · 单选题</span><h2>您对本次先锋测试的整体体验如何？</h2></div><p><strong>{totalResponses.toLocaleString()}</strong><small>份回答</small></p></header>
            <table>
              <thead><tr><th>选项</th><th>人数</th><th>占比</th><th>分布</th></tr></thead>
              <tbody>{satisfaction.map(([label, count]) => {
                const percent = count / totalResponses * 100;
                return <tr key={label}><td>{label}</td><td>{count.toLocaleString()}</td><td>{percent.toFixed(1)}%</td><td><i className="plain-stat-bar"><em style={{ width: `${count / satisfactionMax * 100}%` }} /></i></td></tr>;
              })}</tbody>
            </table>
          </article>

          <article className="question-stat-card">
            <header><div><span>第 2 题 · NPS</span><h2>您有多大可能向朋友推荐这款游戏？</h2></div><p><strong>42</strong><small>NPS</small></p></header>
            <div className="nps-plain-summary"><span><small>平均分</small><strong>7.4 / 10</strong></span><span><small>有效回答</small><strong>8,379</strong></span></div>
            <table>
              <thead><tr><th>分组</th><th>人数</th><th>占比</th></tr></thead>
              <tbody>{npsGroups.map(([label, count]) => <tr key={label}><td>{label}</td><td>{count.toLocaleString()}</td><td>{(count / 8379 * 100).toFixed(1)}%</td></tr>)}</tbody>
            </table>
          </article>

          <article className="question-stat-card">
            <header><div><span>第 3 题 · 文本题</span><h2>还有哪些体验可以改进？</h2></div><p><strong>6,924</strong><small>份回答</small></p></header>
            <table>
              <thead><tr><th>高频主题</th><th>提及次数</th><th>占文本回答比例</th></tr></thead>
              <tbody>{textTopics.map(([label, count]) => <tr key={label}><td>{label}</td><td>{count.toLocaleString()}</td><td>{(count / 6924 * 100).toFixed(1)}%</td></tr>)}</tbody>
            </table>
            <footer className="text-answer-link"><span>文本题只做主题计数，原始回答请在答卷明细中查看。</span><button onClick={() => router.push(`/survey/${surveyId}/responses`)}>查看全部文本答案 →</button></footer>
          </article>
        </div>
      </section>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
