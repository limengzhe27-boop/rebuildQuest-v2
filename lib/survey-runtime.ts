import { Question } from "./survey-builder";

export type RuntimeLocale = "zh-CN" | "en-US" | "zh-TW" | "th-TH" | "ko-KR" | "ja-JP" | "id-ID";

export const runtimeLocales: Record<RuntimeLocale, string> = {
  "zh-CN": "简体中文",
  "en-US": "English",
  "zh-TW": "繁體中文",
  "th-TH": "ไทย",
  "ko-KR": "한국어",
  "ja-JP": "日本語",
  "id-ID": "Bahasa Indonesia",
};

export type MatrixAnswer = Record<string, string | string[] | number>;
export type SurveyAnswer = string | string[] | number | MatrixAnswer;

export type VipLevel = "无" | "铜牌" | "银牌" | "金牌" | "钻石";

export const vipLevels: VipLevel[] = ["无", "铜牌", "银牌", "金牌", "钻石"];

export type LiveSurveyResponse = {
  id: string;
  surveyId: string;
  submittedAt: string;
  locale: RuntimeLocale;
  durationSeconds: number;
  answers: Record<string, SurveyAnswer>;
  questions: Pick<Question, "id" | "title" | "type">[];
  source: string;
  joymakerId?: string;
  lineId?: string;
  clientIp?: string;
  vipLevel?: VipLevel;
  status: "valid";
};

export function matchRuntimeLocale(
  requested: string | null | undefined,
): RuntimeLocale | null {
  if (!requested) return null;
  const normalized = requested.toLowerCase();
  if (requested === "简中") return "zh-CN";
  if (requested === "繁中") return "zh-TW";
  if (requested === "ไทย") return "th-TH";
  if (requested === "한국어") return "ko-KR";
  if (requested === "日本語") return "ja-JP";
  if (requested === "ID" || requested === "Bahasa Indonesia") return "id-ID";
  if (normalized === "en") return "en-US";
  if (normalized.startsWith("zh-tw") || normalized.startsWith("zh-hk")) return "zh-TW";
  if (normalized.startsWith("zh")) return "zh-CN";
  if (normalized.startsWith("th")) return "th-TH";
  if (normalized.startsWith("en")) return "en-US";
  if (normalized.startsWith("ko")) return "ko-KR";
  if (normalized.startsWith("ja")) return "ja-JP";
  if (normalized.startsWith("id")) return "id-ID";
  return null;
}

export const defaultQuestionTranslations: Record<
  RuntimeLocale,
  Record<string, { title: string; description?: string; options?: string[] }>
> = {
  "zh-CN": {},
  "en-US": {
    welcome: {
      title: "How satisfied are you with your overall experience in this pioneer test?",
      description: "Select the option that best matches your experience.",
      options: ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"],
    },
    nps: {
      title: "How likely are you to recommend this game to a friend?",
      description: "0 means not at all likely, and 10 means extremely likely.",
    },
    feedback: {
      title: "What else can we improve?",
      description: "Your feedback will help us improve the game.",
    },
  },
  "zh-TW": {
    welcome: {
      title: "您對本次先鋒測試的整體體驗如何？",
      description: "請選擇最符合您感受的一項。",
      options: ["非常滿意", "滿意", "一般", "不滿意", "非常不滿意"],
    },
    nps: {
      title: "您有多大可能向朋友推薦這款遊戲？",
      description: "0 表示完全不可能，10 表示非常可能。",
    },
    feedback: {
      title: "還有哪些體驗可以改進？",
      description: "您的回饋將幫助我們持續改善遊戲。",
    },
  },
  "th-TH": {
    welcome: {
      title: "คุณพึงพอใจกับประสบการณ์โดยรวมของการทดสอบครั้งนี้มากน้อยเพียงใด",
      description: "เลือกตัวเลือกที่ตรงกับความรู้สึกของคุณมากที่สุด",
      options: ["พอใจมาก", "พอใจ", "ปานกลาง", "ไม่พอใจ", "ไม่พอใจมาก"],
    },
    nps: {
      title: "คุณมีแนวโน้มที่จะแนะนำเกมนี้ให้เพื่อนมากน้อยเพียงใด",
      description: "0 หมายถึงไม่แนะนำเลย และ 10 หมายถึงแนะนำอย่างยิ่ง",
    },
    feedback: {
      title: "มีส่วนใดที่เราควรปรับปรุงเพิ่มเติม",
      description: "ความคิดเห็นของคุณจะช่วยให้เราปรับปรุงเกมได้ดียิ่งขึ้น",
    },
  },
  "ko-KR": {},
  "ja-JP": {},
  "id-ID": {},
};
