"use client";

import { useRef, useState } from "react";
import { EndPageTemplate, LimitPageContent, PageTemplateType, parseInlineLinkSegments } from "@/lib/survey-publication";

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
  const [image, setImage] = useState(template.image);
  const [content, setContent] = useState<LimitPageContent>(template.content || { title: "", body: "", links: [] });
  const [notice, setNotice] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function uploadImage(file?: File) {
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
    reader.onload = () => setImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function insertLink() {
    const id = `link-${Date.now()}`;
    const token = `{{${id}}}`;
    const start = bodyRef.current?.selectionStart ?? content.body.length;
    const end = bodyRef.current?.selectionEnd ?? start;
    const body = `${content.body.slice(0, start)}${token}${content.body.slice(end)}`;
    setContent({ ...content, body, links: [...content.links, { id, text: "链接文字", url: "" }] });
    window.requestAnimationFrame(() => {
      bodyRef.current?.focus();
      bodyRef.current?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function updateLink(linkId: string, patch: Partial<LimitPageContent["links"][number]>) {
    setContent({ ...content, links: content.links.map((link) => link.id === linkId ? { ...link, ...patch } : link) });
  }

  function removeLink(linkId: string) {
    setContent({ ...content, body: content.body.replaceAll(`{{${linkId}}}`, ""), links: content.links.filter((link) => link.id !== linkId) });
  }

  return (
    <div className="preview-backdrop" onMouseDown={onCancel}>
      <section className="component-editor-modal page-template-editor-modal" onMouseDown={(event) => event.stopPropagation()}>
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

          <div className="page-template-editor-preview">
            <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(event) => uploadImage(event.target.files?.[0])} />
            {image ? <img src={image} alt="" /> : <div className="page-template-editor-preview-empty">暂无背景图</div>}
            <div className="page-template-editor-preview-actions">
              <button type="button" onClick={() => imageInputRef.current?.click()}>{image ? "更换背景" : "上传背景"}</button>
              {image && <button type="button" className="text-danger" onClick={() => setImage("")}>移除背景</button>}
            </div>
          </div>

          <label><span>标题（选填）</span><input value={content.title} onChange={(event) => setContent({ ...content, title: event.target.value })} /></label>
          <label>
            <span>说明正文</span>
            <textarea ref={bodyRef} value={content.body} onChange={(event) => setContent({ ...content, body: event.target.value })} />
          </label>
          <button className="insert-inline-link" type="button" onClick={insertLink}>＋ 在正文光标处插入链接</button>
          {content.links.length > 0 && (
            <div className="limit-inline-links">
              {content.links.map((link, index) => (
                <div key={link.id}>
                  <span>链接 {index + 1}</span>
                  <input value={link.text} onChange={(event) => updateLink(link.id, { text: event.target.value })} placeholder="链接文字" />
                  <input value={link.url} onChange={(event) => updateLink(link.id, { url: event.target.value })} placeholder="https://" />
                  <button type="button" onClick={() => removeLink(link.id)} aria-label={`删除链接 ${index + 1}`}>×</button>
                </div>
              ))}
            </div>
          )}

          <div className={`limit-result-preview ${image ? "custom" : ""}`} style={image ? { backgroundImage: `url(${image})` } : undefined}>
            <article>
              {content.title && <h3>{content.title}</h3>}
              <p>{parseInlineLinkSegments(content).map((segment) => segment.type === "link"
                ? <a key={segment.key} href={segment.url || undefined} onClick={(event) => event.preventDefault()}>{segment.text}</a>
                : <span key={segment.key}>{segment.value}</span>)}</p>
            </article>
          </div>
        </div>
        <footer>
          <button className="secondary-button" onClick={onCancel}>取消</button>
          <button className="primary-button" onClick={() => onSave({ ...template, name: name.trim() || template.name, pageType, image, content })}>保存模板</button>
        </footer>
      </section>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </div>
  );
}
