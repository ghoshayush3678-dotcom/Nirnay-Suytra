export type UserRole = 'Creator' | 'Manager' | 'Reviewer' | 'Brand Admin';

export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

export type MemberAccountStatus = 'active' | 'deactivated';

export interface WorkspaceRecord {
  id: string;
  name: string;
  workspaceCode: string;
  ownerUid: string;
  autopilotMode: AutopilotMode;
  createdAt: string;
  isSandbox?: boolean;
}

export interface WorkspaceMemberRecord {
  uid: string;
  workspaceId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  authProvider: 'google' | 'password' | 'demo-sandbox';
  role: UserRole; // Effective active role ('Creator' while pending)
  requestedRole: UserRole; // Requested role ('Creator' | 'Manager' | 'Reviewer' | 'Brand Admin')
  approvalStatus: ApprovalStatus;
  status: MemberAccountStatus;
  joinedAt: string;
  lastSignInAt: string;
}

export interface WorkspaceInviteRecord {
  id: string; // Invite token e.g. INV-KAVERI-8921
  workspaceId: string;
  workspaceName: string;
  assignedRole: 'Creator' | 'Manager' | 'Reviewer';
  createdByUid: string;
  createdByName: string;
  expiresAt: string;
  createdAt: string;
  usedCount: number;
  revoked: boolean;
}

export interface SignInActivityRecord {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  authProvider: 'google' | 'password' | 'demo-sandbox';
  event: 'SIGN_IN' | 'SIGN_OUT' | 'SIGN_OUT_ALL_DEVICES' | 'SESSION_TIMEOUT' | 'ROLE_APPROVED' | 'ROLE_CHANGED' | 'ACCOUNT_DELETED';
  timestamp: string;
  deviceSummary: string;
}

export interface AuthenticatedUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  authProvider: 'google' | 'password' | 'demo-sandbox';
  emailVerified: boolean;
  activeWorkspaceId: string;
  role: UserRole; // Effective role in the active workspace
  requestedRole: UserRole;
  approvalStatus: ApprovalStatus;
  status: MemberAccountStatus;
  consentedToTermsAt: string;
  sessionEpoch: number;
  lastSignInAt: string;
  createdAt: string;
  isDemoSandbox?: boolean;
}

export type ContentStatus =
  | 'Draft'
  | 'AI-checked'
  | 'In review'
  | 'Changes requested'
  | 'Approved';

export type FindingCategory =
  | 'tone'
  | 'terminology'
  | 'messaging'
  | 'claim'
  | 'visual'
  | 'accessibility';

export type FindingSeverity = 'high' | 'medium' | 'low';

export type AutopilotMode = 'Off' | 'Assisted' | 'Autopilot';

export type RiskBand = 'low' | 'medium' | 'high';

export interface AutopilotConfig {
  mode: AutopilotMode;
  killSwitchPaused: boolean;
  lowRiskThreshold: number; // default 30 (under 30 = Low Risk)
  highRiskThreshold: number; // default 70 (over 70 = High Risk)
  minMediumConfidence: number; // default 0.85
  alwaysEscalateCategories: FindingCategory[];
  alwaysRedactConfidential: true; // Safety rail that cannot be turned off
  stats: {
    itemsProcessed: number;
    autoApproved: number;
    escalatedToHumans: number;
    rolledBack: number;
    avgMinutesSavedPerItem: number;
  };
}

export interface AutopilotDiffChange {
  findingId: string;
  category: FindingCategory;
  riskScore: number;
  sourceId: string;
  sourceTitle: string;
  reason: string;
  beforeSnippet: string;
  afterSnippet: string;
}

export interface AutopilotActionRecord {
  id: string;
  timestamp: string;
  outcome: 'AUTO_APPROVED' | 'ESCALATED_TO_HUMAN' | 'ROLLED_BACK';
  maxRiskScore: number;
  riskBand: RiskBand;
  summaryReason: string;
  escalationReasons: string[];
  changesApplied: AutopilotDiffChange[];
  snapshotBefore: {
    contentText: string;
    imageAltText: string;
    bannerConfig: BannerVisualConfig;
    status: ContentStatus;
    findings: Finding[];
  };
  snapshotAfter: {
    contentText: string;
    imageAltText: string;
    bannerConfig: BannerVisualConfig;
    status: ContentStatus;
  };
  recheckPassedAll: boolean;
  rolledBack: boolean;
  rolledBackAt?: string;
  rolledBackBy?: string;
  aiDisclosureText: string;
}

export type SupportedLanguage = 'en' | 'hi' | 'hinglish';

export interface GuidelineConflict {
  otherGuidelineId: string;
  otherGuidelineTitle: string;
  thisQuote: string;
  otherQuote: string;
  reason: string;
}

export interface GuidelineItem {
  id: string;
  code: string;
  title: string;
  category: FindingCategory;
  content: string;
  examplesGood: string;
  examplesBad: string;
  confidential: boolean;
  updatedAt: string;
  flaggedCount: number;
  disputedCount: number;
  healthScore?: number; // 0 to 100 calculated from age, disputes, and conflicts
  conflictsDetected?: GuidelineConflict[];
  language?: SupportedLanguage;
}

