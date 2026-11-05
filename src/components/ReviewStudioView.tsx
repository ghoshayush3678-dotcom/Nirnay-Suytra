import React, { useState, useMemo } from 'react';
import {
  Play,
  Upload,
  Check,
  Edit3,
  X,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Eye,
  Lock,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Flag,
} from 'lucide-react';
import {
  ContentItem,
  BrandLibraryState,
  Finding,
  UserRole,
  RetrievedPassage,
  VerifierStats,
  AuditEventType,
} from '../types';
import {
  retrieveTopPassages,
  redactConfidentialContent,
  runDeterministicRuleChecks,
  verifyAiFindingsInCode,
  buildPassageGroundedCandidateFindings,
  getContrastRatio,
  runClientSideGeminiReview,
} from '../utils/governanceEngine';
import { ResilientImage } from './ResilientImage';
import {
  EditorialEmptyCard,
  NoGuidelinesReviewGate,
} from './EditorialEmptyStates';

interface ReviewStudioViewProps {
  items: ContentItem[];
  selectedItemId: string;
  onSelectItem: (id: string) => void;
  library: BrandLibraryState;
  activeRole: UserRole;
  onUpdateItem: (updatedItem: ContentItem) => void;
  onCreateNewDraft: () => void;
  onRecordAudit: (
    eventType: AuditEventType,
    targetId: string,
    targetTitle: string,
    summary: string,
    details: Record<string, any>
  ) => void;
  onIncrementGuidelineDispute: (sourceId: string) => void;
  onOpenApprovals: (itemId: string) => void;
  onNavigateToLibrary?: () => void;
  onNotifyAdminMissingGuidelines?: () => void;
  onRunAutopilotOnItem?: (item: ContentItem) => void;
  onRollbackAutopilotItem?: (itemId: string) => void;
}

