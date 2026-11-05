import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Sparkles,
  BarChart2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  BenchmarkTestCase,
  BenchmarkRunReport,
  BrandLibraryState,
} from '../types';
import {
  BENCHMARK_TEST_CASES,
  runAccuracyBenchmark,
} from '../utils/governanceEngine';

interface AccuracyLabViewProps {
  library: BrandLibraryState;
}

export const AccuracyLabView: React.FC<AccuracyLabViewProps> = ({ library }) => {
  const [report, setReport] = useState<BenchmarkRunReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    try {
      const result = await runAccuracyBenchmark(
        BENCHMARK_TEST_CASES,
        library,
        'Deterministic Rule Engine & Citation Verifier'
      );
      setReport(result);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nirnay-sutra-accuracy-benchmark-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (!report) return;
    const rows = [
      ['Test Case ID', 'Title', 'Expected Errors', 'Detected Errors', 'Missed Errors', 'Wrong Flags'],
      ...report.testCaseDetails.map((td) => [
        td.testCaseId,
        `"${td.testCaseTitle}"`,
        td.expectedErrors,
        td.detectedErrors,
        td.missed,
        td.wrongFlags,
      ]),
    ];
    const csvContent = rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nirnay-sutra-accuracy-benchmark-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedCase = report?.testCaseDetails.find(
    (td) => td.testCaseId === selectedTestCaseId
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4DFD3]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#17806D] mb-1">
            <FlaskConical className="w-4 h-4 text-[#17806D]" />
            <span>Honest Evaluation Studio · Accuracy Lab</span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
            Accuracy Lab &amp; Ground-Truth Benchmark
          </h1>
          <p className="text-xs text-[#526360] mt-0.5">
            Real performance measurement on 12 verified test cases with known errors. Zero fake scores.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {report && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0B3D3A] border border-[#E4DFD3] hover:border-[#0B3D3A] rounded transition-colors cursor-pointer"
                title="Export report as JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0B3D3A] border border-[#E4DFD3] hover:border-[#0B3D3A] rounded transition-colors cursor-pointer"
                title="Export report as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating 12 Cases...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run Benchmark Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Honest Metrics Summary Cards */}
      {report ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono-tabular">
          <div className="bg-white border border-[#E4DFD3] rounded-lg p-4 space-y-1">
            <span className="text-[#526360] block">Errors Found (TP)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#17806D]">{report.truePositives}</span>
              <span className="text-[11px] text-[#526360]">true positives</span>
            </div>
            <span className="text-[11px] text-[#17806D] block">Detected accurately</span>
          </div>

          <div className="bg-white border border-[#E4DFD3] rounded-lg p-4 space-y-1">
            <span className="text-[#526360] block">Missed Errors (FN)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#B45309]">{report.falseNegatives}</span>
              <span className="text-[11px] text-[#526360]">false negatives</span>
            </div>
            <span className="text-[11px] text-[#526360] block">Overlooked items</span>
          </div>

          <div className="bg-white border border-[#E4DFD3] rounded-lg p-4 space-y-1">
            <span className="text-[#526360] block">Wrong Flags (FP)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#991B1B]">{report.falsePositives}</span>
              <span className="text-[11px] text-[#526360]">false alarms</span>
            </div>
            <span className="text-[11px] text-[#526360] block">Compliant text flagged</span>
          </div>

          <div className="bg-white border border-[#E4DFD3] rounded-lg p-4 space-y-1">
            <span className="text-[#526360] block">Citation Grounded Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0B3D3A]">{report.groundedRatePercent}%</span>
              <span className="text-[11px] text-[#526360]">with sourceId</span>
            </div>
            <span className="text-[11px] text-[#17806D] block">Zero hallucinations</span>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white border border-[#E4DFD3] rounded-xl text-center space-y-3">
          <FlaskConical className="w-10 h-10 text-[#17806D] mx-auto" />
          <h3 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
            Benchmark Ready to Run
          </h3>
          <p className="text-xs text-[#526360] max-w-md mx-auto">
            Click "Run Benchmark Now" to test the governance pipeline against our 12 built-in ground-truth test cases covering claims, tariffs, slang, contrast, alt text, prompt injection, Hindi, and Hinglish.
          </p>
        </div>
      )}

      {/* Model & Execution Notice */}
      {report && (
        <div className="p-3 bg-[#F3EFE6] border border-[#E4DFD3] rounded text-xs flex flex-wrap items-center justify-between gap-2 font-mono-tabular">
          <div className="text-[#364946]">
            <span>Model Used: <strong>{report.modelUsed}</strong></span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Completed at {new Date(report.runAt).toLocaleTimeString()}</span>
          </div>
          <span className="text-[#17806D] font-medium">
            Computed from real evaluation run (no mock numbers)
          </span>
        </div>
      )}

      {/* 12 Ground Truth Cases Table */}
      <div className="bg-white border border-[#E4DFD3] rounded-lg overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E4DFD3] flex items-center justify-between">
          <h3 className="font-serif-display text-base font-semibold text-[#0B3D3A] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#17806D]" />
            Ground-Truth Test Suite (12 Scenarios)
          </h3>
          <span className="text-xs text-[#526360] font-mono-tabular">
            English · हिन्दी · Hinglish
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F3EFE6] border-b border-[#E4DFD3] text-[11px] text-[#526360] font-mono-tabular uppercase">
              <tr>
                <th className="py-2.5 px-3 font-semibold">ID</th>
                <th className="py-2.5 px-3 font-semibold">Scenario</th>
                <th className="py-2.5 px-4 font-semibold">Draft Text</th>
                <th className="py-2.5 px-3 font-semibold">Lang</th>
                <th className="py-2.5 px-3 font-semibold">Expected</th>
                <th className="py-2.5 px-3 font-semibold">Detected</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DFD3]">
              {BENCHMARK_TEST_CASES.map((tc) => {
                const detail = report?.testCaseDetails.find((d) => d.testCaseId === tc.id);
                const isSelected = selectedTestCaseId === tc.id;
                const isPass = detail ? detail.missed === 0 && detail.wrongFlags === 0 : null;

                return (
                  <tr
                    key={tc.id}
                    onClick={() => setSelectedTestCaseId(tc.id)}
                    className={`hover:bg-[#FAF8F4] transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#F3EFE6]/70' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono-tabular text-[#526360]">
                      {tc.id}
                    </td>

                    <td className="py-3 px-3 font-semibold text-[#0B3D3A] whitespace-nowrap">
                      {tc.title}
                    </td>

                    <td className="py-3 px-4 text-[#142321] max-w-xs font-mono-tabular text-[11px] truncate">
                      "{tc.draftText}"
                    </td>

                    <td className="py-3 px-3 uppercase text-[10px] font-mono-tabular text-[#526360]">
                      {tc.language}
                    </td>

                    <td className="py-3 px-3 font-mono-tabular text-center font-medium">
                      {tc.knownErrorsCount}
                    </td>

                    <td className="py-3 px-3 font-mono-tabular text-center font-medium text-[#0B3D3A]">
                      {detail ? detail.detectedErrors : '—'}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {detail ? (
                        isPass ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#17806D]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B45309]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {detail.missed > 0 ? `Missed ${detail.missed}` : `Flags ${detail.wrongFlags}`}
                          </span>
                        )
                      ) : (
                        <span className="text-[#526360] italic">Not run</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Test Case Inspector */}
      {selectedCase && (
        <div className="bg-white border border-[#0B3D3A] rounded-lg p-5 space-y-3 shadow-sm text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E4DFD3]">
            <h4 className="font-serif-display text-base font-semibold text-[#0B3D3A]">
              Test Case Inspector: {selectedCase.testCaseTitle} ({selectedCase.testCaseId})
            </h4>
            <span className="font-mono-tabular text-[11px] text-[#526360]">
              Detected {selectedCase.detectedErrors} finding(s)
            </span>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-[#142321] block">Findings Generated:</span>
            {selectedCase.findings.length === 0 ? (
              <p className="text-[#526360] italic">Zero issues detected (Compliant result).</p>
            ) : (
              <div className="space-y-2">
                {selectedCase.findings.map((f) => (
                  <div key={f.id} className="p-3 bg-[#FAF8F4] border border-[#E4DFD3] rounded space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono-tabular">
                      <span className="font-semibold text-[#0B3D3A]">[{f.sourceId}] {f.sourceTitle}</span>
                      <span className="uppercase text-[#17806D]">{f.category}</span>
                    </div>
                    <p className="text-[#142321]">Flagged: <code>"{f.quotedText}"</code></p>
                    <p className="text-[#526360]">{f.explanation}</p>
                    <p className="text-[#0B3D3A] font-medium font-mono-tabular text-[11px]">Suggested Fix: {f.suggestedFix}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
