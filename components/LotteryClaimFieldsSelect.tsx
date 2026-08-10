"use client";

import { useState } from "react";
import {
  FixedClaimFieldKey,
  fixedClaimFieldLabels,
  fixedClaimKeys,
  LotteryClaimField,
} from "@/lib/survey-lottery";

export function LotteryClaimFieldsSelect({
  value,
  onChange,
}: {
  value: LotteryClaimField[];
  onChange: (fields: LotteryClaimField[]) => void;
}) {
  const [customFieldName, setCustomFieldName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const customFields = value.filter((field) => field.key.startsWith("custom-"));
  const isFixedChecked = (key: FixedClaimFieldKey) => value.some((field) => field.key === key);

  function toggleFixedField(key: FixedClaimFieldKey) {
    const exists = value.some((field) => field.key === key);
    onChange(
      exists
        ? value.filter((field) => field.key !== key)
        : [...value, { key, label: fixedClaimFieldLabels[key] }],
    );
  }

  function addCustomField() {
    const label = customFieldName.trim();
    if (!label) return;
    onChange([...value, { key: `custom-${Date.now()}`, label }]);
    setCustomFieldName("");
  }

  function removeField(key: string) {
    onChange(value.filter((field) => field.key !== key));
  }

  return (
    <details className="lottery-claim-multiselect" open={menuOpen} onToggle={(event) => setMenuOpen((event.target as HTMLDetailsElement).open)}>
      <summary>
        {value.length ? (
          <div className="lottery-claim-multiselect-chips">
            {value.map((field) => (
              <span key={field.key} className="lottery-claim-chip">
                {field.label}
                <i
                  role="button"
                  tabIndex={-1}
                  aria-label={`移除字段 ${field.label}`}
                  onClick={(event) => { event.preventDefault(); event.stopPropagation(); removeField(field.key); }}
                >×</i>
              </span>
            ))}
          </div>
        ) : (
          <span className="lottery-claim-multiselect-placeholder">请选择用户填写的信息</span>
        )}
        <em>⌄</em>
      </summary>
      <div className="lottery-claim-multiselect-panel">
        {fixedClaimKeys.map((key) => (
          <button
            type="button"
            key={key}
            className={isFixedChecked(key) ? "selected" : ""}
            onClick={() => toggleFixedField(key)}
          >
            <i>{isFixedChecked(key) ? "✓" : ""}</i>{fixedClaimFieldLabels[key]}
          </button>
        ))}
        {customFields.map((field) => (
          <button
            type="button"
            key={field.key}
            className="selected"
            onClick={() => removeField(field.key)}
          >
            <i>✓</i>{field.label}
          </button>
        ))}
        <div className="lottery-add-custom-field">
          <input value={customFieldName} onChange={(event) => setCustomFieldName(event.target.value)} placeholder="自定义字段名称，例如：游戏角色名" />
          <button type="button" onClick={addCustomField}>＋ 添加自定义字段</button>
        </div>
      </div>
    </details>
  );
}
