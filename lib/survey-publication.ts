export type Region = "global" | "china";
export type AccessMode = "public" | "channel" | "assigned";

export type Publication = {
  id: string;
  name: string;
  region: Region;
  status: "draft" | "active" | "stopped";
  accessMode: AccessMode;
  defaultLocale: string;
  browserMatch: boolean;
  allowLanguageSwitch: boolean;
  startAt: string;
  endAt: string;
  scheduleEnabled: boolean;
  quotaEnabled: boolean;
  graceMinutes: number;
  totalLimit: number;
  perAccountLimit: number;
  deviceLimit: boolean;
  anonymous: boolean;
  privacyConsent: boolean;
  ageConsent: boolean;
  completionMode: "message" | "redirect";
  completionMessage: string;
  closedMessage: string;
  stoppedAt?: string;
  stopReason?: string;
  redirectUrl: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  slug: string;
};

const now = "2026-07-24T16:00";
const nextMonth = "2026-08-31T23:59";

export const defaultPublications: Publication[] = [
  {
    id: "pub-global",
    name: "海外玩家正式投放",
    region: "global",
    status: "draft",
    accessMode: "channel",
    defaultLocale: "en-US",
    browserMatch: true,
    allowLanguageSwitch: true,
    startAt: now,
    endAt: nextMonth,
    scheduleEnabled: true,
    quotaEnabled: true,
    graceMinutes: 10,
    totalLimit: 10000,
    perAccountLimit: 1,
    deviceLimit: true,
    anonymous: true,
    privacyConsent: true,
    ageConsent: true,
    completionMode: "message",
    completionMessage: "Thank you! Your feedback has been submitted.",
    closedMessage: "This survey has ended. Thank you for your interest.",
    redirectUrl: "",
    webhookEnabled: false,
    webhookUrl: "",
    slug: "ro3-global-beta",
  },
  {
    id: "pub-china",
    name: "国内测试服投放",
    region: "china",
    status: "draft",
    accessMode: "assigned",
    defaultLocale: "zh-CN",
    browserMatch: false,
    allowLanguageSwitch: false,
    startAt: now,
    endAt: nextMonth,
    scheduleEnabled: true,
    quotaEnabled: true,
    graceMinutes: 10,
    totalLimit: 3000,
    perAccountLimit: 1,
    deviceLimit: true,
    anonymous: false,
    privacyConsent: true,
    ageConsent: false,
    completionMode: "message",
    completionMessage: "提交成功，感谢您的反馈。",
    closedMessage: "本次问卷收集已结束，感谢您的关注。",
    redirectUrl: "",
    webhookEnabled: false,
    webhookUrl: "",
    slug: "ro3-cn-beta",
  },
];

export function loadPublications(surveyId: string): Publication[] {
  if (typeof window === "undefined") return defaultPublications;
  try {
    const saved = window.localStorage.getItem(`joydata-survey-publications-${surveyId}`);
    if (!saved) return defaultPublications;
    const parsed = JSON.parse(saved) as Publication[];
    return parsed.map((item) => ({
      ...defaultPublications.find((preset) => preset.region === item.region),
      ...item,
    }));
  } catch {
    return defaultPublications;
  }
}

export function publicationUrl(publication: Publication) {
  const host =
    publication.region === "global"
      ? "https://survey.roglobal.com"
      : "https://survey.123u.com";
  return `${host}/s/${publication.slug}`;
}
