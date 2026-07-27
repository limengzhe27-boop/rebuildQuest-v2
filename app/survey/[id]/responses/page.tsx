"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { responseStatusLabel, SurveyResponse, surveyResponses } from "@/lib/survey-responses";
import { LiveSurveyResponse, runtimeLocales } from "@/lib/survey-runtime";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

const allColumns: { key: string; label: string; getter: (item: SurveyResponse) => string | number }[] = [
  { key: "serialNumber", label: "序号", getter: (item) => item.serialNumber },
  { key: "id", label: "答卷编号", getter: (item) => item.id },
  { key: "submittedAt", label: "提交时间", getter: (item) => item.submittedAt },
  { key: "formVersion", label: "问卷版本", getter: (item) => item.formVersion },
  { key: "accountType", label: "账号类型", getter: (item) => item.accountType },
  { key: "playerId", label: "玩家标识", getter: (item) => item.playerId },
  { key: "joyUserInfo", label: "JoyMaker 信息", getter: (item) => item.joyUserInfo },
  { key: "lineUserInfo", label: "LINE 信息", getter: (item) => item.lineUserInfo },
  { key: "country", label: "国家/地区", getter: (item) => item.country },
  { key: "submitAddress", label: "提交地区", getter: (item) => item.submitAddress },
  { key: "locale", label: "问卷语言", getter: (item) => item.locale },
  { key: "channel", label: "来源", getter: (item) => item.channel },
  { key: "sourceParameter", label: "来源参数", getter: (item) => item.sourceParameter },
  { key: "submitIp", label: "提交 IP", getter: (item) => item.submitIp },
  { key: "submitOs", label: "操作系统", getter: (item) => item.submitOs },
  { key: "submitBrowser", label: "浏览器", getter: (item) => item.submitBrowser },
  { key: "device", label: "设备", getter: (item) => item.device },
  { key: "duration", label: "填写时长", getter: (item) => item.duration },
  { key: "completionTime", label: "完成用时", getter: (item) => item.completionTime },
  { key: "answerCount", label: "已答题数", getter: (item) => item.answerCount },
  { key: "satisfaction", label: "整体满意度", getter: (item) => item.satisfaction },
  { key: "nps", label: "NPS", getter: (item) => item.nps },
  { key: "feedback", label: "改进建议", getter: (item) => item.feedback || "—" },
  { key: "extValue", label: "扩展字段", getter: (item) => item.extValue },
  { key: "status", label: "质量状态", getter: (item) => responseStatusLabel[item.status] },
  { key: "qualityReason", label: "判定原因", getter: (item) => item.qualityReason },
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
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(allColumns.map((column) => column.key));
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
          submitAddress: "未知",
          completionTime: `${item.durationSeconds} 秒`,
          joyUserInfo: "—",
          lineUserInfo: "—",
          extValue: item.source ? `source=${item.source}` : "source=direct",
          answerCount: Object.keys(item.answers).length,
          formVersion: "当前版本",
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
  const selectedColumns = allColumns.filter((column) => visibleColumns.includes(column.key));

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
      selectedColumns.map((column) => escape(column.label)).join(","),
      ...rows.map((item) => selectedColumns.map((column) => escape(column.getter(item))).join(",")),
    ].join("\r\n");
    downloadFile(`\uFEFF${content}`, "text/csv;charset=utf-8", "csv");
  }

  function exportExcel() {
    const escape = (value: string | number) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
    const table = `<table><thead><tr>${selectedColumns.map((column) => `<th>${escape(column.label)}</th>`).join("")}</tr></thead><tbody>${rows.map((item) => `<tr>${selectedColumns.map((column) => `<td>${escape(column.getter(item))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
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
          <div className="column-selector">
            <button onClick={() => setShowColumns(!showColumns)}>☷ 显示字段 <em>{visibleColumns.length}/{allColumns.length}</em></button>
            {showColumns && <div className="column-selector-menu">
              <header><strong>选择表格字段</strong><button onClick={() => setVisibleColumns(allColumns.map((column) => column.key))}>全选</button></header>
              <div>{allColumns.map((column) => <label key={column.key}><input type="checkbox" checked={visibleColumns.includes(column.key)} onChange={() => setVisibleColumns((current) => current.includes(column.key) ? (current.length > 1 ? current.filter((key) => key !== column.key) : current) : [...current, column.key])} />{column.label}</label>)}</div>
              <footer><span>至少保留一个字段</span><button onClick={() => setShowColumns(false)}>完成</button></footer>
            </div>}
          </div>
          <span>当前显示 {rows.length} 条</span>
        </div>

        <div className="flat-response-table-wrap detailed">
          <table className="flat-response-table detailed-table">
            <thead><tr>{selectedColumns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
            <tbody>{rows.map((item) => <tr key={item.id}>
              {selectedColumns.map((column) => <td key={column.key} className={column.key === "feedback" ? "answer-text-cell" : column.key === "qualityReason" ? "quality-reason-cell" : ""} title={String(column.getter(item))}>
                {column.key === "status" ? <span className={`response-status ${item.status}`}>{responseStatusLabel[item.status]}</span> : column.key === "id" || column.key === "nps" ? <strong>{column.getter(item)}</strong> : column.key === "sourceParameter" ? <code>{column.getter(item)}</code> : column.getter(item)}
              </td>)}
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
