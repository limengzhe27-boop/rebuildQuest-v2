"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { defaultQuestions, loadQuestions, Question } from "@/lib/survey-builder";
import { LimitPageContent, loadPublications, Publication } from "@/lib/survey-publication";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

type Appearance = {
  theme: string;
  primary: string;
  radius: number;
  density: "compact" | "comfortable";
  fontSize: "standard" | "large";
  buttonStyle: "filled" | "outline";
  progress: boolean;
  languageSwitch: boolean;
  background: "plain" | "soft" | "dark";
};

const defaults: Appearance = {
  theme: "RO3 先锋",
  primary: "#356FE6",
  radius: 10,
  density: "comfortable",
  fontSize: "standard",
  buttonStyle: "filled",
  progress: true,
  languageSwitch: true,
  background: "soft",
};

const themes = [
  ["RO3 先锋", "#356FE6", "soft"],
  ["JoyData 简洁", "#2F73F5", "plain"],
  ["暗夜游戏", "#7C6FF0", "dark"],
  ["活力橙", "#F06E3A", "plain"],
] as const;

const previewLocaleNames: Record<string, string> = {
  简中: "简体中文（源语言）",
  EN: "English",
  繁中: "繁體中文",
  ไทย: "ภาษาไทย",
};

function InlinePreviewContent({ content }: { content: LimitPageContent }) {
  const links = new Map((content.links || []).map((link) => [link.id, link]));
  return content.body.split(/(\{\{[^}]+\}\})/g).map((part, index) => {
    const match = part.match(/^\{\{([^}]+)\}\}$/);
    const link = match ? links.get(match[1]) : undefined;
    return link
      ? <a key={`${link.id}-${index}`} href={link.url || undefined} onClick={(event) => event.preventDefault()}>{link.text || "链接文字"}</a>
      : <span key={`${part}-${index}`}>{part}</span>;
  });
}

