import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  X,
  BookOpen,
  Compass,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { ActiveTab, UserRole } from '../types';

interface HelpAndTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  activeRole: UserRole;
  initialView?: 'help' | 'tour' | 'glossary';
  onNavigateToTab?: (tab: ActiveTab) => void;
}

export const GLOSSARY_TERMS: Array<{ term: string; plainMeaning: string; example?: string }> = [
  {
    term: 'Brand rules',
    plainMeaning: 'The approved guide that tells everyone what words, claims, and colors your organization allows.',
    example: 'For example: saying "certified residue-tested" instead of "pesticide-free".',
  },
  {
    term: 'Check content',
    plainMeaning: 'The tool that reads your draft text or image and compares it against your brand rules.',
    example: 'Click "Check my content" to find mistakes in seconds.',
  },
  {
    term: 'Source check',
    plainMeaning: 'A safety check in code that makes sure every AI suggestion is backed by an approved rule in your library before you see it.',
    example: 'No rule in the library means no suggestion is shown.',
  },
  {
    term: 'Finding the right guideline',
    plainMeaning: 'Finding the exact brand rules that apply to your draft, rather than searching through hundreds of pages by hand.',
    example: 'Also known as guideline retrieval.',
  },
  {
    term: 'How sure the AI is',
    plainMeaning: 'A percentage that shows how closely your draft matches an approved brand rule.',
    example: 'A score of 95% means the match is very strong.',
  },
  {
    term: 'How risky this is',
    plainMeaning: 'A simple score measuring whether content is safe to publish or needs extra human eyes.',
    example: 'Low risk can publish quickly; high risk always stops for human review.',
  },
  {
    term: 'Items that need a person',
    plainMeaning: 'Drafts that the automatic checker was not completely sure about, waiting for human decision.',
    example: 'Also known as the Autopilot exception queue.',
  },
  {
    term: 'Activity history',
    plainMeaning: 'A permanent, unchangeable record of every check, edit, comment, and approval made in the workspace.',
    example: 'Also known as the audit log.',
  },
  {
    term: 'Patterns and tips',
    plainMeaning: 'Helpful summaries showing which brand rules get broken most often so your team can improve.',
    example: 'Also known as governance insights.',
  },
  {
    term: 'Workspace',
    plainMeaning: 'The shared online home where your team keeps its brand rules, drafts, reviews, and activity.',
    example: 'Kaveri Organics is the sample workspace in this app.',
  },
  {
    term: 'Creator',
    plainMeaning: 'A team member who writes drafts, runs checks, and fixes suggestions.',
    example: 'Creators can accept suggestions and send drafts for review.',
  },
  {
    term: 'Reviewer',
    plainMeaning: 'A designated team member who checks drafts and gives human sign-off before publication.',
    example: 'Reviewers can approve content or ask for changes.',
  },
  {
    term: 'Manager',
    plainMeaning: 'A team leader who oversees content flow, assigns reviewers, and tracks team patterns.',
    example: 'Managers see team insights and unblock approval bottlenecks.',
  },
  {
    term: 'Brand Admin',
    plainMeaning: 'The workspace owner who manages brand rules, team members, and Autopilot safety settings.',
    example: 'Brand Admins have full access to configure rules and invite teammates.',
  },
  {
    term: 'Autopilot',
    plainMeaning: 'An optional helper that automatically approves very safe, low-risk drafts so people focus on tricky content.',
    example: 'You can pause Autopilot at any time with the top-bar button.',
  },
  {
    term: 'Needs fixing',
    plainMeaning: 'A serious issue like an outdated fact or banned claim that must be changed before publication.',
    example: 'Flagged with a red warning badge.',
  },
  {
    term: 'Worth a look',
    plainMeaning: 'A mild issue like tone or phrasing that you may choose to accept or dismiss.',
    example: 'Flagged with a yellow caution badge.',
  },
  {
    term: 'Needs a person to decide',
    plainMeaning: 'An issue where context matters and a human expert must make the final call.',
    example: 'Flagged with a blue decision badge.',
  },
];

export const PAGE_HELP_BULLETS: Record<
  ActiveTab,
  { title: string; oneLine: string; bullets: [string, string, string] }
