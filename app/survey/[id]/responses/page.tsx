"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { responseStatusLabel, SurveyResponse, surveyResponses } from "@/lib/survey-responses";
import { LiveSurveyResponse, runtimeLocales, SurveyAnswer } from "@/lib/survey-runtime";
import { loadQuestions, Question } from "@/lib/survey-builder";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

type ResponseRow = SurveyResponse & {
  answers: Record<string, SurveyAnswer>;
};

type ResponseColumn = {
  key: string;
  label: string;
  width: number;
  kind?: "answer" | "status" | "code";
  getter: (item: ResponseRow) => string | number;
};

const baseColumns: ResponseColumn[] = [
  { key: "serialNumber", label: "序号", width: 72, getter: (item) => item.serialNumber },
  { key: "id", label: "答卷编号", width: 126, getter: (item) => item.id },
  { key: "submittedAt", label: "提交时间", width: 160, getter: (item) => item.submittedAt },
  { key: "formVersion", label: "问卷版本", width: 100, getter: (item) => item.formVersion },
  { key: "accountType", label: "账号类型", width: 104, getter: (item) => item.accountType },
  { key: "playerId", label: "玩家标识", width: 130, getter: (item) => item.playerId },
  { key: "joyUserInfo", label: "JoyaMaker 信息", width: 160, getter: (item) => item.joyUserInfo },
  { key: "lineUserInfo", label: "LINE 信息", width: 145, getter: (item) => item.lineUserInfo },
  { key: "country", label: "国家/地区", width: 110, getter: (item) => item.country },
  { key: "submitAddress", label: "提交地区", width: 110, getter: (item) => item.submitAddress },
  { key: "locale", label: "填写语言", width: 120, getter: (item) => item.locale },
  { key: "channel", label: "来源", width: 120, getter: (item) => item.channel },
  { key: "sourceParameter", label: "来源参数", width: 150, kind: "code", getter: (item) => item.sourceParameter },
  { key: "submitIp", label: "提交 IP", width: 130, getter: (item) => item.submitIp },
  { key: "submitOs", label: "操作系统", width: 120, getter: (item) => item.submitOs },
  { key: "submitBrowser", label: "浏览器", width: 130, getter: (item) => item.submitBrowser },
  { key: "device", label: "设备", width: 100, getter: (item) => item.device },
  { key: "duration", label: "填写时长", width: 100, getter: (item) => item.duration },
  { key: "completionTime", label: "完成用时", width: 100, getter: (item) => item.completionTime },
  { key: "answerCount", label: "已答题数", width: 100, getter: (item) => item.answerCount },
  { key: "extValue", label: "扩展字段", width: 220, kind: "code", getter: (item) => item.extValue },
  { key: "status", label: "状态", width: 90, kind: "status", getter: (item) => responseStatusLabel[item.status] },
  { key: "qualityReason", label: "判定原因", width: 280, getter: (item) => item.qualityReason },
];

