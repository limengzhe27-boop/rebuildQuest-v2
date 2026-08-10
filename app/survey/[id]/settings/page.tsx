"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { defaultPublications, EndPageTemplate, LimitPageContent, loadEndPageTemplates, loadPublications, Publication } from "@/lib/survey-publication";
import { loadQuestions, Question } from "@/lib/survey-builder";
import { claimWindowOptions, createEmptyPrize, LotteryClaimTypeSettings, LotteryConfig, lotteryPrizeTypeLabels, LotteryPrize, LotteryPrizeType, remainingStock, settleExpiredLotteryDraws, loadLotteryDraws, saveLotteryDraws } from "@/lib/survey-lottery";
import { LotteryGrid } from "@/components/LotteryGrid";
import { LotteryPrizeEditor } from "@/components/LotteryPrizeEditor";
import { LotteryClaimFieldsSelect } from "@/components/LotteryClaimFieldsSelect";
import { SurveyNav } from "../survey-nav";
import { useSurveyTitle } from "@/lib/use-survey-title";

export default function SurveySettingsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const [publications, setPublications] = useState<Publication[]>(defaultPublications);
  const [section, setSection] = useState<"submission" | "collection">("submission");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [autoSave, setAutoSave] = useState(true);
  const [sourceLanguage, setSourceLanguage] = useState("zh-CN");
  const [backgroundFileName, setBackgroundFileName] = useState("");
  const [endBackgroundSource, setEndBackgroundSource] = useState<"template" | "upload">("template");
  const [closedBackgroundSource, setClosedBackgroundSource] = useState<"template" | "upload">("template");
  const [backgroundTemplateName, setBackgroundTemplateName] = useState("");
  const [closedBackgroundTemplateName, setClosedBackgroundTemplateName] = useState("");
  const [backgroundTemplates, setBackgroundTemplates] = useState<EndPageTemplate[]>([]);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [lotteryDraft, setLotteryDraft] = useState<{ slot: number; prize: LotteryPrize } | null>(null);
  const [lotteryPageTab, setLotteryPageTab] = useState<"spin" | "win" | "lose" | "complete">("spin");
  const limitBodyRef = useRef<HTMLTextAreaElement>(null);
  const closedBodyRef = useRef<HTMLTextAreaElement>(null);
  const winBodyRef = useRef<HTMLTextAreaElement>(null);
  const loseBodyRef = useRef<HTMLTextAreaElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const closedBackgroundInputRef = useRef<HTMLInputElement>(null);
  const lotteryBackgroundInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadedPublications = loadPublications(surveyId);
    const current = loadedPublications[0];
    if (current?.completionMode === "lottery") {
      const settled = settleExpiredLotteryDraws(current.lotteryConfig, loadLotteryDraws(surveyId));
      if (settled.changed) {
        loadedPublications[0] = { ...current, lotteryConfig: settled.config };
        saveLotteryDraws(surveyId, settled.draws);
      }
    }
    setPublications(loadedPublications);
    if (current?.limitPageBackgroundTemplateId === "custom-upload") setEndBackgroundSource("upload");
    if (current?.closedPageBackgroundTemplateId === "custom-upload") setClosedBackgroundSource("upload");
    setQuestions(loadQuestions(surveyId));
    setAutoSave(window.localStorage.getItem(`joydata-survey-autosave-${surveyId}`) !== "false");
    try {
      const drafts = JSON.parse(window.localStorage.getItem("joydata-survey-drafts") || "[]");
      const draft = drafts.find((item: { id?: number | string }) => String(item.id) === String(surveyId));
      if (draft) {
        const draftSource = draft.defaultLanguage || draft.languages?.[0] || "简中";
        setSourceLanguage(
          ["EN", "English", "en-US"].includes(draftSource)
            ? "en-US"
            : ["繁中", "繁體中文", "zh-TW"].includes(draftSource)
              ? "zh-TW"
              : ["ไทย", "th-TH"].includes(draftSource)
                ? "th-TH"
                : "zh-CN",
        );
      }
      setBackgroundTemplates(loadEndPageTemplates());
    } catch {}
    setHydrated(true);
  }, [surveyId]);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(`joydata-survey-publications-${surveyId}`, JSON.stringify(publications));
      window.localStorage.setItem(`joydata-survey-autosave-${surveyId}`, String(autoSave));
      setSaveState("saved");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [publications, autoSave, surveyId, hydrated]);

  const selected = publications[0];
  const sourceLocale = sourceLanguage;

  function updateSelected(patch: Partial<Publication>) {
    setPublications((current) =>
      current.map((item, index) => index === 0 ? { ...item, ...patch } : item),
    );
  }

  function updateLotteryConfig(patch: Partial<LotteryConfig>) {
    updateSelected({ lotteryConfig: { ...selected.lotteryConfig, ...patch } });
  }

  function updateClaimTypeSettings(type: LotteryPrizeType, patch: Partial<LotteryClaimTypeSettings>) {
    updateLotteryConfig({
      claimSettingsByType: {
        ...selected.lotteryConfig.claimSettingsByType,
        [type]: { ...selected.lotteryConfig.claimSettingsByType[type], ...patch },
      },
    });
  }

  function openLotterySlot(slot: number) {
    const existing = selected.lotteryConfig.prizes.find((prize) => prize.slot === slot);
    setLotteryDraft({ slot, prize: existing || createEmptyPrize(slot) });
  }

  function saveLotteryPrize(prize: LotteryPrize) {
    const others = selected.lotteryConfig.prizes.filter((item) => item.slot !== prize.slot);
    updateLotteryConfig({ prizes: [...others, prize] });
    setLotteryDraft(null);
  }

  function deleteLotteryPrize(slot: number) {
    updateLotteryConfig({ prizes: selected.lotteryConfig.prizes.filter((item) => item.slot !== slot) });
    setLotteryDraft(null);
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function currentLimitContent(): LimitPageContent {
    const content = selected.limitPageContent?.[sourceLocale];
    return {
      title: content?.title || "",
      body: content?.body || "",
      links: Array.isArray(content?.links) ? content.links : [],
    };
  }

  function updateLimitContent(patch: Partial<LimitPageContent>) {
    updateSelected({
      limitPageContent: {
        ...selected.limitPageContent,
        [sourceLocale]: {
          ...currentLimitContent(),
          ...patch,
        },
      },
    });
  }

  function insertLimitLink() {
    const content = currentLimitContent();
    const id = `link-${Date.now()}`;
    const token = `{{${id}}}`;
    const start = limitBodyRef.current?.selectionStart ?? content.body.length;
    const end = limitBodyRef.current?.selectionEnd ?? start;
    const body = `${content.body.slice(0, start)}${token}${content.body.slice(end)}`;
    updateLimitContent({
      body,
      links: [...content.links, { id, text: "链接文字", url: "" }],
    });
    window.requestAnimationFrame(() => {
      limitBodyRef.current?.focus();
      limitBodyRef.current?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function updateLimitLink(linkId: string, patch: Partial<LimitPageContent["links"][number]>) {
    const content = currentLimitContent();
    updateLimitContent({
      links: content.links.map((link) => link.id === linkId ? { ...link, ...patch } : link),
    });
  }

  function removeLimitLink(linkId: string) {
    const content = currentLimitContent();
    updateLimitContent({
      body: content.body.replaceAll(`{{${linkId}}}`, ""),
      links: content.links.filter((link) => link.id !== linkId),
    });
  }

  function currentClosedContent(): LimitPageContent {
    const content = selected.closedPageContent?.[sourceLocale];
    return {
      title: content?.title || "",
      body: content?.body || selected.closedMessage || "",
      links: Array.isArray(content?.links) ? content.links : [],
    };
  }

  function updateClosedContent(patch: Partial<LimitPageContent>) {
    updateSelected({
      closedPageContent: {
        ...selected.closedPageContent,
        [sourceLocale]: { ...currentClosedContent(), ...patch },
      },
      ...(patch.body !== undefined ? { closedMessage: patch.body } : {}),
    });
  }

  function insertClosedLink() {
    const content = currentClosedContent();
    const id = `closed-link-${Date.now()}`;
    const token = `{{${id}}}`;
    const start = closedBodyRef.current?.selectionStart ?? content.body.length;
    const end = closedBodyRef.current?.selectionEnd ?? start;
    updateClosedContent({ body: `${content.body.slice(0, start)}${token}${content.body.slice(end)}`, links: [...content.links, { id, text: "链接文字", url: "" }] });
    window.requestAnimationFrame(() => {
      closedBodyRef.current?.focus();
      closedBodyRef.current?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function updateClosedLink(linkId: string, patch: Partial<LimitPageContent["links"][number]>) {
    const content = currentClosedContent();
    updateClosedContent({ links: content.links.map((link) => link.id === linkId ? { ...link, ...patch } : link) });
  }

  function removeClosedLink(linkId: string) {
    const content = currentClosedContent();
    updateClosedContent({ body: content.body.replaceAll(`{{${linkId}}}`, ""), links: content.links.filter((link) => link.id !== linkId) });
  }

  function currentWinContent(): LimitPageContent {
    const content = selected.lotteryConfig.winPage.content?.[sourceLocale];
    return {
      title: content?.title || "",
      body: content?.body || "",
      links: Array.isArray(content?.links) ? content.links : [],
      buttonText: content?.buttonText || "",
    };
  }

  function updateWinContent(patch: Partial<LimitPageContent>) {
    updateLotteryConfig({
      winPage: {
        ...selected.lotteryConfig.winPage,
        content: { ...selected.lotteryConfig.winPage.content, [sourceLocale]: { ...currentWinContent(), ...patch } },
      },
    });
  }

  function insertWinLink() {
    const content = currentWinContent();
    const id = `win-link-${Date.now()}`;
    const token = `{{${id}}}`;
    const start = winBodyRef.current?.selectionStart ?? content.body.length;
    const end = winBodyRef.current?.selectionEnd ?? start;
    updateWinContent({ body: `${content.body.slice(0, start)}${token}${content.body.slice(end)}`, links: [...content.links, { id, text: "链接文字", url: "" }] });
    window.requestAnimationFrame(() => {
      winBodyRef.current?.focus();
      winBodyRef.current?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function updateWinLink(linkId: string, patch: Partial<LimitPageContent["links"][number]>) {
    const content = currentWinContent();
    updateWinContent({ links: content.links.map((link) => link.id === linkId ? { ...link, ...patch } : link) });
  }

  function removeWinLink(linkId: string) {
    const content = currentWinContent();
    updateWinContent({ body: content.body.replaceAll(`{{${linkId}}}`, ""), links: content.links.filter((link) => link.id !== linkId) });
  }

  function currentLoseContent(): LimitPageContent {
    const content = selected.lotteryConfig.losePage.content?.[sourceLocale];
    return {
      title: content?.title || "",
      body: content?.body || "",
      links: Array.isArray(content?.links) ? content.links : [],
      buttonText: content?.buttonText || "",
    };
  }

  function updateLoseContent(patch: Partial<LimitPageContent>) {
    updateLotteryConfig({
      losePage: {
        ...selected.lotteryConfig.losePage,
        content: { ...selected.lotteryConfig.losePage.content, [sourceLocale]: { ...currentLoseContent(), ...patch } },
      },
    });
  }

  function insertLoseLink() {
    const content = currentLoseContent();
    const id = `lose-link-${Date.now()}`;
    const token = `{{${id}}}`;
    const start = loseBodyRef.current?.selectionStart ?? content.body.length;
    const end = loseBodyRef.current?.selectionEnd ?? start;
    updateLoseContent({ body: `${content.body.slice(0, start)}${token}${content.body.slice(end)}`, links: [...content.links, { id, text: "链接文字", url: "" }] });
    window.requestAnimationFrame(() => {
      loseBodyRef.current?.focus();
      loseBodyRef.current?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function updateLoseLink(linkId: string, patch: Partial<LimitPageContent["links"][number]>) {
    const content = currentLoseContent();
    updateLoseContent({ links: content.links.map((link) => link.id === linkId ? { ...link, ...patch } : link) });
  }

  function removeLoseLink(linkId: string) {
    const content = currentLoseContent();
    updateLoseContent({ body: content.body.replaceAll(`{{${linkId}}}`, ""), links: content.links.filter((link) => link.id !== linkId) });
  }

  function uploadLotteryBackground(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      flash("请选择图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      flash("图片不能超过 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateLotteryConfig({ background: String(reader.result || "") });
      flash("抽奖背景已上传");
    };
    reader.readAsDataURL(file);
  }

  function currentSpinContent() {
    const content = selected.lotteryConfig.spinPage.content?.[sourceLocale];
    return { title: content?.title || "", body: content?.body || "", buttonText: content?.buttonText || "" };
  }

  function updateSpinContent(patch: Partial<{ title: string; body: string; buttonText: string }>) {
    updateLotteryConfig({
      spinPage: {
        content: { ...selected.lotteryConfig.spinPage.content, [sourceLocale]: { ...currentSpinContent(), ...patch } },
      },
    });
  }

  function currentCompleteContent() {
    const content = selected.lotteryConfig.completePage.content?.[sourceLocale];
    return { title: content?.title || "", body: content?.body || "", buttonText: content?.buttonText || "" };
  }

  function updateCompleteContent(patch: Partial<{ title: string; body: string; buttonText: string }>) {
    updateLotteryConfig({
      completePage: {
        content: { ...selected.lotteryConfig.completePage.content, [sourceLocale]: { ...currentCompleteContent(), ...patch } },
      },
    });
  }

  function uploadLimitBackground(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      flash("请选择图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      flash("图片不能超过 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateSelected({ limitPageBackgroundMode: "custom", limitPageBackgroundTemplateId: "custom-upload", limitPageBackground: String(reader.result || "") });
      setBackgroundFileName(file.name);
      flash("背景图片已上传");
    };
    reader.readAsDataURL(file);
  }

  function uploadClosedBackground(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      flash("请选择图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      flash("图片不能超过 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateSelected({ closedPageBackgroundMode: "custom", closedPageBackgroundTemplateId: "custom-upload", closedPageBackground: String(reader.result || "") });
      flash("停止收集页背景已上传");
    };
    reader.readAsDataURL(file);
  }

  function renderInlineLimitText(content: LimitPageContent) {
    const links = new Map(content.links.map((link) => [link.id, link]));
    return content.body.split(/(\{\{[^}]+\}\})/g).map((part, index) => {
      const match = part.match(/^\{\{([^}]+)\}\}$/);
      const link = match ? links.get(match[1]) : undefined;
      return link
        ? <a key={`${link.id}-${index}`} href={link.url || undefined} onClick={(event) => event.preventDefault()}>{link.text || "链接文字"}</a>
        : <span key={`${part}-${index}`}>{part}</span>;
    });
  }

  function applyBackgroundTemplate(templateId: string) {
    if (templateId === "project-default") {
      updateSelected({ limitPageBackgroundMode: "common", limitPageBackgroundTemplateId: templateId, limitPageBackground: "" });
      return;
    }
    const template = backgroundTemplates.find((item) => item.id === templateId);
    if (template) {
      updateSelected({ limitPageBackgroundMode: "custom", limitPageBackgroundTemplateId: template.id, limitPageBackground: template.image, ...(template.content ? { limitPageContent: { ...selected.limitPageContent, [sourceLocale]: template.content } } : {}) });
      setBackgroundFileName(template.name);
    }
  }

  function saveBackgroundAsTemplate() {
    const name = backgroundTemplateName.trim();
    if (!name) {
      flash("请填写模板名称");
      return;
    }
    const template: EndPageTemplate = { id: `end-page-${Date.now()}`, name, image: selected.limitPageBackground, content: currentLimitContent(), pageType: "limit" };
    const next = [...backgroundTemplates, template];
    setBackgroundTemplates(next);
    window.localStorage.setItem("joydata-survey-end-background-templates", JSON.stringify(next));
    updateSelected({ limitPageBackgroundMode: "custom", limitPageBackgroundTemplateId: template.id });
    setBackgroundTemplateName("");
    flash("问卷结束页已保存为模板");
  }

  function applyClosedBackgroundTemplate(templateId: string) {
    if (templateId === "project-default") {
      updateSelected({ closedPageBackgroundMode: "common", closedPageBackgroundTemplateId: templateId, closedPageBackground: "" });
      return;
    }
    const template = backgroundTemplates.find((item) => item.id === templateId);
    if (template) updateSelected({ closedPageBackgroundMode: "custom", closedPageBackgroundTemplateId: template.id, closedPageBackground: template.image, ...(template.content ? { closedPageContent: { ...selected.closedPageContent, [sourceLocale]: template.content } } : {}) });
  }

  function saveClosedBackgroundAsTemplate() {
    const name = closedBackgroundTemplateName.trim();
    if (!name) {
      flash("请填写模板名称");
      return;
    }
    const template: EndPageTemplate = { id: `closed-page-${Date.now()}`, name, image: selected.closedPageBackground, content: currentClosedContent(), pageType: "closed" };
    const next = [...backgroundTemplates, template];
    setBackgroundTemplates(next);
    window.localStorage.setItem("joydata-survey-end-background-templates", JSON.stringify(next));
    updateSelected({ closedPageBackgroundMode: "custom", closedPageBackgroundTemplateId: template.id });
    setClosedBackgroundTemplateName("");
    flash("停止收集页已保存为模板");
  }

  function addRedirectRule() {
    const question = questions.find((item) => !["divider", "description", "imageDisplay", "carousel", "pageBreak"].includes(item.type));
    if (!question) {
      flash("请先在编辑器中添加可作判断的题目");
      return;
    }
    updateSelected({
      redirectRules: [...selected.redirectRules, {
        id: `redirect-${Date.now()}`,
        questionId: question.id,
        operator: "等于",
        value: "",
        url: "",
      }],
    });
  }

  function updateRedirectRule(ruleId: string, patch: Partial<Publication["redirectRules"][number]>) {
    updateSelected({
      redirectRules: selected.redirectRules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...patch } : rule,
      ),
    });
  }

  if (!selected) return null;

  function renderEndPageEditor() {
    const content = currentLimitContent();
    const activeTemplate = selected.limitPageBackgroundMode === "common"
      ? "project-default"
      : selected.limitPageBackgroundTemplateId || "custom-upload";
    return (
      <section className="config-card limit-result-config end-page-config">
        <header>
          <div><strong>问卷结束页</strong><small>提交完成和达到重复填写限制时共用</small></div>
          <span className="auto-stop-tag active">统一结果页</span>
        </header>
        <div className="limit-result-layout">
          <div className="limit-result-fields">
            <div className="background-source-control">
              <span>背景</span>
              <div className="background-source-choice">
                <button type="button" className={endBackgroundSource === "template" ? "active" : ""} onClick={() => { setEndBackgroundSource("template"); if (activeTemplate === "custom-upload") applyBackgroundTemplate("project-default"); }}>使用模板</button>
                <button type="button" className={endBackgroundSource === "upload" ? "active" : ""} onClick={() => setEndBackgroundSource("upload")}>自定义上传</button>
              </div>
            </div>
            {endBackgroundSource === "template" ? <label className="background-choice-panel"><span>选择完整页面模板</span><select value={activeTemplate === "custom-upload" ? "project-default" : activeTemplate} onChange={(event) => applyBackgroundTemplate(event.target.value)}><option value="project-default">项目默认结束页</option>{backgroundTemplates.filter((template) => (template.pageType || "limit") === "limit").map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select><small>模板会同时应用页面文案、链接与背景，并自动适配移动端。</small></label> : <div className="limit-background-upload"><input ref={backgroundInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(event) => uploadLimitBackground(event.target.files?.[0])} /><button type="button" onClick={() => backgroundInputRef.current?.click()}>▧ 上传桌面端幕布</button><div><strong>{backgroundFileName || (selected.limitPageBackground ? "已上传自定义幕布" : "暂未上传幕布")}</strong><small>桌面端建议 1920 × 1080 px（16:9）；移动端使用模板自适应布局，无需另传图片</small></div>{selected.limitPageBackground && <button className="text-danger" type="button" onClick={() => { updateSelected({ limitPageBackgroundMode: "common", limitPageBackgroundTemplateId: "project-default", limitPageBackground: "" }); setBackgroundFileName(""); setEndBackgroundSource("template"); }}>取消自定义</button>}</div>}
            <label><span>标题（选填）</span><input value={content.title} onChange={(event) => updateLimitContent({ title: event.target.value })} placeholder="例如：感谢您完成本次问卷" /></label>
            <label>
              <span>说明正文</span>
              <textarea ref={limitBodyRef} value={content.body} onChange={(event) => updateLimitContent({ body: event.target.value })} />
              <small>提交完成和触发重复填写限制时使用同一版正文；系统会在页面底部展示对应状态。</small>
            </label>
            <button className="insert-inline-link" type="button" onClick={insertLimitLink}>＋ 在正文光标处插入链接</button>
            {content.links.length > 0 && (
              <div className="limit-inline-links">
                {content.links.map((link, index) => (
                  <div key={link.id}>
                    <span>链接 {index + 1}</span>
                    <input value={link.text} onChange={(event) => updateLimitLink(link.id, { text: event.target.value })} placeholder="链接文字" />
                    <input value={link.url} onChange={(event) => updateLimitLink(link.id, { url: event.target.value })} placeholder="https://" />
                    <button type="button" onClick={() => removeLimitLink(link.id)} aria-label={`删除链接 ${index + 1}`}>×</button>
                  </div>
                ))}
              </div>
            )}
            {endBackgroundSource === "upload" && (
              <div className="save-background-template">
                <input value={backgroundTemplateName} onChange={(event) => setBackgroundTemplateName(event.target.value)} placeholder="输入模板名称" />
                <button type="button" onClick={saveBackgroundAsTemplate}>保存为模板</button>
              </div>
            )}
          </div>
          <div className={`limit-result-preview ${selected.limitPageBackgroundMode === "custom" && selected.limitPageBackground ? "custom" : ""}`} style={selected.limitPageBackgroundMode === "custom" && selected.limitPageBackground ? { backgroundImage: `url(${selected.limitPageBackground})` } : undefined}>
            <article>{content.title && <h3>{content.title}</h3>}<p>{renderInlineLimitText(content)}</p><small>提交成功／达到重复填写限制</small></article>
          </div>
        </div>
      </section>
    );
  }

  function renderClosedPageEditor() {
    const content = currentClosedContent();
    const activeTemplate = selected.closedPageBackgroundMode === "common"
      ? "project-default"
      : selected.closedPageBackgroundTemplateId || "custom-upload";
    return (
      <section className="config-card limit-result-config end-page-config">
        <header><div><strong>停止收集后页面</strong><small>手动结束、定时结束、达到数量上限或不在允许访问时段时展示</small></div><span className="auto-stop-tag active">独立页面</span></header>
        <div className="limit-result-layout">
          <div className="limit-result-fields">
            <div className="background-source-control"><span>背景</span><div className="background-source-choice"><button type="button" className={closedBackgroundSource === "template" ? "active" : ""} onClick={() => { setClosedBackgroundSource("template"); if (activeTemplate === "custom-upload") applyClosedBackgroundTemplate("project-default"); }}>使用模板</button><button type="button" className={closedBackgroundSource === "upload" ? "active" : ""} onClick={() => setClosedBackgroundSource("upload")}>自定义上传</button></div></div>
            {closedBackgroundSource === "template" ? <label className="background-choice-panel"><span>选择完整页面模板</span><select value={activeTemplate === "custom-upload" ? "project-default" : activeTemplate} onChange={(event) => applyClosedBackgroundTemplate(event.target.value)}><option value="project-default">项目默认结束页</option>{backgroundTemplates.filter((template) => template.pageType === "closed").map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select><small>模板会同时应用页面文案、链接与背景，并自动适配移动端。</small></label> : <div className="limit-background-upload"><input ref={closedBackgroundInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(event) => uploadClosedBackground(event.target.files?.[0])} /><button type="button" onClick={() => closedBackgroundInputRef.current?.click()}>▧ 上传桌面端幕布</button><div><strong>{selected.closedPageBackground ? "已上传自定义幕布" : "暂未上传幕布"}</strong><small>桌面端建议 1920 × 1080 px（16:9）；移动端使用模板自适应布局，无需另传图片</small></div>{selected.closedPageBackground && <button className="text-danger" type="button" onClick={() => { updateSelected({ closedPageBackgroundMode: "common", closedPageBackgroundTemplateId: "project-default", closedPageBackground: "" }); setClosedBackgroundSource("template"); }}>取消自定义</button>}</div>}
            <label><span>标题（选填）</span><input value={content.title} onChange={(event) => updateClosedContent({ title: event.target.value })} placeholder="例如：本次问卷收集已结束" /></label>
            <label><span>说明正文</span><textarea ref={closedBodyRef} value={content.body} onChange={(event) => updateClosedContent({ body: event.target.value })} /><small>将光标放在正文任意位置，可插入多个链接。</small></label>
            <button className="insert-inline-link" type="button" onClick={insertClosedLink}>＋ 在正文光标处插入链接</button>
            {content.links.length > 0 && <div className="limit-inline-links">{content.links.map((link, index) => <div key={link.id}><span>链接 {index + 1}</span><input value={link.text} onChange={(event) => updateClosedLink(link.id, { text: event.target.value })} placeholder="链接文字" /><input value={link.url} onChange={(event) => updateClosedLink(link.id, { url: event.target.value })} placeholder="https://" /><button type="button" onClick={() => removeClosedLink(link.id)} aria-label={`删除链接 ${index + 1}`}>×</button></div>)}</div>}
            {closedBackgroundSource === "upload" && (
              <div className="save-background-template">
                <input value={closedBackgroundTemplateName} onChange={(event) => setClosedBackgroundTemplateName(event.target.value)} placeholder="输入模板名称" />
                <button type="button" onClick={saveClosedBackgroundAsTemplate}>保存为模板</button>
              </div>
            )}
          </div>
          <div className={`limit-result-preview ${selected.closedPageBackgroundMode === "custom" && selected.closedPageBackground ? "custom" : ""}`} style={selected.closedPageBackgroundMode === "custom" && selected.closedPageBackground ? { backgroundImage: `url(${selected.closedPageBackground})` } : undefined}>
            <article>{content.title && <h3>{content.title}</h3>}<p>{renderInlineLimitText(content)}</p><small>停止收集／尚未开始／当前时段不可访问</small></article>
          </div>
        </div>
      </section>
    );
  }

  function renderLotteryPageCopyTab() {
    if (lotteryPageTab === "spin") {
      const content = currentSpinContent();
      return (
        <div className="lottery-page-copy-fields">
          <label><span>标题</span><input value={content.title} onChange={(event) => updateSpinContent({ title: event.target.value })} placeholder="例如：抽奖进行中…" /></label>
          <label><span>正文</span><textarea value={content.body} onChange={(event) => updateSpinContent({ body: event.target.value })} /></label>
          <label><span>按钮文字</span><input value={content.buttonText} onChange={(event) => updateSpinContent({ buttonText: event.target.value })} placeholder="例如：立即抽奖" /></label>
        </div>
      );
    }
    if (lotteryPageTab === "complete") {
      const content = currentCompleteContent();
      return (
        <div className="lottery-page-copy-fields">
          <label><span>标题</span><input value={content.title} onChange={(event) => updateCompleteContent({ title: event.target.value })} placeholder="例如：抽奖已完成" /></label>
          <label><span>正文</span><textarea value={content.body} onChange={(event) => updateCompleteContent({ body: event.target.value })} /></label>
          <label><span>按钮文字</span><input value={content.buttonText} onChange={(event) => updateCompleteContent({ buttonText: event.target.value })} placeholder="例如：完成" /></label>
        </div>
      );
    }
    if (lotteryPageTab === "win") {
      const content = currentWinContent();
      return (
        <div className="lottery-page-copy-fields">
          <label><span>标题</span><input value={content.title} onChange={(event) => updateWinContent({ title: event.target.value })} placeholder="例如：🎉 恭喜中奖！" /></label>
          <label><span>正文</span><textarea ref={winBodyRef} value={content.body} onChange={(event) => updateWinContent({ body: event.target.value })} /><small>将光标放在正文任意位置，可插入多个链接。</small></label>
          <button className="insert-inline-link" type="button" onClick={insertWinLink}>＋ 在正文光标处插入链接</button>
          {content.links.length > 0 && <div className="limit-inline-links">{content.links.map((link, index) => <div key={link.id}><span>链接 {index + 1}</span><input value={link.text} onChange={(event) => updateWinLink(link.id, { text: event.target.value })} placeholder="链接文字" /><input value={link.url} onChange={(event) => updateWinLink(link.id, { url: event.target.value })} placeholder="https://" /><button type="button" onClick={() => removeWinLink(link.id)} aria-label={`删除链接 ${index + 1}`}>×</button></div>)}</div>}
          <label><span>按钮文字</span><input value={content.buttonText} onChange={(event) => updateWinContent({ buttonText: event.target.value })} placeholder="例如：好的" /></label>
        </div>
      );
    }
    const content = currentLoseContent();
    return (
      <div className="lottery-page-copy-fields">
        <label><span>标题</span><input value={content.title} onChange={(event) => updateLoseContent({ title: event.target.value })} placeholder="例如：感谢参与" /></label>
        <label><span>正文</span><textarea ref={loseBodyRef} value={content.body} onChange={(event) => updateLoseContent({ body: event.target.value })} /><small>将光标放在正文任意位置，可插入多个链接。</small></label>
        <button className="insert-inline-link" type="button" onClick={insertLoseLink}>＋ 在正文光标处插入链接</button>
        {content.links.length > 0 && <div className="limit-inline-links">{content.links.map((link, index) => <div key={link.id}><span>链接 {index + 1}</span><input value={link.text} onChange={(event) => updateLoseLink(link.id, { text: event.target.value })} placeholder="链接文字" /><input value={link.url} onChange={(event) => updateLoseLink(link.id, { url: event.target.value })} placeholder="https://" /><button type="button" onClick={() => removeLoseLink(link.id)} aria-label={`删除链接 ${index + 1}`}>×</button></div>)}</div>}
        <label><span>按钮文字</span><input value={content.buttonText} onChange={(event) => updateLoseContent({ buttonText: event.target.value })} placeholder="例如：好的" /></label>
      </div>
    );
  }

  function renderLotteryEditor() {
    const lottery = selected.lotteryConfig;
    const activeLotteryPrizeTypes = (["virtual", "physical", "code"] as LotteryPrizeType[])
      .filter((type) => lottery.prizes.some((prize) => prize.type === type));
    return (
      <>
        <section className="config-card">
          <header><div><strong>奖品池</strong><small>九宫格奖品配置，鼠标悬停格子可添加或编辑奖品</small></div></header>
          <LotteryGrid
            renderCell={(slot) => {
              const prize = lottery.prizes.find((item) => item.slot === slot);
              return (
                <button type="button" className={`lottery-cell-button ${prize ? "filled" : "empty"}`} onClick={() => openLotterySlot(slot)}>
                  {prize ? (
                    <>
                      <span className="lottery-cell-image">{prize.image ? <img src={prize.image} alt="" /> : "🎁"}</span>
                      <strong>{prize.name || "未命名奖品"}</strong>
                      <small>数量：{remainingStock(prize)}</small>
                    </>
                  ) : (
                    <>
                      <span className="lottery-cell-thanks">谢谢参与</span>
                      <em className="lottery-cell-add">＋ 添加奖品</em>
                    </>
                  )}
                </button>
              );
            }}
          />
        </section>

        <section className="config-card">
          <header><div><strong>抽奖规则</strong><small>用户抽中任意奖品的概率；中奖后系统根据奖品池剩余库存随机分配奖品，库存越多概率越高</small></div></header>
          <label className="large-config-field lottery-win-rate">
            <span>中奖概率</span>
            <div className="lottery-win-rate-input"><input type="number" min={0} max={100} value={lottery.winRate} onChange={(event) => updateLotteryConfig({ winRate: Math.min(100, Math.max(0, Number(event.target.value))) })} /><span>%</span></div>
          </label>
          <small>系统默认每账号只能抽奖一次，且不允许重复中奖，无需额外配置。</small>
        </section>

        <section className="config-card">
          <header><div><strong>领奖设置</strong><small>用于用户领奖咨询</small></div></header>

          {activeLotteryPrizeTypes.length ? (
            <div className="lottery-claim-type-list">
              {activeLotteryPrizeTypes.map((type) => {
                const typeSettings = lottery.claimSettingsByType[type];
                return (
                  <div className="lottery-claim-type-block" key={type}>
                    <h4>{lotteryPrizeTypeLabels[type]}</h4>
                    <label className="large-config-field">
                      <span>请选择用户填写的信息</span>
                      <LotteryClaimFieldsSelect
                        value={typeSettings.claimFields}
                        onChange={(claimFields) => updateClaimTypeSettings(type, { claimFields })}
                      />
                    </label>
                    <div className="lottery-identity-toggle">
                      <span>生成随机身份码</span>
                      <button
                        type="button"
                        className={`mini-switch ${typeSettings.identityCodeEnabled ? "on" : ""}`}
                        onClick={() => updateClaimTypeSettings(type, { identityCodeEnabled: !typeSettings.identityCodeEnabled })}
                      ><i /></button>
                    </div>
                    <small>开启后，中奖用户将获得一个领奖身份码，用于客服核验。</small>

                    <label className="large-config-field">
                      <span>领奖时间限制</span>
                      <select
                        value={typeSettings.claimWindowMinutes}
                        onChange={(event) => updateClaimTypeSettings(type, { claimWindowMinutes: Number(event.target.value) })}
                      >
                        {claimWindowOptions.map((option) => <option key={option.minutes} value={option.minutes}>{option.label}</option>)}
                      </select>
                    </label>
                    <small>中奖用户须在此时限内完成领奖信息填写，超时后奖品库存自动释放，可再次被抽中。</small>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="config-empty-state"><span>🎁</span><p><strong>暂无可配置的领奖信息</strong><small>请先在奖品池中添加奖品，再回来配置对应类型需要用户填写的领奖信息。</small></p></div>
          )}
        </section>

        <section className="config-card">
          <header><div><strong>背景设置</strong><small>用于抽奖页面的背景展示</small></div></header>
          <div className="lottery-image-upload lottery-background-upload">
            <input ref={lotteryBackgroundInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(event) => uploadLotteryBackground(event.target.files?.[0])} />
            {lottery.background ? (
              <>
                <img src={lottery.background} alt="" />
                <div>
                  <button type="button" onClick={() => lotteryBackgroundInputRef.current?.click()}>更换图片</button>
                  <button type="button" className="text-danger" onClick={() => updateLotteryConfig({ background: "" })}>删除图片</button>
                </div>
              </>
            ) : (
              <div className="lottery-image-upload-empty">
                <button type="button" onClick={() => lotteryBackgroundInputRef.current?.click()}>上传图片</button>
                <small>支持 JPG / PNG，最大 5MB</small>
              </div>
            )}
          </div>
        </section>

        <section className="config-card">
          <header><div><strong>页面文案设置</strong><small>统一管理抽奖流程中各页面的标题、正文与按钮文字</small></div></header>
          <div className="publish-section-tabs lottery-page-copy-tabs">
            <button className={lotteryPageTab === "spin" ? "active" : ""} onClick={() => setLotteryPageTab("spin")}>抽奖页面</button>
            <button className={lotteryPageTab === "win" ? "active" : ""} onClick={() => setLotteryPageTab("win")}>中奖页面</button>
            <button className={lotteryPageTab === "lose" ? "active" : ""} onClick={() => setLotteryPageTab("lose")}>未中奖页面</button>
            <button className={lotteryPageTab === "complete" ? "active" : ""} onClick={() => setLotteryPageTab("complete")}>抽奖完成页面</button>
          </div>
          {renderLotteryPageCopyTab()}
        </section>
      </>
    );
  }


  function renderIdentityValidation() {
    return (
      <section className="config-card identity-validation-card">
        <header><div><strong>登录身份一致性校验</strong><small>校验不一致时，选择玩家下一步操作</small></div><button className={`mini-switch ${selected.identityValidationEnabled ? "on" : ""}`} onClick={() => updateSelected({ identityValidationEnabled: !selected.identityValidationEnabled, joymakerLogin: true })}><i /></button></header>
        {selected.identityValidationEnabled && <div className="identity-fallback-setting"><label><span>校验不一致时</span><select value={selected.identityMismatchAction || "login"} onChange={(event) => updateSelected({ identityMismatchAction: event.target.value as "login" | "official" })}><option value="login">前往登录后答题</option><option value="official">跳转对应语言官网</option></select></label>{selected.identityMismatchAction === "official" && <label><span>备用官网语言</span><select value={selected.identityMismatchFallbackLocale || selected.defaultLocale} onChange={(event) => updateSelected({ identityMismatchFallbackLocale: event.target.value })}><option value="zh-CN">简体中文</option><option value="en-US">English</option><option value="zh-TW">繁體中文</option><option value="th-TH">ไทย</option></select></label>}</div>}
      </section>
    );
  }

  return (
    <main className="publish-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title">
          <span className="survey-doc-icon">▤</span>
          <div><strong>{surveyTitle}</strong><small><i className="saved" />设置自动保存</small></div>
        </div>
        <SurveyNav surveyId={surveyId} active="settings" />
      </header>

      <div className="settings-workspace">
        <section className="settings-main">
          <header className="settings-heading settings-heading-compact">
            <div>
              <h1>问卷设置</h1>
              <p>管理归档信息、提交反馈、回收时间与防重复规则</p>
            </div>
            <div className="settings-heading-summary">
              <span><i className={saveState === "saved" ? "saved" : ""} />{saveState === "saved" ? "已自动保存" : "保存中…"}</span>
              <span className={`region-pill ${selected.region}`}>{selected.region === "global" ? "海外工作区 · GLOBAL" : "国内工作区 · CHINA"}</span>
            </div>
          </header>

          <div className="publish-section-tabs settings-tabs">
            <button className={section === "submission" ? "active" : ""} onClick={() => setSection("submission")}>提交设置</button>
            <button className={section === "collection" ? "active" : ""} onClick={() => setSection("collection")}>回收设置</button>
          </div>

          {section === "submission" ? (
            <div className="publish-config-stack">
              <section className="config-card">
                <header><div><strong>提交成功后</strong><small>选择进入统一的问卷结束页、跳转到指定网页，或进入抽奖页面</small></div></header>
                <div className="completion-mode">
                  <button className={selected.completionMode === "message" ? "active" : ""} onClick={() => updateSelected({ completionMode: "message" })}>✓ 显示完成页</button>
                  <button className={selected.completionMode === "redirect" ? "active" : ""} onClick={() => updateSelected({ completionMode: "redirect" })}>↗ 跳转指定网页</button>
                  <button className={selected.completionMode === "lottery" ? "active" : ""} onClick={() => updateSelected({ completionMode: "lottery" })}>🎁 进入抽奖页面</button>
                </div>
                {selected.completionMode === "redirect" && (
                  <label className="large-config-field"><span>跳转地址</span><input placeholder="https://" value={selected.redirectUrl} onChange={(event) => updateSelected({ redirectUrl: event.target.value })} /></label>
                )}
              </section>

              {selected.completionMode === "lottery" ? (
                renderLotteryEditor()
              ) : (
                <>
                  {renderEndPageEditor()}

                  <section className="config-card">
                    <header>
                      <div><strong>按答案跳转</strong><small>满足条件时跳转到指定页面；没有命中时使用默认提交结果</small></div>
                      <button className="config-add-button" onClick={addRedirectRule}>＋ 添加规则</button>
                    </header>
                    {selected.redirectRules.length ? (
                      <div className="redirect-rule-list">
                        {selected.redirectRules.map((rule) => (
                          <article key={rule.id}>
                            <span>当</span>
                            <select value={rule.questionId} onChange={(event) => updateRedirectRule(rule.id, { questionId: event.target.value })}>
                              {questions.map((question, index) => <option key={question.id} value={question.id}>{index + 1}. {question.title}</option>)}
                            </select>
                            <select value={rule.operator} onChange={(event) => updateRedirectRule(rule.id, { operator: event.target.value as typeof rule.operator })}>
                              <option>等于</option><option>不等于</option><option>包含</option><option>不包含</option>
                            </select>
                            <input placeholder="答案或选项" value={rule.value} onChange={(event) => updateRedirectRule(rule.id, { value: event.target.value })} />
                            <span>跳转至</span>
                            <input className="redirect-url-input" placeholder="https://" value={rule.url} onChange={(event) => updateRedirectRule(rule.id, { url: event.target.value })} />
                            <button aria-label="删除跳转规则" onClick={() => updateSelected({ redirectRules: selected.redirectRules.filter((item) => item.id !== rule.id) })}>×</button>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="config-empty-state"><span>↗</span><p><strong>暂无条件跳转</strong><small>适合按满意度、玩家类型等答案进入不同感谢页或招募页。</small></p></div>
                    )}
                  </section>
                </>
              )}

            </div>
          ) : (
            <div className="publish-config-stack">
              <section className="config-card">
                <header><div><strong>填写数据</strong><small>控制填写过程中的暂存、预填和登录方式</small></div></header>
                <div className="setting-switch-list">
                  <div><p><strong>填写时自动暂存数据</strong><small>玩家中途关闭后，再次打开可以继续填写</small></p><button className={`mini-switch ${autoSave ? "on" : ""}`} onClick={() => setAutoSave(!autoSave)}><i /></button></div>
                  <div><p><strong>填充上次填写数据</strong><small>同一账号再次填写时，预填上一次已提交的答案</small></p><button className={`mini-switch ${selected.prefillLastSubmission ? "on" : ""}`} onClick={() => updateSelected({ prefillLastSubmission: !selected.prefillLastSubmission })}><i /></button></div>
                  <div className="setting-with-input"><p><strong>密码填写</strong><small>玩家输入统一密码后才能进入问卷</small></p><input disabled={selected.accessGate !== "password"} value={selected.accessPassword} onChange={(event) => updateSelected({ accessPassword: event.target.value })} placeholder="设置访问密码" /><button className={`mini-switch ${selected.accessGate === "password" ? "on" : ""}`} onClick={() => updateSelected({ accessGate: selected.accessGate === "password" ? "open" : "password" })}><i /></button></div>
                  <div><p><strong>JoyaMaker 登录填写</strong><small>使用 JoyaMaker / JoyID 识别玩家账号</small></p><button className={`mini-switch ${selected.joymakerLogin ? "on" : ""}`} onClick={() => updateSelected({ joymakerLogin: !selected.joymakerLogin })}><i /></button></div>
                  {selected.region === "global" && <div><p><strong>LINE 登录填写</strong><small>适用于已接入 LINE 的海外发行渠道</small></p><button className={`mini-switch ${selected.lineLogin ? "on" : ""}`} onClick={() => updateSelected({ lineLogin: !selected.lineLogin })}><i /></button></div>}
                  <div><p><strong>记录登录用户基础信息</strong><small>记录账号标识、地区和已授权的基础属性</small></p><button className={`mini-switch ${selected.captureUserProfile ? "on" : ""}`} onClick={() => updateSelected({ captureUserProfile: !selected.captureUserProfile })}><i /></button></div>
                </div>
              </section>

              <section className="config-card">
                <header><div><strong>答卷数量上限</strong><small>有效答卷达到设定数量后自动结束收集</small></div></header>
                <div className="collection-condition-list">
                  <article>
                    <div className="condition-icon">▤</div>
                    <p><strong>设定答题次数上限</strong><small>有效答卷达到数量上限后自动结束</small></p>
                    <div className="condition-number"><input type="number" disabled={!selected.quotaEnabled} value={selected.totalLimit} onChange={(event) => updateSelected({ totalLimit: Number(event.target.value) })} /><span>份</span></div>
                    <button className={`mini-switch ${selected.quotaEnabled ? "on" : ""}`} onClick={() => updateSelected({ quotaEnabled: !selected.quotaEnabled })}><i /></button>
                  </article>
                </div>
              </section>

              <section className="config-card availability-card">
                <header><div><strong>允许填写时间</strong><small>设置问卷开放的日期范围，以及每天允许访问的时间段</small></div></header>
                <div className="availability-setting-row">
                  <div className="condition-icon">◷</div>
                  <p><strong>开放日期范围</strong><small>开始时间前不可填写，结束时间后自动停止收集</small></p>
                  <div className="availability-date-range">
                    <input type="datetime-local" disabled={!selected.scheduleEnabled} value={selected.startAt} onChange={(event) => updateSelected({ startAt: event.target.value })} aria-label="允许填写开始时间" />
                    <span>至</span>
                    <input type="datetime-local" disabled={!selected.scheduleEnabled} value={selected.endAt} onChange={(event) => updateSelected({ endAt: event.target.value })} aria-label="允许填写结束时间" />
                  </div>
                  <button className={`mini-switch ${selected.scheduleEnabled ? "on" : ""}`} onClick={() => updateSelected({ scheduleEnabled: !selected.scheduleEnabled })}><i /></button>
                </div>
                <div className="availability-setting-row">
                  <div className="condition-icon">◴</div>
                  <p><strong>每天可填写时段</strong><small>例如每天 10:00—22:00，时段外暂时不可访问</small></p>
                  <div className="availability-time-range">
                    <input type="time" disabled={!selected.dailyWindowEnabled} value={selected.dailyStartTime} onChange={(event) => updateSelected({ dailyStartTime: event.target.value })} aria-label="每天允许填写开始时间" />
                    <span>至</span>
                    <input type="time" disabled={!selected.dailyWindowEnabled} value={selected.dailyEndTime} onChange={(event) => updateSelected({ dailyEndTime: event.target.value })} aria-label="每天允许填写结束时间" />
                  </div>
                  <button className={`mini-switch ${selected.dailyWindowEnabled ? "on" : ""}`} onClick={() => updateSelected({ dailyWindowEnabled: !selected.dailyWindowEnabled })}><i /></button>
                </div>
              </section>

              {renderClosedPageEditor()}

              <section className="config-card">
                <header><div><strong>答题限制</strong><small>按用户、IP 或设备分别设置最多可成功提交的次数</small></div></header>
                <div className="setting-switch-list">
                  <div className="setting-with-input"><p><strong>每个 JoyaMaker / JoyID 用户最多提交</strong><small>需要登录后按用户唯一标识统计</small></p><div className="submission-limit-input"><input disabled={!selected.accountLimitEnabled} type="number" min={1} value={selected.perAccountLimit} onChange={(event) => updateSelected({ perAccountLimit: Math.max(1, Number(event.target.value)) })} /><span>次</span></div><button className={`mini-switch ${selected.accountLimitEnabled ? "on" : ""}`} onClick={() => updateSelected({ accountLimitEnabled: !selected.accountLimitEnabled, joymakerUniqueSubmission: false, joymakerLogin: true })}><i /></button></div>
                  <div className="setting-with-input"><p><strong>每个 LINE 用户最多提交</strong><small>需要开启 LINE 登录，按 LINE 用户唯一标识统计</small></p><div className="submission-limit-input"><input disabled={!selected.lineLimitEnabled} type="number" min={1} value={selected.perLineLimit} onChange={(event) => updateSelected({ perLineLimit: Math.max(1, Number(event.target.value)) })} /><span>次</span></div><button className={`mini-switch ${selected.lineLimitEnabled ? "on" : ""}`} onClick={() => updateSelected({ lineLimitEnabled: !selected.lineLimitEnabled, lineLogin: true })}><i /></button></div>
                  <div className="setting-with-input"><p><strong>每个 IP / 设备最多提交</strong><small>同时校验网络地址与匿名设备标识，任一达到上限即限制提交</small></p><div className="submission-limit-input"><input disabled={!(selected.ipLimit || selected.deviceLimit)} type="number" min={1} value={selected.perIpLimit} onChange={(event) => updateSelected({ perIpLimit: Math.max(1, Number(event.target.value)), perDeviceLimit: Math.max(1, Number(event.target.value)) })} /><span>次</span></div><button className={`mini-switch ${(selected.ipLimit || selected.deviceLimit) ? "on" : ""}`} onClick={() => updateSelected({ ipLimit: !(selected.ipLimit || selected.deviceLimit), deviceLimit: !(selected.ipLimit || selected.deviceLimit), perDeviceLimit: selected.perIpLimit })}><i /></button></div>
                </div>
              </section>

              {renderIdentityValidation()}

            </div>
          )}
        </section>
      </div>

      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
      {lotteryDraft && (
        <LotteryPrizeEditor
          prize={lotteryDraft.prize}
          onCancel={() => setLotteryDraft(null)}
          onSave={saveLotteryPrize}
          onDelete={selected.lotteryConfig.prizes.some((item) => item.slot === lotteryDraft.slot) ? () => deleteLotteryPrize(lotteryDraft.slot) : undefined}
        />
      )}
    </main>
  );
}
