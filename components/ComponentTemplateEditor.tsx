"use client";

import { useState } from "react";
import { createQuestion, Question, QuestionType, questionLabels } from "@/lib/survey-builder";

const typeIcons: Record<QuestionType, string> = {
  text: "T",
  textarea: "≡",
  date: "▦",
  rating: "☆",
  file: "☁",
  imageUpload: "▧",
  sort: "↕",
  dropdown: "⌄",
  cascade: "☷",
  single: "◉",
  multiple: "☑",
  image: "▧",
  tableSelect: "▦",
  provinceCity: "⌘",
  globalProvinceCity: "▦",
  location: "⌖",
  phone: "▯",
  nps: "10",
  city: "⌘",
  ocr: "文",
  random: "#",
  product: "▤",
  appointmentDate: "◫",
  appointmentSlot: "◴",
  matrix: "▥",
  matrixFill: "▦",
  matrixSelect: "▤",
  matrixScale: "◌",
  matrixSlider: "↔",
  matrixDropdown: "≡",
  pageBreak: "↪",
  divider: "━",
  button: "BT",
  imageDisplay: "▧",
  carousel: "▱",
  description: "¶",
};

const typeGroups: { title: string; types: QuestionType[] }[] = [
  { title: "基础组件", types: ["text", "textarea", "date", "rating", "file", "imageUpload", "sort"] },
  { title: "选择组件", types: ["dropdown", "cascade", "single", "multiple", "image", "tableSelect"] },
  { title: "进阶组件", types: ["provinceCity", "globalProvinceCity", "location", "phone", "nps", "city", "ocr", "random", "product"] },
  { title: "预约组件", types: ["appointmentDate", "appointmentSlot"] },
  { title: "矩阵组件", types: ["matrix", "matrixFill", "matrixSelect", "matrixScale", "matrixSlider", "matrixDropdown"] },
  { title: "排版组件", types: ["pageBreak", "divider", "button", "imageDisplay", "carousel", "description"] },
];

const optionTypes: QuestionType[] = ["single", "multiple", "dropdown", "cascade", "sort", "image", "tableSelect"];
const matrixTypes: QuestionType[] = ["matrix", "matrixFill", "matrixSelect", "matrixScale", "matrixSlider", "matrixDropdown"];
const numericMatrixTypes: QuestionType[] = ["matrixScale", "matrixSlider"];
const textPreviewTypes: QuestionType[] = ["text", "textarea", "date", "file", "imageUpload", "city", "provinceCity", "globalProvinceCity", "location", "phone", "ocr", "random", "product", "appointmentDate", "appointmentSlot"];
const layoutTypes: QuestionType[] = ["pageBreak", "divider", "button", "imageDisplay", "carousel"];
const scorableTypes: QuestionType[] = ["single", "multiple", "dropdown"];

export type ComponentTemplateDraft = { id: string; name: string; question: Question };

