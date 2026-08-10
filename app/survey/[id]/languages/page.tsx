"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { defaultQuestions, loadQuestions, Question } from "@/lib/survey-builder";
import { loadPublications, Publication } from "@/lib/survey-publication";
import { defaultLotteryConfig, LotteryPrizeType } from "@/lib/survey-lottery";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

type TranslationField = {
  id: string;
  source: string;
  location: string;
  legacyId?: string;
};

const localeMeta = [
  { code: "简中", name: "简体中文", native: "源语言" },
  { code: "EN", name: "English", native: "英语" },
  { code: "繁中", name: "繁體中文", native: "繁体中文" },
  { code: "ไทย", name: "ภาษาไทย", native: "泰语" },
  { code: "한국어", name: "한국어", native: "韩语" },
  { code: "日本語", name: "日本語", native: "日语" },
  { code: "ID", name: "Bahasa Indonesia", native: "印尼语" },
];

const preset: Record<string, Record<string, string>> = {
  EN: {
    "form:intro": "Thank you for joining this test. Your feedback will help us improve the game.",
    "welcome:title": "How would you rate your overall experience in this test?",
    "welcome:option:0": "Very satisfied",
    "welcome:option:1": "Satisfied",
  },
  繁中: {
    "welcome:title": "您對本次先鋒測試的整體體驗如何？",
    "nps:title": "您有多大可能向朋友推薦這款遊戲？",
  },
  ไทย: {},
};

const aiWordMap: Record<string, Record<string, string>> = {
  EN: {
    您: "you", 请: "please", 选择: "select", 填写: "fill in", 感谢: "thank you", 问卷: "survey",
    满意: "satisfied", 体验: "experience", 游戏: "game", 完成: "complete", 提交: "submit", 选项: "option",
    非常: "very", 一般: "average", 推荐: "recommend", 朋友: "friend", 改进: "improve", 测试: "test",
    标题: "title", 说明: "description", 谢谢: "thank you", 参与: "participation", 反馈: "feedback",
  },
  繁中: {
    简体: "簡體", 体验: "體驗", 问卷: "問卷", 满意: "滿意", 选择: "選擇", 选项: "選項", 游戏: "遊戲",
    内容: "內容", 确认: "確認", 输入: "輸入", 标题: "標題", 说明: "說明", 谢谢: "謝謝", 测试: "測試", 还有: "還有",
  },
};

function simulateTranslate(source: string, locale: string, nativeName: string) {
  const map = aiWordMap[locale];
  if (!map) return source ? `[${nativeName}] ${source}` : source;
  let result = source;
  Object.entries(map).forEach(([zh, translated]) => { result = result.split(zh).join(translated); });
  return result;
}

