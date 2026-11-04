import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Cpu,
  Code2,
  Download,
  RotateCcw,
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { EditorialEmptyCard } from './EditorialEmptyStates';

interface AuditDisclosureViewProps {
  auditLogs: AuditLogEntry[];
  onResetDemoData: () => void;
  onOpenStudio?: () => void;
}

export const AuditDisclosureView: React.FC<AuditDisclosureViewProps> = ({
  auditLogs,
  onResetDemoData,
  onOpenStudio,
}) => {
  const [eventFilter, setEventFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter((log) => {
    if (eventFilter !== 'ALL' && log.eventType !== eventFilter) return false;
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      log.summary.toLowerCase().includes(q) ||
      log.targetTitle.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q)
    );
  });

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(auditLogs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nirnay-sutra-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#E4DFD3]">
        <div>
          <div className="text-xs text-[#526360] mb-1">
            <span>Transparency, Provenance & Plain-Language AI Disclosure</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>{auditLogs.length} Logged Governance Events</span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
            Audit Ledger & AI Disclosure
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#0B3D3A] border border-[#E4DFD3] hover:border-[#0B3D3A] rounded transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Ledger (JSON)</span>
          </button>

          <button
            type="button"
            onClick={onResetDemoData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#991B1B] border border-[#991B1B]/30 hover:bg-[#FEE2E2]/40 rounded transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Kaveri Organics Seed State</span>
          </button>
        </div>
      </div>

      {/* Plain-Language AI Service & Data Governance Disclosure Panel */}
      <section
        aria-label="Plain-language AI Disclosure"
        className="border border-[#0B3D3A] bg-[#F3EFE6]/70 rounded p-6 lg:p-8 space-y-6"
      >
        <div className="border-b border-[#E4DFD3] pb-4">
          <span className="text-xs text-[#17806D] font-medium block mb-1">
            Mandatory Plain-Language AI Disclosure
          </span>
          <h2 className="font-serif-display text-xl font-semibold text-[#0B3D3A]">
            Which AI Service Is Used, What Data Is Sent, and How Decisions Are Governed
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs leading-relaxed">
          <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-5 rounded space-y-2">
            <div className="flex items-center gap-2 text-[#0B3D3A] font-semibold text-sm">
              <Cpu className="w-4 h-4 text-[#17806D]" />
              <span>1. AI Service Used</span>
            </div>
            <p className="text-[#364946]">
              Nirnay Sutra uses <strong>Google Gemini Flash (<code className="font-mono-tabular">gemini-3.8-flash</code>)</strong> via the official <code className="font-mono-tabular">@google/genai</code> SDK with structured JSON schema output (<code className="font-mono-tabular">responseSchema</code>) and multimodal vision for uploaded images.
            </p>
          </div>

          <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-5 rounded space-y-2">
            <div className="flex items-center gap-2 text-[#0B3D3A] font-semibold text-sm">
              <Lock className="w-4 h-4 text-[#17806D]" />
              <span>2. Exact Data Sent</span>
            </div>
            <p className="text-[#364946]">
              Only after you click <strong>“Consent &amp; Run Verification”</strong>, Nirnay Sutra sends: (a) the active draft text (with Confidential figures replaced by <code className="font-mono-tabular">[REDACTED-CONFIDENTIAL]</code> if enabled), (b) the uploaded image if present, and (c) <strong>only the top 6 retrieved Brand Library passages</strong> ranked by relevance.
            </p>
          </div>

          <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-5 rounded space-y-2">
            <div className="flex items-center gap-2 text-[#0B3D3A] font-semibold text-sm">
              <Code2 className="w-4 h-4 text-[#17806D]" />
              <span>3. Executed in Local Code</span>
            </div>
            <p className="text-[#364946]">
              Four checks never rely on AI guesswork and execute 100% deterministically in TypeScript: <strong>Banned glossary terms</strong>, <strong>unbacked superlative claims</strong> (“#1”, “best”, “guaranteed”), <strong>WCAG 2.1 luminance contrast ratios</strong>, and <strong>missing or filename-only alt text</strong>.
            </p>
          </div>

          <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-5 rounded space-y-2">
            <div className="flex items-center gap-2 text-[#0B3D3A] font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-[#17806D]" />
              <span>4. Verifier &amp; Human Gate</span>
            </div>
            <p className="text-[#364946]">
              Every AI finding is checked by our Citation Verifier in code: if its <code className="font-mono-tabular">sourceId</code> or <code className="font-mono-tabular">sourceQuote</code> does not exist in the Brand Library, it is discarded (“No source, no finding”). AI never edits text automatically and can never approve content.
            </p>
          </div>
        </div>
      </section>

      {/* Immutable Audit Log Table */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
            Chronological Audit Log of AI Calls & Human Decisions
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3EFE6] border border-[#E4DFD3] rounded text-xs">
              {[
                'ALL',
                'AUTOPILOT_AUTO_APPROVE',
                'AUTOPILOT_ESCALATE',
                'AUTOPILOT_ROLLBACK',
                'AI_CALL',
                'HUMAN_DECISION',
                'STATUS_TRANSITION',
              ].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEventFilter(type)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    eventFilter === type
                      ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                      : 'text-[#526360] hover:text-[#142321]'
                  }`}
                >
                  {type === 'ALL' ? 'All Events' : type.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter audit log..."
              aria-label="Filter audit log"
              className="px-3 py-1.5 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded w-52"
            />
          </div>
        </div>

        {auditLogs.length === 0 ? (
          <EditorialEmptyCard
            illustration="audit"
            heading="No activity recorded yet."
            explanation="Every AI check, Autopilot action, role update, and human review decision will be written to this immutable ledger as your team works."
            primaryAction={
              onOpenStudio
                ? {
                    label: 'Open Review Studio',
                    onClick: onOpenStudio,
                  }
                : {
                    label: 'Restore sample activity',
                    onClick: onResetDemoData,
                  }
            }
          />
        ) : filteredLogs.length === 0 ? (
          <EditorialEmptyCard
            illustration="search"
            heading="No matches. Clear the filters."
            explanation="No audit events matched your current event type filter or search query."
            primaryAction={{
              label: 'Clear the filters',
              onClick: () => {
                setEventFilter('ALL');
                setSearchQuery('');
              },
            }}
          />
        ) : (
        <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F3EFE6]/80 border-b border-[#E4DFD3] text-[#526360]">
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Event Type</th>
                <th className="py-3 px-4 font-medium">Actor & Role</th>
                <th className="py-3 px-4 font-medium">Target Content / Rule</th>
                <th className="py-3 px-4 font-medium">Action, Cited Source &amp; Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DFD3]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F3EFE6]/30">
                  <td className="py-3.5 px-4 font-mono-tabular text-[#526360] whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-mono-tabular whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        log.eventType === 'AUTOPILOT_AUTO_APPROVE' ||
                        log.eventType === 'AI_CALL'
                          ? 'text-[#17806D]'
                          : log.eventType === 'AUTOPILOT_ESCALATE' ||
                            log.eventType === 'STATUS_TRANSITION'
                          ? 'text-[#B45309]'
                          : log.eventType === 'AUTOPILOT_ROLLBACK'
                          ? 'text-[#991B1B]'
                          : 'text-[#0B3D3A]'
                      }`}
                    >
                      {log.eventType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-medium text-[#142321]">{log.actorName}</span>
                    <span className="text-[#526360] ml-1.5">({log.actorRole})</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#364946] font-medium">
                    {log.targetTitle}
                  </td>
                  <td className="py-3.5 px-4 text-[#142321] leading-relaxed space-y-1">
                    <p>{log.summary}</p>
                    {log.details?.sourceId && (
                      <p className="text-[11px] text-[#0B3D3A] font-mono-tabular">
                        Source Used: <strong>{log.details.sourceId}</strong>
                        {log.details.riskScore !== undefined
                          ? ` · Risk Score: ${log.details.riskScore}/100`
                          : ''}
                        {log.details.confidentialRedacted
                          ? ' · Confidential Redaction: Enforced'
                          : ''}
                      </p>
                    )}
                    {log.details?.beforeDiff && log.details?.afterDiff && (
                      <div className="p-2 bg-[#F3EFE6]/60 border border-[#E4DFD3] rounded font-mono-tabular text-[11px] space-y-0.5">
                        <div className="text-[#991B1B] line-through">
                          Before: {log.details.beforeDiff}
                        </div>
                        <div className="text-[#17806D] font-medium">
                          After: {log.details.afterDiff}
                        </div>
                      </div>
                    )}
                    {log.eventType === 'AI_CALL' && log.details && (
                      <p className="text-[11px] text-[#526360] font-mono-tabular mt-1">
                        Model: {log.details.modelUsed} · Passages Sent: {log.details.passagesSent} · Verified: {log.details.verifiedCount} · Discarded Ungrounded: {log.details.discardedCount} · Redacted: {log.details.confidentialRedacted ? 'Yes' : 'No'}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </section>
    </div>
  );
};
