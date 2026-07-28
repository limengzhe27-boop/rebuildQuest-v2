"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
      { type: "date", icon: "▦" },
      { type: "rating", icon: "☆" },
      { type: "file", icon: "☁" },
      { type: "imageUpload", icon: "▧" },
      { type: "sort", icon: "↕" },
    ],
  },
  {
    title: "选择组件",
    items: [
      { type: "dropdown", icon: "⌄" },
      { type: "cascade", icon: "☷" },
      { type: "single", icon: "◉" },
      { type: "multiple", icon: "☑" },
      { type: "image", icon: "▧" },
    ],
  },
  {
    title: "进阶组件",
    items: [
      { type: "provinceCity", icon: "⌘" },
      { type: "globalProvinceCity", icon: "▦" },
      { type: "location", icon: "⌖" },
      { type: "phone", icon: "▯" },
      { type: "nps", icon: "10" },
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
      { type: "matrixSlider", icon: "↔" },
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

const defaultTemplateCategories = ["版本测试", "满意度", "用户洞察", "运营活动", "服务体验", "招募筛选", "其他"];
const defaultSurveyIntro = "感谢您参与本次调研。请根据实际体验完成以下问题，您的反馈将帮助我们持续优化产品体验。";

type LogicCondition = NonNullable<Question["displayLogic"]>["conditions"][number];
type ComponentTemplate = {
  id: string;
  name: string;
  question: Question;
};

export default function SurveyEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const surveyId = params.id;
  const editingTemplateId = searchParams.get("templateId");
  const surveyTitle = useSurveyTitle(surveyId);
  const [surveyName, setSurveyName] = useState(surveyTitle);
  const [templateEditorTitle, setTemplateEditorTitle] = useState("");
  const [surveyDescription, setSurveyDescription] = useState(defaultSurveyIntro);
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [selectedId, setSelectedId] = useState(defaultQuestions[0].id);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [showTemplateSave, setShowTemplateSave] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateCategories, setTemplateCategories] = useState<string[]>([]);
  const [availableTemplateCategories, setAvailableTemplateCategories] = useState(defaultTemplateCategories);
  const [templateMode, setTemplateMode] = useState<"blank" | "full">("full");
  const [showTemplateSettings, setShowTemplateSettings] = useState(false);
  const [editorTemplateCategories, setEditorTemplateCategories] = useState<string[]>([]);
  const [logicQuestionId, setLogicQuestionId] = useState<string | null>(null);
  const [logicDraft, setLogicDraft] = useState<NonNullable<Question["displayLogic"]> | null>(null);
  const [moreQuestionId, setMoreQuestionId] = useState<string | null>(null);
  const [componentTemplates, setComponentTemplates] = useState<ComponentTemplate[]>([]);
  const [headerImage, setHeaderImage] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const hydrated = useRef(false);

  useEffect(() => {
    let loadedQuestions = loadQuestions(surveyId);
    if (editingTemplateId) {
      try {
        const templates = JSON.parse(window.localStorage.getItem("joydata-survey-templates") || "[]");
        const template = templates.find((item: { id?: string }) => item.id === editingTemplateId);
        if (template) {
          loadedQuestions = template.schema?.length ? template.schema : defaultQuestions;
          setTemplateEditorTitle(template.label || template.name || "未命名模板");
          setSurveyName(template.label || template.name || "未命名模板");
          setEditorTemplateCategories(template.categories?.length ? template.categories : [template.category || "其他"]);
        }
      } catch {}
    } else {
      try {
        const drafts = JSON.parse(window.localStorage.getItem("joydata-survey-drafts") || "[]");
        const draft = drafts.find((item: { id?: number | string }) => String(item.id) === String(surveyId));
        setSurveyName(draft?.name || surveyTitle);
        setSurveyDescription(draft?.description || defaultSurveyIntro);
      } catch {}
    }
    setQuestions(loadedQuestions.map((question) =>
      question.helpText !== undefined
        ? { ...question, description: question.description || question.helpText, helpText: undefined }
        : question,
    ));
    try {
      const savedCategories = JSON.parse(window.localStorage.getItem("joydata-template-categories") || "[]");
      if (savedCategories.length) setAvailableTemplateCategories(Array.from(new Set([...defaultTemplateCategories, ...savedCategories])));
    } catch {}
    try {
      setComponentTemplates(JSON.parse(window.localStorage.getItem("joydata-survey-component-templates") || "[]"));
      const appearance = JSON.parse(window.localStorage.getItem(`joydata-survey-appearance-${surveyId}`) || "{}");
      setHeaderImage(appearance.headerImage || "");
    } catch {}
    hydrated.current = true;
  }, [editingTemplateId, surveyId]);

  useEffect(() => {
    if (!hydrated.current) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      if (editingTemplateId) {
        try {
          const templates = JSON.parse(window.localStorage.getItem("joydata-survey-templates") || "[]");
          const next = templates.map((item: { id?: string }) => item.id === editingTemplateId ? { ...item, schema: questions, questions: questions.length, updatedAt: new Date().toISOString(), updatedBy: "李孟哲" } : item);
          window.localStorage.setItem("joydata-survey-templates", JSON.stringify(next));
        } catch {}
      } else {
        window.localStorage.setItem(
          `joydata-survey-schema-${surveyId}`,
          JSON.stringify(questions),
        );
        try {
          const drafts = JSON.parse(window.localStorage.getItem("joydata-survey-drafts") || "[]");
          const next = drafts.map((item: { id?: number | string }) => String(item.id) === String(surveyId)
            ? { ...item, name: surveyName.trim() || "未命名问卷", description: surveyDescription.trim() || defaultSurveyIntro, updated: "刚刚" }
            : item);
          window.localStorage.setItem("joydata-survey-drafts", JSON.stringify(next));
        } catch {}
      }
      setSaveState("saved");
    }, 650);
    return () => window.clearTimeout(timer);
  }, [editingTemplateId, questions, surveyDescription, surveyId, surveyName]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function openTemplateSave() {
    setTemplateName(surveyTitle);
    setTemplateCategories([]);
    setTemplateMode("full");
    setShowTemplateSave(true);
  }

  function saveAsTemplate() {
    if (!templateName.trim() || !templateCategories.length) {
      flash("请填写模板名称并至少选择一个模板分类");
      return;
    }
    let draft: { region?: string; languages?: string[] } | undefined;
    try {
      const drafts = JSON.parse(window.localStorage.getItem("joydata-survey-drafts") || "[]");
      draft = drafts.find((item: { id?: number | string }) => String(item.id) === surveyId);
    } catch {}
    const region = draft?.region === "国内" ? "国内" : "海外";
    let appearance: Record<string, unknown> = {};
    try {
      appearance = JSON.parse(window.localStorage.getItem(`joydata-survey-appearance-${surveyId}`) || "{}");
    } catch {}
    const template = {
      id: `custom-${Date.now()}`,
      name: `${templateName.trim()}（副本）`,
      label: templateName.trim(),
      category: templateCategories[0],
      categories: templateCategories,
      questions: questions.length,
      languages: draft?.languages?.length ? draft.languages : ["简中"],
      region,
      sourceSurveyId: surveyId,
      appearance,
      mode: templateMode,
      schema: templateMode === "full"
        ? questions
        : questions.map((question) => ({
          ...question,
          title: "",
          description: "",
          helpText: undefined,
          referenceImage: undefined,
          options: question.options?.map(() => ""),
        })),
      useCount: 0,
      updatedAt: new Date().toISOString(),
      updatedBy: "李孟哲",
      createdAt: new Date().toISOString(),
    };
    try {
      const saved = JSON.parse(window.localStorage.getItem("joydata-survey-templates") || "[]");
      window.localStorage.setItem("joydata-survey-templates", JSON.stringify([template, ...saved]));
    } catch {
      window.localStorage.setItem("joydata-survey-templates", JSON.stringify([template]));
    }
    setShowTemplateSave(false);
    flash(`已保存到 ${templateCategories.length} 个模板分类`);
  }

  function saveTemplateSettings() {
    if (!editingTemplateId || !editorTemplateCategories.length) {
      flash("请至少选择一个模板分类");
      return;
    }
    try {
      const templates = JSON.parse(window.localStorage.getItem("joydata-survey-templates") || "[]");
      const next = templates.map((item: { id?: string }) => item.id === editingTemplateId ? { ...item, categories: editorTemplateCategories, category: editorTemplateCategories[0], updatedAt: new Date().toISOString(), updatedBy: "李孟哲" } : item);
      window.localStorage.setItem("joydata-survey-templates", JSON.stringify(next));
      setShowTemplateSettings(false);
      flash("模板分类已保存");
    } catch {
      flash("模板分类保存失败");
    }
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

  function addComponentTemplate(template: ComponentTemplate) {
    const nextQuestion: Question = {
      ...template.question,
      id: `${template.question.type}-${Date.now()}`,
      options: template.question.options ? [...template.question.options] : undefined,
      matrixRows: template.question.matrixRows ? [...template.question.matrixRows] : undefined,
      matrixColumns: template.question.matrixColumns ? [...template.question.matrixColumns] : undefined,
      displayLogic: undefined,
    };
    setQuestions((current) => [...current, nextQuestion]);
    setSelectedId(nextQuestion.id);
    window.setTimeout(() => document.getElementById(`question-${nextQuestion.id}`)?.scrollIntoView({ behavior: "smooth" }), 30);
  }

  function saveQuestionAsComponent(question: Question) {
    const template: ComponentTemplate = {
      id: `component-${Date.now()}`,
      name: question.title.trim() || questionLabels[question.type],
      question: {
        ...question,
        options: question.options ? [...question.options] : undefined,
        matrixRows: question.matrixRows ? [...question.matrixRows] : undefined,
        matrixColumns: question.matrixColumns ? [...question.matrixColumns] : undefined,
        displayLogic: undefined,
      },
    };
    const next = [template, ...componentTemplates];
    setComponentTemplates(next);
    window.localStorage.setItem("joydata-survey-component-templates", JSON.stringify(next));
    setMoreQuestionId(null);
    flash("已保存为自定义组件，可从左侧直接添加");
  }

  function removeComponentTemplate(id: string) {
    const next = componentTemplates.filter((template) => template.id !== id);
    setComponentTemplates(next);
    window.localStorage.setItem("joydata-survey-component-templates", JSON.stringify(next));
  }

  function uploadHeaderImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      flash("请选择不超过 5MB 的图片");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      setHeaderImage(value);
      const key = `joydata-survey-appearance-${surveyId}`;
      const current = JSON.parse(window.localStorage.getItem(key) || "{}");
      window.localStorage.setItem(key, JSON.stringify({ ...current, headerImage: value }));
      flash("问卷头图已更新");
    };
    reader.readAsDataURL(file);
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

  function previewCurrentSurvey() {
    const previewId = editingTemplateId ? `template-preview-${editingTemplateId}` : surveyId;
    window.localStorage.setItem(`joydata-survey-schema-${previewId}`, JSON.stringify(questions));
    if (editingTemplateId) {
      try {
        const templates = JSON.parse(window.localStorage.getItem("joydata-survey-templates") || "[]");
        const currentTemplate = templates.find((item: { id?: string }) => item.id === editingTemplateId);
        window.localStorage.setItem(`joydata-survey-appearance-${previewId}`, JSON.stringify(currentTemplate?.appearance || {
          theme: "RO3 先锋",
          primary: "#356FE6",
          radius: 10,
          density: "comfortable",
          fontSize: "standard",
          buttonStyle: "filled",
          progress: true,
          languageSwitch: true,
          background: "soft",
        }));
        const drafts = JSON.parse(window.localStorage.getItem("joydata-survey-drafts") || "[]");
        const withoutPreview = drafts.filter((item: { id?: number | string }) => String(item.id) !== previewId);
        window.localStorage.setItem("joydata-survey-drafts", JSON.stringify([{ id: previewId, name: surveyName || "模板预览", description: surveyDescription || defaultSurveyIntro, languages: ["简中", "EN"] }, ...withoutPreview]));
      } catch {}
    }
    window.open(`/s/editor-preview?surveyId=${encodeURIComponent(previewId)}`, "_blank");
  }

  function uploadReferenceImage(questionId: string, file?: File) {
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
      updateQuestion(questionId, { referenceImage: String(reader.result || "") });
      setSelectedId(questionId);
      flash("参考图片已上传");
    };
    reader.readAsDataURL(file);
  }

  function duplicateQuestion(id: string) {
    const index = questions.findIndex((item) => item.id === id);
    if (index < 0) return;
    const copy = {
      ...questions[index],
      id: `${questions[index].type}-${Date.now()}`,
      title: `${questions[index].title}（副本）`,
      options: questions[index].options ? [...questions[index].options!] : undefined,
      matrixRows: questions[index].matrixRows ? [...questions[index].matrixRows!] : undefined,
      matrixColumns: questions[index].matrixColumns ? [...questions[index].matrixColumns!] : undefined,
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

  function openLogicEditor(question: Question) {
    const index = questions.findIndex((item) => item.id === question.id);
    setMoreQuestionId(null);
    if (index <= 0) {
      flash("第一题没有前置题目，无法设置显示逻辑");
      return;
    }
    setLogicQuestionId(question.id);
    const baseLogic = question.displayLogic || {
        match: "all",
        conditions: [{
          questionId: questions[index - 1].id,
          operator: "等于",
          value: "",
        }],
      };
    setLogicDraft({
      ...baseLogic,
      conditions: baseLogic.conditions.map((condition) => {
        const source = questions.find((item) => item.id === condition.questionId);
        if (!isMatrixLogicSource(source)) return condition;
        const matrixScope = condition.matrixScope || defaultMatrixScope(source);
        return {
          ...condition,
          matrixScope,
          matrixRow: condition.matrixRow || matrixRows(source)[0],
          matrixColumn: condition.matrixColumn || matrixColumns(source)[0],
          operator: matrixScope === "cell" ? "已选中" : condition.operator,
          value: matrixScope === "cell" ? "" : condition.value,
        };
      }),
    });
  }

  function updateLogicCondition(index: number, patch: Partial<LogicCondition>) {
    setLogicDraft((current) => current ? {
      ...current,
      conditions: current.conditions.map((condition, conditionIndex) =>
        conditionIndex === index
          ? {
              ...condition,
              ...patch,
              value:
                ["为空", "不为空", "已选中", "未选中"].includes(patch.operator || "")
                  ? ""
                  : patch.value ?? condition.value,
            }
          : condition,
      ),
    } : current);
  }

  function addLogicCondition() {
    const targetIndex = questions.findIndex((item) => item.id === logicQuestionId);
    if (targetIndex <= 0) return;
    setLogicDraft((current) => current ? {
      ...current,
      conditions: [...current.conditions, {
        questionId: questions[targetIndex - 1].id,
        operator: "等于",
        value: "",
      }],
    } : current);
  }

  function closeLogicEditor() {
    setLogicQuestionId(null);
    setLogicDraft(null);
  }

  function saveLogic() {
    if (!logicQuestionId || !logicDraft) return;
    const validConditions = logicDraft.conditions.filter((condition) =>
      condition.operator === "为空" ||
      condition.operator === "不为空" ||
      condition.operator === "已选中" ||
      condition.operator === "未选中" ||
      condition.value.trim(),
    );
    updateQuestion(logicQuestionId, {
      displayLogic: validConditions.length
        ? { ...logicDraft, conditions: validConditions }
        : undefined,
    });
    closeLogicEditor();
    flash(validConditions.length ? "题目显示逻辑已保存" : "未填写条件，已清除显示逻辑");
  }

  function updateOption(index: number, value: string) {
    const currentQuestion = questions.find((question) => question.id === selectedId);
    if (!currentQuestion?.options) return;
    const next = [...currentQuestion.options];
    next[index] = value;
    updateSelected({ options: next });
  }

  const logicQuestionIndex = questions.findIndex((item) => item.id === logicQuestionId);
  const logicSources = logicQuestionIndex > 0 ? questions.slice(0, logicQuestionIndex) : [];
  const matrixLogicTypes: QuestionType[] = ["matrix", "matrixSelect", "matrixScale", "matrixSlider", "matrixDropdown"];

  function isMatrixLogicSource(question?: Question) {
    return Boolean(question && matrixLogicTypes.includes(question.type));
  }

  function matrixRows(question?: Question) {
    return question?.matrixRows?.length ? question.matrixRows : ["行 1", "行 2", "行 3"];
  }

  function matrixColumns(question?: Question) {
    if (question?.matrixColumns?.length) return question.matrixColumns;
    if (question?.type === "matrixScale" || question?.type === "matrixSlider") return ["1", "2", "3", "4", "5"];
    return question?.options?.length ? question.options : ["列 1", "列 2", "列 3"];
  }

  function defaultMatrixScope(question?: Question): LogicCondition["matrixScope"] {
    return question?.type === "matrixScale" || question?.type === "matrixSlider" ? "row" : "cell";
  }

  function isNumericMatrix(question?: Question) {
    return question?.type === "matrixScale" || question?.type === "matrixSlider";
  }

  return (
    <main className="editor-page">
      <header className="editor-topbar">
        <button className="editor-back" onClick={() => router.push(editingTemplateId ? "/survey/templates" : "/")}>‹</button>
        <div className="editor-title">
          <span className="survey-doc-icon">▤</span>
          <div>
            <strong>{surveyName || (editingTemplateId ? templateEditorTitle : surveyTitle)}</strong>
            <small>
              <i className={saveState === "saved" ? "saved" : ""} />
              {saveState === "saved" ? "所有更改已保存" : "正在自动保存…"}
            </small>
          </div>
        </div>
        {editingTemplateId ? <div className="template-editor-label">模板编辑器</div> : <SurveyNav surveyId={surveyId} active="edit" onNotice={flash} />}
        <div className="editor-actions">
          <button className="secondary-button" onClick={previewCurrentSurvey}>阅览</button>
          {editingTemplateId ? <button className="secondary-button" onClick={() => setShowTemplateSettings(true)}>模板分类</button> : <button className="secondary-button" onClick={openTemplateSave}>设为模板</button>}
        </div>
      </header>

      <section className="editor-workspace">
        <aside className="component-library">
          <div className="panel-small-heading">
            <div><strong>题型组件</strong><small>点击添加到问卷</small></div>
          </div>
          <div className="component-search"><span>⌕</span><input placeholder="搜索题型" /></div>
          {componentTemplates.length > 0 && (
            <section className="component-group custom-component-group">
              <h3>自定义组件</h3>
              <div className="custom-component-list">
                {componentTemplates.map((template) => (
                  <div key={template.id}>
                    <button onClick={() => addComponentTemplate(template)}><span>◇</span><p><strong>{template.name}</strong><small>{questionLabels[template.question.type]} · 保留已配置内容</small></p></button>
                    <button aria-label={`删除自定义组件 ${template.name}`} onClick={() => removeComponentTemplate(template.id)}>×</button>
                  </div>
                ))}
              </div>
            </section>
          )}
          {palette.map((group) => (
            <section className="component-group" key={group.title}>
              <h3>{group.title}</h3>
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
        </aside>

        <section className="builder-canvas-wrap">
          <div className="builder-scroll">
            <div className="survey-canvas">
              <header className="survey-cover">
                {headerImage && <img className="survey-cover-image" src={headerImage} alt="" />}
                <span>RO3 · PLAYER RESEARCH</span>
                <input className="survey-cover-title-input" value={surveyName} onChange={(event) => setSurveyName(event.target.value)} aria-label="问卷标题" />
                <textarea className="survey-cover-intro-input" value={surveyDescription} onChange={(event) => setSurveyDescription(event.target.value)} aria-label="问卷开场说明" />
                <div><i /> 当前语言：English（默认）<button onClick={() => router.push(`/survey/${surveyId}/languages`)}>管理语言</button><label className="survey-cover-image-upload">▧ {headerImage ? "更换头图" : "添加头图"}<input type="file" accept="image/*" onChange={(event) => { uploadHeaderImage(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>{headerImage && <button onClick={() => { setHeaderImage(""); const key = `joydata-survey-appearance-${surveyId}`; const current = JSON.parse(window.localStorage.getItem(key) || "{}"); window.localStorage.setItem(key, JSON.stringify({ ...current, headerImage: "" })); }}>移除头图</button>}</div>
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
                      <div className="inline-question-meta">
                        <span className="question-type">{questionLabels[question.type]}</span>
                        <div className="question-card-toolbar">
                          <div className="required-switch">
                            <button
                              type="button"
                              className={`mini-switch ${question.required ? "on" : ""}`}
                              aria-label={question.required ? "取消必填" : "设为必填"}
                              onClick={(event) => {
                                event.stopPropagation();
                                updateQuestion(question.id, { required: !question.required });
                              }}
                            ><i /></button>
                            必填
                          </div>
                          <button title="复制题目" aria-label="复制题目" onClick={(event) => { event.stopPropagation(); duplicateQuestion(question.id); }}>⧉</button>
                          <button title="删除题目" aria-label="删除题目" onClick={(event) => { event.stopPropagation(); removeQuestion(question.id); }}>⌫</button>
                          <button
                            className={question.displayLogic ? "logic-active" : ""}
                            title="更多"
                            aria-label="更多题目操作"
                            onClick={(event) => {
                              event.stopPropagation();
                              setMoreQuestionId(moreQuestionId === question.id ? null : question.id);
                            }}
                          >•••</button>
                          {moreQuestionId === question.id && (
                            <div className="question-more-menu" onClick={(event) => event.stopPropagation()}>
                              <button onClick={() => openLogicEditor(question)}>
                                <span>⌘</span>
                                <p><strong>题目显示逻辑</strong><small>根据前置题目的答案决定是否显示</small></p>
                                {question.displayLogic && <em>{question.displayLogic.conditions.length}</em>}
                              </button>
                              <button onClick={() => saveQuestionAsComponent(question)}>
                                <span>◇</span>
                                <p><strong>设为自定义组件</strong><small>保存题目、选项和当前配置</small></p>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="inline-title-row"><b>{question.required ? "*" : ""}</b><textarea value={question.title} onChange={(event) => updateQuestion(question.id, { title: event.target.value })} aria-label="题目标题" /></div>
                      <div className="question-support-tools">
                        <label className={question.referenceImage ? "question-image-upload active" : "question-image-upload"}>
                          ▧ {question.referenceImage ? "更换图片" : "添加图片"}
                          <input
                            type="file"
                            accept="image/*"
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => {
                              uploadReferenceImage(question.id, event.target.files?.[0]);
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>
                      </div>
                      {question.description && <p className="question-description-preview">{question.description}</p>}
                      {question.referenceImage && (
                        <div className="question-reference-summary">
                          <img src={question.referenceImage} alt="题目参考图预览" />
                          <span>参考图片将展示在题目说明下方</span>
                          <button onClick={(event) => { event.stopPropagation(); updateQuestion(question.id, { referenceImage: undefined }); }}>删除</button>
                        </div>
                      )}
                      {(["single", "multiple", "dropdown", "cascade"] as QuestionType[]).includes(question.type) && (
                        <div className={`choice-preview ${selectedId === question.id ? "editing" : ""}`}>
                          {question.options?.map((option, optionIndex) => (
                            <span key={`${question.id}-${optionIndex}`}><i>{question.type === "multiple" ? "□" : "○"}</i>{selectedId === question.id ? <><input value={option} onChange={(event) => updateOption(optionIndex, event.target.value)} /><button disabled={(question.options?.length || 0) <= 2} onClick={(event) => { event.stopPropagation(); updateQuestion(question.id, { options: question.options?.filter((_, itemIndex) => itemIndex !== optionIndex) }); }}>×</button></> : option}</span>
                          ))}
                          {selectedId === question.id && <button className="inline-add-option" onClick={(event) => { event.stopPropagation(); updateQuestion(question.id, { options: [...(question.options || []), `选项 ${(question.options?.length || 0) + 1}`] }); }}>＋ 添加选项</button>}
                          {question.type === "multiple" && selectedId === question.id && (
                            <label className="multiple-limit-setting">
                              <span>最多可选</span>
                              <select
                                value={question.maxSelections ?? ""}
                                onChange={(event) => updateQuestion(question.id, { maxSelections: event.target.value ? Number(event.target.value) : undefined })}
                              >
                                <option value="">不限</option>
                                {question.options?.map((_, optionIndex) => <option key={optionIndex + 1} value={optionIndex + 1}>{optionIndex + 1} 项</option>)}
                              </select>
                              <small>玩家达到上限后需取消已选项，才能继续选择。</small>
                            </label>
                          )}
                        </div>
                      )}
                      {(["text", "textarea", "date", "file", "imageUpload", "city", "provinceCity", "globalProvinceCity", "location", "phone", "ocr", "random", "product", "appointmentDate", "appointmentSlot"] as QuestionType[]).includes(question.type) && <div className="text-preview">{question.type === "date" || question.type === "appointmentDate" ? "请选择日期" : question.type === "appointmentSlot" ? "请选择预约时段" : question.type === "phone" ? "请输入手机号并完成验证" : "请输入您的回答"}</div>}
                      {(question.type === "nps" || question.type === "rating") && (
                        <>
                          {question.type === "rating" && selectedId === question.id && <div className="rating-config-row">
                            <label><span>最低分</span><input type="number" value={question.min ?? 0} onChange={(event) => updateQuestion(question.id, { min: Number(event.target.value) })} /></label>
                            <label><span>最高分</span><input type="number" value={question.max ?? 5} onChange={(event) => updateQuestion(question.id, { max: Number(event.target.value) })} /></label>
                            <label><span>低分辅助文字</span><input value={question.minLabel || ""} onChange={(event) => updateQuestion(question.id, { minLabel: event.target.value })} placeholder="例如：很不满意" /></label>
                            <label><span>高分辅助文字</span><input value={question.maxLabel || ""} onChange={(event) => updateQuestion(question.id, { maxLabel: event.target.value })} placeholder="例如：非常满意" /></label>
                          </div>}
                          <div className="score-label-row"><small>{question.minLabel}</small><small>{question.maxLabel}</small></div>
                          <div className="score-preview">
                            {Array.from(
                              { length: Math.max(1, Math.min(21, (question.max ?? 5) - (question.min ?? 0) + 1)) },
                              (_, score) => score + (question.min ?? 0),
                            ).map((score) => <span key={score}>{score}</span>)}
                          </div>
                        </>
                      )}
                      {(["matrix", "matrixFill", "matrixSelect", "matrixScale", "matrixSlider", "matrixDropdown"] as QuestionType[]).includes(question.type) && (
                        <div className="matrix-inline-editor">
                          {selectedId === question.id && (
                            <header>
                              <p><strong>矩阵内容</strong><small>点击表格中的行名和{isNumericMatrix(question) ? "分值" : "列名"}直接修改</small></p>
                              <div>
                                <button onClick={(event) => { event.stopPropagation(); updateQuestion(question.id, { matrixRows: [...(question.matrixRows || []), `行 ${(question.matrixRows?.length || 0) + 1}`] }); }}>＋ 添加行</button>
                                <button onClick={(event) => { event.stopPropagation(); const columns = question.matrixColumns || []; const last = Number(columns[columns.length - 1]); updateQuestion(question.id, { matrixColumns: [...columns, isNumericMatrix(question) && Number.isFinite(last) ? String(last + 1) : `列 ${columns.length + 1}`] }); }}>＋ 添加{isNumericMatrix(question) ? "分值" : "列"}</button>
                              </div>
                            </header>
                          )}
                          <div className="matrix-preview" style={{ gridTemplateColumns: `minmax(150px, 1.5fr) repeat(${(question.matrixColumns?.length ? question.matrixColumns : ["列 1", "列 2", "列 3"]).length}, minmax(72px, 1fr))` }}>
                            <span className="matrix-corner-label">题目 / {isNumericMatrix(question) ? "评分" : "选项"}</span>
                            {(question.matrixColumns?.length ? question.matrixColumns : ["列 1", "列 2", "列 3"]).map((item, columnIndex) => (
                              <b key={`${item}-${columnIndex}`}>
                                {selectedId === question.id ? <><input type={isNumericMatrix(question) ? "number" : "text"} value={item} onChange={(event) => updateQuestion(question.id, { matrixColumns: question.matrixColumns?.map((column, itemIndex) => itemIndex === columnIndex ? event.target.value : column) })} /><button disabled={(question.matrixColumns?.length || 0) <= 2} onClick={(event) => { event.stopPropagation(); updateQuestion(question.id, { matrixColumns: question.matrixColumns?.filter((_, itemIndex) => itemIndex !== columnIndex) }); }}>×</button></> : item}
                              </b>
                            ))}
                            {(question.matrixRows?.length ? question.matrixRows : ["行 1", "行 2", "行 3"]).map((row, rowIndex) => (
                              <div key={`${row}-${rowIndex}`} className="matrix-row">
                                <strong>{selectedId === question.id ? <><input value={row} onChange={(event) => updateQuestion(question.id, { matrixRows: question.matrixRows?.map((item, itemIndex) => itemIndex === rowIndex ? event.target.value : item) })} /><button disabled={(question.matrixRows?.length || 0) <= 1} onClick={(event) => { event.stopPropagation(); updateQuestion(question.id, { matrixRows: question.matrixRows?.filter((_, itemIndex) => itemIndex !== rowIndex) }); }}>×</button></> : row}</strong>
                                {(question.matrixColumns?.length ? question.matrixColumns : ["列 1", "列 2", "列 3"]).map((column, columnIndex) => <i key={`${column}-${columnIndex}`}>{question.type === "matrixFill" ? "—" : question.type === "matrixDropdown" ? "⌄" : "○"}</i>)}
                              </div>
                            ))}
                          </div>
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
                    </div>
                  </article>
                ))}
              </div>
              <footer className="survey-canvas-footer">已完成 0 / {questions.length} 题 · 内容自动保存</footer>
            </div>
          </div>
        </section>

      </section>

      {logicQuestionId && logicDraft && (
        <div className="preview-backdrop logic-backdrop" onMouseDown={closeLogicEditor}>
          <section className="display-logic-modal" role="dialog" aria-modal="true" aria-labelledby="logic-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <h2 id="logic-modal-title">题目显示逻辑</h2>
                <p>仅当玩家答案满足设定条件时显示当前题目。</p>
              </div>
              <button aria-label="关闭" onClick={closeLogicEditor}>×</button>
            </header>

            <div className="logic-match-row">
              <span>符合以下</span>
              <select
                value={logicDraft.match}
                onChange={(event) => setLogicDraft({ ...logicDraft, match: event.target.value as "all" | "any" })}
              >
                <option value="all">所有</option>
                <option value="any">任一</option>
              </select>
              <span>条件</span>
            </div>

            <div className="logic-condition-list">
              {logicDraft.conditions.map((condition, conditionIndex) => {
                const source = logicSources.find((item) => item.id === condition.questionId);
                const isMatrix = isMatrixLogicSource(source);
                return (
                  <div className={`logic-condition-row ${isMatrix ? "matrix-condition" : ""}`} key={`${condition.questionId}-${conditionIndex}`}>
                    <select
                      value={condition.questionId}
                      onChange={(event) => {
                        const nextSource = logicSources.find((item) => item.id === event.target.value);
                        updateLogicCondition(conditionIndex, {
                          questionId: event.target.value,
                          matrixScope: isMatrixLogicSource(nextSource) ? defaultMatrixScope(nextSource) : undefined,
                          matrixRow: isMatrixLogicSource(nextSource) ? matrixRows(nextSource)[0] : undefined,
                          matrixColumn: isMatrixLogicSource(nextSource) ? matrixColumns(nextSource)[0] : undefined,
                          operator: isMatrixLogicSource(nextSource) && !isNumericMatrix(nextSource) ? "已选中" : "等于",
                          value: "",
                        });
                      }}
                    >
                      {logicSources.map((item, sourceIndex) => <option key={item.id} value={item.id}>A{sourceIndex + 1} {item.title}（{questionLabels[item.type]}）</option>)}
                    </select>
                    {isMatrix && (
                      <div className="matrix-cell-selector matrix-logic-object">
                        <label className="matrix-scope-field">
                          <span>判断对象</span>
                          <select
                            value={condition.matrixScope || defaultMatrixScope(source)}
                            onChange={(event) => {
                              const matrixScope = event.target.value as LogicCondition["matrixScope"];
                              updateLogicCondition(conditionIndex, {
                                matrixScope,
                                operator: matrixScope === "cell" ? "已选中" : isNumericMatrix(source) ? "小于" : "等于",
                                value: "",
                              });
                            }}
                          >
                            {!isNumericMatrix(source) && <option value="cell">指定单元格</option>}
                            <option value="row">{isNumericMatrix(source) ? "指定行评分" : "指定行的答案"}</option>
                            <option value="any-row">{isNumericMatrix(source) ? "任意一行评分" : "任意一行的答案"}</option>
                            {isNumericMatrix(source) && <option value="sum">所有行评分总和</option>}
                            {isNumericMatrix(source) && <option value="average">全部行平均分</option>}
                            {isNumericMatrix(source) && <option value="minimum">全部行最低分</option>}
                          </select>
                        </label>
                        {["cell", "row"].includes(condition.matrixScope || defaultMatrixScope(source) || "") && <label><span>行</span><select value={condition.matrixRow || matrixRows(source)[0]} onChange={(event) => updateLogicCondition(conditionIndex, { matrixRow: event.target.value })}>{matrixRows(source).map((row) => <option key={row}>{row}</option>)}</select></label>}
                        {(condition.matrixScope || defaultMatrixScope(source)) === "cell" && <label><span>列</span><select value={condition.matrixColumn || matrixColumns(source)[0]} onChange={(event) => updateLogicCondition(conditionIndex, { matrixColumn: event.target.value })}>{matrixColumns(source).map((column) => <option key={column}>{column}</option>)}</select></label>}
                      </div>
                    )}
                    <select value={condition.operator} onChange={(event) => updateLogicCondition(conditionIndex, { operator: event.target.value as LogicCondition["operator"] })}>
                      {isMatrix && (condition.matrixScope || defaultMatrixScope(source)) === "cell" ? (
                        <><option>已选中</option><option>未选中</option></>
                      ) : isMatrix && isNumericMatrix(source) ? (
                        <><option>小于</option><option>小于等于</option><option>等于</option><option>不等于</option><option>大于等于</option><option>大于</option></>
                      ) : (
                        <><option>等于</option><option>不等于</option><option>包含</option><option>不包含</option><option>为空</option><option>不为空</option></>
                      )}
                    </select>
                    {["为空", "不为空", "已选中", "未选中"].includes(condition.operator) ? (
                      <span className="logic-no-value">无需填写条件值</span>
                    ) : (
                      <input type={isMatrix && isNumericMatrix(source) ? "number" : "text"} value={condition.value} onChange={(event) => updateLogicCondition(conditionIndex, { value: event.target.value })} placeholder={isMatrix && isNumericMatrix(source) ? "输入评分，例如 3" : isMatrix ? "输入选项" : "请输入答案或选项"} />
                    )}
                    <button
                      aria-label="删除条件"
                      disabled={logicDraft.conditions.length === 1}
                      onClick={() => setLogicDraft({
                        ...logicDraft,
                        conditions: logicDraft.conditions.filter((_, index) => index !== conditionIndex),
                      })}
                    >×</button>
                  </div>
                );
              })}
            </div>

            <button className="add-logic-condition" onClick={addLogicCondition}>＋ 添加条件</button>
            <footer>
              <button className="secondary-button" onClick={closeLogicEditor}>取消</button>
              <button className="primary-button" onClick={saveLogic}>确定</button>
            </footer>
          </section>
        </div>
      )}

      {showTemplateSave && (
        <div className="preview-backdrop" onMouseDown={() => setShowTemplateSave(false)}>
          <section className="template-save-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><strong>设为团队模板</strong><small>模板与当前问卷属于同一工作区</small></div>
              <button onClick={() => setShowTemplateSave(false)}>×</button>
            </header>
            <div>
              <label><span>模板名称 <b>*</b></span><input value={templateName} onChange={(event) => setTemplateName(event.target.value)} /></label>
              <label>
                <span>保存方式 <b>*</b></span>
                <div className="template-mode-options">
                  <button className={templateMode === "full" ? "selected" : ""} onClick={() => setTemplateMode("full")}>
                    <i>▤</i><strong>完整模板</strong><small>保留题目、选项和全部配置，可直接修改使用</small>
                  </button>
                  <button className={templateMode === "blank" ? "selected" : ""} onClick={() => setTemplateMode("blank")}>
                    <i>□</i><strong>空白模板</strong><small>只保留题型与配置，题目和选项需重新填写</small>
                  </button>
                </div>
              </label>
              <label>
                <span>模板分类 <b>*</b><small>可选择多个分类</small></span>
                <details className="template-category-multiselect">
                  <summary><span>{templateCategories.length ? templateCategories.join("、") : "请选择模板分类"}</span><i>⌄</i></summary>
                  <div className="template-category-checks">
                  {availableTemplateCategories.map((category) => (
                    <button
                      key={category}
                      className={templateCategories.includes(category) ? "selected" : ""}
                      onClick={() => setTemplateCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category])}
                    >
                      <i>{templateCategories.includes(category) ? "✓" : ""}</i>{category}
                    </button>
                  ))}
                  </div>
                </details>
              </label>
              <p>保存后可在模板中心查看，并且只能用于相同工作区。</p>
            </div>
            <footer>
              <button className="secondary-button" onClick={() => setShowTemplateSave(false)}>取消</button>
              <button className="primary-button" onClick={saveAsTemplate}>保存模板</button>
            </footer>
          </section>
        </div>
      )}

      {showTemplateSettings && editingTemplateId && (
        <div className="preview-backdrop" onMouseDown={() => setShowTemplateSettings(false)}>
          <section className="template-save-modal template-settings-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><strong>模板分类</strong><small>{templateEditorTitle}</small></div><button onClick={() => setShowTemplateSettings(false)}>×</button></header>
            <div>
              <label>
                <span>所属分类 <b>*</b><small>下拉多选</small></span>
                <details className="template-category-multiselect">
                  <summary><span>{editorTemplateCategories.length ? editorTemplateCategories.join("、") : "请选择模板分类"}</span><i>⌄</i></summary>
                  <div className="template-category-checks">
                    {availableTemplateCategories.map((category) => <button key={category} className={editorTemplateCategories.includes(category) ? "selected" : ""} onClick={() => setEditorTemplateCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category])}><i>{editorTemplateCategories.includes(category) ? "✓" : ""}</i>{category}</button>)}
                  </div>
                </details>
              </label>
            </div>
            <footer><button className="secondary-button" onClick={() => setShowTemplateSettings(false)}>取消</button><button className="primary-button" onClick={saveTemplateSettings}>保存分类</button></footer>
          </section>
        </div>
      )}

      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
