import {
  BrandLibraryState,
  ContentItem,
  AuditLogEntry,
} from '../types';
import heroEditorialReviewImg from '../assets/images/hero_editorial_review_1793792676936.jpg';
import teamCopyDiscussionImg from '../assets/images/team_copy_discussion_1793792676168.jpg';
import quietWorkspaceSwatchImg from '../assets/images/quiet_workspace_swatch_1793792679701.jpg';
import brandGovernanceMeetingImg from '../assets/images/brand_governance_meeting_1793792680515.jpg';
import studioArchiveShelfImg from '../assets/images/studio_archive_shelf_1793792681092.jpg';

export const GENERATED_PHOTOS = {
  heroEditorialReview: heroEditorialReviewImg,
  teamCopyDiscussion: teamCopyDiscussionImg,
  quietWorkspaceSwatch: quietWorkspaceSwatchImg,
  brandGovernanceMeeting: brandGovernanceMeetingImg,
  studioArchiveShelf: studioArchiveShelfImg,
};

const LEGACY_PATH_MAP: Record<string, string> = {
  '/src/assets/images/hero_editorial_review_1793792676936.jpg':
    heroEditorialReviewImg,
  '/src/assets/images/team_copy_discussion_1793792676168.jpg':
    teamCopyDiscussionImg,
  '/src/assets/images/quiet_workspace_swatch_1793792679701.jpg':
    quietWorkspaceSwatchImg,
  '/src/assets/images/brand_governance_meeting_1793792680515.jpg':
    brandGovernanceMeetingImg,
  '/src/assets/images/studio_archive_shelf_1793792681092.jpg':
    studioArchiveShelfImg,
};

export function resolveAssetUrl(url?: string): string | undefined {
  if (!url) return url;
  if (LEGACY_PATH_MAP[url]) return LEGACY_PATH_MAP[url];
  for (const [legacyPath, bundledUrl] of Object.entries(LEGACY_PATH_MAP)) {
    const filename = legacyPath.split('/').pop();
    if (filename && url.endsWith(filename)) {
      return bundledUrl;
    }
  }
  return url;
}

