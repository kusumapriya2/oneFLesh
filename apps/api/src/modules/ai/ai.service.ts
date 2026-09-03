// ============================================================
// OneFlesh — AI Service (Anthropic claude-sonnet-4-5)
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { redis, RedisKeys, RedisTTL } from '../../config/redis.js';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../middleware/errorHandler.js';
import { emitToUser } from '../../socket/index.js';
import type {
  AIMatchInput,
  AILetterInput,
  AIAllianceSummaryInput,
  AIChatInput,
  AIMatchResult,
} from '@oneflesh/shared';
import { AIFeature, SeekingType, UserRole } from '@oneflesh/shared';
import type { Profile, Alliance } from '@prisma/client';

const MODEL = 'claude-sonnet-4-5';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// ─── Spend tracking ───────────────────────────────────────────

async function checkAndTrackSpend(tokensUsed: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0] as string;
  const key = RedisKeys.aiDailyTokens(today);
  const current = await redis.incrby(key, tokensUsed);
  if (current === tokensUsed) await redis.expire(key, 86400); // first of day

  // Rough cost: claude-sonnet ≈ $3/1M input, $15/1M output — assume average $6/1M
  const estimatedCost = (current / 1_000_000) * 6;
  if (estimatedCost > env.AI_DAILY_SPEND_LIMIT) {
    throw new AppError(503, 'AI_LIMIT_REACHED', 'Daily AI spend limit reached');
  }
  if (estimatedCost > env.AI_DAILY_SPEND_ALERT) {
    logger.warn(`AI daily spend alert: $${estimatedCost.toFixed(2)}`);
  }
}

// ─── Log interaction ──────────────────────────────────────────

async function logInteraction(
  userId: string,
  feature: AIFeature,
  prompt: string,
  response: string,
  tokensUsed: number,
): Promise<void> {
  try {
    await prisma.aIInteraction.create({
      data: {
        userId,
        feature,
        prompt,
        response,
        tokensUsed,
      },
    });
  } catch (err) {
    // Non-fatal — log but don't block
    logger.error('Failed to log AI interaction:', err);
  }
}

// ─── System prompt builder ────────────────────────────────────

export function buildSystemPrompt(
  activeProfiles: Array<Partial<Profile>>,
  activeAlliances: Array<Partial<Alliance>>,
): string {
  const profileSummaries = activeProfiles.map((p) => ({
    id: p.id,
    age: p.age,
    city: p.city,
    state: p.state,
    seeking: p.seeking,
    education: p.education,
    occupation: p.occupation,
    ministryInvolvement: p.ministryInvolvement,
    yearsInChurch: p.yearsInChurch,
    // Deliberately omit: fullName, fatherName, photoUrl, testimony (PII)
  }));

  const allianceSummaries = activeAlliances.map((a) => ({
    id: a.id,
    stage: a.stage,
    status: a.status,
    profile1Id: a.profile1Id,
    profile2Id: a.profile2Id,
  }));

  return `You are a pastoral assistant for OneFlesh, a Reformed church matrimonial platform in India.

## Platform Rules
- All introductions are strictly pastor-mediated. Profiles are never shown directly to candidates.
- The platform is grounded in Reformed (Calvinist) theology: Scripture alone, Christ alone, Faith alone, Grace alone, God's glory alone.
- Privacy is paramount: never reveal or infer phone numbers, email addresses, home addresses, Aadhaar numbers, surnames, or any other personally identifiable information.
- All communications should be formal, warm, and theologically grounded.

## Theological Posture
- Use Reformed theological language naturally: covenant, sanctification, vocation, stewardship, headship, submission, the Confession, the Westminster Standards.
- Marriage is a covenant instituted by God (Genesis 2:24), a picture of Christ and the Church (Ephesians 5:22–33).
- Counsel pastors to be thorough, prayerful, and unhurried in their discernment.

## Privacy Instructions (STRICT)
- NEVER output any phone number, email address, home address, Aadhaar number, bank account, or financial detail.
- NEVER reveal a candidate's surname unless it is clearly public-domain pastoral information.
- NEVER attempt to identify real individuals from the anonymised profile data provided.
- If asked for PII, politely decline and redirect.

## Active Platform Data (anonymised)
Active Profiles: ${JSON.stringify(profileSummaries)}
Active Alliances: ${JSON.stringify(allianceSummaries)}

Respond with Reformed pastoral wisdom, brevity where possible, and always with the glory of God in view.`;
}

