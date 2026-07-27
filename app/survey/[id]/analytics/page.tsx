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
const userDistributions = [
  { title: "国家/地区", field: "submit_address", rows: [["美国", 2486], ["泰国", 1769], ["中国台湾", 1138], ["菲律宾", 842], ["德国", 598], ["其他", 1588]] },
  { title: "问卷语言", field: "locale", rows: [["English", 5226], ["繁體中文", 1632], ["ไทย", 1293], ["简体中文", 270]] },
  { title: "渠道来源", field: "ext_value", rows: [["Discord", 2738], ["Facebook Ads", 2013], ["Steam 社区", 1398], ["LINE 社群", 1052], ["X / Twitter", 724], ["直接访问", 496]] },
  { title: "设备系统", field: "submit_os", rows: [["Windows", 3664], ["Android", 2431], ["iOS", 1987], ["其他", 339]] },
  { title: "账号类型", field: "joy_user_info / line_user_info", rows: [["JoyMaker", 4218], ["LINE", 1867], ["匿名", 2336]] },
] as const;

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const [locale, setLocale] = useState("全部语言");
  const [range, setRange] = useState("全部时间");
  const [tab, setTab] = useState<"answers" | "users">("answers");
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
          <div><span>{tab === "answers" ? "ANSWER STATISTICS" : "USER DISTRIBUTION"}</span><h1>{tab === "answers" ? "答案统计" : "用户分布"}</h1><p>{tab === "answers" ? "按题目展示所有有效答卷的统计结果。" : "按地区、语言、渠道、设备和账号类型查看答卷用户构成。"}</p></div>
          <div className="answer-total"><small>共收到</small><strong>{totalResponses.toLocaleString()}</strong><span>份答卷</span></div>
        </header>

        <div className="statistics-view-tabs">
          <button className={tab === "answers" ? "active" : ""} onClick={() => setTab("answers")}><strong>答案统计</strong><small>每道题的选项、人数与占比</small></button>
          <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}><strong>用户分布</strong><small>地区、语言、渠道、设备与账号</small></button>
        </div>

        <div className="analytics-simple-filters">
          <label>语言<select value={locale} onChange={(event) => setLocale(event.target.value)}><option>全部语言</option><option>English</option><option>繁體中文</option><option>ไทย</option></select></label>
          <label>提交时间<select value={range} onChange={(event) => setRange(event.target.value)}><option>全部时间</option><option>今日</option><option>近 7 天</option><option>近 30 天</option></select></label>
          <span>当前口径：{tab === "answers" ? "有效答卷（无效答卷不计入）" : "全部已提交答卷的用户属性"}</span>
        </div>

        {tab === "answers" ? <div className="question-stat-list">
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
        </div> : <div className="user-distribution-content">
          <div className="user-distribution-summary">
            <span><small>识别用户</small><strong>6,982</strong><em>JoyMaker 或 LINE 去重</em></span>
            <span><small>匿名答卷</small><strong>2,336</strong><em>无账号标识</em></span>
            <span><small>覆盖国家/地区</small><strong>42</strong><em>基于提交地址</em></span>
          </div>
          <div className="user-distribution-grid">
            {userDistributions.map((group) => <article className="user-distribution-card" key={group.title}>
              <header><div><strong>{group.title}</strong><small>数据字段：{group.field}</small></div><span>{totalResponses.toLocaleString()} 份</span></header>
              <table><thead><tr><th>{group.title}</th><th>答卷数</th><th>占比</th></tr></thead><tbody>{group.rows.map(([label, count]) => <tr key={label}><td>{label}</td><td>{Number(count).toLocaleString()}</td><td>{(Number(count) / totalResponses * 100).toFixed(1)}%</td></tr>)}</tbody></table>
            </article>)}
          </div>
        </div>}
      </section>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