> = {
  landing: {
    title: 'Editorial Overview',
    oneLine: 'Learn what Nirnay Sutra does in 10 seconds before entering the workspace.',
    bullets: [
      'See how brand rules, AI checks, and human sign-off work together.',
      'Explore live proof examples from the Kaveri Organics sample brand.',
      'Click "Open Workspace" to start checking real content.',
    ],
  },
  auth: {
    title: 'Sign In & Access',
    oneLine: 'Sign in to your team workspace or explore the demo mode.',
    bullets: [
      'Sign in securely with Google or email and password.',
      'Pick your role: Creator, Reviewer, Manager, or Brand Admin.',
      'Click "Explore the demo workspace" to try everything with sample data.',
    ],
  },
  dashboard: {
    title: 'Home',
    oneLine: 'See all drafts and their review stage at a glance.',
    bullets: [
      'Follow your role checklist at the top to complete your next task.',
      'See how many drafts are waiting for human review or changes.',
      'Click "Paste / New Draft" to check a new piece of content.',
    ],
  },
  'review-studio': {
    title: 'Check Content',
    oneLine: 'Paste text or upload an image to check it against your brand rules.',
    bullets: [
      'Click "Check my content" to find any broken rules or unproven claims.',
      'Click on any highlighted issue to see the exact brand rule and suggested fix.',
      'Accept the fix, edit it, or dismiss it with one click before sending for review.',
    ],
  },
  approvals: {
    title: 'Needs Approval',
    oneLine: 'Review drafts waiting for human sign-off and resolve items that need a person.',
    bullets: [
      'Inspect drafts submitted by your team with full source checks attached.',
      'Review items flagged by Autopilot that were not completely safe to auto-approve.',
      'Click "Approve" to clear for publication, or "Ask for changes" with notes.',
    ],
  },
  'brand-library': {
    title: 'Brand Rules',
    oneLine: 'Keep all your verified guidelines, facts, and approved terms in one place.',
    bullets: [
      'Add editorial voice guidelines, lab-verified facts, and banned words.',
      'Mark sensitive info as Confidential so trade secrets never leak into public copy.',
      'Every check uses these rules as its only source of truth.',
    ],
  },
  autopilot: {
    title: 'Autopilot Settings',
    oneLine: 'Control how safely the automatic approval checker runs for your brand.',
    bullets: [
      'Turn Autopilot on to auto-approve safe, zero-risk drafts.',
      'Inspect "Items that need a person" when an item has any doubt or risk.',
      'Use the Pause button in the top bar to stop all automatic approvals at any time.',
    ],
  },
  'revision-history': {
    title: 'Past Versions',
    oneLine: 'Compare earlier versions of a draft with word-by-word diffs.',
    bullets: [
      'See who made each change, what was fixed, and when.',
      'Compare any two versions side-by-side to verify the final wording.',
      'Restore any older version if you want to undo changes.',
    ],
  },
  insights: {
    title: 'Patterns and Tips',
    oneLine: 'See which brand rules get broken most often so your team can improve.',
    bullets: [
      'Track your team’s compliance rate and review speed over time.',
      'See which guidelines cause the most confusion for creators.',
      'Use data to update outdated guidelines and train new writers.',
    ],
  },
  'audit-disclosure': {
    title: 'Activity History',
    oneLine: 'A permanent, unchangeable record of every check, edit, and human decision.',
    bullets: [
      'Every AI call, suggestion, edit, and approval is recorded permanently.',
      'See the exact model used and confirmation that sources were checked in code.',
      'Proof that no content was published without approved guidelines.',
    ],
  },
  'team-access': {
    title: 'Team & Access',
    oneLine: 'Manage workspace members, role permissions, and invite links.',
    bullets: [
      'See everyone who has access to your workspace and what their role is.',
      'Generate invite links for Creators, Managers, or Reviewers.',
      'Approve or decline role change requests from teammates.',
    ],
  },
  privacy: {
    title: 'Privacy & Data',
    oneLine: 'Understand how your content is handled with zero public training.',
    bullets: [
      'Your drafts and brand rules stay inside your workspace and are never used to train public models.',
      'Inspect and clear your local browser storage whenever you want.',
      'Download a copy of your workspace data or delete your account completely.',
    ],
  },
};

