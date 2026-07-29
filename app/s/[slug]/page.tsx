"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { defaultQuestions, Question, questionLabels } from "@/lib/survey-builder";
import {
  defaultQuestionTranslations,
  LiveSurveyResponse,
  MatrixAnswer,
  matchRuntimeLocale,
  RuntimeLocale,
  SurveyAnswer,
  runtimeLocales,
} from "@/lib/survey-runtime";
import { LimitPageContent } from "@/lib/survey-publication";
import { useSurveyTitle } from "@/lib/use-survey-title";

const uiCopy = {
  "zh-CN": {
    intro: "感谢您参与本次调研。问卷预计需要 3–5 分钟完成。",
    start: "开始填写",
    next: "下一题",
    back: "返回",
    submit: "提交",
    consent: "我已阅读并同意隐私声明，了解答卷数据的使用方式。",
    optional: "选填",
    required: "此题为必答题",
    saved: "答案已保存",
    placeholder: "请输入您的回答",
    done: "感谢您的反馈！",
    doneText: "您的答卷已成功提交。",
  },
  "en-US": {
    intro: "Thank you for taking part. This survey takes about 3–5 minutes.",
    start: "Start survey",
    next: "Next",
    back: "Back",
    submit: "Submit",
    consent: "I have read and agree to the privacy notice and understand how my responses will be used.",
    optional: "Optional",
    required: "This question is required",
    saved: "Answer saved",
    placeholder: "Enter your answer",
    done: "Thank you for your feedback!",
    doneText: "Your response has been submitted successfully.",
  },
  "zh-TW": {
    intro: "感謝您參與本次調研，問卷預計需要 3–5 分鐘完成。",
    start: "開始填寫",
    next: "下一題",
    back: "返回",
    submit: "提交",
    consent: "我已閱讀並同意隱私聲明，了解答卷資料的使用方式。",
    optional: "選填",
    required: "此題為必答題",
    saved: "答案已儲存",
    placeholder: "請輸入您的回答",
    done: "感謝您的回饋！",
    doneText: "您的答卷已成功提交。",
  },
  "th-TH": {
    intro: "ขอบคุณที่เข้าร่วม แบบสำรวจใช้เวลาประมาณ 3–5 นาที",
    start: "เริ่มทำแบบสำรวจ",
    next: "ถัดไป",
    back: "กลับ",
    submit: "ส่ง",
    consent: "ฉันได้อ่านและยอมรับประกาศความเป็นส่วนตัวแล้ว",
    optional: "ไม่บังคับ",
    required: "จำเป็นต้องตอบคำถามนี้",
    saved: "บันทึกคำตอบแล้ว",
    placeholder: "กรอกคำตอบของคุณ",
    done: "ขอบคุณสำหรับความคิดเห็น!",
    doneText: "ส่งคำตอบของคุณเรียบร้อยแล้ว",
  },
};

type StoredRule = {
  question: string;
  operator: string;
  value: string;
  action: string;
  target: string;
  enabled: boolean;
  matrixScope?: "cell" | "row" | "any-row" | "sum" | "average" | "minimum";
  matrixRow?: string;
  matrixColumn?: string;
};

