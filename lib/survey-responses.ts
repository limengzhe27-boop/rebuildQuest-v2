export type ResponseStatus = "valid" | "invalid";

export type SurveyResponse = {
  id: string;
  submittedAt: string;
  playerId: string;
  country: string;
  locale: string;
  channel: string;
  device: string;
  duration: string;
  status: ResponseStatus;
  satisfaction: string;
  nps: number;
  feedback: string;
  serialNumber: number;
  accountType: "JoyMaker" | "LINE" | "匿名";
  submitIp: string;
  submitOs: string;
  submitBrowser: string;
  sourceParameter: string;
  qualityReason: string;
  submitAddress: string;
  completionTime: string;
  joyUserInfo: string;
  lineUserInfo: string;
  extValue: string;
  answerCount: number;
  formVersion: string;
};

type BaseResponse = Omit<SurveyResponse, "serialNumber" | "accountType" | "submitIp" | "submitOs" | "submitBrowser" | "sourceParameter" | "qualityReason" | "submitAddress" | "completionTime" | "joyUserInfo" | "lineUserInfo" | "extValue" | "answerCount" | "formVersion">;

const baseResponses: BaseResponse[] = [
  { id: "RSP-008421", submittedAt: "2026-07-24 14:31:28", playerId: "JM-5839201", country: "美国", locale: "English", channel: "Discord", device: "Windows", duration: "04:26", status: "valid", satisfaction: "非常满意", nps: 9, feedback: "The battle flow feels much smoother. I hope controller rebinding can be added." },
  { id: "RSP-008420", submittedAt: "2026-07-24 14:29:54", playerId: "LINE-8f2a***", country: "泰国", locale: "ไทย", channel: "Facebook Ads", device: "Android", duration: "03:18", status: "valid", satisfaction: "满意", nps: 8, feedback: "อยากให้ปรับปรุงเวลาโหลดในฉากหลัก" },
  { id: "RSP-008419", submittedAt: "2026-07-24 14:28:07", playerId: "Anonymous", country: "中国台湾", locale: "繁體中文", channel: "Discord", device: "iOS", duration: "02:44", status: "valid", satisfaction: "满意", nps: 9, feedback: "戰鬥很流暢，但新手教學的文字有點多。" },
  { id: "RSP-008418", submittedAt: "2026-07-24 14:21:33", playerId: "JM-9821044", country: "日本", locale: "English", channel: "X / Twitter", device: "Windows", duration: "00:31", status: "invalid", satisfaction: "一般", nps: 5, feedback: "ok" },
  { id: "RSP-008417", submittedAt: "2026-07-24 14:16:42", playerId: "JM-2357810", country: "德国", locale: "English", channel: "Steam 社区", device: "Windows", duration: "05:07", status: "valid", satisfaction: "非常满意", nps: 10, feedback: "Great visual direction and combat feedback. Please improve matchmaking." },
  { id: "RSP-008416", submittedAt: "2026-07-24 14:02:19", playerId: "LINE-71cc***", country: "泰国", locale: "ไทย", channel: "Line 社群", device: "Android", duration: "01:48", status: "invalid", satisfaction: "满意", nps: 7, feedback: "" },
  { id: "RSP-008415", submittedAt: "2026-07-24 13:54:11", playerId: "Anonymous", country: "菲律宾", locale: "English", channel: "Facebook Ads", device: "Android", duration: "03:51", status: "valid", satisfaction: "满意", nps: 8, feedback: "More graphics options for lower-end phones would be helpful." },
  { id: "RSP-008414", submittedAt: "2026-07-24 13:48:06", playerId: "JM-6710328", country: "美国", locale: "English", channel: "Discord", device: "Windows", duration: "04:02", status: "valid", satisfaction: "不满意", nps: 4, feedback: "Matchmaking took too long in my region." },
  { id: "RSP-008413", submittedAt: "2026-07-24 13:32:47", playerId: "JM-4419582", country: "中国台湾", locale: "繁體中文", channel: "Facebook Ads", device: "iOS", duration: "03:36", status: "valid", satisfaction: "非常满意", nps: 10, feedback: "角色設計很棒，期待更多造型。" },
  { id: "RSP-008412", submittedAt: "2026-07-24 13:19:30", playerId: "Anonymous", country: "英国", locale: "English", channel: "Steam 社区", device: "Windows", duration: "04:49", status: "valid", satisfaction: "满意", nps: 8, feedback: "The UI is clean, but some tooltips could be clearer." },
  { id: "RSP-008411", submittedAt: "2026-07-24 13:06:12", playerId: "LINE-2d91***", country: "泰国", locale: "ไทย", channel: "Line 社群", device: "iOS", duration: "02:57", status: "valid", satisfaction: "满意", nps: 8, feedback: "ชอบตัวละครและระบบต่อสู้มาก" },
  { id: "RSP-008410", submittedAt: "2026-07-24 12:51:04", playerId: "JM-0064132", country: "加拿大", locale: "English", channel: "Discord", device: "Windows", duration: "04:15", status: "valid", satisfaction: "非常满意", nps: 9, feedback: "Good first impression. Would like a more detailed performance overlay." },
];

const ipPool = ["23.81.44.***", "171.96.82.***", "61.220.31.***", "133.18.92.***", "91.46.73.***", "49.229.18.***"];
const browserByDevice: Record<string, string> = { Windows: "Chrome 126", Android: "Chrome Mobile", iOS: "Safari Mobile" };
const sourceByChannel: Record<string, string> = {
  Discord: "source=discord",
  "Facebook Ads": "source=fb_ads",
  "X / Twitter": "source=x_campaign",
  "Steam 社区": "source=steam",
  "Line 社群": "source=line_group",
};

export const surveyResponses: SurveyResponse[] = baseResponses.map((item, index) => ({
  ...item,
  serialNumber: 8421 - index,
  accountType: item.playerId.startsWith("JM-") ? "JoyMaker" : item.playerId.startsWith("LINE-") ? "LINE" : "匿名",
  submitIp: ipPool[index % ipPool.length],
  submitOs: item.device === "Windows" ? "Windows 11" : item.device === "Android" ? "Android 15" : "iOS 19",
  submitBrowser: browserByDevice[item.device] || "WebView",
  sourceParameter: sourceByChannel[item.channel] || "source=direct",
  submitAddress: item.country,
  completionTime: item.duration,
  joyUserInfo: item.playerId.startsWith("JM-") ? `${item.playerId} · 已授权` : "—",
  lineUserInfo: item.playerId.startsWith("LINE-") ? `${item.playerId} · 已授权` : "—",
  extValue: `region=${item.country};device=${item.device}`,
  answerCount: item.feedback ? 3 : 2,
  formVersion: "v3.6",
  qualityReason:
    item.id === "RSP-008418"
      ? "填写时长仅 31 秒，触发极速提交规则，判定为无效"
      : item.status === "invalid"
        ? "同一 LINE 账号与设备重复提交，人工复核后判为无效"
        : "必答题完整，未命中重复、极速或异常答案规则",
}));

export const responseStatusLabel: Record<ResponseStatus, string> = {
  valid: "有效",
  invalid: "无效",
};
