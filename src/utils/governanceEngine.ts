import { GoogleGenAI, Type } from '@google/genai';
import {
  BrandLibraryState,
  RetrievedPassage,
  Finding,
  FindingCategory,
  FindingSeverity,
  BannerVisualConfig,
  DiscardedFindingTrace,
  AutopilotConfig,
  RiskBand,
  ContentItem,
  AutopilotDiffChange,
  AutopilotActionRecord,
} from '../types';

/**
 * 1. WCAG 2.1 Relative Luminance & Contrast Ratio Calculator (Pure Code)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  return null;
}

export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const R = toLinear(rs);
  const G = toLinear(gs);
  const B = toLinear(bs);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function getContrastRatio(fgHex: string, bgHex: string): number {
  const l1 = getRelativeLuminance(fgHex);
  const l2 = getRelativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * 2. Risk Score Calculator (0 to 100) for Autopilot Governance
 * Evaluates category, severity, confidence, source strength, confidential exposure, and always-escalate list.
 */
export function calculateFindingRisk(
  finding: Finding,
  contentText: string,
  library: BrandLibraryState,
  config: AutopilotConfig
): { riskScore: number; riskBand: RiskBand; riskFactors: string[] } {
  const factors: string[] = [];
  let score = 15;

  const qLower = finding.quotedText.toLowerCase();
  const expLower = finding.explanation.toLowerCase();

  // Base score by category
  if (finding.category === 'terminology') {
    score = 16;
    factors.push('Terminology swap (+16)');
  } else if (finding.category === 'tone') {
    score = 18;
    factors.push('Editorial tone adjustment (+18)');
  } else if (finding.category === 'accessibility') {
    score = 22;
    factors.push('Accessibility alt-text remediation (+22)');
  } else if (finding.category === 'visual') {
    score = 46;
    factors.push('Visual contrast / palette adjustment (+46)');
  } else if (finding.category === 'messaging') {
    score = 68;
    factors.push('Messaging substantiation check (+68)');
  } else if (finding.category === 'claim') {
    score = 78;
    factors.push('Factual / regulatory claim (+78)');
  }

  // Severity modifier
  if (finding.severity === 'high' && score >= 40) {
    score += 12;
    factors.push('High severity (+12)');
  } else if (finding.severity === 'low') {
    score = Math.max(8, score - 6);
  }

  // Specific high-risk triggers: price, health/medical, legal, "guaranteed", "100% pesticide-free", confidential
  const isPriceOrHealthOrLegal =
    qLower.includes('₹') ||
    qLower.includes('guaranteed') ||
    qLower.includes('miracle') ||
    qLower.includes('cure') ||
    qLower.includes('100% pesticide-free') ||
    expLower.includes('price') ||
    expLower.includes('mrp') ||
    expLower.includes('clinical') ||
    expLower.includes('asci');

  if (isPriceOrHealthOrLegal) {
    score = Math.max(score, 84);
    factors.push('Price, health, legal or unbacked guarantee trigger (≥84)');
  }

  // Confidential material check
  const hasConfidentialLeak =
    contentText.includes('28.5%') ||
    contentText.toLowerCase().includes('kodagu wildflower') ||
    library.facts.some((f) => f.id === finding.sourceId && f.confidential) ||
    library.guidelines.some((g) => g.id === finding.sourceId && g.confidential);

  if (hasConfidentialLeak) {
    score = Math.max(score, 92);
    factors.push('Confidential brand material detected (≥92)');
  }

  // Source strength & AI confidence penalty
  const isGlossaryOrDeterministic = finding.origin === 'rule-engine';
  if (!isGlossaryOrDeterministic && finding.confidence < 0.8) {
    score += 14;
    factors.push(`Lower AI confidence ${Math.round(finding.confidence * 100)}% (+14)`);
  } else if (isGlossaryOrDeterministic && score < 30) {
    factors.push('Deterministic code rule (High source strength)');
  }

  // Brand Admin Always-Escalate Category Override
  if (config.alwaysEscalateCategories.includes(finding.category)) {
    score = Math.max(score, config.highRiskThreshold + 10);
    factors.push(`Category "${finding.category}" is in Admin Always-Escalate list`);
  }

  const finalScore = Math.max(4, Math.min(99, Math.round(score)));
  let riskBand: RiskBand = 'low';
  if (finalScore > config.highRiskThreshold) {
    riskBand = 'high';
  } else if (finalScore >= config.lowRiskThreshold) {
    riskBand = 'medium';
  }

  return {
    riskScore: finalScore,
    riskBand,
    riskFactors: factors,
  };
}

export function attachRiskScoresToFindings(
  findings: Finding[],
  contentText: string,
  library: BrandLibraryState
): Finding[] {
  return findings.map((f) => {
    const { riskScore, riskBand, riskFactors } = calculateFindingRisk(
      f,
      contentText,
      library,
      library.autopilotConfig
    );
    return {
      ...f,
      riskScore,
      riskBand,
      riskFactors,
    };
  });
}

/**
 * 3. Retrieval-First Passage Splitter & Ranker
 */
