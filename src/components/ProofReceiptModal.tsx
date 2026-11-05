import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Printer,
  Copy,
  Hash,
  FileCheck,
  AlertCircle,
  Clock,
  User,
  Sparkles,
} from 'lucide-react';
import { ProofReceipt, ContentItem } from '../types';
import { computeSha256 } from '../utils/governanceEngine';

interface ProofReceiptModalProps {
  receipt: ProofReceipt | null;
  item: ContentItem;
  isOpen: boolean;
  onClose: () => void;
}

export const ProofReceiptModal: React.FC<ProofReceiptModalProps> = ({
  receipt,
  item,
  isOpen,
  onClose,
}) => {
  const [verifyInputText, setVerifyInputText] = useState('');
  const [computedVerifyHash, setComputedVerifyHash] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (isOpen && receipt) {
      setVerifyInputText(receipt.finalContentText || item.currentText);
      computeSha256(receipt.finalContentText || item.currentText).then(setComputedVerifyHash);
    }
  }, [isOpen, receipt, item]);

  if (!isOpen || !receipt) return null;

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const hash = await computeSha256(verifyInputText);
      setComputedVerifyHash(hash);
    } finally {
      setIsVerifying(false);
    }
  };

  const isHashMatch =
    computedVerifyHash &&
    computedVerifyHash.toLowerCase() === receipt.finalSha256Hash.toLowerCase();

  const handleCopyHash = () => {
    navigator.clipboard.writeText(receipt.finalSha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proof-receipt-title"
      className="fixed inset-0 z-50 bg-[#142321]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-[#FAF8F4] border-2 border-[#0B3D3A] rounded-xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto print:border-none print:shadow-none print:p-0 print:max-h-none print:bg-white">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E4DFD3] print:border-black">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#17806D] mb-1">
              <ShieldCheck className="w-4 h-4 text-[#17806D]" />
              <span>Nirnay Sutra (निर्णय सूत्र) · Tamper-Evident Proof Receipt</span>
            </div>
            <h2
              id="proof-receipt-title"
              className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]"
            >
              Proof Receipt: {receipt.contentTitle}
            </h2>
            <p className="text-xs text-[#526360] mt-1">
              Receipt ID: <code className="font-mono-tabular font-medium">{receipt.receiptId}</code> · Approved {receipt.approvedAt}
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0B3D3A] border border-[#0B3D3A]/40 hover:bg-[#0B3D3A] hover:text-[#FAF8F4] rounded transition-colors cursor-pointer"
              title="Print receipt or save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#526360] hover:text-[#142321] rounded cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Watermark / Scope Note */}
        <div className="p-3 bg-[#F3EFE6] border border-[#E4DFD3] rounded text-xs text-[#364946] flex items-center gap-2.5">
          <FileCheck className="w-4 h-4 text-[#0B3D3A] shrink-0" />
          <div>
            <span className="font-semibold text-[#0B3D3A]">Verification Record: </span>
            <span>{receipt.watermarkNote}</span>
            <span className="text-[#526360] italic ml-1">(This is a cryptographic verification record, not a legal guarantee).</span>
          </div>
        </div>

        {/* Cryptographic SHA-256 Hash Card */}
        <div className="bg-white border border-[#E4DFD3] rounded-lg p-4 space-y-3 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#0B3D3A] flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#17806D]" />
              SHA-256 Cryptographic Content Digest (Computed via Web Crypto)
            </span>
            <button
              type="button"
              onClick={handleCopyHash}
              className="inline-flex items-center gap-1 text-xs text-[#17806D] hover:underline cursor-pointer font-mono-tabular"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedHash ? 'Copied!' : 'Copy Hash'}</span>
            </button>
          </div>
          <div className="p-2.5 bg-[#F3EFE6]/70 rounded font-mono-tabular text-xs text-[#0B3D3A] break-all border border-[#E4DFD3]">
            {receipt.finalSha256Hash}
          </div>
        </div>

        {/* Approval & Sign-Off Attribution */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono-tabular">
          <div className="p-3.5 bg-white border border-[#E4DFD3] rounded-lg">
            <span className="text-[#526360] block mb-1">Approved By:</span>
            <div className="flex items-center gap-2 font-semibold text-[#0B3D3A]">
              <User className="w-3.5 h-3.5 text-[#17806D]" />
              <span>{receipt.approvedBy} ({receipt.approvedByRole})</span>
            </div>
          </div>

          <div className="p-3.5 bg-white border border-[#E4DFD3] rounded-lg">
            <span className="text-[#526360] block mb-1">Approved At:</span>
            <div className="flex items-center gap-2 font-semibold text-[#0B3D3A]">
              <Clock className="w-3.5 h-3.5 text-[#17806D]" />
              <span>{receipt.approvedAt}</span>
            </div>
          </div>

          <div className="p-3.5 bg-white border border-[#E4DFD3] rounded-lg">
            <span className="text-[#526360] block mb-1">AI Service Used:</span>
            <div className="flex items-center gap-2 font-semibold text-[#0B3D3A]">
              <Sparkles className="w-3.5 h-3.5 text-[#17806D]" />
              <span>{receipt.aiServiceUsed}</span>
            </div>
          </div>
        </div>

        {/* Changes Attribution Breakdown (AI vs Human) */}
        <div className="p-4 bg-white border border-[#E4DFD3] rounded-lg space-y-2 text-xs">
          <span className="font-semibold text-[#0B3D3A] block">Change Attribution:</span>
          <div className="grid grid-cols-3 gap-3 font-mono-tabular text-center">
            <div className="p-2 bg-[#7FD1BF]/20 rounded border border-[#7FD1BF]/40">
              <span className="text-lg font-bold text-[#0B3D3A] block">{receipt.changesAttribution.aiChangedCount}</span>
              <span className="text-[11px] text-[#526360]">AI Suggestions Accepted</span>
            </div>
            <div className="p-2 bg-[#F3EFE6] rounded border border-[#E4DFD3]">
              <span className="text-lg font-bold text-[#0B3D3A] block">{receipt.changesAttribution.personChangedCount}</span>
              <span className="text-[11px] text-[#526360]">Human Custom Edits</span>
            </div>
            <div className="p-2 bg-[#FEF3C7] rounded border border-[#FDE68A]">
              <span className="text-lg font-bold text-[#B45309] block">{receipt.changesAttribution.dismissedCount}</span>
              <span className="text-[11px] text-[#526360]">Intentional Exceptions</span>
            </div>
          </div>
        </div>

        {/* Brand Rules Checked */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-[#0B3D3A] block">
            Approved Brand Library Sources Checked ({receipt.sourcesChecked.length}):
          </span>
          <div className="border border-[#E4DFD3] rounded-lg divide-y divide-[#E4DFD3] bg-white text-xs">
            {receipt.sourcesChecked.map((src) => (
              <div key={src.sourceId} className="p-3 flex items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-[#0B3D3A] mr-2">[{src.sourceId}]</span>
                  <span className="text-[#142321]">{src.sourceTitle}</span>
                  <span className="text-[#526360] text-[11px] ml-2">({src.sourceType})</span>
                </div>
                <span className="font-mono-tabular text-[11px] text-[#526360] shrink-0">
                  Last verified: {src.lastVerified}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Findings Log Table */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-[#0B3D3A] block">
            Verification &amp; Resolution Log ({receipt.findingsLog.length} items):
          </span>
          <div className="border border-[#E4DFD3] rounded-lg overflow-x-auto bg-white text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#F3EFE6] border-b border-[#E4DFD3] text-[11px] text-[#526360]">
                <tr>
                  <th className="py-2 px-3 font-semibold">Flagged Text</th>
                  <th className="py-2 px-3 font-semibold">Source Cited</th>
                  <th className="py-2 px-3 font-semibold">Outcome</th>
                  <th className="py-2 px-3 font-semibold">Applied Text</th>
                  <th className="py-2 px-3 font-semibold">Author</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DFD3]">
                {receipt.findingsLog.map((f) => (
                  <tr key={f.findingId} className="hover:bg-[#FAF8F4]">
                    <td className="py-2 px-3 font-mono-tabular text-[#991B1B]">"{f.quotedText}"</td>
                    <td className="py-2 px-3 font-mono-tabular text-[#0B3D3A]">{f.sourceId}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          f.outcome === 'accepted'
                            ? 'bg-[#7FD1BF]/25 text-[#0B3D3A]'
                            : f.outcome === 'edited'
                            ? 'bg-[#FEF3C7] text-[#B45309]'
                            : 'bg-[#FEE2E2] text-[#991B1B]'
                        }`}
                      >
                        {f.outcome}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[#142321]">{f.appliedText || '—'}</td>
                    <td className="py-2 px-3 font-mono-tabular text-[11px] text-[#526360]">
                      {f.changeAuthor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive "Verify Receipt" Box */}
        <div className="p-4 bg-[#F3EFE6]/80 border border-[#0B3D3A]/30 rounded-lg space-y-3 text-xs print:hidden">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#0B3D3A] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#17806D]" />
              Verify Receipt: Paste Final Content to Re-Verify
            </span>
            {computedVerifyHash && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                  isHashMatch
                    ? 'bg-[#7FD1BF]/30 text-[#0B3D3A] border border-[#17806D]'
                    : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'
                }`}
              >
                {isHashMatch ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {isHashMatch ? 'Match: Content is unchanged' : 'No match: Content has changed!'}
              </span>
            )}
          </div>
          <p className="text-[#526360]">
            Paste the publication content here. Nirnay Sutra recomputes the SHA-256 hash in your browser and verifies that not a single word has been altered since sign-off.
          </p>
          <textarea
            rows={3}
            value={verifyInputText}
            onChange={(e) => setVerifyInputText(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E4DFD3] rounded font-mono-tabular text-xs"
            placeholder="Paste text to recompute hash..."
          />
          <div className="flex items-center justify-between">
            <span className="font-mono-tabular text-[11px] text-[#526360] break-all">
              Recomputed: {computedVerifyHash || '—'}
            </span>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-3 py-1.5 bg-[#0B3D3A] text-[#FAF8F4] font-medium rounded hover:bg-[#17806D] transition-colors cursor-pointer shrink-0"
            >
              {isVerifying ? 'Computing...' : 'Re-Check Hash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
