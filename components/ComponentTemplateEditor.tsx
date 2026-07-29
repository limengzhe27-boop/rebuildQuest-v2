"use client";

import { useState } from "react";
import { createQuestion, Question, QuestionType, questionLabels } from "@/lib/survey-builder";

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
const layoutTypes: QuestionType[] = ["pageBreak", "divider", "button", "imageDisplay", "carousel"];

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
  const [name, setName] = useState(draft.name);
  const [question, setQuestion] = useState<Question>(draft.question);
  const hasOptions = optionTypes.includes(question.type);
  const isMatrix = matrixTypes.includes(question.type);
  const isNumericMatrix = numericMatrixTypes.includes(question.type);
  const isLayout = layoutTypes.includes(question.type);
  const isRating = question.type === "rating";
  const isNps = question.type === "nps";

  function updateQuestion(patch: Partial<Question>) {
    setQuestion((current) => ({ ...current, ...patch }));
  }

  function updateOption(index: number, value: string) {
    const options = [...(question.options || [])];
    options[index] = value;
    updateQuestion({ options });
  }

  function addOption() {
    updateQuestion({ options: [...(question.options || []), `选项 ${(question.options?.length || 0) + 1}`] });
  }

  function removeOption(index: number) {
    updateQuestion({ options: (question.options || []).filter((_, optionIndex) => optionIndex !== index) });
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
    const next = isNumericMatrix ? String((Number(columns[columns.length - 1]) || columns.length) + 1) : `列 ${columns.length + 1}`;
    updateQuestion({ matrixColumns: [...columns, next] });
  }

  function removeMatrixColumn(index: number) {
    updateQuestion({ matrixColumns: (question.matrixColumns || []).filter((_, columnIndex) => columnIndex !== index) });
  }

  return (
    <div className="preview-backdrop" onMouseDown={onCancel}>
      <section className="component-editor-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <strong>{draft.id ? "编辑组件" : "新建组件"}</strong>
          <button onClick={onCancel}>×</button>
        </header>
        <div className="component-editor-body">
          <label><span>组件名称</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="用于在组件库中识别" /></label>
          <label>
            <span>题型</span>
            <select value={question.type} onChange={(event) => setQuestion(createQuestion(event.target.value as QuestionType))}>
              {typeGroups.map((group) => (
                <optgroup label={group.title} key={group.title}>
                  {group.types.map((type) => <option key={type} value={type}>{questionLabels[type]}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label><span>题目标题</span><input value={question.title} onChange={(event) => updateQuestion({ title: event.target.value })} /></label>
          <label><span>题目说明</span><textarea value={question.description} onChange={(event) => updateQuestion({ description: event.target.value })} /></label>
          {!isLayout && (
            <div className="component-editor-required">
              <span>是否必填</span>
              <button className={`mini-switch ${question.required ? "on" : ""}`} onClick={() => updateQuestion({ required: !question.required })}><i /></button>
            </div>
          )}
          {hasOptions && (
            <div className="component-editor-options">
              <span>选项</span>
              {(question.options || []).map((option, index) => (
                <div key={index}>
                  <input value={option} onChange={(event) => updateOption(index, event.target.value)} />
                  <button type="button" onClick={() => removeOption(index)} disabled={(question.options?.length || 0) <= 1} aria-label={`删除选项 ${index + 1}`}>×</button>
                </div>
              ))}
              <button type="button" className="config-add-button" onClick={addOption}>＋ 添加选项</button>
            </div>
          )}
          {question.type === "multiple" && (
            <label>
              <span>最多可选</span>
              <select value={question.maxSelections ?? ""} onChange={(event) => updateQuestion({ maxSelections: event.target.value ? Number(event.target.value) : undefined })}>
                <option value="">不限</option>
                {(question.options || []).map((_, index) => <option key={index} value={index + 1}>{index + 1} 项</option>)}
              </select>
            </label>
          )}
          {isRating && (
            <div className="component-editor-range">
              <label><span>最低分</span><input type="number" value={question.min ?? 1} onChange={(event) => updateQuestion({ min: Number(event.target.value) })} /></label>
              <label><span>最高分</span><input type="number" value={question.max ?? 5} onChange={(event) => updateQuestion({ max: Number(event.target.value) })} /></label>
              <label><span>最低分说明</span><input value={question.minLabel || ""} onChange={(event) => updateQuestion({ minLabel: event.target.value })} /></label>
              <label><span>最高分说明</span><input value={question.maxLabel || ""} onChange={(event) => updateQuestion({ maxLabel: event.target.value })} /></label>
            </div>
          )}
          {isNps && (
            <div className="component-editor-range">
              <label><span>最低分</span><input type="number" value={question.min ?? 0} onChange={(event) => updateQuestion({ min: Number(event.target.value) })} /></label>
              <label><span>最高分</span><input type="number" value={question.max ?? 10} onChange={(event) => updateQuestion({ max: Number(event.target.value) })} /></label>
            </div>
          )}
          {isMatrix && (
            <div className="component-editor-matrix">
              <label><span>左上角标题</span><input value={question.matrixCornerLabel || ""} onChange={(event) => updateQuestion({ matrixCornerLabel: event.target.value })} placeholder="题目 / 选项" /></label>
              <div className="component-editor-options">
                <span>矩阵行</span>
                {(question.matrixRows || []).map((row, index) => (
                  <div key={index}>
                    <input value={row} onChange={(event) => updateMatrixRow(index, event.target.value)} />
                    <button type="button" onClick={() => removeMatrixRow(index)} disabled={(question.matrixRows?.length || 0) <= 1} aria-label={`删除行 ${index + 1}`}>×</button>
                  </div>
                ))}
                <button type="button" className="config-add-button" onClick={addMatrixRow}>＋ 添加行</button>
              </div>
              <div className="component-editor-options">
                <span>{isNumericMatrix ? "矩阵分值" : "矩阵列"}</span>
                {(question.matrixColumns || []).map((column, index) => (
                  <div key={index}>
                    <input value={column} onChange={(event) => updateMatrixColumn(index, event.target.value)} />
                    <button type="button" onClick={() => removeMatrixColumn(index)} disabled={(question.matrixColumns?.length || 0) <= 2} aria-label={`删除列 ${index + 1}`}>×</button>
                  </div>
                ))}
                <button type="button" className="config-add-button" onClick={addMatrixColumn}>＋ {isNumericMatrix ? "添加分值" : "添加列"}</button>
              </div>
            </div>
          )}
        </div>
        <footer>
          <button className="secondary-button" onClick={onCancel}>取消</button>
          <button className="primary-button" onClick={() => onSave({ id: draft.id, name: name.trim() || questionLabels[question.type], question })}>保存组件</button>
        </footer>
      </section>
    </div>
  );
}
