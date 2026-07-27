"use client";

import { useEffect, useRef, useState } from "react";
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
import { useSurveyTitle } from "@/lib/use-survey-title";

const palette: { title: string; items: { type: QuestionType; icon: string }[] }[] = [
  {
    title: "基础组件",
    items: [
      { type: "text", icon: "T" },
      { type: "textarea", icon: "≡" },
      { type: "date", icon: "◫" },
      { type: "rating", icon: "★" },
      { type: "file", icon: "⇧" },
      { type: "imageUpload", icon: "▧" },
      { type: "sort", icon: "↕" },
    ],
  },
  {
    title: "选择组件",
    items: [
      { type: "dropdown", icon: "⌄" },
      { type: "cascade", icon: "⌘" },
      { type: "single", icon: "◉" },
      { type: "multiple", icon: "☑" },
      { type: "image", icon: "▧" },
    ],
  },
  {
    title: "进阶组件",
    items: [
      { type: "city", icon: "⌘" },
      { type: "provinceCity", icon: "▦" },
      { type: "location", icon: "⌖" },
      { type: "nps", icon: "10" },
      { type: "ocr", icon: "T" },
      { type: "random", icon: "№" },
      { type: "product", icon: "□" },
    ],
  },
  {
    title: "预约组件",
    items: [
      { type: "appointmentDate", icon: "◫" },
      { type: "appointmentSlot", icon: "◴" },
    ],
  },
  {
    title: "矩阵组件",
    items: [
      { type: "matrixFill", icon: "▦" },
      { type: "matrixSelect", icon: "▤" },
      { type: "matrixScale", icon: "◌" },
      { type: "matrix", icon: "☷" },
      { type: "matrixDropdown", icon: "≡" },
      { type: "tableSelect", icon: "▦" },
    ],
  },
  {
    title: "排版组件",
    items: [
      { type: "pageBreak", icon: "↪" },
      { type: "divider", icon: "━" },
      { type: "button", icon: "BT" },
      { type: "imageDisplay", icon: "▧" },
      { type: "carousel", icon: "▱" },
      { type: "description", icon: "¶" },
    ],
  },
];