// ─── Match scoring ────────────────────────────────────────────

export async function getMatchScores(
  data: AIMatchInput,
  userId: string,
): Promise<AIMatchResult[]> {
  // Check cache first
  const cacheKey = RedisKeys.aiResponseCache(`match:${data.profileId}:${data.topN}`);
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.debug(`AI match cache hit for profile ${data.profileId}`);
    return JSON.parse(cached) as AIMatchResult[];
  }

  // Load source profile
  const sourceProfile = await prisma.profile.findUnique({
    where: { id: data.profileId },
    include: { church: { select: { denomination: true, city: true, state: true } } },
  });

  if (!sourceProfile || sourceProfile.status !== 'APPROVED') {
    throw new AppError(404, 'PROFILE_NOT_FOUND', `Profile ${data.profileId} not found or not approved`);
  }

  // Determine target seeking type (opposite)
  const targetSeeking =
    sourceProfile.seeking === SeekingType.BRIDE ? SeekingType.GROOM : SeekingType.BRIDE;

  // Load all active alliances involving this profile to exclude
  const existingAlliances = await prisma.alliance.findMany({
    where: {
      status: 'ACTIVE',
      OR: [{ profile1Id: data.profileId }, { profile2Id: data.profileId }],
    },
    select: { profile1Id: true, profile2Id: true },
  });

  const excludedProfileIds = new Set<string>(
    existingAlliances.flatMap((a) => [a.profile1Id, a.profile2Id]).filter((id) => id !== data.profileId),
  );

  // Load potential matches
  const candidates = await prisma.profile.findMany({
    where: {
      status: 'APPROVED',
      seeking: targetSeeking,
      deletedAt: null,
      id: { notIn: [...excludedProfileIds] },
    },
    include: { church: { select: { denomination: true, city: true, state: true } } },
    take: 50, // Cap to avoid large prompts
  });

  if (candidates.length === 0) {
    return [];
  }

  // ─── Local scoring ────────────────────────────────────────
  type ScoredCandidate = {
    profile: (typeof candidates)[number];
    score: number;
    breakdown: {
      denomination: number;
      age: number;
      ministry: number;
      endorsements: number;
      location: number;
    };
  };

  const scored: ScoredCandidate[] = candidates.map((candidate) => {
    // Denomination (30%)
    const denominationScore =
      candidate.church?.denomination === sourceProfile.church?.denomination ? 30 : 0;

    // Age gap (20%) — ideal gap <= 5 years, penalise proportionally
    const ageGap = Math.abs(candidate.age - sourceProfile.age);
    const ageScore = ageGap <= 5 ? 20 : ageGap <= 10 ? 10 : ageGap <= 15 ? 5 : 0;

    // Ministry involvement (20%) — both having it is ideal
    const sourceHasMinistry = Boolean(sourceProfile.ministryInvolvement?.trim());
    const candidateHasMinistry = Boolean(candidate.ministryInvolvement?.trim());
    const ministryScore =
      sourceHasMinistry && candidateHasMinistry ? 20 : candidateHasMinistry || sourceHasMinistry ? 10 : 5;

    // Endorsements (15%) — more is better
    const endorsementsArray = Array.isArray(candidate.endorsements)
      ? (candidate.endorsements as unknown[])
      : [];
    const endorsementsScore =
      endorsementsArray.length >= 3 ? 15 : endorsementsArray.length === 2 ? 10 : 5;

    // Location (15%) — same state
    const locationScore = candidate.state === sourceProfile.state ? 15 : 0;

    const total = denominationScore + ageScore + ministryScore + endorsementsScore + locationScore;

    return {
      profile: candidate,
      score: total,
      breakdown: {
        denomination: denominationScore,
        age: ageScore,
        ministry: ministryScore,
        endorsements: endorsementsScore,
        location: locationScore,
      },
    };
  });

  // Sort by local score descending and take top N * 2 for Claude to re-rank
  const topCandidates = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(data.topN * 2, 20));

  // ─── Claude re-ranking ────────────────────────────────────
  const candidateDescriptions = topCandidates.map((c) => ({
    id: c.profile.id,
    age: c.profile.age,
    state: c.profile.state,
    denomination: c.profile.church?.denomination ?? 'Unknown',
    occupation: c.profile.occupation,
    education: c.profile.education,
    ministryInvolvement: c.profile.ministryInvolvement,
    yearsInChurch: c.profile.yearsInChurch,
    endorsementsCount: Array.isArray(c.profile.endorsements)
      ? (c.profile.endorsements as unknown[]).length
      : 0,
    localScore: c.score,
  }));

  const sourceDescription = {
    age: sourceProfile.age,
    state: sourceProfile.state,
    denomination: sourceProfile.church?.denomination ?? 'Unknown',
    occupation: sourceProfile.occupation,
    education: sourceProfile.education,
    ministryInvolvement: sourceProfile.ministryInvolvement,
    yearsInChurch: sourceProfile.yearsInChurch,
    endorsementsCount: Array.isArray(sourceProfile.endorsements)
      ? (sourceProfile.endorsements as unknown[]).length
      : 0,
  };

  const prompt = `You are a Reformed pastoral matchmaking assistant. Evaluate the following candidates for the source profile and provide a ranked list with reasons.

Source Profile: ${JSON.stringify(sourceDescription)}

Candidates: ${JSON.stringify(candidateDescriptions)}

For each candidate, provide:
1. A compatibility score out of 100 (considering denominational alignment, age suitability, ministry involvement, shared values, and geographical proximity)
2. A brief pastoral reason (2–3 sentences) why this candidate is or isn't a good match

Respond ONLY with a valid JSON array (no markdown, no preamble) in this exact format:
[{"id": "candidate-id", "score": 85, "reason": "..."}]

Rank from highest to lowest score. Return at most ${data.topN} results.`;

  let claudeRankings: Array<{ id: string; score: number; reason: string }> = [];

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;

    await checkAndTrackSpend(totalTokens);

    const content = message.content[0];
    if (content?.type === 'text') {
      claudeRankings = JSON.parse(content.text) as typeof claudeRankings;
    }

    await logInteraction(userId, AIFeature.MATCH_SCORING, prompt, content?.type === 'text' ? content.text : '', totalTokens);
  } catch (err) {
    if (err instanceof AppError) throw err;
    // Claude failed — fall back to local scores only
    logger.warn('Claude match scoring failed, falling back to local scores:', err);
    claudeRankings = topCandidates.slice(0, data.topN).map((c) => ({
      id: c.profile.id,
      score: c.score,
      reason: 'Score based on denomination, age, ministry involvement, endorsements, and location.',
    }));
  }

  // Build final results merging Claude data with full profile objects
  const profileMap = new Map(topCandidates.map((c) => [c.profile.id, c]));

  const results: AIMatchResult[] = claudeRankings
    .slice(0, data.topN)
    .map((ranking) => {
      const candidate = profileMap.get(ranking.id);
      if (!candidate) {
        return null;
      }

      return {
        profileId: candidate.profile.id,
        profile: candidate.profile as unknown as import('@oneflesh/shared').Profile,
        score: ranking.score,
        breakdown: candidate.breakdown,
        reason: ranking.reason,
      };
    })
    .filter((r): r is AIMatchResult => r !== null);

  // Cache for 1 hour
  await redis.setex(cacheKey, RedisTTL.AI_RESPONSE_CACHE, JSON.stringify(results));

  return results;
}

