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

export type LimitPageContent = {
  title: string;
  body: string;
  links: Array<{
    id: string;
    text: string;
    url: string;
  }>;
  linkText?: string;
  linkUrl?: string;
};

export type EndPageTemplate = { id: string; name: string; image: string; content?: LimitPageContent };

export function loadEndPageTemplates(): EndPageTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("joydata-survey-end-background-templates") || "[]");
  } catch {
    return [];
  }
}

export function saveEndPageTemplates(templates: EndPageTemplate[]) {
  window.localStorage.setItem("joydata-survey-end-background-templates", JSON.stringify(templates));
}

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
  dailyWindowEnabled: boolean;
  dailyStartTime: string;
  dailyEndTime: string;
  quotaEnabled: boolean;
  graceMinutes: number;
  totalLimit: number;
  perAccountLimit: number;
  accountLimitEnabled: boolean;
  joymakerUniqueSubmission: boolean;
  deviceLimit: boolean;
  perDeviceLimit: number;
  ipLimit: boolean;
  perIpLimit: number;
  lineLimitEnabled: boolean;
  perLineLimit: number;
  anonymous: boolean;
  resumeEnabled: boolean;
  prefillLastSubmission: boolean;
  captureUserProfile: boolean;
  accessGate: AccessGate;
  accessPassword: string;
  joymakerLogin: boolean;
  identityValidationEnabled: boolean;
  identityMismatchAction: "login" | "official";
  identityMismatchRedirects: Record<string, string>;
  identityMismatchFallbackLocale: string;
  lineLogin: boolean;
  privacyConsent: boolean;
  ageConsent: boolean;
  completionMode: "message" | "redirect";
  completionMessage: string;
  completionImage: string;
  closedMessage: string;
  closedImage: string;
  closedPageBackgroundMode: "common" | "custom";
  closedPageBackgroundTemplateId: string;
  closedPageBackground: string;
  closedPageContent: Record<string, LimitPageContent>;
  limitPageBackgroundMode: "common" | "custom";
  limitPageBackgroundTemplateId: string;
  limitPageBackground: string;
  limitPageContent: Record<string, LimitPageContent>;
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
    dailyWindowEnabled: false,
    dailyStartTime: "09:00",
    dailyEndTime: "22:00",
    quotaEnabled: true,
    graceMinutes: 10,
    totalLimit: 10000,
    perAccountLimit: 1,
    accountLimitEnabled: true,
    joymakerUniqueSubmission: false,
    deviceLimit: true,
    perDeviceLimit: 1,
    ipLimit: false,
    perIpLimit: 1,
    lineLimitEnabled: false,
    perLineLimit: 1,
    anonymous: true,
    resumeEnabled: true,
    prefillLastSubmission: false,
    captureUserProfile: false,
    accessGate: "open",
    accessPassword: "",
    joymakerLogin: true,
    identityValidationEnabled: true,
    identityMismatchAction: "login",
    identityMismatchRedirects: {
      "zh-CN": "",
      "en-US": "",
      "zh-TW": "",
      "th-TH": "",
    },
    identityMismatchFallbackLocale: "en-US",
    lineLogin: true,
    privacyConsent: true,
    ageConsent: true,
    completionMode: "message",
    completionMessage: "Thank you! Your feedback has been submitted.",
    completionImage: "",
    closedMessage: "This survey has ended. Thank you for your interest.",
    closedImage: "",
    closedPageBackgroundMode: "common",
    closedPageBackgroundTemplateId: "project-default",
    closedPageBackground: "",
    closedPageContent: {
      "en-US": { title: "This survey has ended", body: "Thank you for your interest. This survey is no longer accepting responses.", links: [] },
      "zh-CN": { title: "本次问卷收集已结束", body: "感谢您的关注，本次问卷暂不再接收新的答卷。", links: [] },
      "zh-TW": { title: "本次問卷收集已結束", body: "感謝您的關注，本次問卷暫不再接收新的答卷。", links: [] },
      "th-TH": { title: "แบบสำรวจนี้สิ้นสุดแล้ว", body: "ขอบคุณที่สนใจ แบบสำรวจนี้ไม่รับคำตอบเพิ่มเติมแล้ว", links: [] },
    },
    limitPageBackgroundMode: "common",
    limitPageBackgroundTemplateId: "project-default",
    limitPageBackground: "",
    limitPageContent: {
      "en-US": { title: "You have completed this survey", body: "Thank you for participating. This account or environment has reached the submission limit.", links: [] },
      "zh-CN": { title: "您已完成本次问卷", body: "感谢您的参与，当前账号或填写环境已达到提交次数限制。", links: [] },
      "zh-TW": { title: "您已完成本次問卷", body: "感謝您的參與，目前帳號或填寫環境已達提交次數限制。", links: [] },
      "th-TH": { title: "คุณทำแบบสอบถามนี้เสร็จแล้ว", body: "ขอบคุณที่เข้าร่วม บัญชีหรือสภาพแวดล้อมนี้ถึงขีดจำกัดการส่งแล้ว", links: [] },
    },
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
    dailyWindowEnabled: false,
    dailyStartTime: "09:00",
    dailyEndTime: "22:00",
    quotaEnabled: true,
    graceMinutes: 10,
    totalLimit: 3000,
    perAccountLimit: 1,
    accountLimitEnabled: true,
    joymakerUniqueSubmission: false,
    deviceLimit: true,
    perDeviceLimit: 1,
    ipLimit: false,
    perIpLimit: 1,
    lineLimitEnabled: false,
    perLineLimit: 1,
    anonymous: false,
    resumeEnabled: true,
    prefillLastSubmission: false,
    captureUserProfile: true,
    accessGate: "account",
    accessPassword: "",
    joymakerLogin: true,
    identityValidationEnabled: true,
    identityMismatchAction: "login",
    identityMismatchRedirects: {
      "zh-CN": "",
      "en-US": "",
      "zh-TW": "",
      "th-TH": "",
    },
    identityMismatchFallbackLocale: "zh-CN",
    lineLogin: false,
    privacyConsent: true,
    ageConsent: false,
    completionMode: "message",
    completionMessage: "提交成功，感谢您的反馈。",
    completionImage: "",
    closedMessage: "本次问卷收集已结束，感谢您的关注。",
    closedImage: "",
    closedPageBackgroundMode: "common",
    closedPageBackgroundTemplateId: "project-default",
    closedPageBackground: "",
    closedPageContent: {
      "zh-CN": { title: "本次问卷收集已结束", body: "感谢您的关注，本次问卷暂不再接收新的答卷。", links: [] },
      "en-US": { title: "This survey has ended", body: "Thank you for your interest. This survey is no longer accepting responses.", links: [] },
      "zh-TW": { title: "本次問卷收集已結束", body: "感謝您的關注，本次問卷暫不再接收新的答卷。", links: [] },
      "th-TH": { title: "แบบสำรวจนี้สิ้นสุดแล้ว", body: "ขอบคุณที่สนใจ แบบสำรวจนี้ไม่รับคำตอบเพิ่มเติมแล้ว", links: [] },
    },
    limitPageBackgroundMode: "common",
    limitPageBackgroundTemplateId: "project-default",
    limitPageBackground: "",
    limitPageContent: {
      "zh-CN": { title: "您已完成本次问卷", body: "感谢您的参与，当前账号或填写环境已达到提交次数限制。", links: [] },
      "en-US": { title: "You have completed this survey", body: "Thank you for participating. This account or environment has reached the submission limit.", links: [] },
      "zh-TW": { title: "您已完成本次問卷", body: "感謝您的參與，目前帳號或填寫環境已達提交次數限制。", links: [] },
      "th-TH": { title: "คุณทำแบบสอบถามนี้เสร็จแล้ว", body: "ขอบคุณที่เข้าร่วม บัญชีหรือสภาพแวดล้อมนี้ถึงขีดจำกัดการส่งแล้ว", links: [] },
    },
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