export const HelpAndTourModal: React.FC<HelpAndTourModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  activeRole,
  initialView = 'help',
  onNavigateToTab,
}) => {
  const [activeTabSection, setActiveTabSection] = useState<'help' | 'tour' | 'glossary'>(
    initialView
  );
  const [tourStep, setTourStep] = useState<number>(0);
  const [glossaryQuery, setGlossaryQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTabSection(initialView);
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const pageInfo = PAGE_HELP_BULLETS[activeTab] || PAGE_HELP_BULLETS.dashboard;

  const filteredGlossary = GLOSSARY_TERMS.filter(
    (g) =>
      g.term.toLowerCase().includes(glossaryQuery.toLowerCase()) ||
      g.plainMeaning.toLowerCase().includes(glossaryQuery.toLowerCase())
  );

  const tourSteps = [
    {
      stepNumber: 1,
      title: '1. Add your brand rules',
      description:
        'Start in "Brand rules". Put in your approved facts, product prices, banned words, and style guides. Nirnay Sutra only checks against what is in this library.',
      actionLabel: 'Go to Brand rules',
      targetTab: 'brand-library' as ActiveTab,
    },
    {
      stepNumber: 2,
      title: '2. Check your content',
      description:
        'Open "Check content". Paste a caption, article, or upload a product banner. Click "Check my content". In seconds, the app highlights any issues.',
      actionLabel: 'Go to Check content',
      targetTab: 'review-studio' as ActiveTab,
    },
    {
      stepNumber: 3,
      title: '3. Fix the suggestions',
      description:
        'Click on any highlighted issue to see what rule it breaks. Click "Accept" to apply the fix, "Edit" to tweak the words, or "Dismiss" if it is allowed.',
      actionLabel: 'View sample suggestions',
      targetTab: 'review-studio' as ActiveTab,
    },
    {
      stepNumber: 4,
      title: '4. Human review and approval',
      description:
        'Once the draft looks clean, send it for review. A human Reviewer checks the queue in "Needs approval" and gives final sign-off before anything is published.',
      actionLabel: 'Go to Needs approval',
      targetTab: 'approvals' as ActiveTab,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B3D3A]/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-[#FAF8F4] dark:bg-[#112220] border border-[#E4DFD3] dark:border-[#1F3834] rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#E4DFD3] dark:border-[#1F3834] flex items-center justify-between bg-white dark:bg-[#142825]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#17806D]/15 dark:bg-[#2DD4BF]/20 text-[#17806D] dark:text-[#2DD4BF] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="help-modal-title"
                className="font-serif-display text-lg font-semibold text-[#0B3D3A] dark:text-[#7FD1BF]"
              >
                Help &amp; Quick Guide
              </h2>
              <p className="text-xs text-[#526360] dark:text-[#9BB0AC]">
                Everything explained in plain language · No jargon
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close help"
            className="p-1.5 rounded text-[#526360] hover:text-[#0B3D3A] dark:text-[#9BB0AC] dark:hover:text-[#F4F7F6] hover:bg-[#F3EFE6] dark:hover:bg-[#18302D] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-2 border-b border-[#E4DFD3] dark:border-[#1F3834] bg-[#F3EFE6]/60 dark:bg-[#0E1A18] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTabSection('help')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTabSection === 'help'
                ? 'bg-white dark:bg-[#142825] text-[#0B3D3A] dark:text-[#7FD1BF] shadow-xs font-semibold'
                : 'text-[#526360] dark:text-[#9BB0AC] hover:text-[#0B3D3A] dark:hover:text-[#F4F7F6]'
            }`}
          >
            How this page works
          </button>
          <button
            type="button"
            onClick={() => setActiveTabSection('tour')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTabSection === 'tour'
                ? 'bg-white dark:bg-[#142825] text-[#0B3D3A] dark:text-[#7FD1BF] shadow-xs font-semibold'
                : 'text-[#526360] dark:text-[#9BB0AC] hover:text-[#0B3D3A] dark:hover:text-[#F4F7F6]'
            }`}
          >
            4-step tour
          </button>
          <button
            type="button"
            onClick={() => setActiveTabSection('glossary')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeTabSection === 'glossary'
                ? 'bg-white dark:bg-[#142825] text-[#0B3D3A] dark:text-[#7FD1BF] shadow-xs font-semibold'
                : 'text-[#526360] dark:text-[#9BB0AC] hover:text-[#0B3D3A] dark:hover:text-[#F4F7F6]'
            }`}
          >
            Plain glossary ({GLOSSARY_TERMS.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: HOW THIS PAGE WORKS */}
          {activeTabSection === 'help' && (
            <div className="space-y-5">
              <div className="p-4 bg-white dark:bg-[#142825] border border-[#E4DFD3] dark:border-[#1F3834] rounded-lg">
                <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-[#17806D] dark:text-[#2DD4BF] font-semibold">
                  You are viewing: {pageInfo.title}
                </span>
                <p className="text-sm font-medium text-[#0B3D3A] dark:text-[#7FD1BF] mt-0.5">
                  {pageInfo.oneLine}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#526360] dark:text-[#9BB0AC] mb-3">
                  3 key things to know about this page:
                </h3>
                <ul className="space-y-3">
                  {pageInfo.bullets.map((bullet, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-white dark:bg-[#142825] border border-[#E4DFD3] dark:border-[#1F3834] rounded-lg text-xs leading-relaxed text-[#142321] dark:text-[#F4F7F6]"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#17806D]/15 dark:bg-[#2DD4BF]/20 text-[#17806D] dark:text-[#2DD4BF] font-mono-tabular text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E4DFD3] dark:border-[#1F3834]">
                <button
                  type="button"
                  onClick={() => setActiveTabSection('tour')}
                  className="text-xs text-[#17806D] dark:text-[#2DD4BF] font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Take the 4-step beginner tour</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabSection('glossary')}
                  className="text-xs text-[#526360] dark:text-[#9BB0AC] hover:text-[#0B3D3A] dark:hover:text-[#F4F7F6] inline-flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Look up a word in the glossary</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: 4-STEP TOUR */}
          {activeTabSection === 'tour' && (
            <div className="space-y-6">
              {/* Progress Indicator */}
              <div className="flex items-center justify-between text-xs text-[#526360] dark:text-[#9BB0AC]">
                <span>
                  Step {tourStep + 1} of {tourSteps.length}
                </span>
                <div className="flex items-center gap-1.5">
                  {tourSteps.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTourStep(i)}
                      aria-label={`Go to step ${i + 1}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        tourStep === i
                          ? 'w-6 bg-[#0B3D3A] dark:bg-[#7FD1BF]'
                          : 'w-2 bg-[#E4DFD3] dark:bg-[#1F3834]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Active Step Card */}
              <div className="bg-white dark:bg-[#142825] border border-[#E4DFD3] dark:border-[#1F3834] rounded-xl p-6 space-y-4 shadow-xs">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono-tabular font-semibold bg-[#7FD1BF]/20 text-[#0B3D3A] dark:text-[#7FD1BF]">
                  Step {tourSteps[tourStep].stepNumber} of 4
                </span>

                <h3 className="font-serif-display text-xl font-semibold text-[#0B3D3A] dark:text-[#7FD1BF]">
                  {tourSteps[tourStep].title}
                </h3>

                <p className="text-sm text-[#364946] dark:text-[#D1DEDC] leading-relaxed">
                  {tourSteps[tourStep].description}
                </p>

                {onNavigateToTab && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToTab(tourSteps[tourStep].targetTab);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#17806D] dark:text-[#2DD4BF] hover:underline cursor-pointer"
                    >
                      <span>{tourSteps[tourStep].actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tour Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={tourStep === 0}
                  onClick={() => setTourStep((prev) => Math.max(0, prev - 1))}
                  className="px-3.5 py-2 text-xs font-medium rounded border border-[#E4DFD3] dark:border-[#1F3834] bg-white dark:bg-[#142825] text-[#142321] dark:text-[#F4F7F6] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                  <span>Previous</span>
                </button>

                {tourStep < tourSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setTourStep((prev) => prev + 1)}
                    className="px-4 py-2 text-xs font-medium rounded bg-[#0B3D3A] dark:bg-[#17806D] text-[#FAF8F4] hover:bg-[#17806D] cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Next step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.setItem('nirnay_tour_completed', 'true');
                      } catch {}
                      onClose();
                    }}
                    className="px-4 py-2 text-xs font-medium rounded bg-[#17806D] dark:bg-[#7FD1BF] text-[#FAF8F4] dark:text-[#0B3D3A] font-semibold hover:bg-[#0B3D3A] cursor-pointer inline-flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Finish tour</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PLAIN GLOSSARY */}
          {activeTabSection === 'glossary' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#526360] dark:text-[#9BB0AC]" />
                <input
                  type="text"
                  placeholder="Search a term (e.g. source check, risk, creator)..."
                  value={glossaryQuery}
                  onChange={(e) => setGlossaryQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E4DFD3] dark:border-[#1F3834] bg-white dark:bg-[#142825] text-[#142321] dark:text-[#F4F7F6] focus:outline-none focus:border-[#17806D]"
                />
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredGlossary.map((item) => (
                  <div
                    key={item.term}
                    className="p-3.5 bg-white dark:bg-[#142825] border border-[#E4DFD3] dark:border-[#1F3834] rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0B3D3A] dark:text-[#7FD1BF]">
                        {item.term}
                      </span>
                    </div>
                    <p className="text-[#364946] dark:text-[#D1DEDC] leading-relaxed">
                      {item.plainMeaning}
                    </p>
                    {item.example && (
                      <p className="text-[11px] text-[#526360] dark:text-[#9BB0AC] italic">
                        {item.example}
                      </p>
                    )}
                  </div>
                ))}

                {filteredGlossary.length === 0 && (
                  <p className="text-center py-8 text-xs text-[#526360] dark:text-[#9BB0AC]">
                    No term matches "{glossaryQuery}". Try searching "rules", "check", or "approvals".
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#E4DFD3] dark:border-[#1F3834] bg-[#F3EFE6]/50 dark:bg-[#142825] flex items-center justify-between text-xs text-[#526360] dark:text-[#9BB0AC]">
          <span>Role: <strong>{activeRole}</strong> · Press Esc to close</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#0B3D3A] dark:bg-[#17806D] text-[#FAF8F4] font-medium hover:bg-[#17806D] cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
