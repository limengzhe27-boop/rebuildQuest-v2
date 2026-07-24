"use client";

import { useEffect, useState } from "react";

type StoredSurvey = {
  id: number | string;
  name: string;
};

export function useSurveyTitle(surveyId: string) {
  const [title, setTitle] = useState("RO3 先锋测试玩家体验调研");

  useEffect(() => {
    try {
      const drafts = JSON.parse(
        window.localStorage.getItem("joydata-survey-drafts") || "[]",
      ) as StoredSurvey[];
      const current = drafts.find((item) => String(item.id) === String(surveyId));
      if (current?.name) setTitle(current.name);
    } catch {
      // 演示数据损坏时使用默认标题，避免阻断评审流程。
    }
  }, [surveyId]);

  return title;
}
