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

type ValidityCondition = {
  questionId: string;
  operator: string;
  value: string;
  score: number;
  matrixScope?: "cell" | "row" | "any-row" | "sum" | "average" | "minimum";
  matrixRow?: string;
  matrixColumn?: string;
};
type ValidityRuleGroup = {
  id: string;
  name: string;
  relation: "all" | "any";
  conditions: ValidityCondition[];
  mode: "status" | "score";
  outcome: "valid" | "invalid";
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
  const [showValidityRules, setShowValidityRules] = useState(false);
  const [deduplicate, setDeduplicate] = useState(true);
  const [duplicateKeys, setDuplicateKeys] = useState(["playerId"]);
  const [duplicateKeep, setDuplicateKeep] = useState<"earliest" | "latest">("earliest");
  const [emptyQuestionIds, setEmptyQuestionIds] = useState<string[]>([]);
  const [scoreComparator, setScoreComparator] = useState<"lt" | "gt">("lt");
  const [scoreOutcome, setScoreOutcome] = useState<"valid" | "invalid">("invalid");
  const [minimumScore, setMinimumScore] = useState(60);
  const [validityGroups, setValidityGroups] = useState<ValidityRuleGroup[]>([
    { id: "contradiction", name: "矛盾答案检查", relation: "all", mode: "status", outcome: "invalid", conditions: [{ questionId: "welcome", operator: "等于", value: "非常满意", score: 0 }, { questionId: "feedback", operator: "包含", value: "无法游玩", score: 0 }] },
    { id: "quality-score", name: "答案质量评分", relation: "any", mode: "score", outcome: "invalid", conditions: [{ questionId: "nps", operator: "大于等于", value: "8", score: 30 }] },
  ]);
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
    try {
      const storedRules = JSON.parse(window.localStorage.getItem(`joydata-survey-validity-rules-${surveyId}`) || "null");
      if (storedRules) {
        setDeduplicate(storedRules.deduplicate !== false);
        setDuplicateKeys(storedRules.duplicateKeys || (storedRules.duplicateKey ? [storedRules.duplicateKey] : ["playerId"]));
        setDuplicateKeep(storedRules.duplicateKeep || "earliest");
        setEmptyQuestionIds(storedRules.emptyQuestionIds || []);
        setScoreComparator(storedRules.scoreComparator || "lt");
        setScoreOutcome(storedRules.scoreOutcome || "invalid");
        setMinimumScore(Number(storedRules.minimumScore) || 60);
        if (Array.isArray(storedRules.groups)) {
          setValidityGroups(storedRules.groups.map((group: ValidityRuleGroup & { mode?: string }) => ({
            ...group,
            mode: group.mode === "score" ? "score" : "status",
            outcome: group.outcome || "invalid",
          })));
        }
      }
    } catch {}
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

  function updateValidityGroup(groupId: string, patch: Partial<ValidityRuleGroup>) {
    setValidityGroups((current) => current.map((group) => group.id === groupId ? { ...group, ...patch } : group));
  }

  function updateValidityCondition(groupId: string, index: number, patch: Partial<ValidityCondition>) {
    setValidityGroups((current) => current.map((group) => group.id === groupId ? { ...group, conditions: group.conditions.map((condition, conditionIndex) => conditionIndex === index ? { ...condition, ...patch } : condition) } : group));
  }

  function saveValidityRules() {
    window.localStorage.setItem(`joydata-survey-validity-rules-${surveyId}`, JSON.stringify({
      deduplicate,
      duplicateKeys,
      duplicateKeep,
      emptyQuestionIds,
      scoreComparator,
      scoreOutcome,
      minimumScore,
      groups: validityGroups,
    }));
    setShowValidityRules(false);
    flash("答卷有效规则已保存，将用于后续提交的自动判定");
  }

  const logicGroups = validityGroups.filter((group) => group.mode === "status");
  const scoreGroups = validityGroups.filter((group) => group.mode === "score");

  function defaultCondition(questionId = questions[0]?.id || ""): ValidityCondition {
    const question = questions.find((item) => item.id === questionId);
    const numeric = question && ["rating", "nps"].includes(question.type);
    const matrix = question && ["matrix", "matrixFill", "matrixSelect", "matrixScale", "matrixSlider", "matrixDropdown"].includes(question.type);
    return {
      questionId,
      operator: numeric ? "小于" : "等于",
      value: "",
      score: 0,
      matrixScope: matrix ? (["matrixScale", "matrixSlider"].includes(question.type) ? "row" : "cell") : undefined,
      matrixRow: matrix ? question.matrixRows?.[0] || "行 1" : undefined,
      matrixColumn: matrix ? question.matrixColumns?.[0] || question.options?.[0] || "列 1" : undefined,
    };
  }

  function isMatrixQuestion(question?: Question) {
    return Boolean(question && ["matrix", "matrixFill", "matrixSelect", "matrixScale", "matrixSlider", "matrixDropdown"].includes(question.type));
  }

  function isNumericQuestion(question?: Question) {
    return Boolean(question && ["rating", "nps"].includes(question.type));
  }

  function isChoiceQuestion(question?: Question) {
    return Boolean(question && ["single", "multiple", "dropdown", "cascade", "image", "sort", "tableSelect", "product"].includes(question.type));
  }

  function operatorsFor(question?: Question, condition?: ValidityCondition) {
    if (!question) return ["等于", "不等于", "包含", "不包含", "为空", "不为空"];
    if (["file", "imageUpload", "location", "ocr"].includes(question.type)) return ["为空", "不为空"];
    if (isNumericQuestion(question) || (isMatrixQuestion(question) && ["matrixScale", "matrixSlider"].includes(question.type))) return ["小于", "小于等于", "等于", "不等于", "大于等于", "大于", "为空", "不为空"];
    if (isMatrixQuestion(question) && condition?.matrixScope === "cell" && question.type !== "matrixFill") return ["已选中", "未选中"];
    if (["date", "appointmentDate", "appointmentSlot"].includes(question.type)) return ["早于", "等于", "晚于", "为空", "不为空"];
    if (isChoiceQuestion(question)) return ["等于", "不等于", "包含", "不包含", "为空", "不为空"];
    return ["等于", "不等于", "包含", "不包含", "为空", "不为空"];
  }

  function updateConditionQuestion(groupId: string, index: number, questionId: string) {
    updateValidityCondition(groupId, index, defaultCondition(questionId));
  }

  function renderConditionEditor(group: ValidityRuleGroup, condition: ValidityCondition, index: number) {
    const question = questions.find((item) => item.id === condition.questionId);
    const rows = question?.matrixRows?.length ? question.matrixRows : ["行 1", "行 2", "行 3"];
    const columns = question?.matrixColumns?.length ? question.matrixColumns : question?.options?.length ? question.options : ["列 1", "列 2", "列 3"];
    const matrix = isMatrixQuestion(question);
    const noValue = ["为空", "不为空", "已选中", "未选中"].includes(condition.operator);
    return (
      <div className={`validity-condition-row ${matrix ? "matrix-validity-condition" : ""}`} key={`${group.id}-${index}`}>
        <select value={condition.questionId} onChange={(event) => updateConditionQuestion(group.id, index, event.target.value)}>
          {questions.map((item, questionIndex) => <option key={item.id} value={item.id}>Q{questionIndex + 1} {item.title}</option>)}
        </select>
        {matrix && <div className="validity-matrix-target">
          <select value={condition.matrixScope || "cell"} onChange={(event) => {
            const matrixScope = event.target.value as ValidityCondition["matrixScope"];
            updateValidityCondition(group.id, index, { matrixScope, operator: matrixScope === "cell" && question?.type !== "matrixFill" ? "已选中" : "小于", value: "" });
          }}>
            {question?.type !== "matrixScale" && question?.type !== "matrixSlider" && <option value="cell">指定单元格</option>}
            <option value="row">指定行</option>
            <option value="any-row">任意一行</option>
            {["matrixScale", "matrixSlider"].includes(question?.type || "") && <><option value="sum">全部行总分</option><option value="average">全部行平均分</option><option value="minimum">全部行最低分</option></>}
          </select>
          {["cell", "row"].includes(condition.matrixScope || "cell") && <select value={condition.matrixRow || rows[0]} onChange={(event) => updateValidityCondition(group.id, index, { matrixRow: event.target.value })}>{rows.map((row) => <option key={row}>{row}</option>)}</select>}
          {(condition.matrixScope || "cell") === "cell" && <select value={condition.matrixColumn || columns[0]} onChange={(event) => updateValidityCondition(group.id, index, { matrixColumn: event.target.value })}>{columns.map((column) => <option key={column}>{column}</option>)}</select>}
        </div>}
        <select value={condition.operator} onChange={(event) => updateValidityCondition(group.id, index, { operator: event.target.value })}>{operatorsFor(question, condition).map((operator) => <option key={operator}>{operator}</option>)}</select>
        {!noValue && (isChoiceQuestion(question) && question?.options?.length
          ? <select value={condition.value} onChange={(event) => updateValidityCondition(group.id, index, { value: event.target.value })}><option value="">请选择答案</option>{question.options.map((option) => <option key={option}>{option}</option>)}</select>
          : <input type={isNumericQuestion(question) || (matrix && ["matrixScale", "matrixSlider"].includes(question?.type || "")) ? "number" : ["date", "appointmentDate"].includes(question?.type || "") ? "date" : "text"} value={condition.value} onChange={(event) => updateValidityCondition(group.id, index, { value: event.target.value })} placeholder={matrix ? "答案或评分" : "答案或数值"} />)}
        {group.mode === "score" && <label className="validity-score-value"><input type="number" value={condition.score} onChange={(event) => updateValidityCondition(group.id, index, { score: Number(event.target.value) })} /><span>分</span></label>}
        <button disabled={group.conditions.length === 1} onClick={() => updateValidityGroup(group.id, { conditions: group.conditions.filter((_, conditionIndex) => conditionIndex !== index) })}>×</button>
      </div>
    );
  }

  return (
    <main className="insights-page response-table-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title"><span className="survey-doc-icon">▤</span><div><strong>{surveyTitle}</strong><small><i className="live-dot" />答卷明细 · 海外数据区</small></div></div>
        <SurveyNav surveyId={surveyId} active="responses" onNotice={flash} />
        <div className="editor-actions">
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
          <button className="validity-rules-button" onClick={() => setShowValidityRules(true)}>✓ 有效规则</button>
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
      {showValidityRules && <div className="preview-backdrop" onMouseDown={() => setShowValidityRules(false)}><section className="validity-rules-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><strong>答卷有效规则</strong><small>这些规则用于清洗已收集的数据，不限制玩家能否提交；每次判定都会记录命中规则与原因。</small></div><button onClick={() => setShowValidityRules(false)}>×</button></header>
        <div className="validity-rule-body">
          <section className="validity-basic-rules">
            <article className="validity-deduplicate-rule">
              <div><strong>重复答卷去重</strong><small>与回收设置不同：这里不拦截提交，只在统计中按所选字段识别重复答卷。</small></div>
              <details className="validity-multiselect">
                <summary>{duplicateKeys.length ? `已选 ${duplicateKeys.length} 个识别字段` : "选择重复判断字段"}</summary>
                <div>
                  {[
                    ["playerId", "玩家 / 登录账号"],
                    ["joyaMakerId", "JoyaMaker ID"],
                    ["lineId", "LINE 用户 ID"],
                    ["device", "设备标识"],
                    ["ip", "提交 IP"],
                  ].map(([key, label]) => <label key={key}><input type="checkbox" checked={duplicateKeys.includes(key)} onChange={() => setDuplicateKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])} />{label}</label>)}
                </div>
              </details>
              <select value={duplicateKeep} onChange={(event) => setDuplicateKeep(event.target.value as "earliest" | "latest")}><option value="earliest">重复时保留最早一份</option><option value="latest">重复时保留最新一份</option></select>
              <button className={`mini-switch ${deduplicate ? "on" : ""}`} onClick={() => setDeduplicate(!deduplicate)}><i /></button>
            </article>
            <article className="validity-empty-rule">
              <div><strong>指定题目空值</strong><small>仅检查你选择的题目，可多选；任一所选题为空时判定为无效。</small></div>
              <details className="validity-multiselect">
                <summary>{emptyQuestionIds.length ? `已选 ${emptyQuestionIds.length} 道题` : "请选择需要检查的题目"}</summary>
                <div>
                  {questions.map((question, index) => <label key={question.id}><input type="checkbox" checked={emptyQuestionIds.includes(question.id)} onChange={() => setEmptyQuestionIds((current) => current.includes(question.id) ? current.filter((id) => id !== question.id) : [...current, question.id])} />Q{index + 1} {question.title}</label>)}
                </div>
              </details>
            </article>
          </section>
          <section className="validity-section">
            <header><div><strong>答案逻辑判定</strong><small>按题型组合多个答案条件；一组规则内可选择同时满足（且）或任意满足（或）。</small></div></header>
            <div className="validity-groups">
              {logicGroups.map((group, groupIndex) => <section key={group.id} className="validity-group-card logic-rule-card">
                <header>
                  <strong>逻辑规则 {groupIndex + 1}</strong>
                  <div><span>符合</span><select value={group.relation} onChange={(event) => updateValidityGroup(group.id, { relation: event.target.value as "all" | "any" })}><option value="all">全部条件（且）</option><option value="any">任一条件（或）</option></select></div>
                  <select value={group.outcome} onChange={(event) => updateValidityGroup(group.id, { outcome: event.target.value as "valid" | "invalid" })}><option value="invalid">命中时判为无效</option><option value="valid">命中时判为有效</option></select>
                  <button className="delete-validity-group" disabled={logicGroups.length === 1} onClick={() => setValidityGroups((current) => current.filter((item) => item.id !== group.id))}>删除规则</button>
                </header>
                <div>{group.conditions.map((condition, index) => renderConditionEditor(group, condition, index))}</div>
                <button className="add-validity-condition" onClick={() => updateValidityGroup(group.id, { conditions: [...group.conditions, defaultCondition()] })}>＋ 添加条件</button>
              </section>)}
              <button className="add-validity-group" onClick={() => setValidityGroups((current) => [...current, { id: `logic-${Date.now()}`, name: "答案逻辑", relation: "all", mode: "status", outcome: "invalid", conditions: [defaultCondition()] }])}>＋ 添加答案逻辑</button>
            </div>
          </section>

          <section className="validity-section scoring-section">
            <header><div><strong>答案评分</strong><small>为某个答案或数值条件设置分数；评分项彼此独立，不需要配置且/或关系。</small></div></header>
            <div className="validity-groups">
              {scoreGroups.map((group) => <section key={group.id} className="validity-group-card score-rule-card">
                <header><strong>评分规则</strong><button className="delete-validity-group" disabled={scoreGroups.length === 1} onClick={() => setValidityGroups((current) => current.filter((item) => item.id !== group.id))}>删除评分组</button></header>
                <div>{group.conditions.map((condition, index) => renderConditionEditor(group, condition, index))}</div>
                <button className="add-validity-condition" onClick={() => updateValidityGroup(group.id, { conditions: [...group.conditions, defaultCondition()] })}>＋ 添加评分项</button>
              </section>)}
              {!scoreGroups.length && <button className="add-validity-group" onClick={() => setValidityGroups((current) => [...current, { id: `score-${Date.now()}`, name: "答案评分", relation: "any", mode: "score", outcome: "invalid", conditions: [defaultCondition()] }])}>＋ 启用答案评分</button>}
            </div>
            {scoreGroups.length > 0 && <div className="validity-score-threshold">
              <span><strong>总分判定</strong><small>根据以上评分项累计得到总分，并统一判定答卷状态。</small></span>
              <select value={scoreComparator} onChange={(event) => setScoreComparator(event.target.value as "lt" | "gt")}><option value="lt">总分小于</option><option value="gt">总分大于</option></select>
              <input type="number" value={minimumScore} onChange={(event) => setMinimumScore(Number(event.target.value))} />
              <em>分时</em>
              <select value={scoreOutcome} onChange={(event) => setScoreOutcome(event.target.value as "valid" | "invalid")}><option value="invalid">判为无效</option><option value="valid">判为有效</option></select>
            </div>}
          </section>
        </div>
        <footer><button className="secondary-button" onClick={() => setShowValidityRules(false)}>取消</button><button className="primary-button" onClick={saveValidityRules}>保存规则</button></footer>
      </section></div>}
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
