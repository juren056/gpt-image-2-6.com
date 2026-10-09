import { and, desc, eq, gt, gte, ne } from 'drizzle-orm';

import {
  moderateWithOpenAIRetry,
  type ModerationResult,
} from '@/core/ai/moderation';
import { assertAccountAccessAllowed } from '@/core/auth/account-access';
import { db } from '@/core/db';
import {
  aiTask,
  apikey,
  session,
  userAccountState,
  userSafetyState,
  userStatusAudit,
} from '@/config/db/schema';
import { getUuid } from '@/lib/hash';

export type SafetySeverity = 'none' | 'medium' | 'high' | 'critical';
export type SafetyDecision = {
  allowed: boolean;
  category: string;
  severity: SafetySeverity;
  confidence: number;
  source: 'local_rule' | 'external' | 'provider' | 'none';
  reviewStatus: 'not_required' | 'pending' | 'confirmed';
  publicMessage: string;
  reasonCode?: string;
};

type AutomatedSafetyReviewInput = Pick<
  SafetyDecision,
  'allowed' | 'category' | 'severity' | 'confidence' | 'source'
>;

/**
 * Applying account penalties requires stronger evidence than blocking one
 * request. Ambiguous or single-provider signals are automatically resolved as
 * block-without-strike so they cannot punish a normal user or create a queue.
 */
export function automatedSafetyReviewStatus(
  decision: AutomatedSafetyReviewInput,
  options: { corroborated?: boolean } = {}
): 'not_required' | 'confirmed' {
  if (decision.allowed) return 'not_required';

  const category = decision.category.toLowerCase();
  const sexualCategory =
    category === 'sexual' ||
    category === 'sexual_explicit' ||
    category === 'sexual_minors' ||
    category === 'sexualized_exposure';

  if (decision.source === 'local_rule') {
    if (
      decision.severity === 'critical' &&
      decision.confidence >= 98 &&
      category === 'sexual_minors'
    ) {
      return 'confirmed';
    }
    if (
      decision.severity === 'high' &&
      decision.confidence >= 96 &&
      category === 'sexual_explicit'
    ) {
      return 'confirmed';
    }
    return 'not_required';
  }

  if (decision.source === 'external') {
    if (
      sexualCategory &&
      decision.confidence >= 99 &&
      (decision.severity === 'high' || decision.severity === 'critical')
    ) {
      return 'confirmed';
    }

    if (
      options.corroborated &&
      sexualCategory &&
      decision.confidence >= 90 &&
      (decision.severity === 'high' || decision.severity === 'critical')
    ) {
      return 'confirmed';
    }
  }

  return 'not_required';
}

const ALLOWED: SafetyDecision = {
  allowed: true,
  category: '',
  severity: 'none',
  confidence: 0,
  source: 'none',
  reviewStatus: 'not_required',
  publicMessage: '',
};

const MINOR_TERMS =
  /\b(?:child|children|minor|underage|preteen|little\s+(?:girl|boy)|loli|shota|niñ[oa]|menor(?:es)?|kind(?:er)?|minderjährig|enfant|mineur|criança|bambin[oa]|minore|çocuk|trẻ\s+em|vị\s+thành\s+niên|minderjarig|dziecko|nieletni|gyermek|kiskorú)\b|(?:儿童|兒童|未成年|小女孩|小男孩|幼女|幼童|子供|未成年者|少女|少年|아동|미성년|소녀|소년|طفل|قاصر|فتاة|صبي|เด็ก|ผู้เยาว์)|(?:реб[её]нок|дети|несовершеннолетн)/iu;
