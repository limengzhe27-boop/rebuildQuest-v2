export type Region = "global" | "china";
export type AccessMode = "public" | "channel" | "assigned";
export type AccessGate = "open" | "password" | "account";
export type RedirectRule = {
  id: string;
  questionId: string;
  operator: "等于" | "不等于" | "包含" | "不包含";
  value: string;
  url: string;
};
export type PublicationChannel = {
  id: string;
  name: string;
  parameter: string;
  locale: string;
  enabled: boolean;
};

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
  accountLimitEnabled: boolean;
  deviceLimit: boolean;
  perDeviceLimit: number;
  ipLimit: boolean;
  perIpLimit: number;
  anonymous: boolean;
  resumeEnabled: boolean;
  prefillLastSubmission: boolean;
  captureUserProfile: boolean;
  accessGate: AccessGate;
  accessPassword: string;
  joymakerLogin: boolean;
  lineLogin: boolean;
  privacyConsent: boolean;
  ageConsent: boolean;
  completionMode: "message" | "redirect";
  completionMessage: string;
  closedMessage: string;
  stoppedAt?: string;
  stopReason?: string;
  redirectUrl: string;
  redirectRules: RedirectRule[];
  channels: PublicationChannel[];
  webhookEnabled: boolean;
  webhookMethod: "POST" | "GET";
  webhookUrl: string;
  webhookSecret: string;
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
    accountLimitEnabled: true,
    deviceLimit: true,
    perDeviceLimit: 1,
    ipLimit: false,
    perIpLimit: 1,
    anonymous: true,
    resumeEnabled: true,
    prefillLastSubmission: false,
    captureUserProfile: false,
    accessGate: "open",
    accessPassword: "",
    joymakerLogin: true,
    lineLogin: true,
    privacyConsent: true,
    ageConsent: true,
    completionMode: "message",
    completionMessage: "Thank you! Your feedback has been submitted.",
    closedMessage: "This survey has ended. Thank you for your interest.",
    redirectUrl: "",
    redirectRules: [],
    channels: [
      { id: "discord", name: "Discord 社区", parameter: "source=discord", locale: "en-US", enabled: true },
      { id: "facebook", name: "Facebook Ads", parameter: "source=fb_ads", locale: "en-US", enabled: true },
    ],
    webhookEnabled: false,
    webhookMethod: "POST",
    webhookUrl: "",
    webhookSecret: "",
    slug: "ro3-global-beta",
  },
  {
    id: "pub-china",
    name: "国内测试服投放",
    region: "china",
    status: "draft",
    accessMode: "public",
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
    accountLimitEnabled: true,
    deviceLimit: true,
    perDeviceLimit: 1,
    ipLimit: false,
    perIpLimit: 1,
    anonymous: false,
    resumeEnabled: true,
    prefillLastSubmission: false,
    captureUserProfile: true,
    accessGate: "account",
    accessPassword: "",
    joymakerLogin: true,
    lineLogin: false,
    privacyConsent: true,
    ageConsent: false,
    completionMode: "message",
    completionMessage: "提交成功，感谢您的反馈。",
    closedMessage: "本次问卷收集已结束，感谢您的关注。",
    redirectUrl: "",
    redirectRules: [],
    channels: [],
    webhookEnabled: false,
    webhookMethod: "POST",
    webhookUrl: "",
    webhookSecret: "",
    slug: "ro3-cn-beta",
  },
];

export function loadPublications(surveyId: string): Publication[] {
  if (typeof window === "undefined") return defaultPublications;
  try {
    const drafts = JSON.parse(
      window.localStorage.getItem("joydata-survey-drafts") || "[]",
    ) as { id: string | number; region?: "海外" | "国内" }[];
    const draft = drafts.find((item) => String(item.id) === String(surveyId));
    const workspaceRegion: Region =
      ["4", "5"].includes(String(surveyId)) || draft?.region === "国内"
        ? "china"
        : "global";
    const saved = window.localStorage.getItem(`joydata-survey-publications-${surveyId}`);
    if (!saved) {
      return defaultPublications
        .filter((item) => item.region === workspaceRegion)
        .map((item) => ({ ...item }));
    }
    const parsed = JSON.parse(saved) as Publication[];
    const inWorkspace = parsed.filter((item) => item.region === workspaceRegion);
    const source = inWorkspace.length
      ? inWorkspace
      : defaultPublications.filter((item) => item.region === workspaceRegion);
    return source.map((item) => ({
        ...defaultPublications.find((preset) => preset.region === item.region),
        ...item,
      }));
  } catch {
    const fallbackRegion: Region = ["4", "5"].includes(String(surveyId)) ? "china" : "global";
    return defaultPublications
      .filter((item) => item.region === fallbackRegion)
      .map((item) => ({ ...item }));
  }
}

export function publicationUrl(publication: Publication) {
  const host =
    publication.region === "global"
      ? "https://survey.roglobal.com"
      : "https://survey.123u.com";
  return `${host}/s/${publication.slug}`;
}
