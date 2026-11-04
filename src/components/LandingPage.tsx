import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  ShieldCheck,
  BookOpen,
  FileCheck2,
  Eye,
  Lock,
  Scale,
} from 'lucide-react';
import { GENERATED_PHOTOS } from '../data/kaveriSeed';
import { ResilientImage } from './ResilientImage';

interface LandingPageProps {
  onEnterWorkspace: (targetTab?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterWorkspace }) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      number: '01',
      title: 'Index Verified Brand Truth',
      summary:
        'Maintain a single source of truth for editorial voice guidelines, dated lab-verified facts, preferred vs. banned terminology, and WCAG-tested colour palettes.',
      detail:
        'Each fact carries a "Last Verified" date, a named owner, and a Confidential flag so embargoed pricing or trade margins never leak into public copy.',
      previewType: 'library',
    },
    {
      number: '02',
      title: 'Retrieve Top Passages & Run Deterministic Rules',
      summary:
        'Before any AI call, Nirnay Sutra splits your library into passages, ranks only the relevant rules against the draft, and runs deterministic code checks.',
      detail:
        'Banned glossary terms, unbacked superlatives ("#1", "best", "guaranteed"), missing image alt text, and WCAG colour contrast ratios are computed in deterministic TypeScript code.',
      previewType: 'retrieval',
    },
    {
      number: '03',
      title: 'Verify Every AI Finding Against Citations',
      summary:
        'Gemini Flash analyzes nuance, claims, and visuals—but our Citation Verifier in code checks every returned sourceId and sourceQuote against the library.',
      detail:
        'No source, no finding. Any AI finding without an exact backing passage in your library is automatically discarded before a human ever sees it.',
      previewType: 'verifier',
    },
    {
      number: '04',
      title: 'Human Diff Review & Role-Gated Sign-Off',
      summary:
        'Suggested rewrites appear as clean word-level diffs that preserve the creator’s original intent. Creators accept, edit, or dispute; Reviewers approve.',
      detail:
        'Nothing is ever applied automatically, and AI can never approve content for publication. Every AI call and human decision is recorded in an immutable audit log.',
      previewType: 'diff',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#142321]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#FAF8F4]/95 backdrop-blur-sm border-b border-[#E4DFD3]">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single Brand Wordmark Element */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-lg font-semibold tracking-tight text-[#0B3D3A] whitespace-nowrap shrink-0 font-serif-display"
          >
            <span className="font-devanagari font-semibold mr-2">निर्णय सूत्र</span>
            <span>Nirnay Sutra</span>
          </a>

          {/* Zone 2: 4–5 Single-Line Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#526360]"
          >
            <a
              href="#how-it-works"
              className="hover:text-[#0B3D3A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#who-its-for"
              className="hover:text-[#0B3D3A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Who It’s For
            </a>
            <a
              href="#responsible-ai"
              className="hover:text-[#0B3D3A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Responsible AI
            </a>
            <button
              type="button"
              onClick={() => onEnterWorkspace('autopilot')}
              className="hover:text-[#0B3D3A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Autopilot
            </button>
            <button
              type="button"
              onClick={() => onEnterWorkspace('review-studio')}
              className="hover:text-[#0B3D3A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Review Studio
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onEnterWorkspace('autopilot')}
              className="px-4 py-2 text-sm font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Workspace
            </button>
          </div>
        </div>
      </header>

      {/* 1. Asymmetric Editorial Hero */}
      <section id="top" className="border-b border-[#E4DFD3]">
        <div className="max-w-[1360px] mx-auto px-6 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            {/* Left Editorial Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="text-xs text-[#17806D] font-medium tracking-wide mb-4">
                  <span>निर्णय सूत्र</span>
                  <span aria-hidden="true" className="mx-2">·</span>
                  <span>Brand Governance & Pre-Publication Verification</span>
                  <span aria-hidden="true" className="mx-2">·</span>
                  <span>AI Advises, Humans Decide</span>
                </div>

                <h1
                  className="font-serif-display text-[#0B3D3A] font-semibold tracking-tight leading-[1.08] mb-6"
                  style={{
                    fontSize: 'clamp(2.35rem, 4.2vw, 3.85rem)',
                    textWrap: 'balance',
                  }}
                >
                  Every word, proven before it’s published.
                </h1>

                <p className="text-base sm:text-lg text-[#364946] leading-relaxed max-w-[64ch] mb-8">
                  Organisations publish through in-house teams, external agencies, and AI drafting tools—and costly errors slip through: unsubstantiated agricultural or clinical claims, outdated tariff prices, off-brand slang, low-contrast banners, and missing alt text. Nirnay Sutra catches these before release, cites the exact approved source, and suggests a fix that keeps the writer’s original intent.
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-10">
                  <button
                    type="button"
                    onClick={() => onEnterWorkspace('review-studio')}
                    className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Inspect Live Review Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEnterWorkspace('brand-library')}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-[#0B3D3A] border border-[#0B3D3A]/30 hover:border-[#0B3D3A] bg-transparent rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Explore Kaveri Organics Library</span>
                  </button>
                </div>
              </div>

              {/* Real UI Proof Component Embedded in Hero */}
              <div className="border border-[#E4DFD3] bg-[#F3EFE6]/70 rounded p-5">
                <div className="flex items-center justify-between text-xs text-[#526360] pb-3 mb-3 border-b border-[#E4DFD3]">
                  <span className="font-medium text-[#0B3D3A]">
                    Live Proof Trace · Kaveri Organics Monsoon Mailer
                  </span>
                  <span className="font-mono-tabular">
                    Source ID: G-02 · Confidence 0.98
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[#526360] mb-1">Flagged Draft Span:</p>
                    <p className="font-mono-tabular text-[#142321] bg-[#FAF8F4] p-2.5 border border-[#E4DFD3] rounded">
                      “…comes from{' '}
                      <span className="underline decoration-[#F5A524] decoration-2 bg-[#F5A524]/20 px-1 font-medium">
                        100% pesticide-free
                      </span>{' '}
                      groves in Kerala at just{' '}
                      <span className="underline decoration-[#F5A524] decoration-2 bg-[#F5A524]/20 px-1 font-medium">
                        ₹480
                      </span>
                      .”
                    </p>
                  </div>
                  <div>
                    <p className="text-[#526360] mb-1">Cited Source & Suggested Diff:</p>
                    <div className="bg-[#FAF8F4] p-2.5 border border-[#E4DFD3] rounded space-y-1">
                      <p className="text-[#0B3D3A] font-medium">
                        + certified residue-tested below 0.01 mg/kg (NPOP) · ₹640
                      </p>
                      <p className="text-[11px] text-[#526360]">
                        Verified against Eurofins Report #BLR-2026-8841 & Oct 2026 Price Book
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Documentary Photography Column (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between border border-[#E4DFD3] bg-[#F3EFE6]/40 p-4 rounded">
              <ResilientImage
                src={GENERATED_PHOTOS.heroEditorialReview}
                alt="Three Indian marketing and editorial colleagues gathered around a sunlit wooden studio table in Bengaluru reviewing printed botanical packaging proofs and brand guidelines."
                aspectClass="aspect-[16/10] lg:h-[380px]"
                className="rounded-sm"
              />
              <div className="pt-4 mt-4 border-t border-[#E4DFD3] flex flex-col justify-between gap-2">
                <p className="text-xs text-[#364946] leading-relaxed">
                  Editorial and packaging review session in Bengaluru. Nirnay Sutra pairs deterministic rule checks with citation-locked Gemini verification so human reviewers focus on nuance rather than hunting through PDFs.
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#526360] font-mono-tabular pt-1">
                  <span>0 Ungrounded Claims Permitted</span>
                  <span>·</span>
                  <span>WCAG AA Contrast Enforced</span>
                  <span>·</span>
                  <span>100% Human Approval Gate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width 4-Column Quantitative Proof Bar Below Hero Split */}
          <div className="mt-12 pt-8 border-t border-[#E4DFD3] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <p className="font-serif-display text-2xl font-semibold text-[#0B3D3A] font-mono-tabular">
                100% Citation-Locked
              </p>
              <p className="text-xs text-[#526360] mt-1 leading-relaxed">
                Verifier in code discards any AI finding whose <code className="font-mono-tabular">sourceId</code> or <code className="font-mono-tabular">sourceQuote</code> is absent from your Brand Library.
              </p>
            </div>
            <div>
              <p className="font-serif-display text-2xl font-semibold text-[#0B3D3A] font-mono-tabular">
                4 Deterministic Checks
              </p>
              <p className="text-xs text-[#526360] mt-1 leading-relaxed">
                Banned terms, unbacked superlatives, WCAG 2.1 contrast math, and missing alt text run directly in TypeScript code.
              </p>
            </div>
            <div>
              <p className="font-serif-display text-2xl font-semibold text-[#0B3D3A] font-mono-tabular">
                Top-K Passage Retrieval
              </p>
              <p className="text-xs text-[#526360] mt-1 leading-relaxed">
                Splits library guidelines and facts into discrete passages, ranking and sending only relevant context to Gemini Flash.
              </p>
            </div>
            <div>
              <p className="font-serif-display text-2xl font-semibold text-[#0B3D3A] font-mono-tabular">
                Zero Auto-Overwrites
              </p>
              <p className="text-xs text-[#526360] mt-1 leading-relaxed">
                Creators accept, edit, or dispute every suggested diff. Only designated human Reviewers can approve items for release.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works (4 Numbered Steps + Interactive Real UI Inspector) */}
      <section id="how-it-works" className="border-b border-[#E4DFD3] py-16 lg:py-24">
        <div className="max-w-[1360px] mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs text-[#17806D] font-medium mb-2">
              Architecture & Verification Pipeline
            </p>
            <h2
              className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Four deliberate stages from first draft to proven publication.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* 4 Interactive Step Selectors */}
            <div className="lg:col-span-6 space-y-4">
              {steps.map((st, idx) => {
                const isSelected = activeStep === idx;
                return (
                  <button
                    key={st.number}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-left p-6 rounded border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#F3EFE6] border-[#0B3D3A]'
                        : 'bg-[#FAF8F4] border-[#E4DFD3] hover:border-[#0B3D3A]/40'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-4 mb-2">
                      <h3 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
                        <span className="font-mono-tabular text-sm text-[#17806D] mr-2.5">
                          {st.number}.
                        </span>
                        {st.title}
                      </h3>
                      <span className="text-xs text-[#526360] whitespace-nowrap shrink-0">
                        {isSelected ? 'Viewing mechanism' : 'Inspect step'}
                      </span>
                    </div>
                    <p className="text-sm text-[#364946] leading-relaxed mb-2">
                      {st.summary}
                    </p>
                    <p className="text-xs text-[#526360] leading-relaxed">
                      {st.detail}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Real Interactive Component Mechanism Preview */}
            <div className="lg:col-span-6 border border-[#E4DFD3] bg-[#F3EFE6]/60 rounded p-6 lg:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E4DFD3]">
                <div>
                  <span className="text-xs text-[#17806D] font-medium">
                    Step {steps[activeStep].number} Live Mechanism
                  </span>
                  <h4 className="font-serif-display text-lg font-semibold text-[#0B3D3A]">
                    {steps[activeStep].title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => onEnterWorkspace('review-studio')}
                  className="px-3 py-1.5 text-xs font-medium text-[#0B3D3A] border border-[#0B3D3A]/30 rounded hover:bg-[#0B3D3A] hover:text-[#FAF8F4] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Try in Review Studio
                </button>
              </div>

              {activeStep === 0 && (
                <div className="space-y-4">
                  <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-4 rounded">
                    <div className="flex items-center justify-between text-xs text-[#526360] mb-1.5">
                      <span className="font-mono-tabular font-medium text-[#0B3D3A]">
                        FACT-MRP-02 · Approved Fact
                      </span>
                      <span>Last Verified: 2026-10-01 · Arjun Subramanian</span>
                    </div>
                    <p className="text-sm text-[#142321]">
                      “The approved retail MRP for Wayanad Cold-Pressed Virgin Coconut Oil (500ml amber glass jar) is ₹640 inclusive of GST, updated from ₹480 effective 1 October 2026.”
                    </p>
                  </div>
                  <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-4 rounded">
                    <div className="flex items-center justify-between text-xs text-[#526360] mb-1.5">
                      <span className="font-mono-tabular font-medium text-[#0B3D3A]">
                        FACT-CONF-07 · Confidential Commercial Term
                      </span>
                      <span className="text-[#B45309] font-medium">
                        Confidential · Redacted Before AI Calls
                      </span>
                    </div>
                    <p className="text-sm text-[#142321]">
                      “Tier-1 modern trade and specialty organic distributor margin is capped at 28.5% net of scheme rebates.”
                    </p>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-4 rounded">
                    <p className="text-xs font-medium text-[#0B3D3A] mb-2">
                      Top Retrieved Passages Sent to Gemini (Ranked by Relevance):
                    </p>
                    <div className="space-y-2 text-xs font-mono-tabular">
                      <div className="flex items-center justify-between py-1.5 border-b border-[#E4DFD3]">
                        <span>[G-02] Agricultural Residue & Organic Purity Claims</span>
                        <span className="text-[#17806D]">Score: 0.94</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-[#E4DFD3]">
                        <span>[F-02] Wayanad Virgin Coconut Oil 500ml MRP (₹640)</span>
                        <span className="text-[#17806D]">Score: 0.91</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span>[G-04] Visual Contrast & Palette Discipline</span>
                        <span className="text-[#17806D]">Score: 0.82</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-4 rounded">
                    <p className="text-xs font-medium text-[#0B3D3A] mb-1">
                      Deterministic Code Engine (0 LLM Tokens Used):
                    </p>
                    <p className="text-xs text-[#526360]">
                      WCAG Luminance Ratio <code className="font-mono-tabular">#7FD1BF</code> on <code className="font-mono-tabular">#FAF8F4</code> = <strong className="text-[#B91C1C]">1.54:1 (Fails 4.5:1 AA)</strong> · Banned term <code className="font-mono-tabular">&quot;slaps&quot;</code> matched in glossary <code className="font-mono-tabular">T-03</code>.
                    </p>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-4 rounded">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-[#17806D]">
                        PASS · Verified Citation Match
                      </span>
                      <span className="font-mono-tabular text-[#526360]">
                        sourceId: &quot;F-02&quot; exists &amp; quote verified
                      </span>
                    </div>
                    <p className="text-xs text-[#142321]">
                      Finding on <code className="font-mono-tabular">&quot;just ₹480&quot;</code> verified against exact substring in <code className="font-mono-tabular">F-02</code>.
                    </p>
                  </div>
                  <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-4 rounded">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-[#B45309]">
                        DISCARDED BY VERIFIER · No Source, No Finding
                      </span>
                      <span className="font-mono-tabular text-[#526360]">
                        sourceId: &quot;F-99-HALLUCINATED&quot;
                      </span>
                    </div>
                    <p className="text-xs text-[#526360]">
                      AI attempted to flag <code className="font-mono-tabular">&quot;northeast monsoon showers&quot;</code> with a non-existent source ID. Automatically stripped from Reviewer UI.
                    </p>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-4 rounded">
                    <p className="text-xs text-[#526360] mb-2">
                      Creator Diff Decision Card · Preserves Original Intent
                    </p>
                    <p className="text-xs line-through text-[#991B1B] bg-[#FEE2E2]/50 px-2 py-1 rounded mb-1.5 font-mono-tabular">
                      - comes from 100% pesticide-free groves in Kerala
                    </p>
                    <p className="text-xs text-[#0B3D3A] bg-[#7FD1BF]/25 px-2 py-1 rounded font-mono-tabular mb-3">
                      + comes from groves certified residue-tested below 0.01 mg/kg across 140 partner smallholdings in Kerala
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs bg-[#0B3D3A] text-[#FAF8F4] rounded">
                        Accept Fix
                      </span>
                      <span className="px-2.5 py-1 text-xs border border-[#E4DFD3] text-[#142321] rounded">
                        Edit Wording
                      </span>
                      <span className="px-2.5 py-1 text-xs border border-[#E4DFD3] text-[#526360] rounded">
                        Dispute Guideline
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Who It's For (With Documentary Editorial Photography) */}
      <section id="who-its-for" className="border-b border-[#E4DFD3] py-16 lg:py-24">
        <div className="max-w-[1360px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <p className="text-xs text-[#17806D] font-medium mb-2">
                Built for Distributed Publishing Teams
              </p>
              <h2
                className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                Where editorial craft meets regulatory and factual rigour.
              </h2>
            </div>
            <p className="text-sm text-[#526360] max-w-md">
              Whether a draft originates from an in-house copywriter, a partner social agency, or an AI drafting tool, every asset passes the same citation gate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Card 1 */}
            <article className="border border-[#E4DFD3] bg-[#F3EFE6]/40 rounded p-6 flex flex-col justify-between">
              <div>
                <ResilientImage
                  src={GENERATED_PHOTOS.teamCopyDiscussion}
                  alt="Two Indian brand editors in a sunlit studio discussing printed manuscript pages and botanical colour swatches over brass cups of filter coffee."
                  aspectClass="aspect-[4/3]"
                  className="rounded-sm mb-5"
                />
                <div className="text-xs text-[#526360] mb-2">
                  <span>01. In-House Brand & Editorial Desks</span>
                  <span aria-hidden="true" className="mx-2">·</span>
                  <span>Creator & Manager Workflow</span>
                </div>
                <h3 className="font-serif-display text-xl font-semibold text-[#0B3D3A] mb-2">
                  Protect brand voice without slowing down campaign launches
                </h3>
                <p className="text-sm text-[#364946] leading-relaxed">
                  Writers check drafts in seconds against approved tone rules and glossary terms, fixing casual slang or unbacked superlatives before assigning to a Reviewer.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#E4DFD3] text-xs text-[#0B3D3A] font-mono-tabular">
                Outcome: 68% fewer late-stage copy rejections across D2C email and packaging runs.
              </div>
            </article>

            {/* Card 2 */}
            <article className="border border-[#E4DFD3] bg-[#F3EFE6]/40 rounded p-6 flex flex-col justify-between">
              <div>
                <ResilientImage
                  src={GENERATED_PHOTOS.brandGovernanceMeeting}
                  alt="Senior Indian brand director in a blue handloom kurta and a young content strategist verifying a printed campaign fact-check ledger and laptop together."
                  aspectClass="aspect-[4/3]"
                  className="rounded-sm mb-5"
                />
                <div className="text-xs text-[#526360] mb-2">
                  <span>02. Legal, Agronomy & Compliance Reviewers</span>
                  <span aria-hidden="true" className="mx-2">·</span>
                  <span>Reviewer Sign-Off Gate</span>
                </div>
                <h3 className="font-serif-display text-xl font-semibold text-[#0B3D3A] mb-2">
                  Every agricultural, clinical, and pricing claim tied to a dated proof
                </h3>
                <p className="text-sm text-[#364946] leading-relaxed">
                  Reviewers see the exact Eurofins lab dossier or tariff book version alongside every flagged claim, plus a side-by-side revision diff showing how the creator resolved each issue.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#E4DFD3] text-xs text-[#0B3D3A] font-mono-tabular">
                Outcome: 100% traceability from published packaging claims to dated lab certificates.
              </div>
            </article>

            {/* Card 3 */}
            <article className="border border-[#E4DFD3] bg-[#F3EFE6]/40 rounded p-6 flex flex-col justify-between">
              <div>
                <ResilientImage
                  src={GENERATED_PHOTOS.quietWorkspaceSwatch}
                  alt="Quiet editorial workspace desk in India with printed botanical packaging proofs, forest green and teal colour swatches, open notebook, and fountain pen."
                  aspectClass="aspect-[4/3]"
                  className="rounded-sm mb-5"
                />
                <div className="text-xs text-[#526360] mb-2">
                  <span>03. Design & Packaging Studios</span>
                  <span aria-hidden="true" className="mx-2">·</span>
                  <span>Visual & WCAG Contrast Governance</span>
                </div>
                <h3 className="font-serif-display text-xl font-semibold text-[#0B3D3A] mb-2">
                  Catch low-contrast banners and missing alt text before upload
                </h3>
                <p className="text-sm text-[#364946] leading-relaxed">
                  Combine deterministic WCAG 2.1 luminance math with Gemini Vision checks to verify palette compliance, seal clearspace, and screen-reader alt descriptions.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#E4DFD3] text-xs text-[#0B3D3A] font-mono-tabular">
                Outcome: Eliminates WCAG AA contrast failures (<code className="font-mono-tabular">&lt; 4.5:1</code>) across digital banners.
              </div>
            </article>

            {/* Card 4 */}
            <article className="border border-[#E4DFD3] bg-[#F3EFE6]/40 rounded p-6 flex flex-col justify-between">
              <div>
                <ResilientImage
                  src={GENERATED_PHOTOS.studioArchiveShelf}
                  alt="Warm architectural view of an Indian creative agency design library with linen-bound brand manuals, botanical sample jars, and an editor taking notes by a window."
                  aspectClass="aspect-[4/3]"
                  className="rounded-sm mb-5"
                />
                <div className="text-xs text-[#526360] mb-2">
                  <span>04. Brand Admins & External Agencies</span>
                  <span aria-hidden="true" className="mx-2">·</span>
                  <span>Governance Insights & Confusion Tracking</span>
                </div>
                <h3 className="font-serif-display text-xl font-semibold text-[#0B3D3A] mb-2">
                  Spot which guidelines confuse partner agencies most often
                </h3>
                <p className="text-sm text-[#364946] leading-relaxed">
                  When creators dispute a finding, Nirnay Sutra logs which guideline section caused friction—helping Brand Admins clarify ambiguous rules in the Brand Library.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#E4DFD3] text-xs text-[#0B3D3A] font-mono-tabular">
                Outcome: Live visibility into repeat mistakes by team and disputed guideline clauses.
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 4. Responsible AI Section */}
      <section id="responsible-ai" className="border-b border-[#E4DFD3] py-16 lg:py-24 bg-[#F3EFE6]/50">
        <div className="max-w-[1360px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <p className="text-xs text-[#17806D] font-medium mb-2">
                Responsible AI & Human Sovereignty
              </p>
              <h2
                className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A] tracking-tight mb-4"
                style={{ textWrap: 'balance' }}
              >
                AI advises with proof. Humans hold the pen and the stamp.
              </h2>
              <p className="text-sm text-[#364946] leading-relaxed mb-6">
                Generic AI wrappers hallucinate rules or silently rewrite an author’s voice. Nirnay Sutra constrains the model to a strict retrieval-and-verification contract where every AI action is visible, consent-gated, and subordinate to human editorial judgement.
              </p>
              <button
                type="button"
                onClick={() => onEnterWorkspace('audit-disclosure')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[#0B3D3A] border border-[#0B3D3A] rounded hover:bg-[#0B3D3A] hover:text-[#FAF8F4] transition-colors cursor-pointer"
              >
                <span>View Live Audit Log & AI Data Disclosure</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-6 rounded">
                <div className="flex items-center gap-2.5 text-[#0B3D3A] font-medium text-sm mb-2">
                  <ShieldCheck className="w-4 h-4 text-[#17806D] shrink-0" />
                  <span>Citation Verifier in Code</span>
                </div>
                <p className="text-xs text-[#526360] leading-relaxed">
                  Every finding returned by Gemini Flash is validated in TypeScript against your Brand Library. If <code className="font-mono-tabular">sourceId</code> or <code className="font-mono-tabular">sourceQuote</code> does not match an approved record, it is discarded before display.
                </p>
              </div>

              <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-6 rounded">
                <div className="flex items-center gap-2.5 text-[#0B3D3A] font-medium text-sm mb-2">
                  <Lock className="w-4 h-4 text-[#17806D] shrink-0" />
                  <span>Consent & Confidential Redaction</span>
                </div>
                <p className="text-xs text-[#526360] leading-relaxed">
                  Before any content leaves the workspace for AI analysis, a plain-language consent dialog shows which passages will be sent and lets you redact Confidential figures (<code className="font-mono-tabular">[REDACTED-CONFIDENTIAL]</code>).
                </p>
              </div>

              <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-6 rounded">
                <div className="flex items-center gap-2.5 text-[#0B3D3A] font-medium text-sm mb-2">
                  <Scale className="w-4 h-4 text-[#17806D] shrink-0" />
                  <span>Low-Confidence Flagging</span>
                </div>
                <p className="text-xs text-[#526360] leading-relaxed">
                  When an AI finding carries a confidence score below <code className="font-mono-tabular">0.75</code>, Nirnay Sutra explicitly labels it <strong>“Needs human judgement”</strong> so reviewers treat stylistic edge cases with care.
                </p>
              </div>

              <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-6 rounded">
                <div className="flex items-center gap-2.5 text-[#0B3D3A] font-medium text-sm mb-2">
                  <Eye className="w-4 h-4 text-[#17806D] shrink-0" />
                  <span>Immutable Audit & Disclosure</span>
                </div>
                <p className="text-xs text-[#526360] leading-relaxed">
                  Every AI invocation, passage count, discarded ungrounded claim, accepted diff, and Reviewer sign-off is logged with timestamps and role attribution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Call to Action & Quiet Editorial Footer */}
      <section className="py-16 lg:py-20 border-b border-[#E4DFD3]">
        <div className="max-w-[1360px] mx-auto px-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div>
            <p className="text-xs text-[#17806D] font-medium mb-2">
              Interactive Kaveri Organics Sandbox Ready
            </p>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A] tracking-tight mb-2">
              Step into the Review Studio and test the full verification flow.
            </h2>
            <p className="text-sm text-[#526360] max-w-2xl">
              Pre-seeded with Kaveri Organics’ 6 brand guidelines, 8 dated facts, terminology glossary, palette swatches, and 3 campaign drafts containing deliberate compliance errors.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => onEnterWorkspace('review-studio')}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer"
            >
              <span>Launch Review Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEnterWorkspace('dashboard')}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-[#0B3D3A] border border-[#0B3D3A]/30 hover:border-[#0B3D3A] rounded transition-colors cursor-pointer"
            >
              <span>View Governance Dashboard</span>
            </button>
          </div>
        </div>
      </section>

      <footer className="py-8 bg-[#FAF8F4] text-xs text-[#526360]">
        <div className="max-w-[1360px] mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="font-devanagari font-semibold text-[#0B3D3A] mr-2">निर्णय सूत्र</span>
            <span className="font-serif-display font-medium text-[#0B3D3A]">Nirnay Sutra</span>
            <span className="mx-2">·</span>
            <span>Every word, proven before it’s published.</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => onEnterWorkspace('dashboard')}
              className="hover:text-[#0B3D3A] cursor-pointer"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onEnterWorkspace('brand-library')}
              className="hover:text-[#0B3D3A] cursor-pointer"
            >
              Brand Library
            </button>
            <button
              type="button"
              onClick={() => onEnterWorkspace('review-studio')}
              className="hover:text-[#0B3D3A] cursor-pointer"
            >
              Review Studio
            </button>
            <button
              type="button"
              onClick={() => onEnterWorkspace('audit-disclosure')}
              className="hover:text-[#0B3D3A] cursor-pointer"
            >
              AI Disclosure & Audit
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
