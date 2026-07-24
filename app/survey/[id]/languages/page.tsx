"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { defaultQuestions, loadQuestions, Question } from "@/lib/survey-builder";
import { SurveyNav } from "../survey-nav";

const localeMeta = [
  { code: "EN", name: "English", native: "英语", progress: 100, status: "源语言" },
  { code: "繁中", name: "繁體中文", native: "繁体中文", progress: 67, status: "待校对" },
  { code: "ไทย", name: "ภาษาไทย", native: "泰语", progress: 33, status: "翻译中" },
];

const preset: Record<string, Record<string, string>> = {
  繁中: {
    welcome: "您對本次先鋒測試的整體體驗如何？",
    nps: "您有多大可能向朋友推薦這款遊戲？",
    feedback: "還有哪些體驗可以改進？",
  },
  ไทย: {
    welcome: "คุณพึงพอใจกับประสบการณ์การทดสอบครั้งนี้มากน้อยเพียงใด",
    nps: "คุณมีแนวโน้มที่จะแนะนำเกมนี้ให้เพื่อนมากน้อยเพียงใด",
    feedback: "",
  },
};

export default function LanguagesPage() {
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [activeLocale, setActiveLocale] = useState("繁中");
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>(preset);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<"全部" | "未翻译">("全部");

  useEffect(() => {
    setQuestions(loadQuestions(surveyId));
    try {
      const saved = window.localStorage.getItem(`joydata-survey-translations-${surveyId}`);
      if (saved) setTranslations(JSON.parse(saved));
    } catch {}
  }, [surveyId]);

  const rows = useMemo(
    () =>
      questions.filter(
        (question) =>
          filter === "全部" || !translations[activeLocale]?.[question.id]?.trim(),
      ),
    [activeLocale, filter, questions, translations],
  );

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function updateTranslation(questionId: string, value: string) {
    setTranslations((current) => ({
      ...current,
      [activeLocale]: { ...(current[activeLocale] || {}), [questionId]: value },
    }));
  }

  function saveTranslations() {
    window.localStorage.setItem(
      `joydata-survey-translations-${surveyId}`,
      JSON.stringify(translations),
    );
    flash("翻译内容已保存");
  }

  function smartPrefill() {
    const next: Record<string, string> = { ...(translations[activeLocale] || {}) };
    questions.forEach((question) => {
      if (!next[question.id]) {
        next[question.id] =
          activeLocale === "繁中"
            ? `${question.title.replaceAll("您", "您")}（待校對）`
            : `${question.title} — ${activeLocale}`;
      }
    });
    setTranslations((current) => ({ ...current, [activeLocale]: next }));
    flash("已完成智能预填，请人工校对");
  }

  const completed = questions.filter(
    (question) => translations[activeLocale]?.[question.id]?.trim(),
  ).length;
  const progress = Math.round((completed / Math.max(questions.length, 1)) * 100);

  return (
    <main className="language-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title">
          <span className="survey-doc-icon">文</span>
          <div><strong>RO3 先锋测试玩家体验调研</strong><small><i className="saved" /> 多语言内容已同步</small></div>
        </div>
        <SurveyNav surveyId={surveyId} active="languages" onNotice={flash} />
        <div className="editor-actions">
          <button className="secondary-button" onClick={smartPrefill}>✦ 智能预填</button>
          <button className="primary-button" onClick={saveTranslations}>保存翻译</button>
        </div>
      </header>

      <section className="language-workspace">
        <aside className="locale-sidebar">
          <div className="panel-small-heading">
            <div><strong>问卷语言</strong><small>3 个语言版本</small></div>
            <button onClick={() => flash("添加语言")}>＋</button>
          </div>
          <div className="locale-list">
            {localeMeta.map((locale) => (
              <button
                key={locale.code}
                className={activeLocale === locale.code ? "active" : ""}
                onClick={() => locale.code !== "EN" ? setActiveLocale(locale.code) : flash("源语言请在编辑器中修改")}
              >
                <span>{locale.code}</span>
                <div><strong>{locale.name}</strong><small>{locale.native}</small></div>
                <em>{locale.status}</em>
                <div className="locale-progress"><i style={{ width: `${locale.code === activeLocale ? progress : locale.progress}%` }} /></div>
              </button>
            ))}
          </div>
          <button className="add-locale-button" onClick={() => flash("语言选择器已打开")}>＋ 添加语言版本</button>
          <div className="locale-rule-tip">
            <span>✦</span>
            <p><strong>自动检测原文变化</strong><br />源语言修改后，对应翻译会标记为待更新。</p>
          </div>
        </aside>

        <section className="translation-main">
          <header className="translation-heading">
            <div>
              <div className="breadcrumb">多语言 <span>/</span> {activeLocale}</div>
              <h1>{localeMeta.find((item) => item.code === activeLocale)?.name}</h1>
              <p>{completed} / {questions.length} 个字段已翻译 · 完成度 {progress}%</p>
            </div>
            <div className="translation-progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
              <span>{progress}%</span>
            </div>
          </header>

          <div className="translation-toolbar">
            <div className="filter-tabs">
              {(["全部", "未翻译"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
            </div>
            <button className="filter-button" onClick={() => flash("已定位到下一个未翻译字段")}>下一个未翻译 ↓</button>
            <button className="icon-button" onClick={() => flash("导入翻译文件")}>⇧</button>
            <button className="icon-button" onClick={() => flash("导出翻译文件")}>⇩</button>
          </div>

          <div className="translation-table">
            <div className="translation-table-head"><span>源语言 · English</span><span>目标语言 · {activeLocale}</span><span>状态</span></div>
            {rows.map((question, index) => {
              const value = translations[activeLocale]?.[question.id] || "";
              return (
                <article className="translation-row" key={question.id}>
                  <div className="source-copy">
                    <small>Q{index + 1} · 题目标题</small>
                    <strong>{question.title}</strong>
                    {question.description && <p>{question.description}</p>}
                  </div>
                  <div className="target-copy">
                    <textarea
                      value={value}
                      placeholder={`输入${activeLocale}翻译`}
                      onChange={(event) => updateTranslation(question.id, event.target.value)}
                    />
                    <span>{value.length} / 500</span>
                  </div>
                  <div className="translation-status">
                    {value ? <span className="translated">✓ 已翻译</span> : <span className="missing">! 未翻译</span>}
                  </div>
                </article>
              );
            })}
            {!rows.length && <div className="translation-empty"><span>✓</span><strong>当前语言已全部翻译</strong><p>可以进入校对或发布流程。</p></div>}
          </div>
        </section>

        <aside className="language-guide">
          <div className="panel-small-heading"><div><strong>语言设置</strong><small>{activeLocale}</small></div><button>•••</button></div>
          <div className="language-guide-content">
            <section><h3>发布状态</h3><div className="locale-status-card"><span>◷</span><div><strong>待校对</strong><small>翻译完成后需要人工确认</small></div></div></section>
            <section><h3>前台显示</h3><div className="property-switch-row"><div><strong>允许玩家切换</strong><small>在问卷右上角显示语言入口</small></div><button className="on"><i /></button></div></section>
            <section><h3>翻译检查</h3>
              <div className="check-list">
                <span><i className="ok">✓</i>题目标题 <em>{completed}/{questions.length}</em></span>
                <span><i className="warn">!</i>辅助说明 <em>1 待翻译</em></span>
                <span><i className="ok">✓</i>选项内容 <em>12/12</em></span>
                <span><i className="warn">!</i>完成页 <em>未配置</em></span>
              </div>
            </section>
            <button className="secondary-button full-button" onClick={() => flash("翻译质量检查完成：2 个待处理项")}>运行质量检查</button>
          </div>
        </aside>
      </section>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}

