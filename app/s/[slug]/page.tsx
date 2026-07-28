"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { defaultQuestions, Question } from "@/lib/survey-builder";
import {
  defaultQuestionTranslations,
  LiveSurveyResponse,
  matchRuntimeLocale,
  RuntimeLocale,
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
  const [surveyDescription, setSurveyDescription] = useState("");
  const [completionImage, setCompletionImage] = useState("");
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
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
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
        setCompletionImage(publication.completionImage || "");
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
          const target = redirects[linkLocale] || redirects[publication.defaultLocale] || redirects["en-US"] || "";
          if (/^https?:\/\//i.test(target)) {
            window.location.replace(target);
          } else {
            setIdentityMismatch(true);
          }
          return;
        }
        const joymakerId = currentIdentity || boundIdentity;
        const clientIp = searchParams.get("client_ip") || "preview-device-ip";
        const joymakerCount = joymakerId ? existingResponses.filter((item) => item.joymakerId === joymakerId).length : 0;
        const ipCount = existingResponses.filter((item) => item.clientIp === clientIp).length;
        const triggeredByJoymaker = publication.joymakerUniqueSubmission && joymakerId && joymakerCount >= 1;
        const triggeredByAccount = publication.accountLimitEnabled && joymakerId && joymakerCount >= (publication.perAccountLimit || 1);
        const triggeredByIp = publication.ipLimit && ipCount >= (publication.perIpLimit || 1);
        const triggeredByDevice = publication.deviceLimit && existingResponses.length >= (publication.perDeviceLimit || 1);
        if (triggeredByJoymaker || triggeredByAccount || triggeredByIp || triggeredByDevice) {
          setLimitPage({
            backgroundMode: publication.limitPageBackgroundMode || "common",
            background: publication.limitPageBackground || "",
            content: publication.limitPageContent || {},
            reason: triggeredByJoymaker ? "JoyaMaker 用户已提交" : triggeredByAccount ? "账号提交次数已达上限" : triggeredByIp ? "IP 提交次数已达上限" : "设备提交次数已达上限",
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

  function ruleMatches(rule: StoredRule) {
    const questionIndex = Number.parseInt(rule.question.slice(0, 2), 10) - 1;
    const sourceQuestion = questions[questionIndex];
    if (!sourceQuestion) return false;
    const answer = answers[sourceQuestion.id];
    if (answer === undefined || answer === "") return false;
    if (rule.operator === "小于等于") return Number(answer) <= Number(rule.value);
    if (rule.operator === "不等于") return String(answer) !== rule.value;
    if (rule.operator === "包含") return String(answer).includes(rule.value);
    const accepted = rule.value.split("/").map((item) => item.trim());
    return accepted.includes(String(answer));
  }

  const visibleQuestions = useMemo(() => {
    return questions.filter((question, index) => {
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

  function updateAnswer(value: string | string[] | number) {
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
      (answer === undefined || answer === "" || (Array.isArray(answer) && !answer.length))
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
      clientIp: searchParams.get("client_ip") || "preview-device-ip",
      status: "valid",
    };
    const key = `joydata-survey-live-responses-${surveyId}`;
    const existing = JSON.parse(window.localStorage.getItem(key) || "[]");
    window.localStorage.setItem(key, JSON.stringify([response, ...existing]));
    setResponseId(id);
    setDone(true);
  }

  if (closedMessage) {
    return (
      <main className="player-survey-shell" style={{ "--player": primary } as React.CSSProperties}>
        <LanguageBar locale={locale} availableLocales={availableLocales} allowSwitch={allowLanguageSwitch} onChange={changeLocale} />
        <section className="player-closed">
          <span>{closedReason === "ended" ? "■" : "◷"}</span><small>{closedReason === "ended" ? "SURVEY CLOSED" : "CURRENTLY UNAVAILABLE"}</small>
          <h1>{surveyTitle}</h1><p>{closedMessage}</p>
          <div>
            <strong>{closedReason === "not-started" ? "问卷尚未开始" : closedReason === "outside-hours" ? "当前不在允许访问时段" : "本次问卷收集已结束"}</strong>
            <small>{closedReason === "ended" ? "如有疑问，请联系问卷发布方。" : "到达开放时间后，使用原链接即可继续访问。"}</small>
          </div>
        </section>
      </main>
    );
  }

  if (identityMismatch) {
    return (
      <main className="player-survey-shell" style={{ "--player": primary } as React.CSSProperties}>
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
    return (
      <main className="player-survey-shell" style={{ "--player": primary } as React.CSSProperties}>
        <LanguageBar locale={locale} availableLocales={availableLocales} allowSwitch={allowLanguageSwitch} onChange={changeLocale} />
        <section className="player-complete">
          {completionImage && <img className="player-completion-image" src={completionImage} alt="" />}
          <span>✓</span><h1>{copy.done}</h1><p>{translations[translationLocale]?.["form:completion"] || copy.doneText}</p>
          <div><small>Response ID</small><strong>{responseId}</strong></div>
          <button onClick={() => router.push(`/survey/${surveyId}/responses`)}>在答卷列表中查看</button>
        </section>
      </main>
    );
  }

  return (
    <main className="player-survey-shell" style={{ "--player": primary } as React.CSSProperties}>
      <LanguageBar locale={locale} availableLocales={availableLocales} allowSwitch={allowLanguageSwitch} onChange={changeLocale} />
      {showProgress && <div className="player-progress"><i style={{ width: `${progress}%` }} /></div>}
      <section className="player-survey-card">
        {step === 0 ? (
          <div className="player-cover">
            <span>RO3 · PLAYER RESEARCH</span><h1>{surveyTitle}</h1><p>{surveyDescription || copy.intro}</p>
            <ul><li><i>◷</i>3–5 min</li><li><i>▤</i>{visibleQuestions.length} questions</li><li><i>⌾</i>Global data region</li></ul>
            <label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{copy.consent}</span></label>
            <button disabled={!consent} onClick={() => setStep(1)}>{copy.start} →</button>
          </div>
        ) : current && currentLocalized ? (
          <div className="player-question">
            <small>{String(step).padStart(2, "0")} / {String(visibleQuestions.length).padStart(2, "0")} · {current.type.toUpperCase()}</small>
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
      <span>RO3 · PLAYER RESEARCH</span>
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
  value: string | string[] | number | undefined;
  onChange: (value: string | string[] | number) => void;
  placeholder: string;
}) {
  if (["single", "image", "sort", "dropdown", "cascade", "matrixSelect", "tableSelect"].includes(question.type)) {
    return <div className="player-options">{question.options?.map((option, index) => {
      const sourceValue = defaultQuestions.find((item) => item.id === question.id)?.options?.[index] || option;
      return <button key={option} className={value === sourceValue ? "selected" : ""} onClick={() => onChange(sourceValue)}><i>{value === sourceValue ? "●" : "○"}</i>{option}</button>;
    })}</div>;
  }
  if (question.type === "multiple") {
    const selected = Array.isArray(value) ? value : [];
    return <div className="player-options">{question.options?.map((option) => <button key={option} className={selected.includes(option) ? "selected" : ""} onClick={() => onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option])}><i>{selected.includes(option) ? "■" : "□"}</i>{option}</button>)}</div>;
  }
  if (question.type === "nps" || question.type === "rating") {
    const min = question.min ?? 0;
    const max = question.max ?? 10;
    return <><div className="player-nps">{Array.from({ length: Math.min(21, max - min + 1) }, (_, index) => index + min).map((score) => <button key={score} className={value === score ? "selected" : ""} onClick={() => onChange(score)}>{score}</button>)}</div><div className="nps-labels"><span>{question.minLabel || min}</span><span>{question.maxLabel || max}</span></div></>;
  }
  return <><textarea value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={1000} /><div className="text-count">{typeof value === "string" ? value.length : 0} / 1000</div></>;
}