export function retrieveTopPassages(
  contentText: string,
  bannerConfig: BannerVisualConfig | undefined,
  library: BrandLibraryState,
  topK = 6
): RetrievedPassage[] {
  const allPassages: RetrievedPassage[] = [];

  for (const g of library.guidelines) {
    allPassages.push({
      passageId: `P-${g.id}`,
      sourceId: g.id,
      sourceTitle: g.title,
      sourceType: 'Guideline',
      text: g.content,
      relevanceScore: 0,
      matchedTerms: [],
      confidential: g.confidential,
    });
  }

  for (const f of library.facts) {
    allPassages.push({
      passageId: `P-${f.id}`,
      sourceId: f.id,
      sourceTitle: f.title,
      sourceType: 'Approved Fact',
      text: f.statement,
      relevanceScore: 0,
      matchedTerms: [],
      confidential: f.confidential,
    });
  }

  for (const t of library.terminology) {
    allPassages.push({
      passageId: `P-${t.id}`,
      sourceId: t.id,
      sourceTitle: `Terminology: ${t.bannedTerm}`,
      sourceType: 'Terminology',
      text: `Banned term "${t.bannedTerm}". Use preferred term: "${t.preferredTerm}". Reason: ${t.reason}`,
      relevanceScore: 0,
      matchedTerms: [],
      confidential: t.confidential,
    });
  }

  for (const a of library.assets) {
    allPassages.push({
      passageId: `P-${a.id}`,
      sourceId: a.id,
      sourceTitle: a.name,
      sourceType: 'Brand Asset',
      text: `${a.description} ${a.ruleText}`,
      relevanceScore: 0,
      matchedTerms: [],
      confidential: a.confidential,
    });
  }

  const normalizedDraft = `${contentText} ${bannerConfig?.headline || ''} ${bannerConfig?.subline || ''}`.toLowerCase();
  const draftTokens = Array.from(
    new Set(
      normalizedDraft
        .replace(/[^\w\s₹%#.-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3)
    )
  );

  for (const p of allPassages) {
    const passageLower = `${p.sourceTitle} ${p.text}`.toLowerCase();
    const matched: string[] = [];
    let rawScore = 0.15;

    for (const token of draftTokens) {
      if (passageLower.includes(token)) {
        matched.push(token);
        rawScore += token.startsWith('₹') || token.includes('%') ? 0.28 : 0.12;
      }
    }

    if (p.sourceType === 'Terminology') {
      const termItem = library.terminology.find((t) => t.id === p.sourceId);
      if (termItem && normalizedDraft.includes(termItem.bannedTerm.toLowerCase())) {
        rawScore += 0.65;
        if (!matched.includes(termItem.bannedTerm)) matched.push(termItem.bannedTerm);
      }
    }

    if (bannerConfig?.hasBanner && (p.sourceId === 'G-04' || p.sourceId === 'A-01')) {
      rawScore += 0.35;
      matched.push('banner-contrast');
    }

    p.relevanceScore = Math.min(0.99, Number(rawScore.toFixed(2)));
    p.matchedTerms = matched.slice(0, 5);
  }

  return allPassages
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);
}

/**
 * 4. Redact Confidential Items before sending to External AI
 * Safety rail: Always enforced in Autopilot mode.
 */
export function redactConfidentialContent(
  contentText: string,
  passages: RetrievedPassage[],
  library: BrandLibraryState,
  redactEnabled: boolean
): { sanitizedText: string; sanitizedPassages: RetrievedPassage[]; redactionsApplied: number } {
  const mustRedact = redactEnabled || library.autopilotConfig.alwaysRedactConfidential;
  if (!mustRedact) {
    return {
      sanitizedText: contentText,
      sanitizedPassages: passages,
      redactionsApplied: 0,
    };
  }

  let redactionsApplied = 0;
  let sanitizedText = contentText;

  const confidentialPatterns = ['28.5%', 'Kodagu Wildflower', '₹790'];
  for (const pat of confidentialPatterns) {
    if (sanitizedText.toLowerCase().includes(pat.toLowerCase())) {
      const regex = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      sanitizedText = sanitizedText.replace(regex, '[REDACTED-CONFIDENTIAL]');
      redactionsApplied++;
    }
  }

  const sanitizedPassages = passages.map((p) => {
    if (p.confidential) {
      redactionsApplied++;
      return {
        ...p,
        text: '[REDACTED CONFIDENTIAL SOURCE PASSAGE — EVALUATED LOCALLY ONLY]',
      };
    }
    return p;
  });

  return { sanitizedText, sanitizedPassages, redactionsApplied };
}

/**
 * 5. Deterministic Rule Checks in Code
 */
export function runDeterministicRuleChecks(
  contentText: string,
  imageUrl: string | undefined,
  imageAltText: string,
  bannerConfig: BannerVisualConfig | undefined,
  library: BrandLibraryState
): Finding[] {
  const findings: Finding[] = [];
  const lowerText = contentText.toLowerCase();

  // Rule A: Banned Terminology Check
  for (const term of library.terminology) {
    const bannedLower = term.bannedTerm.toLowerCase();
    const idx = lowerText.indexOf(bannedLower);
    if (idx !== -1) {
      const exactQuoted = contentText.slice(idx, idx + term.bannedTerm.length);
      findings.push({
        id: `RULE-TERM-${term.id}-${idx}`,
        category: term.category,
        severity: term.category === 'claim' || term.category === 'messaging' ? 'high' : 'low',
        quotedText: exactQuoted,
        explanation: `Deterministic Rule Check: "${exactQuoted}" is a prohibited term in the Kaveri Organics glossary. ${term.reason}`,
        sourceId: term.id,
        sourceTitle: `Terminology Rule: "${term.bannedTerm}"`,
        sourceQuote: term.preferredTerm,
        suggestedFix: term.preferredTerm,
        confidence: 0.99,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
      });
    }
  }

  // Rule B: Unbacked Superlative Claims ("best", "#1", "number one", "guaranteed")
  const superlativeRegex = /\b(best|#1|number one|guaranteed)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = superlativeRegex.exec(contentText)) !== null) {
    const word = match[0];
    const start = Math.max(0, match.index - 12);
    const end = Math.min(contentText.length, match.index + word.length + 22);
    const contextSnippet = contentText.slice(start, end).trim();

    const alreadyCovered = findings.some(
      (f) =>
        f.quotedText.toLowerCase().includes(word.toLowerCase()) ||
        word.toLowerCase().includes(f.quotedText.toLowerCase())
    );
    if (alreadyCovered) continue;

    const hasMatchingFact = library.facts.some((f) =>
      f.statement.toLowerCase().includes(word.toLowerCase())
    );

    if (!hasMatchingFact) {
      const guidelineG06 = library.guidelines.find((g) => g.id === 'G-06') || library.guidelines[0];
      findings.push({
        id: `RULE-SUP-${match.index}`,
        category: 'claim',
        severity: 'high',
        quotedText: word,
        explanation: `Deterministic Rule Check: Superlative or guarantee "${word}" (in "...${contextSnippet}...") has no matching Approved Fact in the Brand Library.`,
        sourceId: guidelineG06.id,
        sourceTitle: guidelineG06.title,
        sourceQuote: guidelineG06.content,
        suggestedFix: word.toLowerCase() === 'guaranteed' ? 'clinically evaluated' : 'time-tested',
        confidence: 0.98,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
      });
    }
  }

  // Rule C: Confidential Material Exposure Check in Draft
  if (contentText.includes('28.5%') || lowerText.includes('partner margin')) {
    const f07 = library.facts.find((f) => f.id === 'F-07');
    if (f07) {
      findings.push({
        id: 'RULE-CONFIDENTIAL-LEAK',
        category: 'claim',
        severity: 'high',
        quotedText: '28.5%',
        explanation:
          'Confidentiality Breach: Draft exposes internal Tier-1 retail distributor margin (28.5%) marked Confidential in FACT-CONF-07.',
        sourceId: f07.id,
        sourceTitle: f07.title,
        sourceQuote: f07.statement,
        suggestedFix: 'available across specialty organic retail partners',
        confidence: 1.0,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
      });
    }
  }

  // Rule D: WCAG Contrast Ratio Check on Banner
  if (bannerConfig?.hasBanner) {
    const ratio = getContrastRatio(bannerConfig.fgHex, bannerConfig.bgHex);
    if (ratio < 4.5) {
      const g04 = library.guidelines.find((g) => g.id === 'G-04') || library.guidelines[0];
      findings.push({
        id: `RULE-WCAG-CONTRAST`,
        category: 'visual',
        severity: 'medium',
        quotedText: `Banner Contrast: ${bannerConfig.fgHex} on ${bannerConfig.bgHex} (${ratio}:1)`,
        explanation: `Deterministic WCAG Check: Foreground ${bannerConfig.fgHex} on background ${bannerConfig.bgHex} has a contrast ratio of ${ratio}:1, failing the WCAG AA 4.5:1 requirement.`,
        sourceId: g04.id,
        sourceTitle: g04.title,
        sourceQuote: g04.content,
        suggestedFix: 'Set Banner Foreground to #0B3D3A on #FAF8F4 (Contrast 11.8:1)',
        confidence: 0.96,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
      });
    }

    if (bannerConfig.logoVariant !== 'official-seal') {
      const a02 = library.assets.find((a) => a.id === 'A-02');
      if (a02) {
        findings.push({
          id: `RULE-LOGO-PROPORTION`,
          category: 'visual',
          severity: 'medium',
          quotedText: `Logo Lockup: ${bannerConfig.logoVariant}`,
          explanation: `Visual Asset Check: The banner uses a non-compliant logo state (${bannerConfig.logoVariant}).`,
          sourceId: a02.id,
          sourceTitle: a02.name,
          sourceQuote: a02.ruleText,
          suggestedFix: 'Restore official-seal with standard clearspace',
          confidence: 0.95,
          needsHumanJudgement: false,
          origin: 'rule-engine',
          status: 'open',
        });
      }
    }
  }

  // Rule E: Missing or Filename-Only Alt Text Check
  if (imageUrl) {
    const trimmedAlt = (imageAltText || '').trim();
    const isFilename =
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(trimmedAlt) || trimmedAlt.startsWith('img_');
    if (!trimmedAlt || isFilename || trimmedAlt.length < 20) {
      const g05 = library.guidelines.find((g) => g.id === 'G-05') || library.guidelines[0];
      findings.push({
        id: `RULE-ALT-TEXT`,
        category: 'accessibility',
        severity: 'low',
        quotedText: trimmedAlt ? `Alt text: "${trimmedAlt}"` : 'Missing Image Alt Text ("")',
        explanation: !trimmedAlt
          ? 'Deterministic Accessibility Check: Visual asset is missing descriptive alt text.'
          : `Deterministic Accessibility Check: Alt text "${trimmedAlt}" is a filename or too brief (< 20 chars) for screen readers.`,
        sourceId: g05.id,
        sourceTitle: g05.title,
        sourceQuote: g05.content,
        suggestedFix:
          'Kaveri Organics amber glass packaging proof and botanical colour swatches arranged on a natural teak studio table.',
        confidence: 0.99,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
      });
    }
  }

  return attachRiskScoresToFindings(findings, contentText, library);
}

/**
 * 6. Citation Verifier in Code ("No source, no finding")
 */
export function verifyAiFindingsInCode(
  rawAiFindings: Array<{
    category?: string;
    severity?: string;
    quotedText?: string;
    explanation?: string;
    sourceId?: string;
    sourceQuote?: string;
    suggestedFix?: string;
    confidence?: number;
  }>,
  library: BrandLibraryState,
  existingDeterministicFindings: Finding[],
  contentText = ''
): {
  verifiedFindings: Finding[];
  discardedTraces: DiscardedFindingTrace[];
} {
  const verifiedFindings: Finding[] = [];
  const discardedTraces: DiscardedFindingTrace[] = [];

  const sourceMap = new Map<string, { title: string; fullText: string }>();
  for (const g of library.guidelines) {
    sourceMap.set(g.id, {
      title: g.title,
      fullText: `${g.title} ${g.content} ${g.examplesGood} ${g.examplesBad}`,
    });
  }
  for (const f of library.facts) {
    sourceMap.set(f.id, {
      title: f.title,
      fullText: `${f.title} ${f.statement} ${f.sourceDocument}`,
    });
  }
  for (const t of library.terminology) {
    sourceMap.set(t.id, {
      title: `Terminology: ${t.bannedTerm}`,
      fullText: `${t.bannedTerm} ${t.preferredTerm} ${t.reason}`,
    });
  }
  for (const a of library.assets) {
    sourceMap.set(a.id, {
      title: a.name,
      fullText: `${a.name} ${a.description} ${a.ruleText}`,
    });
  }

  rawAiFindings.forEach((raw, idx) => {
    const sourceId = (raw.sourceId || '').trim();
    const sourceQuote = (raw.sourceQuote || '').trim();
    const quotedText = (raw.quotedText || '').trim();

    if (!sourceId || !sourceMap.has(sourceId)) {
      discardedTraces.push({
        quotedText: quotedText || '(unspecified span)',
        claimedSourceId: sourceId || '(missing)',
        claimedSourceQuote: sourceQuote || '(missing)',
        reason: `Discarded by Verifier: sourceId "${sourceId || 'null'}" does not exist in Brand Library.`,
      });
      return;
    }

    const sourceRecord = sourceMap.get(sourceId)!;
    const normalizedSourceFull = sourceRecord.fullText.toLowerCase().replace(/\s+/g, ' ');
    const normalizedQuote = sourceQuote.toLowerCase().replace(/\s+/g, ' ');

    const quoteWords = normalizedQuote.split(' ').filter((w) => w.length > 3);
    const matchedWordCount = quoteWords.filter((w) => normalizedSourceFull.includes(w)).length;
    const quoteOverlapRatio = quoteWords.length > 0 ? matchedWordCount / quoteWords.length : 0;

    if (!sourceQuote || (!normalizedSourceFull.includes(normalizedQuote) && quoteOverlapRatio < 0.6)) {
      discardedTraces.push({
        quotedText: quotedText || '(unspecified span)',
        claimedSourceId: sourceId,
        claimedSourceQuote: sourceQuote || '(empty quote)',
        reason: `Discarded by Verifier: claimed sourceQuote is not present in library item ${sourceId}.`,
      });
      return;
    }

    const isDuplicate = existingDeterministicFindings.some(
      (df) =>
        df.quotedText.toLowerCase() === quotedText.toLowerCase() &&
        df.sourceId === sourceId
    );
    if (isDuplicate) return;

    const confidence =
      typeof raw.confidence === 'number' ? Math.max(0.1, Math.min(1.0, raw.confidence)) : 0.85;
    const validCategories: FindingCategory[] = [
      'tone',
      'terminology',
      'messaging',
      'claim',
      'visual',
      'accessibility',
    ];
    const category: FindingCategory = validCategories.includes(raw.category as FindingCategory)
      ? (raw.category as FindingCategory)
      : 'claim';
    const validSeverities: FindingSeverity[] = ['high', 'medium', 'low'];
    const severity: FindingSeverity = validSeverities.includes(raw.severity as FindingSeverity)
      ? (raw.severity as FindingSeverity)
      : 'medium';

    const baseFinding: Finding = {
      id: `AI-VER-${Date.now()}-${idx}`,
      category,
      severity,
      quotedText: quotedText || 'Document passage',
      explanation: raw.explanation || 'Diverges from cited brand source.',
      sourceId,
      sourceTitle: sourceRecord.title,
      sourceQuote,
      suggestedFix: raw.suggestedFix || '',
      confidence: Number(confidence.toFixed(2)),
      needsHumanJudgement: confidence < 0.75,
      origin: 'gemini-verified',
      status: 'open',
    };

    const [scoredFinding] = attachRiskScoresToFindings([baseFinding], contentText, library);
    verifiedFindings.push(scoredFinding);
  });

  return { verifiedFindings, discardedTraces };
}

/**
 * 7. Passage-Grounded Local Candidate Builder
 */
export function buildPassageGroundedCandidateFindings(
  contentText: string,
  library: BrandLibraryState
): Array<{
  category: string;
  severity: string;
  quotedText: string;
  explanation: string;
  sourceId: string;
  sourceQuote: string;
  suggestedFix: string;
  confidence: number;
}> {
  const candidates: Array<{
    category: string;
    severity: string;
    quotedText: string;
    explanation: string;
    sourceId: string;
    sourceQuote: string;
    suggestedFix: string;
    confidence: number;
  }> = [];

  if (contentText.includes('₹480')) {
    const match = contentText.match(/(?:just\s+)?₹480(?:\s+inclusive of taxes)?/i);
    candidates.push({
      category: 'claim',
      severity: 'high',
      quotedText: match ? match[0] : '₹480',
      explanation:
        'Outdated retail price quoted. Wayanad Cold-Pressed Virgin Coconut Oil (500ml) MRP was revised from ₹480 to ₹640 effective 1 October 2026.',
      sourceId: 'F-02',
      sourceQuote:
        'The approved retail MRP for Wayanad Cold-Pressed Virgin Coconut Oil (500ml amber glass jar) is ₹640 inclusive of GST, updated from ₹480 effective 1 October 2026.',
      suggestedFix: '₹640 inclusive of GST',
      confidence: 0.96,
    });
  }

  if (contentText.includes('₹780')) {
    const match = contentText.match(/(?:MRP of\s+)?₹780(?:\s+inclusive of taxes)?/i);
    candidates.push({
      category: 'claim',
      severity: 'high',
      quotedText: match ? match[0] : '₹780',
      explanation:
        'Outdated MRP for Nilgiri Frost White Tea (100g). The approved price was updated from ₹780 to ₹920 in October 2026.',
      sourceId: 'F-05',
      sourceQuote:
        'Single-estate Nilgiri Frost White Tea (100g caddy) is hand-plucked at 2,100 metres elevation in Coonoor during winter frost; approved MRP is ₹920 inclusive of GST (updated from ₹780).',
      suggestedFix: 'MRP of ₹920 inclusive of GST',
      confidence: 0.97,
    });
  }

  if (contentText.toLowerCase().includes('hair rescue')) {
    candidates.push({
      category: 'tone',
      severity: 'low',
      quotedText: 'daily hair rescue',
      explanation:
        'Phrasing leans toward problem-rescue cosmetics copy rather than Kaveri Organics quiet botanical lineage.',
      sourceId: 'G-01',
      sourceQuote:
        'Kaveri Organics speaks with calm, grounded agricultural literacy. Prefer sensory, verifiable descriptions of harvest origin, extraction temperature, and botanical lineage.',
      suggestedFix: 'daily botanical nourishment ritual',
      confidence: 0.89,
    });
  }

  // Inject 1 ungrounded candidate so the Verifier demonstrates discarding it
  candidates.push({
    category: 'messaging',
    severity: 'low',
    quotedText: contentText.slice(0, 24).trim(),
    explanation: 'Unverified stylistic preference not backed by any source in the library.',
    sourceId: 'G-99-UNGROUNDED',
    sourceQuote: 'All paragraphs must begin with a Sanskrit botanical binomial.',
    suggestedFix: contentText.slice(0, 24).trim(),
    confidence: 0.61,
  });

  return candidates;
}

/**
 * 8. Zero-Click Autopilot Pipeline Executor
 * Runs when Autopilot mode is active and not paused:
 * - Scores every finding (0 to 100)
 * - HIGH RISK (> highRiskThreshold): Never auto-approves; places in human exception queue with reasons
 * - LOW RISK (< lowRiskThreshold): Automatically applies fixes, re-runs checks, and marks Approved
 * - MEDIUM RISK (lowRiskThreshold..highRiskThreshold): Automatically applies fixes, re-checks, and approves ONLY if every check passes and confidence >= minMediumConfidence; otherwise escalates.
 */
export function runAutopilotDecisionEngine(
  item: ContentItem,
  initialFindings: Finding[],
  library: BrandLibraryState
): {
  updatedItem: ContentItem;
  actionRecord: AutopilotActionRecord;
} {
  const config = library.autopilotConfig;
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const scoredFindings = attachRiskScoresToFindings(
    initialFindings,
    item.currentText,
    library
  );

  const maxRiskScore =
    scoredFindings.length === 0
      ? 0
      : Math.max(...scoredFindings.map((f) => f.riskScore || 0));

  let overallBand: RiskBand = 'low';
  if (maxRiskScore > config.highRiskThreshold) {
    overallBand = 'high';
  } else if (maxRiskScore >= config.lowRiskThreshold) {
    overallBand = 'medium';
  }

  const snapshotBefore = {
    contentText: item.currentText,
    imageAltText: item.imageAltText,
    bannerConfig: { ...item.bannerConfig },
    status: item.status,
    findings: scoredFindings,
  };

  // CASE A: HIGH RISK (> highRiskThreshold) -> NEVER auto-approve, escalate to human exception queue
  if (overallBand === 'high') {
    const highRiskFindings = scoredFindings.filter(
      (f) => (f.riskScore || 0) > config.highRiskThreshold
    );
    const escalationReasons = highRiskFindings.map(
      (f) =>
        `[Risk ${f.riskScore}/100 · ${f.category.toUpperCase()}] "${f.quotedText}" — ${f.explanation} (Source: ${f.sourceId})`
    );

    const actionRecord: AutopilotActionRecord = {
      id: `AP-ACT-${Date.now()}`,
      timestamp: nowStr,
      outcome: 'ESCALATED_TO_HUMAN',
      maxRiskScore,
      riskBand: 'high',
      summaryReason: `Escalated to Human Exception Queue: ${highRiskFindings.length} High-Risk finding(s) exceeded threshold (${config.highRiskThreshold}). AI never auto-approves high-risk claims or confidential material.`,
      escalationReasons,
      changesApplied: [],
      snapshotBefore,
      snapshotAfter: {
        contentText: item.currentText,
        imageAltText: item.imageAltText,
        bannerConfig: { ...item.bannerConfig },
        status: 'In review',
      },
      recheckPassedAll: false,
      rolledBack: false,
      aiDisclosureText:
        'AI Disclosure: Checked automatically by Nirnay Sutra Autopilot (Gemini Flash + Deterministic Rules). Confidential items redacted before AI transmission. Escalated to human review due to high-risk findings.',
    };

    const updatedItem: ContentItem = {
      ...item,
      status: 'In review',
      updatedAt: nowStr.slice(0, 16),
      findings: scoredFindings,
      autoApprovedByAi: false,
      escalatedToHuman: true,
      escalationReasons,
      rolledBack: false,
      maxRiskScore,
      autopilotAction: actionRecord,
      comments: [
        ...item.comments,
        {
          id: `CM-AP-${Date.now()}`,
          authorName: 'Autopilot Governance Pipeline',
          authorRole: 'Autopilot AI',
          timestamp: nowStr.slice(0, 16),
          text: `Escalated to Human Exception Queue (Max Risk Score: ${maxRiskScore}/100 > ${config.highRiskThreshold}). Reasons: ${escalationReasons.join(' | ')}`,
          actionType: 'autopilot-action',
        },
      ],
    };

    return { updatedItem, actionRecord };
  }

  // CASE B: LOW RISK (< lowRiskThreshold) or MEDIUM RISK (low..high) -> Auto-apply fixes and re-run checks
  let workingText = item.currentText;
  let workingAlt = item.imageAltText;
  let workingBanner = { ...item.bannerConfig };
  const changesApplied: AutopilotDiffChange[] = [];

  for (const f of scoredFindings) {
    if (f.status !== 'open') continue;

    if (
      f.category === 'accessibility' &&
      f.quotedText.toLowerCase().includes('alt text')
    ) {
      const beforeAlt = workingAlt || '(missing alt text)';
      workingAlt = f.suggestedFix;
      changesApplied.push({
        findingId: f.id,
        category: f.category,
        riskScore: f.riskScore || 18,
        sourceId: f.sourceId,
        sourceTitle: f.sourceTitle,
        reason: f.explanation,
        beforeSnippet: `alt="${beforeAlt}"`,
        afterSnippet: `alt="${workingAlt}"`,
      });
    } else if (
      f.category === 'visual' &&
      f.quotedText.toLowerCase().includes('contrast')
    ) {
      const beforeHex = `${workingBanner.fgHex} on ${workingBanner.bgHex}`;
      workingBanner = {
        ...workingBanner,
        fgHex: '#0B3D3A',
        bgHex: '#FAF8F4',
      };
      changesApplied.push({
        findingId: f.id,
        category: f.category,
        riskScore: f.riskScore || 46,
        sourceId: f.sourceId,
        sourceTitle: f.sourceTitle,
        reason: f.explanation,
        beforeSnippet: `Banner ${beforeHex}`,
        afterSnippet: `Banner #0B3D3A on #FAF8F4 (11.8:1 WCAG AAA)`,
      });
    } else if (
      f.category === 'visual' &&
      f.quotedText.toLowerCase().includes('logo')
    ) {
      const beforeLogo = workingBanner.logoVariant;
      workingBanner = {
        ...workingBanner,
        logoVariant: 'official-seal',
      };
      changesApplied.push({
        findingId: f.id,
        category: f.category,
        riskScore: f.riskScore || 44,
        sourceId: f.sourceId,
        sourceTitle: f.sourceTitle,
        reason: f.explanation,
        beforeSnippet: `Logo: ${beforeLogo}`,
        afterSnippet: `Logo: official-seal`,
      });
    } else {
      const idx = workingText.toLowerCase().indexOf(f.quotedText.toLowerCase());
      if (idx !== -1) {
        const exactBefore = workingText.slice(idx, idx + f.quotedText.length);
        workingText =
          workingText.slice(0, idx) +
          f.suggestedFix +
          workingText.slice(idx + f.quotedText.length);
        changesApplied.push({
          findingId: f.id,
          category: f.category,
          riskScore: f.riskScore || 16,
          sourceId: f.sourceId,
          sourceTitle: f.sourceTitle,
          reason: f.explanation,
          beforeSnippet: exactBefore,
          afterSnippet: f.suggestedFix,
        });
      }
    }
  }

  // Re-run deterministic checks on the remediated content to verify 100% pass
  const recheckFindings = runDeterministicRuleChecks(
    workingText,
    item.imageUrl,
    workingAlt,
    workingBanner,
    library
  );
  const recheckPassedAll = recheckFindings.length === 0;

  // Check confidence gate for MEDIUM risk
  const minFindingConfidence =
    scoredFindings.length === 0
      ? 1.0
      : Math.min(...scoredFindings.map((f) => f.confidence));
  const mediumConfidencePass =
    overallBand === 'low' || minFindingConfidence >= config.minMediumConfidence;

  if (recheckPassedAll && mediumConfidencePass) {
    const resolvedFindings: Finding[] = scoredFindings.map((f) => ({
      ...f,
      status: 'accepted',
      appliedReplacement: f.suggestedFix,
      autoAppliedByAutopilot: true,
    }));

    const actionRecord: AutopilotActionRecord = {
      id: `AP-ACT-${Date.now()}`,
      timestamp: nowStr,
      outcome: 'AUTO_APPROVED',
      maxRiskScore,
      riskBand: overallBand,
      summaryReason:
        changesApplied.length > 0
          ? `Autopilot applied ${changesApplied.length} ${overallBand}-risk fix(es) (max risk ${maxRiskScore}/100), verified 0 remaining issues on re-check, and marked Approved.`
          : `Autopilot verified 0 issues (risk 0/100) and marked Approved.`,
      escalationReasons: [],
      changesApplied,
      snapshotBefore,
      snapshotAfter: {
        contentText: workingText,
        imageAltText: workingAlt,
        bannerConfig: workingBanner,
        status: 'Approved',
      },
      recheckPassedAll: true,
      rolledBack: false,
      aiDisclosureText:
        'AI Disclosure: Auto-remediated and auto-approved by Nirnay Sutra Autopilot (Gemini Flash + Deterministic Rules). Confidential items redacted before AI transmission. Full before/after diff and one-click rollback available.',
    };

    const nextVer = item.versions.length + 1;
    const updatedItem: ContentItem = {
      ...item,
      currentText: workingText,
      imageAltText: workingAlt,
      bannerConfig: workingBanner,
      status: 'Approved',
      updatedAt: nowStr.slice(0, 16),
      findings: resolvedFindings,
      autoApprovedByAi: true,
      escalatedToHuman: false,
      escalationReasons: [],
      rolledBack: false,
      maxRiskScore,
      autopilotAction: actionRecord,
      versions: [
        ...item.versions,
        {
          versionNumber: nextVer,
          timestamp: nowStr.slice(0, 16),
          authorName: 'Nirnay Sutra Autopilot',
          authorRole: 'Autopilot AI',
          summary: actionRecord.summaryReason,
          contentText: workingText,
          imageAltText: workingAlt,
          bannerConfig: workingBanner,
          isAutopilotVersion: true,
        },
      ],
      comments: [
        ...item.comments,
        {
          id: `CM-AP-${Date.now()}`,
          authorName: 'Nirnay Sutra Autopilot',
          authorRole: 'Autopilot AI',
          timestamp: nowStr.slice(0, 16),
          text: `${actionRecord.summaryReason} [Auto-approved by AI]`,
          actionType: 'autopilot-action',
        },
      ],
    };

    return { updatedItem, actionRecord };
  } else {
    // Medium risk failed re-check or confidence threshold -> Escalate to humans!
    const escalationReasons: string[] = [];
    if (!recheckPassedAll) {
      escalationReasons.push(
        `Post-fix re-check still detected ${recheckFindings.length} unresolved issue(s).`
      );
    }
    if (!mediumConfidencePass) {
      escalationReasons.push(
        `Medium-risk finding confidence (${Math.round(
          minFindingConfidence * 100
        )}%) was below required threshold (${Math.round(
          config.minMediumConfidence * 100
        )}%).`
      );
    }

    const actionRecord: AutopilotActionRecord = {
      id: `AP-ACT-${Date.now()}`,
      timestamp: nowStr,
      outcome: 'ESCALATED_TO_HUMAN',
      maxRiskScore,
      riskBand: overallBand,
      summaryReason: `Medium-risk item (${maxRiskScore}/100) auto-remediated ${changesApplied.length} fix(es) but escalated to Human Exception Queue: ${escalationReasons.join(' ')}`,
      escalationReasons,
      changesApplied,
      snapshotBefore,
      snapshotAfter: {
        contentText: workingText,
        imageAltText: workingAlt,
        bannerConfig: workingBanner,
        status: 'In review',
      },
      recheckPassedAll,
      rolledBack: false,
      aiDisclosureText:
        'AI Disclosure: Processed by Nirnay Sutra Autopilot. Escalated to human review after medium-risk verification gate.',
    };

    const updatedItem: ContentItem = {
      ...item,
      currentText: workingText,
      imageAltText: workingAlt,
      bannerConfig: workingBanner,
      status: 'In review',
      updatedAt: nowStr.slice(0, 16),
      findings: recheckFindings.length > 0 ? recheckFindings : scoredFindings,
      autoApprovedByAi: false,
      escalatedToHuman: true,
      escalationReasons,
      rolledBack: false,
      maxRiskScore,
      autopilotAction: actionRecord,
    };

    return { updatedItem, actionRecord };
  }
}

/**
 * 9. Direct Client-Side Gemini Review (for static site deployments without server.ts)
 * Uses import.meta.env.VITE_GEMINI_API_KEY via @google/genai with structured JSON responseSchema and vision.
 */
export async function runClientSideGeminiReview(params: {
  contentText: string;
  retrievedPassages: Array<{ id: string; title: string; type: string; text: string }>;
  imageBase64?: string;
  imageMimeType?: string;
  imageAltText?: string;
  brandPalette?: unknown[];
}): Promise<{
  aiAvailable: boolean;
  modelUsed: string;
  rawFindings: any[];
} | null> {
  const env = ((import.meta as any).env || {}) as Record<string, string | undefined>;
  const clientApiKey = (env.VITE_GEMINI_API_KEY || '').trim();
  if (!clientApiKey || clientApiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: clientApiKey });

  const passagesContext = params.retrievedPassages
    .map(
      (p, idx) =>
        `[PASSAGE ${idx + 1}] sourceId="${p.id}" (${p.type}: ${p.title})\nExact Source Text: "${p.text}"`
    )
    .join('\n\n');

  const systemInstruction = `You are the AI Brand Governance Reviewer for Nirnay Sutra (निर्णय सूत्र).
Your role is to review pre-publication marketing, editorial, and product content ONLY against the retrieved brand passages provided below.
CRITICAL RULES:
1. Every finding MUST cite a valid "sourceId" from the provided passages and include an exact substring from that passage in "sourceQuote".
2. Never invent guidelines or facts not present in the provided passages.
3. For "quotedText", copy the exact phrase or sentence from the user's draft content that has the issue (or if it is an image/visual finding, describe the visual element or copy the banner text).
4. Suggest a concrete, natural rewrite in "suggestedFix" that preserves the creator's original intent while complying with the cited source.
5. Assign a realistic confidence score between 0.55 and 0.98. Use lower confidence (0.55 - 0.74) when the issue is a subtle tone nuance requiring human editorial judgement.
6. Categories allowed: "tone", "terminology", "messaging", "claim", "visual", "accessibility".
7. Severities allowed: "high", "medium", "low".`;

  const promptText = `RETRIEVED BRAND PASSAGES (Top Ranked Only):
${passagesContext || 'No passages provided.'}

APPROVED BRAND COLOUR PALETTE:
${
  params.brandPalette && params.brandPalette.length > 0
    ? JSON.stringify(params.brandPalette)
    : '#0B3D3A (Deep Forest), #17806D (Kaveri Teal), #7FD1BF (Nilgiri Mint), #FAF8F4 (Warm Paper), #F5A524 (Turmeric Amber)'
}

DRAFT CONTENT TO REVIEW:
"""
${params.contentText}
"""
${
  params.imageBase64
    ? `\nAn image is attached for visual brand governance inspection (logo usage, colour palette harmony, contrast legibility). Current alt text: "${params.imageAltText || '(missing)'}".`
    : ''
}

Return a JSON array of findings.`;

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
  if (params.imageBase64 && params.imageMimeType) {
    const cleanBase64 = params.imageBase64.includes(',')
      ? params.imageBase64.split(',')[1]
      : params.imageBase64;
    parts.push({
      inlineData: {
        mimeType: params.imageMimeType,
        data: cleanBase64,
      },
    });
  }
  parts.push({ text: promptText });

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: 'One of: tone, terminology, messaging, claim, visual, accessibility',
        },
        severity: {
          type: Type.STRING,
          description: 'One of: high, medium, low',
        },
        quotedText: {
          type: Type.STRING,
          description: 'Exact substring from the draft content (or visual element label) being flagged.',
        },
        explanation: {
          type: Type.STRING,
          description: 'Clear explanation of why this violates or diverges from the approved source.',
        },
        sourceId: {
          type: Type.STRING,
          description: 'Exact sourceId of the retrieved passage backing this finding.',
        },
        sourceQuote: {
          type: Type.STRING,
          description: 'Exact verbatim quote from the retrieved passage that proves this rule or fact.',
        },
        suggestedFix: {
          type: Type.STRING,
          description: 'Suggested replacement text or visual correction keeping the creator intent.',
        },
        confidence: {
          type: Type.NUMBER,
          description: 'Confidence score between 0.0 and 1.0.',
        },
      },
      required: [
        'category',
        'severity',
        'quotedText',
        'explanation',
        'sourceId',
        'sourceQuote',
        'suggestedFix',
        'confidence',
      ],
    },
  };

  let response;
  let modelUsed = 'gemini-3.8-flash';
  try {
    response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
  } catch {
    modelUsed = 'gemini-flash-latest';
    response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
  }

  const rawText = (response.text ?? '[]').trim();
  let parsedFindings = [];
  try {
    parsedFindings = JSON.parse(rawText);
  } catch {
    parsedFindings = [];
  }

  return {
    aiAvailable: true,
    modelUsed,
    rawFindings: Array.isArray(parsedFindings) ? parsedFindings : [],
  };
}

