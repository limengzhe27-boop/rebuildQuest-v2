"use client";

import { useState } from "react";
import { EndPageTemplate, LimitPageContent, PageTemplateType } from "@/lib/survey-publication";

export function PageTemplateEditor({
  template,
  onCancel,
  onSave,
}: {
  template: EndPageTemplate;
  onCancel: () => void;
  onSave: (template: EndPageTemplate) => void;
}) {
  const [name, setName] = useState(template.name);
  const [pageType, setPageType] = useState<PageTemplateType>(template.pageType || "limit");
  const [content, setContent] = useState<LimitPageContent>(template.content || { title: "", body: "", links: [] });

  return (
    <div className="preview-backdrop" onMouseDown={onCancel}>
      <section className="component-editor-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <strong>编辑页面模板</strong>
          <button onClick={onCancel}>×</button>
        </header>
        <div className="component-editor-body">
          <label><span>模板名称</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>
            <span>页面类型</span>
            <div className="page-type-choice">
              <button type="button" className={pageType === "limit" ? "active" : ""} onClick={() => setPageType("limit")}>提交页（问卷结束页）</button>
              <button type="button" className={pageType === "closed" ? "active" : ""} onClick={() => setPageType("closed")}>结束页（停止收集页）</button>
            </div>
          </label>
          {template.image && <div className="page-template-editor-preview"><img src={template.image} alt="" /></div>}
          <label><span>标题（选填）</span><input value={content.title} onChange={(event) => setContent({ ...content, title: event.target.value })} /></label>
          <label><span>说明正文</span><textarea value={content.body} onChange={(event) => setContent({ ...content, body: event.target.value })} /></label>
        </div>
        <footer>
          <button className="secondary-button" onClick={onCancel}>取消</button>
          <button className="primary-button" onClick={() => onSave({ ...template, name: name.trim() || template.name, pageType, content })}>保存模板</button>
        </footer>
      </section>
    </div>
  );
}
