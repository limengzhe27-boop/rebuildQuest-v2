"use client";

import { useRef, useState } from "react";
import { LotteryPrize, parseCodesText } from "@/lib/survey-lottery";

export function LotteryPrizeEditor({
  prize,
  onCancel,
  onSave,
  onDelete,
}: {
  prize: LotteryPrize;
  onCancel: () => void;
  onSave: (prize: LotteryPrize) => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<LotteryPrize>(prize);
  const [codesText, setCodesText] = useState((draft.codes || []).join("\n"));
  const [notice, setNotice] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function update(patch: Partial<LotteryPrize>) {
    setDraft((current) => ({ ...current, ...patch }));
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
    reader.onload = () => update({ image: String(reader.result || "") });
    reader.readAsDataURL(file);
  }

  function applyCodesText(text: string) {
    setCodesText(text);
    const codes = parseCodesText(text);
    update({ codes, stock: codes.length });
  }

  function importCodesFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      applyCodesText(String(reader.result || ""));
      flash(`已识别 ${parseCodesText(String(reader.result || "")).length} 个兑换码`);
    };
    reader.readAsText(file);
  }

  function save() {
    if (!draft.name.trim()) {
      flash("请填写奖品名称");
      return;
    }
    if (draft.type === "code" && !(draft.codes || []).length) {
      flash("请导入至少一个兑换码");
      return;
    }
    if (draft.type !== "code" && (!draft.stock || draft.stock <= 0)) {
      flash("请填写大于 0 的奖品数量");
      return;
    }
    onSave({ ...draft, name: draft.name.trim() });
  }

  const stockValue = draft.type === "code" ? (draft.codes?.length || 0) : (draft.stock || 0);

  return (
    <div className="preview-backdrop" onMouseDown={onCancel}>
      <section className="component-editor-modal lottery-prize-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <strong>奖品配置</strong>
          <button onClick={onCancel}>×</button>
        </header>
        <div className="component-editor-body">
          <div className="lottery-config-section">
            <h4>基础信息</h4>
            <label><span>奖品名称</span><input value={draft.name} onChange={(event) => update({ name: event.target.value })} placeholder="例如：限定周边" /></label>

            <div className="lottery-image-upload">
              <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(event) => uploadImage(event.target.files?.[0])} />
              {draft.image ? (
                <>
                  <img src={draft.image} alt="" />
                  <div>
                    <button type="button" onClick={() => imageInputRef.current?.click()}>更换图片</button>
                    <button type="button" className="text-danger" onClick={() => update({ image: "" })}>删除图片</button>
                  </div>
                </>
              ) : (
                <div className="lottery-image-upload-empty">
                  <button type="button" onClick={() => imageInputRef.current?.click()}>上传奖品图片</button>
                  <small>用于九宫格和中奖结果展示，支持 JPG / PNG，最大 5MB</small>
                </div>
              )}
            </div>
          </div>

          <div className="lottery-config-section">
            <h4>奖品类型</h4>
            <div className="lottery-type-cards">
              <button type="button" className={draft.type === "virtual" ? "active" : ""} onClick={() => update({ type: "virtual" })}>虚拟奖品</button>
              <button type="button" className={draft.type === "physical" ? "active" : ""} onClick={() => update({ type: "physical" })}>实体奖品</button>
              <button type="button" className={draft.type === "code" ? "active" : ""} onClick={() => update({ type: "code" })}>兑换码</button>
            </div>
          </div>

          {draft.type !== "code" && (
            <div className="lottery-config-section lottery-quantity-claim-config">
              <h4>奖品数量</h4>
              <label><span>奖品数量</span><input type="number" min={1} value={draft.stock || ""} onChange={(event) => update({ stock: Math.max(0, Number(event.target.value)) })} /></label>
            </div>
          )}

          {draft.type === "code" && (
            <div className="lottery-config-section lottery-codes-config">
              <h4>兑换码</h4>
              <input ref={txtInputRef} type="file" accept=".txt" hidden onChange={(event) => importCodesFile(event.target.files?.[0])} />
              <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(event) => importCodesFile(event.target.files?.[0])} />
              <div className="lottery-codes-actions">
                <button type="button" onClick={() => txtInputRef.current?.click()}>上传 txt</button>
                <button type="button" onClick={() => excelInputRef.current?.click()}>上传 Excel</button>
              </div>
              <small>Excel 文件按纯文本方式解析，请确保每行一个兑换码；也可直接在下方粘贴导入。</small>
              <label><span>粘贴导入（每行一个兑换码）</span><textarea value={codesText} onChange={(event) => applyCodesText(event.target.value)} placeholder={"CODE-0001\nCODE-0002"} /></label>
              <div className="lottery-stock-readout">兑换码数量：<strong>{draft.codes?.length || 0}</strong> 个</div>
            </div>
          )}

          <div className="lottery-prize-preview">
            <span className="lottery-prize-preview-image">{draft.image ? <img src={draft.image} alt="" /> : "🎁"}</span>
            <strong>{draft.name || "奖品名称"}</strong>
            <small>剩余：{stockValue > 0 ? stockValue : "未设置"}</small>
          </div>
        </div>
        <footer>
          {onDelete && <button className="text-danger" onClick={onDelete}>删除奖品</button>}
          <button className="secondary-button" onClick={onCancel}>取消</button>
          <button className="primary-button" onClick={save}>保存奖品</button>
        </footer>
      </section>
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </div>
  );
}