export default function AppearancePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const [config, setConfig] = useState<Appearance>(defaults);
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [previewState, setPreviewState] = useState<"form" | "complete" | "limit">("form");
  const [pageIndex, setPageIndex] = useState(0);
  const [previewLocale, setPreviewLocale] = useState("简中");
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [verifiedLocales, setVerifiedLocales] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState("");
  const [publication, setPublication] = useState<Publication | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const saved = window.localStorage.getItem(`joydata-survey-appearance-${surveyId}`);
    if (saved) setConfig({ ...defaults, ...JSON.parse(saved) });
    setQuestions(loadQuestions(surveyId));
    setPublication(loadPublications(surveyId)[0] || null);
    try {
      const savedTranslations = window.localStorage.getItem(`joydata-survey-translations-${surveyId}`);
      const savedVerified = window.localStorage.getItem(`joydata-survey-translation-verified-${surveyId}`);
      if (savedTranslations) setTranslations(JSON.parse(savedTranslations));
      if (savedVerified) setVerifiedLocales(JSON.parse(savedVerified));
    } catch {}
  }, [surveyId]);

  useEffect(() => {
    window.localStorage.setItem(`joydata-survey-appearance-${surveyId}`, JSON.stringify(config));
  }, [config, surveyId]);

  const pages = useMemo(() => {
    const result: Question[][] = [[]];
    questions.forEach((question) => {
      if (question.type === "pageBreak") {
        if (result[result.length - 1].length) result.push([]);
      } else {
        result[result.length - 1].push(question);
      }
    });
    return result.filter((page) => page.length);
  }, [questions]);

  const hasPagination = pages.length > 1;
  const visibleQuestions = hasPagination ? pages[Math.min(pageIndex, pages.length - 1)] : pages.flat();
  const availablePreviewLocales = ["简中", ...Object.keys(verifiedLocales).filter((locale) => verifiedLocales[locale])];
  const previewRuntimeLocale = previewLocale === "EN" ? "en-US" : previewLocale === "繁中" ? "zh-TW" : previewLocale === "ไทย" ? "th-TH" : "zh-CN";
  const limitContent = publication?.limitPageContent?.[previewRuntimeLocale]
    || publication?.limitPageContent?.[publication?.defaultLocale || "zh-CN"]
    || { title: "", body: "当前账号或填写环境已达到提交次数限制。", links: [] };
  const previewLimitContent: LimitPageContent = {
    ...limitContent,
    title: translated("limit:title", limitContent.title),
    body: translated("limit:body", limitContent.body),
    links: (limitContent.links || []).map((link) => ({
      ...link,
      text: translated(`limit:link:${link.id}`, link.text),
    })),
  };

  function translated(fieldId: string, fallback: string, legacyId?: string) {
    if (previewLocale === "简中") return fallback;
    return translations[previewLocale]?.[fieldId] || (legacyId ? translations[previewLocale]?.[legacyId] : "") || fallback;
  }

  function update(patch: Partial<Appearance>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function renderQuestion(question: Question, index: number) {
    if (question.type === "divider") return <div className="appearance-divider" key={question.id} />;
    if (question.type === "description") return <div className="appearance-description" key={question.id}>{translated(`${question.id}:title`, question.title, question.id)}</div>;
    if (question.type === "imageDisplay" || question.type === "carousel") return <div className="appearance-image-block" key={question.id}>▧ {question.type === "carousel" ? "图片轮播" : "图片展示"}</div>;
    return (
      <article className="appearance-question-preview" key={question.id}>
        <small>{question.type === "nps" ? "NPS" : "问题"}</small>
        <h2>{translated(`${question.id}:title`, question.title, question.id)}{question.required && <b>*</b>}</h2>
        {question.description && <p>{translated(`${question.id}:description`, question.description)}</p>}
        {question.helpText && <div className="appearance-question-help">ⓘ {translated(`${question.id}:help`, question.helpText)}</div>}
        {question.referenceImage && <div className="appearance-reference-image">▧ 参考图片</div>}
        {question.options?.slice(0, 5).map((option, optionIndex) => <button key={`${question.id}-${optionIndex}`} className={optionIndex === 0 ? "selected" : ""}><i>{question.type === "multiple" ? "□" : "○"}</i>{translated(`${question.id}:option:${optionIndex}`, option)}</button>)}
        {(question.type === "text" || question.type === "textarea" || question.type === "phone") && <div className="appearance-input">{question.type === "phone" ? "请输入手机号" : "请输入您的回答"}</div>}
        {(question.type === "rating" || question.type === "nps") && <div className="appearance-score-row">{Array.from({ length: Math.min(11, (question.max || 5) - (question.min || 0) + 1) }, (_, score) => <span key={score}>{score + (question.min || 0)}</span>)}</div>}
        {!question.options && !["text", "textarea", "phone", "rating", "nps"].includes(question.type) && <div className="appearance-input">请填写或选择内容</div>}
      </article>
    );
  }

  return (
    <main className="appearance-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title"><span className="survey-doc-icon">▤</span><div><strong>{surveyTitle}</strong><small><i className="saved" />外观设置自动保存</small></div></div>
        <SurveyNav surveyId={surveyId} active="appearance" />
      </header>

      <div className="appearance-layout appearance-layout-simple">
        <aside className="appearance-settings">
          <header><strong>外观设置</strong><small>实时预览完整问卷填写页</small></header>
          <section><h3>主题模板</h3><div className="theme-grid">{themes.map(([name, color, background]) => <button key={name} className={config.theme === name ? "active" : ""} onClick={() => update({ theme: name, primary: color, background })}><i style={{ background: color }} /><span style={{ background: color }} /><strong>{name}</strong><em>{config.theme === name ? "✓" : ""}</em></button>)}</div></section>
          <section><h3>品牌颜色</h3><div className="color-setting"><input type="color" value={config.primary} onChange={(event) => update({ primary: event.target.value })} /><input value={config.primary} onChange={(event) => update({ primary: event.target.value })} /><button onClick={() => update({ primary: "#356FE6" })}>↺</button></div></section>
          <section>
            <h3>内容布局</h3>
            <label className="segmented-setting"><span>内容密度</span><div><button className={config.density === "compact" ? "active" : ""} onClick={() => update({ density: "compact" })}>紧凑</button><button className={config.density === "comfortable" ? "active" : ""} onClick={() => update({ density: "comfortable" })}>舒适</button></div></label>
            <label className="segmented-setting appearance-segment-gap"><span>正文字号</span><div><button className={config.fontSize === "standard" ? "active" : ""} onClick={() => update({ fontSize: "standard" })}>标准</button><button className={config.fontSize === "large" ? "active" : ""} onClick={() => update({ fontSize: "large" })}>大号</button></div></label>
            <label className="segmented-setting appearance-segment-gap"><span>主按钮</span><div><button className={config.buttonStyle === "filled" ? "active" : ""} onClick={() => update({ buttonStyle: "filled" })}>填充</button><button className={config.buttonStyle === "outline" ? "active" : ""} onClick={() => update({ buttonStyle: "outline" })}>描边</button></div></label>
            <label className="range-setting"><span>圆角大小 <em>{config.radius}px</em></span><input type="range" min="0" max="20" value={config.radius} onChange={(event) => update({ radius: Number(event.target.value) })} /></label>
          </section>
          <section><h3>页面组件</h3>{[
            ["语言切换入口", "languageSwitch"],
            ["填写进度条", "progress"],
          ].map(([label, key]) => <div className="appearance-toggle" key={key}><span>{label}</span><button className={`mini-switch ${config[key as keyof Appearance] ? "on" : ""}`} onClick={() => update({ [key]: !config[key as keyof Appearance] })}><i /></button></div>)}</section>
        </aside>

        <section className={`appearance-preview ${config.background}`} style={{ "--theme": config.primary, "--radius": `${config.radius}px` } as React.CSSProperties}>
          <div className="preview-device-toggle">
            <button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}>▱ 桌面端</button>
            <button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}>▯ 移动端</button>
            <div className="appearance-state-preview">
              <button className={previewState === "form" ? "active" : ""} onClick={() => setPreviewState("form")}>填写页</button>
              <button className={previewState === "complete" ? "active" : ""} onClick={() => setPreviewState("complete")}>提交完成页</button>
              <button className={previewState === "limit" ? "active" : ""} onClick={() => setPreviewState("limit")}>限制结果页</button>
            </div>
            <label className="appearance-language-preview"><span>预览语言</span><select value={previewLocale} onChange={(event) => { setPreviewLocale(event.target.value); setPageIndex(0); }}>{availablePreviewLocales.map((locale) => <option key={locale} value={locale}>{previewLocaleNames[locale] || locale}</option>)}</select></label>
          </div>
          <div className={`survey-device ${device} ${config.density} font-${config.fontSize} button-${config.buttonStyle}`}>
            {previewState === "form" ? <div
              className="player-mini-page player-scroll-page"
              onScroll={(event) => {
                const target = event.currentTarget;
                const available = target.scrollHeight - target.clientHeight;
                setScrollProgress(available > 0 ? Math.round(target.scrollTop / available * 100) : 100);
              }}
            >
              {config.languageSwitch && (
                <label className="appearance-player-language">
                  <span>🌐</span>
                  <select value={previewLocale} onChange={(event) => { setPreviewLocale(event.target.value); setPageIndex(0); }}>
                    {availablePreviewLocales.map((locale) => <option key={locale} value={locale}>{previewLocaleNames[locale] || locale}</option>)}
                  </select>
                </label>
              )}
              {config.progress && <div className="mini-progress"><i style={{ width: hasPagination ? `${(pageIndex + 1) / pages.length * 100}%` : `${Math.max(3, scrollProgress)}%` }} /></div>}
              <header><h1>{translated("form:title", surveyTitle)}</h1><p>{translated("form:intro", "感谢您参与本次先锋测试。请向下滚动完成问卷，您的反馈将帮助我们持续优化游戏体验。")}</p></header>
              <main className="appearance-form-content">
                {visibleQuestions.map(renderQuestion)}
                <footer className="appearance-form-footer">
                  <span>{hasPagination ? `第 ${pageIndex + 1} / ${pages.length} 页` : `共 ${visibleQuestions.length} 题`}</span>
                  <div>
                    {hasPagination && pageIndex > 0 && <button className="appearance-back-button" onClick={() => setPageIndex(pageIndex - 1)}>上一页</button>}
                    <button onClick={() => hasPagination && pageIndex < pages.length - 1 ? setPageIndex(pageIndex + 1) : flash("这是提交按钮的预览效果")}>{hasPagination && pageIndex < pages.length - 1 ? "下一页" : "提交问卷"}</button>
                  </div>
                </footer>
              </main>
            </div> : previewState === "complete" ? (
              <div className="appearance-result-preview">
                {config.languageSwitch && <span className="appearance-result-language">🌐 {previewLocaleNames[previewLocale] || previewLocale}</span>}
                <article>
                  <i>✓</i>
                  <h1>{translated("form:completion:title", "提交成功")}</h1>
                  <p>{translated("form:completion", publication?.completionMessage || "感谢您的参与，问卷已成功提交。")}</p>
                </article>
              </div>
            ) : (
              <div className={`appearance-result-preview limit ${publication?.limitPageBackgroundMode === "custom" && publication.limitPageBackground ? "custom" : ""}`} style={publication?.limitPageBackgroundMode === "custom" && publication.limitPageBackground ? { backgroundImage: `url(${publication.limitPageBackground})` } : undefined}>
                {config.languageSwitch && <span className="appearance-result-language">🌐 {previewLocaleNames[previewLocale] || previewLocale}</span>}
                <article>
                  {previewLimitContent.title && <h1>{previewLimitContent.title}</h1>}
                  <p><InlinePreviewContent content={previewLimitContent} /></p>
                  <small>仅在账号、JoyaMaker、IP 或设备限制命中时展示</small>
                </article>
              </div>
            )}
          </div>
        </section>
      </div>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