// ─── Draft letter ─────────────────────────────────────────────

export async function draftLetter(data: AILetterInput, userId: string): Promise<string> {
  const prompt = `You are a pastoral assistant helping draft a formal but warm introductory letter between two Reformed churches on the OneFlesh matrimonial platform.

From: Pastor ${data.fromPastorName}, ${data.fromChurchName}
To: Pastor ${data.toPastorName}, ${data.toChurchName}
Candidate: ${data.candidateName} (from ${data.fromChurchName})
Regarding: ${data.targetCandidateName} (from ${data.toChurchName})

Draft a formal pastoral introduction letter. The tone should be:
- Warm yet appropriately formal
- Grounded in Reformed theology (reference covenant, vocation, God's providence as appropriate)
- Personal but not presumptuous
- Respectful of the pastoral process
- Under 400 words

Begin with "Dear Pastor ${data.toPastorName}," and end with a prayerful closing. Do not include placeholder text — write the complete letter.`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const totalTokens = message.usage.input_tokens + message.usage.output_tokens;
  await checkAndTrackSpend(totalTokens);

  const content = message.content[0];
  const letter = content?.type === 'text' ? content.text : '';

  await logInteraction(userId, AIFeature.LETTER_DRAFTING, prompt, letter, totalTokens);

  return letter;
}

