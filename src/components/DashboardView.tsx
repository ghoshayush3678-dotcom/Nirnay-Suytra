import React, { useState } from 'react';
import {
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
} from 'lucide-react';
import {
  ContentItem,
  ContentStatus,
  UserRole,
  AuditLogEntry,
  BrandLibraryState,
} from '../types';
import { EditorialEmptyCard } from './EditorialEmptyStates';

interface DashboardViewProps {
  items: ContentItem[];
  library: BrandLibraryState;
  auditLogs: AuditLogEntry[];
  activeRole: UserRole;
  onOpenInStudio: (itemId: string) => void;
  onOpenInApprovals: (itemId: string) => void;
  onCreateNewDraft: () => void;
  onNavigate: (tab: string) => void;
}

const ALL_STATUSES: ContentStatus[] = [
  'Draft',
  'AI-checked',
  'In review',
  'Changes requested',
  'Approved',
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  items,
  library,
  auditLogs,
  activeRole,
  onOpenInStudio,
  onOpenInApprovals,
  onCreateNewDraft,
  onNavigate,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredItems =
    statusFilter === 'ALL'
      ? items
      : items.filter((item) => item.status === statusFilter);

  const openFindingsTotal = items.reduce(
    (sum, item) => sum + item.findings.filter((f) => f.status === 'open').length,
    0
  );

  const totalDiscardedByVerifier = items.reduce(
    (sum, item) => sum + (item.verifierStats?.discardedUngroundedCount || 0),
    0
  );

  // Personalized tasks based on activeRole
  const roleTasks = items.filter((item) => {
    if (activeRole === 'Creator') {
      return (
        item.status === 'Draft' ||
        item.status === 'AI-checked' ||
        item.status === 'Changes requested'
      );
    }
    if (activeRole === 'Manager') {
      return item.status === 'In review' || item.status === 'Changes requested';
    }
    if (activeRole === 'Reviewer') {
      return item.status === 'In review';
    }
    // Brand Admin sees items with open high-severity findings or in review
    return true;
  });

  return (
    <div className="space-y-10">
      {/* Top Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E4DFD3]">
        <div>
          <div className="text-xs text-[#526360] mb-1">
            <span>{library.brandName}</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Pre-Publication Governance Overview</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Active Role: {activeRole}</span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
            Governance Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onCreateNewDraft}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Content Draft</span>
          </button>
        </div>
      </div>

      {/* Status Summary Strip (Tabular Numerals) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {ALL_STATUSES.map((st) => {
          const count = items.filter((i) => i.status === st).length;
          const isSelected = statusFilter === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(isSelected ? 'ALL' : st)}
              className={`text-left p-4 rounded border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#0B3D3A] text-[#FAF8F4] border-[#0B3D3A]'
                  : 'bg-[#F3EFE6]/60 text-[#142321] border-[#E4DFD3] hover:border-[#0B3D3A]/40'
              }`}
            >
              <p
                className={`text-xs mb-1 ${
                  isSelected ? 'text-[#7FD1BF]' : 'text-[#526360]'
                }`}
              >
                {st}
              </p>
              <p className="font-serif-display text-2xl font-semibold font-mono-tabular">
                {count}
              </p>
            </button>
          );
        })}

        <div className="p-4 rounded border border-[#E4DFD3] bg-[#FAF8F4]">
          <p className="text-xs text-[#526360] mb-1">Open Findings</p>
          <p className="font-serif-display text-2xl font-semibold text-[#B45309] font-mono-tabular">
            {openFindingsTotal}
          </p>
          <p className="text-[11px] text-[#526360] mt-0.5 font-mono-tabular">
            {totalDiscardedByVerifier} ungrounded discarded
          </p>
        </div>
      </div>

      {/* Main Split: Content Items by Status (Left 7 cols) + My Tasks & Activity (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Content Items Table / List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
              Content Items by Status
            </h2>

            {/* Interactive Segmented Filter */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3EFE6] border border-[#E4DFD3] rounded">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                    : 'text-[#526360] hover:text-[#142321]'
                }`}
              >
                All ({items.length})
              </button>
              {ALL_STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                      : 'text-[#526360] hover:text-[#142321]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {items.length === 0 ? (
            <EditorialEmptyCard
              illustration="document"
              heading="No content yet. Submit your first piece for review."
              explanation="Paste a draft or upload an asset so Nirnay Sutra can check claims, tone, terminology, and accessibility before publication."
              primaryAction={{
                label: 'Submit your first piece for review',
                onClick: onCreateNewDraft,
              }}
            />
          ) : filteredItems.length === 0 ? (
            <EditorialEmptyCard
              illustration="search"
              heading="No matches. Clear the filters."
              explanation={`No content items currently match the "${statusFilter}" filter.`}
              primaryAction={{
                label: 'Clear the filters',
                onClick: () => setStatusFilter('ALL'),
              }}
            />
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const openCount = item.findings.filter((f) => f.status === 'open').length;
                const highCount = item.findings.filter(
                  (f) => f.status === 'open' && f.severity === 'high'
                ).length;

                return (
                  <div
                    key={item.id}
                    className="border border-[#E4DFD3] bg-[#FAF8F4] hover:border-[#0B3D3A]/50 rounded p-5 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#526360] mb-1">
                          <span className="font-mono-tabular font-medium text-[#0B3D3A]">
                            {item.id}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.team}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.channel}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Status: <strong className="text-[#0B3D3A]">{item.status}</strong>
                          </span>
                          {item.autoApprovedByAi && !item.rolledBack && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-tabular font-semibold text-[#0B3D3A] bg-[#7FD1BF]/40 border border-[#17806D]/40 px-2 py-0.5 rounded-sm">
                                Auto-approved by AI
                              </span>
                            </>
                          )}
                          {item.escalatedToHuman && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-tabular font-semibold text-[#B45309]">
                                Escalated Exception (Risk {item.maxRiskScore ?? 88}/100)
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="font-serif-display text-base font-semibold text-[#142321]">
                          {item.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenInStudio(item.id)}
                          className="px-3 py-1.5 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Review Studio
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenInApprovals(item.id)}
                          className="px-3 py-1.5 text-xs font-medium text-[#0B3D3A] border border-[#E4DFD3] hover:border-[#0B3D3A] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Approvals
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#526360] line-clamp-2 mb-3">
                      {item.currentText}
                    </p>

                    <div className="pt-3 border-t border-[#E4DFD3] flex flex-wrap items-center justify-between gap-2 text-xs text-[#526360] font-mono-tabular">
                      <div>
                        <span>Author: {item.authorName}</span>
                        <span aria-hidden="true" className="mx-2">·</span>
                        <span>Reviewer: {item.assignedReviewer}</span>
                        <span aria-hidden="true" className="mx-2">·</span>
                        <span>v{item.versions.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {openCount > 0 ? (
                          <span className="text-[#B45309] font-medium">
                            {openCount} open findings ({highCount} high severity)
                          </span>
                        ) : (
                          <span className="text-[#17806D] font-medium">
                            All findings resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: My Tasks for Active Role + Recent Activity */}
        <div className="lg:col-span-5 space-y-8">
          {/* Role Task Queue */}
          <div className="border border-[#E4DFD3] bg-[#F3EFE6]/50 rounded p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4DFD3]">
              <div>
                <h2 className="font-serif-display text-base font-semibold text-[#0B3D3A]">
                  My Tasks ({activeRole})
                </h2>
                <p className="text-xs text-[#526360]">
                  Actionable queue filtered for your current role permissions
                </p>
              </div>
              <span className="text-xs font-mono-tabular text-[#0B3D3A] font-medium">
                {roleTasks.length} pending
              </span>
            </div>

            {roleTasks.length === 0 ? (
              <div
                role="status"
                className="p-4 rounded border border-[#E4DFD3] bg-[#FAF8F4] text-xs text-[#526360] flex items-center justify-between gap-3"
              >
                <span>No tasks waiting for your {activeRole} role right now.</span>
                <button
                  type="button"
                  onClick={onCreateNewDraft}
                  className="px-3 py-1.5 font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded shrink-0 cursor-pointer"
                >
                  New draft
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {roleTasks.map((task) => {
                  const openCount = task.findings.filter((f) => f.status === 'open').length;
                  let recommendedAction = 'Inspect in Review Studio';
                  if (activeRole === 'Creator' && task.status === 'Changes requested') {
                    recommendedAction = 'Resolve Reviewer Feedback';
                  } else if (activeRole === 'Creator' && task.status === 'AI-checked') {
                    recommendedAction = 'Review Diffs & Submit';
                  } else if (activeRole === 'Reviewer' && task.status === 'In review') {
                    recommendedAction = 'Verify & Approve / Request Changes';
                  } else if (activeRole === 'Manager') {
                    recommendedAction = 'Assign Reviewer & Comment';
                  }

                  return (
                    <div
                      key={task.id}
                      className="bg-[#FAF8F4] border border-[#E4DFD3] rounded p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] text-[#526360] mb-0.5 font-mono-tabular">
                          <span>{task.status}</span>
                          <span aria-hidden="true" className="mx-1.5">·</span>
                          <span>{openCount} open flags</span>
                        </div>
                        <p className="text-xs font-medium text-[#142321] truncate">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-[#17806D] mt-0.5">
                          Next: {recommendedAction}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          activeRole === 'Reviewer' || activeRole === 'Manager'
                            ? onOpenInApprovals(task.id)
                            : onOpenInStudio(task.id)
                        }
                        className="px-3 py-1.5 text-xs font-medium text-[#0B3D3A] border border-[#0B3D3A]/30 hover:bg-[#0B3D3A] hover:text-[#FAF8F4] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Open
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Governance Activity */}
          <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4DFD3]">
              <h2 className="font-serif-display text-base font-semibold text-[#0B3D3A]">
                Recent Governance Activity
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('audit-disclosure')}
                className="text-xs text-[#17806D] hover:underline cursor-pointer"
              >
                Full Audit Log
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <p role="status" className="text-xs text-[#526360] py-3">
                No activity recorded yet.
              </p>
            ) : (
              <div className="space-y-3.5">
                {auditLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="pb-3 border-b border-[#E4DFD3] last:border-b-0 last:pb-0 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#526360] mb-1 font-mono-tabular">
                      <span>
                        {log.actorName} ({log.actorRole})
                      </span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="text-[#142321] leading-relaxed">{log.summary}</p>
                    <p className="text-[11px] text-[#526360] mt-0.5">
                      Target: {log.targetTitle}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