export default function PlayerSurvey() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const surveyId = searchParams.get("surveyId") || "1";
  const surveyTitle = useSurveyTitle(surveyId);
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [rules, setRules] = useState<StoredRule[]>([]);
  const [locale, setLocale] = useState<RuntimeLocale>("en-US");
  const [availableLocales, setAvailableLocales] = useState<RuntimeLocale[]>(["zh-CN", "en-US", "zh-TW", "th-TH"]);
  const [allowLanguageSwitch, setAllowLanguageSwitch] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [primary, setPrimary] = useState("#356fe6");
  const [appearanceConfig, setAppearanceConfig] = useState({
    radius: 10,
    density: "comfortable",
    fontSize: "standard",
    buttonStyle: "filled",
    contentWidth: "standard",
    background: "soft",
    pageMode: "continuous",
    headerImage: "",
    headerImageMobile: "",
    curtainImage: "",
    curtainImageMobile: "",
  });
  const [surveyDescription, setSurveyDescription] = useState("");
  const [completionMode, setCompletionMode] = useState<"message" | "redirect">("message");
  const [completionRedirectUrl, setCompletionRedirectUrl] = useState("");
  const [endPage, setEndPage] = useState<{
    backgroundMode: "common" | "custom";
    background: string;
    content: Record<string, LimitPageContent>;
  }>({ backgroundMode: "common", background: "", content: {} });
  const [closedPage, setClosedPage] = useState<{
    backgroundMode: "common" | "custom";
    background: string;
    content: Record<string, LimitPageContent>;
  }>({ backgroundMode: "common", background: "", content: {} });
  const [identityMismatch, setIdentityMismatch] = useState(false);
  const [closedMessage, setClosedMessage] = useState("");
  const [closedReason, setClosedReason] = useState<"ended" | "not-started" | "outside-hours">("ended");
  const [limitPage, setLimitPage] = useState<{
    backgroundMode: "common" | "custom";
    background: string;
    content: Record<string, LimitPageContent>;
    reason: string;
  } | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number | MatrixAnswer>>({});
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);
  const [responseId, setResponseId] = useState("");
  const [validation, setValidation] = useState("");
  const [startedAt] = useState(() => Date.now());
  const copy = uiCopy[locale];

  useEffect(() => {
    try {
      const schema = window.localStorage.getItem(`joydata-survey-schema-${surveyId}`);
      if (schema) setQuestions(JSON.parse(schema));
      const storedRules = window.localStorage.getItem(`joydata-survey-rules-${surveyId}`);
      if (storedRules) setRules(JSON.parse(storedRules));
      const storedTranslations = window.localStorage.getItem(`joydata-survey-translations-${surveyId}`);
      if (storedTranslations) setTranslations(JSON.parse(storedTranslations));
      const appearance = JSON.parse(
        window.localStorage.getItem(`joydata-survey-appearance-${surveyId}`) || "{}",
      );
      if (appearance.primary) setPrimary(appearance.primary);
      setAppearanceConfig((current) => ({
        ...current,
        radius: typeof appearance.radius === "number" ? appearance.radius : current.radius,
        density: appearance.density === "compact" ? "compact" : "comfortable",
        fontSize: appearance.fontSize === "large" ? "large" : "standard",
        buttonStyle: appearance.buttonStyle === "outline" ? "outline" : "filled",
        contentWidth: ["narrow", "wide"].includes(appearance.contentWidth) ? appearance.contentWidth : "standard",
        background: ["plain", "soft", "dark"].includes(appearance.background) ? appearance.background : "soft",
        pageMode: appearance.pageMode === "one-question" ? "one-question" : "continuous",
        headerImage: appearance.headerImage || "",
        headerImageMobile: appearance.headerImageMobile || "",
        curtainImage: appearance.curtainImage || "",
        curtainImageMobile: appearance.curtainImageMobile || "",
      }));
      if (typeof appearance.languageSwitch === "boolean") setAllowLanguageSwitch(appearance.languageSwitch);
      if (typeof appearance.progress === "boolean") setShowProgress(appearance.progress);

      const publications = JSON.parse(
        window.localStorage.getItem(`joydata-survey-publications-${surveyId}`) || "[]",
      );
      const publication = publications.find((item: { slug: string }) => item.slug === params.slug);
      if (publication && typeof appearance.languageSwitch !== "boolean") {
        setAllowLanguageSwitch(publication.allowLanguageSwitch !== false);
      }
      if (publication) {
        setCompletionMode(publication.completionMode === "redirect" ? "redirect" : "message");
        setCompletionRedirectUrl(publication.redirectUrl || "");
        setEndPage({
          backgroundMode: publication.limitPageBackgroundMode || "common",
          background: publication.limitPageBackground || "",
          content: publication.limitPageContent || {},
        });
        setClosedPage({
          backgroundMode: publication.closedPageBackgroundMode || "common",
          background: publication.closedPageBackground || "",
          content: publication.closedPageContent || {},
        });
        const existingResponses = JSON.parse(window.localStorage.getItem(`joydata-survey-live-responses-${surveyId}`) || "[]") as LiveSurveyResponse[];
        const boundIdentity =
          searchParams.get("bound_user_id")
          || searchParams.get("link_user_id")
          || searchParams.get("joyamaker_id")
          || searchParams.get("joymaker_id")
          || "";
        const currentIdentity =
          searchParams.get("current_user_id")
          || window.localStorage.getItem("joydata-joyamaker-id")
          || window.localStorage.getItem("joydata-joymaker-id")
          || "";
        const linkLocale =
          matchRuntimeLocale(searchParams.get("lang") || searchParams.get("locale") || searchParams.get("language"))
          || matchRuntimeLocale(publication.defaultLocale)
          || "en-US";
        if (publication.identityValidationEnabled && boundIdentity && currentIdentity && boundIdentity !== currentIdentity) {
          const redirects = publication.identityMismatchRedirects || {};
          const fallbackLocale = publication.identityMismatchFallbackLocale || publication.defaultLocale || "en-US";
          const target = redirects[linkLocale] || redirects[fallbackLocale] || "";
          if (/^https?:\/\//i.test(target)) {
            window.location.replace(target);
          } else {
            setIdentityMismatch(true);
          }
          return;
        }
        const joymakerId = currentIdentity || boundIdentity;
        const lineId = searchParams.get("line_user_id") || searchParams.get("line_id") || window.localStorage.getItem("joydata-line-user-id") || "";
        const clientIp = searchParams.get("client_ip") || "preview-device-ip";
        const joymakerCount = joymakerId ? existingResponses.filter((item) => item.joymakerId === joymakerId).length : 0;
        const lineCount = lineId ? existingResponses.filter((item) => item.lineId === lineId).length : 0;
        const ipCount = existingResponses.filter((item) => item.clientIp === clientIp).length;
        const triggeredByAccount = publication.accountLimitEnabled && joymakerId && joymakerCount >= (publication.perAccountLimit || 1);
        const triggeredByLine = publication.lineLimitEnabled && lineId && lineCount >= (publication.perLineLimit || 1);
        const triggeredByIp = publication.ipLimit && ipCount >= (publication.perIpLimit || 1);
        const triggeredByDevice = publication.deviceLimit && existingResponses.length >= (publication.perDeviceLimit || 1);
        if (triggeredByAccount || triggeredByLine || triggeredByIp || triggeredByDevice) {
          setLimitPage({
            backgroundMode: publication.limitPageBackgroundMode || "common",
            background: publication.limitPageBackground || "",
            content: publication.limitPageContent || {},
            reason: triggeredByAccount ? "JoyaMaker / JoyID 用户提交次数已达上限" : triggeredByLine ? "LINE 用户提交次数已达上限" : "IP / 设备提交次数已达上限",
          });
        }
      }
      const now = Date.now();
      const startsAt = publication?.startAt ? new Date(publication.startAt).getTime() : 0;
      const endsAt = publication?.endAt ? new Date(publication.endAt).getTime() : 0;
      if (publication?.status === "stopped") {
        setClosedReason("ended");
        setClosedMessage(
          publication.closedMessage ||
            "This survey has ended. Thank you for your interest.",
        );
      } else if (publication?.scheduleEnabled && startsAt && now < startsAt) {
        setClosedReason("not-started");
        setClosedMessage(`本问卷将于 ${new Date(startsAt).toLocaleString()} 开放填写。`);
      } else if (publication?.scheduleEnabled && endsAt && now > endsAt) {
        setClosedReason("ended");
        setClosedMessage(publication.closedMessage || "本问卷已超过允许填写时间，感谢您的关注。");
      } else if (publication?.dailyWindowEnabled) {
        const currentTime = new Date().toTimeString().slice(0, 5);
        const start = publication.dailyStartTime || "00:00";
        const end = publication.dailyEndTime || "23:59";
        const allowed = start <= end
          ? currentTime >= start && currentTime <= end
          : currentTime >= start || currentTime <= end;
        if (!allowed) {
          setClosedReason("outside-hours");
          setClosedMessage(`本问卷每天仅在 ${start}–${end} 开放，请在允许时段内再次访问。`);
        }
      }

      const drafts = JSON.parse(window.localStorage.getItem("joydata-survey-drafts") || "[]");
      const draft = drafts.find((item: { id?: number | string }) => String(item.id) === surveyId);
      if (draft?.description) setSurveyDescription(draft.description);
      const configuredLocales = (draft?.languages || Object.keys(runtimeLocales))
        .map((item: string) => matchRuntimeLocale(item))
        .filter((item: RuntimeLocale | null): item is RuntimeLocale => Boolean(item));
      const uniqueConfigured = Array.from(new Set<RuntimeLocale>(configuredLocales));
      if (uniqueConfigured.length) setAvailableLocales(uniqueConfigured);

      const explicit = matchRuntimeLocale(searchParams.get("lang"));
      const remembered = matchRuntimeLocale(
        window.localStorage.getItem(`joydata-survey-language-${surveyId}`),
      );
      const browserLocale = navigator.languages
        .map(matchRuntimeLocale)
        .find((item): item is RuntimeLocale => Boolean(item));
      const configured = matchRuntimeLocale(publication?.defaultLocale);
      const fallback = matchRuntimeLocale(
        window.localStorage.getItem(`joydata-survey-fallback-language-${surveyId}`)
          || draft?.fallbackLanguage
          || draft?.defaultLanguage,
      ) || configured || uniqueConfigured[0] || "en-US";
      const preferred = explicit || remembered || browserLocale;
      setLocale(preferred && uniqueConfigured.includes(preferred) ? preferred : fallback);
    } catch {
      setQuestions(defaultQuestions);
    }
  }, [params.slug, searchParams, surveyId]);

  function changeLocale(next: RuntimeLocale) {
    setLocale(next);
    window.localStorage.setItem(`joydata-survey-language-${surveyId}`, next);
  }

  function localizedQuestion(question: Question) {
    const defaultTranslation = defaultQuestionTranslations[locale][question.id];
    const legacyKey = locale === "zh-TW" ? "繁中" : locale === "th-TH" ? "ไทย" : "";
    const editedTitle = legacyKey ? translations[legacyKey]?.[question.id] : "";
    return {
      ...question,
      title: editedTitle || defaultTranslation?.title || question.title,
      description: defaultTranslation?.description || question.description,
      options: defaultTranslation?.options || question.options,
    };
  }

  function compareAnswer(value: string | number, operator: string, expected: string) {
    if (operator === "小于") return Number(value) < Number(expected);
    if (operator === "小于等于") return Number(value) <= Number(expected);
    if (operator === "大于") return Number(value) > Number(expected);
    if (operator === "大于等于") return Number(value) >= Number(expected);
    if (operator === "不等于") return String(value) !== expected;
    if (operator === "包含") return String(value).includes(expected);
    if (operator === "不包含") return !String(value).includes(expected);
    if (operator === "为空") return String(value).trim() === "";
    if (operator === "不为空") return String(value).trim() !== "";
    const accepted = expected.split("/").map((item) => item.trim());
    return accepted.includes(String(value));
  }

  function answerMatches(
    sourceQuestion: Question,
    answer: SurveyAnswer | undefined,
    operator: string,
    expected: string,
    matrixScope?: StoredRule["matrixScope"],
    matrixRow?: string,
    matrixColumn?: string,
  ) {
    if (answer === undefined || answer === "") return operator === "为空";
    if (answer && typeof answer === "object" && !Array.isArray(answer)) {
      const matrixAnswer = answer as MatrixAnswer;
      const scope = matrixScope || (["matrixScale", "matrixSlider"].includes(sourceQuestion.type) ? "row" : "cell");
      if (scope === "cell") {
        const rowValue = matrixAnswer[matrixRow || ""];
        const selected = Array.isArray(rowValue) ? rowValue.includes(matrixColumn || "") : String(rowValue ?? "") === String(matrixColumn || "");
        return operator === "未选中" ? !selected : selected;
      }
      const rawValues = scope === "row" ? [matrixAnswer[matrixRow || ""]] : Object.values(matrixAnswer);
      const values = rawValues.flatMap((item) => Array.isArray(item) ? item : [item]).filter((item): item is string | number => item !== undefined);
      if (scope === "sum" || scope === "average" || scope === "minimum") {
        const numbers = values.map(Number).filter(Number.isFinite);
        if (!numbers.length) return false;
        const aggregate = scope === "sum"
          ? numbers.reduce((total, item) => total + item, 0)
          : scope === "average"
            ? numbers.reduce((total, item) => total + item, 0) / numbers.length
            : Math.min(...numbers);
        return compareAnswer(aggregate, operator, expected);
      }
      return values.some((item) => compareAnswer(item, operator, expected));
    }
    if (Array.isArray(answer)) return answer.some((item) => compareAnswer(item, operator, expected));
    return compareAnswer(answer, operator, expected);
  }

  function ruleMatches(rule: StoredRule) {
    const questionIndex = Number.parseInt(rule.question.slice(0, 2), 10) - 1;
    const sourceQuestion = questions[questionIndex];
    if (!sourceQuestion) return false;
    return answerMatches(sourceQuestion, answers[sourceQuestion.id], rule.operator, rule.value, rule.matrixScope, rule.matrixRow, rule.matrixColumn);
  }

  const visibleQuestions = useMemo(() => {
    return questions.filter((question, index) => {
      if (question.displayLogic?.conditions.length) {
        const matches = question.displayLogic.conditions.map((condition) => {
          const source = questions.find((item) => item.id === condition.questionId);
          return source ? answerMatches(source, answers[source.id], condition.operator, condition.value, condition.matrixScope, condition.matrixRow, condition.matrixColumn) : false;
        });
        return question.displayLogic.match === "all" ? matches.every(Boolean) : matches.some(Boolean);
      }
      if (index < 2 || rules.length === 0) return true;
      const targetingRules = rules.filter(
        (rule) => rule.enabled && rule.target.startsWith(String(index + 1).padStart(2, "0")),
      );
      if (!targetingRules.length) return true;
      return targetingRules.some(ruleMatches);
    });
  }, [answers, questions, rules]);

  const current = step > 0 ? visibleQuestions[step - 1] : null;
  const currentLocalized = current ? localizedQuestion(current) : null;
  const progress = done
    ? 100
    : step === 0
      ? 8
      : Math.round((step / Math.max(visibleQuestions.length, 1)) * 100);

  function updateAnswer(value: string | string[] | number | MatrixAnswer) {
    if (!current) return;
    setAnswers((previous) => ({ ...previous, [current.id]: value }));
    setValidation("");
  }

  function isRequired(question: Question) {
    const requiredByRule = rules.some(
      (rule) =>
        rule.enabled &&
        rule.action === "设为必答" &&
        rule.target.startsWith(
          String(questions.findIndex((item) => item.id === question.id) + 1).padStart(2, "0"),
        ) &&
        ruleMatches(rule),
    );
    return question.required || requiredByRule;
  }

  function goNext() {
    if (!current) return;
    const answer = answers[current.id];
    if (
      isRequired(current) &&
      (answer === undefined || answer === "" || (Array.isArray(answer) && !answer.length) || (typeof answer === "object" && !Array.isArray(answer) && !Object.keys(answer).length))
    ) {
      setValidation(copy.required);
      return;
    }
    if (step >= visibleQuestions.length) {
      submitResponse();
    } else {
      setStep((value) => value + 1);
    }
  }

  function submitResponse() {
    const id = `RSP-${Date.now().toString().slice(-8)}`;
    const response: LiveSurveyResponse = {
      id,
      surveyId,
      submittedAt: new Date().toISOString(),
      locale,
      durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      answers,
      questions: questions.map(({ id: questionId, title, type }) => ({
        id: questionId,
        title,
        type,
      })),
      source: searchParams.get("ext_value") || searchParams.get("source") || "Direct",
      joymakerId: searchParams.get("joyamaker_id") || searchParams.get("joymaker_id") || window.localStorage.getItem("joydata-joyamaker-id") || window.localStorage.getItem("joydata-joymaker-id") || undefined,
      lineId: searchParams.get("line_user_id") || searchParams.get("line_id") || window.localStorage.getItem("joydata-line-user-id") || undefined,
      clientIp: searchParams.get("client_ip") || "preview-device-ip",
      status: "valid",
    };
    const key = `joydata-survey-live-responses-${surveyId}`;
    const existing = JSON.parse(window.localStorage.getItem(key) || "[]");
    window.localStorage.setItem(key, JSON.stringify([response, ...existing]));
    setResponseId(id);
    if (completionMode === "redirect" && completionRedirectUrl) {
      window.location.assign(completionRedirectUrl);
      return;
    }
    setDone(true);
  }

  function submitContinuous() {
    const missingRequired = visibleQuestions.find((question) => {
      if (["divider", "description", "imageDisplay", "carousel", "pageBreak", "button"].includes(question.type)) return false;
      const answer = answers[question.id];
      return isRequired(question) && (
        answer === undefined
        || answer === ""
        || (Array.isArray(answer) && !answer.length)
        || (typeof answer === "object" && !Array.isArray(answer) && !Object.keys(answer).length)
      );
    });
    if (missingRequired) {
      setValidation(`请完成必答题：${localizedQuestion(missingRequired).title}`);
      document.getElementById(`player-question-${missingRequired.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    submitResponse();
  }

  const hasCurtain = Boolean(appearanceConfig.curtainImage || appearanceConfig.curtainImageMobile);
  const surveyShellClass = `player-survey-shell ${hasCurtain ? "has-curtain" : ""} appearance-${appearanceConfig.background} density-${appearanceConfig.density} font-${appearanceConfig.fontSize} button-${appearanceConfig.buttonStyle} width-${appearanceConfig.contentWidth}`;
  const surveyShellStyle = {
    "--player": primary,
    "--player-radius": `${appearanceConfig.radius}px`,
    "--curtain-desktop": appearanceConfig.curtainImage ? `url(${appearanceConfig.curtainImage})` : "none",
    "--curtain-mobile": appearanceConfig.curtainImageMobile ? `url(${appearanceConfig.curtainImageMobile})` : appearanceConfig.curtainImage ? `url(${appearanceConfig.curtainImage})` : "none",
  } as React.CSSProperties;

  if (closedMessage) {
    const baseContent = closedPage.content[locale] || closedPage.content["en-US"] || closedPage.content["zh-CN"] || {
      title: closedReason === "not-started" ? "问卷尚未开始" : closedReason === "outside-hours" ? "当前不在允许访问时段" : "本次问卷收集已结束",
      body: closedMessage,
      links: [],
    };
    const translationLocale = locale === "en-US" ? "EN" : locale === "zh-TW" ? "繁中" : locale === "th-TH" ? "ไทย" : "简中";
    const resultTranslations = translations[translationLocale] || {};
    const content: LimitPageContent = {
      ...baseContent,
      title: resultTranslations["closed:title"] || baseContent.title,
      body: resultTranslations["closed:body"] || resultTranslations["form:closed"] || baseContent.body,
      links: (baseContent.links || []).map((link) => ({ ...link, text: resultTranslations[`closed:link:${link.id}`] || link.text })),
    };
    return (
      <main className={`player-limit-shell ${closedPage.backgroundMode}`} style={closedPage.backgroundMode === "custom" && closedPage.background ? { backgroundImage: `url(${closedPage.background})` } : undefined}>
        <LanguageBar locale={locale} availableLocales={availableLocales} allowSwitch={allowLanguageSwitch} onChange={changeLocale} />
        <section className="player-limit-card">
          {content.title && <h1>{content.title}</h1>}
          <p><InlineLimitText content={content} /></p>
          <small>{closedReason === "not-started" ? "问卷尚未开始" : closedReason === "outside-hours" ? "当前不在允许访问时段" : "本次问卷收集已结束"}</small>
        </section>
      </main>
    );
  }

  if (identityMismatch) {
    return (
      <main className={surveyShellClass} style={surveyShellStyle}>
        <section className="player-closed identity-mismatch-page">
          <span>!</span>
          <small>IDENTITY CHECK FAILED</small>
          <h1>当前登录身份与问卷链接不一致</h1>
          <p>该链接已绑定其他玩家账号，不能继续填写。管理员尚未配置对应语言的官网跳转地址，请返回游戏官网重新登录后获取问卷。</p>
        </section>
      </main>
    );
  }

  if (limitPage) {
    const baseContent = limitPage.content[locale] || limitPage.content["en-US"] || limitPage.content["zh-CN"] || {
      title: "You have completed this survey",
      body: "Thank you for participating. The submission limit has been reached.",
      links: [],
    };
    const translationLocale = locale === "en-US" ? "EN" : locale === "zh-TW" ? "繁中" : locale === "th-TH" ? "ไทย" : "简中";
    const resultTranslations = translations[translationLocale] || {};
    const content: LimitPageContent = {
      ...baseContent,
      title: resultTranslations["limit:title"] || baseContent.title,
      body: resultTranslations["limit:body"] || baseContent.body,
      links: (baseContent.links || []).map((link) => ({
        ...link,
        text: resultTranslations[`limit:link:${link.id}`] || link.text,
      })),
    };
    return (
      <main className={`player-limit-shell ${limitPage.backgroundMode}`} style={limitPage.backgroundMode === "custom" && limitPage.background ? { backgroundImage: `url(${limitPage.background})` } : undefined}>
        <LanguageBar locale={locale} availableLocales={availableLocales} allowSwitch={allowLanguageSwitch} onChange={changeLocale} />
        <section className="player-limit-card">
          {content.title && <h1>{content.title}</h1>}
          <p><InlineLimitText content={content} /></p>
          <small>{limitPage.reason}</small>
        </section>
      </main>
    );
  }

  if (done) {
    const translationLocale = locale === "en-US" ? "EN" : locale === "zh-TW" ? "繁中" : locale === "th-TH" ? "ไทย" : "简中";
    const baseContent = endPage.content[locale] || endPage.content["en-US"] || endPage.content["zh-CN"] || {
      title: copy.done,
      body: copy.doneText,
      links: [],
    };
    const resultTranslations = translations[translationLocale] || {};
    const content: LimitPageContent = {
      ...baseContent,
      title: resultTranslations["limit:title"] || baseContent.title,
      body: resultTranslations["limit:body"] || baseContent.body,
      links: (baseContent.links || []).map((link) => ({
        ...link,
        text: resultTranslations[`limit:link:${link.id}`] || link.text,
      })),
    };
    return (
      <main className={`player-limit-shell ${endPage.backgroundMode}`} style={endPage.backgroundMode === "custom" && endPage.background ? { backgroundImage: `url(${endPage.background})` } : undefined}>
        <LanguageBar locale={locale} availableLocales={availableLocales} allowSwitch={allowLanguageSwitch} onChange={changeLocale} />
        <section className="player-limit-card player-unified-end-card">
          {content.title && <h1>{content.title}</h1>}
          <p><InlineLimitText content={content} /></p>
          <small>提交成功 · Response ID {responseId}</small>
        </section>
      </main>
    );
  }

  return (
    <main className={surveyShellClass} style={surveyShellStyle}>
      <LanguageBar locale={locale} availableLocales={availableLocales} allowSwitch={allowLanguageSwitch} onChange={changeLocale} />
      {showProgress && <div className="player-progress"><i style={{ width: `${progress}%` }} /></div>}
      <section className="player-survey-card">
        {step === 0 ? (
          <div className="player-cover">
            {appearanceConfig.headerImage && <picture className="player-header-picture">
              {appearanceConfig.headerImageMobile && <source media="(max-width: 640px)" srcSet={appearanceConfig.headerImageMobile} />}
              <img className="player-header-image" src={appearanceConfig.headerImage} alt="" />
            </picture>}
            <h1>{surveyTitle}</h1><p>{surveyDescription || copy.intro}</p>
            <ul><li><i>◷</i>3–5 min</li><li><i>▤</i>{visibleQuestions.length} questions</li><li><i>⌾</i>Global data region</li></ul>
            <label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{copy.consent}</span></label>
            <button disabled={!consent} onClick={() => setStep(1)}>{copy.start} →</button>
          </div>
        ) : appearanceConfig.pageMode === "continuous" ? (
          <div className="player-continuous-form">
            {visibleQuestions.filter((question) => question.type !== "pageBreak").map((question, index, list) => {
              const localized = localizedQuestion(question);
              if (question.type === "divider") return <hr key={question.id} className="player-divider-block" />;
              if (question.type === "description") return <div key={question.id} className="player-description-block">{localized.title}</div>;
              return (
                <article id={`player-question-${question.id}`} key={question.id} className="player-question continuous">
                  <small>{String(index + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")} · {questionLabels[question.type]}</small>
                  <h2>{localized.title}{isRequired(question) && <b>*</b>}</h2>
                  {localized.description && <p>{localized.description}</p>}
                  {localized.referenceImage && <div className="player-reference-image"><img src={localized.referenceImage} alt="题目参考图" /></div>}
                  <QuestionInput question={localized} value={answers[question.id]} onChange={(value) => { setAnswers((previous) => ({ ...previous, [question.id]: value })); setValidation(""); }} placeholder={copy.placeholder} />
                </article>
              );
            })}
            {validation && <div className="player-validation">! {validation}</div>}
            <footer className="player-continuous-footer"><span>✓ {copy.saved}</span><button onClick={submitContinuous}>{copy.submit} ✓</button></footer>
          </div>
        ) : current && currentLocalized ? (
          <div className="player-question">
            <small>{String(step).padStart(2, "0")} / {String(visibleQuestions.length).padStart(2, "0")} · {questionLabels[current.type]}</small>
            <h2>{currentLocalized.title}{isRequired(current) && <b>*</b>}</h2>
            <p>{currentLocalized.description || copy.optional}</p>
            {currentLocalized.helpText && <div className="player-question-help">ⓘ {currentLocalized.helpText}</div>}
            {currentLocalized.referenceImage && <div className="player-reference-image"><img src={currentLocalized.referenceImage} alt="题目参考图" /></div>}
            <QuestionInput question={currentLocalized} value={answers[current.id]} onChange={updateAnswer} placeholder={copy.placeholder} />
            {validation && <div className="player-validation">! {validation}</div>}
            <footer>
              {step > 1 ? <button className="player-back" onClick={() => setStep((value) => value - 1)}>← {copy.back}</button> : <span>✓ {copy.saved}</span>}
              <button onClick={goNext}>{step >= visibleQuestions.length ? `${copy.submit} ✓` : `${copy.next} →`}</button>
            </footer>
          </div>
        ) : null}
      </section>
      <footer className="player-privacy">Privacy protected · Responses stored in the selected data region · Powered by JoyData Survey</footer>
    </main>
  );
}

function InlineLimitText({ content }: { content: LimitPageContent }) {
  const normalizedLinks = Array.isArray(content.links)
    ? content.links
    : content.linkText
      ? [{ id: "legacy-link", text: content.linkText, url: content.linkUrl || "" }]
      : [];
  const body = content.linkText && !content.body.includes("{{legacy-link}}")
    ? `${content.body} {{legacy-link}}`
    : content.body;
  const links = new Map(normalizedLinks.map((link) => [link.id, link]));
  return body.split(/(\{\{[^}]+\}\})/g).map((part, index) => {
    const match = part.match(/^\{\{([^}]+)\}\}$/);
    const link = match ? links.get(match[1]) : undefined;
    return link?.url
      ? <a key={`${link.id}-${index}`} href={link.url} target="_blank" rel="noreferrer">{link.text}</a>
      : link
        ? <span key={`${link.id}-${index}`}>{link.text}</span>
        : <span key={`${part}-${index}`}>{part}</span>;
  });
}

function LanguageBar({
  locale,
  availableLocales,
  allowSwitch,
  onChange,
}: {
  locale: RuntimeLocale;
  availableLocales: RuntimeLocale[];
  allowSwitch: boolean;
  onChange: (locale: RuntimeLocale) => void;
}) {
  return (
    <div className="player-language">
      {allowSwitch && availableLocales.length > 1 ? (
        <select value={locale} onChange={(event) => onChange(event.target.value as RuntimeLocale)}>
          {availableLocales.map((code) => <option key={code} value={code}>🌐 {runtimeLocales[code]}</option>)}
        </select>
      ) : <em>🌐 {runtimeLocales[locale]}</em>}
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
  placeholder,
}: {
  question: Question;
    value: string | string[] | number | MatrixAnswer | undefined;
  onChange: (value: string | string[] | number | MatrixAnswer) => void;
  placeholder: string;
}) {
  if (["matrix", "matrixFill", "matrixSelect", "matrixScale", "matrixSlider", "matrixDropdown"].includes(question.type)) {
    const rows = question.matrixRows?.length ? question.matrixRows : ["行 1", "行 2", "行 3"];
    const columns = question.matrixColumns?.length
      ? question.matrixColumns
      : question.options?.length
        ? question.options
        : ["选项 1", "选项 2", "选项 3"];
    const matrixValue: MatrixAnswer = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const updateMatrix = (key: string, nextValue: string | number) => onChange({ ...matrixValue, [key]: nextValue });

    if (question.type === "matrixSlider") {
      const numericColumns = columns.map(Number).filter((item) => Number.isFinite(item));
      const min = numericColumns.length ? Math.min(...numericColumns) : 1;
      const max = numericColumns.length ? Math.max(...numericColumns) : 5;
      return <div className="player-matrix-sliders">{rows.map((row) => <label key={row}><span>{row}</span><input type="range" min={min} max={max} value={Number(matrixValue[row] ?? min)} onChange={(event) => updateMatrix(row, Number(event.target.value))} /><strong>{matrixValue[row] ?? min}</strong></label>)}</div>;
    }

    if (question.type === "matrixDropdown") {
      return <div className="player-matrix-dropdowns">{rows.map((row) => <label key={row}><span>{row}</span><select value={String(matrixValue[row] ?? "")} onChange={(event) => updateMatrix(row, event.target.value)}><option value="">请选择</option>{columns.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div>;
    }

    return (
      <div className="player-matrix-scroll">
        <div className={`player-matrix-table ${question.type}`} style={{ gridTemplateColumns: `minmax(120px, 1.3fr) repeat(${columns.length}, minmax(72px, 1fr))` }}>
          <div className="matrix-corner">题目/选项</div>
          {columns.map((column) => <div className="matrix-column" key={column}>{column}</div>)}
          {rows.map((row) => (
            <div className="player-matrix-row" key={row}>
              <strong>{row}</strong>
              {columns.map((column) => {
                const cellKey = `${row}::${column}`;
                if (question.type === "matrixFill") {
                  return <input key={column} aria-label={`${row} ${column}`} value={String(matrixValue[cellKey] ?? "")} onChange={(event) => updateMatrix(cellKey, event.target.value)} />;
                }
                const storedValue = matrixValue[row];
                const normalizedValue = question.type === "matrixScale" ? Number(column) : column;
                const selected = storedValue === normalizedValue;
                return <button type="button" aria-label={`${row} ${column}`} key={column} className={selected ? "selected" : ""} onClick={() => updateMatrix(row, normalizedValue)}><i>{selected ? "●" : "○"}</i></button>;
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (["single", "image", "tableSelect"].includes(question.type)) {
    return <div className="player-options">{question.options?.map((option, index) => {
      const sourceValue = defaultQuestions.find((item) => item.id === question.id)?.options?.[index] || option;
      return <button key={option} className={value === sourceValue ? "selected" : ""} onClick={() => onChange(sourceValue)}><i>{value === sourceValue ? "●" : "○"}</i>{option}</button>;
    })}</div>;
  }
  if (question.type === "multiple") {
    const selected = Array.isArray(value) ? value : [];
    const maxSelections = question.maxSelections && question.maxSelections > 0 ? question.maxSelections : undefined;
    return <><div className="player-selection-rule">{maxSelections ? `多选题 · 最多选择 ${maxSelections} 项` : "多选题 · 可选择多个选项"}</div><div className="player-options">{question.options?.map((option) => {
      const isSelected = selected.includes(option);
      const reachedLimit = Boolean(maxSelections && selected.length >= maxSelections && !isSelected);
      return <button key={option} disabled={reachedLimit} className={isSelected ? "selected" : ""} onClick={() => onChange(isSelected ? selected.filter((item) => item !== option) : [...selected, option])}><i>{isSelected ? "■" : "□"}</i>{option}</button>;
    })}</div></>;
  }
  if (question.type === "dropdown" || question.type === "cascade") {
    return <select className="player-select-input" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)}><option value="">请选择</option>{question.options?.map((option) => <option key={option}>{option}</option>)}</select>;
  }
  if (question.type === "sort") {
    return <div className="player-sort-list">{question.options?.map((option, index) => <button type="button" key={option}><strong>{index + 1}</strong><span>{option}</span><i>⠿</i></button>)}</div>;
  }
  if (question.type === "nps" || question.type === "rating") {
    const min = question.min ?? 0;
    const max = question.max ?? 10;
    return <><div className="player-nps">{Array.from({ length: Math.min(21, max - min + 1) }, (_, index) => index + min).map((score) => <button key={score} className={value === score ? "selected" : ""} onClick={() => onChange(score)}>{score}</button>)}</div><div className="nps-labels"><span>{question.minLabel || min}</span><span>{question.maxLabel || max}</span></div></>;
  }
  if (question.type === "text" || question.type === "phone") {
    return <div className="player-inline-field"><input type={question.type === "phone" ? "tel" : "text"} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} placeholder={question.type === "phone" ? "请输入手机号" : placeholder} />{question.type === "phone" && <button type="button">发送验证码</button>}</div>;
  }
  if (question.type === "date" || question.type === "appointmentDate") {
    return <input className="player-select-input" type="date" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} />;
  }
  if (question.type === "appointmentSlot") {
    return <select className="player-select-input" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)}><option value="">请选择预约时段</option><option>10:00–11:00</option><option>14:00–15:00</option><option>19:00–20:00</option></select>;
  }
  if (["provinceCity", "globalProvinceCity", "city"].includes(question.type)) {
    return <div className="player-region-fields"><select><option>{question.type === "globalProvinceCity" ? "请选择国家/地区" : "请选择省份"}</option></select><select><option>请选择城市</option></select></div>;
  }
  if (["file", "imageUpload", "ocr"].includes(question.type)) {
    return <label className="player-upload-field"><input type="file" accept={question.type === "file" ? undefined : "image/*"} onChange={(event) => onChange(event.target.files?.[0]?.name || "")} /><span>＋ {question.type === "file" ? "选择文件" : question.type === "ocr" ? "上传图片并识别" : "上传图片"}</span><small>{typeof value === "string" && value ? value : "尚未选择文件"}</small></label>;
  }
  if (question.type === "location") return <button type="button" className="player-action-field" onClick={() => onChange("已获取当前位置")}>⌖ 获取当前位置</button>;
  if (question.type === "product") return <div className="player-product-field"><span>商品信息</span><strong>¥ 0.00</strong><button type="button" onClick={() => onChange("已选择")}>选择</button></div>;
  if (question.type === "description") return <div className="player-description-block">{question.title}</div>;
  if (question.type === "divider") return <hr className="player-divider-block" />;
  if (question.type === "imageDisplay" || question.type === "carousel") return <div className="player-image-placeholder">▧ {question.type === "carousel" ? "图片轮播" : "图片展示"}</div>;
  if (question.type === "button") return <button type="button" className="player-action-field">{question.title || "按钮"}</button>;
  return <><textarea value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={1000} /><div className="text-count">{typeof value === "string" ? value.length : 0} / 1000</div></>;
}