export interface ApprovedFactItem {
  id: string;
  code: string;
  title: string;
  statement: string;
  sourceDocument: string;
  lastVerified: string;
  verifiedBy: string;
  confidential: boolean;
  healthScore?: number;
  requiresExpertTopic?: boolean;
  language?: SupportedLanguage;
}

export interface TerminologyItem {
  id: string;
  bannedTerm: string;
  preferredTerm: string;
  reason: string;
  category: FindingCategory;
  confidential: boolean;
  language?: SupportedLanguage;
}

export interface BrandColourSwatch {
  id: string;
  name: string;
  hex: string;
  role: string;
  recommendedPairHex: string;
}

export interface BrandAssetItem {
  id: string;
  name: string;
  type: 'logo' | 'palette' | 'packaging-rule';
  description: string;
  ruleText: string;
  confidential: boolean;
  swatches?: BrandColourSwatch[];
}

export interface RetrievedPassage {
  passageId: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: 'Guideline' | 'Approved Fact' | 'Terminology' | 'Brand Asset';
  text: string;
  relevanceScore: number;
  matchedTerms: string[];
  confidential: boolean;
}

export interface IntentLockConfig {
  coreMessage: string;
  mustKeepPoints: string[]; // up to 3 must-keep points
  callToAction: string;
}

export interface IntentCheckResult {
  status: 'kept' | 'at_risk';
  reason: string;
}

export type ClaimStatus = 'Supported' | 'Outdated' | 'Unsupported' | 'Needs an expert';
export type ClaimTopic = 'health' | 'legal' | 'price' | 'safety' | 'clinical' | 'environmental' | 'general';

export interface ClaimLedgerEntry {
  id: string;
  claimText: string;
  topic: ClaimTopic;
  matchedFactId?: string;
  matchedFactStatement?: string;
  status: ClaimStatus;
  reason: string;
  suggestedWording?: string;
  requiresExpertReview?: boolean;
}

export interface BrandFitBreakdown {
  overall: number; // 0 to 100
  tone: number; // 0 to 20
  words: number; // 0 to 20
  claims: number; // 0 to 20
  visuals: number; // 0 to 20
  accessibility: number; // 0 to 20
  explanation: string;
  computedAt: string;
}

export interface ProofReceiptSourceRef {
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  lastVerified: string;
}

export interface ProofReceiptFindingDiff {
  findingId: string;
  category: string;
  quotedText: string;
  suggestedFix: string;
  outcome: 'accepted' | 'edited' | 'dismissed';
  appliedText?: string;
  changeAuthor: 'AI' | 'Person' | 'Unchanged';
  sourceId: string;
  sourceTitle: string;
}

export interface ProofReceipt {
  receiptId: string;
  contentId: string;
  contentTitle: string;
  finalContentText: string;
  finalSha256Hash: string;
  approvedAt: string;
  approvedBy: string;
  approvedByRole: UserRole;
  sourcesChecked: ProofReceiptSourceRef[];
  findingsLog: ProofReceiptFindingDiff[];
  aiServiceUsed: string;
  changesAttribution: {
    aiChangedCount: number;
    personChangedCount: number;
    dismissedCount: number;
  };
  watermarkNote: string; // "Shows the content has not changed since approval."
}

export interface BenchmarkTestCase {
  id: string;
  title: string;
  category:
    | 'pesticide_claim'
    | 'outdated_price'
    | 'ungrounded_yield'
    | 'distorted_logo'
    | 'poor_contrast'
    | 'tone_slang'
    | 'missing_alt'
    | 'prompt_injection'
    | 'hindi_claim'
    | 'hinglish_pricing'
    | 'clinical_unsupported'
    | 'clean_compliant';
  language: SupportedLanguage;
  draftText: string;
  knownErrorsCount: number;
  knownErrorDescriptions: string[];
  hasInjection?: boolean;
  groundTruthSourceIds: string[];
}

export interface BenchmarkRunReport {
  runAt: string;
  modelUsed: string;
  totalTestCases: number;
  truePositives: number;
  falseNegatives: number;
  falsePositives: number;
  groundedRatePercent: number;
  accuracyPercent: number;
  offlineRuleFallbackUsed: boolean;
  testCaseDetails: Array<{
    testCaseId: string;
    testCaseTitle: string;
    expectedErrors: number;
    detectedErrors: number;
    missed: number;
    wrongFlags: number;
    findings: Finding[];
  }>;
}

