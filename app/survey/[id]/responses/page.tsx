"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { responseStatusLabel, SurveyResponse, surveyResponses } from "@/lib/survey-responses";
import { LiveSurveyResponse, runtimeLocales } from "@/lib/survey-runtime";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

const exportColumns: [string, (item: SurveyResponse) => string | number][] = [
  ["序号", (item) => item.serialNumber],
  ["答卷编号", (item) => item.id],
  ["提交时间", (item) => item.submittedAt],
  ["账号类型", (item) => item.accountType],
  ["玩家标识", (item) => item.playerId],
  ["国家/地区", (item) => item.country],
  ["问卷语言", (item) => item.locale],
  ["渠道", (item) => item.channel],
  ["渠道参数", (item) => item.sourceParameter],
  ["提交 IP", (item) => item.submitIp],
  ["操作系统", (item) => item.submitOs],
  ["浏览器", (item) => item.submitBrowser],
  ["设备", (item) => item.device],
  ["填写时长", (item) => item.duration],
  ["整体满意度", (item) => item.satisfaction],
  ["NPS", (item) => item.nps],
  ["改进建议", (item) => item.feedback],
  ["质量状态", (item) => responseStatusLabel[item.status]],
  ["判定原因", (item) => item.qualityReason],
];

export default function ResponsesPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const [query, setQuery] = useState("");
  const [locale, setLocale] = useState("all");
  const [status, setStatus] = useState("all");
  const [notice, setNotice] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [liveResponses, setLiveResponses] = useState<SurveyResponse[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(`joydata-survey-live-responses-${surveyId}`);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as LiveSurveyResponse[];
      setLiveResponses(parsed.map((item, index): SurveyResponse => {
        const submittedAt = new Date(item.submittedAt);
        return {
          id: item.id,
          serialNumber: 8422 + index,
          submittedAt: submittedAt.toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-"),
          playerId: "Anonymous",
          accountType: "匿名",
          country: "未知",
          locale: runtimeLocales[item.locale],
          channel: item.source || "直接访问",
          sourceParameter: item.source ? `source=${item.source}` : "source=direct",
          submitIp: "本地预览",
          submitOs: "未知",
          submitBrowser: "Web",
          device: "Web",
          duration: `${String(Math.floor(item.durationSeconds / 60)).padStart(2, "0")}:${String(item.durationSeconds % 60).padStart(2, "0")}`,
          status: "valid",
          qualityReason: "必答题完整，未命中重复、极速或异常答案规则",
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
    const content = `${item.id}${item.playerId}${item.country}${item.channel}${item.sourceParameter}${item.submitIp}${item.satisfaction}${item.feedback}${item.qualityReason}`.toLowerCase();
    return content.includes(query.toLowerCase()) && (locale === "all" || item.locale === locale) && (status === "all" || item.status === status);
  }), [allResponses, locale, query, status]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function downloadFile(content: BlobPart, type: string, extension: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${surveyTitle}-答卷明细-${new Date().toISOString().slice(0, 10)}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
    flash(`已导出 ${extension.toUpperCase()} 文件`);
  }

  function exportCsv() {
    const escape = (value: string | number) => `"${String(value).replaceAll("\"", "\"\"")}"`;
    const content = [
      exportColumns.map(([label]) => escape(label)).join(","),
      ...rows.map((item) => exportColumns.map(([, getter]) => escape(getter(item))).join(",")),
    ].join("\r\n");
    downloadFile(`\uFEFF${content}`, "text/csv;charset=utf-8", "csv");
  }

  function exportExcel() {
    const escape = (value: string | number) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
    const table = `<table><thead><tr>${exportColumns.map(([label]) => `<th>${escape(label)}</th>`).join("")}</tr></thead><tbody>${rows.map((item) => `<tr>${exportColumns.map(([, getter]) => `<td>${escape(getter(item))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const document = `<html><head><meta charset="UTF-8"><style>table{border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px;mso-number-format:"\\@"}</style></head><body>${table}</body></html>`;
    downloadFile(`\uFEFF${document}`, "application/vnd.ms-excel;charset=utf-8", "xls");
  }

  return (
    <main className="insights-page response-table-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title"><span className="survey-doc-icon">▤</span><div><strong>{surveyTitle}</strong><small><i className="live-dot" />答卷明细 · 海外数据区</small></div></div>
        <SurveyNav surveyId={surveyId} active="responses" onNotice={flash} />
        <div className="editor-actions">
          <button className="secondary-button" onClick={() => router.push(`/survey/${surveyId}/analytics`)}>返回统计</button>
          <div className="export-menu-wrap">
            <button className="primary-button" onClick={() => setShowExport(!showExport)}>⇩ 导出明细⌄</button>
            {showExport && <div className="export-format-menu"><button onClick={exportExcel}><span>XL</span><p><strong>Excel</strong><small>.xls · 保留中文与列结构</small></p></button><button onClick={exportCsv}><span>CSV</span><p><strong>CSV</strong><small>.csv · 适合数据分析工具</small></p></button></div>}
          </div>
        </div>
      </header>

      <section className="response-table-shell">
        <header className="response-table-heading">
          <div><span>RESPONSE DATA</span><h1>答卷明细</h1><p>一行代表一份提交，答案、玩家身份、渠道和提交环境均直接展示。</p></div>
          <div><small>共</small><strong>{(8421 + liveResponses.length).toLocaleString()}</strong><span>份答卷</span></div>
        </header>

        <div className="quality-rule-bar">
          <span>i</span>
          <p><strong>状态由“系统质量规则 + 人工复核”共同判定</strong><small>待复核答卷不会自动删除；无效答卷保留在明细中，但不进入默认答案统计。</small></p>
          <button onClick={() => setShowRules(!showRules)}>{showRules ? "收起规则" : "查看判定规则"}</button>
        </div>
        {showRules && <div className="quality-rule-detail">
          <article><span className="response-status valid">有效</span><p><strong>可以进入统计</strong><small>必答题完整，填写时长合理，且未命中账号、设备、IP 重复或异常答案规则。</small></p></article>
          <article><span className="response-status review">待复核</span><p><strong>系统发现风险信号</strong><small>例如极速提交、短时间重复、答案高度一致或来源异常，需要运营人工确认。</small></p></article>
          <article><span className="response-status invalid">无效</span><p><strong>不进入默认统计</strong><small>人工确认的测试数据、机器人、重复提交或明显无效回答；数据仍保留用于审计。</small></p></article>
        </div>}

        <div className="responses-toolbar response-table-toolbar">
          <div className="responses-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索答卷、账号、IP、渠道、答案或判定原因" /></div>
          <select value={locale} onChange={(event) => setLocale(event.target.value)}><option value="all">全部语言</option><option>English</option><option>繁體中文</option><option>ไทย</option></select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">全部状态</option><option value="valid">有效</option><option value="review">待复核</option><option value="invalid">无效</option></select>
          <span>当前显示 {rows.length} 条</span>
        </div>

        <div className="flat-response-table-wrap detailed">
          <table className="flat-response-table detailed-table">
            <thead><tr><th>序号</th><th>答卷编号</th><th>提交时间</th><th>账号类型</th><th>玩家标识</th><th>国家/地区</th><th>语言</th><th>渠道</th><th>渠道参数</th><th>提交 IP</th><th>操作系统</th><th>浏览器</th><th>设备</th><th>填写时长</th><th>整体满意度</th><th>NPS</th><th>改进建议</th><th>状态</th><th>判定原因</th></tr></thead>
            <tbody>{rows.map((item) => <tr key={item.id}>
              <td>{item.serialNumber}</td><td><strong>{item.id}</strong></td><td>{item.submittedAt}</td><td>{item.accountType}</td><td>{item.playerId}</td><td>{item.country}</td><td>{item.locale}</td><td>{item.channel}</td><td><code>{item.sourceParameter}</code></td><td>{item.submitIp}</td><td>{item.submitOs}</td><td>{item.submitBrowser}</td><td>{item.device}</td><td>{item.duration}</td><td>{item.satisfaction}</td><td><strong>{item.nps}</strong></td><td className="answer-text-cell" title={item.feedback}>{item.feedback || "—"}</td><td><span className={`response-status ${item.status}`}>{responseStatusLabel[item.status]}</span></td><td className="quality-reason-cell" title={item.qualityReason}>{item.qualityReason}</td>
            </tr>)}</tbody>
          </table>
          <footer className="table-pagination"><span>第 1–{rows.length} 条，共 {(8421 + liveResponses.length).toLocaleString()} 条</span><div><button disabled>‹</button><button className="active">1</button><button>2</button><button>3</button><button>…</button><button>703</button><button>›</button></div><select><option>20 条/页</option><option>50 条/页</option></select></footer>
        </div>
        <p className="schema-note">对应数据库：fm_user_form_data 的 original_data、serial_number、submit_request_ip、submit_address、submit_os、submit_browser、complete_time、ext_value、joy_user_info、line_user_info 与 create_time。</p>
      </section>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