// ─── Generate counselling questions ──────────────────────────

export async function generateCounsellingQuestions(
  sessionNumber: number,
  sessionTopic: string,
  scripture: string,
  userId: string,
): Promise<string[]> {
  const prompt = `You are a Reformed pastor generating pre-marital counselling discussion questions.

Session ${sessionNumber} of 6: "${sessionTopic}"
Primary Scriptures: ${scripture}

Generate 5–8 thoughtful discussion questions for this counselling session. The questions should:
- Be grounded in the scripture passages provided
- Be suitable for a Reformed Christian context (assume covenant theology, complementarian roles)
- Encourage genuine reflection and honest conversation between the couple
- Progress from foundational to more personal/practical
- Avoid yes/no questions — use "how", "what", "describe", "explain"

Respond ONLY with a valid JSON array of strings (no markdown, no preamble, no numbering):
["Question 1?", "Question 2?", ...]`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const totalTokens = message.usage.input_tokens + message.usage.output_tokens;
  await checkAndTrackSpend(totalTokens);

  const content = message.content[0];
  const rawText = content?.type === 'text' ? content.text : '[]';

  let questions: string[];
  try {
    questions = JSON.parse(rawText) as string[];
    if (!Array.isArray(questions)) {
      throw new Error('Not an array');
    }
  } catch {
    // Parse failure — extract lines as fallback
    questions = rawText
      .split('\n')
      .map((l) => l.replace(/^[\d\.\-\*\s"]+/, '').replace(/["]+$/, '').trim())
      .filter((l) => l.length > 10 && l.endsWith('?'));
  }

  await logInteraction(userId, AIFeature.COUNSELLING_QUESTIONS, prompt, rawText, totalTokens);

  return questions;
}

// ─── Generate alliance summary ────────────────────────────────