export function ComponentTemplateEditor({
  draft,
  onCancel,
  onSave,
}: {
  draft: ComponentTemplateDraft;
  onCancel: () => void;
  onSave: (draft: ComponentTemplateDraft) => void;
}) {
  const [view, setView] = useState<"pick" | "edit">(draft.id ? "edit" : "pick");
  const [name, setName] = useState(draft.name);
  const [question, setQuestion] = useState<Question>(draft.question);
  const isMatrix = matrixTypes.includes(question.type);
  const isNumericMatrix = numericMatrixTypes.includes(question.type);
  const isLayout = layoutTypes.includes(question.type);
  const isTextPreview = textPreviewTypes.includes(question.type);
  const isScorable = scorableTypes.includes(question.type);

  function pickType(type: QuestionType) {
    const next = createQuestion(type);
    setQuestion(next);
    setName((current) => current.trim() ? current : questionLabels[type]);
    setView("edit");
  }

  function updateQuestion(patch: Partial<Question>) {
    setQuestion((current) => ({ ...current, ...patch }));
  }

  function updateOption(index: number, value: string) {
    const options = [...(question.options || [])];
    options[index] = value;
    updateQuestion({ options });
  }

  function updateOptionScore(index: number, raw: string) {
    const scores = [...(question.optionScores || [])];
    scores[index] = raw === "" ? Number.NaN : Number(raw);
    updateQuestion({ optionScores: scores });
  }

  function addOption() {
    updateQuestion({
      options: [...(question.options || []), `选项 ${(question.options?.length || 0) + 1}`],
      optionScores: question.optionScores ? [...question.optionScores, Number.NaN] : undefined,
    });
  }

  function removeOption(index: number) {
    updateQuestion({
      options: (question.options || []).filter((_, optionIndex) => optionIndex !== index),
      optionScores: question.optionScores ? question.optionScores.filter((_, optionIndex) => optionIndex !== index) : undefined,
    });
  }

  function updateMatrixRow(index: number, value: string) {
    const rows = [...(question.matrixRows || [])];
    rows[index] = value;
    updateQuestion({ matrixRows: rows });
  }

  function addMatrixRow() {
    updateQuestion({ matrixRows: [...(question.matrixRows || []), `行 ${(question.matrixRows?.length || 0) + 1}`] });
  }

  function removeMatrixRow(index: number) {
    updateQuestion({ matrixRows: (question.matrixRows || []).filter((_, rowIndex) => rowIndex !== index) });
  }

  function updateMatrixColumn(index: number, value: string) {
    const columns = [...(question.matrixColumns || [])];
    columns[index] = value;
    updateQuestion({ matrixColumns: columns });
  }

  function addMatrixColumn() {
    const columns = question.matrixColumns || [];
    const last = Number(columns[columns.length - 1]);
    updateQuestion({ matrixColumns: [...columns, isNumericMatrix && Number.isFinite(last) ? String(last + 1) : `列 ${columns.length + 1}`] });
  }

  function removeMatrixColumn(index: number) {
    updateQuestion({ matrixColumns: (question.matrixColumns || []).filter((_, columnIndex) => columnIndex !== index) });
  }

  return (
    <div className="preview-backdrop" onMouseDown={onCancel}>
      <section className="component-editor-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          {view === "edit" && !draft.id && <button className="component-editor-back" onClick={() => setView("pick")} aria-label="返回选择题型">‹</button>}
          <strong>{view === "pick" ? "选择组件题型" : draft.id ? "编辑组件" : "编辑新组件"}</strong>
          <button onClick={onCancel}>×</button>
        </header>

        {view === "pick" ? (
          <div className="component-editor-picker">
            {typeGroups.map((group) => (
              <section className="component-group" key={group.title}>
                <h3>{group.title}</h3>
                <div className="component-grid">
                  {group.types.map((type) => (
                    <button key={type} onClick={() => pickType(type)}>
                      <span>{typeIcons[type]}</span>
                      <strong>{questionLabels[type]}</strong>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="component-editor-body">
            <label className="component-editor-name"><span>组件名称</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="用于在组件库中识别" /></label>

            <article className="question-card component-editor-card">
              <div className="question-index">{typeIcons[question.type]}</div>
              <div className="question-content">
                <div className="inline-question-meta">
                  <span className="question-type">{questionLabels[question.type]}</span>
                  {!isLayout && (
                    <div className="required-switch">
                      <button type="button" className={`mini-switch ${question.required ? "on" : ""}`} aria-label={question.required ? "取消必填" : "设为必填"} onClick={() => updateQuestion({ required: !question.required })}><i /></button>
                      必填
                    </div>
                  )}
                </div>
                <div className="inline-title-row"><b>{question.required ? "*" : ""}</b><textarea value={question.title} onChange={(event) => updateQuestion({ title: event.target.value })} aria-label="题目标题" /></div>
                <textarea className="inline-description" value={question.description} onChange={(event) => updateQuestion({ description: event.target.value })} placeholder="题目说明（选填）" aria-label="题目说明" />

                {optionTypes.includes(question.type) && (
                  <div className={`choice-preview editing ${isScorable ? "scorable" : ""}`}>
                    {(question.options || []).map((option, optionIndex) => (
                      <span key={optionIndex}>
                        <i>{question.type === "multiple" ? "□" : "○"}</i>
                        <input value={option} onChange={(event) => updateOption(optionIndex, event.target.value)} />
                        {isScorable && <input className="option-score-input" type="number" placeholder="不计分" value={Number.isNaN(question.optionScores?.[optionIndex]) || question.optionScores?.[optionIndex] === undefined ? "" : question.optionScores[optionIndex]} onChange={(event) => updateOptionScore(optionIndex, event.target.value)} aria-label={`选项 ${optionIndex + 1} 分数`} />}
                        <button disabled={(question.options?.length || 0) <= 2} onClick={() => removeOption(optionIndex)}>×</button>
                      </span>
                    ))}
                    <button className="inline-add-option" onClick={addOption}>＋ 添加选项</button>
                    {question.type === "multiple" && (
                      <label className="multiple-limit-setting">
                        <span>最多可选</span>
                        <select value={question.maxSelections ?? ""} onChange={(event) => updateQuestion({ maxSelections: event.target.value ? Number(event.target.value) : undefined })}>
                          <option value="">不限</option>
                          {(question.options || []).map((_, optionIndex) => <option key={optionIndex + 1} value={optionIndex + 1}>{optionIndex + 1} 项</option>)}
                        </select>
                        <small>玩家达到上限后需取消已选项，才能继续选择。</small>
                      </label>
                    )}
                    {isScorable && <small className="option-score-hint">可为部分选项设置分数，用于问卷明细中的选项总分判定；留空表示该选项不计分。</small>}
                  </div>
                )}

                {isTextPreview && <div className="text-preview">{question.type === "date" || question.type === "appointmentDate" ? "请选择日期" : question.type === "appointmentSlot" ? "请选择预约时段" : question.type === "phone" ? "请输入手机号并完成验证" : "请输入您的回答"}</div>}

                {(question.type === "nps" || question.type === "rating") && (
                  <>
                    <div className="rating-config-row">
                      <label><span>最低分</span><input type="number" value={question.min ?? (question.type === "nps" ? 0 : 1)} onChange={(event) => updateQuestion({ min: Number(event.target.value) })} /></label>
                      <label><span>最高分</span><input type="number" value={question.max ?? (question.type === "nps" ? 10 : 5)} onChange={(event) => updateQuestion({ max: Number(event.target.value) })} /></label>
                      {question.type === "rating" && <label><span>低分辅助文字</span><input value={question.minLabel || ""} onChange={(event) => updateQuestion({ minLabel: event.target.value })} placeholder="例如：很不满意" /></label>}
                      {question.type === "rating" && <label><span>高分辅助文字</span><input value={question.maxLabel || ""} onChange={(event) => updateQuestion({ maxLabel: event.target.value })} placeholder="例如：非常满意" /></label>}
                    </div>
                    <div className="score-label-row"><small>{question.minLabel}</small><small>{question.maxLabel}</small></div>
                    <div className="score-preview">
                      {Array.from({ length: Math.max(1, Math.min(21, (question.max ?? 5) - (question.min ?? 0) + 1)) }, (_, score) => score + (question.min ?? 0)).map((score) => <span key={score}>{score}</span>)}
                    </div>
                  </>
                )}

                {isMatrix && (
                  <div className="matrix-inline-editor">
                    <header>
                      <p><strong>矩阵内容</strong><small>点击表格中的行名和{isNumericMatrix ? "分值" : "列名"}直接修改</small></p>
                      <div>
                        <button onClick={addMatrixRow}>＋ 添加行</button>
                        <button onClick={addMatrixColumn}>＋ 添加{isNumericMatrix ? "分值" : "列"}</button>
                      </div>
                    </header>
                    <div className="matrix-preview" style={{ gridTemplateColumns: `minmax(150px, 1.5fr) repeat(${(question.matrixColumns?.length ? question.matrixColumns : ["列 1", "列 2", "列 3"]).length}, minmax(72px, 1fr))` }}>
                      <span className="matrix-corner-label">
                        <input value={question.matrixCornerLabel || `题目 / ${isNumericMatrix ? "评分" : "选项"}`} onChange={(event) => updateQuestion({ matrixCornerLabel: event.target.value })} aria-label="矩阵左上角标题" />
                      </span>
                      {(question.matrixColumns?.length ? question.matrixColumns : ["列 1", "列 2", "列 3"]).map((item, columnIndex) => (
                        <b key={`${item}-${columnIndex}`}>
                          <input type={isNumericMatrix ? "number" : "text"} value={item} onChange={(event) => updateMatrixColumn(columnIndex, event.target.value)} />
                          <button disabled={(question.matrixColumns?.length || 0) <= 2} onClick={() => removeMatrixColumn(columnIndex)}>×</button>
                        </b>
                      ))}
                      {(question.matrixRows?.length ? question.matrixRows : ["行 1", "行 2", "行 3"]).map((row, rowIndex) => (
                        <div key={`${row}-${rowIndex}`} className="matrix-row">
                          <strong><input value={row} onChange={(event) => updateMatrixRow(rowIndex, event.target.value)} /><button disabled={(question.matrixRows?.length || 0) <= 1} onClick={() => removeMatrixRow(rowIndex)}>×</button></strong>
                          {(question.matrixColumns?.length ? question.matrixColumns : ["列 1", "列 2", "列 3"]).map((column, columnIndex) => <i key={`${column}-${columnIndex}`}>{question.type === "matrixFill" ? "—" : question.type === "matrixDropdown" ? "⌄" : "○"}</i>)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {question.type === "description" && <div className="description-preview">这是一段用于说明背景和填写要求的文字。</div>}
                {layoutTypes.includes(question.type) && <div className="description-preview">{questionLabels[question.type]}将展示在问卷中，用于组织内容与补充说明。</div>}
              </div>
            </article>
          </div>
        )}

        {view === "edit" && (
          <footer>
            <button className="secondary-button" onClick={onCancel}>取消</button>
            <button className="primary-button" onClick={() => onSave({ id: draft.id, name: name.trim() || questionLabels[question.type], question })}>保存组件</button>
          </footer>
        )}
      </section>
    </div>
  );
}