export default function SurveyEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const surveyId = params.id;
  const surveyTitle = useSurveyTitle(surveyId);
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [selectedId, setSelectedId] = useState(defaultQuestions[0].id);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [preview, setPreview] = useState(false);
  const [logicQuestionId, setLogicQuestionId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
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

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions((current) => current.map((question) => question.id === id ? { ...question, ...patch } : question));
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

  function reorderQuestion(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    setQuestions((current) => {
      const sourceIndex = current.findIndex((item) => item.id === sourceId);
      const targetIndex = current.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setSelectedId(sourceId);
    flash("题目顺序已更新");
  }

  function updateOption(index: number, value: string) {
    const currentQuestion = questions.find((question) => question.id === selectedId);
    if (!currentQuestion?.options) return;
    const next = [...currentQuestion.options];
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
            <strong>{surveyTitle}</strong>
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
                <h1>{surveyTitle}</h1>
                <p>感谢您参与本次先锋测试。问卷预计需要 3–5 分钟完成，您的反馈将帮助我们持续优化游戏体验。</p>
                <div><i /> 当前语言：English（默认）<button onClick={() => router.push(`/survey/${surveyId}/languages`)}>管理语言</button></div>
              </header>

              <div className="question-list">
                {questions.map((question, index) => (
                  <article
                    id={`question-${question.id}`}
                    key={question.id}
                    className={`question-card ${selectedId === question.id ? "selected" : ""} ${draggingId === question.id ? "dragging" : ""} ${dragOverId === question.id && draggingId !== question.id ? "drag-over" : ""}`}
                    onClick={() => setSelectedId(question.id)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDragOverId(question.id);
                    }}
                    onDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOverId(null);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const sourceId = event.dataTransfer.getData("text/plain") || draggingId;
                      if (sourceId) reorderQuestion(sourceId, question.id);
                      setDraggingId(null);
                      setDragOverId(null);
                    }}
                  >
                    <div
                      className="drag-handle"
                      draggable
                      title="拖动调整题目顺序"
                      aria-label={`拖动第 ${index + 1} 题调整顺序`}
                      onClick={(event) => event.stopPropagation()}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", question.id);
                        setDraggingId(question.id);
                        setSelectedId(question.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverId(null);
                      }}
                    >⠿</div>
                    <div className="question-index">{String(index + 1).padStart(2, "0")}</div>
                    <div className="question-content">
                      <div className="inline-question-meta"><span className="question-type">{questionLabels[question.type]}</span><label><input type="checkbox" checked={question.required} onChange={(event) => { event.stopPropagation(); updateQuestion(question.id, { required: event.target.checked }); }} /> 必填</label></div>
                      <div className="inline-title-row"><b>{question.required ? "*" : ""}</b><textarea value={question.title} onChange={(event) => updateQuestion(question.id, { title: event.target.value })} aria-label="题目标题" /></div>
                      <input className="inline-description" value={question.description} onChange={(event) => updateQuestion(question.id, { description: event.target.value })} placeholder="添加题目描述（选填）" aria-label="题目描述" />
                      {(["single", "multiple", "dropdown", "cascade"] as QuestionType[]).includes(question.type) && (
                        <div className={`choice-preview ${selectedId === question.id ? "editing" : ""}`}>
                          {question.options?.map((option, optionIndex) => (
                            <span key={`${question.id}-${optionIndex}`}><i>{question.type === "multiple" ? "□" : "○"}</i>{selectedId === question.id ? <><input value={option} onChange={(event) => updateOption(optionIndex, event.target.value)} /><button disabled={(question.options?.length || 0) <= 2} onClick={(event) => { event.stopPropagation(); updateQuestion(question.id, { options: question.options?.filter((_, itemIndex) => itemIndex !== optionIndex) }); }}>×</button></> : option}</span>
                          ))}
                          {selectedId === question.id && <button className="inline-add-option" onClick={(event) => { event.stopPropagation(); updateQuestion(question.id, { options: [...(question.options || []), `选项 ${(question.options?.length || 0) + 1}`] }); }}>＋ 添加选项</button>}
                        </div>
                      )}
                      {(["text", "textarea", "date", "file", "imageUpload", "city", "provinceCity", "location", "ocr", "random", "product", "appointmentDate", "appointmentSlot"] as QuestionType[]).includes(question.type) && <div className="text-preview">{question.type === "date" || question.type === "appointmentDate" ? "请选择日期" : question.type === "appointmentSlot" ? "请选择预约时段" : "请输入您的回答"}</div>}
                      {(question.type === "nps" || question.type === "rating") && (
                        <div className="score-preview">
                          {Array.from(
                            { length: (question.max || 5) - (question.min || 0) + 1 },
                            (_, score) => score + (question.min || 0),
                          ).map((score) => <span key={score}>{score}</span>)}
                        </div>
                      )}
                      {(["matrix", "matrixFill", "matrixSelect", "matrixScale", "matrixDropdown", "tableSelect"] as QuestionType[]).includes(question.type) && (
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
                      {(["pageBreak", "divider", "button", "imageDisplay", "carousel"] as QuestionType[]).includes(question.type) && <div className="description-preview">{questionLabels[question.type]}将展示在问卷中，用于组织内容与补充说明。</div>}
                      {logicQuestionId === question.id && <div className="inline-logic-panel"><header><div><strong>题目显示逻辑</strong><small>满足以下条件时显示本题</small></div><button onClick={(event) => { event.stopPropagation(); setLogicQuestionId(null); }}>×</button></header>{index === 0 ? <p>第一题无法引用前置题目，请从第二题开始设置显示逻辑。</p> : <div className="logic-condition-row"><span>当</span><select value={question.displayLogic?.questionId || questions[index - 1].id} onChange={(event) => updateQuestion(question.id, { displayLogic: { questionId: event.target.value, operator: question.displayLogic?.operator || "等于", value: question.displayLogic?.value || "" } })}>{questions.slice(0, index).map((source, sourceIndex) => <option key={source.id} value={source.id}>第 {sourceIndex + 1} 题 · {source.title}</option>)}</select><select value={question.displayLogic?.operator || "等于"} onChange={(event) => updateQuestion(question.id, { displayLogic: { questionId: question.displayLogic?.questionId || questions[index - 1].id, operator: event.target.value as "等于" | "不等于" | "包含", value: question.displayLogic?.value || "" } })}><option>等于</option><option>不等于</option><option>包含</option></select><input value={question.displayLogic?.value || ""} onChange={(event) => updateQuestion(question.id, { displayLogic: { questionId: question.displayLogic?.questionId || questions[index - 1].id, operator: question.displayLogic?.operator || "等于", value: event.target.value } })} placeholder="输入选项或答案" /></div>}<footer><button onClick={(event) => { event.stopPropagation(); updateQuestion(question.id, { displayLogic: undefined }); setLogicQuestionId(null); }}>清除逻辑</button><button className="primary-button" onClick={(event) => { event.stopPropagation(); setLogicQuestionId(null); flash("题目显示逻辑已保存"); }}>完成</button></footer></div>}
                    </div>
                    {selectedId === question.id && (
                      <div className="question-actions">
                        <button className={question.displayLogic ? "logic-active" : ""} onClick={(event) => { event.stopPropagation(); setLogicQuestionId(logicQuestionId === question.id ? null : question.id); }}>⌁ 显示逻辑</button>
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

      </section>

      {preview && (
        <div className="preview-backdrop" onMouseDown={() => setPreview(false)}>
          <section className="preview-modal" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><strong>玩家端预览</strong><small>iPhone 15 · English</small></div><button onClick={() => setPreview(false)}>×</button></header>
            <div className="phone-frame">
              <div className="phone-screen">
                <span className="preview-brand">RO3 · PLAYER RESEARCH</span>
                <h2>{surveyTitle}</h2>
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