export const INITIAL_BRAND_LIBRARY: BrandLibraryState = {
  brandName: 'Kaveri Organics',
  tagline: 'Single-origin botanical formulations & cold-pressed harvest pantry from Southern India.',
  autopilotConfig: {
    mode: 'Autopilot',
    killSwitchPaused: false,
    lowRiskThreshold: 30,
    highRiskThreshold: 70,
    minMediumConfidence: 0.85,
    alwaysEscalateCategories: ['claim', 'messaging'],
    alwaysRedactConfidential: true,
    stats: {
      itemsProcessed: 18,
      autoApproved: 11,
      escalatedToHumans: 5,
      rolledBack: 2,
      avgMinutesSavedPerItem: 18.5,
    },
  },
  guidelines: [
    {
      id: 'G-01',
      code: 'SUTRA-TONE-01',
      title: 'Editorial Tone & Quiet Botanical Authority',
      category: 'tone',
      content:
        'Kaveri Organics speaks with calm, grounded agricultural literacy. Avoid internet slang, hype adjectives, or breathless urgency. Never describe formulations with phrases like "slaps", "lowkey", "lit", "game-changer", or "antioxidant bomb". Prefer sensory, verifiable descriptions of harvest origin, extraction temperature, and botanical lineage.',
      examplesGood:
        'Cold-pressed within eighteen hours of harvest in Wayanad to preserve native Lauric acid and delicate coconut aroma.',
      examplesBad:
        'This cold-pressed oil honestly slaps and is lowkey the best hair rescue on the planet!',
      confidential: false,
      updatedAt: '2026-10-14',
      flaggedCount: 28,
      disputedCount: 6,
    },
    {
      id: 'G-02',
      code: 'SUTRA-CLAIM-02',
      title: 'Agricultural Residue & Organic Purity Claims',
      category: 'claim',
      content:
        'Never claim any Kaveri Organics harvest is "100% pesticide-free" or "100% chemical-free". Due to cross-breeze across neighbouring smallholder estates in the Nilgiris and Wayanad, absolute zero-pesticide guarantees violate ASCI and FSSAI truth-in-advertising rules. Always state: "Certified residue-tested below 0.01 mg/kg across 140 partner smallholdings under NPOP organic standards."',
      examplesGood:
        'Certified residue-tested below 0.01 mg/kg across 140 partner smallholdings under NPOP organic standards.',
      examplesBad:
        'Grown on 100% pesticide-free farms with a 100% chemical-free guarantee.',
      confidential: false,
      updatedAt: '2026-10-19',
      flaggedCount: 42,
      disputedCount: 11,
    },
    {
      id: 'G-03',
      code: 'SUTRA-PRICE-03',
      title: 'MRP Accuracy & October 2026 Tariff Revision',
      category: 'claim',
      content:
        'All consumer-facing copy, mailers, and packaging sleeves must quote the October 2026 Revised MRP Schedule inclusive of GST. Wayanad Cold-Pressed Virgin Coconut Oil (500ml) is ₹640 (revised from ₹480). Nilgiri Frost White Tea (100g tin) is ₹920 (revised from ₹780). Citing outdated ₹480 or ₹780 pricing is a high-severity compliance breach.',
      examplesGood:
        'Wayanad Cold-Pressed Virgin Coconut Oil (500ml amber glass jar) — ₹640 inclusive of all taxes.',
      examplesBad:
        'Grab our 500ml Virgin Coconut Oil at just ₹480 before stocks run out.',
      confidential: false,
      updatedAt: '2026-10-02',
      flaggedCount: 19,
      disputedCount: 2,
    },
    {
      id: 'G-04',
      code: 'SUTRA-VISUAL-04',
      title: 'Visual Contrast, Palette Discipline & Seal Proportions',
      category: 'visual',
      content:
        'All digital banners and social cards must maintain a minimum WCAG AA contrast ratio of 4.5:1 for body copy and 3.0:1 for large display headlines. Never place Nilgiri Mint (#7FD1BF) or Turmeric Amber (#F5A524) text directly on Warm Paper (#FAF8F4) backgrounds. Primary text must use Deep Forest (#0B3D3A) on Warm Paper (#FAF8F4), or Warm Paper (#FAF8F4) on Deep Forest (#0B3D3A). Do not stretch or crowd the Kaveri botanical seal.',
      examplesGood:
        'Foreground #0B3D3A on Background #FAF8F4 (Contrast ratio 11.8:1 — passes WCAG AAA).',
      examplesBad:
        'Foreground #7FD1BF on Background #FAF8F4 (Contrast ratio 1.54:1 — illegible low-contrast banner).',
      confidential: false,
      updatedAt: '2026-09-28',
      flaggedCount: 24,
      disputedCount: 4,
    },
    {
      id: 'G-05',
      code: 'SUTRA-A11Y-05',
      title: 'Mandatory Descriptive Alt Text for Visual Assets',
      category: 'accessibility',
      content:
        'Every published image, campaign banner, or packaging proof must carry descriptive alt text of at least 25 characters explaining the product container, botanical setting, and any embedded headline text. Blank alt attributes or raw filenames (such as "img_final_v2.jpg") are blocked from publication.',
      examplesGood:
        'Amber glass jar of Kaveri Organics Wayanad Virgin Coconut Oil resting on handloom linen beside fresh coconut halves.',
      examplesBad:
        '"" or "banner_final_v2.jpg"',
      confidential: false,
      updatedAt: '2026-09-15',
      flaggedCount: 31,
      disputedCount: 1,
    },
    {
      id: 'G-06',
      code: 'SUTRA-MED-06',
      title: 'Ayurvedic & Clinical Substantiation Boundaries',
      category: 'messaging',
      content:
        'Never state or imply that a Kaveri Organics formulation is a "miracle cure", "guaranteed hair regrowth treatment", or medical therapy. Reference only verified consumer perception findings (e.g., "84% of participants in an 8-week study reported reduced hair breakage") or Classical Ayurvedic preparation methods.',
      examplesGood:
        'Prepared via traditional taila paka vidhi; in an 8-week consumer study (n=64), 84% observed reduced hair breakage.',
      examplesBad:
        'A guaranteed miracle cure for hair fall in 7 days.',
      confidential: false,
      updatedAt: '2026-10-08',
      flaggedCount: 35,
      disputedCount: 9,
    },
  ],
  facts: [
    {
      id: 'F-01',
      code: 'FACT-AGR-01',
      title: 'Nilgiri & Wayanad Residue Testing Metrics',
      statement:
        '98.4% of harvested batches tested below the 0.01 mg/kg limit of quantification (LOQ) across 140 partner smallholdings in the Nilgiri Biosphere and Wayanad under NPOP organic certification. Never marketed as 100% pesticide-free.',
      sourceDocument: 'Eurofins Analytical Lab Report #BLR-2026-8841',
      lastVerified: '2026-10-18',
      verifiedBy: 'Dr. Meenakshi Rao (Head of Agronomy)',
      confidential: false,
    },
    {
      id: 'F-02',
      code: 'FACT-MRP-02',
      title: 'Wayanad Cold-Pressed Virgin Coconut Oil 500ml MRP',
      statement:
        'The approved retail MRP for Wayanad Cold-Pressed Virgin Coconut Oil (500ml amber glass jar) is ₹640 inclusive of GST, updated from ₹480 effective 1 October 2026.',
      sourceDocument: 'FY26-27 Q3 Commercial Price Book v4.2',
      lastVerified: '2026-10-01',
      verifiedBy: 'Arjun Subramanian (Commercial Director)',
      confidential: false,
    },
    {
      id: 'F-03',
      code: 'FACT-PKG-03',
      title: 'Recycled Amber Glass & Bagasse Label Specification',
      statement:
        'All Kaveri Organics apothecary jars use 78% post-consumer recycled (PCR) UV-filtering amber glass sourced in Gujarat, paired with tree-free sugarcane bagasse paper labels.',
      sourceDocument: 'Supplier Sustainability Audit FY26',
      lastVerified: '2026-09-22',
      verifiedBy: 'Divya Krishnan (Packaging Lead)',
      confidential: false,
    },
    {
      id: 'F-04',
      code: 'FACT-EXT-04',
      title: 'Cold-Press Extraction Temperature Ceiling',
      statement:
        'Wayanad Virgin Coconut Oil and Cold-Pressed Gingelly Oil are expeller-pressed below 42°C within 18 hours of de-husking without solvent refining or bleaching.',
      sourceDocument: 'Mysuru Mill SOP-09 Quality Ledger',
      lastVerified: '2026-08-14',
      verifiedBy: 'Dr. Meenakshi Rao (Head of Agronomy)',
      confidential: false,
    },
    {
      id: 'F-05',
      code: 'FACT-MRP-05',
      title: 'Nilgiri Frost White Tea 100g Elevation & MRP',
      statement:
        'Single-estate Nilgiri Frost White Tea (100g caddy) is hand-plucked at 2,100 metres elevation in Coonoor during winter frost; approved MRP is ₹920 inclusive of GST (updated from ₹780).',
      sourceDocument: 'FY26-27 Q3 Commercial Price Book v4.2',
      lastVerified: '2026-10-12',
      verifiedBy: 'Arjun Subramanian (Commercial Director)',
      confidential: false,
    },
    {
      id: 'F-06',
      code: 'FACT-CLN-06',
      title: 'Bhringraj & Amla Scalp Elixir 8-Week Study',
      statement:
        'In an 8-week independent consumer perception study (n=64 adults, Bengaluru Dermatological Testing Centre), 84% of participants reported visibly reduced hair breakage after thrice-weekly oil massage.',
      sourceDocument: 'Clinical Dossier #KAV-ELIX-2026-04',
      lastVerified: '2026-09-05',
      verifiedBy: 'Dr. Kavita Shetty (Formulation Scientist)',
      confidential: false,
    },
    {
      id: 'F-07',
      code: 'FACT-CONF-07',
      title: 'Tier-1 Retail Distributor Margin Structure',
      statement:
        'CONFIDENTIAL COMMERCIAL TERM: Tier-1 modern trade and specialty organic distributor margin is capped at 28.5% net of scheme rebates under the FY26-27 South India agreement.',
      sourceDocument: 'Board Commercial Annex B (Internal Only)',
      lastVerified: '2026-10-25',
      verifiedBy: 'Arjun Subramanian (Commercial Director)',
      confidential: true,
    },
    {
      id: 'F-08',
      code: 'FACT-CONF-08',
      title: 'Embargoed Kodagu Wildflower Raw Honey Launch',
      statement:
        'CONFIDENTIAL EMBARGO: Kodagu Wildflower Multifloral Raw Honey (350g jar, MRP ₹790) is under press embargo until 15 December 2026.',
      sourceDocument: 'Q4 Product Launch Roadmap (Confidential)',
      lastVerified: '2026-10-28',
      verifiedBy: 'Rohan Deshmukh (Brand Admin)',
      confidential: true,
    },
  ],
  terminology: [
    {
      id: 'T-01',
      bannedTerm: '100% pesticide-free',
      preferredTerm: 'certified residue-tested below 0.01 mg/kg under NPOP standards',
      reason: 'Absolute zero-residue claims cannot be legally guaranteed against cross-farm wind drift.',
      category: 'claim',
      confidential: false,
    },
    {
      id: 'T-02',
      bannedTerm: 'chemical-free',
      preferredTerm: 'formulated without synthetic parabens, sulphates, or mineral oils',
      reason: 'All botanical matter consists of natural chemical compounds; "chemical-free" is scientifically inaccurate.',
      category: 'terminology',
      confidential: false,
    },
    {
      id: 'T-03',
      bannedTerm: 'slaps',
      preferredTerm: 'delivers remarkable botanical depth',
      reason: 'Casual internet slang conflicts with Kaveri Organics quiet editorial voice.',
      category: 'tone',
      confidential: false,
    },
    {
      id: 'T-04',
      bannedTerm: 'lowkey',
      preferredTerm: 'quietly',
      reason: 'Colloquial filler dilutes brand authority.',
      category: 'tone',
      confidential: false,
    },
    {
      id: 'T-05',
      bannedTerm: 'miracle cure',
      preferredTerm: 'traditional Ayurvedic formulation',
      reason: 'Violates Drugs and Magic Remedies Act and brand clinical honesty rules.',
      category: 'messaging',
      confidential: false,
    },
    {
      id: 'T-06',
      bannedTerm: 'antioxidant bomb',
      preferredTerm: 'naturally rich in catechins and polyphenols',
      reason: 'Hyperbolic slang; replace with specific phytochemical terminology.',
      category: 'tone',
      confidential: false,
    },
  ],
  assets: [
    {
      id: 'A-01',
      name: 'Kaveri Organics Primary Colour Palette',
      type: 'palette',
      description: 'Approved five-colour botanical editorial system with strict WCAG AA contrast pairings.',
      ruleText:
        'Use Deep Forest (#0B3D3A) and Warm Paper (#FAF8F4) for primary copy pairings (11.8:1 contrast). Never render Nilgiri Mint (#7FD1BF) or Turmeric Amber (#F5A524) text directly on Warm Paper (#FAF8F4).',
      confidential: false,
      swatches: [
        {
          id: 'SW-1',
          name: 'Deep Forest',
          hex: '#0B3D3A',
          role: 'Primary Ink & Dark Surface',
          recommendedPairHex: '#FAF8F4',
        },
        {
          id: 'SW-2',
          name: 'Kaveri Teal',
          hex: '#17806D',
          role: 'Interactive Accent & Secondary Surface',
          recommendedPairHex: '#FAF8F4',
        },
        {
          id: 'SW-3',
          name: 'Nilgiri Mint',
          hex: '#7FD1BF',
          role: 'Subtle Highlight & Dark-Mode Accent Only (Never as text on light paper)',
          recommendedPairHex: '#0B3D3A',
        },
        {
          id: 'SW-4',
          name: 'Warm Paper',
          hex: '#FAF8F4',
          role: 'Primary Editorial Canvas',
          recommendedPairHex: '#0B3D3A',
        },
        {
          id: 'SW-5',
          name: 'Turmeric Amber',
          hex: '#F5A524',
          role: 'Sparingly for Governance Flags & Callout Markers',
          recommendedPairHex: '#0B3D3A',
        },
      ],
    },
    {
      id: 'A-02',
      name: 'Kaveri Botanical Seal & Devanagari Lockup',
      type: 'logo',
      description: 'Official bilingual crest featuring river wave motif and serif wordmark.',
      ruleText:
        'Maintain minimum clearspace equal to the height of the capital letter "K" around the seal. Never stretch horizontally, apply drop shadows, or recolour outside #0B3D3A and #FAF8F4.',
      confidential: false,
    },
  ],
};