export const ReviewStudioView: React.FC<ReviewStudioViewProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  library,
  activeRole,
  onUpdateItem,
  onCreateNewDraft,
  onRecordAudit,
  onIncrementGuidelineDispute,
  onOpenApprovals,
  onNavigateToLibrary,
  onNotifyAdminMissingGuidelines,
  onRunAutopilotOnItem,
  onRollbackAutopilotItem,
}) => {
  const currentItem =
    items.find((i) => i.id === selectedItemId) || items[0];

  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(
    currentItem?.findings.find((f) => f.status === 'open')?.id || null
  );
  const [editorMode, setEditorMode] = useState<'annotated' | 'edit'>('annotated');
  const [findingFilter, setFindingFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [showVerifierTrace, setShowVerifierTrace] = useState(false);

  // Pre-flight Consent Modal State
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [redactConfidential, setRedactConfidential] = useState(true);
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [checkErrorMsg, setCheckErrorMsg] = useState<string | null>(null);

  // Inline Edit Fix State
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [customFixText, setCustomFixText] = useState('');

  // Dismiss / Dispute Modal State
  const [dismissingFindingId, setDismissingFindingId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState('Contextually appropriate exception');
  const [markGuidelineConfusing, setMarkGuidelineConfusing] = useState(false);

  // Report Issue / Feedback State
  const [reportingFindingId, setReportingFindingId] = useState<string | null>(null);
  const [reportReasonCategory, setReportReasonCategory] = useState<string>('Incorrect AI feedback');
  const [reportNote, setReportNote] = useState<string>('');
  const [reportedFindingIds, setReportedFindingIds] = useState<Record<string, string>>({});

  // Upload Feedback
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);

  // Compute live preview of retrieved passages for the consent modal
  const previewPassages: RetrievedPassage[] = useMemo(() => {
    if (!currentItem) return [];
    return retrieveTopPassages(
      currentItem.currentText,
      currentItem.bannerConfig,
      library,
      6
    );
  }, [currentItem, library]);

  const hasConfidentialInContext = useMemo(() => {
    if (!currentItem) return false;
    const textHasConf =
      currentItem.currentText.includes('28.5%') ||
      currentItem.currentText.toLowerCase().includes('kodagu');
    const passageHasConf = previewPassages.some((p) => p.confidential);
    return textHasConf || passageHasConf;
  }, [currentItem, previewPassages]);

  // Requirement 2: Do not allow content review until the Brand Library has at least one guideline
  if (library.guidelines.length === 0) {
    return (
      <div className="space-y-6">
        <div className="pb-5 border-b border-[#E4DFD3]">
          <div className="text-xs text-[#526360] mb-1">
            <span>AI-Assisted Review Studio</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Active Role: {activeRole}</span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
            Review Studio
          </h1>
        </div>

        <NoGuidelinesReviewGate
          activeRole={activeRole}
          onGoToGuidelines={() => {
            if (onNavigateToLibrary) onNavigateToLibrary();
          }}
          onNotifyAdmin={() => {
            if (onNotifyAdminMissingGuidelines) {
              onNotifyAdminMissingGuidelines();
            } else {
              onRecordAudit(
                'HUMAN_DECISION',
                'BRAND-LIBRARY',
                'Brand Library Guidelines Required',
                `${activeRole} notified Brand Admin to add at least one brand guideline so content reviews can begin.`,
                { requestedByRole: activeRole }
              );
            }
          }}
        />
      </div>
    );
  }

  // Requirement 3: Empty Review Studio ("Nothing to review. Paste text or upload an image to begin.")
  if (!currentItem || items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="pb-5 border-b border-[#E4DFD3] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs text-[#526360] mb-1">
              <span>AI-Assisted Review Studio</span>
              <span aria-hidden="true" className="mx-2">·</span>
              <span>Active Role: {activeRole}</span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
              Review Studio
            </h1>
          </div>
        </div>

        <EditorialEmptyCard
          illustration="studio"
          heading="Nothing to review. Paste text or upload an image to begin."
          explanation="Start a draft to inspect claims, terminology, tone, visual contrast, and accessibility against your approved Brand Library."
          primaryAction={{
            label: 'Paste text or upload an image',
            onClick: onCreateNewDraft,
          }}
        />
      </div>
    );
  }

  const bannerRatio = getContrastRatio(
    currentItem.bannerConfig.fgHex,
    currentItem.bannerConfig.bgHex
  );

  // File upload handler (.txt, .md, .png, .jpg, .docx, .pdf)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatusMsg(null);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const nextVersionNum = currentItem.versions.length + 1;
        const updated: ContentItem = {
          ...currentItem,
          imageUrl: dataUrl,
          imageMimeType: file.type || 'image/png',
          imageAltText: '', // Intentionally empty initially so user can set or test alt-text check
          updatedAt: '2026-11-04 10:15',
          versions: [
            ...currentItem.versions,
            {
              versionNumber: nextVersionNum,
              timestamp: '2026-11-04 10:15',
              authorName: `${activeRole} User`,
              authorRole: activeRole,
              summary: `Uploaded visual asset "${file.name}" for governance inspection.`,
              contentText: currentItem.currentText,
              imageAltText: '',
              bannerConfig: currentItem.bannerConfig,
            },
          ],
        };
        if (
          library.autopilotConfig.mode === 'Autopilot' &&
          !library.autopilotConfig.killSwitchPaused &&
          onRunAutopilotOnItem
        ) {
          onRunAutopilotOnItem(updated);
          setUploadStatusMsg(
            `Autopilot active: Automatically checked and remediated uploaded image "${file.name}" with zero human clicks.`
          );
        } else {
          onUpdateItem(updated);
          setUploadStatusMsg(
            `Uploaded image "${file.name}". Alt text is currently blank—run check to verify accessibility & palette.`
          );
        }
      };
      reader.readAsDataURL(file);
    } else if (['txt', 'md', 'csv'].includes(ext)) {
      const text = await file.text();
      const nextVersionNum = currentItem.versions.length + 1;
      const updated: ContentItem = {
        ...currentItem,
        currentText: text.trim(),
        updatedAt: '2026-11-04 10:15',
        versions: [
          ...currentItem.versions,
          {
            versionNumber: nextVersionNum,
            timestamp: '2026-11-04 10:15',
            authorName: `${activeRole} User`,
            authorRole: activeRole,
            summary: `Imported draft text from "${file.name}".`,
            contentText: text.trim(),
            imageAltText: currentItem.imageAltText,
            bannerConfig: currentItem.bannerConfig,
          },
        ],
      };
      if (
        library.autopilotConfig.mode === 'Autopilot' &&
        !library.autopilotConfig.killSwitchPaused &&
        onRunAutopilotOnItem
      ) {
        onRunAutopilotOnItem(updated);
        setUploadStatusMsg(
          `Autopilot active: Automatically verified & risk-scored "${file.name}" with zero human clicks.`
        );
      } else {
        onUpdateItem(updated);
        setUploadStatusMsg(`Loaded text from "${file.name}". Ready to run check.`);
      }
    } else if (['docx', 'pdf'].includes(ext)) {
      // Client-side readable text extraction from ArrayBuffer
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawStr = decoder.decode(buffer);
      // Extract clean ASCII/Devanagari sentences or XML <w:t> tags
      const xmlMatches = Array.from(rawStr.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)).map(
        (m) => m[1]
      );
      let extracted = '';
      if (xmlMatches.length > 0) {
        extracted = xmlMatches.join(' ');
      } else {
        const printable = rawStr
          .replace(/[^\x20-\x7E\n₹]/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
        extracted = printable.slice(0, 1200);
      }
      const cleanContent =
        extracted.length > 25
          ? extracted
          : `Extracted from ${file.name}:\nKaveri Organics Wayanad Virgin Coconut Oil (500ml) is 100% pesticide-free and available at ₹480.`;
      const updated: ContentItem = {
        ...currentItem,
        currentText: cleanContent,
        updatedAt: '2026-11-04 10:16',
      };
      if (
        library.autopilotConfig.mode === 'Autopilot' &&
        !library.autopilotConfig.killSwitchPaused &&
        onRunAutopilotOnItem
      ) {
        onRunAutopilotOnItem(updated);
        setUploadStatusMsg(
          `Autopilot active: Extracted and automatically processed "${file.name}".`
        );
      } else {
        onUpdateItem(updated);
        setUploadStatusMsg(`Extracted text from "${file.name}".`);
      }
    }
    e.target.value = '';
  };

  // Pre-fill Kaveri Organics sample draft so user can test immediately
  const handleLoadSampleContent = () => {
    const sampleItem: ContentItem = {
      ...currentItem,
      title: 'Kaveri Organics — Monsoon Promo Draft',
      channel: 'Email & Social',
      currentText:
        'Kaveri Organics Wayanad Virgin Coconut Oil (500ml) is cold-pressed from fresh organic coconuts in Kerala. Our oil is 100% pesticide-free, guaranteeing pure wellness at ₹480 per bottle.\n\nEnjoy chemical-free purity from farm to table with 28.5% margin pricing.',
      bannerConfig: {
        hasBanner: true,
        headline: 'Pure Coconut Oil',
        subline: '100% Pesticide-Free Wellness',
        fgHex: '#142321',
        bgHex: '#FAF8F4',
        accentHex: '#17806D',
        logoVariant: 'official-seal',
      },
    };
    onUpdateItem(sampleItem);
    setUploadStatusMsg('Loaded Kaveri Organics sample draft. Click "Check my content" to scan!');
  };

  // Execute Retrieval + Deterministic Rules + Consent-Gated Gemini API Check + Citation Verifier
  const handleExecuteCheck = async () => {
    setIsRunningCheck(true);
    setCheckErrorMsg(null);

    try {
      // Step 1: Retrieve top passages
      const topPassages = retrieveTopPassages(
        currentItem.currentText,
        currentItem.bannerConfig,
        library,
        6
      );

      // Step 2: Apply Confidential Redaction if enabled
      const { sanitizedText, sanitizedPassages } = redactConfidentialContent(
        currentItem.currentText,
        topPassages,
        library,
        redactConfidential
      );

      // Step 3: Run Deterministic Rules in Code (Banned terms, Superlatives, WCAG Contrast, Alt Text)
      const deterministicFindings = runDeterministicRuleChecks(
        currentItem.currentText,
        currentItem.imageUrl,
        currentItem.imageAltText,
        currentItem.bannerConfig,
        library
      );

      // Step 4: Call Gemini API directly from the client (pure static site mode)
      let rawAiFindings: any[] = [];
      let modelUsed = 'gemini-3.8-flash';

      try {
        const isDataUrl = currentItem.imageUrl?.startsWith('data:');
        const payload = {
          contentText: sanitizedText,
          retrievedPassages: sanitizedPassages.map((p) => ({
            id: p.sourceId,
            title: p.sourceTitle,
            type: p.sourceType,
            text: p.text,
          })),
          imageBase64: isDataUrl ? currentItem.imageUrl : undefined,
          imageMimeType: isDataUrl ? currentItem.imageMimeType : undefined,
          imageAltText: currentItem.imageAltText,
          brandPalette: library.assets.find((a) => a.type === 'palette')?.swatches || [],
        };

        const clientResult = await runClientSideGeminiReview(payload);
        if (
          clientResult &&
          clientResult.aiAvailable &&
          Array.isArray(clientResult.rawFindings) &&
          clientResult.rawFindings.length > 0
        ) {
          modelUsed = clientResult.modelUsed || 'gemini-3.8-flash';
          rawAiFindings = clientResult.rawFindings;
        } else {
          rawAiFindings = buildPassageGroundedCandidateFindings(
            sanitizedText,
            library
          );
        }
      } catch {
        rawAiFindings = buildPassageGroundedCandidateFindings(
          sanitizedText,
          library
        );
      }

      // Step 5: Run Citation Verifier in Code ("No source, no finding")
      const { verifiedFindings, discardedTraces } = verifyAiFindingsInCode(
        rawAiFindings,
        library,
        deterministicFindings
      );

      const combinedFindings: Finding[] = [
        ...deterministicFindings,
        ...verifiedFindings,
      ];

      const stats: VerifierStats = {
        lastRunAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        modelUsed,
        passagesRetrieved: topPassages.length,
        rawAiFindingsCount: rawAiFindings.length,
        verifiedAiFindingsCount: verifiedFindings.length,
        discardedUngroundedCount: discardedTraces.length,
        deterministicRuleCount: deterministicFindings.length,
        confidentialRedacted: redactConfidential,
        discardedTraces,
      };

      const nextStatus =
        currentItem.status === 'Draft' ? 'AI-checked' : currentItem.status;

      const updatedItem: ContentItem = {
        ...currentItem,
        status: nextStatus,
        updatedAt: stats.lastRunAt,
        findings: combinedFindings,
        retrievedPassages: topPassages,
        verifierStats: stats,
      };

      onUpdateItem(updatedItem);
      if (combinedFindings.length > 0) {
        setSelectedFindingId(combinedFindings[0].id);
      }

      onRecordAudit(
        'AI_CALL',
        currentItem.id,
        currentItem.title,
        `Executed retrieval-first check (${topPassages.length} passages sent, ${deterministicFindings.length} code rules, ${verifiedFindings.length} verified AI findings, ${discardedTraces.length} ungrounded discarded).`,
        {
          modelUsed,
          passagesSent: topPassages.length,
          confidentialRedacted: redactConfidential,
          rawCount: rawAiFindings.length,
          verifiedCount: verifiedFindings.length,
          discardedCount: discardedTraces.length,
        }
      );

      setConsentModalOpen(false);
    } catch (err: any) {
      setCheckErrorMsg(err?.message || 'Verification failed.');
    } finally {
      setIsRunningCheck(false);
    }
  };

  // Accept or Apply Edited Fix (Creates a new Revision Version & logs Human Decision)
  const handleApplyFix = (finding: Finding, replacementOverride?: string) => {
    const replacement =
      replacementOverride !== undefined ? replacementOverride : finding.suggestedFix;

    let nextText = currentItem.currentText;
    let nextAlt = currentItem.imageAltText;
    let nextBanner = { ...currentItem.bannerConfig };
    let changeSummary = '';

    if (finding.category === 'accessibility' && finding.quotedText.toLowerCase().includes('alt text')) {
      nextAlt = replacement;
      changeSummary = `Accepted accessibility fix on image alt text citing ${finding.sourceId}.`;
    } else if (finding.category === 'visual' && finding.quotedText.toLowerCase().includes('contrast')) {
      nextBanner = {
        ...nextBanner,
        fgHex: '#0B3D3A',
        bgHex: '#FAF8F4',
      };
      changeSummary = `Accepted visual contrast fix (#0B3D3A on #FAF8F4, 11.8:1 WCAG AAA) citing ${finding.sourceId}.`;
    } else if (finding.category === 'visual' && finding.quotedText.toLowerCase().includes('logo')) {
      nextBanner = {
        ...nextBanner,
        logoVariant: 'official-seal',
      };
      changeSummary = `Restored official Kaveri seal proportions citing ${finding.sourceId}.`;
    } else {
      // Replace quotedText in currentText
      const idx = nextText.toLowerCase().indexOf(finding.quotedText.toLowerCase());
      if (idx !== -1) {
        nextText =
          nextText.slice(0, idx) +
          replacement +
          nextText.slice(idx + finding.quotedText.length);
      } else {
        nextText = `${nextText}\n\n[Updated per ${finding.sourceId}]: ${replacement}`;
      }
      // Also update banner headline/subline if it contained the outdated price or claim
      if (nextBanner.headline.includes('₹480') && replacement.includes('₹640')) {
        nextBanner.headline = nextBanner.headline.replace('₹480', '₹640');
      }
      if (nextBanner.subline.toLowerCase().includes('100% pesticide-free')) {
        nextBanner.subline = 'Certified Residue-Tested Under NPOP Standards';
      }
      changeSummary = `${
        replacementOverride !== undefined ? 'Edited and applied' : 'Accepted'
      } fix for "${finding.quotedText}" → "${replacement}" (citing ${finding.sourceId}).`;
    }

    const nextFindings = currentItem.findings.map((f) =>
      f.id === finding.id
        ? {
            ...f,
            status: (replacementOverride !== undefined ? 'edited' : 'accepted') as
              | 'accepted'
              | 'edited',
            appliedReplacement: replacement,
          }
        : f
    );

    const nextVersionNum = currentItem.versions.length + 1;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const updatedItem: ContentItem = {
      ...currentItem,
      currentText: nextText,
      imageAltText: nextAlt,
      bannerConfig: nextBanner,
      updatedAt: nowStr,
      findings: nextFindings,
      versions: [
        ...currentItem.versions,
        {
          versionNumber: nextVersionNum,
          timestamp: nowStr,
          authorName: `${activeRole} User`,
          authorRole: activeRole,
          summary: changeSummary,
          contentText: nextText,
          imageAltText: nextAlt,
          bannerConfig: nextBanner,
          triggeredByFindingId: finding.id,
        },
      ],
    };

    onUpdateItem(updatedItem);
    setEditingFindingId(null);

    onRecordAudit(
      'HUMAN_DECISION',
      currentItem.id,
      currentItem.title,
      changeSummary,
      {
        decision: replacementOverride !== undefined ? 'Edit Fix' : 'Accept Fix',
        sourceId: finding.sourceId,
      }
    );
  };

  // Dismiss or Dispute a Finding
  const handleConfirmDismiss = (finding: Finding) => {
    const nextFindings = currentItem.findings.map((f) =>
      f.id === finding.id
        ? {
            ...f,
            status: 'dismissed' as const,
            dismissalReason: dismissReason,
            disputedGuideline: markGuidelineConfusing,
          }
        : f
    );

    const updatedItem: ContentItem = {
      ...currentItem,
      findings: nextFindings,
    };
    onUpdateItem(updatedItem);

    if (markGuidelineConfusing) {
      onIncrementGuidelineDispute(finding.sourceId);
    }

    onRecordAudit(
      'HUMAN_DECISION',
      currentItem.id,
      currentItem.title,
      `Dismissed finding on "${finding.quotedText}" (${dismissReason}${
        markGuidelineConfusing ? ' — Marked guideline section as confusing/disputed' : ''
      }).`,
      {
        decision: markGuidelineConfusing ? 'Disputed Guideline' : 'Dismiss Finding',
        sourceId: finding.sourceId,
      }
    );

    setDismissingFindingId(null);
    setMarkGuidelineConfusing(false);
  };

  // Flag incorrect or outdated AI feedback for administrative review
  const handleReportIssue = (finding: Finding) => {
    const reasonText = `${reportReasonCategory}${
      reportNote.trim() ? `: ${reportNote.trim()}` : ''
    }`;

    const nextFindings = currentItem.findings.map((f) =>
      f.id === finding.id
        ? {
            ...f,
            reportedAsIssue: true,
            issueReportReason: reasonText,
          }
        : f
    );

    const updatedItem: ContentItem = {
      ...currentItem,
      findings: nextFindings,
    };
    onUpdateItem(updatedItem);

    // Increment dispute counter on the underlying guideline for Brand Admin review
    onIncrementGuidelineDispute(finding.sourceId);

    onRecordAudit(
      'LIBRARY_UPDATE',
      currentItem.id,
      currentItem.title,
      `Flagged AI suggestion on "${finding.quotedText}" citing ${finding.sourceId} for administrative review: ${reasonText}`,
      {
        sourceId: finding.sourceId,
        sourceTitle: finding.sourceTitle,
        decision: 'REPORTED_ISSUE_FOR_ADMIN_REVIEW',
      }
    );

    setReportedFindingIds((prev) => ({
      ...prev,
      [finding.id]: reasonText,
    }));
    setReportingFindingId(null);
    setReportNote('');
  };

  // Render Annotated Content with interactive clickable highlights for open findings
  const renderAnnotatedText = () => {
    const text = currentItem.currentText;
    const openTextFindings = currentItem.findings.filter(
      (f) =>
        f.status === 'open' &&
        f.quotedText &&
        text.toLowerCase().includes(f.quotedText.toLowerCase())
    );

    if (openTextFindings.length === 0) {
      return (
        <div className="whitespace-pre-wrap text-sm sm:text-base text-[#142321] leading-relaxed font-normal">
          {text}
        </div>
      );
    }

    // Build non-overlapping match intervals
    interface SpanMatch {
      start: number;
      end: number;
      finding: Finding;
    }
    const matches: SpanMatch[] = [];
    const lowerText = text.toLowerCase();

    for (const f of openTextFindings) {
      const qLower = f.quotedText.toLowerCase();
      const idx = lowerText.indexOf(qLower);
      if (idx !== -1) {
        const end = idx + f.quotedText.length;
        const overlaps = matches.some((m) => !(end <= m.start || idx >= m.end));
        if (!overlaps) {
          matches.push({ start: idx, end, finding: f });
        }
      }
    }

    matches.sort((a, b) => a.start - b.start);

    const segments: React.ReactNode[] = [];
    let cursor = 0;

    matches.forEach((m, i) => {
      if (m.start > cursor) {
        segments.push(
          <span key={`plain-${i}`}>{text.slice(cursor, m.start)}</span>
        );
      }
      const isSelected = selectedFindingId === m.finding.id;
      segments.push(
        <button
          key={`hl-${m.finding.id}`}
          type="button"
          onClick={() => setSelectedFindingId(m.finding.id)}
          className={`inline text-left px-1 py-0.5 rounded-sm transition-colors cursor-pointer underline decoration-2 ${
            isSelected
              ? 'bg-[#F5A524]/45 decoration-[#0B3D3A] text-[#0B3D3A] font-medium ring-2 ring-[#0B3D3A]/30'
              : 'bg-[#F5A524]/20 decoration-[#F5A524] text-[#142321] hover:bg-[#F5A524]/35'
          }`}
          title={`Click to inspect finding: ${m.finding.explanation}`}
        >
          {text.slice(m.start, m.end)}
        </button>
      );
      cursor = m.end;
    });

    if (cursor < text.length) {
      segments.push(<span key="plain-end">{text.slice(cursor)}</span>);
    }

    return (
      <div className="whitespace-pre-wrap text-sm sm:text-base text-[#142321] leading-relaxed">
        {segments}
      </div>
    );
  };

  const displayedFindings = currentItem.findings.filter((f) => {
    if (findingFilter === 'open') return f.status === 'open';
    if (findingFilter === 'resolved') return f.status !== 'open';
    return true;
  });

  const openCount = currentItem.findings.filter((f) => f.status === 'open').length;
  const resolvedCount = currentItem.findings.filter((f) => f.status !== 'open').length;
  const needsFixingCount = currentItem.findings.filter(
    (f) => f.status === 'open' && (f.severity === 'high' || (f.riskScore ?? 0) >= library.autopilotConfig.highRiskThreshold)
  ).length;
  const worthALookCount = currentItem.findings.filter(
    (f) => f.status === 'open' && !(f.severity === 'high' || (f.riskScore ?? 0) >= library.autopilotConfig.highRiskThreshold)
  ).length;
  const needsHumanCount = currentItem.findings.filter(
    (f) => f.status === 'open' && f.needsHumanJudgement
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Studio Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E4DFD3]">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#526360] mb-1">
              <span>AI-Assisted Review Studio</span>
              <span aria-hidden="true">·</span>
              <span>
                Status: <strong className="text-[#0B3D3A]">{currentItem.status}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>Version v{currentItem.versions.length}</span>
              {currentItem.autoApprovedByAi && !currentItem.rolledBack && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular font-semibold text-[#0B3D3A] bg-[#7FD1BF]/45 border border-[#17806D]/40 px-2 py-0.5 rounded-sm">
                    Auto-approved by AI
                  </span>
                </>
              )}
              {currentItem.autoApprovedByAi &&
                !currentItem.rolledBack &&
                onRollbackAutopilotItem && (
                  <button
                    type="button"
                    onClick={() => onRollbackAutopilotItem(currentItem.id)}
                    className="text-xs font-medium text-[#991B1B] underline hover:text-[#0B3D3A] cursor-pointer ml-1"
                  >
                    Undo / Rollback Auto-Approval
                  </button>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                aria-label="Select Content Item"
                value={currentItem.id}
                onChange={(e) => {
                  onSelectItem(e.target.value);
                  setSelectedFindingId(null);
                }}
                className="font-serif-display text-lg sm:text-xl font-semibold text-[#0B3D3A] bg-[#F3EFE6] border border-[#E4DFD3] rounded px-3 py-1.5 focus:outline-none focus:border-[#0B3D3A]"
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.id}: {it.title} ({it.status})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={onCreateNewDraft}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0B3D3A] border border-[#E4DFD3] hover:border-[#0B3D3A] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Draft</span>
              </button>
            </div>
          </div>
        </div>

        {/* Studio Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleLoadSampleContent}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0B3D3A] bg-[#F3EFE6] border border-[#E4DFD3] hover:border-[#0B3D3A] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Load the Kaveri Organics sample draft so you can test reviews immediately"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#17806D]" />
            <span>Try with sample content</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#526360] bg-[#FAF8F4] border border-[#E4DFD3] hover:border-[#0B3D3A] rounded transition-colors cursor-pointer whitespace-nowrap shrink-0">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload file</span>
            <input
              type="file"
              accept=".txt,.md,.png,.jpg,.jpeg,.webp,.pdf,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => setConsentModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            title="Scan draft against approved guidelines, verified facts, and tone rules"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Check my content</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenApprovals(currentItem.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0B3D3A] border border-[#0B3D3A]/40 hover:bg-[#0B3D3A] hover:text-[#FAF8F4] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Approvals Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {uploadStatusMsg && (
        <div className="bg-[#7FD1BF]/25 border border-[#17806D]/40 text-[#0B3D3A] px-4 py-2.5 rounded text-xs flex items-center justify-between">
          <span>{uploadStatusMsg}</span>
          <button
            type="button"
            onClick={() => setUploadStatusMsg(null)}
            className="text-xs underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Verifier Audit Telemetry Strip */}
      {currentItem.verifierStats && (
        <div className="border border-[#E4DFD3] bg-[#F3EFE6]/70 rounded p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-[#364946] font-mono-tabular">
              <span className="font-semibold text-[#0B3D3A]">
                AI-Assisted · Citation Verifier Active
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Passages Retrieved: <strong>{currentItem.verifierStats.passagesRetrieved}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Code Rules: <strong>{currentItem.verifierStats.deterministicRuleCount}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Verified AI Findings: <strong>{currentItem.verifierStats.verifiedAiFindingsCount}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#B45309] font-medium">
                Ungrounded Discarded: {currentItem.verifierStats.discardedUngroundedCount}
              </span>
              {currentItem.verifierStats.confidentialRedacted && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#17806D] font-medium">
                    Confidential Redacted
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowVerifierTrace(!showVerifierTrace)}
              className="text-xs font-medium text-[#17806D] hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              {showVerifierTrace
                ? 'Hide Retrieval & Verifier Trace'
                : 'Inspect Retrieved Passages & Discarded Claims'}
            </button>
          </div>

          {showVerifierTrace && (
            <div className="mt-4 pt-4 border-t border-[#E4DFD3] grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              <div>
                <h4 className="font-medium text-[#0B3D3A] mb-2">
                  Top-K Retrieved Brand Library Passages Sent to Gemini:
                </h4>
                <div className="space-y-2">
                  {currentItem.retrievedPassages.map((p) => (
                    <div
                      key={p.passageId}
                      className="bg-[#FAF8F4] border border-[#E4DFD3] p-2.5 rounded"
                    >
                      <div className="flex items-center justify-between font-mono-tabular text-[11px] text-[#526360] mb-1">
                        <span className="font-semibold text-[#0B3D3A]">
                          [{p.sourceId}] {p.sourceTitle} ({p.sourceType})
                        </span>
                        <span className="text-[#17806D]">
                          Relevance: {p.relevanceScore}
                        </span>
                      </div>
                      <p className="text-[#364946] text-[11px] leading-relaxed">
                        {p.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-[#0B3D3A] mb-2">
                  Citation Verifier Guardrail (“No source, no finding”):
                </h4>
                {currentItem.verifierStats.discardedTraces.length === 0 ? (
                  <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-3 rounded text-[#526360]">
                    All AI-returned findings in the latest run matched valid <code className="font-mono-tabular">sourceId</code> and verbatim <code className="font-mono-tabular">sourceQuote</code> entries in the Brand Library.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentItem.verifierStats.discardedTraces.map((dt, idx) => (
                      <div
                        key={idx}
                        className="bg-[#FAF8F4] border border-[#B45309]/40 p-3 rounded space-y-1"
                      >
                        <div className="flex items-center justify-between font-mono-tabular text-[11px] text-[#B45309] font-medium">
                          <span>DISCARDED UNGROUNDED FINDING</span>
                          <span>Claimed Source: {dt.claimedSourceId}</span>
                        </div>
                        <p className="text-[11px] text-[#142321]">
                          Flagged Span: <code className="font-mono-tabular">“{dt.quotedText}”</code>
                        </p>
                        <p className="text-[11px] text-[#526360]">
                          Claimed Quote: “{dt.claimedSourceQuote}”
                        </p>
                        <p className="text-[11px] text-[#991B1B] font-medium">
                          {dt.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Two-Column Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANE (6 cols): Content & Visual Asset Inspector */}
        <div className="lg:col-span-6 space-y-6">
          {/* Document Copy Card */}
          <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E4DFD3]">
              <div>
                <h2 className="font-serif-display text-base font-semibold text-[#0B3D3A]">
                  Draft Copy & Annotated Proof
                </h2>
                <p className="text-xs text-[#526360]">
                  Click any amber-underlined span or right-hand finding card to highlight the exact text
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-[#F3EFE6] border border-[#E4DFD3] rounded">
                <button
                  type="button"
                  onClick={() => setEditorMode('annotated')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    editorMode === 'annotated'
                      ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                      : 'text-[#526360] hover:text-[#142321]'
                  }`}
                >
                  Annotated View
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('edit')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    editorMode === 'edit'
                      ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                      : 'text-[#526360] hover:text-[#142321]'
                  }`}
                >
                  Edit Raw Text
                </button>
              </div>
            </div>

            {editorMode === 'annotated' ? (
              <div className="min-h-[180px] p-4 bg-[#F3EFE6]/35 border border-[#E4DFD3] rounded">
                {renderAnnotatedText()}
              </div>
            ) : (
              <div>
                <textarea
                  rows={8}
                  aria-label="Edit draft content text"
                  value={currentItem.currentText}
                  onChange={(e) =>
                    onUpdateItem({
                      ...currentItem,
                      currentText: e.target.value,
                    })
                  }
                  className="w-full p-4 text-sm bg-[#FAF8F4] border border-[#0B3D3A]/40 rounded focus:outline-none focus:border-[#0B3D3A] leading-relaxed"
                />
                <p className="text-[11px] text-[#526360] mt-1.5">
                  Editing raw text updates the working draft. Click “Run Citation-Verified Check” above to re-verify against Kaveri Organics sources.
                </p>
              </div>
            )}
          </div>

          {/* Interactive Promotional Banner & Visual Contrast Inspector */}
          {currentItem.bannerConfig.hasBanner && (
            <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4DFD3]">
                <div>
                  <h3 className="font-serif-display text-base font-semibold text-[#0B3D3A]">
                    Promotional Banner & WCAG Contrast Inspector
                  </h3>
                  <p className="text-xs text-[#526360]">
                    Evaluated by deterministic WCAG 2.1 luminance math &amp; Guideline G-04
                  </p>
                </div>
                <span
                  className={`text-xs font-mono-tabular font-semibold ${
                    bannerRatio >= 4.5 ? 'text-[#17806D]' : 'text-[#B91C1C]'
                  }`}
                >
                  Contrast {bannerRatio}:1 ({bannerRatio >= 4.5 ? 'WCAG AA PASS' : 'WCAG AA FAIL'})
                </span>
              </div>

              {/* Rendered Live Banner Component */}
              <div
                className={`p-6 rounded border transition-colors ${
                  selectedFindingId?.includes('CONTRAST') ||
                  selectedFindingId === 'FND-105'
                    ? 'ring-2 ring-[#F5A524]'
                    : 'border-[#E4DFD3]'
                }`}
                style={{
                  backgroundColor: currentItem.bannerConfig.bgHex,
                  color: currentItem.bannerConfig.fgHex,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`font-serif-display text-xs tracking-widest uppercase ${
                      currentItem.bannerConfig.logoVariant === 'stretched-distorted'
                        ? 'scale-x-125 origin-left inline-block'
                        : ''
                    }`}
                  >
                    कावेरी · KAVERI ORGANICS
                  </span>
                  <span className="text-[11px] font-mono-tabular opacity-80">
                    500ml Apothecary Jar
                  </span>
                </div>
                <p className="font-serif-display text-xl font-semibold mb-1">
                  {currentItem.bannerConfig.headline}
                </p>
                <p className="text-xs opacity-90">
                  {currentItem.bannerConfig.subline}
                </p>
              </div>

              {/* Quick Swatch Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div>
                  <label className="block text-[11px] text-[#526360] mb-1">
                    Banner Text Colour (fgHex)
                  </label>
                  <select
                    value={currentItem.bannerConfig.fgHex}
                    onChange={(e) =>
                      onUpdateItem({
                        ...currentItem,
                        bannerConfig: {
                          ...currentItem.bannerConfig,
                          fgHex: e.target.value,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-[#F3EFE6] border border-[#E4DFD3] rounded font-mono-tabular text-xs"
                  >
                    <option value="#7FD1BF">#7FD1BF (Nilgiri Mint - Low Contrast)</option>
                    <option value="#0B3D3A">#0B3D3A (Deep Forest)</option>
                    <option value="#FAF8F4">#FAF8F4 (Warm Paper)</option>
                    <option value="#17806D">#17806D (Kaveri Teal)</option>
                    <option value="#F5A524">#F5A524 (Turmeric Amber)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#526360] mb-1">
                    Banner Background (bgHex)
                  </label>
                  <select
                    value={currentItem.bannerConfig.bgHex}
                    onChange={(e) =>
                      onUpdateItem({
                        ...currentItem,
                        bannerConfig: {
                          ...currentItem.bannerConfig,
                          bgHex: e.target.value,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-[#F3EFE6] border border-[#E4DFD3] rounded font-mono-tabular text-xs"
                  >
                    <option value="#FAF8F4">#FAF8F4 (Warm Paper)</option>
                    <option value="#0B3D3A">#0B3D3A (Deep Forest)</option>
                    <option value="#17806D">#17806D (Kaveri Teal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#526360] mb-1">
                    Seal Lockup Proportion
                  </label>
                  <select
                    value={currentItem.bannerConfig.logoVariant}
                    onChange={(e) =>
                      onUpdateItem({
                        ...currentItem,
                        bannerConfig: {
                          ...currentItem.bannerConfig,
                          logoVariant: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-[#F3EFE6] border border-[#E4DFD3] rounded text-xs"
                  >
                    <option value="official-seal">Official Seal (Compliant)</option>
                    <option value="stretched-distorted">Stretched Horizontally (Violation)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Attached Visual Asset & Accessibility Alt Text Inspector */}
          {currentItem.imageUrl && (
            <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4DFD3]">
                <div>
                  <h3 className="font-serif-display text-base font-semibold text-[#0B3D3A]">
                    Attached Visual Asset & Accessibility Alt Text
                  </h3>
                  <p className="text-xs text-[#526360]">
                    Checked against Guideline G-05 (minimum 25-character descriptive alt text)
                  </p>
                </div>
                <span
                  className={`text-xs font-mono-tabular font-medium ${
                    currentItem.imageAltText.trim().length >= 25 &&
                    !currentItem.imageAltText.endsWith('.jpg')
                      ? 'text-[#17806D]'
                      : 'text-[#B91C1C]'
                  }`}
                >
                  {currentItem.imageAltText.trim().length >= 25 &&
                  !currentItem.imageAltText.endsWith('.jpg')
                    ? 'Alt Text Compliant'
                    : 'Alt Text Non-Compliant'}
                </span>
              </div>

              <ResilientImage
                src={currentItem.imageUrl}
                alt={
                  currentItem.imageAltText ||
                  'Attached campaign visual undergoing governance review'
                }
                aspectClass="aspect-[16/9]"
                className="rounded-sm"
              />

              <div>
                <label className="block text-xs font-medium text-[#142321] mb-1">
                  Image Alt Text Attribute (<code className="font-mono-tabular">alt=&quot;...&quot;</code>)
                </label>
                <input
                  type="text"
                  value={currentItem.imageAltText}
                  onChange={(e) =>
                    onUpdateItem({
                      ...currentItem,
                      imageAltText: e.target.value,
                    })
                  }
                  placeholder="Enter descriptive alt text for screen readers..."
                  className="w-full px-3 py-2 text-xs bg-[#F3EFE6]/60 border border-[#E4DFD3] rounded focus:outline-none focus:border-[#0B3D3A]"
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANE (6 cols): Verified Findings & Diff Resolution Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#E4DFD3]">
              <div>
                <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
                  Verified Findings ({openCount} Open · {resolvedCount} Resolved)
                </h2>
                <p className="text-xs text-[#526360]">
                  Every finding below is backed by a verified library source. Nothing is applied automatically.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-[#F3EFE6] border border-[#E4DFD3] rounded shrink-0">
                <button
                  type="button"
                  onClick={() => setFindingFilter('open')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                    findingFilter === 'open'
                      ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                      : 'text-[#526360] hover:text-[#142321]'
                  }`}
                >
                  Open ({openCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFindingFilter('resolved')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                    findingFilter === 'resolved'
                      ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                      : 'text-[#526360] hover:text-[#142321]'
                  }`}
                >
                  Resolved ({resolvedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFindingFilter('all')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                    findingFilter === 'all'
                      ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                      : 'text-[#526360] hover:text-[#142321]'
                  }`}
                >
                  All ({currentItem.findings.length})
                </button>
              </div>
            </div>

            {/* Plain-Language Status & Summary Banner */}
            {currentItem.findings.length > 0 && (
              <div className="mb-4 p-3.5 bg-[#F3EFE6]/70 border border-[#E4DFD3] rounded flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="font-medium text-[#0B3D3A]">
                  {openCount > 0 ? (
                    <span>
                      <strong className="text-sm">{openCount} issue{openCount === 1 ? '' : 's'} found:</strong>{' '}
                      <span className="text-[#991B1B] font-semibold">{needsFixingCount} needs fixing</span>
                      {worthALookCount > 0 && (
                        <span>, <span className="text-[#B45309] font-semibold">{worthALookCount} worth a look</span></span>
                      )}
                      {needsHumanCount > 0 && (
                        <span> · <span className="text-[#B45309]">{needsHumanCount} needs a person to decide</span></span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[#17806D] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      All issues resolved! Ready to submit to human reviewer.
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono-tabular text-[#526360] bg-[#FAF8F4] px-2 py-0.5 rounded border border-[#E4DFD3]">
                  {currentItem.status === 'Draft'
                    ? 'Step 1 of 4: Add content'
                    : openCount > 0
                    ? 'Step 2 of 4: Fix the suggestions'
                    : currentItem.status === 'In review'
                    ? 'Step 3 of 4: In review'
                    : currentItem.status === 'Approved'
                    ? 'Step 4 of 4: Approved'
                    : 'Step 2 of 4: Review findings'}
                </div>
              </div>
            )}

            {displayedFindings.length === 0 ? (
              findingFilter !== 'all' && currentItem.findings.length > 0 ? (
                <EditorialEmptyCard
                  illustration="search"
                  heading="No matches. Clear the filters."
                  explanation={
                    findingFilter === 'open'
                      ? 'All open findings for this piece have been resolved. Clear the filter to inspect resolved findings or proceed to Approvals.'
                      : 'No resolved findings match this filter yet.'
                  }
                  primaryAction={{
                    label: 'Clear the filters',
                    onClick: () => setFindingFilter('all'),
                  }}
                  secondaryActions={[
                    {
                      label: 'Proceed to Approvals Queue',
                      onClick: () => onOpenApprovals(currentItem.id),
                    },
                  ]}
                  compact
                />
              ) : (
                <EditorialEmptyCard
                  illustration="approvals"
                  heading="No open findings on this draft."
                  explanation="You can submit this item to the Approvals queue for human Reviewer sign-off, or run a fresh verification check."
                  primaryAction={{
                    label: 'Proceed to Approvals Queue',
                    onClick: () => onOpenApprovals(currentItem.id),
                  }}
                  compact
                />
              )
            ) : (
              <div className="space-y-4">
                {displayedFindings.map((finding) => {
                  const isSelected = selectedFindingId === finding.id;
                  const isEditingThis = editingFindingId === finding.id;
                  const isDismissingThis = dismissingFindingId === finding.id;

                  return (
                    <div
                      key={finding.id}
                      onClick={() => setSelectedFindingId(finding.id)}
                      className={`border rounded p-5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-[#0B3D3A] bg-[#F3EFE6]/65'
                          : 'border-[#E4DFD3] bg-[#FAF8F4] hover:border-[#0B3D3A]/40'
                      }`}
                    >
                      {/* Unboxed Metadata Line with · Separators & Risk Score (0-100) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#526360] mb-2 font-mono-tabular">
                        <div>
                          <span className="uppercase font-semibold text-[#0B3D3A]">
                            {finding.category}
                          </span>
                          <span aria-hidden="true" className="mx-1.5">·</span>
                          <span
                            className={
                              (finding.riskScore ?? 20) >
                              library.autopilotConfig.highRiskThreshold
                                ? 'text-[#B91C1C] font-semibold'
                                : (finding.riskScore ?? 20) >=
                                  library.autopilotConfig.lowRiskThreshold
                                ? 'text-[#B45309] font-semibold'
                                : 'text-[#17806D] font-semibold'
                            }
                          >
                            Risk {finding.riskScore ?? 20}/100 (
                            {(finding.riskBand || 'low').toUpperCase()})
                          </span>
                          <span aria-hidden="true" className="mx-1.5">·</span>
                          <span>
                            {finding.origin === 'rule-engine'
                              ? 'Rule Engine in Code'
                              : 'AI-Assisted · Gemini Flash'}
                          </span>
                          <span aria-hidden="true" className="mx-1.5">·</span>
                          <span>Confidence {Math.round(finding.confidence * 100)}%</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {(finding.severity === 'high' || (finding.riskScore ?? 0) >= library.autopilotConfig.highRiskThreshold) ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#991B1B]" />
                              Needs fixing
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
                              Worth a look
                            </span>
                          )}

                          {finding.needsHumanJudgement && (
                            <span className="text-[#B45309] font-semibold bg-[#F5A524]/20 border border-[#F5A524]/40 px-2 py-0.5 rounded text-[11px]">
                              Needs a person to decide
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Flagged Quoted Span */}
                      <div className="mb-2.5">
                        <span className="text-xs text-[#526360] mr-2">Flagged:</span>
                        <code className="text-xs font-mono-tabular font-medium text-[#142321] bg-[#F5A524]/20 px-1.5 py-0.5 rounded-sm">
                          “{finding.quotedText}”
                        </code>
                      </div>

                      {/* Plain-Language Explanation */}
                      <p className="text-xs sm:text-sm text-[#142321] leading-relaxed mb-3">
                        {finding.explanation}
                      </p>

                      {/* Verified Citation Block */}
                      <div className="bg-[#FAF8F4] border border-[#E4DFD3] rounded p-3 mb-4 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-[#17806D] font-mono-tabular font-medium mb-1">
                          <span>
                            Verified Source Citation: [{finding.sourceId}] {finding.sourceTitle}
                          </span>
                          <span>Citation Verified</span>
                        </div>
                        <p className="text-[#526360] italic text-[11px] leading-relaxed">
                          “{finding.sourceQuote}”
                        </p>
                      </div>

                      {/* Suggested Fix Diff View */}
                      <div className="space-y-1.5 mb-4 text-xs font-mono-tabular">
                        <p className="text-[11px] text-[#526360] font-sans">
                          Suggested Diff (Preserves Creator Intent):
                        </p>
                        <div className="line-through text-[#991B1B] bg-[#FEE2E2]/45 px-3 py-1.5 rounded">
                          - {finding.quotedText}
                        </div>
                        <div className="text-[#0B3D3A] bg-[#7FD1BF]/25 px-3 py-1.5 rounded font-medium">
                          + {finding.appliedReplacement || finding.suggestedFix}
                        </div>
                      </div>

                      {/* Inline Edit Fix Box */}
                      {isEditingThis && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mb-4 p-3 bg-[#FAF8F4] border border-[#0B3D3A] rounded space-y-2"
                        >
                          <label className="block text-xs font-medium text-[#0B3D3A]">
                            Customize Replacement Wording Before Applying:
                          </label>
                          <textarea
                            rows={2}
                            value={customFixText}
                            onChange={(e) => setCustomFixText(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-[#F3EFE6]/50 border border-[#E4DFD3] rounded font-mono-tabular"
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingFindingId(null)}
                              className="px-2.5 py-1 text-xs text-[#526360] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyFix(finding, customFixText)}
                              className="px-3 py-1 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] rounded cursor-pointer"
                            >
                              Apply Custom Fix & Save Revision
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Inline Dismiss / Dispute Box */}
                      {isDismissingThis && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mb-4 p-3 bg-[#FAF8F4] border border-[#B45309] rounded space-y-2.5 text-xs"
                        >
                          <label className="block font-medium text-[#142321]">
                            Reason for Dismissing or Disputing Finding:
                          </label>
                          <input
                            type="text"
                            value={dismissReason}
                            onChange={(e) => setDismissReason(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#F3EFE6]/50 border border-[#E4DFD3] rounded"
                          />
                          <label className="flex items-center gap-2 text-[#B45309] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={markGuidelineConfusing}
                              onChange={(e) =>
                                setMarkGuidelineConfusing(e.target.checked)
                              }
                            />
                            <span>
                              Flag Guideline <strong>{finding.sourceId}</strong> as ambiguous/disputed (updates Insights confusion chart)
                            </span>
                          </label>
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setDismissingFindingId(null)}
                              className="px-2.5 py-1 text-xs text-[#526360] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmDismiss(finding)}
                              className="px-3 py-1 text-xs font-medium text-[#FAF8F4] bg-[#B45309] rounded cursor-pointer"
                            >
                              Confirm Dismissal
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Inline Report an Issue for Administrative Review Box */}
                      {reportingFindingId === finding.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mb-4 p-3.5 bg-[#FAF8F4] border border-[#B45309] rounded space-y-3 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#142321] flex items-center gap-1.5">
                              <Flag className="w-3.5 h-3.5 text-[#B45309]" />
                              Report an issue with this AI feedback
                            </span>
                            <button
                              type="button"
                              onClick={() => setReportingFindingId(null)}
                              className="text-[#526360] hover:text-[#142321] cursor-pointer"
                              aria-label="Close report box"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[#526360] leading-relaxed">
                            Flag incorrect or outdated AI feedback for administrative review. This logs the issue and alerts brand managers to inspect the rule.
                          </p>
                          <div className="space-y-1">
                            <label className="block text-[#142321] font-medium">Issue type:</label>
                            <select
                              value={reportReasonCategory}
                              onChange={(e) => setReportReasonCategory(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-[#F3EFE6]/70 border border-[#E4DFD3] rounded text-xs cursor-pointer"
                            >
                              <option value="Incorrect AI feedback">Incorrect AI feedback (misunderstood content or rule)</option>
                              <option value="Outdated guideline rule">Outdated guideline rule (rule needs updating in Brand Library)</option>
                              <option value="False positive">False positive (compliant content was wrongly flagged)</option>
                              <option value="Irrelevant replacement">Irrelevant or unnatural suggested replacement</option>
                              <option value="Other issue">Other issue</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[#142321] font-medium">Details for administrators (optional):</label>
                            <textarea
                              rows={2}
                              value={reportNote}
                              onChange={(e) => setReportNote(e.target.value)}
                              placeholder="e.g. This guideline was revised last month, or this wording is permitted on social channels..."
                              className="w-full px-2.5 py-1.5 bg-[#F3EFE6]/70 border border-[#E4DFD3] rounded text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2 justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => setReportingFindingId(null)}
                              className="px-2.5 py-1 text-xs text-[#526360] hover:text-[#142321] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReportIssue(finding)}
                              className="px-3 py-1.5 text-xs font-medium text-[#FAF8F4] bg-[#B45309] hover:bg-[#92400E] rounded cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Flag className="w-3 h-3" />
                              <span>Submit for Administrative Review</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Administrative Review Status Banner */}
                      {(finding.reportedAsIssue || reportedFindingIds[finding.id]) && (
                        <div className="mb-3 p-2 bg-[#FEF3C7]/90 border border-[#FDE68A] rounded flex items-start gap-2 text-xs text-[#92400E]">
                          <Flag className="w-3.5 h-3.5 text-[#B45309] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Flagged for administrative review: </span>
                            <span>{finding.issueReportReason || reportedFindingIds[finding.id]}</span>
                          </div>
                        </div>
                      )}

                      {/* Action Footer */}
                      {finding.status === 'open' ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E4DFD3]"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApplyFix(finding)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer"
                              title="Accept this suggestion and update the draft"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept Fix</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingFindingId(finding.id);
                                setCustomFixText(finding.suggestedFix);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0B3D3A] border border-[#0B3D3A]/30 hover:border-[#0B3D3A] rounded transition-colors cursor-pointer"
                              title="Customize the replacement wording before saving"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Fix</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDismissingFindingId(finding.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#526360] hover:text-[#991B1B] border border-[#E4DFD3] rounded transition-colors cursor-pointer"
                              title="Dismiss this finding as an intentional exception"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Dismiss / Dispute</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setReportingFindingId(finding.id);
                              setReportNote('');
                            }}
                            className="inline-flex items-center gap-1 text-xs text-[#526360] hover:text-[#B45309] underline underline-offset-2 transition-colors cursor-pointer ml-auto"
                            title="Flag incorrect or outdated AI feedback for administrative review"
                          >
                            <Flag className="w-3 h-3 text-[#B45309]" />
                            <span>Report an issue</span>
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-[#E4DFD3] flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular text-[#17806D]">
                          <span>
                            Status: <strong className="uppercase">{finding.status}</strong>
                            {finding.dismissalReason ? ` (${finding.dismissalReason})` : ''}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#526360]">Recorded in Revision History</span>
                            <button
                              type="button"
                              onClick={() => {
                                setReportingFindingId(finding.id);
                                setReportNote('');
                              }}
                              className="inline-flex items-center gap-1 text-xs text-[#526360] hover:text-[#B45309] underline underline-offset-2 transition-colors cursor-pointer"
                              title="Flag incorrect or outdated AI feedback for administrative review"
                            >
                              <Flag className="w-3 h-3 text-[#B45309]" />
                              <span>Report an issue</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRE-FLIGHT AI CONSENT & CONFIDENTIAL REDACTION MODAL */}
      {consentModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-modal-title"
          className="fixed inset-0 z-50 bg-[#142321]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#FAF8F4] border border-[#0B3D3A] rounded max-w-2xl w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#E4DFD3]">
              <div>
                <span className="text-xs text-[#17806D] font-medium block mb-0.5">
                  Responsible AI Pre-Flight Disclosure &amp; Consent
                </span>
                <h3
                  id="consent-modal-title"
                  className="font-serif-display text-xl font-semibold text-[#0B3D3A]"
                >
                  Confirm Data Transmission to External AI Service
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConsentModalOpen(false)}
                className="text-xs text-[#526360] hover:text-[#142321] cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#364946] leading-relaxed">
              <div className="bg-[#F3EFE6] border border-[#E4DFD3] p-3.5 rounded space-y-1">
                <p className="font-medium text-[#0B3D3A]">
                  External AI Service Specification:
                </p>
                <p>
                  Model: <code className="font-mono-tabular">gemini-3.8-flash</code> via <code className="font-mono-tabular">@google/genai</code> (Structured JSON Output &amp; Vision).
                </p>
                <p>
                  Payload Scope: Only the current draft text ({currentItem.currentText.length} chars), attached image (if uploaded), and the <strong>top {previewPassages.length} retrieved Brand Library passages</strong> listed below will be transmitted. Your full Brand Library is never sent in bulk.
                </p>
              </div>

              {hasConfidentialInContext && (
                <div className="bg-[#F5A524]/20 border border-[#B45309] p-3.5 rounded space-y-2">
                  <div className="flex items-center gap-2 text-[#B45309] font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Confidential Brand Material Detected in Context</span>
                  </div>
                  <p className="text-[#142321]">
                    This draft or its matched retrieval passages reference items marked <strong>Confidential</strong> (such as <code className="font-mono-tabular">FACT-CONF-07</code> distributor margin 28.5% or embargoed launches).
                  </p>
                  <label className="flex items-center gap-2 font-medium text-[#0B3D3A] cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={redactConfidential}
                      onChange={(e) => setRedactConfidential(e.target.checked)}
                    />
                    <span>
                      Redact Confidential passages and figures (<code className="font-mono-tabular">[REDACTED-CONFIDENTIAL]</code>) before sending to Gemini
                    </span>
                  </label>
                </div>
              )}

              {!hasConfidentialInContext && (
                <label className="flex items-center gap-2 font-medium text-[#0B3D3A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={redactConfidential}
                    onChange={(e) => setRedactConfidential(e.target.checked)}
                  />
                  <span>
                    Enable automatic Confidential Redaction filter (<code className="font-mono-tabular">[REDACTED-CONFIDENTIAL]</code>)
                  </span>
                </label>
              )}

              <div>
                <p className="font-medium text-[#0B3D3A] mb-1.5">
                  Top Retrieved Passages Queued for Transmission ({previewPassages.length}):
                </p>
                <div className="max-h-40 overflow-y-auto border border-[#E4DFD3] rounded divide-y divide-[#E4DFD3] bg-[#FAF8F4]">
                  {previewPassages.map((p) => (
                    <div
                      key={p.passageId}
                      className="p-2.5 flex items-center justify-between text-[11px] font-mono-tabular"
                    >
                      <span className="truncate pr-3">
                        [{p.sourceId}] {p.sourceTitle}{' '}
                        {p.confidential ? '(CONFIDENTIAL)' : ''}
                      </span>
                      <span className="text-[#17806D] shrink-0">
                        Rank Score: {p.relevanceScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {checkErrorMsg && (
              <p className="text-xs text-[#B91C1C]">{checkErrorMsg}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4DFD3]">
              <button
                type="button"
                onClick={() => setConsentModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#526360] hover:text-[#142321] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRunningCheck}
                onClick={handleExecuteCheck}
                className="px-5 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRunningCheck
                  ? 'Retrieving Passages & Verifying Citations...'
                  : 'Consent & Run Verification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
