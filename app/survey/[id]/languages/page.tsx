"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { defaultQuestions, loadQuestions, Question } from "@/lib/survey-builder";
import { loadPublications, Publication } from "@/lib/survey-publication";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

type TranslationField = {
  id: string;
  source: string;
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
  const sourceScrollRef = useRef<HTMLDivElement>(null);
  const targetScrollRef = useRef<HTMLDivElement>(null);
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

  const fields = useMemo<TranslationField[]>(() => {
    const result: TranslationField[] = [
      { id: "form:title", source: surveyTitle },
      { id: "form:intro", source: "感谢您参与本次调研。您的反馈将帮助我们持续优化游戏体验。" },
    ];
    questions.forEach((question) => {
      result.push({ id: `${question.id}:title`, source: question.title, legacyId: question.id });
      if (question.description.trim()) result.push({ id: `${question.id}:description`, source: question.description });
      question.options?.forEach((option, index) => result.push({ id: `${question.id}:option:${index}`, source: option }));
    });
    result.push({ id: "form:completion", source: publication?.completionMessage || "感谢您的参与，问卷已成功提交。" });
    const sourceLocale = publication?.defaultLocale || "zh-CN";
    const limitContent = publication?.limitPageContent?.[sourceLocale];
    if (limitContent?.title) result.push({ id: "limit:title", source: limitContent.title });
    if (limitContent?.body) result.push({ id: "limit:body", source: limitContent.body });
    limitContent?.links?.forEach((link) => result.push({ id: `limit:link:${link.id}`, source: link.text }));
    return result;
  }, [publication, questions, surveyTitle]);

  const sourceLimitContent = publication?.limitPageContent?.[publication?.defaultLocale || "zh-CN"]
    || { title: "", body: "当前账号或填写环境已达到提交次数限制。", links: [] };
  const sourceLimitPlainText = sourceLimitContent.links.reduce(
    (text, link) => text.replaceAll(`{{${link.id}}}`, link.text),
    sourceLimitContent.body,
  );

  function rawTranslation(id: string, legacyId?: string) {
    return translations[activeLocale]?.[id] || (legacyId ? translations[activeLocale]?.[legacyId] : "") || "";
  }

  const completed = fields.filter((field) => rawTranslation(field.id, field.legacyId).trim()).length;
  const missing = fields.length - completed;
  const progress = Math.round(completed / Math.max(fields.length, 1) * 100);
  const verified = Boolean(verifiedLocales[activeLocale]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
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
        <div className="editor-actions"><span className="continuous-list-label">双端同步校验 · 连续滚动</span></div>
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
            <div className="language-review-summary">
              <span><small>翻译进度</small><strong>{completed}/{fields.length}</strong><i><em style={{ width: `${progress}%` }} /></i></span>
              <span className={missing ? "has-missing" : ""}><small>未翻译</small><strong>{missing}</strong></span>
              <label className={verified ? "verified" : ""}><button className={`mini-switch ${verified ? "on" : ""}`} onClick={toggleVerified}><i /></button><span><strong>校验完成</strong><small>{verified ? "可用于发布与外观预览" : "完成翻译后人工确认"}</small></span></label>
            </div>
          </header>

          <div className="dual-phone-stage">
            <section className="language-phone-column">
              <header><div><span>原</span><p><strong>简体中文</strong><small>源语言 · 只读</small></p></div><em>原文</em></header>
              <div className="language-phone-frame">
                <div className="language-phone-scroll" ref={sourceScrollRef} onScroll={(event) => targetScrollRef.current && synchronizeScroll(event.currentTarget, targetScrollRef.current)}>
                  <div className="translation-phone-cover"><span>RO3 · PLAYER RESEARCH</span><h1>{surveyTitle}</h1><p>感谢您参与本次调研。您的反馈将帮助我们持续优化游戏体验。</p></div>
                  <div className="translation-phone-content">{questions.map(sourceQuestion)}</div>
                  <div className="translation-phone-complete"><span>✓</span><strong>{publication?.completionMessage || "感谢您的参与，问卷已成功提交。"}</strong></div>
                  <div className="translation-result-section">
                    <small>重复填写限制结果页 · 原文</small>
                    {sourceLimitContent.title && <h2>{sourceLimitContent.title}</h2>}
                    <p>{sourceLimitPlainText}</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="scroll-sync-indicator"><span>⇅</span><strong>同步滚动</strong><small>任一侧滚动，另一侧自动跟随</small></div>

            <section className="language-phone-column target">
              <header><div><span>译</span><p><strong>{localeMeta.find((locale) => locale.code === activeLocale)?.name}</strong><small>目标语言 · 可编辑</small></p></div><em>{missing ? `${missing} 项未翻译` : verified ? "已校验" : "待校验"}</em></header>
              <div className="language-phone-frame">
                <div className="language-phone-scroll" ref={targetScrollRef} onScroll={(event) => sourceScrollRef.current && synchronizeScroll(event.currentTarget, sourceScrollRef.current)}>
                  <div className="translation-phone-cover editable-cover">
                    <span>RO3 · PLAYER RESEARCH</span>
                    {editableField("form:title", surveyTitle, "问卷标题")}
                    {editableField("form:intro", "感谢您参与本次调研。您的反馈将帮助我们持续优化游戏体验。", "问卷说明")}
                  </div>
                  <div className="translation-phone-content">{questions.map(targetQuestion)}</div>
                  <div className="translation-phone-complete editable-complete">{editableField("form:completion", publication?.completionMessage || "感谢您的参与，问卷已成功提交。", "提交完成页")}</div>
                  <div className="translation-result-section editable">
                    <small>重复填写限制结果页 · 翻译</small>
                    {sourceLimitContent.title && editableField("limit:title", sourceLimitContent.title, "标题（可留空）")}
                    {editableField("limit:body", sourceLimitContent.body, "正文")}
                    {sourceLimitContent.links.map((link, index) => editableField(`limit:link:${link.id}`, link.text, `链接 ${index + 1} 文字`))}
                    <p className="translation-token-tip">正文中的 {"{{link-id}}"} 是链接位置标记，请保留；链接地址沿用原文设置，无需重复填写。</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </section>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
