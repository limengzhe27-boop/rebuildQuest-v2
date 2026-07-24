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
  totalLimit: number;
  perAccountLimit: number;
  deviceLimit: boolean;
  anonymous: boolean;
  privacyConsent: boolean;
  ageConsent: boolean;
  completionMode: "message" | "redirect";
  completionMessage: string;
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
    totalLimit: 10000,
    perAccountLimit: 1,
    deviceLimit: true,
    anonymous: true,
    privacyConsent: true,
    ageConsent: true,
    completionMode: "message",
    completionMessage: "Thank you! Your feedback has been submitted.",
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
    totalLimit: 3000,
    perAccountLimit: 1,
    deviceLimit: true,
    anonymous: false,
    privacyConsent: true,
    ageConsent: false,
    completionMode: "message",
    completionMessage: "提交成功，感谢您的反馈。",
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
    return saved ? JSON.parse(saved) : defaultPublications;
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