const EXPLICIT_MINOR_AGE =
  /\b(?:age(?:d)?\s*)?(?:[0-9]|1[0-7])\s*(?:years?\s*old|year[- ]old|yo|y\/o|age)\b|\b(?:girl|boy|child)(?:'s|s)?\s+(?:of|aged?)\s*(?:[0-9]|1[0-7])\b|(?:[0-9]|1[0-7])\s*岁|(?:[0-9]|1[0-7])\s*лет/iu;
const SEXUAL_TERMS =
  /\b(?:nude|naked|porn(?:ographic)?|sex(?:ual)?|genitals?|nipples?|undress(?:ed|ing)?|remove\s+(?:her|his|their)\s+clothes|without\s+clothes|without\s+underwear|no\s+underwear|panties?\s+visible|desnud[oa]|pornográfic[oa]|genitales|sin\s+ropa\s+interior|nackt|pornografisch|geschlechtsteile|ohne\s+unterwäsche|nu(?:e|es)?|pornographique|organes?\s+génitaux|sans\s+sous-vêtements|pornográfic[oa]|nu[ao]s?|genitais|sem\s+roupa\s+íntima|nud[oa]|pornografic[oa]|genitali|senza\s+biancheria|çıplak|pornografik|cinsel|iç\s+çamaşırsız|khỏa\s+thân|khiêu\s+dâm|bộ\s+phận\s+sinh\s+dục|naakt|pornografisch|geslachtsdelen|zonder\s+ondergoed|nag[ia]|pornograficzn|narządy\s+płciowe|bez\s+bielizny|meztelen|pornográf|nemi\s+szerv|fehérnemű\s+nélkül)\b|(?:裸体|裸露|赤裸|色情|性行为|脫光|脱光|脱掉.*衣服|脫掉.*衣服|生殖器|没穿内裤|沒穿內褲|不穿内裤|不穿內褲|裸|ポルノ|性的|性器|下着なし|나체|포르노|성적|성기|속옷 없이|عاري|عارية|إباحي|جنسي|أعضاء تناسلية|بدون ملابس داخلية|โป๊|เปลือย|ลามก|อวัยวะเพศ|ไม่ใส่กางเกงใน)|(?:обнаж[её]н|голая|порнограф|сексуальн|без\s+белья|белья\s+нет)/iu;
const CHILD_EXPLOITATION_CONTEXT =
  /\b(?:pregnant|pregnancy|impregnat(?:e|ed|ion)|forced\s+marriage)\b|(?:怀孕|孕肚|强迫结婚)|(?:беремен)/iu;
const COERCION_TERMS =
  /\b(?:bound|tied\s+up|restrained|unconscious|drugged|forced|against\s+(?:her|his|their)\s+will|non[- ]?consensual)\b|(?:束缚|捆绑|昏迷|下药|强迫|非自愿)|(?:связан|без\s+согласия|принуд)/iu;
const EXPOSURE_ACTION =
  /\b(?:lift(?:ed|ing)?|raise(?:d|s|ing)?|pull(?:ed|ing)?)\s+(?:up\s+)?(?:her\s+|his\s+|their\s+)?(?:skirt|dress|hem)|\b(?:skirt|dress|hem)\s+(?:is\s+)?(?:lifted|raised|pulled\s+up)|(?:掀起?|撩起?|拉起?).{0,8}(?:裙|裙摆|裙擺|衣服)|(?:юбк|подол).{0,24}(?:поднят|задран|приподнят)|(?:falda|vestido).{0,20}(?:levantad|subid)|(?:rock|kleid).{0,20}(?:hochgehoben|angehoben)|(?:jupe|robe).{0,20}(?:relevée|soulevée)|(?:saia|vestido).{0,20}(?:levantad|erguid)|(?:gonna|vestito).{0,20}(?:sollevat|alzat)|(?:etek|elbise).{0,20}(?:kaldır)|(?:váy).{0,20}(?:vén|kéo lên)|(?:rok|jurk).{0,20}(?:opgetild|omhoog)|(?:spódnic|sukienk).{0,20}(?:podnies|unies)|(?:szoknya|ruha).{0,20}(?:felhúz|felemel)|(?:スカート|ドレス).{0,12}(?:めく|持ち上)|(?:치마|드레스).{0,12}(?:올리|들어)|(?:تنورة|فستان).{0,20}(?:رفع|مرفوع)|(?:กระโปรง|ชุด).{0,20}(?:ยก|เปิด)/iu;
const SEXUALIZED_CAMERA_ACTION =
  /\b(?:high[- ]?kick|spread(?:ing)?\s+(?:her|his|their)\s+legs?|legs?\s+spread|crotch|upskirt|panty\s*shot|under[- ]?skirt|patada\s+alta|coup\s+de\s+pied\s+haut|chute\s+alto|calcio\s+alto|yüksek\s+tekme|hoge\s+trap|wysokie\s+kopnięcie|magas\s+rúgás)\b|(?:高踢腿|朝(?:着)?镜头踢|劈叉|胯部|裙底|裙底偷拍|走光|ハイキック|股間|スカートの中|하이킥|가랑이|치마 속|ركلة عالية|بين الساقين|تحت التنورة|เตะสูง|หว่างขา|ใต้กระโปรง|đá cao|háng|dưới váy)|(?:hi[- ]?kick|высок(?:ий|о)\s+удар|раздвигает\s+ноги)/iu;
const REVEAL_EUPHEMISM =
  /\b(?:show(?:s|ing|ed)?|reveal(?:s|ing|ed)?|display(?:s|ing|ed)?)\s+(?:something|what(?:'s| is)?\s+underneath|underneath)\b|(?:展示|露出|给镜头看).{0,10}(?:什么|裙底|里面)|(?:демонстриру|показыва).{0,24}(?:что-то|под\s+юбк)/iu;
const ADULT_CONFIRMATION =
  /\b(?:adult|woman|man|aged\s+(?:1[89]|[2-9]\d)|(?:1[89]|[2-9]\d)[- ]?year[- ]old)\b|(?:成年人|成年女性|成年男性|(?:1[89]|[2-9]\d)岁)|(?:взросл|женщина|мужчина)/iu;
const SAFE_PERFORMANCE_CONTEXT =
  /\b(?:martial\s+arts|karate|taekwondo|ballet|dance\s+class|sports?\s+uniform|athletic\s+wear)\b|(?:武术|空手道|跆拳道|芭蕾|舞蹈课|运动服)|(?:каратэ|тхэквондо|балет|спортивн)/iu;

function normalize(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

export function classifyPromptLocally(prompt: string): SafetyDecision {
  const text = normalize(prompt);
  const minor = MINOR_TERMS.test(text) || EXPLICIT_MINOR_AGE.test(text);
  const sexualText = text.replace(
    /(?:非色情|无裸露|無裸露|不是色情|无色情内容|無色情內容|性教育|性健康|裸色|not\s+(?:pornographic|sexual|nude)|without\s+nudity|sex(?:ual)?\s+(?:education|health)|nude(?:[- ]tone|\s+(?:color|lipstick|palette|shade))|naked\s+cake|сексуальн(?:ое|ого|ом)\s+(?:образован|здоров)|без\s+обнажения|educación\s+sexual|salud\s+sexual|sin\s+desnudos?|sexualkunde|sexuelle\s+gesundheit|keine\s+nacktheit|éducation\s+sexuelle|santé\s+sexuelle|sans\s+nudité|educação\s+sexual|saúde\s+sexual|sem\s+nudez|educazione\s+sessuale|salute\s+sessuale|senza\s+nudità|cinsel\s+(?:eğitim|sağlık)|çıplaklık\s+yok|giáo\s+dục\s+giới\s+tính|sức\s+khỏe\s+tình\s+dục|không\s+khỏa\s+thân|seksuele\s+(?:voorlichting|gezondheid)|geen\s+naaktheid|edukacja\s+seksualna|zdrowie\s+seksualne|bez\s+nagości|szexuális\s+(?:felvilágosítás|egészség)|meztelenség\s+nélkül|성교육|성\s*건강|노출\s*없음|التثقيف\s+الجنسي|الصحة\s+الجنسية|بدون\s+عري|เพศศึกษา|สุขภาพทางเพศ|ไม่มีภาพเปลือย|裸体なし|ヌードなし)/giu,
    ' '
  );
  const sexual = SEXUAL_TERMS.test(sexualText);
  const exploitation = CHILD_EXPLOITATION_CONTEXT.test(text);
  const coercion = COERCION_TERMS.test(text);
  const exposure = EXPOSURE_ACTION.test(text);
  const sexualizedCamera = SEXUALIZED_CAMERA_ACTION.test(text);
  const revealEuphemism = REVEAL_EUPHEMISM.test(text);
  const confirmedAdult = ADULT_CONFIRMATION.test(text);
  const safePerformance = SAFE_PERFORMANCE_CONTEXT.test(text);

  if (minor && (sexual || exploitation)) {
    return {
      allowed: false,
      category: 'sexual_minors',
      severity: 'critical',
      confidence: EXPLICIT_MINOR_AGE.test(text) ? 99 : 94,
      source: 'local_rule',
      reviewStatus: 'pending',
      publicMessage:
        'This request involves sexualized or exploitative content concerning a minor. It was blocked before generation and no credits were charged.',
    };
  }

  if (coercion && sexual) {
    return {
      allowed: false,
      category: 'sexual_nonconsensual',
      severity: 'high',
      confidence: 92,
      source: 'local_rule',
      reviewStatus: 'pending',
      publicMessage:
        'This request may depict non-consensual sexual content. It was blocked before generation and no credits were charged.',
    };
  }

  if (sexual) {
    return {
      allowed: false,
      category: 'sexual_explicit',
      severity: 'high',
      confidence: 96,
      source: 'local_rule',
      reviewStatus: 'pending',
      publicMessage:
        'This request contains explicit sexual or nudity instructions. It was blocked before generation and no credits were charged.',
    };
  }

  if (
    (exposure && (sexualizedCamera || revealEuphemism)) ||
    (sexualizedCamera && revealEuphemism && !confirmedAdult && !safePerformance)
  ) {
    return {
      allowed: false,
      category: minor ? 'sexual_minors' : 'sexualized_exposure',
      severity: minor ? 'critical' : 'high',
      confidence: minor ? 98 : 91,
      source: 'local_rule',
      reviewStatus: 'pending',
      publicMessage:
        'This request appears designed to expose intimate areas or create sexualized voyeuristic content. It was blocked before generation and no credits were charged.',
    };
  }

  // Clothing, swimwear, underwear, pregnancy, anatomy, "girl" and "young"
  // alone are deliberately allowed. Product color terms and educational uses
  // are stripped above. High-impact account actions require context, not one
  // ambiguous keyword.
  return ALLOWED;
}

function pointsFor(severity: SafetySeverity) {
  if (severity === 'critical') return 70;
  if (severity === 'high') return 35;
  if (severity === 'medium') return 10;
  return 0;
}

async function writeSafetyState(params: {
  userId: string;
  points: number;
  warningCount: number;
  lastCategory: string;
}) {
  const now = new Date();
  let status = params.points > 0 ? 'warned' : 'active';
  let restrictedUntil: Date | null = null;
  if (params.points >= 100) {
    status = 'suspended';
    restrictedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else if (params.points >= 70) {
    status = 'restricted';
    restrictedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else if (params.points >= 30) {
    status = 'restricted';
    restrictedUntil = new Date(now.getTime() + 60 * 60 * 1000);
  }

  const [existing] = await db()
    .select({ userId: userSafetyState.userId, status: userSafetyState.status })
    .from(userSafetyState)
    .where(eq(userSafetyState.userId, params.userId))
    .limit(1);
  const data = {
    status: existing?.status === 'banned' ? 'banned' : status,
    strikePoints: params.points,
    warningCount: params.warningCount,
    restrictedUntil: existing?.status === 'banned' ? null : restrictedUntil,
    lastViolationAt: params.points > 0 ? now : null,
    lastCategory: params.lastCategory,
    updatedAt: now,
  };
  if (existing) {
    await db()
      .update(userSafetyState)
      .set(data)
      .where(
        and(
          eq(userSafetyState.userId, params.userId),
          ne(userSafetyState.status, 'banned')
        )
      );
  } else {
    await db()
      .insert(userSafetyState)
      .values({
        userId: params.userId,
        ...data,
        createdAt: now,
      });
  }
  return { status: data.status, restrictedUntil: data.restrictedUntil };
}

/** Only confirmed image outputs count. Input blocks and detector outages do not. */
export function countsAsConfirmedUnsafeImage(task: {
  mediaType: string;
  safetyAction: string;
  safetyStatus: string;
  safetyReviewStatus: string;
  safetyCategory: string;
}) {
  return (
    task.mediaType === 'image' &&
    task.safetyAction === 'output_quarantined' &&
    task.safetyStatus === 'blocked' &&
    task.safetyReviewStatus === 'confirmed' &&
    task.safetyCategory !== 'moderation_unavailable'
  );
}

async function enforceRepeatedUnsafeImageBan(userId: string) {
  await db().transaction(async (tx: any) => {
    // Serialize output callbacks for one user on the existing safety-state row.
    await tx
      .update(userSafetyState)
      .set({ updatedAt: new Date() })
      .where(eq(userSafetyState.userId, userId));
    // A deliberate administrator reset starts a new counting period.
    const [reset] = await tx
      .select({ createdAt: userStatusAudit.createdAt })
      .from(userStatusAudit)
      .where(
        and(
          eq(userStatusAudit.userId, userId),
          eq(userStatusAudit.scope, 'generation'),
          eq(userStatusAudit.nextStatus, 'active')
        )
      )
      .orderBy(desc(userStatusAudit.createdAt))
      .limit(1);
    const outputs = await tx
      .select({
        mediaType: aiTask.mediaType,
        safetyAction: aiTask.safetyAction,
        safetyStatus: aiTask.safetyStatus,
        safetyReviewStatus: aiTask.safetyReviewStatus,
        safetyCategory: aiTask.safetyCategory,
      })
      .from(aiTask)
      .where(
        and(
          eq(aiTask.userId, userId),
          eq(aiTask.safetyAction, 'output_quarantined'),
          eq(aiTask.mediaType, 'image'),
          eq(aiTask.safetyStatus, 'blocked'),
          eq(aiTask.safetyReviewStatus, 'confirmed'),
          ne(aiTask.safetyCategory, 'moderation_unavailable'),
          ...(reset ? [gt(aiTask.createdAt, reset.createdAt)] : [])
        )
      )
      .limit(3);
    const violations = outputs.filter(countsAsConfirmedUnsafeImage);
    if (violations.length < 3) return;

    const now = new Date();
    const [account] = await tx
      .select()
      .from(userAccountState)
      .where(eq(userAccountState.userId, userId))
      .limit(1);
    const values = {
      status: 'banned',
      reasonCode: 'repeated_confirmed_unsafe_image',
      reason: 'Repeated confirmed unsafe image outputs.',
      suspendedUntil: null,
      changedBy: null,
      version: (account?.version ?? 0) + 1,
      updatedAt: now,
    };
    if (account?.status !== 'banned') {
      if (account)
        await tx
          .update(userAccountState)
          .set(values)
          .where(eq(userAccountState.userId, userId));
      else await tx.insert(userAccountState).values({ userId, ...values });
      await tx.insert(userStatusAudit).values({
        id: getUuid(),
        userId,
        actorUserId: 'system',
        scope: 'account',
        previousStatus: account?.status ?? 'active',
        nextStatus: 'banned',
        reasonCode: values.reasonCode,
        reason: values.reason,
        effectiveUntil: null,
        requestId: '',
      });
    }
    await tx
      .update(userSafetyState)
      .set({ status: 'banned', restrictedUntil: null, updatedAt: now })
      .where(eq(userSafetyState.userId, userId));
    await tx.delete(session).where(eq(session.userId, userId));
    await tx
      .update(apikey)
      .set({ status: 'disabled' })
      .where(and(eq(apikey.userId, userId), eq(apikey.status, 'active')));
  });
}

export async function recalculateUserSafety(userId: string) {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await db()
    .select({
      severity: aiTask.safetySeverity,
      category: aiTask.safetyCategory,
      reviewStatus: aiTask.safetyReviewStatus,
      source: aiTask.safetySource,
      createdAt: aiTask.createdAt,
    })
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, userId),
        eq(aiTask.safetyStatus, 'blocked'),
        gte(aiTask.createdAt, cutoff)
      )
    )
    .orderBy(desc(aiTask.createdAt));
  const counted = (
    rows as Array<{
      severity: string;
      category: string;
      reviewStatus: string;
      source: string;
      createdAt: Date;
    }>
  ).filter((row) => row.reviewStatus === 'confirmed');
  const points = counted.reduce(
    (total, row) => total + pointsFor(row.severity as SafetySeverity),
    0
  );
  const state = await writeSafetyState({
    userId,
    points,
    warningCount: counted.length,
    lastCategory: counted[0]?.category || '',
  });
  await enforceRepeatedUnsafeImageBan(userId);
  const [current] = await db()
    .select()
    .from(userSafetyState)
    .where(eq(userSafetyState.userId, userId))
    .limit(1);
  return current?.status === 'banned'
    ? { status: 'banned', restrictedUntil: null }
    : state;
}

export async function assertUserSafetyAllowed(userId: string) {
  await assertAccountAccessAllowed(userId);
  const [state] = await db()
    .select()
    .from(userSafetyState)
    .where(eq(userSafetyState.userId, userId))
    .limit(1);
  if (!state) return;
  const until = state.restrictedUntil
    ? new Date(state.restrictedUntil).getTime()
    : null;
  if (
    (state.status === 'restricted' || state.status === 'suspended') &&
    until &&
    until <= Date.now()
  ) {
    await db()
      .update(userSafetyState)
      .set({ status: 'active', restrictedUntil: null })
      .where(eq(userSafetyState.userId, userId));
    return;
  }
  if (state.status === 'banned') {
    throw new Error('Image and video generation is disabled for this account.');
  }
  if (state.status === 'restricted' || state.status === 'suspended') {
    const suffix = state.restrictedUntil
      ? ` until ${new Date(state.restrictedUntil).toISOString()}`
      : '';
    throw new Error(
      `Generation is temporarily restricted${suffix}. Review the content policy or contact support if you believe this is a mistake.`
    );
  }
}

export async function moderateAndEnforce(params: {
  userId: string;
  prompt: string;
  imageUrls?: string[];
  mediaType: string;
  model: string;
  moderation?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  };
}) {
  await assertUserSafetyAllowed(params.userId);
  let decision = classifyPromptLocally(params.prompt);
  if (decision.allowed && params.moderation?.apiKey) {
    const external = await moderateWithOpenAIRetry({
      apiKey: params.moderation.apiKey,
      baseUrl: params.moderation.baseUrl,
      model: params.moderation.model,
      text: params.prompt,
      imageUrls: params.imageUrls,
    });
    decision = resolveExternalInputModeration(
      external,
      Boolean(params.imageUrls?.length)
    );
  }
  if (decision.allowed) return decision;

  const technicalFailure = decision.category === 'moderation_unavailable';
  const reviewStatus = technicalFailure
    ? 'not_required'
    : automatedSafetyReviewStatus(decision);
  const now = new Date();
  await db()
    .insert(aiTask)
    .values({
      id: getUuid(),
      userId: params.userId,
      mediaType: params.mediaType,
      provider: 'safety',
      model: params.model,
      prompt: params.prompt,
      options: params.imageUrls?.length
        ? JSON.stringify({ image_urls: params.imageUrls })
        : null,
      status: 'failed',
      taskResult: JSON.stringify({
        errorMessage: decision.publicMessage,
        errorCode: technicalFailure
          ? 'MODERATION_UNAVAILABLE'
          : 'CONTENT_POLICY_BLOCKED',
        moderationReasonCode: decision.reasonCode || '',
      }),
      costCredits: 0,
      safetyStatus: technicalFailure ? 'review' : 'blocked',
      safetyCategory: decision.category,
      safetySeverity: technicalFailure ? 'none' : decision.severity,
      safetySource: decision.source,
      safetyConfidence: decision.confidence,
      safetyReviewStatus: reviewStatus,
      safetyAction: technicalFailure
        ? 'moderation_retry_required'
        : 'request_blocked',
      createdAt: now,
      updatedAt: now,
    });
  if (reviewStatus === 'confirmed') {
    await recalculateUserSafety(params.userId);
  }
  throw new Error(decision.publicMessage);
}

export function resolveExternalInputModeration(
  external: ModerationResult,
  hasReferenceImages: boolean
): SafetyDecision {
  if (external.decision === 'allow') return ALLOWED;

  // Local high-confidence rules already ran. A text-only request should not be
  // treated as a policy violation merely because an optional second opinion
  // timed out or returned a low-confidence review signal.
  if (
    external.decision === 'review' &&
    external.category !== 'moderation_unavailable'
  ) {
    return ALLOWED;
  }
  if (external.decision === 'review' && !hasReferenceImages) return ALLOWED;

  const unavailable = external.category === 'moderation_unavailable';
  return {
    allowed: false,
    category: external.category,
    severity: unavailable ? 'none' : external.severity,
    confidence: external.confidence,
    source: 'external',
    reviewStatus: 'pending',
    reasonCode: external.reasonCode,
    publicMessage: unavailable
      ? 'Generation with reference images is temporarily unavailable while the safety check recovers. No credits were charged, and this is not counted as a policy violation.'
      : external.decision === 'block'
        ? 'This request may violate the content policy. It was blocked before generation and no credits were charged.'
        : 'This reference-image request needs an additional safety review. No credits were charged.',
  };
}

/**
 * A detector outage is an infrastructure condition, not evidence that the
 * generated image is unsafe. The upstream Fal request still has its own
 * safety checker enabled, so an unavailable optional second opinion must not
 * turn an otherwise successful generation into a policy failure.
 */
export function shouldQuarantineGeneratedOutput(
  decision: ModerationResult | null
) {
  return Boolean(
    decision &&
    decision.category !== 'moderation_unavailable' &&
    decision.decision !== 'allow'
  );
}

export function providerSafetyMetadata(message: string) {
  if (
    !/content[_ -]?policy|content[_ -]?safety|safety[_ -]?(?:checker|filter)|moderation|nsfw|not safe for work|flagged/i.test(
      message
    )
  ) {
    return null;
  }
  return {
    safetyStatus: 'blocked',
    safetyCategory: 'provider_policy',
    safetySeverity: 'medium',
    safetySource: 'provider',
    safetyConfidence: 50,
    // A provider error string is one source only. Block the task without
    // penalizing the account or creating mandatory manual-review work.
    safetyReviewStatus: 'not_required',
    safetyAction: 'provider_blocked',
  };
}

export async function reviewSafetyTask(params: {
  taskId: string;
  action: 'confirm' | 'false_positive' | 'release_account';
  actorUserId: string;
}) {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(eq(aiTask.id, params.taskId))
    .limit(1);
  if (!task || task.safetyStatus !== 'blocked') {
    throw new Error('Safety event not found');
  }
  if (params.action === 'release_account') {
    const [state] = await db()
      .select()
      .from(userSafetyState)
      .where(eq(userSafetyState.userId, task.userId))
      .limit(1);
    if (state?.status === 'banned') {
      throw new Error(
        'Use user status management to restore both account and generation access.'
      );
    }
    await writeSafetyState({
      userId: task.userId,
      points: 0,
      warningCount: 0,
      lastCategory: '',
    });
    await db()
      .insert(userStatusAudit)
      .values({
        id: getUuid(),
        userId: task.userId,
        actorUserId: params.actorUserId,
        scope: 'generation',
        previousStatus: state?.status ?? 'active',
        nextStatus: 'active',
        reasonCode: 'admin_safety_reset',
        reason: 'Administrator reset generation safety restrictions.',
        effectiveUntil: null,
        requestId: '',
      });
    return { userId: task.userId, status: 'active' };
  }
  await db()
    .update(aiTask)
    .set({
      safetyReviewStatus:
        params.action === 'confirm' ? 'confirmed' : 'false_positive',
    })
    .where(eq(aiTask.id, task.id));
  const state = await recalculateUserSafety(task.userId);
  return { userId: task.userId, ...state };
}