export async function generateAllianceSummary(
  data: AIAllianceSummaryInput,
  userId: string,
): Promise<string> {
  // H-07: Church scope check — the requesting pastor must belong to one of the two alliance churches.
  // Fetch user role + slim alliance access record in parallel for minimal DB round-trips.
  const [requestingUser, allianceAccess] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { churchId: true, role: true },
    }),
    prisma.alliance.findUnique({
      where: { id: data.allianceId },
      select: { church1Id: true, church2Id: true },
    }),
  ]);

  if (!allianceAccess) {
    throw new AppError(404, 'ALLIANCE_NOT_FOUND', `Alliance ${data.allianceId} not found`);
  }

  const isInvolved =
    requestingUser?.churchId === allianceAccess.church1Id ||
    requestingUser?.churchId === allianceAccess.church2Id;

  if (!isInvolved && requestingUser?.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You do not have access to this alliance',
    );
  }

  const alliance = await prisma.alliance.findUnique({
    where: { id: data.allianceId },
    include: {
      profile1: {
        select: {
          age: true,
          city: true,
          state: true,
          seeking: true,
          ministryInvolvement: true,
          occupation: true,
          yearsInChurch: true,
        },
      },
      profile2: {
        select: {
          age: true,
          city: true,
          state: true,
          seeking: true,
          ministryInvolvement: true,
          occupation: true,
          yearsInChurch: true,
        },
      },
      church1: { select: { name: true, denomination: true, city: true } },
      church2: { select: { name: true, denomination: true, city: true } },
      notes: {
        select: { content: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 10,
      },
    },
  });

  if (!alliance) {
    throw new AppError(404, 'ALLIANCE_NOT_FOUND', `Alliance ${data.allianceId} not found`);
  }

  const STAGE_LABELS: Record<number, string> = {
    1: 'Interest Expressed',
    2: 'Evaluation',
    3: 'Families Introduced',
    4: 'Pre-Marital Counselling',
    5: 'Completed / Engaged',
  };

  const allianceContext = {
    currentStage: alliance.stage,
    stageLabel: STAGE_LABELS[alliance.stage] ?? `Stage ${alliance.stage}`,
    status: alliance.status,
    church1: alliance.church1,
    church2: alliance.church2,
    profile1: alliance.profile1,
    profile2: alliance.profile2,
    recentNotes: alliance.notes.slice(-5).map((n) => ({
      content: n.content,
      date: n.createdAt.toISOString().split('T')[0],
    })),
  };

  const prompt = `You are a Reformed pastoral assistant providing a summary of a matrimonial alliance in progress.

Alliance Data: ${JSON.stringify(allianceContext)}

Provide a concise pastoral summary (150–250 words) covering:
1. Current status and stage of the alliance
2. Key observations about the compatibility of the two parties
3. Any concerns or highlights from the pastoral notes
4. Suggested next steps for the pastors involved

Write in a pastoral, theological tone. Use "the parties" or "the candidates" (not names). Be practical and spiritually encouraging.`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const totalTokens = message.usage.input_tokens + message.usage.output_tokens;
  await checkAndTrackSpend(totalTokens);

  const content = message.content[0];
  const summary = content?.type === 'text' ? content.text : '';

  await logInteraction(userId, AIFeature.ALLIANCE_SUMMARY, prompt, summary, totalTokens);

  return summary;
}

// ─── Chat ─────────────────────────────────────────────────────

export async function chat(data: AIChatInput, userId: string): Promise<string> {
  // Build conversation messages
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...data.history,
    { role: 'user', content: data.message },
  ];

  const systemPrompt = `You are a pastoral assistant for OneFlesh, a Reformed church matrimonial platform.

## Rules
- Keep responses under 200 words unless drafting a letter (in which case, match appropriate length).
- Use Reformed theological language naturally.
- NEVER reveal PII: phone, email, address, Aadhaar, surnames.
- If asked to draft a letter, produce the complete letter.
- Respond pastorally, warmly, and with scriptural grounding where appropriate.
- You may reference the platform's process (pastor-mediated introductions, 5-stage alliance process, 6-session counselling) when relevant.`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const totalTokens = message.usage.input_tokens + message.usage.output_tokens;
  await checkAndTrackSpend(totalTokens);

  const content = message.content[0];
  const response = content?.type === 'text' ? content.text : '';

  await logInteraction(userId, AIFeature.CHAT, data.message, response, totalTokens);

  return response;
}

// ─── Stream chat ──────────────────────────────────────────────

export async function streamChat(
  data: AIChatInput,
  userId: string,
  onToken: (token: string) => void,
): Promise<void> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...data.history,
    { role: 'user', content: data.message },
  ];

  const systemPrompt = `You are a pastoral assistant for OneFlesh, a Reformed church matrimonial platform.

## Rules
- Keep responses under 200 words unless drafting a letter.
- Use Reformed theological language naturally.
- NEVER reveal PII: phone, email, address, Aadhaar, surnames.
- Respond pastorally, warmly, and with scriptural grounding where appropriate.`;

  let fullResponse = '';
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      const token = event.delta.text;
      fullResponse += token;
      onToken(token);
    }

    if (event.type === 'message_delta' && event.usage) {
      totalOutputTokens = event.usage.output_tokens;
    }

    if (event.type === 'message_start' && event.message.usage) {
      totalInputTokens = event.message.usage.input_tokens;
    }
  }

  const totalTokens = totalInputTokens + totalOutputTokens;

  await checkAndTrackSpend(totalTokens);
  await logInteraction(userId, AIFeature.CHAT, data.message, fullResponse, totalTokens);

  // Emit completion event to the user's socket
  emitToUser(userId, 'ai:stream:complete', { feature: AIFeature.CHAT });
}

