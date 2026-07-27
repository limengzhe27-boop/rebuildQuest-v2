"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Region = "海外" | "国内";
type CreationMode = "blank" | "template" | "copy";

const steps = [
  { number: 1, title: "基础信息", caption: "名称与项目" },
  { number: 2, title: "区域空间", caption: "数据与合规" },
  { number: 3, title: "问卷语言", caption: "默认与可选" },
  { number: 4, title: "创建方式", caption: "空白或复用" },
];

const globalLanguages = [
  { code: "EN", name: "English", hint: "英语" },
  { code: "繁中", name: "繁體中文", hint: "繁体中文" },
  { code: "ไทย", name: "ภาษาไทย", hint: "泰语" },
  { code: "한국어", name: "한국어", hint: "韩语" },
  { code: "日本語", name: "日本語", hint: "日语" },
  { code: "ID", name: "Bahasa Indonesia", hint: "印尼语" },
];

const templatePresets: Record<string, { name: string; label: string; languages: string[] }> = {
  "game-beta": { name: "游戏测试体验调研（副本）", label: "游戏测试体验调研", languages: ["EN", "繁中", "ไทย"] },
  update: { name: "版本更新满意度（副本）", label: "版本更新满意度", languages: ["EN", "繁中"] },
  nps: { name: "玩家 NPS 追踪（副本）", label: "玩家 NPS 追踪", languages: ["EN", "繁中", "ไทย"] },
  churn: { name: "流失玩家召回调研（副本）", label: "流失玩家召回调研", languages: ["EN", "繁中"] },
  event: { name: "运营活动复盘（副本）", label: "运营活动复盘", languages: ["简中"] },
  community: { name: "社区玩家画像（副本）", label: "社区玩家画像", languages: ["EN", "日本語", "한국어"] },
  support: { name: "客服满意度回访（副本）", label: "客服满意度回访", languages: ["EN", "繁中", "ไทย"] },
};

export default function NewSurveyPage() {
  return <Suspense fallback={<main className="wizard-page" />}><NewSurveyWizard /></Suspense>;
}

function NewSurveyWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const template = templatePresets[searchParams.get("template") || ""];
  const initialProject = searchParams.get("project") || "RO3";
  const initialGroup = searchParams.get("group") || "3.6版本先锋测试";
  const [step, setStep] = useState(1);
  const [name, setName] = useState(template?.name || "");
  const [game, setGame] = useState(initialProject);
  const [projectGroup, setProjectGroup] = useState(initialGroup);
  const [region, setRegion] = useState<Region>("海外");
  const [languages, setLanguages] = useState(template?.languages || ["EN", "繁中"]);
  const [defaultLanguage, setDefaultLanguage] = useState("EN");
  const [mode, setMode] = useState<CreationMode>(template ? "template" : "blank");
  const [error, setError] = useState("");

  const availableLanguages = useMemo(
    () =>
      region === "国内"
        ? [{ code: "简中", name: "简体中文", hint: "简体中文" }]
        : globalLanguages,
    [region],
  );

  function chooseRegion(next: Region) {
    setRegion(next);
    if (next === "国内") {
      setLanguages(["简中"]);
      setDefaultLanguage("简中");
    } else {
      setLanguages(["EN", "繁中"]);
      setDefaultLanguage("EN");
    }
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

  function createSurvey() {
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
      creationMode: mode,
      createdAt: new Date().toISOString(),
    };
    const key = "joydata-survey-drafts";
    try {
      const existing = JSON.parse(window.localStorage.getItem(key) || "[]");
      window.localStorage.setItem(key, JSON.stringify([draft, ...existing]));
    } catch {
      window.localStorage.setItem(key, JSON.stringify([draft]));
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
            <p><strong>草稿自动保存</strong><br />创建后可继续修改所有配置。</p>
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
                    <p>这些信息用于后台管理，不会直接展示给玩家。</p>
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
                    <textarea placeholder="选填：记录调研背景、目标玩家或负责人信息。" />
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
                    className={region === "海外" ? "selected" : ""}
                    onClick={() => chooseRegion("海外")}
                  >
                    <span className="region-choice-icon global">◎</span>
                    <i>{region === "海外" ? "✓" : ""}</i>
                    <strong>海外工作空间</strong>
                    <em>GLOBAL</em>
                    <p>面向海外玩家，支持多语言、海外登录与区域化隐私政策。</p>
                    <ul>
                      <li>海外数据存储</li>
                      <li>多语言智能匹配</li>
                      <li>JM / Line 登录</li>
                    </ul>
                  </button>
                  <button
                    className={region === "国内" ? "selected china" : ""}
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
                <div className="region-warning">
                  <span>i</span>
                  <p>
                    问卷结构后续可以复制到另一工作空间，但答卷、发布链接和
                    Webhook 不会一并复制。
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="wizard-panel">
                <div className="wizard-panel-title">
                  <span>03</span>
                  <div>
                    <h2>配置问卷语言</h2>
                    <p>玩家打开问卷时会优先匹配渠道、账号或浏览器语言。</p>
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
                        {selected && (
                          <label onClick={(event) => event.stopPropagation()}>
                            <input
                              type="radio"
                              name="default-language"
                              checked={defaultLanguage === language.code}
                              onChange={() => setDefaultLanguage(language.code)}
                            />
                            默认语言
                          </label>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="language-rule-card">
                  <span>✦</span>
                  <div>
                    <strong>智能语言匹配</strong>
                    <p>渠道指定语言 → 玩家账号语言 → 浏览器语言 → 默认语言</p>
                  </div>
                  <span className="switch-on"><i /></span>
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
                    onClick={() => template ? setMode("template") : router.push("/survey/templates")}
                  >
                    <span>▦</span>
                    <div><strong>从模板创建</strong><p>{template ? `已选「${template.label}」` : "前往模板中心选择满意度、招募、版本反馈等标准模板。"}</p></div>
                    <i>{mode === "template" ? "✓" : ""}</i>
                  </button>
                  <button
                    className={mode === "copy" ? "selected" : ""}
                    onClick={() => setMode("copy")}
                  >
                    <span>⧉</span>
                    <div><strong>复制已有问卷</strong><p>复用题目、逻辑、翻译和主题，不复制答卷。</p></div>
                    <i>{mode === "copy" ? "✓" : ""}</i>
                  </button>
                </div>
                <div className="creation-summary">
                  <h3>创建信息确认</h3>
                  <div><span>问卷名称</span><strong>{name}</strong></div>
                  <div><span>所属项目</span><strong>{game}</strong></div>
                  <div><span>项目分组</span><strong>{projectGroup}</strong></div>
                  {template && <div><span>使用模板</span><strong>{template.label}</strong></div>}
                  <div><span>工作空间</span><strong>{region}</strong></div>
                  <div><span>问卷语言</span><strong>{languages.join("、")}</strong></div>
                  <div><span>默认语言</span><strong>{defaultLanguage}</strong></div>
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
