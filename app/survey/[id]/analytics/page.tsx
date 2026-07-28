"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";
import { loadQuestions, Question, questionLabels } from "@/lib/survey-builder";
import { LiveSurveyResponse, MatrixAnswer } from "@/lib/survey-runtime";

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
  { title: "设备系统", field: "submit_os", rows: [["Windows", 3664], ["Android", 2431], ["iOS", 1987], ["其他", 339]] },
  { title: "账号类型", field: "joy_user_info / line_user_info", rows: [["JoyaMaker", 4218], ["LINE", 1867], ["匿名", 2336]] },
] as const;
const collectionTrend = [
  ["07-18", "星期六", 914],
  ["07-19", "星期日", 1086],
  ["07-20", "星期一", 1254],
  ["07-21", "星期二", 1188],
  ["07-22", "星期三", 1362],
  ["07-23", "星期四", 1409],
  ["07-24", "星期五", 1208],
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
  const [matrixQuestions, setMatrixQuestions] = useState<Question[]>([]);
  const [liveResponses, setLiveResponses] = useState<LiveSurveyResponse[]>([]);

  useEffect(() => {
    setMatrixQuestions(loadQuestions(surveyId).filter((question) => ["matrix", "matrixSelect", "matrixScale", "matrixSlider", "matrixDropdown"].includes(question.type)));
    try {
      setLiveResponses(JSON.parse(window.localStorage.getItem(`joydata-survey-live-responses-${surveyId}`) || "[]"));
    } catch {
      setLiveResponses([]);
    }
  }, [surveyId]);

  const matrixReports = useMemo(() => matrixQuestions.map((question) => {
    const rows = question.matrixRows?.length ? question.matrixRows : ["行 1", "行 2", "行 3"];
    const columns = question.matrixColumns?.length ? question.matrixColumns : question.options || ["选项 1", "选项 2", "选项 3"];
    const answers = liveResponses.map((response) => response.answers[question.id]).filter((answer): answer is MatrixAnswer => Boolean(answer && typeof answer === "object" && !Array.isArray(answer)));
    const numericColumns = columns.every((column) => Number.isFinite(Number(column)));
    const rowStats = rows.map((row) => {
      const values = answers.map((answer) => answer[row]).filter((value): value is string | number => typeof value === "string" || typeof value === "number");
      const counts = columns.map((column) => values.filter((value) => String(value) === String(column)).length);
      const numericValues = values.map(Number).filter(Number.isFinite);
      const average = numericColumns && numericValues.length ? numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length : null;
      return { row, counts, average, answered: values.length };
    });
    const responseTotals = numericColumns
      ? answers.map((answer) => rows.map((row) => Number(answer[row])).filter(Number.isFinite).reduce((sum, value) => sum + value, 0))
      : [];
    const averageTotal = responseTotals.length ? responseTotals.reduce((sum, value) => sum + value, 0) / responseTotals.length : null;
    return { question, rows, columns, rowStats, answers: answers.length, numericColumns, averageTotal };
  }), [liveResponses, matrixQuestions]);
  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function statisticsReportHtml() {
    const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] || character));
    const table = (headers: string[], rows: (string | number)[][]) => `<table><thead><tr>${headers.map((item) => `<th>${escape(String(item))}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((item) => `<td>${escape(String(item))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const answerSections = [
      `<h2>第 1 题　您对本次先锋测试的整体体验如何？</h2>${table(["选项", "回答人数", "占比"], satisfaction.map(([label, count]) => [label, count.toLocaleString(), `${(count / totalResponses * 100).toFixed(1)}%`]))}`,
      `<h2>第 2 题　NPS</h2>${table(["分组", "回答人数", "占比"], npsGroups.map(([label, count]) => [label, count.toLocaleString(), `${(count / 8379 * 100).toFixed(1)}%`]))}`,
      `<h2>第 3 题　还有哪些体验可以改进？</h2>${table(["高频主题", "提及次数", "占比"], textTopics.map(([label, count]) => [label, count.toLocaleString(), `${(count / 6924 * 100).toFixed(1)}%`]))}`,
    ].join("");
    const userSections = [
      `<h2>关键指标</h2>${table(["识别用户", "平均答题时间", "覆盖国家/地区"], [["6,982", "3 分 42 秒", "42"]])}`,
      `<h2>近 7 天收集趋势</h2>${table(["日期", "星期", "有效答卷"], collectionTrend.map((row) => [...row]))}`,
      ...userDistributions.map((group) => `<h2>${group.title}</h2>${table([group.title, "答卷数", "占比"], group.rows.map(([label, count]) => [label, count.toLocaleString(), `${(count / totalResponses * 100).toFixed(1)}%`]))}`),
    ].join("");
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${escape(surveyTitle)} - 统计报告</title><style>body{font:14px/1.6 Arial,"Microsoft YaHei",sans-serif;color:#17233d;max-width:980px;margin:40px auto;padding:0 24px}h1{margin-bottom:4px}p{color:#667085}h2{font-size:17px;margin:32px 0 10px}table{width:100%;border-collapse:collapse}th,td{padding:10px 12px;border:1px solid #dfe5ee;text-align:left}th{background:#f5f7fa}@media print{body{margin:0;max-width:none}}</style></head><body><h1>${escape(surveyTitle)} · ${tab === "answers" ? "答案统计" : "用户统计"}</h1><p>筛选：${escape(locale)} · ${escape(range)}　导出时间：${new Date().toLocaleString("zh-CN")}</p><p>答卷总数：${totalResponses.toLocaleString()} 份</p>${tab === "answers" ? answerSections : userSections}</body></html>`;
  }

  function exportHtml() {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([statisticsReportHtml()], { type: "text/html;charset=utf-8" }));
    link.download = `${surveyTitle}-${tab === "answers" ? "答案统计" : "用户统计"}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
    flash("HTML 统计报告已导出");
  }

  function exportPdf() {
    const report = window.open("", "_blank");
    if (!report) {
      flash("浏览器阻止了新窗口，请允许弹窗后重试");
      return;
    }
    report.document.write(statisticsReportHtml());
    report.document.close();
    report.focus();
    window.setTimeout(() => report.print(), 300);
    flash("已打开打印窗口，可选择“另存为 PDF”");
  }

  return (
    <main className="insights-page analytics-simple-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title"><span className="survey-doc-icon">▤</span><div><strong>{surveyTitle}</strong><small><i className="live-dot" />统计数据更新于 2 分钟前</small></div></div>
        <SurveyNav surveyId={surveyId} active="analytics" onNotice={flash} />
        <div className="editor-actions"><button className="secondary-button" onClick={exportHtml}>导出 HTML</button><button className="secondary-button" onClick={exportPdf}>导出 PDF</button></div>
      </header>

      <section className="analytics-simple-shell">
        <header className="analytics-simple-heading report-heading">
          <div><h1>统计</h1><p>{tab === "answers" ? "逐题查看回答人数、未回答人数和各答案占比。" : "查看收集趋势、平均答题时间，以及地区、语言、设备和账号构成。"}</p></div>
          <div className="answer-total"><small>答卷总数</small><strong>{totalResponses.toLocaleString()}</strong><span>份</span></div>
        </header>

        <div className="statistics-view-tabs">
          <button className={tab === "answers" ? "active" : ""} onClick={() => setTab("answers")}><strong>答案统计</strong><small>每道题的选项、人数与占比</small></button>
          <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}><strong>用户统计</strong><small>收集趋势、地区、语言、设备与账号</small></button>
        </div>

        <div className="analytics-simple-filters">
          <label>语言<select value={locale} onChange={(event) => setLocale(event.target.value)}><option>全部语言</option><option>English</option><option>繁體中文</option><option>ไทย</option></select></label>
          <label>提交时间<select value={range} onChange={(event) => setRange(event.target.value)}><option>全部时间</option><option>今日</option><option>近 7 天</option><option>近 30 天</option></select></label>
          <span>当前口径：{tab === "answers" ? "有效答卷（无效答卷不计入）" : "全部已提交答卷的用户属性"}</span>
        </div>

        {tab === "answers" ? <div className="answer-report-list">
          <article className="answer-report-section">
            <header><div><span>第 1 题　单选题</span><h2>您对本次先锋测试的整体体验如何？</h2></div><dl><div><dt>回答</dt><dd>{totalResponses.toLocaleString()}</dd></div><div><dt>未回答</dt><dd>0</dd></div></dl></header>
            <table>
              <thead><tr><th>选项</th><th>回答人数</th><th>占本题回答</th></tr></thead>
              <tbody>{satisfaction.map(([label, count]) => {
                const percent = count / totalResponses * 100;
                return <tr key={label}><td>{label}</td><td>{count.toLocaleString()}</td><td><strong>{percent.toFixed(1)}%</strong></td></tr>;
              })}</tbody>
            </table>
          </article>

          <article className="answer-report-section">
            <header><div><span>第 2 题　NPS</span><h2>您有多大可能向朋友推荐这款游戏？</h2></div><dl><div><dt>回答</dt><dd>8,379</dd></div><div><dt>未回答</dt><dd>42</dd></div><div><dt>平均分</dt><dd>7.4</dd></div><div><dt>NPS</dt><dd>42</dd></div></dl></header>
            <table>
              <thead><tr><th>分组</th><th>回答人数</th><th>占本题回答</th></tr></thead>
              <tbody>{npsGroups.map(([label, count]) => <tr key={label}><td>{label}</td><td>{count.toLocaleString()}</td><td>{(count / 8379 * 100).toFixed(1)}%</td></tr>)}</tbody>
            </table>
          </article>

          <article className="answer-report-section">
            <header><div><span>第 3 题　文本题</span><h2>还有哪些体验可以改进？</h2></div><dl><div><dt>回答</dt><dd>6,924</dd></div><div><dt>未回答</dt><dd>1,497</dd></div></dl></header>
            <table>
              <thead><tr><th>高频主题</th><th>提及次数</th><th>占本题回答</th></tr></thead>
              <tbody>{textTopics.map(([label, count]) => <tr key={label}><td>{label}</td><td>{count.toLocaleString()}</td><td>{(count / 6924 * 100).toFixed(1)}%</td></tr>)}</tbody>
            </table>
            <footer className="text-answer-link"><span>文本题只做主题计数，原始回答请在答卷明细中查看。</span><button onClick={() => router.push(`/survey/${surveyId}/responses`)}>查看全部文本答案 →</button></footer>
          </article>

          {matrixReports.map((report) => (
            <article className="answer-report-section matrix-answer-report" key={report.question.id}>
              <header>
                <div><span>矩阵题　{questionLabels[report.question.type]}</span><h2>{report.question.title}</h2></div>
                <dl>
                  <div><dt>回答</dt><dd>{report.answers.toLocaleString()}</dd></div>
                  {report.numericColumns && <div><dt>平均总分</dt><dd>{report.averageTotal === null ? "—" : report.averageTotal.toFixed(1)}</dd></div>}
                </dl>
              </header>
              <div className="matrix-stat-scroll">
                <table>
                  <thead><tr><th>题目/选项</th>{report.columns.map((column) => <th key={column}>{column}</th>)}{report.numericColumns && <th>平均分</th>}</tr></thead>
                  <tbody>
                    {report.rowStats.map((row) => <tr key={row.row}><td>{row.row}</td>{row.counts.map((count, index) => <td key={report.columns[index]}>{count}<small>{row.answered ? `${(count / row.answered * 100).toFixed(1)}%` : "0%"}</small></td>)}{report.numericColumns && <td><strong>{row.average === null ? "—" : row.average.toFixed(1)}</strong></td>}</tr>)}
                  </tbody>
                </table>
              </div>
              {report.numericColumns && <footer className="matrix-score-summary"><span>所有行评分总和用于单份答卷的逻辑判断</span><strong>当前答卷平均总分：{report.averageTotal === null ? "—" : report.averageTotal.toFixed(1)}</strong></footer>}
            </article>
          ))}
        </div> : <div className="user-distribution-content">
          <div className="user-distribution-summary">
            <span><small>识别用户</small><strong>6,982</strong><em>JoyaMaker 或 LINE 去重</em></span>
            <span><small>平均答题时间</small><strong>3 分 42 秒</strong><em>基于有效答卷</em></span>
            <span><small>覆盖国家/地区</small><strong>42</strong><em>基于提交 IP</em></span>
          </div>
          <article className="collection-trend-card">
            <header>
              <div><strong>收集趋势</strong><small>按提交日期统计有效答卷数量</small></div>
              <span className="trend-total">近 7 天共收集 <strong>8,421</strong> 份</span>
            </header>
            <div className="collection-line-chart">
              <div className="trend-grid-lines"><i /><i /><i /><i /></div>
              <div
                className="trend-area"
                style={{ clipPath: "polygon(0% 74%, 16.66% 52%, 33.33% 31%, 50% 40%, 66.66% 16%, 83.33% 8%, 100% 37%, 100% 100%, 0 100%)" }}
              />
              <div
                className="trend-line"
                style={{ clipPath: "polygon(0% 72%, 16.66% 50%, 33.33% 29%, 50% 38%, 66.66% 14%, 83.33% 6%, 100% 35%, 100% 39%, 83.33% 10%, 66.66% 18%, 50% 42%, 33.33% 33%, 16.66% 54%, 0% 76%)" }}
              />
              <div className="trend-points">
                {collectionTrend.map(([date, weekday, count]) => (
                  <span key={date} style={{ bottom: `${8 + count / 1409 * 72}%` }}>
                    <i><strong>{count.toLocaleString()}</strong> 份<small>{weekday}</small></i>
                  </span>
                ))}
              </div>
              <div className="trend-axis">{collectionTrend.map(([date]) => <span key={date}>{date}</span>)}</div>
            </div>
          </article>
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
