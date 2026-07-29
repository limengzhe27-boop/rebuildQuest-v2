"use client";

import { useState } from "react";
import { createQuestion, Question, QuestionType, questionLabels } from "@/lib/survey-builder";

const editableTypes: QuestionType[] = ["single", "multiple", "dropdown", "image", "sort", "tableSelect", "cascade"];
const basicTypes: QuestionType[] = ["text", "textarea", "date", "rating", "file", "imageUpload", "nps", "phone"];
const advancedTypes: QuestionType[] = ["single", "multiple", "text", "textarea", "date", "rating", "file", "imageUpload", "nps", "dropdown", "sort", "image", "tableSelect"];

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
  const hasOptions = editableTypes.includes(question.type);
  const isAdvanced = advancedTypes.includes(question.type);

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
              {[...basicTypes, ...editableTypes].map((type) => <option key={type} value={type}>{questionLabels[type]}</option>)}
            </select>
          </label>
          <label><span>题目标题</span><input value={question.title} onChange={(event) => updateQuestion({ title: event.target.value })} /></label>
          <label><span>题目说明</span><textarea value={question.description} onChange={(event) => updateQuestion({ description: event.target.value })} /></label>
          <div className="component-editor-required">
            <span>是否必填</span>
            <button className={`mini-switch ${question.required ? "on" : ""}`} onClick={() => updateQuestion({ required: !question.required })}><i /></button>
          </div>
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
          {!isAdvanced && <p className="component-editor-note">该题型的高级设置（如矩阵行列）暂不支持在此编辑，请在问卷编辑器中调整。</p>}
        </div>
        <footer>
          <button className="secondary-button" onClick={onCancel}>取消</button>
          <button className="primary-button" onClick={() => onSave({ id: draft.id, name: name.trim() || questionLabels[question.type], question })}>保存组件</button>
        </footer>
      </section>
    </div>
  );
}
