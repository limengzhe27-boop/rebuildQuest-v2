export type QuestionType =
  | "single"
  | "multiple"
  | "text"
  | "textarea"
  | "date"
  | "rating"
  | "file"
  | "imageUpload"
  | "nps"
  | "dropdown"
  | "cascade"
  | "city"
  | "provinceCity"
  | "globalProvinceCity"
  | "location"
  | "phone"
  | "ocr"
  | "random"
  | "product"
  | "appointmentDate"
  | "appointmentSlot"
  | "matrix"
  | "matrixFill"
  | "matrixSelect"
  | "matrixScale"
  | "matrixSlider"
  | "matrixDropdown"
  | "tableSelect"
  | "sort"
  | "image"
  | "pageBreak"
  | "divider"
  | "button"
  | "imageDisplay"
  | "carousel"
  | "description";

export type Question = {
  id: string;
  type: QuestionType;
  title: string;
  description: string;
  required: boolean;
  options?: string[];
  maxSelections?: number;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  helpText?: string;
  referenceImage?: string;
  matrixRows?: string[];
  matrixColumns?: string[];
  displayLogic?: {
    match: "all" | "any";
    conditions: {
      questionId: string;
      operator: "等于" | "不等于" | "包含" | "不包含" | "大于" | "大于等于" | "小于" | "小于等于" | "为空" | "不为空" | "已选中" | "未选中";
      value: string;
      matrixScope?: "cell" | "row" | "any-row" | "sum" | "average" | "minimum";
      matrixRow?: string;
      matrixColumn?: string;
    }[];
  };
};

export const questionLabels: Record<QuestionType, string> = {
  single: "单选题",
  multiple: "多选题",
  text: "单行文本",
  textarea: "多行文本",
  date: "日期时间",
  rating: "评分组件",
  file: "文件上传",
  imageUpload: "图片上传",
  nps: "NPS组件",
  dropdown: "下拉选择",
  cascade: "级联选择",
  city: "省市联动（旧）",
  provinceCity: "省市联动",
  globalProvinceCity: "全球省市联动",
  location: "地理位置",
  phone: "手机号验证",
  ocr: "文字识别",
  random: "随机编号",
  product: "商品",
  appointmentDate: "预约日期",
  appointmentSlot: "预约时间段",
  matrix: "矩阵题",
  matrixFill: "矩阵填空",
  matrixSelect: "矩阵选择",
  matrixScale: "矩阵量表",
  matrixSlider: "矩阵滑块",
  matrixDropdown: "矩阵下拉",
  tableSelect: "表格选择",
  sort: "排序题型",
  image: "图片选择",
  pageBreak: "分页组件",
  divider: "分割线",
  button: "按钮组件",
  imageDisplay: "图片展示",
  carousel: "图片轮播",
  description: "文字描述",
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
  if (["single", "multiple", "sort", "image", "dropdown", "cascade", "tableSelect"].includes(type)) {
    return { ...common, options: ["选项 1", "选项 2", "选项 3"], ...(type === "multiple" ? { maxSelections: undefined } : {}) };
  }
  if (type === "rating") return { ...common, min: 1, max: 5, minLabel: "非常不满意", maxLabel: "非常满意" };
  if (type === "nps") return { ...common, min: 0, max: 10 };
  if (["matrix", "matrixFill", "matrixSelect", "matrixScale", "matrixSlider", "matrixDropdown"].includes(type)) {
    return {
      ...common,
      options: ["选项 1", "选项 2", "选项 3"],
      matrixRows: ["行 1", "行 2", "行 3"],
      matrixColumns: type === "matrixScale" || type === "matrixSlider"
        ? ["1", "2", "3", "4", "5"]
        : ["列 1", "列 2", "列 3"],
    };
  }
  return common;
}

export function loadQuestions(surveyId: string): Question[] {
  if (typeof window === "undefined") return defaultQuestions;
  try {
    const saved = window.localStorage.getItem(`joydata-survey-schema-${surveyId}`);
    if (!saved) return defaultQuestions;
    const parsed = JSON.parse(saved) as (Omit<Question, "displayLogic"> & {
      displayLogic?: Question["displayLogic"] | {
        questionId: string;
        operator: "等于" | "不等于" | "包含" | "不包含" | "大于" | "大于等于" | "小于" | "小于等于" | "为空" | "不为空";
        value: string;
        matrixScope?: "cell" | "row" | "any-row" | "sum" | "average" | "minimum";
        matrixRow?: string;
        matrixColumn?: string;
      };
    })[];
    return parsed.map((question) => {
      const logic = question.displayLogic;
      if (!logic || "conditions" in logic) return question as Question;
      return {
        ...question,
        displayLogic: {
          match: "all",
          conditions: [{
            questionId: logic.questionId,
            operator: logic.operator,
            value: logic.value,
            matrixScope: logic.matrixScope,
            matrixRow: logic.matrixRow,
            matrixColumn: logic.matrixColumn,
          }],
        },
      } as Question;
    });
  } catch {
    return defaultQuestions;
  }
}