export const INITIAL_CONTENT_ITEMS: ContentItem[] = [
  {
    id: 'CI-04',
    title: 'Coorg Green Cardamom & Sesame Bath Oil — Agency Social Note',
    channel: 'Instagram Feed & Story Copy',
    team: 'External Social Agency',
    authorName: 'Meera Nair (Agency Feed)',
    assignedReviewer: 'Nirnay Sutra Autopilot',
    status: 'Approved',
    updatedAt: '2026-11-04 09:42',
    autoApprovedByAi: true,
    escalatedToHuman: false,
    escalationReasons: [],
    rolledBack: false,
    maxRiskScore: 22,
    currentText: `Cold-pressed in small batches using sun-dried Coorg green cardamom pods and native black gingelly seeds, this bath oil delivers remarkable botanical depth after an evening shower and is quietly our most calming winter ritual.`,
    imageUrl: GENERATED_PHOTOS.quietWorkspaceSwatch,
    imageMimeType: 'image/jpeg',
    imageAltText:
      'Kaveri Organics amber glass packaging proof and botanical colour swatches arranged on a natural teak studio table.',
    bannerConfig: {
      hasBanner: true,
      headline: 'Coorg Cardamom & Gingelly Bath Oil',
      subline: 'Expeller-Pressed Below 42°C · 78% Recycled Amber Glass',
      fgHex: '#0B3D3A',
      bgHex: '#FAF8F4',
      accentHex: '#17806D',
      logoVariant: 'official-seal',
    },
    findings: [
      {
        id: 'FND-401',
        category: 'tone',
        severity: 'low',
        quotedText: 'slaps',
        explanation:
          'Deterministic Rule Check: "slaps" is a prohibited term in the Kaveri Organics glossary.',
        sourceId: 'T-03',
        sourceTitle: 'Terminology Rule: "slaps"',
        sourceQuote: 'delivers remarkable botanical depth',
        suggestedFix: 'delivers remarkable botanical depth',
        confidence: 0.99,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'accepted',
        appliedReplacement: 'delivers remarkable botanical depth',
        riskScore: 18,
        riskBand: 'low',
        autoAppliedByAutopilot: true,
      },
      {
        id: 'FND-402',
        category: 'tone',
        severity: 'low',
        quotedText: 'lowkey',
        explanation:
          'Deterministic Rule Check: "lowkey" is a prohibited colloquial filler in the Kaveri Organics glossary.',
        sourceId: 'T-04',
        sourceTitle: 'Terminology Rule: "lowkey"',
        sourceQuote: 'quietly',
        suggestedFix: 'quietly',
        confidence: 0.99,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'accepted',
        appliedReplacement: 'quietly',
        riskScore: 18,
        riskBand: 'low',
        autoAppliedByAutopilot: true,
      },
      {
        id: 'FND-403',
        category: 'accessibility',
        severity: 'low',
        quotedText: 'Missing Image Alt Text ("")',
        explanation:
          'Deterministic Accessibility Check: Visual asset is missing descriptive alt text.',
        sourceId: 'G-05',
        sourceTitle: 'Mandatory Descriptive Alt Text for Visual Assets',
        sourceQuote:
          'Every published image, campaign banner, or packaging proof must carry descriptive alt text of at least 25 characters.',
        suggestedFix:
          'Kaveri Organics amber glass packaging proof and botanical colour swatches arranged on a natural teak studio table.',
        confidence: 0.99,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'accepted',
        appliedReplacement:
          'Kaveri Organics amber glass packaging proof and botanical colour swatches arranged on a natural teak studio table.',
        riskScore: 22,
        riskBand: 'low',
        autoAppliedByAutopilot: true,
      },
    ],
    retrievedPassages: [
      {
        passageId: 'P-T-03',
        sourceId: 'T-03',
        sourceTitle: 'Terminology: slaps',
        sourceType: 'Terminology',
        text: 'Banned term "slaps". Use preferred term: "delivers remarkable botanical depth".',
        relevanceScore: 0.95,
        matchedTerms: ['slaps'],
        confidential: false,
      },
      {
        passageId: 'P-G-05',
        sourceId: 'G-05',
        sourceTitle: 'Mandatory Descriptive Alt Text for Visual Assets',
        sourceType: 'Guideline',
        text: 'Every published image, campaign banner, or packaging proof must carry descriptive alt text of at least 25 characters.',
        relevanceScore: 0.91,
        matchedTerms: ['alt text'],
        confidential: false,
      },
    ],
    verifierStats: {
      lastRunAt: '2026-11-04 09:42',
      modelUsed: 'gemini-3.8-flash (Autopilot Zero-Click)',
      passagesRetrieved: 4,
      rawAiFindingsCount: 0,
      verifiedAiFindingsCount: 0,
      discardedUngroundedCount: 0,
      deterministicRuleCount: 3,
      confidentialRedacted: true,
      discardedTraces: [],
    },
    autopilotAction: {
      id: 'AP-ACT-SEED-401',
      timestamp: '2026-11-04 09:42:11',
      outcome: 'AUTO_APPROVED',
      maxRiskScore: 22,
      riskBand: 'low',
      summaryReason:
        'Autopilot applied 3 low-risk fixes (max risk 22/100 < 30), verified 0 remaining issues on re-check, and marked Approved.',
      escalationReasons: [],
      changesApplied: [
        {
          findingId: 'FND-401',
          category: 'tone',
          riskScore: 18,
          sourceId: 'T-03',
          sourceTitle: 'Terminology Rule: "slaps"',
          reason: 'Replaced casual slang "slaps" with approved botanical phrasing.',
          beforeSnippet: 'slaps',
          afterSnippet: 'delivers remarkable botanical depth',
        },
        {
          findingId: 'FND-402',
          category: 'tone',
          riskScore: 18,
          sourceId: 'T-04',
          sourceTitle: 'Terminology Rule: "lowkey"',
          reason: 'Replaced colloquial filler "lowkey" with "quietly".',
          beforeSnippet: 'lowkey',
          afterSnippet: 'quietly',
        },
        {
          findingId: 'FND-403',
          category: 'accessibility',
          riskScore: 22,
          sourceId: 'G-05',
          sourceTitle: 'Mandatory Descriptive Alt Text for Visual Assets',
          reason: 'Populated descriptive screen-reader alt text (114 chars).',
          beforeSnippet: 'alt=""',
          afterSnippet:
            'alt="Kaveri Organics amber glass packaging proof and botanical colour swatches arranged on a natural teak studio table."',
        },
      ],
      snapshotBefore: {
        contentText: `Cold-pressed in small batches using sun-dried Coorg green cardamom pods and native black gingelly seeds, this bath oil slaps after an evening shower and is lowkey our most calming winter ritual.`,
        imageAltText: '',
        bannerConfig: {
          hasBanner: true,
          headline: 'Coorg Cardamom & Gingelly Bath Oil',
          subline: 'Expeller-Pressed Below 42°C · 78% Recycled Amber Glass',
          fgHex: '#0B3D3A',
          bgHex: '#FAF8F4',
          accentHex: '#17806D',
          logoVariant: 'official-seal',
        },
        status: 'Draft',
        findings: [],
      },
      snapshotAfter: {
        contentText: `Cold-pressed in small batches using sun-dried Coorg green cardamom pods and native black gingelly seeds, this bath oil delivers remarkable botanical depth after an evening shower and is quietly our most calming winter ritual.`,
        imageAltText:
          'Kaveri Organics amber glass packaging proof and botanical colour swatches arranged on a natural teak studio table.',
        bannerConfig: {
          hasBanner: true,
          headline: 'Coorg Cardamom & Gingelly Bath Oil',
          subline: 'Expeller-Pressed Below 42°C · 78% Recycled Amber Glass',
          fgHex: '#0B3D3A',
          bgHex: '#FAF8F4',
          accentHex: '#17806D',
          logoVariant: 'official-seal',
        },
        status: 'Approved',
      },
      recheckPassedAll: true,
      rolledBack: false,
      aiDisclosureText:
        'AI Disclosure: Auto-remediated and auto-approved by Nirnay Sutra Autopilot (Gemini Flash + Deterministic Rules). Confidential items redacted before AI transmission. Full before/after diff and one-click rollback available.',
    },
    versions: [
      {
        versionNumber: 1,
        timestamp: '2026-11-04 09:42',
        authorName: 'Meera Nair (Agency Feed)',
        authorRole: 'Creator',
        summary: 'Ingested via Agency Submission Feed.',
        contentText: `Cold-pressed in small batches using sun-dried Coorg green cardamom pods and native black gingelly seeds, this bath oil slaps after an evening shower and is lowkey our most calming winter ritual.`,
        imageAltText: '',
      },
      {
        versionNumber: 2,
        timestamp: '2026-11-04 09:42',
        authorName: 'Nirnay Sutra Autopilot',
        authorRole: 'Autopilot AI',
        summary:
          'Autopilot applied 3 low-risk fixes (T-03, T-04, G-05), re-verified 0 open issues, and auto-approved.',
        contentText: `Cold-pressed in small batches using sun-dried Coorg green cardamom pods and native black gingelly seeds, this bath oil delivers remarkable botanical depth after an evening shower and is quietly our most calming winter ritual.`,
        imageAltText:
          'Kaveri Organics amber glass packaging proof and botanical colour swatches arranged on a natural teak studio table.',
        isAutopilotVersion: true,
      },
    ],
    comments: [
      {
        id: 'CM-401',
        authorName: 'Nirnay Sutra Autopilot',
        authorRole: 'Autopilot AI',
        timestamp: '2026-11-04 09:42',
        text: 'Autopilot applied 3 low-risk fixes (max risk 22/100 < 30), verified 0 remaining issues on re-check, and marked Approved. [Auto-approved by AI]',
        actionType: 'autopilot-action',
      },
    ],
  },
  {
    id: 'CI-01',
    title: 'Monsoon Harvest: Wayanad Virgin Coconut Oil Launch Mailer',
    channel: 'D2C Email & Web Banner',
    team: 'Performance Marketing',
    authorName: 'Ananya Nair',
    assignedReviewer: 'Vikramaditya Menon',
    status: 'AI-checked',
    updatedAt: '2026-11-04 09:15',
    autoApprovedByAi: false,
    escalatedToHuman: true,
    maxRiskScore: 90,
    escalationReasons: [
      '[Risk 90/100 · CLAIM] "100% pesticide-free" — Prohibited agricultural purity claim (Source: G-02)',
      '[Risk 88/100 · CLAIM] "just ₹480 inclusive of taxes" — Outdated MRP vs Oct 2026 ₹640 schedule (Source: F-02)',
    ],
    currentText: `Cold-pressed in small batches after the first northeast monsoon showers, our Wayanad Virgin Coconut Oil comes from 100% pesticide-free groves in Kerala.

Honestly, this cold-pressed oil slaps whether you use it for a warm Champi head massage or slow-roasting curry leaves, and it is lowkey the best daily hair rescue in India.

Order our 500ml amber glass jar today for just ₹480 inclusive of taxes and experience guaranteed results from the very first wash.`,
    imageUrl: GENERATED_PHOTOS.quietWorkspaceSwatch,
    imageMimeType: 'image/jpeg',
    imageAltText: '',
    bannerConfig: {
      hasBanner: true,
      headline: 'Wayanad Monsoon Harvest · ₹480',
      subline: '100% Pesticide-Free Cold-Pressed Virgin Coconut Oil',
      fgHex: '#7FD1BF',
      bgHex: '#FAF8F4',
      accentHex: '#F5A524',
      logoVariant: 'official-seal',
    },
    findings: [
      {
        id: 'FND-101',
        category: 'claim',
        severity: 'high',
        quotedText: '100% pesticide-free',
        explanation:
          'Banned absolute agricultural claim. Cross-farm wind drift makes a 100% pesticide-free guarantee unsubstantiated under ASCI rules and Kaveri Organics policy.',
        sourceId: 'G-02',
        sourceTitle: 'Agricultural Residue & Organic Purity Claims',
        sourceQuote:
          'Never claim any Kaveri Organics harvest is "100% pesticide-free" or "100% chemical-free". Always state: "Certified residue-tested below 0.01 mg/kg across 140 partner smallholdings under NPOP organic standards."',
        suggestedFix:
          'certified residue-tested below 0.01 mg/kg across 140 partner smallholdings under NPOP organic standards',
        confidence: 0.98,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
        riskScore: 90,
        riskBand: 'high',
      },
      {
        id: 'FND-102',
        category: 'claim',
        severity: 'high',
        quotedText: 'just ₹480 inclusive of taxes',
        explanation:
          'Outdated retail price. The MRP for Wayanad Cold-Pressed Virgin Coconut Oil (500ml) was revised from ₹480 to ₹640 on 1 October 2026.',
        sourceId: 'F-02',
        sourceTitle: 'Wayanad Cold-Pressed Virgin Coconut Oil 500ml MRP',
        sourceQuote:
          'The approved retail MRP for Wayanad Cold-Pressed Virgin Coconut Oil (500ml amber glass jar) is ₹640 inclusive of GST, updated from ₹480 effective 1 October 2026.',
        suggestedFix: '₹640 inclusive of GST',
        confidence: 0.96,
        needsHumanJudgement: false,
        origin: 'gemini-verified',
        status: 'open',
        riskScore: 88,
        riskBand: 'high',
      },
      {
        id: 'FND-103',
        category: 'tone',
        severity: 'medium',
        quotedText: 'Honestly, this cold-pressed oil slaps',
        explanation:
          'Uses casual internet slang ("slaps") prohibited by Kaveri Organics editorial tone guidelines.',
        sourceId: 'G-01',
        sourceTitle: 'Editorial Tone & Quiet Botanical Authority',
        sourceQuote:
          'Never describe formulations with phrases like "slaps", "lowkey", "lit", "game-changer", or "antioxidant bomb".',
        suggestedFix: 'Expeller-pressed below 42°C, this oil delivers remarkable botanical depth',
        confidence: 0.94,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
        riskScore: 18,
        riskBand: 'low',
      },
      {
        id: 'FND-104',
        category: 'tone',
        severity: 'low',
        quotedText: 'lowkey the best daily hair rescue',
        explanation:
          'Combines banned slang ("lowkey") and an unsubstantiated superlative ("best") without a backing clinical or market study.',
        sourceId: 'T-04',
        sourceTitle: 'Terminology: lowkey',
        sourceQuote: 'Colloquial filler dilutes brand authority.',
        suggestedFix: 'quietly a dependable daily ritual for nourishing dry hair',
        confidence: 0.71,
        needsHumanJudgement: true,
        origin: 'gemini-verified',
        status: 'open',
        riskScore: 76,
        riskBand: 'high',
      },
      {
        id: 'FND-105',
        category: 'visual',
        severity: 'high',
        quotedText: 'Banner Contrast: #7FD1BF on #FAF8F4 (1.54:1)',
        explanation:
          'Promotional banner foreground (#7FD1BF Nilgiri Mint) on background (#FAF8F4 Warm Paper) yields a 1.54:1 contrast ratio, failing WCAG AA (4.5:1 minimum).',
        sourceId: 'G-04',
        sourceTitle: 'Visual Contrast, Palette Discipline & Seal Proportions',
        sourceQuote:
          'Never place Nilgiri Mint (#7FD1BF) or Turmeric Amber (#F5A524) text directly on Warm Paper (#FAF8F4) backgrounds. Primary text must use Deep Forest (#0B3D3A) on Warm Paper (#FAF8F4).',
        suggestedFix: 'Set Banner Foreground to #0B3D3A on #FAF8F4 (Contrast 11.8:1)',
        confidence: 1.0,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
        riskScore: 48,
        riskBand: 'medium',
      },
      {
        id: 'FND-106',
        category: 'accessibility',
        severity: 'high',
        quotedText: 'Missing Image Alt Text ("")',
        explanation:
          'The attached campaign image has an empty alt attribute, violating Kaveri Organics mandatory accessibility standards.',
        sourceId: 'G-05',
        sourceTitle: 'Mandatory Descriptive Alt Text for Visual Assets',
        sourceQuote:
          'Every published image, campaign banner, or packaging proof must carry descriptive alt text of at least 25 characters explaining the product container, botanical setting, and any embedded headline text.',
        suggestedFix:
          'Editorial workspace table showing Kaveri Organics botanical packaging proofs, forest green colour swatches, and handwritten formulation notes in natural daylight.',
        confidence: 1.0,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
        riskScore: 22,
        riskBand: 'low',
      },
    ],
    retrievedPassages: [
      {
        passageId: 'P-G-02',
        sourceId: 'G-02',
        sourceTitle: 'Agricultural Residue & Organic Purity Claims',
        sourceType: 'Guideline',
        text: 'Never claim any Kaveri Organics harvest is "100% pesticide-free" or "100% chemical-free". Always state: "Certified residue-tested below 0.01 mg/kg across 140 partner smallholdings under NPOP organic standards."',
        relevanceScore: 0.94,
        matchedTerms: ['100%', 'pesticide-free', 'organic'],
        confidential: false,
      },
      {
        passageId: 'P-F-02',
        sourceId: 'F-02',
        sourceTitle: 'Wayanad Cold-Pressed Virgin Coconut Oil 500ml MRP',
        sourceType: 'Approved Fact',
        text: 'The approved retail MRP for Wayanad Cold-Pressed Virgin Coconut Oil (500ml amber glass jar) is ₹640 inclusive of GST, updated from ₹480 effective 1 October 2026.',
        relevanceScore: 0.91,
        matchedTerms: ['Wayanad', 'Virgin Coconut Oil', '500ml', '₹480'],
        confidential: false,
      },
      {
        passageId: 'P-G-01',
        sourceId: 'G-01',
        sourceTitle: 'Editorial Tone & Quiet Botanical Authority',
        sourceType: 'Guideline',
        text: 'Never describe formulations with phrases like "slaps", "lowkey", "lit", "game-changer", or "antioxidant bomb".',
        relevanceScore: 0.87,
        matchedTerms: ['slaps', 'lowkey', 'cold-pressed'],
        confidential: false,
      },
      {
        passageId: 'P-G-04',
        sourceId: 'G-04',
        sourceTitle: 'Visual Contrast, Palette Discipline & Seal Proportions',
        sourceType: 'Guideline',
        text: 'Never place Nilgiri Mint (#7FD1BF) or Turmeric Amber (#F5A524) text directly on Warm Paper (#FAF8F4) backgrounds.',
        relevanceScore: 0.82,
        matchedTerms: ['#7FD1BF', '#FAF8F4', 'contrast'],
        confidential: false,
      },
    ],
    verifierStats: {
      lastRunAt: '2026-11-04 09:15',
      modelUsed: 'gemini-3.8-flash',
      passagesRetrieved: 4,
      rawAiFindingsCount: 3,
      verifiedAiFindingsCount: 2,
      discardedUngroundedCount: 1,
      deterministicRuleCount: 4,
      confidentialRedacted: true,
      discardedTraces: [
        {
          quotedText: 'after the first northeast monsoon showers',
          claimedSourceId: 'F-99-HALLUCINATED',
          claimedSourceQuote: 'Monsoon harvests must only reference southwest monsoon.',
          reason: 'Discarded by Verifier: sourceId "F-99-HALLUCINATED" does not exist in Brand Library.',
        },
      ],
    },
    versions: [
      {
        versionNumber: 1,
        timestamp: '2026-11-04 08:50',
        authorName: 'Ananya Nair',
        authorRole: 'Creator',
        summary: 'Initial campaign draft and banner specification uploaded for Q4 monsoon mailer.',
        contentText: `Cold-pressed in small batches after the first northeast monsoon showers, our Wayanad Virgin Coconut Oil comes from 100% pesticide-free groves in Kerala.

Honestly, this cold-pressed oil slaps whether you use it for a warm Champi head massage or slow-roasting curry leaves, and it is lowkey the best daily hair rescue in India.

Order our 500ml amber glass jar today for just ₹480 inclusive of taxes and experience guaranteed results from the very first wash.`,
        imageAltText: '',
        bannerConfig: {
          hasBanner: true,
          headline: 'Wayanad Monsoon Harvest · ₹480',
          subline: '100% Pesticide-Free Cold-Pressed Virgin Coconut Oil',
          fgHex: '#7FD1BF',
          bgHex: '#FAF8F4',
          accentHex: '#F5A524',
          logoVariant: 'official-seal',
        },
      },
    ],
    comments: [
      {
        id: 'CM-01',
        authorName: 'Nirnay Sutra Autopilot',
        authorRole: 'Autopilot AI',
        timestamp: '2026-11-04 09:16',
        text: 'Escalated to Human Exception Queue (Max Risk: 90/100 > 70). Contains unbacked "100% pesticide-free" purity claim and outdated ₹480 MRP.',
        actionType: 'autopilot-action',
      },
    ],
  },
  {
    id: 'CI-02',
    title: 'Bhringraj & Amla Scalp Elixir — Retail Trade & Social Deck',
    channel: 'Instagram & Retail Partner Note',
    team: 'External Social Agency',
    authorName: 'Kabir Mehta (Studio Vayu)',
    assignedReviewer: 'Vikramaditya Menon',
    status: 'In review',
    updatedAt: '2026-11-03 17:40',
    autoApprovedByAi: false,
    escalatedToHuman: true,
    maxRiskScore: 95,
    escalationReasons: [
      '[Risk 95/100 · CONFIDENTIAL] Draft exposes confidential Tier-1 distributor margin (28.5%) from FACT-CONF-07.',
      '[Risk 92/100 · MESSAGING] "guaranteed miracle cure for hair fall in 7 days" — Prohibited medical claim (Source: G-06).',
    ],
    currentText: `Introducing Kaveri Organics Bhringraj & Amla Scalp Elixir — a guaranteed miracle cure for hair fall in 7 days.

Crafted with a 100% chemical-free botanical base in recycled amber glass jars, our elixir is backed by our South India retail partner margin of 28.5% for launch displays.`,
    imageUrl: GENERATED_PHOTOS.teamCopyDiscussion,
    imageMimeType: 'image/jpeg',
    imageAltText: 'Two Kaveri Organics brand editors reviewing Bhringraj Scalp Elixir copy and colour swatches at a wooden studio table.',
    bannerConfig: {
      hasBanner: true,
      headline: 'Bhringraj & Amla Scalp Elixir',
      subline: 'Traditional Taila Paka Formulation · 78% Recycled Amber Glass',
      fgHex: '#FAF8F4',
      bgHex: '#0B3D3A',
      accentHex: '#7FD1BF',
      logoVariant: 'official-seal',
    },
    findings: [
      {
        id: 'FND-201',
        category: 'messaging',
        severity: 'high',
        quotedText: 'guaranteed miracle cure for hair fall in 7 days',
        explanation:
          'Violates clinical substantiation rules and Drugs & Magic Remedies regulations. Only the 8-week consumer perception study (84% reported reduced hair breakage) may be cited.',
        sourceId: 'G-06',
        sourceTitle: 'Ayurvedic & Clinical Substantiation Boundaries',
        sourceQuote:
          'Never state or imply that a Kaveri Organics formulation is a "miracle cure", "guaranteed hair regrowth treatment", or medical therapy.',
        suggestedFix:
          'traditional Ayurvedic formulation — in an 8-week consumer study (n=64), 84% reported visibly reduced hair breakage',
        confidence: 0.97,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
        riskScore: 92,
        riskBand: 'high',
      },
      {
        id: 'FND-202',
        category: 'terminology',
        severity: 'medium',
        quotedText: '100% chemical-free',
        explanation:
          'Banned term "chemical-free". All botanical extracts are composed of natural chemical compounds.',
        sourceId: 'T-02',
        sourceTitle: 'Terminology: chemical-free',
        sourceQuote: 'formulated without synthetic parabens, sulphates, or mineral oils',
        suggestedFix: 'formulated without synthetic parabens, sulphates, or mineral oils',
        confidence: 0.99,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
        riskScore: 24,
        riskBand: 'low',
      },
      {
        id: 'FND-203',
        category: 'claim',
        severity: 'high',
        quotedText: '28.5%',
        explanation:
          'Confidentiality Breach: Draft exposes internal Tier-1 retail distributor margin (28.5%) marked Confidential in FACT-CONF-07.',
        sourceId: 'F-07',
        sourceTitle: 'Tier-1 Retail Distributor Margin Structure',
        sourceQuote:
          'CONFIDENTIAL COMMERCIAL TERM: Tier-1 modern trade and specialty organic distributor margin is capped at 28.5% net of scheme rebates.',
        suggestedFix: 'available across specialty organic retail partners',
        confidence: 1.0,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
        riskScore: 95,
        riskBand: 'high',
      },
    ],
    retrievedPassages: [
      {
        passageId: 'P-G-06',
        sourceId: 'G-06',
        sourceTitle: 'Ayurvedic & Clinical Substantiation Boundaries',
        sourceType: 'Guideline',
        text: 'Never state or imply that a Kaveri Organics formulation is a "miracle cure", "guaranteed hair regrowth treatment", or medical therapy.',
        relevanceScore: 0.95,
        matchedTerms: ['miracle cure', 'guaranteed', 'hair'],
        confidential: false,
      },
      {
        passageId: 'P-F-07',
        sourceId: 'F-07',
        sourceTitle: 'Tier-1 Retail Distributor Margin Structure',
        sourceType: 'Approved Fact',
        text: 'CONFIDENTIAL COMMERCIAL TERM: Tier-1 modern trade and specialty organic distributor margin is capped at 28.5% net of scheme rebates.',
        relevanceScore: 0.89,
        matchedTerms: ['28.5%', 'retail', 'margin'],
        confidential: true,
      },
    ],
    verifierStats: {
      lastRunAt: '2026-11-03 17:38',
      modelUsed: 'gemini-3.8-flash',
      passagesRetrieved: 4,
      rawAiFindingsCount: 2,
      verifiedAiFindingsCount: 2,
      discardedUngroundedCount: 0,
      deterministicRuleCount: 3,
      confidentialRedacted: true,
      discardedTraces: [],
    },
    versions: [
      {
        versionNumber: 1,
        timestamp: '2026-11-03 16:20',
        authorName: 'Kabir Mehta (Studio Vayu)',
        authorRole: 'Creator',
        summary: 'Uploaded agency copy for Bhringraj Scalp Elixir carousel.',
        contentText: `Introducing Kaveri Organics Bhringraj & Amla Scalp Elixir — a guaranteed miracle cure for hair fall in 7 days.

Crafted with a 100% chemical-free botanical base in recycled amber glass jars, our elixir is backed by our South India retail partner margin of 28.5% for launch displays.`,
        imageAltText: 'Two Kaveri Organics brand editors reviewing Bhringraj Scalp Elixir copy and colour swatches at a wooden studio table.',
      },
    ],
    comments: [
      {
        id: 'CM-201',
        authorName: 'Nirnay Sutra Autopilot',
        authorRole: 'Autopilot AI',
        timestamp: '2026-11-03 17:40',
        text: 'Escalated to Human Exception Queue (Max Risk: 95/100 > 70). Confidential distributor margin (28.5%) was redacted prior to external AI call and blocked from auto-approval.',
        actionType: 'autopilot-action',
      },
    ],
  },
  {
    id: 'CI-03',
    title: 'Nilgiri Frost White Tea — Winter Caddy Back-Label Copy',
    channel: 'Packaging Print Sleeve',
    team: 'D2C Packaging Desk',
    authorName: 'Karthik Narayanan',
    assignedReviewer: 'Vikramaditya Menon',
    status: 'Changes requested',
    updatedAt: '2026-11-02 14:10',
    autoApprovedByAi: false,
    escalatedToHuman: true,
    maxRiskScore: 86,
    escalationReasons: [
      '[Risk 86/100 · CLAIM] "MRP of ₹780 inclusive of taxes" — Outdated tariff price vs ₹920 in FACT-MRP-05.',
    ],
    currentText: `Hand-plucked at 2,100 metres in Coonoor during the January frost, Kaveri Organics Nilgiri Frost White Tea is an antioxidant bomb with a crisp orchid finish.

Packaged in reusable tin caddies at an MRP of ₹780 inclusive of taxes.`,
    imageUrl: GENERATED_PHOTOS.studioArchiveShelf,
    imageMimeType: 'image/jpeg',
    imageAltText: 'img_final_v2.jpg',
    bannerConfig: {
      hasBanner: true,
      headline: 'Nilgiri Frost White Tea · 100g Caddy',
      subline: 'Elevation 2,100m · Coonoor Winter Harvest',
      fgHex: '#0B3D3A',
      bgHex: '#FAF8F4',
      accentHex: '#17806D',
      logoVariant: 'official-seal',
    },
    findings: [
      {
        id: 'FND-301',
        category: 'tone',
        severity: 'medium',
        quotedText: 'antioxidant bomb',
        explanation:
          'Banned hyperbolic slang ("antioxidant bomb"). Replace with specific phytochemical phrasing from the Kaveri glossary.',
        sourceId: 'T-06',
        sourceTitle: 'Terminology: antioxidant bomb',
        sourceQuote: 'naturally rich in catechins and polyphenols',
        suggestedFix: 'naturally rich in catechins and delicate polyphenols',
        confidence: 0.98,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
        riskScore: 18,
        riskBand: 'low',
      },
      {
        id: 'FND-302',
        category: 'claim',
        severity: 'high',
        quotedText: 'MRP of ₹780 inclusive of taxes',
        explanation:
          'Outdated packaging MRP. Nilgiri Frost White Tea (100g tin) was updated to ₹920 in the October 2026 price revision.',
        sourceId: 'F-05',
        sourceTitle: 'Nilgiri Frost White Tea 100g Elevation & MRP',
        sourceQuote:
          'Single-estate Nilgiri Frost White Tea (100g caddy) is hand-plucked at 2,100 metres elevation in Coonoor during winter frost; approved MRP is ₹920 inclusive of GST (updated from ₹780).',
        suggestedFix: 'MRP of ₹920 inclusive of GST',
        confidence: 0.97,
        needsHumanJudgement: false,
        origin: 'gemini-verified',
        status: 'open',
        riskScore: 86,
        riskBand: 'high',
      },
      {
        id: 'FND-303',
        category: 'accessibility',
        severity: 'medium',
        quotedText: 'Alt text is raw filename: "img_final_v2.jpg"',
        explanation:
          'Raw filenames do not describe the image for screen-reader users and violate guideline SUTRA-A11Y-05.',
        sourceId: 'G-05',
        sourceTitle: 'Mandatory Descriptive Alt Text for Visual Assets',
        sourceQuote:
          'Blank alt attributes or raw filenames (such as "img_final_v2.jpg") are blocked from publication.',
        suggestedFix:
          'Design archive table displaying linen-bound Kaveri Organics brand manuals and botanical sample jars in warm afternoon light.',
        confidence: 1.0,
        needsHumanJudgement: false,
        origin: 'rule-engine',
        status: 'open',
        riskScore: 22,
        riskBand: 'low',
      },
    ],
    retrievedPassages: [
      {
        passageId: 'P-F-05',
        sourceId: 'F-05',
        sourceTitle: 'Nilgiri Frost White Tea 100g Elevation & MRP',
        sourceType: 'Approved Fact',
        text: 'Single-estate Nilgiri Frost White Tea (100g caddy) is hand-plucked at 2,100 metres elevation in Coonoor during winter frost; approved MRP is ₹920 inclusive of GST (updated from ₹780).',
        relevanceScore: 0.96,
        matchedTerms: ['Nilgiri Frost White Tea', '2,100', 'Coonoor', '₹780'],
        confidential: false,
      },
    ],
    verifierStats: {
      lastRunAt: '2026-11-02 13:55',
      modelUsed: 'gemini-3.8-flash',
      passagesRetrieved: 3,
      rawAiFindingsCount: 2,
      verifiedAiFindingsCount: 1,
      discardedUngroundedCount: 1,
      deterministicRuleCount: 2,
      confidentialRedacted: true,
      discardedTraces: [
        {
          quotedText: 'January frost',
          claimedSourceId: 'F-05',
          claimedSourceQuote: 'Harvested exclusively in February.',
          reason: 'Discarded by Verifier: claimed sourceQuote does not appear in sourceId F-05.',
        },
      ],
    },
    versions: [
      {
        versionNumber: 1,
        timestamp: '2026-11-01 11:00',
        authorName: 'Karthik Narayanan',
        authorRole: 'Creator',
        summary: 'Initial back-label draft with winter tasting notes.',
        contentText: `Hand-plucked at 2,100 metres in Coonoor during the January frost, Kaveri Organics Nilgiri Frost White Tea is a 100% pesticide-free antioxidant bomb with a crisp orchid finish.

Packaged in reusable tin caddies at an MRP of ₹780 inclusive of taxes.`,
        imageAltText: 'img_final_v2.jpg',
      },
      {
        versionNumber: 2,
        timestamp: '2026-11-02 10:30',
        authorName: 'Karthik Narayanan',
        authorRole: 'Creator',
        summary: 'Removed "100% pesticide-free" phrase per G-02 before submitting to Reviewer.',
        contentText: `Hand-plucked at 2,100 metres in Coonoor during the January frost, Kaveri Organics Nilgiri Frost White Tea is an antioxidant bomb with a crisp orchid finish.

Packaged in reusable tin caddies at an MRP of ₹780 inclusive of taxes.`,
        imageAltText: 'img_final_v2.jpg',
        triggeredByFindingId: 'FND-101',
      },
    ],
    comments: [
      {
        id: 'CM-301',
        authorName: 'Vikramaditya Menon',
        authorRole: 'Reviewer',
        timestamp: '2026-11-02 14:10',
        text: 'Changes requested: Good catch removing the pesticide claim in v2, but the tin MRP is still listed at ₹780 instead of the Oct 2026 ₹920 tariff, and "antioxidant bomb" needs to be replaced before print sign-off.',
        actionType: 'status-change',
      },
    ],
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-1000',
    timestamp: '2026-11-04 09:42:11',
    actorName: 'Nirnay Sutra Autopilot',
    actorRole: 'Autopilot AI',
    eventType: 'AUTOPILOT_AUTO_APPROVE',
    targetId: 'CI-04',
    targetTitle: 'Coorg Green Cardamom & Sesame Bath Oil — Agency Social Note',
    summary:
      'Autopilot auto-applied 3 low-risk fixes (max risk 22/100 < 30), re-verified 0 open findings, and marked content Approved.',
    details: {
      modelUsed: 'gemini-3.8-flash',
      passagesSent: 4,
      confidentialRedacted: true,
      riskScore: 22,
      sourceId: 'T-03, T-04, G-05',
      sourceTitle: 'Terminology & Accessibility Rules',
      beforeDiff: 'this bath oil slaps ... and is lowkey ... | alt=""',
      afterDiff:
        'this bath oil delivers remarkable botanical depth ... and is quietly ... | alt="Kaveri Organics amber glass packaging proof..."',
    },
  },
  {
    id: 'AUD-1001',
    timestamp: '2026-11-04 09:15:22',
    actorName: 'Nirnay Sutra Autopilot',
    actorRole: 'Autopilot AI',
    eventType: 'AUTOPILOT_ESCALATE',
    targetId: 'CI-01',
    targetTitle: 'Monsoon Harvest: Wayanad Virgin Coconut Oil Launch Mailer',
    summary:
      'Escalated to Human Exception Queue (Max Risk 90/100 > 70): Unbacked "100% pesticide-free" claim and outdated ₹480 MRP require human review.',
    details: {
      modelUsed: 'gemini-3.8-flash',
      passagesSent: 4,
      confidentialRedacted: true,
      rawCount: 3,
      verifiedCount: 2,
      discardedCount: 1,
      riskScore: 90,
      sourceId: 'G-02, F-02',
    },
  },
  {
    id: 'AUD-1002',
    timestamp: '2026-11-03 17:38:10',
    actorName: 'Nirnay Sutra Autopilot',
    actorRole: 'Autopilot AI',
    eventType: 'AUTOPILOT_ESCALATE',
    targetId: 'CI-02',
    targetTitle: 'Bhringraj & Amla Scalp Elixir — Retail Trade & Social Deck',
    summary:
      'Escalated to Human Exception Queue (Max Risk 95/100 > 70): Confidential distributor margin (28.5%) redacted before AI call and blocked from auto-approval.',
    details: {
      modelUsed: 'gemini-3.8-flash',
      passagesSent: 4,
      confidentialRedacted: true,
      rawCount: 2,
      verifiedCount: 2,
      discardedCount: 0,
      riskScore: 95,
      sourceId: 'F-07, G-06',
    },
  },
  {
    id: 'AUD-1003',
    timestamp: '2026-11-02 14:10:05',
    actorName: 'Vikramaditya Menon',
    actorRole: 'Reviewer',
    eventType: 'STATUS_TRANSITION',
    targetId: 'CI-03',
    targetTitle: 'Nilgiri Frost White Tea — Winter Caddy Back-Label Copy',
    summary: 'Reviewer requested changes on v2 due to unresolved ₹780 outdated MRP and banned slang.',
    details: {
      decision: 'Changes requested',
      sourceId: 'F-05',
    },
  },
];
