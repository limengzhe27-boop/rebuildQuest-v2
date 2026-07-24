"use client";

import { useRouter } from "next/navigation";

const tabs = [
  ["edit", "编辑器"],
  ["languages", "多语言"],
  ["logic", "逻辑"],
  ["appearance", "外观"],
  ["publish", "发布与回收"],
  ["responses", "答卷数据"],
  ["analytics", "分析"],
];

export function SurveyNav({
  surveyId,
  active,
  onNotice,
}: {
  surveyId: string;
  active: string;
  onNotice?: (message: string) => void;
}) {
  const router = useRouter();

  return (
    <nav className="survey-product-nav" aria-label="问卷功能导航">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          className={active === key ? "active" : ""}
          onClick={() => {
            if (
              key === "edit" ||
              key === "languages" ||
              key === "publish" ||
              key === "responses" ||
              key === "analytics"
            ) {
              router.push(`/survey/${surveyId}/${key}`);
            } else {
              onNotice?.(`${label}将在后续阶段开放`);
            }
          }}
        >
          {label}
          {key === "languages" && <em>3</em>}
        </button>
      ))}
    </nav>
  );
}
