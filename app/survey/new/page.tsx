"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Region = "海外" | "国内";
type CreationMode = "blank" | "template";

const steps = [
  { number: 1, title: "基础信息", caption: "名称与项目" },
  { number: 2, title: "区域空间", caption: "数据与合规" },
  { number: 3, title: "问卷语言", caption: "默认与可选" },
  { number: 4, title: "创建方式", caption: "空白或复用" },
];

const globalLanguages = [
  { code: "简中", name: "简体中文", hint: "简体中文" },
  { code: "EN", name: "English", hint: "英语" },
  { code: "繁中", name: "繁體中文", hint: "繁体中文" },
  { code: "ไทย", name: "ภาษาไทย", hint: "泰语" },
  { code: "한국어", name: "한국어", hint: "韩语" },
  { code: "日本語", name: "日本語", hint: "日语" },
  { code: "ID", name: "Bahasa Indonesia", hint: "印尼语" },
];

type TemplatePreset = {
  name: string;
  label: string;
  languages: string[];
  region: Region;
  category: string;
  categories?: string[];
  sourceSurveyId?: string;
  mode?: "blank" | "full";
  schema?: unknown[];
};

const templatePresets: Record<string, TemplatePreset> = {
  "game-beta": { name: "游戏测试体验调研（副本）", label: "游戏测试体验调研", languages: ["EN", "繁中", "ไทย"], region: "海外", category: "版本测试" },
  update: { name: "版本更新满意度（副本）", label: "版本更新满意度", languages: ["EN", "繁中"], region: "海外", category: "版本测试" },
  nps: { name: "玩家 NPS 追踪（副本）", label: "玩家 NPS 追踪", languages: ["EN", "繁中", "ไทย"], region: "海外", category: "满意度" },
  churn: { name: "流失玩家召回调研（副本）", label: "流失玩家召回调研", languages: ["EN", "繁中"], region: "海外", category: "用户洞察" },
  event: { name: "国内运营活动复盘（副本）", label: "国内运营活动复盘", languages: ["简中"], region: "国内", category: "运营活动" },
  "cn-satisfaction": { name: "国内玩家满意度（副本）", label: "国内玩家满意度", languages: ["简中"], region: "国内", category: "满意度" },
  "cn-update": { name: "国服版本更新反馈（副本）", label: "国服版本更新反馈", languages: ["简中"], region: "国内", category: "版本测试" },
  community: { name: "社区玩家画像（副本）", label: "社区玩家画像", languages: ["EN", "日本語", "한국어"], region: "海外", category: "用户洞察" },
  support: { name: "客服满意度回访（副本）", label: "客服满意度回访", languages: ["EN", "繁中", "ไทย"], region: "海外", category: "服务体验" },
};

const defaultTemplateCategories = ["全部分类", "版本测试", "满意度", "用户洞察", "运营活动", "服务体验", "招募筛选", "其他"];

export default function NewSurveyPage() {
  return <Suspense fallback={<main className="wizard-page" />}><NewSurveyWizard /></Suspense>;
}

function NewSurveyWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTemplateId = searchParams.get("template") || "";
  const initialTemplate = templatePresets[requestedTemplateId];
  const requestedRegion: Region = searchParams.get("region") === "china" ? "国内" : "海外";
  const initialProject = searchParams.get("project") || "RO3";
  const initialGroup = searchParams.get("group") || "3.6版本先锋测试";
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialTemplate?.name || "");
  const [game, setGame] = useState(initialProject);
  const [projectGroup, setProjectGroup] = useState(initialGroup);
  const [region, setRegion] = useState<Region>(initialTemplate?.region || requestedRegion);
  const [languages, setLanguages] = useState(initialTemplate?.languages || ["简中"]);
  const [defaultLanguage, setDefaultLanguage] = useState(initialTemplate?.languages[0] || "简中");
  const [mode, setMode] = useState<CreationMode>(initialTemplate ? "template" : "blank");
  const [selectedTemplateId, setSelectedTemplateId] = useState(requestedTemplateId);
  const [templateCategory, setTemplateCategory] = useState("全部分类");
  const [templateQuery, setTemplateQuery] = useState("");
  const [availableTemplateCategories, setAvailableTemplateCategories] = useState(defaultTemplateCategories);
  const [customTemplates, setCustomTemplates] = useState<Record<string, TemplatePreset>>({});
  const [internalNote, setInternalNote] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const allTemplates = useMemo(() => ({ ...templatePresets, ...customTemplates }), [customTemplates]);
  const template = allTemplates[selectedTemplateId];

  const availableLanguages = useMemo(
    () =>
      region === "国内"
        ? [{ code: "简中", name: "简体中文", hint: "简体中文" }]
        : globalLanguages,
    [region],
  );

  const availableTemplates = useMemo(
    () => Object.entries(allTemplates).filter(([, item]) =>
      item.region === region && (
        templateCategory === "全部分类"
        || item.category === templateCategory
        || item.categories?.includes(templateCategory)
      ) && `${item.label}${item.category}${item.categories?.join("") || ""}`.toLowerCase().includes(templateQuery.trim().toLowerCase()),
    ),
    [allTemplates, region, templateCategory, templateQuery],
  );

  useEffect(() => {
    try {
      const savedCategories = JSON.parse(window.localStorage.getItem("joydata-template-categories") || "[]");
      if (savedCategories.length) {
        setAvailableTemplateCategories(Array.from(new Set([...defaultTemplateCategories, ...savedCategories])));
      }
      const savedTemplates = JSON.parse(window.localStorage.getItem("joydata-survey-templates") || "[]");
      setCustomTemplates(Object.fromEntries(savedTemplates.map((item: TemplatePreset & { id: string }) => [item.id, item])));
      const requestedCustom = savedTemplates.find((item: TemplatePreset & { id: string }) => item.id === requestedTemplateId);
      if (requestedCustom) {
        setMode("template");
        setName(requestedCustom.name);
        setRegion(requestedCustom.region);
        setLanguages(requestedCustom.languages);
        setDefaultLanguage(requestedCustom.languages[0]);
      }
    } catch {}

    if (initialTemplate) return;
    const uiLocale = (
      window.localStorage.getItem("joydata-ui-language")
      || document.documentElement.lang
      || window.navigator.language
      || "zh-CN"
    ).toLowerCase();
    const matched = uiLocale.startsWith("zh-tw") || uiLocale.startsWith("zh-hk") ? "繁中"
      : uiLocale.startsWith("zh") ? "简中"
      : uiLocale.startsWith("th") ? "ไทย"
      : uiLocale.startsWith("ko") ? "한국어"
      : uiLocale.startsWith("ja") ? "日本語"
      : uiLocale.startsWith("id") ? "ID"
      : "EN";
    const currentLanguage = region === "国内" ? "简中" : matched;
    setLanguages([currentLanguage]);
    setDefaultLanguage(currentLanguage);
  }, []);

  function chooseRegion(next: Region) {
    if (template && template.region !== next) {
      setError(`「${template.label}」属于${template.region}工作空间，不能用于${next}工作空间`);
      return;
    }
    setRegion(next);
    setError("");
    if (next === "国内") {
      setLanguages(["简中"]);
      setDefaultLanguage("简中");
    } else {
      const uiLocale = window.navigator.language.toLowerCase();
      const currentLanguage = uiLocale.startsWith("zh") ? "简中" : "EN";
      setLanguages([currentLanguage]);
      setDefaultLanguage(currentLanguage);
    }
    setSelectedTemplateId("");
    setMode("blank");
  }

  function toggleLanguage(code: string) {
    setLanguages((current) => {
      if (current.includes(code)) {
        if (current.length === 1) return current;
        const next = current.filter((item) => item !== code);
        if (defaultLanguage === code) setDefaultLanguage(next[0]);
        return next;
      }
      return [...current, code];
    });
  }

  function nextStep() {
    if (step === 1 && (!name.trim() || !projectGroup.trim())) {
      setError(!name.trim() ? "请填写问卷名称" : "请填写或选择项目分组");
      return;
    }
    setError("");
    setStep((current) => Math.min(4, current + 1));
  }

  function chooseTemplate(id: string) {
    const selected = allTemplates[id];
    if (!selected) return;
    setSelectedTemplateId(id);
    setMode("template");
    setLanguages(selected.languages);
    setDefaultLanguage(selected.languages[0]);
    setError("");
  }

  function createSurvey() {
    if (mode === "template" && !template) {
      setError("请选择一个模板后再创建问卷");
      return;
    }
    const draft = {
      id: Date.now(),
      name: name.trim(),
      group: projectGroup.trim(),
      game: game.replace(" 东南亚服", "").replace(" 国服", ""),
      region,
      languages,
      status: "草稿",
      responses: 0,
      updated: "刚刚",
      owner: "李孟哲",
      defaultLanguage,
      fallbackLanguage: defaultLanguage,
      creationMode: mode,
      templateId: mode === "template" ? selectedTemplateId : undefined,
      note: internalNote.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };
    const key = "joydata-survey-drafts";
    try {
      const existing = JSON.parse(window.localStorage.getItem(key) || "[]");
      window.localStorage.setItem(key, JSON.stringify([draft, ...existing]));
    } catch {
      window.localStorage.setItem(key, JSON.stringify([draft]));
    }
    if (mode === "template") {
      if (template?.schema?.length) {
        window.localStorage.setItem(`joydata-survey-schema-${draft.id}`, JSON.stringify(template.schema));
      } else if (template?.sourceSurveyId) {
        const sourceSchema = window.localStorage.getItem(`joydata-survey-schema-${template.sourceSurveyId}`);
        if (sourceSchema) window.localStorage.setItem(`joydata-survey-schema-${draft.id}`, sourceSchema);
      }
    }
    router.push(`/survey/${draft.id}/edit`);
  }

  return (
    <main className="wizard-page">
      <header className="wizard-topbar">
        <button className="wizard-brand" onClick={() => router.push("/")}>
          <span>✦</span>
          <strong>欢乐互娱</strong>
          <em>JOY DATA</em>
        </button>
        <div className="wizard-context">
          <span>用研中心</span>
          <i>/</i>
          <strong>创建问卷</strong>
        </div>
        <button className="wizard-close" onClick={() => router.push("/")}>
          ×
        </button>
      </header>

      <section className="wizard-shell">
        <aside className="wizard-progress">
          <div className="wizard-progress-heading">
            <small>NEW SURVEY</small>
            <h1>创建问卷</h1>
            <p>完成基础设置后进入问卷编辑器。</p>
          </div>
          <div className="wizard-step-list">
            {steps.map((item) => (
              <button
                key={item.number}
                className={`${step === item.number ? "active" : ""} ${step > item.number ? "done" : ""}`}
                onClick={() => item.number < step && setStep(item.number)}
              >
                <span>{step > item.number ? "✓" : item.number}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.caption}</small>
                </div>
              </button>
            ))}
          </div>
          <div className="wizard-assurance">
            <span>✓</span>
              <p><strong>创建后自动保存</strong><br />完成创建进入编辑器后，所有修改自动保存。</p>
          </div>
        </aside>

        <section className="wizard-card">
          <div className="wizard-card-body">
            {step === 1 && (
              <div className="wizard-panel">
                <div className="wizard-panel-title">
                  <span>01</span>
                  <div>
                    <h2>填写基础信息</h2>
                    <p>名称与描述用于问卷展示；项目、分组和内部备注用于后台管理。</p>
                  </div>
                </div>
                <div className="wizard-fields">
                  <label className="wizard-field full">
                    <span>问卷名称 <b>*</b></span>
                    <input
                      autoFocus
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setError("");
                      }}
                      placeholder="例如：RO3 先锋测试玩家体验调研"
                    />
                    <small>建议包含游戏、场景和时间，便于后续查找。</small>
                  </label>
                  <label className="wizard-field full">
                    <span>问卷描述</span>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="选填：向玩家说明本次问卷的目的、预计耗时或填写须知。"
                    />
                    <small>会展示在问卷封面，可在“设置 → 基本信息”中继续修改。</small>
                  </label>
                  <label className="wizard-field">
                    <span>所属项目 <b>*</b></span>
                    <select value={game} onChange={(event) => setGame(event.target.value)}>
                      <option>RO3</option>
                      <option>ROOC</option>
                      <option>HMT</option>
                      <option>RO国服</option>
                      <option>通用</option>
                    </select>
                    <small>项目用于区分游戏业务；非游戏问卷请选择“通用”。</small>
                  </label>
                  <label className="wizard-field">
                    <span>项目分组 <b>*</b></span>
                    <input
                      value={projectGroup}
                      onChange={(event) => { setProjectGroup(event.target.value); setError(""); }}
                      list="research-projects"
                      placeholder="例如：3.6版本先锋测试"
                    />
                    <datalist id="research-projects">
                      <option value="3.6版本先锋测试" />
                      <option value="2026 Q3 VIP满意度" />
                      <option value="1.8职业平衡调研" />
                    </datalist>
                    <small>可选择该项目下的已有分组；输入新名称并创建问卷，即会在当前项目下新建分组。</small>
                  </label>
                  <label className="wizard-field full">
                    <span>内部备注</span>
                    <textarea
                      value={internalNote}
                      onChange={(event) => setInternalNote(event.target.value)}
                      placeholder="选填：记录调研背景、目标玩家或负责人信息。"
                    />
                    <small>创建后可在“设置 → 基本信息”中查看和修改，仅后台成员可见。</small>
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="wizard-panel">
                <div className="wizard-panel-title">
                  <span>02</span>
                  <div>
                    <h2>选择区域工作空间</h2>
                    <p>区域决定数据存储、访问域名和合规规则，创建后不可直接修改。</p>
                  </div>
                </div>
                <div className="region-choice-grid">
                  <button
                    className={`${region === "海外" ? "selected" : ""} ${template?.region === "国内" ? "disabled" : ""}`}
                    disabled={template?.region === "国内"}
                    onClick={() => chooseRegion("海外")}
                  >
                    <span className="region-choice-icon global">◎</span>
                    <i>{region === "海外" ? "✓" : ""}</i>
                    <strong>海外工作空间</strong>
                    <em>GLOBAL</em>
                    <p>面向海外玩家，支持多语言、海外登录与区域化隐私政策。</p>
                    <ul>
                      <li>海外数据存储</li>
                      <li>多语言问卷与人工校验</li>
                      <li>JM / Line 登录</li>
                    </ul>
                  </button>
                  <button
                    className={`${region === "国内" ? "selected china" : ""} ${template?.region === "海外" ? "disabled" : ""}`}
                    disabled={template?.region === "海外"}
                    onClick={() => chooseRegion("国内")}
                  >
                    <span className="region-choice-icon china">中</span>
                    <i>{region === "国内" ? "✓" : ""}</i>
                    <strong>国内工作空间</strong>
                    <em>CHINA</em>
                    <p>面向国内玩家，使用国内数据存储和本地合规规则。</p>
                    <ul>
                      <li>国内数据存储</li>
                      <li>简体中文默认</li>
                      <li>国内隐私声明</li>
                    </ul>
                  </button>
                </div>
                {template && (
                  <div className="region-warning">
                    <span>i</span>
                    <p>当前模板属于{template.region}工作空间，因此本次创建的工作空间已锁定。</p>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="wizard-panel">
                <div className="wizard-panel-title">
                  <span>03</span>
                  <div>
                    <h2>配置问卷语言</h2>
                    <p>已默认选择当前 JoyData 界面语言，可继续添加玩家需要的其他语言。</p>
                  </div>
                </div>
                <div className="language-config-list">
                  {availableLanguages.map((language) => {
                    const selected = languages.includes(language.code);
                    return (
                      <button
                        key={language.code}
                        className={selected ? "selected" : ""}
                        onClick={() => toggleLanguage(language.code)}
                      >
                        <span className="language-check">{selected ? "✓" : ""}</span>
                        <div>
                          <strong>{language.name}</strong>
                          <small>{language.hint}</small>
                        </div>
                        {defaultLanguage === language.code && <em className="language-fallback-tag">兜底语言</em>}
                      </button>
                    );
                  })}
                </div>
                <div className="language-rule-card">
                  <span>译</span>
                  <div>
                    <strong>用户语言未匹配时展示</strong>
                    <p>当用户的系统语言不在上述已选语言中，统一展示这里选择的语言。</p>
                  </div>
                  <select value={defaultLanguage} onChange={(event) => setDefaultLanguage(event.target.value)}>
                    {languages.map((language) => <option key={language} value={language}>{language}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="wizard-panel">
                <div className="wizard-panel-title">
                  <span>04</span>
                  <div>
                    <h2>选择创建方式</h2>
                    <p>创建后会生成一份草稿，并进入对应的编辑流程。</p>
                  </div>
                </div>
                <div className="creation-mode-list">
                  <button
                    className={mode === "blank" ? "selected" : ""}
                    onClick={() => setMode("blank")}
                  >
                    <span>＋</span>
                    <div><strong>创建空白问卷</strong><p>从题型库开始搭建，适合新的调研场景。</p></div>
                    <i>{mode === "blank" ? "✓" : ""}</i>
                  </button>
                  <button
                    className={mode === "template" ? "selected" : ""}
                    onClick={() => setMode("template")}
                  >
                    <span>▦</span>
                    <div><strong>从模板创建</strong><p>{template ? `已选「${template.label}」` : "在下方选择同工作区的模板。"}</p></div>
                    <i>{mode === "template" ? "✓" : ""}</i>
                  </button>
                </div>
                {mode === "template" && (
                  <section className="wizard-template-picker">
                    <header>
                      <div><strong>选择模板</strong><small>仅展示{region}工作区模板</small></div>
                      <div className="wizard-template-filters">
                        <label><span>⌕</span><input value={templateQuery} onChange={(event) => setTemplateQuery(event.target.value)} placeholder="搜索模板名称" /></label>
                        <select value={templateCategory} onChange={(event) => setTemplateCategory(event.target.value)}>
                          {availableTemplateCategories.map((category) => <option key={category}>{category}</option>)}
                        </select>
                      </div>
                    </header>
                    <div>
                      {availableTemplates.map(([id, item]) => (
                        <button
                          key={id}
                          className={selectedTemplateId === id ? "selected" : ""}
                          onClick={() => chooseTemplate(id)}
                        >
                          <span>▦</span>
                          <p><strong>{item.label}</strong><small>{(item.categories?.length ? item.categories : [item.category]).join(" / ")} · {item.languages.join(" / ")}</small></p>
                          <i>{selectedTemplateId === id ? "✓" : ""}</i>
                        </button>
                      ))}
                    </div>
                    {!availableTemplates.length && <p className="wizard-template-empty">当前分类暂无可用模板。</p>}
                  </section>
                )}
                <div className="creation-summary">
                  <h3>创建信息确认</h3>
                  <div><span>问卷名称</span><strong>{name}</strong></div>
                  <div><span>所属项目</span><strong>{game}</strong></div>
                  <div><span>项目分组</span><strong>{projectGroup}</strong></div>
                  {description.trim() && <div><span>问卷描述</span><strong>{description.trim()}</strong></div>}
                  {template && <div><span>使用模板</span><strong>{template.label}</strong></div>}
                  <div><span>工作空间</span><strong>{region}</strong></div>
                  <div><span>问卷语言</span><strong>{languages.join("、")}</strong></div>
                  <div><span>未匹配时展示</span><strong>{defaultLanguage}</strong></div>
                  {internalNote.trim() && <div><span>内部备注</span><strong>{internalNote.trim()}</strong></div>}
                </div>
              </div>
            )}
          </div>

          <footer className="wizard-footer">
            <div>{error && <span className="wizard-error">! {error}</span>}</div>
            <div>
              <button className="secondary-button" onClick={() => step === 1 ? router.push("/") : setStep(step - 1)}>
                {step === 1 ? "取消" : "上一步"}
              </button>
              {step < 4 ? (
                <button className="primary-button" onClick={nextStep}>下一步 →</button>
              ) : (
                <button className="primary-button" onClick={createSurvey}>创建问卷草稿</button>
              )}
            </div>
          </footer>
        </section>
      </section>
    </main>
  );
}