export default function LanguagesPage() {
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [activeLocale, setActiveLocale] = useState("EN");
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>(preset);
  const [verifiedLocales, setVerifiedLocales] = useState<Record<string, boolean>>({});
  const [configuredLanguages, setConfiguredLanguages] = useState(["简中", "EN", "繁中", "ไทย"]);
  const [fallbackLanguage, setFallbackLanguage] = useState("简中");
  const [publication, setPublication] = useState<Publication | null>(null);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [aiTranslating, setAiTranslating] = useState(false);
  const [lotteryPageTab, setLotteryPageTab] = useState<"spin" | "win" | "lose" | "complete">("spin");
  const sourceScrollRef = useRef<HTMLDivElement>(null);
  const targetScrollRef = useRef<HTMLDivElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const syncingScroll = useRef(false);

  useEffect(() => {
    setQuestions(loadQuestions(surveyId));
    setPublication(loadPublications(surveyId)[0] || null);
    try {
      const saved = window.localStorage.getItem(`joydata-survey-translations-${surveyId}`);
      const verified = window.localStorage.getItem(`joydata-survey-translation-verified-${surveyId}`);
      const drafts = JSON.parse(window.localStorage.getItem("joydata-survey-drafts") || "[]");
      const draft = drafts.find((item: { id?: number | string }) => String(item.id) === surveyId);
      if (saved) setTranslations(JSON.parse(saved));
      if (verified) setVerifiedLocales(JSON.parse(verified));
      if (draft?.languages?.length) setConfiguredLanguages(draft.languages);
      setFallbackLanguage(
        window.localStorage.getItem(`joydata-survey-fallback-language-${surveyId}`)
          || draft?.fallbackLanguage
          || draft?.defaultLanguage
          || "简中",
      );
    } catch {}
    setHydrated(true);
  }, [surveyId]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(`joydata-survey-translations-${surveyId}`, JSON.stringify(translations));
    window.localStorage.setItem(`joydata-survey-translation-verified-${surveyId}`, JSON.stringify(verifiedLocales));
    window.localStorage.setItem(`joydata-survey-fallback-language-${surveyId}`, fallbackLanguage);
  }, [translations, verifiedLocales, fallbackLanguage, surveyId, hydrated]);

  const lotteryTranslationSource = useMemo(() => {
    const lottery = publication?.lotteryConfig || defaultLotteryConfig;
    const sourceLocale = publication?.defaultLocale || "zh-CN";
    const spin = lottery.spinPage.content[sourceLocale] || defaultLotteryConfig.spinPage.content["zh-CN"];
    const complete = lottery.completePage.content[sourceLocale] || defaultLotteryConfig.completePage.content["zh-CN"];
    const win = lottery.winPage.content[sourceLocale] || defaultLotteryConfig.winPage.content["zh-CN"];
    const lose = lottery.losePage.content[sourceLocale] || defaultLotteryConfig.losePage.content["zh-CN"];
    const claimFieldEntries: { id: string; label: string }[] = [];
    const seen = new Set<string>();
    (["virtual", "physical", "code"] as LotteryPrizeType[]).forEach((type) => {
      (lottery.claimSettingsByType[type]?.claimFields || []).forEach((field) => {
        const id = field.key.startsWith("custom-") ? `lottery:claim:field:${field.key}` : `lottery:field:${field.key}`;
        if (seen.has(id)) return;
        seen.add(id);
        claimFieldEntries.push({ id, label: field.label });
      });
    });
    const prizeEntries = lottery.prizes
      .filter((prize) => prize.name.trim())
      .map((prize) => ({ id: `lottery:prize:${prize.id}:name`, label: prize.name }));
    return {
      enabled: publication?.completionMode === "lottery",
      spin,
      complete,
      win,
      lose,
      claimFieldEntries,
      prizeEntries,
      spinBackground: lottery.background,
      winBackground: lottery.winPage.backgroundMode === "custom" ? lottery.winPage.background : "",
      loseBackground: lottery.losePage.backgroundMode === "custom" ? lottery.losePage.background : "",
    };
  }, [publication]);

  const fields = useMemo<TranslationField[]>(() => {
    const result: TranslationField[] = [
      { id: "form:title", source: surveyTitle, location: "问卷 / 标题" },
      { id: "form:intro", source: "感谢您参与本次调研。您的反馈将帮助我们持续优化游戏体验。", location: "问卷 / 说明" },
    ];
    questions.forEach((question, questionIndex) => {
      const prefix = `Q${questionIndex + 1}`;
      result.push({ id: `${question.id}:title`, source: question.title, location: `${prefix} / 题目`, legacyId: question.id });
      if (question.description.trim()) result.push({ id: `${question.id}:description`, source: question.description, location: `${prefix} / 说明` });
      if (question.helpText?.trim()) result.push({ id: `${question.id}:help`, source: question.helpText, location: `${prefix} / 填写提示` });
      if (question.minLabel?.trim()) result.push({ id: `${question.id}:minLabel`, source: question.minLabel, location: `${prefix} / 最低分说明` });
      if (question.maxLabel?.trim()) result.push({ id: `${question.id}:maxLabel`, source: question.maxLabel, location: `${prefix} / 最高分说明` });
      question.options?.forEach((option, index) => result.push({ id: `${question.id}:option:${index}`, source: option, location: `${prefix} / 选项 ${index + 1}` }));
      if (question.matrixCornerLabel?.trim()) result.push({ id: `${question.id}:matrix:corner`, source: question.matrixCornerLabel, location: `${prefix} / 矩阵左上角` });
      question.matrixRows?.forEach((row, index) => result.push({ id: `${question.id}:matrix:row:${index}`, source: row, location: `${prefix} / 矩阵行 ${index + 1}` }));
      question.matrixColumns?.forEach((column, index) => result.push({ id: `${question.id}:matrix:column:${index}`, source: column, location: `${prefix} / 矩阵列 ${index + 1}` }));
    });
    const sourceLocale = publication?.defaultLocale || "zh-CN";
    const closedContent = publication?.closedPageContent?.[sourceLocale];
    if (closedContent?.title) result.push({ id: "closed:title", source: closedContent.title, location: "停止收集后页面 / 标题" });
    if (closedContent?.body) result.push({ id: "closed:body", source: closedContent.body, location: "停止收集后页面 / 正文", legacyId: "form:closed" });
    closedContent?.links?.forEach((link, index) => result.push({ id: `closed:link:${link.id}`, source: link.text, location: `停止收集后页面 / 链接 ${index + 1}` }));
    const limitContent = publication?.limitPageContent?.[sourceLocale];
    if (limitContent?.title) result.push({ id: "limit:title", source: limitContent.title, location: "问卷结束页 / 标题" });
    if (limitContent?.body) result.push({ id: "limit:body", source: limitContent.body, location: "问卷结束页 / 正文" });
    limitContent?.links?.forEach((link, index) => result.push({ id: `limit:link:${link.id}`, source: link.text, location: `问卷结束页 / 链接 ${index + 1}` }));
    if (lotteryTranslationSource.enabled) {
      const { spin, complete, win, lose, claimFieldEntries, prizeEntries } = lotteryTranslationSource;
      if (spin.title) result.push({ id: "lottery:spin:title", source: spin.title, location: "抽奖页面 / 标题" });
      if (spin.body) result.push({ id: "lottery:spin:body", source: spin.body, location: "抽奖页面 / 正文" });
      if (spin.buttonText) result.push({ id: "lottery:spin:buttonText", source: spin.buttonText, location: "抽奖页面 / 按钮文字" });
      if (win.title) result.push({ id: "lottery:win:title", source: win.title, location: "中奖页面 / 标题" });
      if (win.body) result.push({ id: "lottery:win:body", source: win.body, location: "中奖页面 / 正文" });
      if (win.buttonText) result.push({ id: "lottery:win:buttonText", source: win.buttonText, location: "中奖页面 / 按钮文字" });
      win.links?.forEach((link, index) => result.push({ id: `lottery:win:link:${link.id}`, source: link.text, location: `中奖页面 / 链接 ${index + 1}` }));
      if (lose.title) result.push({ id: "lottery:lose:title", source: lose.title, location: "未中奖页面 / 标题" });
      if (lose.body) result.push({ id: "lottery:lose:body", source: lose.body, location: "未中奖页面 / 正文" });
      if (lose.buttonText) result.push({ id: "lottery:lose:buttonText", source: lose.buttonText, location: "未中奖页面 / 按钮文字" });
      lose.links?.forEach((link, index) => result.push({ id: `lottery:lose:link:${link.id}`, source: link.text, location: `未中奖页面 / 链接 ${index + 1}` }));
      if (complete.title) result.push({ id: "lottery:complete:title", source: complete.title, location: "抽奖完成页面 / 标题" });
      if (complete.body) result.push({ id: "lottery:complete:body", source: complete.body, location: "抽奖完成页面 / 正文" });
      if (complete.buttonText) result.push({ id: "lottery:complete:buttonText", source: complete.buttonText, location: "抽奖完成页面 / 按钮文字" });
      claimFieldEntries.forEach((entry) => result.push({ id: entry.id, source: entry.label, location: "领奖信息填写字段" }));
      prizeEntries.forEach((entry) => result.push({ id: entry.id, source: entry.label, location: "奖品池 / 奖品名称" }));
    }
    return result;
  }, [publication, questions, surveyTitle, lotteryTranslationSource]);

  const sourceLimitContent = publication?.limitPageContent?.[publication?.defaultLocale || "zh-CN"]
    || { title: "", body: "当前账号或填写环境已达到答题限制。", links: [] };
  const sourceLimitPlainText = sourceLimitContent.links.reduce(
    (text, link) => text.replaceAll(`{{${link.id}}}`, link.text),
    sourceLimitContent.body,
  );
  const sourceClosedContent = publication?.closedPageContent?.[publication?.defaultLocale || "zh-CN"]
    || { title: "本次问卷收集已结束", body: publication?.closedMessage || "本次问卷收集已结束，感谢您的关注。", links: [] };
  const sourceClosedPlainText = sourceClosedContent.links.reduce(
    (text, link) => text.replaceAll(`{{${link.id}}}`, link.text),
    sourceClosedContent.body,
  );
  const sourceLotteryWinPlainText = lotteryTranslationSource.win.links.reduce(
    (text, link) => text.replaceAll(`{{${link.id}}}`, link.text),
    lotteryTranslationSource.win.body,
  );
  const sourceLotteryLosePlainText = lotteryTranslationSource.lose.links.reduce(
    (text, link) => text.replaceAll(`{{${link.id}}}`, link.text),
    lotteryTranslationSource.lose.body,
  );

  function rawTranslation(id: string, legacyId?: string) {
    return translations[activeLocale]?.[id] || (legacyId ? translations[activeLocale]?.[legacyId] : "") || "";
  }

  const completed = fields.filter((field) => rawTranslation(field.id, field.legacyId).trim()).length;
  const missing = fields.length - completed;
  const verified = Boolean(verifiedLocales[activeLocale]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  const translationLocales = configuredLanguages.filter((language) => language !== "简中");
  const localeColumnName = (code: string) => localeMeta.find((locale) => locale.code === code)?.name || code;

  function translationRows() {
    return fields.map((field) => [
      field.id,
      field.location,
      field.source,
      ...translationLocales.map((locale) => translations[locale]?.[field.id] || (field.legacyId ? translations[locale]?.[field.legacyId] : "") || ""),
    ]);
  }

  function downloadTranslationFile(content: BlobPart, type: string, extension: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${surveyTitle}-本地化翻译表-${new Date().toISOString().slice(0, 10)}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
    flash(`已导出 ${extension === "csv" ? "CSV" : "Excel"} 翻译表`);
  }

  function exportTranslationCsv() {
    const escape = (value: string) => `"${value.replaceAll("\"", "\"\"")}"`;
    const headers = ["内容 ID（请勿修改）", "内容位置", "原文", ...translationLocales.map(localeColumnName)];
    const csv = [headers, ...translationRows()].map((row) => row.map((value) => escape(String(value))).join(",")).join("\r\n");
    downloadTranslationFile(`\uFEFF${csv}`, "text/csv;charset=utf-8", "csv");
  }

  function exportTranslationExcel() {
    const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
    const headers = ["内容 ID（请勿修改）", "内容位置", "原文", ...translationLocales.map(localeColumnName)];
    const table = `<table><thead><tr>${headers.map((header) => `<th>${escape(header)}</th>`).join("")}</tr></thead><tbody>${translationRows().map((row) => `<tr>${row.map((value) => `<td>${escape(String(value))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const document = `<html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;font-family:Arial,sans-serif}th{background:#edf3ff;color:#24446f}th,td{border:1px solid #cfd8e6;padding:8px;vertical-align:top;mso-number-format:"\\@"}td:first-child{color:#77849a}</style></head><body>${table}</body></html>`;
    downloadTranslationFile(`\uFEFF${document}`, "application/vnd.ms-excel;charset=utf-8", "xls");
  }

  function exportTranslationFeishu() {
    window.localStorage.setItem(`joydata-feishu-translation-export-${surveyId}`, JSON.stringify({
      mode: "new",
      tableName: `${surveyTitle}-本地化翻译表`,
      headers: ["内容 ID（请勿修改）", "内容位置", "原文", ...translationLocales.map(localeColumnName)],
      rows: translationRows(),
      updatedAt: new Date().toISOString(),
    }));
    flash("已提交新建飞书多维表格任务");
  }

  function parseCsv(text: string) {
    const rows: string[][] = [];
    let row: string[] = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (character === "\"") {
        if (quoted && text[index + 1] === "\"") { value += "\""; index += 1; }
        else quoted = !quoted;
      } else if (character === "," && !quoted) {
        row.push(value);
        value = "";
      } else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        row.push(value);
        if (row.some((cell) => cell.trim())) rows.push(row);
        row = [];
        value = "";
      } else value += character;
    }
    row.push(value);
    if (row.some((cell) => cell.trim())) rows.push(row);
    return rows;
  }

  async function importTranslationFile(file?: File) {
    if (!file) return;
    const text = await file.text();
    let rows: string[][] = [];
    if (file.name.toLowerCase().endsWith(".csv")) {
      rows = parseCsv(text.replace(/^\uFEFF/, ""));
    } else {
      const document = new DOMParser().parseFromString(text, "text/html");
      rows = Array.from(document.querySelectorAll("tr")).map((row) =>
        Array.from(row.querySelectorAll("th,td")).map((cell) => cell.textContent || ""),
      );
    }
    if (rows.length < 2) {
      flash("未识别到可导入的翻译内容");
      return;
    }
    const headers = rows[0].map((header) => header.trim());
    const idIndex = headers.findIndex((header) => header.startsWith("内容 ID"));
    const sourceIndex = headers.indexOf("原文");
    const localeIndexes = headers.map((header, index) => {
      const locale = localeMeta.find((item) => item.code !== "简中" && [item.code, item.name, item.native].includes(header));
      return locale ? { index, code: locale.code } : null;
    }).filter(Boolean) as { index: number; code: string }[];
    if ((!localeIndexes.length) || (idIndex < 0 && sourceIndex < 0)) {
      flash("表格缺少“内容 ID / 原文”或目标语言列");
      return;
    }
    const fieldById = new Map(fields.map((field) => [field.id, field]));
    const fieldsBySource = new Map<string, TranslationField[]>();
    fields.forEach((field) => fieldsBySource.set(field.source, [...(fieldsBySource.get(field.source) || []), field]));
    let imported = 0;
    const nextTranslations = structuredClone(translations);
    rows.slice(1).forEach((row) => {
      const byId = idIndex >= 0 ? fieldById.get((row[idIndex] || "").trim()) : undefined;
      const bySource = sourceIndex >= 0 ? fieldsBySource.get((row[sourceIndex] || "").trim())?.[0] : undefined;
      const field = byId || bySource;
      if (!field) return;
      localeIndexes.forEach(({ index, code }) => {
        const value = (row[index] || "").trim();
        if (!value) return;
        nextTranslations[code] = { ...(nextTranslations[code] || {}), [field.id]: value };
        imported += 1;
      });
    });
    setTranslations(nextTranslations);
    setVerifiedLocales((current) => ({ ...current, ...Object.fromEntries(localeIndexes.map(({ code }) => [code, false])) }));
    flash(imported ? `已导入 ${imported} 项翻译，请人工校验后确认` : "没有发现可回填的新译文");
  }

  function updateTranslation(fieldId: string, value: string) {
    setTranslations((current) => ({
      ...current,
      [activeLocale]: { ...(current[activeLocale] || {}), [fieldId]: value },
    }));
    if (verified) setVerifiedLocales((current) => ({ ...current, [activeLocale]: false }));
  }

  function toggleVerified() {
    if (!verified && missing > 0) {
      flash(`仍有 ${missing} 项未翻译，完成后才能确认校验`);
      return;
    }
    setVerifiedLocales((current) => ({ ...current, [activeLocale]: !verified }));
    flash(verified ? "已取消校验完成状态" : "已标记为翻译与校验完成");
  }

  function runAiTranslate() {
    if (activeLocale === "简中") {
      flash("请先在左侧选择需要翻译的目标语言");
      return;
    }
    const targets = fields.filter((field) => !rawTranslation(field.id, field.legacyId).trim());
    if (!targets.length) {
      flash("当前语言已全部翻译完成，无需再次生成");
      return;
    }
    setAiTranslating(true);
    window.setTimeout(() => {
      const nativeName = localeMeta.find((locale) => locale.code === activeLocale)?.name || activeLocale;
      setTranslations((current) => ({
        ...current,
        [activeLocale]: {
          ...(current[activeLocale] || {}),
          ...Object.fromEntries(targets.map((field) => [field.id, simulateTranslate(field.source, activeLocale, nativeName)])),
        },
      }));
      setVerifiedLocales((current) => ({ ...current, [activeLocale]: false }));
      setAiTranslating(false);
      flash(`AI 已生成 ${targets.length} 项翻译建议，请人工校验后确认`);
    }, 900);
  }

  function synchronizeScroll(source: HTMLDivElement, target: HTMLDivElement) {
    if (syncingScroll.current) return;
    syncingScroll.current = true;
    const sourceMax = Math.max(source.scrollHeight - source.clientHeight, 1);
    const targetMax = Math.max(target.scrollHeight - target.clientHeight, 0);
    target.scrollTop = source.scrollTop / sourceMax * targetMax;
    window.requestAnimationFrame(() => { syncingScroll.current = false; });
  }

  function editableField(id: string, source: string, label: string, legacyId?: string) {
    const translated = rawTranslation(id, legacyId);
    const isMissing = !translated.trim();
    return (
      <label className={`phone-translation-field ${isMissing ? "fallback" : ""}`}>
        <span>{label}{isMissing && <em>未翻译 · 当前显示原文</em>}</span>
        <textarea
          aria-label={`${label}翻译`}
          value={translated || source}
          onFocus={(event) => { if (isMissing) event.currentTarget.select(); }}
          onChange={(event) => updateTranslation(id, event.target.value)}
        />
      </label>
    );
  }

  function sourceQuestion(question: Question, index: number) {
    if (question.type === "pageBreak") return <div className="translation-page-divider" key={question.id}>分页</div>;
    if (question.type === "divider") return <div className="translation-phone-divider" key={question.id} />;
    return (
      <article className="translation-phone-question" key={question.id}>
        <small>{String(index + 1).padStart(2, "0")} · 问题</small>
        <h2>{question.title}{question.required && <b>*</b>}</h2>
        {question.description && <p>{question.description}</p>}
        {question.options?.map((option, optionIndex) => <div className="translation-phone-option" key={`${question.id}-${optionIndex}`}><i>○</i>{option}</div>)}
        {question.matrixRows?.length && <div className="translation-matrix-labels">
          <strong>{question.matrixCornerLabel || "题目 / 选项"}</strong>
          <p>行：{question.matrixRows.join("、")}</p>
          <p>列：{question.matrixColumns?.join("、")}</p>
        </div>}
        {!question.options && !["divider", "description"].includes(question.type) && <div className="translation-phone-input">请输入您的回答</div>}
      </article>
    );
  }

  function targetQuestion(question: Question, index: number) {
    if (question.type === "pageBreak") return <div className="translation-page-divider" key={question.id}>分页</div>;
    if (question.type === "divider") return <div className="translation-phone-divider" key={question.id} />;
    return (
      <article className="translation-phone-question editable" key={question.id}>
        <small>{String(index + 1).padStart(2, "0")} · 问题</small>
        {editableField(`${question.id}:title`, question.title, "题目", question.id)}
        {question.description && editableField(`${question.id}:description`, question.description, "说明")}
        {question.options?.map((option, optionIndex) => (
          <div className="translation-option-editor" key={`${question.id}-${optionIndex}`}>
            <i>○</i>{editableField(`${question.id}:option:${optionIndex}`, option, `选项 ${optionIndex + 1}`)}
          </div>
        ))}
        {question.matrixRows?.length && <div className="translation-matrix-editor">
          {editableField(`${question.id}:matrix:corner`, question.matrixCornerLabel || "题目 / 选项", "矩阵左上角")}
          {question.matrixRows.map((row, rowIndex) => editableField(`${question.id}:matrix:row:${rowIndex}`, row, `矩阵行 ${rowIndex + 1}`))}
          {question.matrixColumns?.map((column, columnIndex) => editableField(`${question.id}:matrix:column:${columnIndex}`, column, `矩阵列 ${columnIndex + 1}`))}
        </div>}
        {!question.options && !["divider", "description"].includes(question.type) && <div className="translation-phone-input">请输入您的回答</div>}
      </article>
    );
  }

  return (
    <main className="language-page language-compare-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title"><span className="survey-doc-icon">文</span><div><strong>{surveyTitle}</strong><small><i className="saved" />翻译内容自动保存</small></div></div>
        <SurveyNav surveyId={surveyId} active="languages" />
        <div className="editor-actions language-file-actions">
          <button className="primary-button ai-translate-button" disabled={aiTranslating} onClick={runAiTranslate}>{aiTranslating ? "AI 翻译中…" : "✦ AI 翻译"}</button>
          <input ref={importFileRef} type="file" accept=".csv,.xls,application/vnd.ms-excel,text/csv" hidden onChange={(event) => { void importTranslationFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
          <button className="secondary-button" onClick={() => importFileRef.current?.click()}>⇧ 导入翻译</button>
          <details>
            <summary className="primary-button">⇩ 导出翻译表</summary>
            <div>
              <button onClick={exportTranslationExcel}><strong>Excel</strong><small>适合本地化人员协作编辑</small></button>
              <button onClick={exportTranslationCsv}><strong>CSV</strong><small>适合翻译平台和批量处理</small></button>
              <button onClick={exportTranslationFeishu}><strong>飞书多维表格</strong><small>新建一张翻译协作表</small></button>
            </div>
          </details>
        </div>
      </header>

      <section className="language-workspace language-compare-workspace">
        <aside className="locale-sidebar">
          <div className="panel-small-heading"><div><strong>问卷语言</strong><small>选择需要校验的目标语言</small></div><button onClick={() => flash("语言选择器已打开")}>＋</button></div>
          <div className="locale-list">
            {localeMeta.filter((locale) => locale.code === "简中" || configuredLanguages.includes(locale.code)).map((locale) => {
              const isSource = locale.code === "简中";
              const localeValues = translations[locale.code] || {};
              const localeCompleted = fields.filter((field) => localeValues[field.id]?.trim() || (field.legacyId && localeValues[field.legacyId]?.trim())).length;
              const localeProgress = isSource ? 100 : Math.round(localeCompleted / Math.max(fields.length, 1) * 100);
              return (
                <button key={locale.code} className={activeLocale === locale.code ? "active" : ""} onClick={() => isSource ? flash("左侧已固定展示简体中文原文") : setActiveLocale(locale.code)}>
                  <span>{locale.code}</span><div><strong>{locale.name}</strong><small>{locale.native}</small></div>
                  <em>{isSource ? "原文" : verifiedLocales[locale.code] ? "已校验" : `${localeProgress}%`}</em>
                  <div className="locale-progress"><i style={{ width: `${localeProgress}%` }} /></div>
                </button>
              );
            })}
          </div>
          <button className="add-locale-button" onClick={() => flash("语言选择器已打开")}>＋ 添加语言版本</button>
          <div className="fallback-language-setting">
            <span>未匹配时展示</span>
            <select value={fallbackLanguage} onChange={(event) => setFallbackLanguage(event.target.value)}>
              {configuredLanguages.map((language) => <option key={language} value={language}>{language}</option>)}
            </select>
            <small>用户系统语言不在问卷语言中时使用</small>
          </div>
          <div className="locale-rule-tip"><span>i</span><p><strong>原文回退规则</strong><br />未翻译内容会先显示原文并标注，发布前必须完成校验。</p></div>
        </aside>

        <section className="language-compare-main">
          <header className="language-compare-heading">
            <div><div className="breadcrumb">多语言 <span>/</span> {activeLocale}</div><h1>原文与翻译对照校验</h1><p>在右侧移动端页面直接修改翻译，两侧滚动位置自动保持一致。</p></div>
            <label className={`language-verify-control ${verified ? "verified" : ""}`}><button className={`mini-switch ${verified ? "on" : ""}`} onClick={toggleVerified}><i /></button><span><strong>翻译校验完成</strong><small>{verified ? "已确认，可用于发布" : "完成翻译后由人工确认"}</small></span></label>
          </header>

          <div className="dual-phone-stage">
            <section className="language-phone-column">
              <header><div><span>原</span><p><strong>简体中文</strong><small>源语言 · 只读</small></p></div><em>原文</em></header>
              <div className="language-phone-frame">
                <div className="language-phone-scroll" ref={sourceScrollRef} onScroll={(event) => targetScrollRef.current && synchronizeScroll(event.currentTarget, targetScrollRef.current)}>
                   <div className="translation-phone-cover"><h1>{surveyTitle}</h1><p>感谢您参与本次调研。您的反馈将帮助我们持续优化游戏体验。</p></div>
                   <div className="translation-phone-content">{questions.map(sourceQuestion)}</div>
                 </div>
              </div>
            </section>

            <div className="scroll-sync-indicator"><span>⇅</span><strong>同步滚动</strong><small>任一侧滚动，另一侧自动跟随</small></div>

            <section className="language-phone-column target">
              <header><div><span>译</span><p><strong>{localeMeta.find((locale) => locale.code === activeLocale)?.name}</strong><small>目标语言 · 可编辑</small></p></div><em>{verified ? "已校验" : "编辑中"}</em></header>
              <div className="language-phone-frame">
                <div className="language-phone-scroll" ref={targetScrollRef} onScroll={(event) => sourceScrollRef.current && synchronizeScroll(event.currentTarget, sourceScrollRef.current)}>
                  <div className="translation-phone-cover editable-cover">
                    {editableField("form:title", surveyTitle, "问卷标题")}
                    {editableField("form:intro", "感谢您参与本次调研。您的反馈将帮助我们持续优化游戏体验。", "问卷说明")}
                   </div>
                   <div className="translation-phone-content">{questions.map(targetQuestion)}</div>
                 </div>
               </div>
             </section>
           </div>

           <div className="language-result-pages">
             <section className="language-result-workspace">
               <header><div><strong>停止收集后页面</strong><small>手动结束、定时结束、达到总量或不在开放时段时展示。</small></div></header>
               <div className="result-translation-pair">
                 <article>
                   <header><span>原</span><div><strong>简体中文</strong><small>源语言 · 只读</small></div></header>
                   <div className="standalone-result-preview full-page closed">{sourceClosedContent.title && <h2>{sourceClosedContent.title}</h2>}<p>{sourceClosedPlainText}</p></div>
                 </article>
                 <article className="translated">
                   <header><span>译</span><div><strong>{localeMeta.find((locale) => locale.code === activeLocale)?.name}</strong><small>目标语言 · 可编辑</small></div></header>
                   <div className="standalone-result-editor full-page">
                     {sourceClosedContent.title && editableField("closed:title", sourceClosedContent.title, "标题（可留空）")}
                     {editableField("closed:body", sourceClosedContent.body, "正文")}
                     {sourceClosedContent.links.map((link, index) => editableField(`closed:link:${link.id}`, link.text, `链接 ${index + 1} 文字`))}
                   </div>
                 </article>
               </div>
             </section>

             <section className="language-result-workspace">
               <header><div><strong>问卷结束页</strong><small>提交完成和达到重复填写限制时共用；跳转网页模式下仍用于限制结果。</small></div></header>
               <div className="result-translation-pair">
                 <article>
                   <header><span>原</span><div><strong>简体中文</strong><small>源语言 · 只读</small></div></header>
                   <div className="standalone-result-preview full-page limit">{sourceLimitContent.title && <h2>{sourceLimitContent.title}</h2>}<p>{sourceLimitPlainText}</p></div>
                 </article>
                 <article className="translated">
                   <header><span>译</span><div><strong>{localeMeta.find((locale) => locale.code === activeLocale)?.name}</strong><small>目标语言 · 可编辑</small></div></header>
                   <div className="standalone-result-editor full-page">
                     {sourceLimitContent.title && editableField("limit:title", sourceLimitContent.title, "标题（可留空）")}
                     {editableField("limit:body", sourceLimitContent.body, "正文")}
                     {sourceLimitContent.links.map((link, index) => editableField(`limit:link:${link.id}`, link.text, `链接 ${index + 1} 文字`))}
                     {sourceLimitContent.links.length > 0 && <p className="translation-token-tip">正文中的链接位置标记请保留；链接地址沿用原文设置。</p>}
                   </div>
                 </article>
               </div>
             </section>

             {lotteryTranslationSource.enabled && (
               <>
                 <section className="language-result-workspace">
                   <header>
                     <div><strong>抽奖流程页面</strong><small>抽奖页面、中奖页面、未中奖页面、抽奖完成页面的标题、正文与按钮文字。</small></div>
                     <nav>
                       <button className={lotteryPageTab === "spin" ? "active" : ""} onClick={() => setLotteryPageTab("spin")}>抽奖页面</button>
                       <button className={lotteryPageTab === "win" ? "active" : ""} onClick={() => setLotteryPageTab("win")}>中奖页面</button>
                       <button className={lotteryPageTab === "lose" ? "active" : ""} onClick={() => setLotteryPageTab("lose")}>未中奖页面</button>
                       <button className={lotteryPageTab === "complete" ? "active" : ""} onClick={() => setLotteryPageTab("complete")}>抽奖完成页面</button>
                     </nav>
                   </header>
                   {lotteryPageTab === "spin" && (
                     <div className="result-translation-pair">
                       <article>
                         <header><span>原</span><div><strong>简体中文</strong><small>源语言 · 只读</small></div></header>
                         <div className={`standalone-result-preview full-page lottery ${lotteryTranslationSource.spinBackground ? "custom" : ""}`} style={lotteryTranslationSource.spinBackground ? { backgroundImage: `url(${lotteryTranslationSource.spinBackground})` } : undefined}>{lotteryTranslationSource.spin.title && <h2>{lotteryTranslationSource.spin.title}</h2>}<p>{lotteryTranslationSource.spin.body}</p></div>
                       </article>
                       <article className="translated">
                         <header><span>译</span><div><strong>{localeMeta.find((locale) => locale.code === activeLocale)?.name}</strong><small>目标语言 · 可编辑</small></div></header>
                         <div className="standalone-result-editor full-page">
                           {lotteryTranslationSource.spin.title && editableField("lottery:spin:title", lotteryTranslationSource.spin.title, "标题（可留空）")}
                           {editableField("lottery:spin:body", lotteryTranslationSource.spin.body, "正文")}
                           {lotteryTranslationSource.spin.buttonText && editableField("lottery:spin:buttonText", lotteryTranslationSource.spin.buttonText, "按钮文字")}
                         </div>
                       </article>
                     </div>
                   )}
                   {lotteryPageTab === "win" && (
                     <div className="result-translation-pair">
                       <article>
                         <header><span>原</span><div><strong>简体中文</strong><small>源语言 · 只读</small></div></header>
                         <div className={`standalone-result-preview full-page lottery ${lotteryTranslationSource.winBackground ? "custom" : ""}`} style={lotteryTranslationSource.winBackground ? { backgroundImage: `url(${lotteryTranslationSource.winBackground})` } : undefined}>{lotteryTranslationSource.win.title && <h2>{lotteryTranslationSource.win.title}</h2>}<p>{sourceLotteryWinPlainText}</p></div>
                       </article>
                       <article className="translated">
                         <header><span>译</span><div><strong>{localeMeta.find((locale) => locale.code === activeLocale)?.name}</strong><small>目标语言 · 可编辑</small></div></header>
                         <div className="standalone-result-editor full-page">
                           {lotteryTranslationSource.win.title && editableField("lottery:win:title", lotteryTranslationSource.win.title, "标题（可留空）")}
                           {editableField("lottery:win:body", lotteryTranslationSource.win.body, "正文")}
                           {lotteryTranslationSource.win.links.map((link, index) => editableField(`lottery:win:link:${link.id}`, link.text, `链接 ${index + 1} 文字`))}
                           {lotteryTranslationSource.win.buttonText && editableField("lottery:win:buttonText", lotteryTranslationSource.win.buttonText, "按钮文字")}
                         </div>
                       </article>
                     </div>
                   )}
                   {lotteryPageTab === "lose" && (
                     <div className="result-translation-pair">
                       <article>
                         <header><span>原</span><div><strong>简体中文</strong><small>源语言 · 只读</small></div></header>
                         <div className={`standalone-result-preview full-page lottery ${lotteryTranslationSource.loseBackground ? "custom" : ""}`} style={lotteryTranslationSource.loseBackground ? { backgroundImage: `url(${lotteryTranslationSource.loseBackground})` } : undefined}>{lotteryTranslationSource.lose.title && <h2>{lotteryTranslationSource.lose.title}</h2>}<p>{sourceLotteryLosePlainText}</p></div>
                       </article>
                       <article className="translated">
                         <header><span>译</span><div><strong>{localeMeta.find((locale) => locale.code === activeLocale)?.name}</strong><small>目标语言 · 可编辑</small></div></header>
                         <div className="standalone-result-editor full-page">
                           {lotteryTranslationSource.lose.title && editableField("lottery:lose:title", lotteryTranslationSource.lose.title, "标题（可留空）")}
                           {editableField("lottery:lose:body", lotteryTranslationSource.lose.body, "正文")}
                           {lotteryTranslationSource.lose.links.map((link, index) => editableField(`lottery:lose:link:${link.id}`, link.text, `链接 ${index + 1} 文字`))}
                           {lotteryTranslationSource.lose.buttonText && editableField("lottery:lose:buttonText", lotteryTranslationSource.lose.buttonText, "按钮文字")}
                         </div>
                       </article>
                     </div>
                   )}
                   {lotteryPageTab === "complete" && (
                     <div className="result-translation-pair">
                       <article>
                         <header><span>原</span><div><strong>简体中文</strong><small>源语言 · 只读</small></div></header>
                         <div className="standalone-result-preview full-page lottery">{lotteryTranslationSource.complete.title && <h2>{lotteryTranslationSource.complete.title}</h2>}<p>{lotteryTranslationSource.complete.body}</p></div>
                       </article>
                       <article className="translated">
                         <header><span>译</span><div><strong>{localeMeta.find((locale) => locale.code === activeLocale)?.name}</strong><small>目标语言 · 可编辑</small></div></header>
                         <div className="standalone-result-editor full-page">
                           {lotteryTranslationSource.complete.title && editableField("lottery:complete:title", lotteryTranslationSource.complete.title, "标题（可留空）")}
                           {editableField("lottery:complete:body", lotteryTranslationSource.complete.body, "正文")}
                           {lotteryTranslationSource.complete.buttonText && editableField("lottery:complete:buttonText", lotteryTranslationSource.complete.buttonText, "按钮文字")}
                         </div>
                       </article>
                     </div>
                   )}
                 </section>

                 {lotteryTranslationSource.claimFieldEntries.length > 0 && (
                   <section className="language-result-workspace">
                     <header><div><strong>领奖信息填写字段</strong><small>中奖用户需要填写的固定字段与自定义字段标签。</small></div></header>
                     <div className="result-translation-pair">
                       <article>
                         <header><span>原</span><div><strong>简体中文</strong><small>源语言 · 只读</small></div></header>
                         <div className="standalone-result-preview full-page lottery">
                           {lotteryTranslationSource.claimFieldEntries.map((entry) => <p key={entry.id}>{entry.label}</p>)}
                         </div>
                       </article>
                       <article className="translated">
                         <header><span>译</span><div><strong>{localeMeta.find((locale) => locale.code === activeLocale)?.name}</strong><small>目标语言 · 可编辑</small></div></header>
                         <div className="standalone-result-editor full-page">
                           {lotteryTranslationSource.claimFieldEntries.map((entry) => editableField(entry.id, entry.label, entry.label))}
                         </div>
                       </article>
                     </div>
                   </section>
                 )}

                 {lotteryTranslationSource.prizeEntries.length > 0 && (
                   <section className="language-result-workspace">
                     <header><div><strong>奖品池 / 奖品名称</strong><small>九宫格奖品池中每个奖品的名称。</small></div></header>
                     <div className="result-translation-pair">
                       <article>
                         <header><span>原</span><div><strong>简体中文</strong><small>源语言 · 只读</small></div></header>
                         <div className="standalone-result-preview full-page lottery">
                           {lotteryTranslationSource.prizeEntries.map((entry) => <p key={entry.id}>{entry.label}</p>)}
                         </div>
                       </article>
                       <article className="translated">
                         <header><span>译</span><div><strong>{localeMeta.find((locale) => locale.code === activeLocale)?.name}</strong><small>目标语言 · 可编辑</small></div></header>
                         <div className="standalone-result-editor full-page">
                           {lotteryTranslationSource.prizeEntries.map((entry) => editableField(entry.id, entry.label, entry.label))}
                         </div>
                       </article>
                     </div>
                   </section>
                 )}
               </>
             )}
           </div>
         </section>
      </section>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