function normalizeLimitContent(content: Record<string, LimitPageContent> = {}) {
  return Object.fromEntries(
    Object.entries(content).map(([locale, item]) => {
      const legacyLink = item.linkText
        ? [{ id: "legacy-link", text: item.linkText, url: item.linkUrl || "" }]
        : [];
      const hasLegacyToken = item.linkText && !item.body.includes("{{legacy-link}}");
      return [
        locale,
        {
          title: item.title || "",
          body: hasLegacyToken ? `${item.body} {{legacy-link}}` : item.body || "",
          links: Array.isArray(item.links) ? item.links : legacyLink,
        },
      ];
    }),
  ) as Record<string, LimitPageContent>;
}

function normalizePublication(item: Publication): Publication {
  const preset = defaultPublications.find((candidate) => candidate.region === item.region);
  const merged = { ...preset, ...item } as Publication;
  return {
    ...merged,
    identityMismatchAction: merged.identityMismatchAction || "login",
    limitPageContent: normalizeLimitContent(merged.limitPageContent),
    closedPageContent: normalizeLimitContent(merged.closedPageContent || {
      [merged.defaultLocale || "zh-CN"]: {
        title: merged.defaultLocale === "en-US" ? "This survey has ended" : "本次问卷收集已结束",
        body: merged.closedMessage || "本次问卷收集已结束，感谢您的关注。",
        links: [],
      },
    }),
  };
}

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
        .map(normalizePublication);
    }
    const parsed = JSON.parse(saved) as Publication[];
    const inWorkspace = parsed.filter((item) => item.region === workspaceRegion);
    const source = inWorkspace.length
      ? inWorkspace
      : defaultPublications.filter((item) => item.region === workspaceRegion);
    return source.map(normalizePublication);
  } catch {
    const fallbackRegion: Region = ["4", "5"].includes(String(surveyId)) ? "china" : "global";
    return defaultPublications
      .filter((item) => item.region === fallbackRegion)
      .map(normalizePublication);
  }
}

export function publicationUrl(publication: Publication) {
  const host =
    publication.region === "global"
      ? "https://survey.roglobal.com"
      : "https://survey.123u.com";
  return `${host}/s/${publication.slug}`;
}
