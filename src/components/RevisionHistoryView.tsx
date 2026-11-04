import React, { useState, useMemo } from 'react';
import { ContentItem } from '../types';
import { EditorialEmptyCard } from './EditorialEmptyStates';

interface RevisionHistoryViewProps {
  items: ContentItem[];
  selectedItemId: string;
  onSelectItem: (id: string) => void;
  onOpenStudio?: () => void;
}

interface DiffToken {
  type: 'same' | 'removed' | 'added';
  text: string;
}

function computeWordDiff(oldText: string, newText: string): DiffToken[] {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  // LCS-based word diff for clean visual inspection
  const m = oldWords.length;
  const n = newWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldWords[i] === newWords[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (oldWords[i] === newWords[j]) {
      result.push({ type: 'same', text: oldWords[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'removed', text: oldWords[i] });
      i++;
    } else {
      result.push({ type: 'added', text: newWords[j] });
      j++;
    }
  }
  while (i < m) {
    result.push({ type: 'removed', text: oldWords[i++] });
  }
  while (j < n) {
    result.push({ type: 'added', text: newWords[j++] });
  }

  return result;
}

export const RevisionHistoryView: React.FC<RevisionHistoryViewProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  onOpenStudio,
}) => {
  const currentItem =
    items.find((i) => i.id === selectedItemId) || items[0];

  const versions = currentItem?.versions || [];
  const [leftVerIdx, setLeftVerIdx] = useState<number>(0);
  const [rightVerIdx, setRightVerIdx] = useState<number>(
    Math.max(0, versions.length - 1)
  );

  // Ensure indices stay valid when switching items
  const safeLeftIdx = Math.min(leftVerIdx, Math.max(0, versions.length - 1));
  const safeRightIdx = Math.min(
    rightVerIdx >= versions.length ? versions.length - 1 : rightVerIdx,
    Math.max(0, versions.length - 1)
  );

  const leftVersion = versions[safeLeftIdx] || versions[0];
  const rightVersion = versions[safeRightIdx] || versions[versions.length - 1];

  const wordDiff = useMemo(() => {
    if (!leftVersion || !rightVersion) return [];
    return computeWordDiff(leftVersion.contentText, rightVersion.contentText);
  }, [leftVersion, rightVersion]);

  if (!currentItem || versions.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#E4DFD3]">
          <div>
            <div className="text-xs text-[#526360] mb-1">
              <span>Version Lineage &amp; Side-by-Side Diff</span>
              <span aria-hidden="true" className="mx-2">·</span>
              <span>0 Recorded Versions</span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
              Revision History &amp; Diff Inspector
            </h1>
          </div>
        </div>

        <EditorialEmptyCard
          illustration="history"
          heading="No versions yet. History appears after the first save."
          explanation="Every time a draft is created, checked, or updated in Review Studio, Nirnay Sutra records a timestamped snapshot for side-by-side comparison."
          primaryAction={
            onOpenStudio
              ? {
                  label: 'Open Review Studio',
                  onClick: onOpenStudio,
                }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#E4DFD3]">
        <div>
          <div className="text-xs text-[#526360] mb-1">
            <span>Version Lineage & Side-by-Side Diff</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>{versions.length} Recorded Versions</span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
            Revision History & Diff Inspector
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-[#526360]">Content Item:</label>
          <select
            value={currentItem.id}
            onChange={(e) => {
              onSelectItem(e.target.value);
              const nextItem = items.find((i) => i.id === e.target.value);
              if (nextItem) {
                setLeftVerIdx(0);
                setRightVerIdx(Math.max(0, nextItem.versions.length - 1));
              }
            }}
            className="px-3 py-2 text-xs font-medium bg-[#FAF8F4] border border-[#E4DFD3] rounded"
          >
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.id}: {it.title} ({it.versions.length} versions)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Version Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#F3EFE6]/70 border border-[#E4DFD3] rounded">
        <div>
          <label className="block text-xs font-medium text-[#0B3D3A] mb-1">
            Base Version (Left Pane)
          </label>
          <select
            value={safeLeftIdx}
            onChange={(e) => setLeftVerIdx(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded font-mono-tabular"
          >
            {versions.map((v, idx) => (
              <option key={v.versionNumber} value={idx}>
                v{v.versionNumber} · {v.timestamp} · {v.authorName} ({v.authorRole})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#0B3D3A] mb-1">
            Comparison Version (Right Pane)
          </label>
          <select
            value={safeRightIdx}
            onChange={(e) => setRightVerIdx(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded font-mono-tabular"
          >
            {versions.map((v, idx) => (
              <option key={v.versionNumber} value={idx}>
                v{v.versionNumber} · {v.timestamp} · {v.authorName} ({v.authorRole})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Diff Columns */}
      {leftVersion && rightVersion && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Version Card */}
          <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-4">
            <div className="pb-3 border-b border-[#E4DFD3] flex items-center justify-between text-xs font-mono-tabular">
              <span className="font-semibold text-[#0B3D3A]">
                Version v{leftVersion.versionNumber} (Base)
              </span>
              <span className="text-[#526360]">
                {leftVersion.authorName} · {leftVersion.authorRole} · {leftVersion.timestamp}
              </span>
            </div>
            <p className="text-xs text-[#526360] italic">
              Change Summary: “{leftVersion.summary}”
            </p>
            <div className="p-4 bg-[#F3EFE6]/40 border border-[#E4DFD3] rounded whitespace-pre-wrap text-sm leading-relaxed">
              {wordDiff.map((tok, i) => {
                if (tok.type === 'added') return null;
                return (
                  <span
                    key={i}
                    className={
                      tok.type === 'removed'
                        ? 'bg-[#FEE2E2] text-[#991B1B] line-through px-0.5 rounded-xs'
                        : ''
                    }
                  >
                    {tok.text}
                  </span>
                );
              })}
            </div>
            <div className="text-xs font-mono-tabular text-[#526360] pt-2 border-t border-[#E4DFD3]">
              Alt Text: “{leftVersion.imageAltText || '(empty)'}”
              {leftVersion.bannerConfig && (
                <span className="ml-3">
                  · Banner Hex: {leftVersion.bannerConfig.fgHex} on {leftVersion.bannerConfig.bgHex}
                </span>
              )}
            </div>
          </div>

          {/* Right Version Card */}
          <div className="border border-[#0B3D3A] bg-[#FAF8F4] rounded p-6 space-y-4">
            <div className="pb-3 border-b border-[#E4DFD3] flex items-center justify-between text-xs font-mono-tabular">
              <span className="font-semibold text-[#17806D]">
                Version v{rightVersion.versionNumber} (Compared)
              </span>
              <span className="text-[#526360]">
                {rightVersion.authorName} · {rightVersion.authorRole} · {rightVersion.timestamp}
              </span>
            </div>
            <p className="text-xs text-[#0B3D3A] font-medium">
              Change Summary: “{rightVersion.summary}”
            </p>
            <div className="p-4 bg-[#F3EFE6]/40 border border-[#E4DFD3] rounded whitespace-pre-wrap text-sm leading-relaxed">
              {wordDiff.map((tok, i) => {
                if (tok.type === 'removed') return null;
                return (
                  <span
                    key={i}
                    className={
                      tok.type === 'added'
                        ? 'bg-[#7FD1BF]/45 text-[#0B3D3A] font-medium px-0.5 rounded-xs'
                        : ''
                    }
                  >
                    {tok.text}
                  </span>
                );
              })}
            </div>
            <div className="text-xs font-mono-tabular text-[#526360] pt-2 border-t border-[#E4DFD3]">
              Alt Text: “{rightVersion.imageAltText || '(empty)'}”
              {rightVersion.bannerConfig && (
                <span className="ml-3">
                  · Banner Hex: {rightVersion.bannerConfig.fgHex} on {rightVersion.bannerConfig.bgHex}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chronological Version Ledger */}
      <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6">
        <h2 className="font-serif-display text-base font-semibold text-[#0B3D3A] mb-4">
          Complete Revision Timeline for {currentItem.id}
        </h2>
        <div className="divide-y divide-[#E4DFD3] text-xs">
          {versions
            .slice()
            .reverse()
            .map((v) => (
              <div
                key={v.versionNumber}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-mono-tabular font-semibold text-[#0B3D3A] mr-2">
                    v{v.versionNumber}
                  </span>
                  <span className="text-[#142321] font-medium">{v.summary}</span>
                </div>
                <div className="text-[#526360] font-mono-tabular shrink-0">
                  <span>{v.authorName} ({v.authorRole})</span>
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  <span>{v.timestamp}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
