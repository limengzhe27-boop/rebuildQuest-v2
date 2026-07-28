"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { defaultQuestions, loadQuestions, Question, questionLabels } from "@/lib/survey-builder";
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
  contentWidth: "narrow" | "standard" | "wide";
  pageMode: "continuous" | "one-question";
  headerImage: string;
  headerImageMobile: string;
  curtainImage: string;
  curtainImageMobile: string;
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
  contentWidth: "standard",
  pageMode: "continuous",
  headerImage: "",
  headerImageMobile: "",
  curtainImage: "",
  curtainImageMobile: "",
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
  const [previewState, setPreviewState] = useState<"form" | "complete" | "closed" | "limit">("form");
  const [pageIndex, setPageIndex] = useState(0);
  const [previewLocale, setPreviewLocale] = useState("简中");
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [verifiedLocales, setVerifiedLocales] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState("");
  const [publication, setPublication] = useState<Publication | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const headerImageInputRef = useRef<HTMLInputElement>(null);
  const headerMobileInputRef = useRef<HTMLInputElement>(null);
  const curtainImageInputRef = useRef<HTMLInputElement>(null);
  const curtainMobileInputRef = useRef<HTMLInputElement>(null);

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
    if (config.pageMode === "one-question") {
      return questions.filter((question) => question.type !== "pageBreak").map((question) => [question]);
    }
    const result: Question[][] = [[]];
    questions.forEach((question) => {
      if (question.type === "pageBreak") {
        if (result[result.length - 1].length) result.push([]);
      } else {
        result[result.length - 1].push(question);
      }
    });
    return result.filter((page) => page.length);
  }, [config.pageMode, questions]);

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

  function uploadAppearanceImage(field: "headerImage" | "headerImageMobile" | "curtainImage" | "curtainImageMobile", file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      flash("请选择不超过 5MB 的图片");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update({ [field]: String(reader.result || "") });
    reader.readAsDataURL(file);
  }

  function renderQuestion(question: Question, index: number) {
    if (question.type === "divider") return <div className="appearance-divider" key={question.id} />;
    if (question.type === "description") return <div className="appearance-description" key={question.id}>{translated(`${question.id}:title`, question.title, question.id)}</div>;
    if (question.type === "imageDisplay" || question.type === "carousel") return <div className="appearance-image-block" key={question.id}>▧ {question.type === "carousel" ? "图片轮播" : "图片展示"}</div>;
    const options = question.options || [];
    const rows = question.matrixRows?.length ? question.matrixRows : ["行 1", "行 2", "行 3"];
    const columns = question.matrixColumns?.length ? question.matrixColumns : options.length ? options : ["选项 1", "选项 2", "选项 3"];
    const isMatrix = ["matrix", "matrixFill", "matrixSelect", "matrixScale", "matrixSlider", "matrixDropdown"].includes(question.type);
    const choicePreview = ["single", "multiple", "image", "tableSelect"].includes(question.type);
    let inputPreview: React.ReactNode = null;

    if (isMatrix) {
      inputPreview = <div className="appearance-matrix-preview">
        <div className="appearance-matrix-head"><span>题目/选项</span>{columns.slice(0, 4).map((column) => <span key={column}>{column}</span>)}</div>
        {rows.slice(0, 4).map((row) => <div className="appearance-matrix-row" key={row}><strong>{row}</strong>{columns.slice(0, 4).map((column) => <i key={column}>{question.type === "matrixFill" ? "—" : question.type === "matrixDropdown" ? "请选择⌄" : "○"}</i>)}</div>)}
      </div>;
    } else if (choicePreview) {
      inputPreview = options.slice(0, 5).map((option, optionIndex) => <button key={`${question.id}-${optionIndex}`} className={optionIndex === 0 ? "selected" : ""}><i>{question.type === "multiple" ? "□" : "○"}</i>{translated(`${question.id}:option:${optionIndex}`, option)}</button>);
    } else if (question.type === "dropdown" || question.type === "cascade" || question.type === "appointmentSlot") {
      inputPreview = <div className="appearance-select-preview">请选择 <span>⌄</span></div>;
    } else if (question.type === "sort") {
      inputPreview = <div className="appearance-sort-preview">{options.slice(0, 4).map((option, optionIndex) => <span key={option}><b>{optionIndex + 1}</b>{option}<i>⠿</i></span>)}</div>;
    } else if (question.type === "rating" || question.type === "nps") {
      inputPreview = <div className="appearance-score-row">{Array.from({ length: Math.min(11, (question.max ?? 5) - (question.min ?? 0) + 1) }, (_, score) => <span key={score}>{score + (question.min ?? 0)}</span>)}</div>;
    } else if (["file", "imageUpload", "ocr"].includes(question.type)) {
      inputPreview = <div className="appearance-upload-preview">＋ {question.type === "file" ? "选择文件" : "上传图片"}</div>;
    } else if (["date", "appointmentDate"].includes(question.type)) {
      inputPreview = <div className="appearance-select-preview">请选择日期 <span>▣</span></div>;
    } else if (["provinceCity", "globalProvinceCity", "city"].includes(question.type)) {
      inputPreview = <div className="appearance-region-preview"><span>请选择地区⌄</span><span>请选择城市⌄</span></div>;
    } else {
      inputPreview = <div className="appearance-input">{question.type === "phone" ? "请输入手机号" : ["text", "textarea"].includes(question.type) ? "请输入您的回答" : "请填写或选择内容"}</div>;
    }
    return (
      <article className="appearance-question-preview" key={question.id}>
        <small>{questionLabels[question.type]}</small>
        <h2>{translated(`${question.id}:title`, question.title, question.id)}{question.required && <b>*</b>}</h2>
        {question.description && <p>{translated(`${question.id}:description`, question.description)}</p>}
        {question.type === "multiple" && <div className="appearance-selection-rule">{question.maxSelections ? `最多选择 ${question.maxSelections} 项` : "可选择多个选项"}</div>}
        {question.helpText && <div className="appearance-question-help">ⓘ {translated(`${question.id}:help`, question.helpText)}</div>}
        {question.referenceImage && <div className="appearance-reference-image"><img src={question.referenceImage} alt="题目参考图" /></div>}
        {inputPreview}
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
            <div className="appearance-control-list">
              <label><span><strong>内容宽度</strong><small>控制桌面端问卷主体宽度</small></span><div><button className={config.contentWidth === "narrow" ? "active" : ""} onClick={() => update({ contentWidth: "narrow" })}>窄</button><button className={config.contentWidth === "standard" ? "active" : ""} onClick={() => update({ contentWidth: "standard" })}>标准</button><button className={config.contentWidth === "wide" ? "active" : ""} onClick={() => update({ contentWidth: "wide" })}>宽</button></div></label>
              <label><span><strong>题目间距</strong><small>调整连续题目之间的留白</small></span><div><button className={config.density === "compact" ? "active" : ""} onClick={() => update({ density: "compact" })}>紧凑</button><button className={config.density === "comfortable" ? "active" : ""} onClick={() => update({ density: "comfortable" })}>舒适</button></div></label>
              <label><span><strong>正文字号</strong><small>影响题目、说明和选项文字</small></span><div><button className={config.fontSize === "standard" ? "active" : ""} onClick={() => update({ fontSize: "standard" })}>标准</button><button className={config.fontSize === "large" ? "active" : ""} onClick={() => update({ fontSize: "large" })}>大号</button></div></label>
              <label><span><strong>主按钮样式</strong><small>用于下一页和提交问卷按钮</small></span><div><button className={config.buttonStyle === "filled" ? "active" : ""} onClick={() => update({ buttonStyle: "filled" })}>填充</button><button className={config.buttonStyle === "outline" ? "active" : ""} onClick={() => update({ buttonStyle: "outline" })}>描边</button></div></label>
            </div>
            <label className="range-setting"><span>圆角大小 <em>{config.radius}px</em></span><input type="range" min="0" max="20" value={config.radius} onChange={(event) => update({ radius: Number(event.target.value) })} /></label>
          </section>
          <section>
            <h3>图片与幕布</h3>
            <div className="appearance-image-settings">
              <input ref={headerImageInputRef} type="file" accept="image/*" hidden onChange={(event) => uploadAppearanceImage("headerImage", event.target.files?.[0])} />
              <article><div><strong>问卷头图 · 桌面端</strong><small>默认图片，移动端未单独设置时也使用此图</small></div><button onClick={() => headerImageInputRef.current?.click()}>{config.headerImage ? "更换" : "上传"}</button>{config.headerImage && <button className="remove" onClick={() => update({ headerImage: "" })}>移除</button>}</article>
              <input ref={headerMobileInputRef} type="file" accept="image/*" hidden onChange={(event) => uploadAppearanceImage("headerImageMobile", event.target.files?.[0])} />
              <article><div><strong>问卷头图 · 移动端</strong><small>选填，建议使用竖版或较窄构图</small></div><button onClick={() => headerMobileInputRef.current?.click()}>{config.headerImageMobile ? "更换" : "上传"}</button>{config.headerImageMobile && <button className="remove" onClick={() => update({ headerImageMobile: "" })}>移除</button>}</article>
              <input ref={curtainImageInputRef} type="file" accept="image/*" hidden onChange={(event) => uploadAppearanceImage("curtainImage", event.target.files?.[0])} />
              <article><div><strong>幕布背景 · 桌面端</strong><small>默认背景，问卷白色内容层会透出幕布</small></div><button onClick={() => curtainImageInputRef.current?.click()}>{config.curtainImage ? "更换" : "上传"}</button>{config.curtainImage && <button className="remove" onClick={() => update({ curtainImage: "" })}>移除</button>}</article>
              <input ref={curtainMobileInputRef} type="file" accept="image/*" hidden onChange={(event) => uploadAppearanceImage("curtainImageMobile", event.target.files?.[0])} />
              <article><div><strong>幕布背景 · 移动端</strong><small>选填，未上传时自动沿用桌面端背景</small></div><button onClick={() => curtainMobileInputRef.current?.click()}>{config.curtainImageMobile ? "更换" : "上传"}</button>{config.curtainImageMobile && <button className="remove" onClick={() => update({ curtainImageMobile: "" })}>移除</button>}</article>
            </div>
          </section>
          <section>
            <h3>填写页组件</h3>
            <div className="appearance-option-row">
              <div><strong>语言切换入口</strong><small>显示在问卷内容顶部，玩家下滑后会随页面离开视野。</small></div>
              <button className={`mini-switch ${config.languageSwitch ? "on" : ""}`} onClick={() => update({ languageSwitch: !config.languageSwitch })}><i /></button>
            </div>
            <div className="appearance-option-row">
              <div><strong>当前位置进度条</strong><small>固定在填写区顶部，表示当前浏览到的题目位置，不代表已完成比例。</small></div>
              <button className={`mini-switch ${config.progress ? "on" : ""}`} onClick={() => update({ progress: !config.progress })}><i /></button>
            </div>
          </section>
        </aside>

        <section className={`appearance-preview ${config.background} ${(device === "mobile" ? config.curtainImageMobile || config.curtainImage : config.curtainImage) ? "has-curtain" : ""}`} style={{ "--theme": config.primary, "--radius": `${config.radius}px`, ...((device === "mobile" ? config.curtainImageMobile || config.curtainImage : config.curtainImage) ? { backgroundImage: `url(${device === "mobile" ? config.curtainImageMobile || config.curtainImage : config.curtainImage})` } : {}) } as React.CSSProperties}>
          <div className="preview-device-toggle">
            <button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}>▱ 桌面端</button>
            <button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}>▯ 移动端</button>
            <span className="appearance-mode-summary">分页：{config.pageMode === "one-question" ? "一页一题" : hasPagination ? "按分页组件" : "连续滚动"}</span>
            <div className="appearance-state-preview">
              <button className={previewState === "form" ? "active" : ""} onClick={() => setPreviewState("form")}>填写页</button>
              <button className={previewState === "complete" ? "active" : ""} onClick={() => setPreviewState("complete")}>提交完成页</button>
              <button className={previewState === "closed" ? "active" : ""} onClick={() => setPreviewState("closed")}>停止收集页</button>
              <button className={previewState === "limit" ? "active" : ""} onClick={() => setPreviewState("limit")}>限制结果页</button>
            </div>
            <label className="appearance-language-preview"><span>预览语言</span><select value={previewLocale} onChange={(event) => { setPreviewLocale(event.target.value); setPageIndex(0); }}>{availablePreviewLocales.map((locale) => <option key={locale} value={locale}>{previewLocaleNames[locale] || locale}</option>)}</select></label>
          </div>
          <div className={`survey-device ${device} ${config.density} font-${config.fontSize} button-${config.buttonStyle} width-${config.contentWidth}`}>
            {previewState === "form" ? <div
              className="player-mini-page player-scroll-page"
              onScroll={(event) => {
                const target = event.currentTarget;
                const available = target.scrollHeight - target.clientHeight;
                setScrollProgress(available > 0 ? Math.round(target.scrollTop / available * 100) : 100);
              }}
            >
              {config.progress && <div className="mini-progress"><i style={{ width: hasPagination ? `${(pageIndex + 1) / pages.length * 100}%` : `${Math.max(3, scrollProgress)}%` }} /></div>}
              {config.languageSwitch && (
                <label className="appearance-player-language">
                  <span>🌐</span>
                  <select value={previewLocale} onChange={(event) => { setPreviewLocale(event.target.value); setPageIndex(0); }}>
                    {availablePreviewLocales.map((locale) => <option key={locale} value={locale}>{previewLocaleNames[locale] || locale}</option>)}
                  </select>
                </label>
              )}
              <header>{(device === "mobile" ? config.headerImageMobile || config.headerImage : config.headerImage) && <img className="appearance-header-image" src={device === "mobile" ? config.headerImageMobile || config.headerImage : config.headerImage} alt="" />}<h1>{translated("form:title", surveyTitle)}</h1><p>{translated("form:intro", "感谢您参与本次先锋测试。请向下滚动完成问卷，您的反馈将帮助我们持续优化游戏体验。")}</p></header>
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
                  {publication?.completionImage && <img className="appearance-completion-image" src={publication.completionImage} alt="" />}
                  <i>✓</i>
                  <h1>{translated("form:completion:title", "提交成功")}</h1>
                  <p>{translated("form:completion", publication?.completionMessage || "感谢您的参与，问卷已成功提交。")}</p>
                </article>
              </div>
            ) : previewState === "closed" ? (
              <div className="appearance-result-preview closed">
                {config.languageSwitch && <span className="appearance-result-language">🌐 {previewLocaleNames[previewLocale] || previewLocale}</span>}
                <article>
                  {publication?.closedImage && <img className="appearance-completion-image" src={publication.closedImage} alt="" />}
                  <i>■</i>
                  <h1>{translated("form:closed:title", "本次问卷收集已结束")}</h1>
                  <p>{translated("form:closed", publication?.closedMessage || "本次问卷收集已结束，感谢您的关注。")}</p>
                  <small>手动结束、定时结束、达到数量上限或当前不在允许访问时段时展示</small>
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
