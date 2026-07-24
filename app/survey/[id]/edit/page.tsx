"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  createQuestion,
  defaultQuestions,
  loadQuestions,
  Question,
  QuestionType,
  questionLabels,
} from "@/lib/survey-builder";
import { SurveyNav } from "../survey-nav";

const palette: { title: string; items: { type: QuestionType; icon: string }[] }[] = [
  {
    title: "常用题型",
    items: [
      { type: "single", icon: "◉" },
      { type: "multiple", icon: "☑" },
      { type: "text", icon: "T" },
      { type: "rating", icon: "★" },
      { type: "nps", icon: "10" },
      { type: "matrix", icon: "▦" },
    ],
  },
  {
    title: "更多题型",
    items: [
      { type: "sort", icon: "↕" },
      { type: "image", icon: "▧" },
      { type: "description", icon: "¶" },
    ],
  },
];

export default function SurveyEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [selectedId, setSelectedId] = useState(defaultQuestions[0].id);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const hydrated = useRef(false);

  useEffect(() => {
    setQuestions(loadQuestions(surveyId));
    hydrated.current = true;
  }, [surveyId]);

  useEffect(() => {
    if (!hydrated.current) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(
        `joydata-survey-schema-${surveyId}`,
        JSON.stringify(questions),
      );
      setSaveState("saved");
    }, 650);
    return () => window.clearTimeout(timer);
  }, [questions, surveyId]);

  const selected = useMemo(
    () => questions.find((question) => question.id === selectedId) || null,
    [questions, selectedId],
  );

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function addQuestion(type: QuestionType) {
    const question = createQuestion(type);
    setQuestions((current) => [...current, question]);
    setSelectedId(question.id);
    window.setTimeout(
      () => document.getElementById(`question-${question.id}`)?.scrollIntoView({ behavior: "smooth" }),
      30,
    );
  }

  function updateSelected(patch: Partial<Question>) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === selectedId ? { ...question, ...patch } : question,
      ),
    );
  }

  function duplicateQuestion(id: string) {
    const index = questions.findIndex((item) => item.id === id);
    if (index < 0) return;
    const copy = {
      ...questions[index],
      id: `${questions[index].type}-${Date.now()}`,
      title: `${questions[index].title}（副本）`,
      options: questions[index].options ? [...questions[index].options!] : undefined,
    };
    setQuestions((current) => [
      ...current.slice(0, index + 1),
      copy,
      ...current.slice(index + 1),
    ]);
    setSelectedId(copy.id);
  }

  function removeQuestion(id: string) {
    if (questions.length === 1) {
      flash("问卷至少需要保留一道题");
      return;
    }
    const index = questions.findIndex((item) => item.id === id);
    setQuestions((current) => current.filter((item) => item.id !== id));
    setSelectedId(questions[Math.max(0, index - 1)]?.id || "");
  }

  function moveQuestion(id: string, direction: -1 | 1) {
    const index = questions.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= questions.length) return;
    setQuestions((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateOption(index: number, value: string) {
    if (!selected?.options) return;
    const next = [...selected.options];
    next[index] = value;
    updateSelected({ options: next });
  }

  return (
    <main className="editor-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push("/")}>‹</button>
        <div className="editor-title">
          <span className="survey-doc-icon">▤</span>
          <div>
            <strong>RO3 先锋测试玩家体验调研</strong>
            <small>
              <i className={saveState === "saved" ? "saved" : ""} />
              {saveState === "saved" ? "所有更改已保存" : "正在自动保存…"}
            </small>
          </div>
        </div>
        <SurveyNav surveyId={surveyId} active="edit" onNotice={flash} />
        <div className="editor-actions">
          <button className="secondary-button" onClick={() => setPreview(true)}>▣ 预览</button>
          <button className="primary-button" onClick={() => flash("草稿已保存，可以继续配置发布")}>保存草稿</button>
        </div>
      </header>

      <section className="editor-workspace">
        <aside className="component-library">
          <div className="panel-small-heading">
            <div><strong>题型组件</strong><small>点击添加到问卷</small></div>
            <button onClick={() => flash("已收起全部分类")}>−</button>
          </div>
          <div className="component-search"><span>⌕</span><input placeholder="搜索题型" /></div>
          {palette.map((group) => (
            <section className="component-group" key={group.title}>
              <h3>{group.title}<span>⌃</span></h3>
              <div className="component-grid">
                {group.items.map((item) => (
                  <button key={item.type} onClick={() => addQuestion(item.type)}>
                    <span>{item.icon}</span>
                    <strong>{questionLabels[item.type]}</strong>
                  </button>
                ))}
              </div>
            </section>
          ))}
          <div className="component-helper">
            <span>✦</span>
            <p><strong>导入题目</strong><br />支持从文档或历史问卷快速导入。</p>
            <button onClick={() => flash("导入功能将在模板阶段开放")}>导入</button>
          </div>
        </aside>

        <section className="builder-canvas-wrap">
          <div className="canvas-toolbar">
            <div>
              <button className="active">桌面端</button>
              <button>移动端</button>
            </div>
            <div>
              <button onClick={() => flash("已撤销最近操作")}>↶</button>
              <button onClick={() => flash("没有可重做的操作")}>↷</button>
              <span />
              <button onClick={() => flash("问卷结构检查通过")}>✓ 检查问卷</button>
            </div>
          </div>
          <div className="builder-scroll">
            <div className="survey-canvas">
              <header className="survey-cover">
                <span>RO3 · PLAYER RESEARCH</span>
                <h1>RO3 先锋测试玩家体验调研</h1>
                <p>感谢您参与本次先锋测试。问卷预计需要 3–5 分钟完成，您的反馈将帮助我们持续优化游戏体验。</p>
                <div><i /> 当前语言：English（默认）<button onClick={() => router.push(`/survey/${surveyId}/languages`)}>管理语言</button></div>
              </header>

              <div className="question-list">
                {questions.map((question, index) => (
                  <article
                    id={`question-${question.id}`}
                    key={question.id}
                    className={`question-card ${selectedId === question.id ? "selected" : ""}`}
                    onClick={() => setSelectedId(question.id)}
                  >
                    <div className="drag-handle">⠿</div>
                    <div className="question-index">{String(index + 1).padStart(2, "0")}</div>
                    <div className="question-content">
                      <span className="question-type">{questionLabels[question.type]}</span>
                      <h2>{question.required && <b>*</b>}{question.title}</h2>
                      {question.description && <p>{question.description}</p>}
                      {(question.type === "single" || question.type === "multiple") && (
                        <div className="choice-preview">
                          {question.options?.map((option) => (
                            <span key={option}><i>{question.type === "multiple" ? "□" : "○"}</i>{option}</span>
                          ))}
                        </div>
                      )}
                      {question.type === "text" && <div className="text-preview">请输入您的回答</div>}
                      {(question.type === "nps" || question.type === "rating") && (
                        <div className="score-preview">
                          {Array.from(
                            { length: (question.max || 5) - (question.min || 0) + 1 },
                            (_, score) => score + (question.min || 0),
                          ).map((score) => <span key={score}>{score}</span>)}
                        </div>
                      )}
                      {question.type === "matrix" && (
                        <div className="matrix-preview">
                          <span />
                          {["不满意", "一般", "满意"].map((item) => <b key={item}>{item}</b>)}
                          {question.options?.map((row) => (
                            <div key={row} className="matrix-row"><strong>{row}</strong><i>○</i><i>○</i><i>○</i></div>
                          ))}
                        </div>
                      )}
                      {question.type === "sort" && (
                        <div className="sort-preview">{question.options?.map((item, i) => <span key={item}><b>{i + 1}</b>{item}<i>⠿</i></span>)}</div>
                      )}
                      {question.type === "image" && (
                        <div className="image-choice-preview">{question.options?.map((item) => <span key={item}><i>▧</i>{item}</span>)}</div>
                      )}
                      {question.type === "description" && <div className="description-preview">这是一段用于说明背景和填写要求的文字。</div>}
                    </div>
                    {selectedId === question.id && (
                      <div className="question-actions">
                        <button onClick={(event) => { event.stopPropagation(); moveQuestion(question.id, -1); }}>↑</button>
                        <button onClick={(event) => { event.stopPropagation(); moveQuestion(question.id, 1); }}>↓</button>
                        <button onClick={(event) => { event.stopPropagation(); duplicateQuestion(question.id); }}>⧉</button>
                        <button className="danger" onClick={(event) => { event.stopPropagation(); removeQuestion(question.id); }}>⌫</button>
                      </div>
                    )}
                  </article>
                ))}
                <button className="canvas-add" onClick={() => addQuestion("single")}>＋ 添加一道题</button>
              </div>
              <footer className="survey-canvas-footer">已完成 0 / {questions.length} 题 · 内容自动保存</footer>
            </div>
          </div>
        </section>

        <aside className="property-panel">
          <div className="panel-small-heading">
            <div><strong>题目属性</strong><small>{selected ? questionLabels[selected.type] : "未选择题目"}</small></div>
            <button onClick={() => flash("属性面板设置")}>•••</button>
          </div>
          {selected ? (
            <div className="property-content">
              <label className="property-field">
                <span>题目标题</span>
                <textarea value={selected.title} onChange={(event) => updateSelected({ title: event.target.value })} />
              </label>
              <label className="property-field">
                <span>辅助说明</span>
                <textarea
                  className="compact"
                  value={selected.description}
                  placeholder="选填，帮助玩家理解题目"
                  onChange={(event) => updateSelected({ description: event.target.value })}
                />
              </label>
              <div className="property-switch-row">
                <div><strong>必答题</strong><small>玩家必须回答才能继续</small></div>
                <button className={selected.required ? "on" : ""} onClick={() => updateSelected({ required: !selected.required })}><i /></button>
              </div>
              {selected.options && (
                <section className="option-editor">
                  <div className="property-section-title"><strong>选项设置</strong><button onClick={() => updateSelected({ options: [...selected.options!, `选项 ${selected.options!.length + 1}`] })}>＋ 添加</button></div>
                  {selected.options.map((option, index) => (
                    <div className="option-row" key={`${selected.id}-${index}`}>
                      <span>⠿</span>
                      <input value={option} onChange={(event) => updateOption(index, event.target.value)} />
                      <button
                        disabled={selected.options!.length <= 2}
                        onClick={() => updateSelected({ options: selected.options!.filter((_, i) => i !== index) })}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {selected.type === "multiple" && (
                    <label className="limit-row">
                      <span>最多可选</span>
                      <select><option>不限</option><option>2 项</option><option>3 项</option></select>
                    </label>
                  )}
                </section>
              )}
              {(selected.type === "rating" || selected.type === "nps") && (
                <section className="score-settings">
                  <div className="property-section-title"><strong>分值范围</strong></div>
                  <div>
                    <label><span>起始分</span><input type="number" value={selected.min} onChange={(e) => updateSelected({ min: Number(e.target.value) })} /></label>
                    <label><span>最高分</span><input type="number" value={selected.max} onChange={(e) => updateSelected({ max: Number(e.target.value) })} /></label>
                  </div>
                </section>
              )}
              <section className="property-advanced">
                <button onClick={() => flash("已打开显示逻辑")}>分支与显示逻辑 <span>›</span></button>
                <button onClick={() => flash("已打开校验规则")}>校验与错误提示 <span>›</span></button>
                <button onClick={() => router.push(`/survey/${surveyId}/languages`)}>多语言翻译 <span>›</span></button>
              </section>
            </div>
          ) : (
            <div className="property-empty">选择画布中的题目后进行配置</div>
          )}
        </aside>
      </section>

      {preview && (
        <div className="preview-backdrop" onMouseDown={() => setPreview(false)}>
          <section className="preview-modal" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><strong>玩家端预览</strong><small>iPhone 15 · English</small></div><button onClick={() => setPreview(false)}>×</button></header>
            <div className="phone-frame">
              <div className="phone-screen">
                <span className="preview-brand">RO3 · PLAYER RESEARCH</span>
                <h2>先锋测试玩家体验调研</h2>
                <p>感谢您参与本次测试，您的反馈非常重要。</p>
                {questions.slice(0, 2).map((question, index) => (
                  <div className="phone-question" key={question.id}>
                    <strong>{index + 1}. {question.title}</strong>
                    {question.options?.slice(0, 3).map((option) => <span key={option}>○ {option}</span>)}
                  </div>
                ))}
                <button>下一页</button>
              </div>
            </div>
          </section>
        </div>
      )}
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}

