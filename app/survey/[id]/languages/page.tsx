"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { defaultQuestions, loadQuestions, Question } from "@/lib/survey-builder";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

type TranslationField = {
  id: string;
  section: string;
  label: string;
  source: string;
  questionId?: string;
};

const localeMeta = [
  { code: "简中", name: "简体中文", native: "源语言" },
  { code: "EN", name: "English", native: "英语" },
  { code: "繁中", name: "繁體中文", native: "繁体中文" },
  { code: "ไทย", name: "ภาษาไทย", native: "泰语" },
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
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<"全部内容" | "未翻译">("全部内容");
  const hydrated = useRef(false);

  useEffect(() => {
    setQuestions(loadQuestions(surveyId));
    try {
      const saved = window.localStorage.getItem(`joydata-survey-translations-${surveyId}`);
      const verified = window.localStorage.getItem(`joydata-survey-translation-verified-${surveyId}`);
      if (saved) setTranslations(JSON.parse(saved));
      if (verified) setVerifiedLocales(JSON.parse(verified));
    } catch {}
    hydrated.current = true;
  }, [surveyId]);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(`joydata-survey-translations-${surveyId}`, JSON.stringify(translations));
    window.localStorage.setItem(`joydata-survey-translation-verified-${surveyId}`, JSON.stringify(verifiedLocales));
  }, [translations, verifiedLocales, surveyId]);

  const fields = useMemo<TranslationField[]>(() => {
    const result: TranslationField[] = [
      { id: "form:title", section: "问卷封面", label: "问卷标题", source: surveyTitle },
      { id: "form:intro", section: "问卷封面", label: "问卷说明", source: "感谢您参与本次调研。您的反馈将帮助我们持续优化游戏体验。" },
    ];
    questions.forEach((question, questionIndex) => {
      const section = `第 ${questionIndex + 1} 题 · ${question.title}`;
      result.push({ id: `${question.id}:title`, section, label: "题目标题", source: question.title, questionId: question.id });
      if (question.description.trim()) {
        result.push({ id: `${question.id}:description`, section, label: "题目说明", source: question.description, questionId: question.id });
      }
      question.options?.forEach((option, optionIndex) => {
        result.push({ id: `${question.id}:option:${optionIndex}`, section, label: `选项 ${optionIndex + 1}`, source: option, questionId: question.id });
      });
    });
    result.push({ id: "form:completion", section: "提交完成页", label: "完成提示语", source: "感谢您的参与，问卷已成功提交。" });
    return result;
  }, [questions, surveyTitle]);

  function fieldValue(field: TranslationField) {
    const localeValues = translations[activeLocale] || {};
    return localeValues[field.id] || (field.label === "题目标题" && field.questionId ? localeValues[field.questionId] : "") || "";
  }

  const visibleFields = useMemo(
    () => fields.filter((field) => filter === "全部内容" || !fieldValue(field).trim()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeLocale, fields, filter, translations],
  );

  const groupedFields = useMemo(() => {
    const groups = new Map<string, TranslationField[]>();
    visibleFields.forEach((field) => groups.set(field.section, [...(groups.get(field.section) || []), field]));
    return [...groups.entries()];
  }, [visibleFields]);

  const completed = fields.filter((field) => fieldValue(field).trim()).length;
  const progress = Math.round((completed / Math.max(fields.length, 1)) * 100);
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
    if (!verified && completed < fields.length) {
      flash(`仍有 ${fields.length - completed} 项未翻译，补全后才能确认校验完成`);
      return;
    }
    setVerifiedLocales((current) => ({ ...current, [activeLocale]: !verified }));
    flash(verified ? "已取消校验完成状态" : "已标记为翻译与校验完成");
  }

  return (
    <main className="language-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title">
          <span className="survey-doc-icon">文</span>
          <div><strong>{surveyTitle}</strong><small><i className="saved" />翻译内容自动保存</small></div>
        </div>
        <SurveyNav surveyId={surveyId} active="languages" />
        <div className="editor-actions"><span className="continuous-list-label">连续校验清单 · 不分页</span></div>
      </header>

      <section className="language-workspace language-workspace-simple">
        <aside className="locale-sidebar">
          <div className="panel-small-heading">
            <div><strong>问卷语言</strong><small>1 个源语言 · 3 个目标语言</small></div>
            <button onClick={() => flash("语言选择器已打开")}>＋</button>
          </div>
          <div className="locale-list">
            {localeMeta.map((locale) => {
              const isSource = locale.code === "简中";
              const localeFields = translations[locale.code] || {};
              const count = fields.filter((field) => localeFields[field.id]?.trim() || (field.questionId && localeFields[field.questionId]?.trim())).length;
              const localeProgress = isSource ? 100 : Math.round(count / Math.max(fields.length, 1) * 100);
              return (
                <button
                  key={locale.code}
                  className={activeLocale === locale.code ? "active" : ""}
                  onClick={() => isSource ? flash("源语言请在编辑器中修改") : setActiveLocale(locale.code)}
                >
                  <span>{locale.code}</span>
                  <div><strong>{locale.name}</strong><small>{locale.native}</small></div>
                  <em>{isSource ? "源语言" : verifiedLocales[locale.code] ? "已校验" : localeProgress === 100 ? "待校验" : "翻译中"}</em>
                  <div className="locale-progress"><i style={{ width: `${localeProgress}%` }} /></div>
                </button>
              );
            })}
          </div>
          <button className="add-locale-button" onClick={() => flash("语言选择器已打开")}>＋ 添加语言版本</button>
          <div className="locale-rule-tip"><span>i</span><p><strong>源文更新自动失效</strong><br />题目或选项发生修改后，对应语言需要重新人工校验。</p></div>
        </aside>

        <section className="translation-main">
          <header className="translation-heading translation-heading-simple">
            <div>
              <div className="breadcrumb">多语言 <span>/</span> {activeLocale}</div>
              <h1>{localeMeta.find((item) => item.code === activeLocale)?.name} 内容校验</h1>
              <p>从问卷封面到完成页连续展示，共 {fields.length} 项；题目、说明和选项均需翻译并人工确认。</p>
            </div>
            <label className={`translation-verify ${verified ? "verified" : ""}`}>
              <button className={`mini-switch ${verified ? "on" : ""}`} onClick={toggleVerified}><i /></button>
              <span><strong>翻译与校验完成</strong><small>{verified ? "该语言可以发布" : "需由使用者人工确认"}</small></span>
            </label>
          </header>

          <div className="translation-progress-bar"><i style={{ width: `${progress}%` }} /><span>{completed}/{fields.length} · {progress}%</span></div>

          <div className="translation-toolbar translation-toolbar-simple">
            <div className="filter-tabs">
              {(["全部内容", "未翻译"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
            </div>
            <span>源语言：简体中文</span>
          </div>

          <div className="translation-column-head"><span>内容位置</span><span>源语言 · 简体中文</span><span>当前语言 · {activeLocale}</span><span>状态</span></div>
          <div className="translation-form translation-table-form">
            {groupedFields.map(([section, sectionFields]) => (
              <section className="translation-section" key={section}>
                <header><strong>{section}</strong><span>{sectionFields.filter((field) => fieldValue(field).trim()).length}/{sectionFields.length} 已完成</span></header>
                {sectionFields.map((field) => {
                  const value = fieldValue(field);
                  return (
                    <div className="translation-field-row" key={field.id}>
                      <strong className="translation-field-label">{field.label}</strong>
                      <div className="source-copy"><p>{field.source}</p></div>
                      <div className="target-copy">
                        <textarea value={value} placeholder={`输入${activeLocale}翻译`} onChange={(event) => updateTranslation(field.id, event.target.value)} />
                      </div>
                      <span className={value.trim() ? "field-done" : "field-missing"}>{value.trim() ? "已翻译" : "未翻译"}</span>
                    </div>
                  );
                })}
              </section>
            ))}
            {!groupedFields.length && <div className="translation-empty"><span>✓</span><strong>所有表单内容均已翻译</strong><p>请检查内容后，手动确认“翻译与校验完成”。</p></div>}
          </div>
        </section>
      </section>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
