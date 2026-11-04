import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Send,
  UserCheck,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import {
  ContentItem,
  ContentStatus,
  UserRole,
  ReviewComment,
} from '../types';

import { EditorialEmptyCard } from './EditorialEmptyStates';

interface ApprovalsViewProps {
  items: ContentItem[];
  selectedItemId: string;
  onSelectItem: (id: string) => void;
  activeRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  onUpdateItem: (updated: ContentItem) => void;
  onRecordAudit: (
    eventType: 'AI_CALL' | 'HUMAN_DECISION' | 'STATUS_TRANSITION',
    targetId: string,
    targetTitle: string,
    summary: string,
    details: Record<string, any>
  ) => void;
  onOpenInStudio: (itemId: string) => void;
  onCreateNewDraft?: () => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  activeRole,
  onSwitchRole,
  onUpdateItem,
  onRecordAudit,
  onOpenInStudio,
  onCreateNewDraft,
}) => {
  const currentItem =
    items.find((i) => i.id === selectedItemId) || items[0];

  const [commentText, setCommentText] = useState('');
  const [assigneeInput, setAssigneeInput] = useState(
    currentItem?.assignedReviewer || 'Vikramaditya Menon'
  );
  const [overrideJustification, setOverrideJustification] = useState('');
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  if (!currentItem || items.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#E4DFD3]">
          <div>
            <div className="text-xs text-[#526360] mb-1">
              <span>Human Governance Sign-Off Queue</span>
              <span aria-hidden="true" className="mx-2">·</span>
              <span>
                Active Role: <strong className="text-[#0B3D3A]">{activeRole}</strong>
              </span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
              Approvals &amp; Role Workflow
            </h1>
          </div>
        </div>

        <EditorialEmptyCard
          illustration="approvals"
          heading="No items waiting for approval."
          explanation="When a Creator submits a checked piece or Autopilot escalates a high-risk item, it appears here for human review."
          primaryAction={{
            label:
              activeRole === 'Creator'
                ? 'Submit a draft for review'
                : 'Open Review Studio',
            onClick: () => {
              if (onCreateNewDraft) {
                onCreateNewDraft();
              } else {
                onOpenInStudio('');
              }
            },
          }}
        />
      </div>
    );
  }

  const openFindings = currentItem.findings.filter((f) => f.status === 'open');
  const openHighFindings = openFindings.filter((f) => f.severity === 'high');

  const canSubmitForReview =
    activeRole === 'Creator' || activeRole === 'Manager' || activeRole === 'Brand Admin';
  const canAssign =
    activeRole === 'Manager' || activeRole === 'Brand Admin';
  const canApproveOrReject =
    activeRole === 'Reviewer' || activeRole === 'Brand Admin';

  const nowFormatted = () =>
    new Date().toISOString().slice(0, 16).replace('T', ' ');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: ReviewComment = {
      id: `CM-${Date.now()}`,
      authorName: `${activeRole} User`,
      authorRole: activeRole,
      timestamp: nowFormatted(),
      text: commentText.trim(),
      actionType: 'comment',
    };

    const updated: ContentItem = {
      ...currentItem,
      updatedAt: newComment.timestamp,
      comments: [...currentItem.comments, newComment],
    };

    onUpdateItem(updated);
    setCommentText('');
  };

  const handleAssignReviewer = () => {
    if (!canAssign || !assigneeInput.trim()) return;
    const ts = nowFormatted();
    const newComment: ReviewComment = {
      id: `CM-${Date.now()}`,
      authorName: `${activeRole} User`,
      authorRole: activeRole,
      timestamp: ts,
      text: `Assigned Reviewer: ${assigneeInput.trim()}`,
      actionType: 'assignment',
    };

    const updated: ContentItem = {
      ...currentItem,
      assignedReviewer: assigneeInput.trim(),
      updatedAt: ts,
      comments: [...currentItem.comments, newComment],
    };
    onUpdateItem(updated);
    onRecordAudit(
      'HUMAN_DECISION',
      currentItem.id,
      currentItem.title,
      `Manager assigned reviewer "${assigneeInput.trim()}" to ${currentItem.id}.`,
      { decision: 'Assign Reviewer' }
    );
    setStatusFeedback(`Assigned ${assigneeInput.trim()} as Reviewer.`);
  };

  const handleTransitionStatus = (targetStatus: ContentStatus) => {
    const ts = nowFormatted();

    if (
      targetStatus === 'Approved' &&
      openHighFindings.length > 0 &&
      !overrideJustification.trim()
    ) {
      setStatusFeedback(
        'Cannot approve while high-severity findings remain open unless you resolve them in Review Studio or enter an explicit compliance override note below.'
      );
      return;
    }

    const noteText =
      commentText.trim() ||
      overrideJustification.trim() ||
      `Transitioned status from "${currentItem.status}" to "${targetStatus}".`;

    const newComment: ReviewComment = {
      id: `CM-${Date.now()}`,
      authorName: `${activeRole} User`,
      authorRole: activeRole,
      timestamp: ts,
      text: `[${targetStatus}] ${noteText}`,
      actionType: 'status-change',
    };

    const updated: ContentItem = {
      ...currentItem,
      status: targetStatus,
      updatedAt: ts,
      comments: [...currentItem.comments, newComment],
    };

    onUpdateItem(updated);
    setCommentText('');
    setOverrideJustification('');
    setStatusFeedback(`Status updated to "${targetStatus}".`);

    onRecordAudit(
      'STATUS_TRANSITION',
      currentItem.id,
      currentItem.title,
      `${activeRole} transitioned "${currentItem.title}" to ${targetStatus}. Note: ${noteText}`,
      { decision: targetStatus }
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#E4DFD3]">
        <div>
          <div className="text-xs text-[#526360] mb-1">
            <span>Human Governance Sign-Off Queue</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Active Role: <strong className="text-[#0B3D3A]">{activeRole}</strong></span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>AI Can Never Approve Content</span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
            Approvals & Role Workflow
          </h1>
        </div>

        {/* Workflow Pipeline Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#526360] font-mono-tabular">
          <span>Draft</span>
          <span>→</span>
          <span>AI-checked</span>
          <span>→</span>
          <span>In review</span>
          <span>→</span>
          <span>Changes requested / Approved</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Queue of Content Items */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="font-serif-display text-base font-semibold text-[#0B3D3A] mb-2">
            Governance Queue ({items.length})
          </h2>

          {items.map((item) => {
            const isSelected = item.id === currentItem.id;
            const openCount = item.findings.filter((f) => f.status === 'open').length;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectItem(item.id);
                  setAssigneeInput(item.assignedReviewer);
                  setStatusFeedback(null);
                }}
                className={`w-full text-left p-4 rounded border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#F3EFE6] border-[#0B3D3A]'
                    : 'bg-[#FAF8F4] border-[#E4DFD3] hover:border-[#0B3D3A]/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-[#526360] mb-1 font-mono-tabular">
                  <span className="font-semibold text-[#0B3D3A]">{item.id}</span>
                  <span>
                    Status: <strong className="text-[#0B3D3A]">{item.status}</strong>
                  </span>
                </div>
                {item.autoApprovedByAi && !item.rolledBack && (
                  <div className="mb-1">
                    <span className="text-[11px] font-mono-tabular font-semibold text-[#0B3D3A] bg-[#7FD1BF]/40 border border-[#17806D]/40 px-2 py-0.5 rounded-sm">
                      Auto-approved by AI
                    </span>
                  </div>
                )}
                {item.escalatedToHuman && (
                  <div className="mb-1">
                    <span className="text-[11px] font-mono-tabular font-semibold text-[#B45309]">
                      Exception Queue · Risk {item.maxRiskScore ?? 88}/100
                    </span>
                  </div>
                )}
                <h3 className="font-serif-display text-sm font-semibold text-[#142321] mb-1">
                  {item.title}
                </h3>
                <div className="text-[11px] text-[#526360] flex items-center justify-between font-mono-tabular">
                  <span>Reviewer: {item.assignedReviewer}</span>
                  <span
                    className={
                      openCount > 0 ? 'text-[#B45309] font-medium' : 'text-[#17806D]'
                    }
                  >
                    {openCount} open flags · v{item.versions.length}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column (7 cols): Active Item Role Decision Desk & Comments Thread */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#E4DFD3]">
              <div>
                <div className="text-xs text-[#526360] mb-1 font-mono-tabular">
                  <span>{currentItem.id}</span>
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  <span>{currentItem.team}</span>
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  <span>Current Status: <strong className="text-[#0B3D3A]">{currentItem.status}</strong></span>
                </div>
                <h2 className="font-serif-display text-xl font-semibold text-[#0B3D3A]">
                  {currentItem.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onOpenInStudio(currentItem.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0B3D3A] border border-[#0B3D3A]/30 hover:bg-[#0B3D3A] hover:text-[#FAF8F4] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Inspect in Review Studio</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {statusFeedback && (
              <div className="p-3 bg-[#7FD1BF]/25 border border-[#17806D] text-[#0B3D3A] text-xs rounded">
                {statusFeedback}
              </div>
            )}

            {/* Summary of Open Findings before Approval */}
            <div className="p-4 bg-[#F3EFE6]/60 border border-[#E4DFD3] rounded text-xs space-y-2">
              <div className="flex items-center justify-between font-mono-tabular">
                <span className="font-medium text-[#0B3D3A]">
                  Verification Gate Readiness
                </span>
                <span>
                  {openFindings.length} Open Findings ({openHighFindings.length} High Severity)
                </span>
              </div>
              {openFindings.length > 0 ? (
                <p className="text-[#526360]">
                  Unresolved findings remain on this draft. Creators can accept or edit suggested diffs in Review Studio, or Reviewers can request changes below.
                </p>
              ) : (
                <p className="text-[#17806D] font-medium">
                  All deterministic and citation-verified AI findings have been resolved. Ready for human Reviewer sign-off.
                </p>
              )}
            </div>

            {/* Manager Assignment Control */}
            <div className="pt-2 border-t border-[#E4DFD3]">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#142321] mb-1">
                    Assigned Compliance Reviewer (Manager / Admin Action)
                  </label>
                  <input
                    type="text"
                    disabled={!canAssign}
                    value={assigneeInput}
                    onChange={(e) => setAssigneeInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded disabled:opacity-60"
                  />
                </div>
                {canAssign ? (
                  <button
                    type="button"
                    onClick={handleAssignReviewer}
                    className="px-3.5 py-1.5 text-xs font-medium text-[#0B3D3A] border border-[#0B3D3A] hover:bg-[#0B3D3A] hover:text-[#FAF8F4] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Update Assignment
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSwitchRole('Manager')}
                    className="text-xs text-[#17806D] underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Switch to Manager to Assign
                  </button>
                )}
              </div>
            </div>

            {/* Role-Enforced Status Decision Buttons */}
            <div className="pt-4 border-t border-[#E4DFD3] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#0B3D3A]">
                  Role-Permitted Workflow Actions (Active Role: {activeRole})
                </span>
                {!canApproveOrReject && (
                  <button
                    type="button"
                    onClick={() => onSwitchRole('Reviewer')}
                    className="text-xs text-[#17806D] underline cursor-pointer"
                  >
                    Switch to Reviewer to Approve / Request Changes
                  </button>
                )}
              </div>

              {canApproveOrReject && openHighFindings.length > 0 && (
                <div>
                  <label className="block text-xs text-[#B45309] font-medium mb-1">
                    High-Severity Override Justification (Required if approving with {openHighFindings.length} open high-severity finding):
                  </label>
                  <input
                    type="text"
                    value={overrideJustification}
                    onChange={(e) => setOverrideJustification(e.target.value)}
                    placeholder="State legal/editorial justification for overriding open finding..."
                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F4] border border-[#B45309] rounded"
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {/* Creator Action: Submit for Review */}
                <button
                  type="button"
                  disabled={!canSubmitForReview || currentItem.status === 'In review'}
                  onClick={() => handleTransitionStatus('In review')}
                  className="px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer disabled:opacity-40"
                >
                  Submit for Review (Creator)
                </button>

                {/* Reviewer Action: Request Changes */}
                <button
                  type="button"
                  disabled={!canApproveOrReject}
                  onClick={() => handleTransitionStatus('Changes requested')}
                  className="px-4 py-2 text-xs font-medium text-[#B45309] border border-[#B45309] hover:bg-[#B45309] hover:text-[#FAF8F4] rounded transition-colors cursor-pointer disabled:opacity-40"
                >
                  Request Changes (Reviewer)
                </button>

                {/* Reviewer Action: Approve for Publication */}
                <button
                  type="button"
                  disabled={!canApproveOrReject}
                  onClick={() => handleTransitionStatus('Approved')}
                  className="px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#17806D] hover:bg-[#0B3D3A] rounded transition-colors cursor-pointer disabled:opacity-40"
                >
                  Approve for Publication (Human Reviewer Only)
                </button>
              </div>
            </div>
          </div>

          {/* Comments & Review Thread */}
          <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-4">
            <h3 className="font-serif-display text-base font-semibold text-[#0B3D3A]">
              Review Discussion & Decision Thread ({currentItem.comments.length})
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {currentItem.comments.map((cm) => (
                <div
                  key={cm.id}
                  className="p-3.5 rounded border border-[#E4DFD3] bg-[#F3EFE6]/40 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#526360] mb-1 font-mono-tabular">
                    <span>
                      <strong className="text-[#0B3D3A]">{cm.authorName}</strong> · {cm.authorRole} · {cm.actionType}
                    </span>
                    <span>{cm.timestamp}</span>
                  </div>
                  <p className="text-[#142321] leading-relaxed">{cm.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="pt-2 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Add a review note or decision comment as ${activeRole}...`}
                aria-label="Add review comment"
                className="flex-1 px-3 py-2 text-xs bg-[#F3EFE6]/50 border border-[#E4DFD3] rounded focus:outline-none focus:border-[#0B3D3A]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Comment</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