export interface InjectionShieldCheckResult {
  suspiciousFound: boolean;
  detectedPhrases: string[];
  warningMessage?: string;
}

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  quotedText: string;
  explanation: string;
  sourceId: string;
  sourceTitle: string;
  sourceQuote: string;
  suggestedFix: string;
  confidence: number;
  needsHumanJudgement: boolean;
  origin: 'rule-engine' | 'gemini-verified';
  status: 'open' | 'accepted' | 'edited' | 'dismissed';
  dismissalReason?: string;
  disputedGuideline?: boolean;
  appliedReplacement?: string;
  riskScore?: number; // 0 to 100
  riskBand?: RiskBand;
  riskFactors?: string[];
  autoAppliedByAutopilot?: boolean;
  reportedAsIssue?: boolean;
  issueReportReason?: string;
  intentCheck?: IntentCheckResult;
  language?: SupportedLanguage;
}

export type ActiveTab =
  | 'landing'
  | 'auth'
  | 'autopilot'
  | 'dashboard'
  | 'brand-library'
  | 'review-studio'
  | 'approvals'
  | 'revision-history'
  | 'insights'
  | 'audit-disclosure'
  | 'team-access'
  | 'privacy'
  | 'status'
  | 'accuracy-lab';

export interface DiscardedFindingTrace {
  quotedText: string;
  claimedSourceId: string;
  claimedSourceQuote: string;
  reason: string;
}

export interface VerifierStats {
  lastRunAt: string;
  modelUsed: string;
  passagesRetrieved: number;
  rawAiFindingsCount: number;
  verifiedAiFindingsCount: number;
  discardedUngroundedCount: number;
  deterministicRuleCount: number;
  confidentialRedacted: boolean;
  discardedTraces: DiscardedFindingTrace[];
}

export interface BannerVisualConfig {
  hasBanner: boolean;
  headline: string;
  subline: string;
  fgHex: string;
  bgHex: string;
  accentHex: string;
  logoVariant: 'official-seal' | 'stretched-distorted' | 'low-clearspace';
}

export interface RevisionVersion {
  versionNumber: number;
  timestamp: string;
  authorName: string;
  authorRole: UserRole | 'Autopilot AI';
  summary: string;
  contentText: string;
  imageAltText: string;
  bannerConfig?: BannerVisualConfig;
  triggeredByFindingId?: string;
  isAutopilotVersion?: boolean;
}

export interface ReviewComment {
  id: string;
  authorName: string;
  authorRole: UserRole | 'Autopilot AI';
  timestamp: string;
  text: string;
  actionType: 'comment' | 'status-change' | 'assignment' | 'autopilot-action';
}

export interface ContentItem {
  id: string;
  title: string;
  channel: string;
  team: string;
  authorName: string;
  assignedReviewer: string;
  status: ContentStatus;
  updatedAt: string;
  currentText: string;
  imageUrl?: string;
  imageMimeType?: string;
  imageAltText: string;
  bannerConfig: BannerVisualConfig;
  findings: Finding[];
  retrievedPassages: RetrievedPassage[];
  verifierStats?: VerifierStats;
  versions: RevisionVersion[];
  comments: ReviewComment[];
  // Autopilot fields
  autoApprovedByAi?: boolean;
  escalatedToHuman?: boolean;
  escalationReasons?: string[];
  rolledBack?: boolean;
  maxRiskScore?: number;
  autopilotAction?: AutopilotActionRecord;
  // Signature features
  intentLock?: IntentLockConfig;
  brandFitScore?: BrandFitBreakdown;
  proofReceipt?: ProofReceipt;
  claimLedger?: ClaimLedgerEntry[];
  language?: SupportedLanguage;
  injectionShield?: InjectionShieldCheckResult;
}

export type AuditEventType =
  | 'AI_CALL'
  | 'HUMAN_DECISION'
  | 'STATUS_TRANSITION'
  | 'LIBRARY_UPDATE'
  | 'AUTOPILOT_AUTO_APPROVE'
  | 'AUTOPILOT_ESCALATE'
  | 'AUTOPILOT_ROLLBACK'
  | 'AUTH_SIGN_IN'
  | 'AUTH_SIGN_OUT'
  | 'ROLE_CHANGE'
  | 'ROLE_APPROVAL'
  | 'INVITE_GENERATED'
  | 'PROOF_RECEIPT_GENERATED'
  | 'INJECTION_DETECTED'
  | 'ACCOUNT_DELETION';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole | 'Autopilot AI';
  eventType: AuditEventType;
  targetId: string;
  targetTitle: string;
  summary: string;
  details: {
    modelUsed?: string;
    passagesSent?: number;
    confidentialRedacted?: boolean;
    rawCount?: number;
    verifiedCount?: number;
    discardedCount?: number;
    sourceId?: string;
    sourceTitle?: string;
    decision?: string;
    riskScore?: number;
    beforeDiff?: string;
    afterDiff?: string;
    authProvider?: string;
    workspaceId?: string;
    previousRole?: string;
    newRole?: string;
  };
}

export interface BrandLibraryState {
  brandName: string;
  tagline: string;
  autopilotConfig: AutopilotConfig;
  guidelines: GuidelineItem[];
  facts: ApprovedFactItem[];
  terminology: TerminologyItem[];
  assets: BrandAssetItem[];
}
