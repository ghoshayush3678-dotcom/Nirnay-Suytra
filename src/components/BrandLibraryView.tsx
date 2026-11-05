import React, { useState, useMemo } from 'react';
import {
  Plus,
  Lock,
  Unlock,
  Check,
  Edit3,
  BookOpen,
  FileCheck,
  Palette,
  AlertCircle,
  Activity,
  GitCompare,
  Languages,
  ShieldAlert,
} from 'lucide-react';
import {
  BrandLibraryState,
  GuidelineItem,
  ApprovedFactItem,
  TerminologyItem,
  FindingCategory,
  UserRole,
  GuidelineConflict,
  SupportedLanguage,
} from '../types';
import { getContrastRatio, auditGuidelineHealth } from '../utils/governanceEngine';
import { EditorialEmptyCard } from './EditorialEmptyStates';

interface BrandLibraryViewProps {
  library: BrandLibraryState;
  activeRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  onUpdateLibrary: (
    updated: BrandLibraryState,
    auditSummary: string,
    sourceId: string
  ) => void;
}

export const BrandLibraryView: React.FC<BrandLibraryViewProps> = ({
  library,
  activeRole,
  onSwitchRole,
  onUpdateLibrary,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'guidelines' | 'facts' | 'terminology' | 'assets'
  >('guidelines');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyConfidential, setOnlyConfidential] = useState(false);

  // Signature Feature 4: Guideline Health & Conflict Audit State
  const [showHealthAuditModal, setShowHealthAuditModal] = useState(false);
  const healthAudit = useMemo(() => {
    return auditGuidelineHealth(library);
  }, [library]);

  // Add / Edit Guideline Modal State
  const [editingGuideline, setEditingGuideline] = useState<GuidelineItem | null>(
    null
  );
  const [isAddingGuideline, setIsAddingGuideline] = useState(false);
  const [gForm, setGForm] = useState({
    code: '',
    title: '',
    category: 'claim' as FindingCategory,
    content: '',
    examplesGood: '',
    examplesBad: '',
    confidential: false,
    language: 'en' as SupportedLanguage,
  });

  // Add / Edit Fact State
  const [isAddingFact, setIsAddingFact] = useState(false);
  const [fForm, setFForm] = useState({
    code: '',
    title: '',
    statement: '',
    sourceDocument: '',
    lastVerified: '2026-11-04',
    verifiedBy: 'Dr. Meenakshi Rao (Head of Agronomy)',
    confidential: false,
  });

  // Add Terminology State
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [tForm, setTForm] = useState({
    bannedTerm: '',
    preferredTerm: '',
    reason: '',
    category: 'terminology' as FindingCategory,
    confidential: false,
  });

  // Live Contrast Tester in Assets tab
  const [testFg, setTestFg] = useState('#0B3D3A');
  const [testBg, setTestBg] = useState('#FAF8F4');

  const canEdit = activeRole === 'Brand Admin';
  const canViewConfidential =
    activeRole === 'Brand Admin' || activeRole === 'Reviewer';

  const handleToggleConfidential = (
    type: 'guideline' | 'fact' | 'term',
    id: string
  ) => {
    if (!canEdit) return;
    if (type === 'guideline') {
      const next = library.guidelines.map((g) =>
        g.id === id ? { ...g, confidential: !g.confidential } : g
      );
      onUpdateLibrary(
        { ...library, guidelines: next },
        `Toggled Confidential status on Guideline ${id}`,
        id
      );
    } else if (type === 'fact') {
      const next = library.facts.map((f) =>
        f.id === id ? { ...f, confidential: !f.confidential } : f
      );
      onUpdateLibrary(
        { ...library, facts: next },
        `Toggled Confidential status on Approved Fact ${id}`,
        id
      );
    } else {
      const next = library.terminology.map((t) =>
        t.id === id ? { ...t, confidential: !t.confidential } : t
      );
      onUpdateLibrary(
        { ...library, terminology: next },
        `Toggled Confidential status on Terminology rule ${id}`,
        id
      );
    }
  };

  const handleVerifyFactToday = (factId: string) => {
    if (!canEdit) return;
    const today = '2026-11-04';
    const next = library.facts.map((f) =>
      f.id === factId ? { ...f, lastVerified: today } : f
    );
    onUpdateLibrary(
      { ...library, facts: next },
      `Re-verified Approved Fact ${factId} as of ${today}`,
      factId
    );
  };

  const handleSaveGuideline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gForm.title.trim() || !gForm.content.trim()) return;

    if (editingGuideline) {
      const next = library.guidelines.map((g) =>
        g.id === editingGuideline.id
          ? {
              ...g,
              code: gForm.code || g.code,
              title: gForm.title,
              category: gForm.category,
              content: gForm.content,
              examplesGood: gForm.examplesGood,
              examplesBad: gForm.examplesBad,
              confidential: gForm.confidential,
              updatedAt: '2026-11-04',
            }
          : g
      );
      onUpdateLibrary(
        { ...library, guidelines: next },
        `Updated Guideline ${editingGuideline.id}: ${gForm.title}`,
        editingGuideline.id
      );
      setEditingGuideline(null);
    } else {
      const newId = `G-0${library.guidelines.length + 1}`;
      const newItem: GuidelineItem = {
        id: newId,
        code: gForm.code || `SUTRA-${gForm.category.toUpperCase()}-0${library.guidelines.length + 1}`,
        title: gForm.title,
        category: gForm.category,
        content: gForm.content,
        examplesGood: gForm.examplesGood || 'Verified compliant phrasing.',
        examplesBad: gForm.examplesBad || 'Non-compliant phrasing.',
        confidential: gForm.confidential,
        updatedAt: '2026-11-04',
        flaggedCount: 0,
        disputedCount: 0,
      };
      onUpdateLibrary(
        { ...library, guidelines: [newItem, ...library.guidelines] },
        `Added new Guideline ${newId}: ${newItem.title}`,
        newId
      );
    }
    setIsAddingGuideline(false);
    setGForm({
      code: '',
      title: '',
      category: 'claim',
      content: '',
      examplesGood: '',
      examplesBad: '',
      confidential: false,
    });
  };

  const handleSaveFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fForm.title.trim() || !fForm.statement.trim()) return;
    const newId = `F-0${library.facts.length + 1}`;
    const newFact: ApprovedFactItem = {
      id: newId,
      code: fForm.code || `FACT-VER-0${library.facts.length + 1}`,
      title: fForm.title,
      statement: fForm.statement,
      sourceDocument: fForm.sourceDocument || 'Internal Verification Dossier 2026',
      lastVerified: fForm.lastVerified || '2026-11-04',
      verifiedBy: fForm.verifiedBy || `${activeRole} Verification`,
      confidential: fForm.confidential,
    };
    onUpdateLibrary(
      { ...library, facts: [newFact, ...library.facts] },
      `Added Approved Fact ${newId}: ${newFact.title}`,
      newId
    );
    setIsAddingFact(false);
    setFForm({
      code: '',
      title: '',
      statement: '',
      sourceDocument: '',
      lastVerified: '2026-11-04',
      verifiedBy: 'Dr. Meenakshi Rao (Head of Agronomy)',
      confidential: false,
    });
  };

  const handleSaveTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tForm.bannedTerm.trim() || !tForm.preferredTerm.trim()) return;
    const newId = `T-0${library.terminology.length + 1}`;
    const newTerm: TerminologyItem = {
      id: newId,
      bannedTerm: tForm.bannedTerm.trim(),
      preferredTerm: tForm.preferredTerm.trim(),
      reason: tForm.reason.trim() || 'Brand terminology standard.',
      category: tForm.category,
      confidential: tForm.confidential,
    };
    onUpdateLibrary(
      { ...library, terminology: [newTerm, ...library.terminology] },
      `Added Terminology rule ${newId}: avoid "${newTerm.bannedTerm}"`,
      newId
    );
    setIsAddingTerm(false);
    setTForm({
      bannedTerm: '',
      preferredTerm: '',
      reason: '',
      category: 'terminology',
      confidential: false,
    });
  };

  const q = searchQuery.toLowerCase();

  const hiddenConfidentialCount = !canViewConfidential
    ? library.guidelines.filter((g) => g.confidential).length +
      library.facts.filter((f) => f.confidential).length +
      library.terminology.filter((t) => t.confidential).length
    : 0;

  const filteredGuidelines = library.guidelines.filter((g) => {
    if (!canViewConfidential && g.confidential) return false;
    if (onlyConfidential && !g.confidential) return false;
    return (
      !q ||
      g.title.toLowerCase().includes(q) ||
      g.content.toLowerCase().includes(q) ||
      g.id.toLowerCase().includes(q)
    );
  });

  const filteredFacts = library.facts.filter((f) => {
    if (!canViewConfidential && f.confidential) return false;
    if (onlyConfidential && !f.confidential) return false;
    return (
      !q ||
      f.title.toLowerCase().includes(q) ||
      f.statement.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q)
    );
  });

  const filteredTerms = library.terminology.filter((t) => {
    if (!canViewConfidential && t.confidential) return false;
    if (onlyConfidential && !t.confidential) return false;
    return (
      !q ||
      t.bannedTerm.toLowerCase().includes(q) ||
      t.preferredTerm.toLowerCase().includes(q)
    );
  });

  const liveRatio = getContrastRatio(testFg, testBg);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#E4DFD3]">
        <div>
          <div className="text-xs text-[#526360] mb-1">
            <span>{library.brandName}</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>Canonical Citation Repository</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>{library.guidelines.length} Guidelines · {library.facts.length} Approved Facts · {library.terminology.length} Glossary Rules</span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#0B3D3A]">
            Brand Library & Citation Sources
          </h1>
        </div>

        {/* Role Permission Banner / Add Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!canEdit ? (
            <div className="flex items-center gap-3 bg-[#F3EFE6] border border-[#E4DFD3] px-3.5 py-2 rounded text-xs">
              <span className="text-[#526360]">
                Read-only for <strong>{activeRole}</strong>
              </span>
              <button
                type="button"
                onClick={() => onSwitchRole('Brand Admin')}
                className="text-[#0B3D3A] font-medium underline cursor-pointer"
              >
                Switch to Brand Admin to Edit
              </button>
            </div>
          ) : (
            <>
              {/* Signature Feature 4: Health Audit Button */}
              <button
                type="button"
                onClick={() => setShowHealthAuditModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0B3D3A] bg-[#FAF8F4] border border-[#17806D]/40 hover:border-[#17806D] rounded transition-colors cursor-pointer"
                title="Detect rule conflicts, stale facts, and disputed guidelines"
              >
                <Activity className="w-3.5 h-3.5 text-[#17806D]" />
                <span>Health Audit ({healthAudit.conflicts.length} conflict{healthAudit.conflicts.length === 1 ? '' : 's'})</span>
              </button>

              {activeSubTab === 'guidelines' && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingGuideline(null);
                    setIsAddingGuideline(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Guideline</span>
                </button>
              )}
              {activeSubTab === 'facts' && (
                <button
                  type="button"
                  onClick={() => setIsAddingFact(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Approved Fact</span>
                </button>
              )}
              {activeSubTab === 'terminology' && (
                <button
                  type="button"
                  onClick={() => setIsAddingTerm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Glossary Term</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sub-navigation & Search Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3EFE6] border border-[#E4DFD3] rounded">
          <button
            type="button"
            onClick={() => setActiveSubTab('guidelines')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'guidelines'
                ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                : 'text-[#526360] hover:text-[#142321]'
            }`}
          >
            Guidelines ({library.guidelines.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('facts')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'facts'
                ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                : 'text-[#526360] hover:text-[#142321]'
            }`}
          >
            Approved Facts ({library.facts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('terminology')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'terminology'
                ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                : 'text-[#526360] hover:text-[#142321]'
            }`}
          >
            Terminology ({library.terminology.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('assets')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubTab === 'assets'
                ? 'bg-[#0B3D3A] text-[#FAF8F4]'
                : 'text-[#526360] hover:text-[#142321]'
            }`}
          >
            Brand Assets & Palette ({library.assets.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canViewConfidential ? (
            <label className="flex items-center gap-2 text-xs text-[#364946] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyConfidential}
                onChange={(e) => setOnlyConfidential(e.target.checked)}
                className="rounded border-[#E4DFD3] text-[#0B3D3A] focus:ring-[#0B3D3A]"
              />
              <span>Confidential items only</span>
            </label>
          ) : (
            <span className="text-xs text-[#B45309] bg-[#F5A524]/15 border border-[#F5A524]/40 px-2.5 py-1 rounded font-mono-tabular">
              <Lock className="w-3 h-3 inline mr-1" />
              {hiddenConfidentialCount} Confidential item(s) hidden for {activeRole} (Visible only to Reviewer &amp; Brand Admin)
            </span>
          )}
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, phrase, or source..."
            aria-label="Search Brand Library"
            className="px-3 py-1.5 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded focus:outline-none focus:border-[#0B3D3A] w-60"
          />
        </div>
      </div>

      {/* Add / Edit Guideline Form Drawer */}
      {(isAddingGuideline || editingGuideline) && (
        <form
          onSubmit={handleSaveGuideline}
          className="border border-[#0B3D3A] bg-[#F3EFE6]/80 rounded p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E4DFD3]">
            <h3 className="font-serif-display text-base font-semibold text-[#0B3D3A]">
              {editingGuideline
                ? `Edit Guideline ${editingGuideline.id}`
                : 'Add New Brand Guideline'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAddingGuideline(false);
                setEditingGuideline(null);
              }}
              className="text-xs text-[#526360] hover:text-[#142321] cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#142321] mb-1">
                Guideline Title *
              </label>
              <input
                type="text"
                required
                value={gForm.title}
                onChange={(e) => setGForm({ ...gForm, title: e.target.value })}
                placeholder="e.g. Regional Packaging Translation Standard"
                className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#142321] mb-1">
                Rule Code
              </label>
              <input
                type="text"
                value={gForm.code}
                onChange={(e) => setGForm({ ...gForm, code: e.target.value })}
                placeholder="e.g. SUTRA-LOC-07"
                className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded font-mono-tabular"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#142321] mb-1">
                Governance Category
              </label>
              <select
                value={gForm.category}
                onChange={(e) =>
                  setGForm({ ...gForm, category: e.target.value as FindingCategory })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
              >
                <option value="claim">claim</option>
                <option value="tone">tone</option>
                <option value="terminology">terminology</option>
                <option value="messaging">messaging</option>
                <option value="visual">visual</option>
                <option value="accessibility">accessibility</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#142321] mb-1">
              Canonical Rule Passage (Sent during Retrieval & Verifier checks) *
            </label>
            <textarea
              required
              rows={3}
              value={gForm.content}
              onChange={(e) => setGForm({ ...gForm, content: e.target.value })}
              placeholder="Write the exact rule statement that findings must cite..."
              className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#142321] mb-1">
                Approved Example (Do)
              </label>
              <input
                type="text"
                value={gForm.examplesGood}
                onChange={(e) =>
                  setGForm({ ...gForm, examplesGood: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#142321] mb-1">
                Disallowed Example (Avoid)
              </label>
              <input
                type="text"
                value={gForm.examplesBad}
                onChange={(e) =>
                  setGForm({ ...gForm, examplesBad: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-[#142321] cursor-pointer">
              <input
                type="checkbox"
                checked={gForm.confidential}
                onChange={(e) =>
                  setGForm({ ...gForm, confidential: e.target.checked })
                }
              />
              <span>
                Mark as <strong>Confidential</strong> (Prompts for redaction before sending to external AI)
              </span>
            </label>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] hover:bg-[#17806D] rounded cursor-pointer"
            >
              Save Guideline to Library
            </button>
          </div>
        </form>
      )}

      {/* TAB 1: GUIDELINES */}
      {activeSubTab === 'guidelines' && (
        filteredGuidelines.length === 0 ? (
          searchQuery.trim() || onlyConfidential ? (
            <EditorialEmptyCard
              illustration="search"
              heading="No matches. Clear the filters."
              explanation="No brand guidelines matched your search query or confidential filter."
              primaryAction={{
                label: 'Clear the filters',
                onClick: () => {
                  setSearchQuery('');
                  setOnlyConfidential(false);
                },
              }}
            />
          ) : (
            <EditorialEmptyCard
              illustration="checklist"
              heading="No brand guidelines yet."
              explanation="Add at least one guideline so Nirnay Sutra has an approved source to check content against."
              primaryAction={
                canEdit
                  ? {
                      label: 'Add your first brand guideline',
                      onClick: () => {
                        setEditingGuideline(null);
                        setIsAddingGuideline(true);
                      },
                    }
                  : {
                      label: 'Switch to Brand Admin to add guidelines',
                      onClick: () => onSwitchRole('Brand Admin'),
                    }
              }
            />
          )
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGuidelines.map((g) => (
            <div
              key={g.id}
              className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#526360] mb-2 font-mono-tabular">
                  <div>
                    <span className="font-semibold text-[#0B3D3A]">{g.id}</span>
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    <span>{g.code}</span>
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    <span>Category: {g.category}</span>
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    <span
                      className={`font-semibold ${
                        (g.healthScore ?? 85) >= 80
                          ? 'text-[#17806D]'
                          : (g.healthScore ?? 85) >= 50
                          ? 'text-[#B45309]'
                          : 'text-[#B91C1C]'
                      }`}
                      title={`Rule Health Score: ${g.healthScore ?? 85}/100 based on age, disputes, and rule conflicts.`}
                    >
                      Health {g.healthScore ?? 85}/100
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {g.confidential && (
                      <span className="text-[#B45309] font-medium">
                        Confidential
                      </span>
                    )}
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleConfidential('guideline', g.id)}
                          title="Toggle Confidential Status"
                          className="text-[#526360] hover:text-[#0B3D3A] cursor-pointer"
                        >
                          {g.confidential ? (
                            <Lock className="w-3.5 h-3.5 text-[#B45309]" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGuideline(g);
                            setGForm({
                              code: g.code,
                              title: g.title,
                              category: g.category,
                              content: g.content,
                              examplesGood: g.examplesGood,
                              examplesBad: g.examplesBad,
                              confidential: g.confidential,
                              language: g.language || 'en',
                            });
                          }}
                          title="Edit Guideline"
                          className="text-[#526360] hover:text-[#0B3D3A] cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="font-serif-display text-lg font-semibold text-[#0B3D3A] mb-2">
                  {g.title}
                </h3>
                <p className="text-xs text-[#142321] leading-relaxed mb-4">
                  {g.content}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#E4DFD3] text-xs">
                <div className="bg-[#7FD1BF]/15 p-2.5 rounded">
                  <span className="font-medium text-[#0B3D3A] block mb-0.5">
                    Approved Phrasing:
                  </span>
                  <span className="text-[#364946]">{g.examplesGood}</span>
                </div>
                <div className="bg-[#FEE2E2]/40 p-2.5 rounded">
                  <span className="font-medium text-[#991B1B] block mb-0.5">
                    Disallowed Example:
                  </span>
                  <span className="text-[#526360]">{g.examplesBad}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#526360] pt-1 font-mono-tabular">
                  <span>Updated: {g.updatedAt}</span>
                  <span>
                    Flagged {g.flaggedCount}x · Disputed {g.disputedCount}x
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        )
      )}

      {/* TAB 2: APPROVED FACTS */}
      {activeSubTab === 'facts' && (
        <div className="space-y-6">
          {isAddingFact && (
            <form
              onSubmit={handleSaveFact}
              className="border border-[#0B3D3A] bg-[#F3EFE6]/80 rounded p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E4DFD3]">
                <h3 className="font-serif-display text-base font-semibold text-[#0B3D3A]">
                  Add Verified Brand Fact
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingFact(false)}
                  className="text-xs text-[#526360] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Fact Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={fForm.title}
                    onChange={(e) =>
                      setFForm({ ...fForm, title: e.target.value })
                    }
                    placeholder="e.g. Coorg Cardamom Essential Oil Yield"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Source Document / Certificate *
                  </label>
                  <input
                    type="text"
                    required
                    value={fForm.sourceDocument}
                    onChange={(e) =>
                      setFForm({ ...fForm, sourceDocument: e.target.value })
                    }
                    placeholder="e.g. Spices Board Batch Cert #2026-19"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Last Verified Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={fForm.lastVerified}
                    onChange={(e) =>
                      setFForm({ ...fForm, lastVerified: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded font-mono-tabular"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Exact Approved Fact Statement *
                </label>
                <textarea
                  required
                  rows={2}
                  value={fForm.statement}
                  onChange={(e) =>
                    setFForm({ ...fForm, statement: e.target.value })
                  }
                  placeholder="Enter the exact verifiable claim or metric..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fForm.confidential}
                    onChange={(e) =>
                      setFForm({ ...fForm, confidential: e.target.checked })
                    }
                  />
                  <span>Mark as Confidential (embargoed or internal trade metric)</span>
                </label>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] rounded cursor-pointer"
                >
                  Save Approved Fact
                </button>
              </div>
            </form>
          )}

          {filteredFacts.length === 0 ? (
            searchQuery.trim() || onlyConfidential ? (
              <EditorialEmptyCard
                illustration="search"
                heading="No matches. Clear the filters."
                explanation="No approved facts matched your search query or confidential filter."
                primaryAction={{
                  label: 'Clear the filters',
                  onClick: () => {
                    setSearchQuery('');
                    setOnlyConfidential(false);
                  },
                }}
              />
            ) : (
              <EditorialEmptyCard
                illustration="document"
                heading="No approved facts yet."
                explanation="Add verified product claims, pricing, and lab metrics with their verification date so Nirnay Sutra can catch outdated claims."
                primaryAction={
                  canEdit
                    ? {
                        label: 'Add approved fact',
                        onClick: () => setIsAddingFact(true),
                      }
                    : {
                        label: 'Switch to Brand Admin to add facts',
                        onClick: () => onSwitchRole('Brand Admin'),
                      }
                }
              />
            )
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFacts.map((f) => (
              <div
                key={f.id}
                className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#526360] mb-2 font-mono-tabular">
                    <div>
                      <span className="font-semibold text-[#0B3D3A]">{f.id}</span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span>{f.code}</span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span
                        className={`font-semibold ${
                          (f.healthScore ?? 90) >= 80
                            ? 'text-[#17806D]'
                            : (f.healthScore ?? 90) >= 50
                            ? 'text-[#B45309]'
                            : 'text-[#B91C1C]'
                        }`}
                        title={`Fact Health Score: ${f.healthScore ?? 90}/100 based on verification age and disputes.`}
                      >
                        Health {f.healthScore ?? 90}/100
                      </span>
                      {f.confidential && (
                        <>
                          <span aria-hidden="true" className="mx-1.5">·</span>
                          <span className="text-[#B45309] font-semibold">
                            Confidential
                          </span>
                        </>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleToggleConfidential('fact', f.id)}
                        className="text-xs text-[#526360] hover:text-[#0B3D3A] flex items-center gap-1 cursor-pointer"
                      >
                        {f.confidential ? (
                          <Lock className="w-3.5 h-3.5 text-[#B45309]" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                        <span>{f.confidential ? 'Confidential' : 'Public'}</span>
                      </button>
                    )}
                  </div>

                  <h3 className="font-serif-display text-base font-semibold text-[#0B3D3A] mb-2">
                    {f.title}
                  </h3>
                  <p className="text-xs text-[#142321] leading-relaxed mb-4">
                    “{f.statement}”
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E4DFD3] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#526360] font-mono-tabular">
                  <div>
                    <span>Source: {f.sourceDocument}</span>
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    <span>Last Verified: <strong className="text-[#0B3D3A]">{f.lastVerified}</strong></span>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleVerifyFactToday(f.id)}
                      className="text-[#17806D] hover:underline cursor-pointer"
                    >
                      Verify Today
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* TAB 3: TERMINOLOGY (Preferred / Banned) */}
      {activeSubTab === 'terminology' && (
        <div className="space-y-6">
          {isAddingTerm && (
            <form
              onSubmit={handleSaveTerm}
              className="border border-[#0B3D3A] bg-[#F3EFE6]/80 rounded p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E4DFD3]">
                <h3 className="font-serif-display text-base font-semibold text-[#0B3D3A]">
                  Add Preferred / Banned Terminology Rule
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingTerm(false)}
                  className="text-xs text-[#526360] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Banned Term or Phrase (Flagged by Deterministic Code Engine) *
                  </label>
                  <input
                    type="text"
                    required
                    value={tForm.bannedTerm}
                    onChange={(e) =>
                      setTForm({ ...tForm, bannedTerm: e.target.value })
                    }
                    placeholder="e.g. 100% organic miracle"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Preferred Replacement Phrasing *
                  </label>
                  <input
                    type="text"
                    required
                    value={tForm.preferredTerm}
                    onChange={(e) =>
                      setTForm({ ...tForm, preferredTerm: e.target.value })
                    }
                    placeholder="e.g. certified NPOP organic botanical formulation"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Editorial / Compliance Rationale
                </label>
                <input
                  type="text"
                  value={tForm.reason}
                  onChange={(e) =>
                    setTForm({ ...tForm, reason: e.target.value })
                  }
                  placeholder="Why this term is restricted..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] rounded cursor-pointer"
                >
                  Save Terminology Rule
                </button>
              </div>
            </form>
          )}

          {filteredTerms.length === 0 ? (
            searchQuery.trim() || onlyConfidential ? (
              <EditorialEmptyCard
                illustration="search"
                heading="No matches. Clear the filters."
                explanation="No terminology rules matched your search query or confidential filter."
                primaryAction={{
                  label: 'Clear the filters',
                  onClick: () => {
                    setSearchQuery('');
                    setOnlyConfidential(false);
                  },
                }}
              />
            ) : (
              <EditorialEmptyCard
                illustration="checklist"
                heading="No terminology rules yet."
                explanation="Define banned phrases and preferred replacements so the deterministic rule engine can flag off-brand wording."
                primaryAction={
                  canEdit
                    ? {
                        label: 'Add terminology rule',
                        onClick: () => setIsAddingTerm(true),
                      }
                    : {
                        label: 'Switch to Brand Admin to add terms',
                        onClick: () => onSwitchRole('Brand Admin'),
                      }
                }
              />
            )
          ) : (
          <div className="border border-[#E4DFD3] bg-[#FAF8F4] rounded overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E4DFD3] bg-[#F3EFE6]/70 text-xs text-[#526360]">
                  <th className="py-3 px-4 font-medium">Rule ID</th>
                  <th className="py-3 px-4 font-medium">Banned Term (Never Use)</th>
                  <th className="py-3 px-4 font-medium">Preferred Approved Phrasing</th>
                  <th className="py-3 px-4 font-medium">Rationale</th>
                  <th className="py-3 px-4 font-medium text-right">Confidential</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DFD3] text-xs">
                {filteredTerms.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F3EFE6]/30">
                    <td className="py-3.5 px-4 font-mono-tabular font-medium text-[#0B3D3A]">
                      {t.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-[#991B1B] font-medium">
                      “{t.bannedTerm}”
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-[#17806D] font-medium">
                      “{t.preferredTerm}”
                    </td>
                    <td className="py-3.5 px-4 text-[#364946]">{t.reason}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleToggleConfidential('term', t.id)}
                        className="text-xs text-[#526360] hover:text-[#0B3D3A] cursor-pointer"
                      >
                        {t.confidential ? 'Confidential' : 'Public'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* TAB 4: BRAND ASSETS (Logo & Colour Palette with WCAG Calculator) */}
      {activeSubTab === 'assets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Palette Swatches */}
          <div className="lg:col-span-7 space-y-6">
            {library.assets.map((asset) => (
              <div
                key={asset.id}
                className="border border-[#E4DFD3] bg-[#FAF8F4] rounded p-6"
              >
                <div className="text-xs text-[#526360] font-mono-tabular mb-1">
                  <span>{asset.id}</span>
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  <span>Asset Type: {asset.type}</span>
                </div>
                <h3 className="font-serif-display text-lg font-semibold text-[#0B3D3A] mb-2">
                  {asset.name}
                </h3>
                <p className="text-xs text-[#364946] mb-3">{asset.description}</p>
                <p className="text-xs text-[#142321] bg-[#F3EFE6]/70 p-3 rounded border border-[#E4DFD3] mb-4">
                  <strong>Governance Rule:</strong> {asset.ruleText}
                </p>

                {asset.swatches && (
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                    {asset.swatches.map((sw) => (
                      <div
                        key={sw.id}
                        className="border border-[#E4DFD3] rounded overflow-hidden bg-[#FAF8F4]"
                      >
                        <div
                          className="h-16 w-full border-b border-[#E4DFD3]"
                          style={{ backgroundColor: sw.hex }}
                        />
                        <div className="p-2.5">
                          <p className="text-xs font-semibold text-[#142321]">
                            {sw.name}
                          </p>
                          <p className="text-[11px] font-mono-tabular text-[#17806D]">
                            {sw.hex}
                          </p>
                          <p className="text-[10px] text-[#526360] mt-1 leading-tight">
                            {sw.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {asset.type === 'logo' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="border border-[#E4DFD3] bg-[#0B3D3A] text-[#FAF8F4] p-6 rounded flex flex-col items-center justify-center text-center">
                      <span className="font-devanagari text-sm text-[#7FD1BF] mb-1">
                        कावेरी ऑर्गेनिक्स
                      </span>
                      <span className="font-serif-display text-xl font-semibold tracking-tight">
                        KAVERI ORGANICS
                      </span>
                      <span className="text-[10px] text-[#7FD1BF] mt-1 font-mono-tabular">
                        Approved Dark Seal Lockup (11.8:1 Contrast)
                      </span>
                    </div>
                    <div className="border border-[#E4DFD3] bg-[#FAF8F4] text-[#0B3D3A] p-6 rounded flex flex-col items-center justify-center text-center">
                      <span className="font-devanagari text-sm text-[#17806D] mb-1">
                        कावेरी ऑर्गेनिक्स
                      </span>
                      <span className="font-serif-display text-xl font-semibold tracking-tight">
                        KAVERI ORGANICS
                      </span>
                      <span className="text-[10px] text-[#526360] mt-1 font-mono-tabular">
                        Approved Warm Paper Lockup (11.8:1 Contrast)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Interactive WCAG 2.1 Brand Palette Contrast Tester */}
          <div className="lg:col-span-5 border border-[#E4DFD3] bg-[#F3EFE6]/60 rounded p-6 space-y-4">
            <h3 className="font-serif-display text-base font-semibold text-[#0B3D3A]">
              Deterministic WCAG 2.1 Palette Contrast Verifier
            </h3>
            <p className="text-xs text-[#526360] leading-relaxed">
              Test any pair of Kaveri Organics hex values using the exact relative luminance formula executed by Review Studio’s rule engine.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Foreground Text Hex
                </label>
                <select
                  value={testFg}
                  onChange={(e) => setTestFg(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded font-mono-tabular"
                >
                  <option value="#0B3D3A">#0B3D3A (Deep Forest)</option>
                  <option value="#17806D">#17806D (Kaveri Teal)</option>
                  <option value="#7FD1BF">#7FD1BF (Nilgiri Mint)</option>
                  <option value="#FAF8F4">#FAF8F4 (Warm Paper)</option>
                  <option value="#F5A524">#F5A524 (Turmeric Amber)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Background Surface Hex
                </label>
                <select
                  value={testBg}
                  onChange={(e) => setTestBg(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F4] border border-[#E4DFD3] rounded font-mono-tabular"
                >
                  <option value="#FAF8F4">#FAF8F4 (Warm Paper)</option>
                  <option value="#0B3D3A">#0B3D3A (Deep Forest)</option>
                  <option value="#17806D">#17806D (Kaveri Teal)</option>
                  <option value="#7FD1BF">#7FD1BF (Nilgiri Mint)</option>
                  <option value="#F5A524">#F5A524 (Turmeric Amber)</option>
                </select>
              </div>
            </div>

            <div
              className="p-6 rounded border border-[#E4DFD3] transition-colors"
              style={{ backgroundColor: testBg, color: testFg }}
            >
              <p className="font-serif-display text-lg font-semibold mb-1">
                Wayanad Cold-Pressed Virgin Coconut Oil
              </p>
              <p className="text-xs">
                Certified residue-tested below 0.01 mg/kg across 140 Nilgiri smallholdings · MRP ₹640.
              </p>
            </div>

            <div className="bg-[#FAF8F4] border border-[#E4DFD3] p-4 rounded flex items-center justify-between text-xs font-mono-tabular">
              <span>Contrast Ratio: <strong>{liveRatio}:1</strong></span>
              <span
                className={
                  liveRatio >= 4.5
                    ? 'text-[#17806D] font-semibold'
                    : 'text-[#B91C1C] font-semibold'
                }
              >
                {liveRatio >= 7
                  ? 'PASSES WCAG AAA (≥ 7.0:1)'
                  : liveRatio >= 4.5
                  ? 'PASSES WCAG AA (≥ 4.5:1)'
                  : 'FAILS WCAG AA (< 4.5:1 — Blocked by G-04)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Signature Feature 4: Guideline Health & Conflict Audit Modal */}
      {showHealthAuditModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="health-audit-title"
          className="fixed inset-0 z-50 bg-[#142321]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#FAF8F4] border border-[#0B3D3A] rounded max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#E4DFD3]">
              <div>
                <span className="text-xs text-[#17806D] font-mono-tabular block mb-0.5">
                  Automated Rule Quality & Conflict Audit
                </span>
                <h3 id="health-audit-title" className="font-serif-display text-xl font-semibold text-[#0B3D3A]">
                  Guideline Health & Conflict Inspector
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHealthAuditModal(false)}
                className="text-xs text-[#526360] hover:text-[#142321] cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-[#364946] leading-relaxed">
              Every guideline and fact receives a health score (0–100) computed from real signals: verification age, frequency of disputes, and pairwise conflict analysis.
            </p>

            {/* Health Scores Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-tabular">
              <div className="p-3 bg-[#F3EFE6] border border-[#E4DFD3] rounded">
                <span className="text-[#526360] block text-[11px]">Average Rule Health</span>
                <strong className="text-lg text-[#0B3D3A] font-semibold">
                  {Math.round(
                    (healthAudit.updatedGuidelines || []).reduce(
                      (sum, g) => sum + (g.healthScore ?? 85),
                      0
                    ) / ((healthAudit.updatedGuidelines || []).length || 1)
                  )}/100
                </strong>
              </div>
              <div className="p-3 bg-[#F3EFE6] border border-[#E4DFD3] rounded">
                <span className="text-[#526360] block text-[11px]">Stale Facts (&gt;180 Days)</span>
                <strong className="text-lg text-[#B45309] font-semibold">
                  {library.facts.filter((f) => f.lastVerified < '2026-05-01').length}
                </strong>
              </div>
              <div className="p-3 bg-[#F3EFE6] border border-[#E4DFD3] rounded">
                <span className="text-[#526360] block text-[11px]">Detected Rule Conflicts</span>
                <strong className="text-lg text-[#991B1B] font-semibold">
                  {healthAudit.conflicts.length}
                </strong>
              </div>
            </div>

            {/* Detected Conflicts Section */}
            <div className="space-y-3">
              <h4 className="font-serif-display text-sm font-semibold text-[#0B3D3A]">
                Detected Conflicting Rules (Quotes Side-by-Side):
              </h4>
              {healthAudit.conflicts.length === 0 ? (
                <div className="p-4 bg-[#7FD1BF]/20 border border-[#17806D]/40 rounded text-xs text-[#0B3D3A]">
                  No rule conflicts detected! All guidelines and facts align with canonical brand positions.
                </div>
              ) : (
                <div className="space-y-3">
                  {healthAudit.conflicts.map((c, idx) => (
                    <div key={`cnf-${idx}`} className="border border-[#FCA5A5] bg-[#FEF2F2] rounded p-4 text-xs space-y-3">
                      <div className="flex items-center justify-between font-mono-tabular text-[11px] text-[#991B1B]">
                        <span className="font-semibold flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Conflict between [{c.idA}] and [{c.idB}]
                        </span>
                        <span className="uppercase">Rule Friction</span>
                      </div>
                      <p className="text-[#991B1B] font-medium">{c.reason}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                        <div className="p-2.5 bg-[#FAF8F4] border border-[#E4DFD3] rounded">
                          <strong className="text-[#0B3D3A] block mb-1">[{c.idA}]:</strong>
                          <span className="italic text-[#526360]">{c.quoteA}</span>
                        </div>
                        <div className="p-2.5 bg-[#FAF8F4] border border-[#E4DFD3] rounded">
                          <strong className="text-[#0B3D3A] block mb-1">[{c.idB}]:</strong>
                          <span className="italic text-[#526360]">{c.quoteB}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E4DFD3]">
              <button
                type="button"
                onClick={() => setShowHealthAuditModal(false)}
                className="px-4 py-2 text-xs font-medium text-[#FAF8F4] bg-[#0B3D3A] rounded cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
