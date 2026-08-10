import type { LimitPageContent } from "./survey-publication";

export type LotteryPrizeType = "virtual" | "physical" | "code";

export type FixedClaimFieldKey = "name" | "phone" | "address" | "email" | "discordId" | "joymakerId";

export const fixedClaimKeys: FixedClaimFieldKey[] = ["name", "phone", "address", "email", "discordId", "joymakerId"];

export const fixedClaimFieldLabels: Record<FixedClaimFieldKey, string> = {
  name: "姓名",
  phone: "电话",
  address: "地址",
  email: "邮箱",
  discordId: "Discord ID",
  joymakerId: "JoyMaker ID",
};

export const lotteryPrizeTypeLabels: Record<LotteryPrizeType, string> = {
  virtual: "虚拟奖品",
  physical: "实体奖品",
  code: "兑换码",
};

export type LotteryClaimField = { key: string; label: string };

export type LotteryPrize = {
  id: string;
  slot: number;
  name: string;
  image: string;
  type: LotteryPrizeType;
  stock: number;
  codes?: string[];
};

export type LotteryClaimTypeSettings = {
  claimFields: LotteryClaimField[];
  identityCodeEnabled: boolean;
  claimWindowMinutes: number;
};

export const claimWindowOptions: { minutes: number; label: string }[] = [
  { minutes: 5, label: "5 分钟" },
  { minutes: 10, label: "10 分钟" },
  { minutes: 30, label: "30 分钟" },
  { minutes: 60, label: "1 小时" },
  { minutes: 180, label: "3 小时" },
  { minutes: 300, label: "5 小时" },
  { minutes: 720, label: "12 小时" },
  { minutes: 1440, label: "24 小时" },
  { minutes: 2880, label: "48 小时" },
];

export type LotteryClaimSettingsByType = Record<LotteryPrizeType, LotteryClaimTypeSettings>;

export type LotteryResultPageConfig = {
  backgroundMode: "common" | "custom";
  backgroundTemplateId: string;
  background: string;
  content: Record<string, LimitPageContent>;
};

export type LotterySimplePageContent = { title: string; body: string; buttonText: string };

export type LotterySimplePageConfig = {
  content: Record<string, LotterySimplePageContent>;
};

export type LotteryConfig = {
  winRate: number;
  prizes: LotteryPrize[];
  background: string;
  spinPage: LotterySimplePageConfig;
  completePage: LotterySimplePageConfig;
  winPage: LotteryResultPageConfig;
  losePage: LotteryResultPageConfig;
  claimSettingsByType: LotteryClaimSettingsByType;
};

export const LOTTERY_SLOT_COUNT = 8;

export const defaultLotteryConfig: LotteryConfig = {
  winRate: 60,
  prizes: [],
  background: "",
  spinPage: {
    content: {
      "zh-CN": { title: "抽奖进行中…", body: "转盘正在为你抽取奖品，请稍候。", buttonText: "立即抽奖" },
      "en-US": { title: "Drawing in progress…", body: "The wheel is picking your prize, please wait.", buttonText: "Spin now" },
      "zh-TW": { title: "抽獎進行中…", body: "轉盤正在為你抽取獎品，請稍候。", buttonText: "立即抽獎" },
      "th-TH": { title: "กำลังจับรางวัล…", body: "วงล้อกำลังสุ่มรางวัลให้คุณ กรุณารอสักครู่", buttonText: "จับรางวัลเลย" },
    },
  },
  completePage: {
    content: {
      "zh-CN": { title: "抽奖已完成", body: "已提交领奖信息，感谢配合，请留意后续奖励发放。", buttonText: "完成" },
      "en-US": { title: "Draw completed", body: "Your claim info has been submitted, thanks for your patience.", buttonText: "Done" },
      "zh-TW": { title: "抽獎已完成", body: "已提交領獎資訊，感謝配合，請留意後續獎勵發放。", buttonText: "完成" },
      "th-TH": { title: "จับรางวัลเสร็จสิ้น", body: "ส่งข้อมูลรับรางวัลแล้ว ขอบคุณที่ให้ความร่วมมือ", buttonText: "เสร็จสิ้น" },
    },
  },
  winPage: {
    backgroundMode: "common",
    backgroundTemplateId: "project-default",
    background: "",
    content: {
      "zh-CN": { title: "🎉 恭喜中奖！", body: "请留意后续奖励发放，如有疑问可联系发奖人。", links: [] },
      "en-US": { title: "🎉 Congratulations, you won!", body: "Please look out for your reward. Contact us if you have any questions.", links: [] },
      "zh-TW": { title: "🎉 恭喜中獎！", body: "請留意後續獎勵發放，如有疑問可聯繫發獎人。", links: [] },
      "th-TH": { title: "🎉 ยินดีด้วย คุณถูกรางวัล!", body: "โปรดรอรับรางวัล หากมีข้อสงสัยติดต่อผู้มอบรางวัล", links: [] },
    },
  },
  losePage: {
    backgroundMode: "common",
    backgroundTemplateId: "project-default",
    background: "",
    content: {
      "zh-CN": { title: "感谢参与", body: "很遗憾本次未中奖，祝下次好运。", links: [] },
      "en-US": { title: "Thanks for joining", body: "Sorry, you didn't win this time. Good luck next time!", links: [] },
      "zh-TW": { title: "感謝參與", body: "很遺憾本次未中獎，祝下次好運。", links: [] },
      "th-TH": { title: "ขอบคุณที่เข้าร่วม", body: "เสียใจด้วย คุณไม่ถูกรางวัลในครั้งนี้ โชคดีครั้งหน้า", links: [] },
    },
  },
  claimSettingsByType: {
    virtual: { claimFields: [], identityCodeEnabled: false, claimWindowMinutes: 10 },
    physical: {
      claimFields: (["name", "phone", "address"] as FixedClaimFieldKey[]).map((key) => ({ key, label: fixedClaimFieldLabels[key] })),
      identityCodeEnabled: false,
      claimWindowMinutes: 10,
    },
    code: { claimFields: [], identityCodeEnabled: false, claimWindowMinutes: 10 },
  },
};