const defaultVisibleBaseColumns = [
  "id", "submittedAt", "playerId", "country", "status",
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
  const [showExport, setShowExport] = useState(false);
  const [showFeishuExport, setShowFeishuExport] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleBaseColumns);
  const [liveResponses, setLiveResponses] = useState<ResponseRow[]>([]);
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const surveyQuestions = loadQuestions(surveyId).filter((question) =>
      !["divider", "description", "imageDisplay", "carousel", "pageBreak", "button"].includes(question.type),
    );
    setQuestions(surveyQuestions);
    setVisibleColumns((current) => Array.from(new Set([
      ...current,
      ...surveyQuestions.map((question) => `answer:${question.id}`),
    ])));
    const stored = window.localStorage.getItem(`joydata-survey-live-responses-${surveyId}`);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as LiveSurveyResponse[];
      setLiveResponses(parsed.map((item, index): ResponseRow => {
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
          answers: item.answers,
        };
      }));
    } catch {
      setLiveResponses([]);
    }
  }, [surveyId]);

  const questionColumns = useMemo<ResponseColumn[]>(() => questions.map((question, index) => ({
    key: `answer:${question.id}`,
    label: `Q${index + 1}. ${question.title}`,
    width: 260,
    kind: "answer",
    getter: (item) => {
      const value = item.answers[question.id];
      if (Array.isArray(value)) return value.join("、") || "—";
      if (value && typeof value === "object") {
        const entries = Object.entries(value);
        return entries.length
          ? entries.map(([row, answer]) => `${row.replace("::", " / ")}：${Array.isArray(answer) ? answer.join("、") : answer}`).join("；")
          : "—";
      }
      return value === undefined || value === null || value === "" ? "—" : String(value);
    },
  })), [questions]);
  const allColumns = useMemo(() => [...baseColumns, ...questionColumns], [questionColumns]);
  const allResponses = useMemo<ResponseRow[]>(() => [
    ...liveResponses,
    ...surveyResponses.map((item) => ({
      ...item,
      answers: {
        welcome: item.satisfaction,
        nps: item.nps,
        feedback: item.feedback || "—",
      },
    })),
  ], [liveResponses]);
  const rows = useMemo(() => allResponses.filter((item) => {
    const content = `${item.id}${item.playerId}${item.country}${item.channel}${item.sourceParameter}${item.submitIp}${item.satisfaction}${item.feedback}${item.qualityReason}`.toLowerCase();
    return content.includes(query.toLowerCase()) && (locale === "all" || item.locale === locale) && (status === "all" || item.status === status);
  }), [allResponses, locale, query, status]);
  const selectedColumns = allColumns.filter((column) => visibleColumns.includes(column.key));
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageStart = rows.length ? (safePage - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(safePage * pageSize, rows.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [locale, pageSize, query, status]);

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

  function saveFeishuExport() {
    const tableName = `${surveyTitle}-答卷明细-${new Date().toISOString().slice(0, 10)}`;
    window.localStorage.setItem(`joydata-feishu-export-${surveyId}`, JSON.stringify({
      mode: "new",
      tableName,
      columns: visibleColumns,
      updatedAt: new Date().toISOString(),
    }));
    setShowFeishuExport(false);
    flash("已提交新建飞书多维表格任务");
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
            {showExport && <div className="export-format-menu"><button onClick={exportExcel}><span>XL</span><p><strong>Excel</strong><small>.xls · 保留中文与列结构</small></p></button><button onClick={exportCsv}><span>CSV</span><p><strong>CSV</strong><small>.csv · 适合数据分析工具</small></p></button><button onClick={() => { setShowExport(false); setShowFeishuExport(true); }}><span>飞</span><p><strong>飞书多维表格</strong><small>新建多维表格并写入当前数据</small></p></button></div>}
          </div>
        </div>
      </header>

      <section className="response-table-shell">
        <header className="response-table-heading">
          <div><span>RESPONSE DATA</span><h1>答卷明细</h1><p>一行代表一份提交，默认展示问卷答案与核心用户信息，其他字段可通过“显示字段”添加。</p></div>
          <div><small>共</small><strong>{allResponses.length.toLocaleString()}</strong><span>份答卷</span></div>
        </header>

        <div className="responses-toolbar response-table-toolbar">
          <div className="responses-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索答卷、账号、IP、渠道、答案或判定原因" /></div>
          <select value={locale} onChange={(event) => setLocale(event.target.value)} title="按玩家提交答卷时实际使用的问卷语言筛选"><option value="all">全部填写语言</option><option>English</option><option>繁體中文</option><option>ไทย</option></select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">全部状态</option><option value="valid">有效</option><option value="invalid">无效</option></select>
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
          <table className="flat-response-table detailed-table" style={{ minWidth: Math.max(1100, selectedColumns.reduce((sum, column) => sum + column.width, 0)) }}>
            <colgroup>{selectedColumns.map((column) => <col key={column.key} style={{ width: column.width }} />)}</colgroup>
            <thead><tr>{selectedColumns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
            <tbody>{pageRows.map((item) => <tr key={item.id}>
              {selectedColumns.map((column) => <td key={column.key} className={column.kind === "answer" ? "question-answer-cell" : column.key === "qualityReason" ? "quality-reason-cell" : ""} title={String(column.getter(item))}>
                {column.kind === "status" ? <span className={`response-status ${item.status}`}>{responseStatusLabel[item.status]}</span> : column.key === "id" ? <strong>{column.getter(item)}</strong> : column.kind === "code" ? <code>{column.getter(item)}</code> : column.getter(item)}
              </td>)}
            </tr>)}</tbody>
          </table>
          <footer className="table-pagination">
            <span>第 {pageStart}–{pageEnd} 条，共 {rows.length} 条</span>
            <div>
              <button disabled={safePage === 1} onClick={() => setCurrentPage(1)}>«</button>
              <button disabled={safePage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                const start = Math.min(Math.max(1, safePage - 2), Math.max(1, totalPages - 4));
                const page = start + index;
                return <button key={page} className={page === safePage ? "active" : ""} onClick={() => setCurrentPage(page)}>{page}</button>;
              })}
              <button disabled={safePage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>›</button>
              <button disabled={safePage === totalPages} onClick={() => setCurrentPage(totalPages)}>»</button>
            </div>
            <label className="page-size-select"><span>每页</span><select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}><option value={20}>20 条</option><option value={50}>50 条</option><option value={100}>100 条</option></select></label>
          </footer>
        </div>
      </section>
      {showFeishuExport && <div className="preview-backdrop" onMouseDown={() => setShowFeishuExport(false)}><section className="feishu-export-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><strong>新建飞书多维表格</strong><small>共 {rows.length} 份答卷 · {selectedColumns.length} 个字段</small></div><button onClick={() => setShowFeishuExport(false)}>×</button></header>
        <div className="feishu-export-body">
          <div className="feishu-new-table-info"><span>将新建表格</span><strong>{surveyTitle}-答卷明细-{new Date().toISOString().slice(0, 10)}</strong><small>不会修改或覆盖任何已有的飞书多维表格。</small></div>
          <div className="feishu-export-summary"><span>同步范围</span><strong>当前筛选结果与已选择字段</strong><small>{selectedColumns.map((column) => column.label).join("、")}</small></div>
          <p className="feishu-security-note">需要由 JoyData 服务端使用公司飞书企业应用完成授权和写入，浏览器不会保存 App Secret。</p>
        </div>
        <footer><button className="secondary-button" onClick={() => setShowFeishuExport(false)}>取消</button><button className="primary-button" onClick={saveFeishuExport}>新建并导出</button></footer>
      </section></div>}
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
