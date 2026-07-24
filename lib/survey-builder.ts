export type QuestionType =
  | "single"
  | "multiple"
  | "text"
  | "rating"
  | "nps"
  | "matrix"
  | "sort"
  | "image"
  | "description";

export type Question = {
  id: string;
  type: QuestionType;
  title: string;
  description: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
};

export const questionLabels: Record<QuestionType, string> = {
  single: "单选题",
  multiple: "多选题",
  text: "文本题",
  rating: "评分题",
  nps: "NPS",
  matrix: "矩阵题",
  sort: "排序题",
  image: "图片选择",
  description: "说明文字",
};

export const defaultQuestions: Question[] = [
  {
    id: "welcome",
    type: "single",
    title: "您对本次先锋测试的整体体验如何？",
    description: "请选择最符合您感受的一项",
    required: true,
    options: ["非常满意", "满意", "一般", "不满意", "非常不满意"],
  },
  {
    id: "nps",
    type: "nps",
    title: "您有多大可能向朋友推荐这款游戏？",
    description: "0 表示完全不可能，10 表示非常可能",
    required: true,
    min: 0,
    max: 10,
  },
  {
    id: "feedback",
    type: "text",
    title: "还有哪些体验可以改进？",
    description: "您的反馈会帮助我们持续优化游戏",
    required: false,
  },
];

export function createQuestion(type: QuestionType): Question {
  const id = `${type}-${Date.now()}`;
  const common = {
    id,
    type,
    title: `新的${questionLabels[type]}`,
    description: "",
    required: false,
  };
  if (type === "single" || type === "multiple" || type === "sort" || type === "image") {
    return { ...common, options: ["选项 1", "选项 2", "选项 3"] };
  }
  if (type === "rating") return { ...common, min: 1, max: 5 };
  if (type === "nps") return { ...common, min: 0, max: 10 };
  if (type === "matrix") return { ...common, options: ["维度 1", "维度 2", "维度 3"] };
  return common;
}

export function loadQuestions(surveyId: string): Question[] {
  if (typeof window === "undefined") return defaultQuestions;
  try {
    const saved = window.localStorage.getItem(`joydata-survey-schema-${surveyId}`);
    return saved ? JSON.parse(saved) : defaultQuestions;
  } catch {
    return defaultQuestions;
  }
}

