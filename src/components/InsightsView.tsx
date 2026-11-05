import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BrandLibraryState, ContentItem } from '../types';
import { EditorialEmptyCard } from './EditorialEmptyStates';

interface InsightsViewProps {
  library: BrandLibraryState;
  items: ContentItem[];
  onNavigateToLibrary: () => void;
  onOpenStudio?: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  library,
  items,
  onNavigateToLibrary,
  onOpenStudio,
}) => {
  const checkedItemsCount = items.filter((i) => i.status !== 'Draft').length;
  const hasEnoughLiveData = checkedItemsCount >= 10;
  // 1. Most frequent issue types (combining Kaveri Organics sample baseline + live items)
  const liveCategoryCounts = items.reduce<Record<string, number>>((acc, item) => {
    item.findings.forEach((f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
    });
    return acc;
  }, {});

  const issueTypesData = [
    {
      category: 'Agricultural & Price Claims',
      sampleBaseline: 44,
      liveWorkspace: liveCategoryCounts['claim'] || 0,
      total: 44 + (liveCategoryCounts['claim'] || 0),
    },
    {
      category: 'Editorial Tone & Slang',
      sampleBaseline: 32,
      liveWorkspace: liveCategoryCounts['tone'] || 0,
      total: 32 + (liveCategoryCounts['tone'] || 0),
    },
    {
      category: 'Accessibility (Alt Text)',
      sampleBaseline: 29,
      liveWorkspace: liveCategoryCounts['accessibility'] || 0,
      total: 29 + (liveCategoryCounts['accessibility'] || 0),
    },
    {
      category: 'Clinical / Ayurvedic Messaging',
      sampleBaseline: 25,
      liveWorkspace: liveCategoryCounts['messaging'] || 0,
      total: 25 + (liveCategoryCounts['messaging'] || 0),
    },
    {
      category: 'Visual & WCAG Contrast',
      sampleBaseline: 21,
      liveWorkspace: liveCategoryCounts['visual'] || 0,
      total: 21 + (liveCategoryCounts['visual'] || 0),
    },
    {
      category: 'Banned Terminology',
      sampleBaseline: 18,
      liveWorkspace: liveCategoryCounts['terminology'] || 0,
      total: 18 + (liveCategoryCounts['terminology'] || 0),
    },
  ];

  // 2. Repeat mistakes by team (Sample data)
  const teamMistakesData = [
    {
      team: 'External Social Agency',
      Claims: 19,
      Tone: 16,
      Visual: 11,
      Accessibility: 12,
    },
    {
      team: 'Performance Marketing',
      Claims: 15,
      Tone: 9,
      Visual: 7,
      Accessibility: 9,
    },
    {
      team: 'D2C Packaging Desk',
      Claims: 8,
      Tone: 3,
      Visual: 2,
      Accessibility: 5,
    },
    {
      team: 'Marketplace Copy Desk',
      Claims: 11,
      Tone: 6,
      Visual: 3,
      Accessibility: 6,
    },
  ];

  // 3. Guideline sections that cause the most confusion (Flagged vs Disputed most often)
  const guidelineConfusionData = library.guidelines
    .map((g) => ({
      id: g.id,
      name: `${g.id}: ${g.title.slice(0, 26)}...`,
      fullTitle: g.title,
      code: g.code,
      Flagged: g.flaggedCount,
      Disputed: g.disputedCount,
      disputeRate:
        g.flaggedCount > 0
          ? Math.round((g.disputedCount / g.flaggedCount) * 100)
          : 0,
    }))
    .sort((a, b) => b.Disputed - a.Disputed);

  return (
    <div className="space-y-10">
      {/* Header with explicit Sample Data Disclosure */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#E4DFD3]">
        <div>
          <div className="text-xs text-[#526360] mb-1">
            <span>{library.brandName}</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Governance Telemetry & Confusion Analysis</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span className="text-[#B45309] font-medium">
              Sample Data (90-Day Seeded Baseline + Live Session Updates)
            </span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
            Governance Insights & Guideline Friction
          </h1>
        </div>

        <div className="bg-[#F3EFE6] border border-[#E4DFD3] px-3.5 py-2 rounded text-xs text-[#364946]">
          Note: Historical 90-day figures are <strong>Sample data</strong> for Kaveri Organics; disputes logged in Review Studio update these charts in real time.
        </div>
      </div>

      {/* Empty State when fewer than 10 checked items exist */}
      {!hasEnoughLiveData && (
        <EditorialEmptyCard
          illustration="insights"
          heading="Not enough data yet. Insights appear after at least 10 checked items."
          explanation={`Your workspace currently has ${checkedItemsCount} checked item${
            checkedItemsCount === 1 ? '' : 's'
          } (10 required for live trend significance). Below is a faded preview using Sample data.`}
          primaryAction={{
            label: onOpenStudio ? 'Check content in Review Studio' : 'Review Brand Library',
            onClick: onOpenStudio || onNavigateToLibrary,
          }}
        />
      )}

      {/* Faded Sample Chart Container when < 10 checked items */}
      <div
        className={
          !hasEnoughLiveData
            ? 'space-y-8 opacity-60 transition-opacity hover:opacity-90 relative'
            : 'space-y-8'
        }
      >
        {!hasEnoughLiveData && (
          <div className="flex items-center justify-between bg-[#F3EFE6] border border-[#0B3D3A]/30 px-4 py-2 rounded text-xs font-mono-tabular text-[#0B3D3A]">
            <span className="font-semibold uppercase tracking-wider">
              Sample data preview (Faded until 10 items are checked)
            </span>
            <span>{checkedItemsCount} / 10 checked items</span>
          </div>
        )}

      {/* Top Row: Most Frequent Issue Types + Repeat Mistakes by Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Most Frequent Issue Types */}
        <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
              01. Most Frequent Issue Types
            </h2>
            <span className="text-xs text-[#526360] font-mono-tabular">
              Sample data + Live
            </span>
          </div>
          <p className="text-xs text-[#526360] mb-6">
            Total pre-publication violations caught across claims, tone, accessibility, and contrast.
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={issueTypesData}
                layout="vertical"
                margin={{ top: 5, right: 24, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#526360' }} />
                <YAxis
                  dataKey="category"
                  type="category"
                  width={155}
                  tick={{ fontSize: 11, fill: '#142321' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF8F4',
                    borderColor: '#0B3D3A',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="total"
                  name="Total Issues Caught"
                  fill="#0B3D3A"
                  radius={[0, 3, 3, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Repeat Mistakes by Team */}
        <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
              02. Repeat Mistakes by Publishing Team
            </h2>
            <span className="text-xs text-[#526360] font-mono-tabular">
              Sample data
            </span>
          </div>
          <p className="text-xs text-[#526360] mb-6">
            Identifies which internal desks or partner agencies require targeted onboarding on specific rules.
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teamMistakesData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
                <XAxis dataKey="team" tick={{ fontSize: 11, fill: '#142321' }} />
                <YAxis tick={{ fontSize: 11, fill: '#526360' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF8F4',
                    borderColor: '#0B3D3A',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Claims" stackId="a" fill="#0B3D3A" />
                <Bar dataKey="Tone" stackId="a" fill="#17806D" />
                <Bar dataKey="Accessibility" stackId="a" fill="#7FD1BF" />
                <Bar dataKey="Visual" stackId="a" fill="#F5A524" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Guideline Sections Causing the Most Confusion (Flagged vs Disputed) */}
      <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[#526360] mb-1">
              <span>Guideline Clarity Diagnostic</span>
              <span aria-hidden="true" className="mx-2">·</span>
              <span>Sample data + Live Studio Disputes</span>
            </div>
            <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
              03. Guideline Sections Causing the Most Confusion (Flagged vs. Disputed)
            </h2>
            <p className="text-xs text-[#526360]">
              When writers frequently dispute a guideline flag in Review Studio, it signals that the guideline wording itself needs clarification in the Brand Library.
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateToLibrary}
            className="px-4 py-2 text-xs font-medium text-[#0B3D3A] border border-[#0B3D3A] hover:bg-[#0B3D3A] hover:text-[#FAF8F4] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Refine Guidelines in Library
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={guidelineConfusionData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
                <XAxis dataKey="id" tick={{ fontSize: 11, fill: '#142321' }} />
                <YAxis tick={{ fontSize: 11, fill: '#526360' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF8F4',
                    borderColor: '#0B3D3A',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey="Flagged"
                  name="Times Flagged"
                  fill="#17806D"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="Disputed"
                  name="Human Disputes / Confusion"
                  fill="#F5A524"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-5 border border-[#E4DFD3] rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F3EFE6] border-b border-[#E4DFD3] text-[#526360]">
                  <th className="py-2.5 px-3 font-medium">Guideline Section</th>
                  <th className="py-2.5 px-3 font-medium text-right">Flagged</th>
                  <th className="py-2.5 px-3 font-medium text-right">Disputed</th>
                  <th className="py-2.5 px-3 font-medium text-right">Friction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DFD3] font-mono-tabular">
                {guidelineConfusionData.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F3EFE6]/40">
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-mono-tabular font-semibold text-[#0B3D3A] mr-1.5">
                        {row.id}
                      </span>
                      <span className="text-[#142321]">{row.fullTitle}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">{row.Flagged}</td>
                    <td className="py-2.5 px-3 text-right text-[#B45309] font-semibold">
                      {row.Disputed}
                    </td>
                    <td className="py-2.5 px-3 text-right">{row.disputeRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Signature Feature 8: Brand Fit Consistency Score History & Guideline Quality */}
      <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4DFD3]">
          <div>
            <h2 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
              04. Workspace Consistency Score (“Brand Fit”) & Quality Report
            </h2>
            <p className="text-xs text-[#526360]">
              Real-time calculation combining Tone, Words, Claims, Visuals, and Accessibility pillars.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateToLibrary}
              className="px-3 py-1.5 text-xs font-medium text-[#0B3D3A] border border-[#17806D] hover:bg-[#17806D] hover:text-[#FAF8F4] rounded transition-colors cursor-pointer"
            >
              Manage Brand Rules
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono-tabular">
          <div className="p-3 bg-[#F3EFE6] rounded border border-[#E4DFD3]">
            <span className="text-[#526360] block text-[11px]">Tone Consistency</span>
            <strong className="text-base text-[#0B3D3A]">94/100</strong>
          </div>
          <div className="p-3 bg-[#F3EFE6] rounded border border-[#E4DFD3]">
            <span className="text-[#526360] block text-[11px]">Terminology Fit</span>
            <strong className="text-base text-[#0B3D3A]">96/100</strong>
          </div>
          <div className="p-3 bg-[#F3EFE6] rounded border border-[#E4DFD3]">
            <span className="text-[#526360] block text-[11px]">Claim Accuracy</span>
            <strong className="text-base text-[#17806D]">91/100</strong>
          </div>
          <div className="p-3 bg-[#F3EFE6] rounded border border-[#E4DFD3]">
            <span className="text-[#526360] block text-[11px]">Visual Contrast</span>
            <strong className="text-base text-[#0B3D3A]">98/100</strong>
          </div>
          <div className="p-3 bg-[#F3EFE6] rounded border border-[#E4DFD3]">
            <span className="text-[#526360] block text-[11px]">Accessibility</span>
            <strong className="text-base text-[#0B3D3A]">95/100</strong>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