export function remainingStock(prize: LotteryPrize): number {
  if (prize.type === "code") return prize.codes?.length || 0;
  return Math.max(0, prize.stock || 0);
}

export function parseCodesText(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  );
}

export function createEmptyPrize(slot: number): LotteryPrize {
  return {
    id: `prize-${Date.now()}-${slot}`,
    slot,
    name: "",
    image: "",
    type: "virtual",
    stock: 0,
    codes: [],
  };
}

export function generateIdentityCode(): string {
  return `ID-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export type LotteryDrawOutcome = {
  won: boolean;
  landedSlot: number;
  prize?: LotteryPrize;
  dispensedCode?: string;
  identityCode?: string;
  updatedPrizes: LotteryPrize[];
};

export function drawLottery(config: LotteryConfig, random: () => number = Math.random): LotteryDrawOutcome {
  const eligiblePrizes = config.prizes.filter((prize) => remainingStock(prize) > 0);
  const wonRoll = random() * 100 < config.winRate;

  if (!wonRoll || !eligiblePrizes.length) {
    const landedSlot = Math.floor(random() * LOTTERY_SLOT_COUNT);
    return { won: false, landedSlot, updatedPrizes: config.prizes };
  }

  const totalStock = eligiblePrizes.reduce((sum, prize) => sum + remainingStock(prize), 0);
  let ticket = random() * totalStock;
  let picked = eligiblePrizes[eligiblePrizes.length - 1];
  for (const prize of eligiblePrizes) {
    ticket -= remainingStock(prize);
    if (ticket <= 0) {
      picked = prize;
      break;
    }
  }

  let dispensedCode: string | undefined;
  const identityCode = config.claimSettingsByType?.[picked.type]?.identityCodeEnabled ? generateIdentityCode() : undefined;
  const updatedPrizes = config.prizes.map((prize) => {
    if (prize.id !== picked.id) return prize;
    if (prize.type === "code") {
      const codes = [...(prize.codes || [])];
      dispensedCode = codes.shift();
      return { ...prize, codes };
    }
    return { ...prize, stock: Math.max(0, (prize.stock || 0) - 1) };
  });

  return {
    won: true,
    landedSlot: picked.slot,
    prize: picked,
    dispensedCode,
    identityCode,
    updatedPrizes,
  };
}

export type LotteryClaimStatus = "none" | "pending" | "claimed" | "expired";

export type LotteryDrawRecord = {
  id: string;
  identityKey: string;
  responseId: string;
  prizeId: string | null;
  dispensedCode?: string;
  identityCode?: string;
  claim?: Record<string, string>;
  drawnAt: string;
  claimStatus: LotteryClaimStatus;
  claimDeadline?: string;
  claimedAt?: string;
};

export function loadLotteryDraws(surveyId: string): LotteryDrawRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(window.localStorage.getItem(`joydata-survey-lottery-draws-${surveyId}`) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function saveLotteryDraws(surveyId: string, draws: LotteryDrawRecord[]) {
  window.localStorage.setItem(`joydata-survey-lottery-draws-${surveyId}`, JSON.stringify(draws));
}

export function settleExpiredLotteryDraws(
  config: LotteryConfig,
  draws: LotteryDrawRecord[],
  now: number = Date.now(),
): { config: LotteryConfig; draws: LotteryDrawRecord[]; changed: boolean } {
  let changed = false;
  const prizes = [...config.prizes];

  const updatedDraws = draws.map((draw) => {
    if (draw.claimStatus !== "pending" || !draw.claimDeadline || new Date(draw.claimDeadline).getTime() >= now) {
      return draw;
    }
    changed = true;
    const prizeIndex = prizes.findIndex((prize) => prize.id === draw.prizeId);
    if (prizeIndex >= 0) {
      const prize = prizes[prizeIndex];
      if (prize.type === "code" && draw.dispensedCode) {
        prizes[prizeIndex] = { ...prize, codes: [draw.dispensedCode, ...(prize.codes || [])] };
      } else {
        prizes[prizeIndex] = { ...prize, stock: (prize.stock || 0) + 1 };
      }
    }
    return { ...draw, claimStatus: "expired" as const };
  });

  return { config: changed ? { ...config, prizes } : config, draws: updatedDraws, changed };
}
