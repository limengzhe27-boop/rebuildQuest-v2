"use client";

import { useState } from "react";
import { EndPageTemplate, LimitPageContent } from "@/lib/survey-publication";

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
          {template.image && <div className="page-template-editor-preview"><img src={template.image} alt="" /></div>}
          <label><span>标题（选填）</span><input value={content.title} onChange={(event) => setContent({ ...content, title: event.target.value })} /></label>
          <label><span>说明正文</span><textarea value={content.body} onChange={(event) => setContent({ ...content, body: event.target.value })} /></label>
        </div>
        <footer>
          <button className="secondary-button" onClick={onCancel}>取消</button>
          <button className="primary-button" onClick={() => onSave({ ...template, name: name.trim() || template.name, content })}>保存模板</button>
        </footer>
      </section>
    </div>
  );
}
