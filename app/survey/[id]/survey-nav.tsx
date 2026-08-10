"use client";

import { useRouter } from "next/navigation";

const tabs = [
  ["edit", "编辑器"],
  ["languages", "多语言"],
  ["settings", "设置"],
  ["appearance", "外观"],
  ["publish", "发布"],
  ["analytics", "统计"],
  ["responses", "明细"],
] as const;

export function SurveyNav({
  surveyId,
  active,
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
          onClick={() => router.push(`/survey/${surveyId}/${key}`)}
        >
          {label}
          {key === "languages" && <em>3</em>}
        </button>
      ))}
    </nav>
  );
}
