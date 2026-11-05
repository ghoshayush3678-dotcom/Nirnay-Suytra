import React, { useState } from 'react';
import {
  FileText,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Wand2,
  Lock,
  Filter,
} from 'lucide-react';
import {
  ClaimLedgerEntry,
  ClaimStatus,
  ClaimTopic,
  BrandLibraryState,
  UserRole,
} from '../types';

interface ClaimLedgerViewProps {
  claims: ClaimLedgerEntry[];
  contentText: string;
  library: BrandLibraryState;
  activeRole: UserRole;
  expertTopics: ClaimTopic[];
  onToggleExpertTopic: (topic: ClaimTopic) => void;
  onApplyFixAllClaims: (fixedText: string) => void;
  onSelectClaim?: (claimText: string) => void;
}

export const ClaimLedgerView: React.FC<ClaimLedgerViewProps> = ({
  claims,
  contentText,
  library,
  activeRole,
  expertTopics,
  onToggleExpertTopic,
  onApplyFixAllClaims,
  onSelectClaim,
}) => {
  const [filterStatus, setFilterStatus] = useState<ClaimStatus | 'ALL'>('ALL');
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  const displayedClaims = claims.filter((c) =>
    filterStatus === 'ALL' ? true : c.status === filterStatus
  );

  const supportedCount = claims.filter((c) => c.status === 'Supported').length;
  const outdatedCount = claims.filter((c) => c.status === 'Outdated').length;
  const unsupportedCount = claims.filter((c) => c.status === 'Unsupported').length;
  const expertCount = claims.filter((c) => c.status === 'Needs an expert').length;

  const handleFixTheLedger = () => {
    let fixed = contentText;
    for (const c of claims) {
      if (c.suggestedWording && c.status !== 'Supported') {
        fixed = fixed.replace(c.claimText, c.suggestedWording);
      }
    }
    onApplyFixAllClaims(fixed);
  };

  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case 'Supported':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#7FD1BF]/25 text-[#0B3D3A] border border-[#17806D]/40">
            <CheckCircle2 className="w-3 h-3 text-[#17806D]" />
            Supported
          </span>
        );
      case 'Outdated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
            <AlertTriangle className="w-3 h-3 text-[#B45309]" />
            Outdated
          </span>
        );
      case 'Unsupported':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]">
            <ShieldAlert className="w-3 h-3 text-[#991B1B]" />
            Unsupported
          </span>
        );
      case 'Needs an expert':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#EDE9FE] text-[#5B21B6] border border-[#DDD6FE]">
            <HelpCircle className="w-3 h-3 text-[#6D28D9]" />
            Needs an expert
          </span>
        );
    }
  };

  const availableTopics: Array<{ key: ClaimTopic; label: string }> = [
    { key: 'health', label: 'Health & Wellness' },
    { key: 'clinical', label: 'Clinical Efficacy' },
    { key: 'price', label: 'Pricing & Tariffs' },
    { key: 'legal', label: 'Legal & Warranties' },
    { key: 'safety', label: 'Processing & Safety' },
  ];

  const canEditExpertTopics = activeRole === 'Brand Admin' || activeRole === 'Manager';

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary */}
      <div className="bg-white border border-[#E4DFD3] rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4DFD3]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#17806D] mb-1">
              <FileText className="w-4 h-4 text-[#17806D]" />
              <span>Claim Ledger · Factual &amp; Promotional Proof Table</span>
            </div>
            <h3 className="font-serif-display text-xl font-semibold text-[#0B3D3A]">
              Extracted Factual &amp; Promotional Claims ({claims.length})
            </h3>
            <p className="text-xs text-[#526360] mt-0.5">
              Every factual claim in your draft is catalogued and matched against approved library facts.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleFixTheLedger}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer shadow-xs"
              title="Replace unsupported or outdated claims using only verified library wording"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Fix the ledger (Approved Facts Only)</span>
            </button>
          </div>
        </div>

        {/* Status Count Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-tabular">
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'Supported' ? 'ALL' : 'Supported')}
            className={`p-3 rounded border text-left transition-colors cursor-pointer ${
              filterStatus === 'Supported'
                ? 'bg-[#7FD1BF]/25 border-[#17806D]'
                : 'bg-[#FAF8F4] border-[#E4DFD3] hover:border-[#0B3D3A]/40'
            }`}
          >
            <span className="text-[#17806D] font-bold text-lg block">{supportedCount}</span>
            <span className="text-[#526360]">Supported</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'Outdated' ? 'ALL' : 'Outdated')}
            className={`p-3 rounded border text-left transition-colors cursor-pointer ${
              filterStatus === 'Outdated'
                ? 'bg-[#FEF3C7] border-[#B45309]'
                : 'bg-[#FAF8F4] border-[#E4DFD3] hover:border-[#0B3D3A]/40'
            }`}
          >
            <span className="text-[#B45309] font-bold text-lg block">{outdatedCount}</span>
            <span className="text-[#526360]">Outdated</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'Unsupported' ? 'ALL' : 'Unsupported')}
            className={`p-3 rounded border text-left transition-colors cursor-pointer ${
              filterStatus === 'Unsupported'
                ? 'bg-[#FEE2E2] border-[#991B1B]'
                : 'bg-[#FAF8F4] border-[#E4DFD3] hover:border-[#0B3D3A]/40'
            }`}
          >
            <span className="text-[#991B1B] font-bold text-lg block">{unsupportedCount}</span>
            <span className="text-[#526360]">Unsupported</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'Needs an expert' ? 'ALL' : 'Needs an expert')}
            className={`p-3 rounded border text-left transition-colors cursor-pointer ${
              filterStatus === 'Needs an expert'
                ? 'bg-[#EDE9FE] border-[#6D28D9]'
                : 'bg-[#FAF8F4] border-[#E4DFD3] hover:border-[#0B3D3A]/40'
            }`}
          >
            <span className="text-[#6D28D9] font-bold text-lg block">{expertCount}</span>
            <span className="text-[#526360]">Needs an expert</span>
          </button>
        </div>

        {/* Admin Policy: Topics That Always Need An Expert */}
        <div className="p-3 bg-[#F3EFE6] border border-[#E4DFD3] rounded text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#0B3D3A] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#17806D]" />
              Brand Admin Policy: Topics That Always Need a Human Expert
            </span>
            {!canEditExpertTopics && (
              <span className="text-[#526360] italic text-[11px]">(Requires Brand Admin role to modify)</span>
            )}
          </div>
          <p className="text-[#526360] text-[11px] leading-relaxed">
            Claims in checked categories are never marked compliant without manual human expert review, even if similar words exist in guidelines.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {availableTopics.map((top) => {
              const isChecked = expertTopics.includes(top.key);
              return (
                <label
                  key={top.key}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-colors ${
                    isChecked
                      ? 'bg-[#0B3D3A] text-[#FAF8F4] border-[#0B3D3A]'
                      : 'bg-white text-[#526360] border-[#E4DFD3]'
                  } ${canEditExpertTopics ? 'cursor-pointer hover:border-[#0B3D3A]' : 'opacity-80 cursor-default'}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={!canEditExpertTopics}
                    onChange={() => onToggleExpertTopic(top.key)}
                    className="sr-only"
                  />
                  <span>{top.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="border border-[#E4DFD3] rounded-lg overflow-x-auto bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F3EFE6] border-b border-[#E4DFD3] text-[11px] text-[#526360] font-mono-tabular uppercase">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Claim in Draft</th>
              <th className="py-2.5 px-3 font-semibold">Topic</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-4 font-semibold">Matching Approved Fact</th>
              <th className="py-2.5 px-4 font-semibold">Proposed Verified Fix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4DFD3]">
            {displayedClaims.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[#526360]">
                  No claims found matching the current filter.
                </td>
              </tr>
            ) : (
              displayedClaims.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => {
                    setSelectedClaimId(c.id);
                    if (onSelectClaim) onSelectClaim(c.claimText);
                  }}
                  className={`hover:bg-[#FAF8F4] transition-colors cursor-pointer ${
                    selectedClaimId === c.id ? 'bg-[#F3EFE6]/70' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-medium text-[#142321] max-w-xs">
                    <span className="block">{c.claimText}</span>
                    <span className="text-[11px] text-[#526360] block mt-1 italic">
                      {c.reason}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono-tabular text-[#526360] whitespace-nowrap">
                    <span className="capitalize">{c.topic}</span>
                    {c.requiresExpertReview && (
                      <span className="block text-[10px] text-[#6D28D9] font-medium">Expert-Gated</span>
                    )}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    {getStatusBadge(c.status)}
                  </td>

                  <td className="py-3 px-4 text-[#0B3D3A] max-w-xs">
                    {c.matchedFactId ? (
                      <div>
                        <span className="font-semibold font-mono-tabular block text-[11px]">
                          [{c.matchedFactId}]
                        </span>
                        <span className="text-[11px] text-[#526360] line-clamp-2">
                          {c.matchedFactStatement}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#991B1B] italic font-mono-tabular">None found</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-[#17806D] font-mono-tabular max-w-xs">
                    {c.suggestedWording ? (
                      <span className="bg-[#7FD1BF]/15 px-2 py-1 rounded block border border-[#7FD1BF]/30">
                        {c.suggestedWording}
                      </span>
                    ) : (
                      <span className="text-[#526360] italic">Wording conforms</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
