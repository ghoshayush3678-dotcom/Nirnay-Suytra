import React, { useState } from 'react';
import {
  Zap,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  ArrowUpRight,
  FileText,
  Lock,
  Radio,
} from 'lucide-react';
import {
  BrandLibraryState,
  ContentItem,
  FindingCategory,
  UserRole,
  AutopilotMode,
} from '../types';
import { EditorialEmptyCard } from './EditorialEmptyStates';

interface AutopilotDashboardViewProps {
  library: BrandLibraryState;
  items: ContentItem[];
  activeRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  onUpdateAutopilotConfig: (
    nextConfig: BrandLibraryState['autopilotConfig'],
    summary: string
  ) => void;
  onTriggerSimulatedSubmission: (presetType: 'low' | 'medium' | 'high') => void;
  onRollbackAutopilotItem: (itemId: string) => void;
  onOpenInStudio: (itemId: string) => void;
  onOpenInApprovals: (itemId: string) => void;
}

const ALL_CATEGORIES: FindingCategory[] = [
  'claim',
  'messaging',
  'visual',
  'terminology',
  'tone',
  'accessibility',
];

export const AutopilotDashboardView: React.FC<AutopilotDashboardViewProps> = ({
  library,
  items,
  activeRole,
  onSwitchRole,
  onUpdateAutopilotConfig,
  onTriggerSimulatedSubmission,
  onRollbackAutopilotItem,
  onOpenInStudio,
  onOpenInApprovals,
}) => {
  const config = library.autopilotConfig;
  const isAdmin = activeRole === 'Brand Admin';

  const [selectedReportItem, setSelectedReportItem] =
    useState<ContentItem | null>(null);
  const [lastSimulatedMessage, setLastSimulatedMessage] = useState<
    string | null
  >(null);

  const exceptionQueueItems = items.filter((i) => i.escalatedToHuman);
  const autoApprovedItems = items.filter(
    (i) => i.autoApprovedByAi || i.autopilotAction
  );

  const handleModeChange = (mode: AutopilotMode) => {
    if (!isAdmin) return;
    onUpdateAutopilotConfig(
      {
        ...config,
        mode,
        killSwitchPaused: mode === 'Off' ? true : false,
      },
      `Brand Admin set Autopilot mode for ${library.brandName} to "${mode}".`
    );
  };

  const handleToggleKillSwitch = () => {
    const nextPaused = !config.killSwitchPaused;
    onUpdateAutopilotConfig(
      {
        ...config,
        killSwitchPaused: nextPaused,
      },
      nextPaused
        ? `ENGAGED GLOBAL PAUSE AUTOPILOT KILL SWITCH. Automatic remediation and auto-approvals halted immediately.`
        : `Resumed Autopilot pipeline execution.`
    );
  };

  const handleToggleAlwaysEscalate = (cat: FindingCategory) => {
    if (!isAdmin) return;
    const exists = config.alwaysEscalateCategories.includes(cat);
    const nextCats = exists
      ? config.alwaysEscalateCategories.filter((c) => c !== cat)
      : [...config.alwaysEscalateCategories, cat];
    onUpdateAutopilotConfig(
      {
        ...config,
        alwaysEscalateCategories: nextCats,
      },
      `Updated Always-Escalate categories to: [${nextCats.join(', ')}].`
    );
  };

  const handleThresholdChange = (
    field: 'lowRiskThreshold' | 'highRiskThreshold' | 'minMediumConfidence',
    val: number
  ) => {
    if (!isAdmin) return;
    onUpdateAutopilotConfig(
      {
        ...config,
        [field]: val,
      },
      `Updated Autopilot threshold ${field} to ${val}.`
    );
  };

  const runSimulation = (preset: 'low' | 'medium' | 'high') => {
    onTriggerSimulatedSubmission(preset);
    if (config.killSwitchPaused || config.mode === 'Off') {
      setLastSimulatedMessage(
        'Agency submission arrived, but Autopilot is currently Paused/Off. Saved as Draft for manual review.'
      );
    } else if (preset === 'low') {
      setLastSimulatedMessage(
        'Zero-Click Pipeline Complete: Low-risk agency submission (score 22/100 < 30) was automatically remediated, re-checked (0 open issues), and marked Auto-Approved by AI.'
      );
    } else if (preset === 'medium') {
      setLastSimulatedMessage(
        'Zero-Click Pipeline Complete: Medium-risk submission (banner contrast & terminology, score 48/100) was auto-fixed, passed all re-checks with 96% confidence, and marked Auto-Approved by AI.'
      );
    } else {
      setLastSimulatedMessage(
        'Zero-Click Safety Gate Triggered: High-risk agency submission (score 95/100 > 70 — unbacked "guaranteed" claim, legacy price, and confidential margin) was redacted and placed in the Human Exception Queue.'
      );
    }
  };

  const totalHoursSaved = (
    (config.stats.itemsProcessed * config.stats.avgMinutesSavedPerItem) /
    60
  ).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Top Header + Mode Selector + Global Kill Switch */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E4DFD3]">
        <div>
          <div className="text-xs text-[#526360] mb-1">
            <span>{library.brandName}</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Zero-Click Governance & Risk-Scored Automation</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>
              Pipeline Status:{' '}
              <strong
                className={
                  config.killSwitchPaused || config.mode === 'Off'
                    ? 'text-[#B91C1C]'
                    : 'text-[#17806D]'
                }
              >
                {config.killSwitchPaused
                  ? 'PAUSED BY KILL SWITCH'
                  : `${config.mode.toUpperCase()} ACTIVE`}
              </strong>
            </span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
            Autopilot Governance Center
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Per-Brand Mode Switcher (Off / Assisted / Autopilot) */}
          <div className="flex items-center gap-1 p-1 bg-[#F3EFE6] border border-[#E4DFD3] rounded">
            {(['Off', 'Assisted', 'Autopilot'] as AutopilotMode[]).map((m) => {
              const active = config.mode === m && !config.killSwitchPaused;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => handleModeChange(m)}
                  title={
                    isAdmin
                      ? `Set brand governance mode to ${m}`
                      : 'Switch to Brand Admin to change mode'
                  }
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 ${
                    active
                      ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                      : 'text-[#526360] hover:text-[#142321]'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Global Kill Switch (Always accessible as a safety rail) */}
          <button
            type="button"
            onClick={handleToggleKillSwitch}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              config.killSwitchPaused
                ? 'bg-[#17806D] text-[#FAF8F4] border-[#17806D] hover:bg-[#0B3D3A]'
                : 'bg-[#FEE2E2] text-[#991B1B] border-[#991B1B]/40 hover:bg-[#991B1B] hover:text-[#FAF8F4]'
            }`}
          >
            {config.killSwitchPaused ? (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>Resume Autopilot</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-4 h-4" />
                <span>Pause Autopilot (Kill Switch)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 6 Autopilot Telemetry KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded border border-[#E4DFD3] bg-[#FAF8F4]">
          <p className="text-xs text-[#526360] mb-1">Items Processed</p>
          <p className="font-serif-display text-2xl font-semibold text-[#0B3D3A] font-mono-tabular">
            {config.stats.itemsProcessed}
          </p>
          <p className="text-[11px] text-[#526360] mt-0.5">
            Zero-click pipeline runs
          </p>
        </div>

        <div className="p-4 rounded border border-[#E4DFD3] bg-[#FAF8F4]">
          <p className="text-xs text-[#526360] mb-1">Auto-Approved</p>
          <p className="font-serif-display text-2xl font-semibold text-[#17806D] font-mono-tabular">
            {config.stats.autoApproved}
          </p>
          <p className="text-[11px] text-[#17806D] mt-0.5 font-mono-tabular">
            Low &amp; verified Med risk
          </p>
        </div>

        <div className="p-4 rounded border border-[#E4DFD3] bg-[#FAF8F4]">
          <p className="text-xs text-[#526360] mb-1">Escalated to Humans</p>
          <p className="font-serif-display text-2xl font-semibold text-[#B45309] font-mono-tabular">
            {config.stats.escalatedToHumans}
          </p>
          <p className="text-[11px] text-[#B45309] mt-0.5 font-mono-tabular">
            {exceptionQueueItems.length} in active queue
          </p>
        </div>

        <div className="p-4 rounded border border-[#E4DFD3] bg-[#FAF8F4]">
          <p className="text-xs text-[#526360] mb-1">Rolled Back</p>
          <p className="font-serif-display text-2xl font-semibold text-[#991B1B] font-mono-tabular">
            {config.stats.rolledBack}
          </p>
          <p className="text-[11px] text-[#526360] mt-0.5">
            1-click human rollbacks
          </p>
        </div>

        <div className="p-4 rounded border border-[#E4DFD3] bg-[#FAF8F4]">
          <p className="text-xs text-[#526360] mb-1">Avg. Time Saved</p>
          <p className="font-serif-display text-2xl font-semibold text-[#0B3D3A] font-mono-tabular">
            {config.stats.avgMinutesSavedPerItem}m
          </p>
          <p className="text-[11px] text-[#526360] mt-0.5 font-mono-tabular">
            {totalHoursSaved} hrs saved total
          </p>
        </div>

        <div className="p-4 rounded border border-[#0B3D3A]/30 bg-[#F3EFE6]/70">
          <p className="text-xs text-[#0B3D3A] font-medium mb-1">
            Safety Rails
          </p>
          <p className="font-serif-display text-lg font-semibold text-[#0B3D3A] font-mono-tabular">
            4 / 4 Locked
          </p>
          <p className="text-[11px] text-[#17806D] mt-0.5">
            Confidential Redaction ON
          </p>
        </div>
      </div>

      {/* Simulated "Agency Submission" Feed (Zero-Click Ingestion) */}
      <section className="border border-[#0B3D3A] bg-[#F3EFE6]/70 rounded p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E4DFD3]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#17806D] font-medium mb-1">
              <Radio className="w-3.5 h-3.5" />
              <span>Live Agency Submission Feed Simulator · Zero-Click Autopilot Execution</span>
            </div>
            <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
              Simulate Incoming Content Arrival (Runs Automatically Without Human Clicks)
            </h2>
            <p className="text-xs text-[#364946]">
              In Autopilot mode, arriving content is automatically checked, risk-scored (0–100), remediated if Low/Medium risk, re-verified, and either marked <strong>Approved</strong> or routed to the <strong>Human Exception Queue</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => runSimulation('low')}
              className="px-3.5 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer"
            >
              + Simulate Low-Risk Arrival (&lt;{config.lowRiskThreshold})
            </button>
            <button
              type="button"
              onClick={() => runSimulation('medium')}
              className="px-3.5 py-2 text-xs font-medium text-[#0B3D3A] bg-[#FAF8F4] border border-[#0B3D3A] hover:bg-[#0B3D3A] hover:text-[#FAF8F4] rounded transition-colors cursor-pointer"
            >
              + Simulate Medium-Risk Arrival ({config.lowRiskThreshold}–{config.highRiskThreshold})
            </button>
            <button
              type="button"
              onClick={() => runSimulation('high')}
              className="px-3.5 py-2 text-xs font-medium text-[#B45309] bg-[#FAF8F4] border border-[#B45309] hover:bg-[#B45309] hover:text-[#FAF8F4] rounded transition-colors cursor-pointer"
            >
              + Simulate High-Risk Arrival (&gt;{config.highRiskThreshold})
            </button>
          </div>
        </div>

        {lastSimulatedMessage && (
          <div className="bg-[#FAF8F4] border border-[#17806D] p-3.5 rounded flex items-center justify-between gap-4 text-xs text-[#142321]">
            <span>{lastSimulatedMessage}</span>
            <button
              type="button"
              onClick={() => setLastSimulatedMessage(null)}
              className="text-xs text-[#526360] underline shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Risk Scoring Tier Legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-3.5 rounded">
            <div className="flex items-center justify-between font-mono-tabular mb-1">
              <span className="font-semibold text-[#17806D]">
                LOW RISK (Score 0–{config.lowRiskThreshold - 1})
              </span>
              <span>Auto-Fix &amp; Approve</span>
            </div>
            <p className="text-[#526360] text-[11px] leading-relaxed">
              Terminology swaps, tone tweaks, and missing alt text. AI applies the fix, re-runs checks, and marks content <strong>Approved</strong>.
            </p>
          </div>

          <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-3.5 rounded">
            <div className="flex items-center justify-between font-mono-tabular mb-1">
              <span className="font-semibold text-[#0B3D3A]">
                MEDIUM RISK (Score {config.lowRiskThreshold}–{config.highRiskThreshold})
              </span>
              <span>Conditional Gate</span>
            </div>
            <p className="text-[#526360] text-[11px] leading-relaxed">
              AI applies the fix and re-checks; auto-approves <strong>only</strong> if 100% of checks pass and confidence ≥ {Math.round(config.minMediumConfidence * 100)}%. Otherwise escalates.
            </p>
          </div>

          <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-3.5 rounded">
            <div className="flex items-center justify-between font-mono-tabular mb-1">
              <span className="font-semibold text-[#B45309]">
                HIGH RISK (Score &gt;{config.highRiskThreshold})
              </span>
              <span>Always Escalate</span>
            </div>
            <p className="text-[#526360] text-[11px] leading-relaxed">
              Health, legal, price, unbacked “guaranteed” claims, or Confidential material. AI <strong>never</strong> auto-approves; routes to Human Exception Queue.
            </p>
          </div>
        </div>
      </section>

      {/* Main Split: Human Exception Queue (Left 6 cols) + Auto-Approved & Rollback Console (Right 6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: HUMAN EXCEPTION QUEUE */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
                Human Exception Queue ({exceptionQueueItems.length})
              </h2>
              <p className="text-xs text-[#526360]">
                High-risk (&gt;{config.highRiskThreshold}) and unverified medium-risk items blocked from auto-approval
              </p>
            </div>
          </div>

          {exceptionQueueItems.length === 0 ? (
            <EditorialEmptyCard
              illustration="autopilot"
              heading="Nothing needs a human right now. Autopilot handled everything."
              explanation="Every incoming low-risk and verified medium-risk submission passed citation checks automatically without human intervention."
              primaryAction={{
                label: 'Simulate high-risk submission',
                onClick: () => runSimulation('high'),
              }}
              compact
            />
          ) : (
            <div className="space-y-4">
              {exceptionQueueItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-[#B45309]/50 bg-[#FAF8F4] rounded p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-[#526360] font-mono-tabular mb-1">
                        <span className="font-semibold text-[#0B3D3A]">
                          {item.id}
                        </span>
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span>{item.team}</span>
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span className="text-[#B45309] font-semibold">
                          Max Risk Score: {item.maxRiskScore ?? 88}/100 (HIGH RISK)
                        </span>
                      </div>
                      <h3 className="font-serif-display text-base font-semibold text-[#142321]">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenInStudio(item.id)}
                        className="px-3 py-1.5 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer"
                      >
                        Resolve in Studio
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedReportItem(item)}
                        className="px-2.5 py-1.5 text-xs text-[#0B3D3A] border border-[#E4DFD3] hover:border-[#0B3D3A] rounded cursor-pointer"
                      >
                        Report
                      </button>
                    </div>
                  </div>

                  {/* Escalation Reasons */}
                  <div className="bg-[#F5A524]/15 border border-[#B45309]/30 rounded p-3 space-y-1.5 text-xs">
                    <p className="font-semibold text-[#B45309]">
                      Why Autopilot Escalated This Item to Humans:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[#142321] text-[11px] font-mono-tabular">
                      {(item.escalationReasons && item.escalationReasons.length > 0
                        ? item.escalationReasons
                        : item.findings
                            .filter((f) => f.status === 'open')
                            .map(
                              (f) =>
                                `[Risk ${f.riskScore || 80}/100 · ${f.category.toUpperCase()}] "${f.quotedText}" (Source: ${f.sourceId})`
                            )
                      ).map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-[#E4DFD3] flex items-center justify-between text-[11px] text-[#526360] font-mono-tabular">
                    <span>Assigned Human Reviewer: {item.assignedReviewer}</span>
                    <span>Confidential Redaction: Enforced</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AUTO-APPROVED ITEMS, DIFF LEDGER & ONE-CLICK ROLLBACK */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
              Auto-Approved & Remediated Ledger ({autoApprovedItems.length})
            </h2>
            <p className="text-xs text-[#526360]">
              Every automatic change includes a before/after diff, source citation, AI disclosure, and 1-click Undo/Rollback
            </p>
          </div>

          {autoApprovedItems.length === 0 ? (
            <EditorialEmptyCard
              illustration="document"
              heading="No auto-approved items yet."
              explanation="When Autopilot remediates and approves a low-risk or verified medium-risk submission, its before/after diff and one-click rollback appear here."
              primaryAction={{
                label: 'Simulate low-risk arrival',
                onClick: () => runSimulation('low'),
              }}
              compact
            />
          ) : (
          <div className="space-y-4">
            {autoApprovedItems.map((item) => {
              const act = item.autopilotAction;
              return (
                <div
                  key={item.id}
                  className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-5 space-y-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular mb-1">
                        <span className="font-semibold text-[#0B3D3A]">
                          {item.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Max Risk: {item.maxRiskScore ?? 22}/100</span>
                        <span aria-hidden="true">·</span>
                        {item.autoApprovedByAi && !item.rolledBack && (
                          <span className="text-[#0B3D3A] bg-[#7FD1BF]/40 border border-[#17806D]/40 px-2 py-0.5 rounded-sm font-semibold">
                            Auto-approved by AI
                          </span>
                        )}
                        {item.rolledBack && (
                          <span className="text-[#991B1B] bg-[#FEE2E2] px-2 py-0.5 rounded-sm font-semibold">
                            Rolled Back to Pre-Autopilot Draft
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif-display text-base font-semibold text-[#142321]">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {act && !item.rolledBack && act.outcome === 'AUTO_APPROVED' && (
                        <button
                          type="button"
                          onClick={() => onRollbackAutopilotItem(item.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#991B1B] border border-[#991B1B]/40 hover:bg-[#FEE2E2]/60 rounded transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Undo / Rollback</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedReportItem(item)}
                        className="px-2.5 py-1.5 text-xs font-medium text-[#0B3D3A] border border-[#E4DFD3] hover:border-[#0B3D3A] rounded cursor-pointer"
                      >
                        AI Report
                      </button>
                    </div>
                  </div>

                  {act && act.changesApplied.length > 0 && (
                    <div className="space-y-2 bg-[#F3EFE6]/60 border border-[#E4DFD3] rounded p-3 text-xs">
                      <p className="font-medium text-[#0B3D3A]">
                        Automatic Remediations Applied ({act.changesApplied.length}):
                      </p>
                      {act.changesApplied.map((chg, idx) => (
                        <div
                          key={idx}
                          className="bg-[#FAF8F4] border border-[#E4DFD3] p-2.5 rounded space-y-1 font-mono-tabular text-[11px]"
                        >
                          <div className="flex items-center justify-between text-[#526360]">
                            <span>
                              Source: <strong className="text-[#0B3D3A]">[{chg.sourceId}] {chg.sourceTitle}</strong>
                            </span>
                            <span>Risk Score: {chg.riskScore}/100</span>
                          </div>
                          <div className="line-through text-[#991B1B] bg-[#FEE2E2]/40 px-2 py-0.5 rounded">
                            - {chg.beforeSnippet}
                          </div>
                          <div className="text-[#0B3D3A] bg-[#7FD1BF]/25 px-2 py-0.5 rounded font-medium">
                            + {chg.afterSnippet}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mandatory AI-Use Disclosure in Item Card */}
                  <div className="pt-2 border-t border-[#E4DFD3] text-[11px] text-[#526360] leading-relaxed">
                    <strong className="text-[#0B3D3A]">AI-Use Disclosure:</strong>{' '}
                    {act?.aiDisclosureText ||
                      'Processed by Nirnay Sutra Autopilot (Gemini Flash + Deterministic Code Engine). Confidential passages redacted prior to AI call.'}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>

      {/* Brand Admin Thresholds, Always-Escalate Categories & Non-Disableable Safety Rails */}
      <section className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4DFD3]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#17806D] font-medium mb-1">
              <Sliders className="w-3.5 h-3.5" />
              <span>Brand Admin Governance Policy &amp; Safety Rails</span>
            </div>
            <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
              Autopilot Risk Thresholds &amp; Always-Escalate Rules
            </h2>
          </div>

          {!isAdmin && (
            <div className="flex items-center gap-3 bg-[#F3EFE6] border border-[#E4DFD3] px-3.5 py-2 rounded text-xs">
              <span className="text-[#526360]">
                Viewing as <strong>{activeRole}</strong> (Read-Only Policy)
              </span>
              <button
                type="button"
                onClick={() => onSwitchRole('Brand Admin')}
                className="text-[#0B3D3A] font-medium underline cursor-pointer"
              >
                Switch to Brand Admin to Edit Thresholds
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Threshold Sliders & Always-Escalate Checkboxes */}
          <div className="lg:col-span-7 space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#F3EFE6]/50 border border-[#E4DFD3] rounded">
                <label className="block font-medium text-[#0B3D3A] mb-1">
                  Low-Risk Ceiling (0–{config.lowRiskThreshold})
                </label>
                <input
                  type="number"
                  min={10}
                  max={50}
                  disabled={!isAdmin}
                  value={config.lowRiskThreshold}
                  onChange={(e) =>
                    handleThresholdChange(
                      'lowRiskThreshold',
                      Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-1.5 bg-[#FAF8F4] border border-[#E4DFD3] rounded font-mono-tabular text-sm font-semibold"
                />
                <p className="text-[11px] text-[#526360] mt-1">
                  Scores under {config.lowRiskThreshold} auto-fix &amp; approve immediately.
                </p>
              </div>

              <div className="p-4 bg-[#F3EFE6]/50 border border-[#E4DFD3] rounded">
                <label className="block font-medium text-[#0B3D3A] mb-1">
                  High-Risk Floor (&gt;{config.highRiskThreshold})
                </label>
                <input
                  type="number"
                  min={55}
                  max={95}
                  disabled={!isAdmin}
                  value={config.highRiskThreshold}
                  onChange={(e) =>
                    handleThresholdChange(
                      'highRiskThreshold',
                      Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-1.5 bg-[#FAF8F4] border border-[#E4DFD3] rounded font-mono-tabular text-sm font-semibold"
                />
                <p className="text-[11px] text-[#526360] mt-1">
                  Scores over {config.highRiskThreshold} never auto-approve.
                </p>
              </div>

              <div className="p-4 bg-[#F3EFE6]/50 border border-[#E4DFD3] rounded">
                <label className="block font-medium text-[#0B3D3A] mb-1">
                  Min Medium-Risk Confidence
                </label>
                <input
                  type="number"
                  step={0.05}
                  min={0.6}
                  max={0.99}
                  disabled={!isAdmin}
                  value={config.minMediumConfidence}
                  onChange={(e) =>
                    handleThresholdChange(
                      'minMediumConfidence',
                      Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-1.5 bg-[#FAF8F4] border border-[#E4DFD3] rounded font-mono-tabular text-sm font-semibold"
                />
                <p className="text-[11px] text-[#526360] mt-1">
                  Requires ≥{Math.round(config.minMediumConfidence * 100)}% confidence to approve Medium risk.
                </p>
              </div>
            </div>

            <div>
              <p className="font-medium text-[#0B3D3A] mb-2">
                Always-Escalate Categories (Never Auto-Approved Regardless of Base Score):
              </p>
              <div className="flex flex-wrap gap-2.5">
                {ALL_CATEGORIES.map((cat) => {
                  const checked = config.alwaysEscalateCategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs cursor-pointer ${
                        checked
                          ? 'bg-[#0B3D3A] text-[#FAF8F4] border-[#0B3D3A]'
                          : 'bg-[#FAF8F4] text-[#364946] border-[#E4DFD3]'
                      } ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        disabled={!isAdmin}
                        checked={checked}
                        onChange={() => handleToggleAlwaysEscalate(cat)}
                        className="sr-only"
                      />
                      <span className="uppercase font-mono-tabular font-medium">
                        {cat}
                      </span>
                      <span>{checked ? '· Escalates' : '· Auto-Eligible'}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Non-Disableable Safety Rails */}
          <div className="lg:col-span-5 bg-[#F3EFE6]/80 border border-[#0B3D3A]/30 rounded p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4DFD3]">
              <span className="font-semibold text-[#0B3D3A] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#17806D]" />
                <span>Hardcoded Safety Rails (Cannot Be Turned Off)</span>
              </span>
              <span className="font-mono-tabular text-[11px] text-[#17806D] font-semibold">
                ENFORCED
              </span>
            </div>
            <ul className="space-y-2 text-[#364946] leading-relaxed">
              <li>
                <strong>1. Immutable Audit Trail:</strong> Every automatic fix, escalation, and rollback is written to the Audit Log with reason, source ID, and before/after diff.
              </li>
              <li>
                <strong>2. One-Click Rollback &amp; Kill Switch:</strong> Every automatic approval retains a pre-remediation snapshot for instant 1-click Undo, alongside the global Pause Autopilot switch.
              </li>
              <li>
                <strong>3. Visible Attribution &amp; Report Disclosure:</strong> Every auto-approved item carries a permanent “Auto-approved by AI” badge and full AI-use disclosure.
              </li>
              <li>
                <strong>4. Mandatory Confidential Redaction:</strong> Confidential facts and figures are automatically redacted (<code className="font-mono-tabular">[REDACTED-CONFIDENTIAL]</code>) before any external AI call and always escalate to human review.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* AI-Use Disclosure Governance Report Modal */}
      {selectedReportItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#142321]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#FAF8F4] border border-[#0B3D3A] rounded max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#E4DFD3]">
              <div>
                <span className="text-[#17806D] font-mono-tabular font-medium block mb-0.5">
                  Nirnay Sutra Governance &amp; AI-Use Disclosure Report · {selectedReportItem.id}
                </span>
                <h3 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
                  {selectedReportItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportItem(null)}
                className="text-xs text-[#526360] hover:text-[#142321] cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-3.5 bg-[#F3EFE6] border border-[#E4DFD3] rounded space-y-1.5">
              <div className="flex items-center justify-between font-mono-tabular">
                <span className="font-semibold text-[#0B3D3A]">
                  Status: {selectedReportItem.status}{' '}
                  {selectedReportItem.autoApprovedByAi ? '(Auto-approved by AI)' : ''}
                </span>
                <span>Max Risk Score: {selectedReportItem.maxRiskScore ?? 0}/100</span>
              </div>
              <p className="text-[#142321] leading-relaxed">
                <strong>Mandatory AI-Use Disclosure:</strong>{' '}
                {selectedReportItem.autopilotAction?.aiDisclosureText ||
                  'Evaluated using Google Gemini Flash (gemini-3.8-flash via @google/genai) with top-K passage retrieval and deterministic TypeScript rule verification. Confidential items were automatically redacted prior to external transmission.'}
              </p>
            </div>

            <div>
              <p className="font-semibold text-[#0B3D3A] mb-1">
                Current Verified Copy:
              </p>
              <div className="p-3 bg-[#FAF8F4] border border-[#E4DFD3] rounded whitespace-pre-wrap leading-relaxed text-[#142321]">
                {selectedReportItem.currentText}
              </div>
            </div>

            {selectedReportItem.autopilotAction &&
              selectedReportItem.autopilotAction.changesApplied.length > 0 && (
                <div>
                  <p className="font-semibold text-[#0B3D3A] mb-1.5">
                    Before / After Autopilot Diff Log:
                  </p>
                  <div className="space-y-2">
                    {selectedReportItem.autopilotAction.changesApplied.map(
                      (c, i) => (
                        <div
                          key={i}
                          className="p-2.5 border border-[#E4DFD3] rounded font-mono-tabular text-[11px] space-y-1"
                        >
                          <div className="text-[#526360]">
                            [{c.sourceId}] {c.sourceTitle} · Risk {c.riskScore}/100
                          </div>
                          <div className="text-[#991B1B] line-through">
                            - {c.beforeSnippet}
                          </div>
                          <div className="text-[#17806D] font-medium">
                            + {c.afterSnippet}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4DFD3]">
              <button
                type="button"
                onClick={() => {
                  const id = selectedReportItem.id;
                  setSelectedReportItem(null);
                  onOpenInStudio(id);
                }}
                className="px-4 py-2 font-medium text-[#FAF8F4] bg-[#0B3D3A] rounded cursor-pointer"
              >
                Open in Review Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
