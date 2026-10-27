import React, { useState, useEffect } from 'react';
import { Layers, Plus, CheckCircle2, AlertTriangle, ShieldAlert, Archive, Sparkles, Filter, ChevronRight, RefreshCw } from 'lucide-react';
import { ApiClient } from '../api/client';

export function RulesPage({ workspace, userRoles }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form states
  const [ruleId, setRuleId] = useState('');
  const [category, setCategory] = useState('promotional_condition');
  const [severity, setSeverity] = useState('high');
  const [ruleText, setRuleText] = useState('');
  const [sourceId, setSourceId] = useState('policy-brand-2026');
  const [sourceVersion, setSourceVersion] = useState('v1.0');
  const [ruleConfigStr, setRuleConfigStr] = useState('{\n  "benefit": "free_shipping",\n  "minimumExclusive": 999\n}');
  const [campaignScope, setCampaignScope] = useState('');
  const [channelScope, setChannelScope] = useState('instagram, web');

  // Conflict detection state
  const [conflictResult, setConflictResult] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  const isAdmin = userRoles.includes('ADMIN');

  const loadRules = async () => {
    if (!workspace?._id) return;
    if (rules.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      const data = await ApiClient.getRules(workspace._id, params);
      setRules(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [workspace?._id, filterCategory, filterStatus]);

  const handleCheckConflicts = async () => {
    setCheckingConflict(true);
    setConflictResult(null);
    try {
      let config = {};
      try {
        config = JSON.parse(ruleConfigStr);
      } catch (e) {
        throw new Error('Rule Config must be valid JSON.');
      }

      const candidate = {
        ruleId,
        category,
        severity,
        ruleText,
        ruleConfig: config,
        sourceId,
        sourceVersion,
        scope: {
          campaignIds: campaignScope ? campaignScope.split(',').map(s => s.trim()) : [],
          channels: channelScope ? channelScope.split(',').map(s => s.trim()) : []
        }
      };

      const res = await ApiClient.checkRuleConflicts(workspace._id, candidate);
      setConflictResult(res);
    } catch (err) {
      alert(err.message);
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      let config = {};
      try {
        config = JSON.parse(ruleConfigStr);
      } catch (e) {
        throw new Error('Rule Config must be valid JSON.');
      }

      await ApiClient.createRule(workspace._id, {
        ruleId,
        category,
        severity,
        ruleText,
        ruleConfig: config,
        sourceId,
        sourceVersion,
        scope: {
          campaignIds: campaignScope ? campaignScope.split(',').map(s => s.trim()) : [],
          channels: channelScope ? channelScope.split(',').map(s => s.trim()) : []
        }
      });

      setShowAddModal(false);
      resetForm();
      loadRules();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setRuleId('');
    setRuleText('');
    setConflictResult(null);
  };

  const handleApprove = async (rId, version) => {
    try {
      await ApiClient.approveRule(workspace._id, rId, { decision: 'approve', version });
      loadRules();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleActivate = async (rId, version) => {
    try {
      await ApiClient.activateRule(workspace._id, rId, { version });
      loadRules();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSeedBaselineRules = async () => {
    setLoading(true);
    try {
      // 1. Seed PR-104
      await ApiClient.createRule(workspace._id, {
        ruleId: 'PR-104',
        category: 'promotional_condition',
        severity: 'high',
        ruleText: 'Free shipping is available on orders above INR 999 (Rs. 999).',
        ruleConfig: { benefit: 'free_shipping', minimumExclusive: 999 },
        sourceId: 'policy-pr-104',
        sourceVersion: 'v1.2',
        scope: { campaignIds: ['campaign-summer'], channels: ['instagram', 'web'] }
      });
      await ApiClient.approveRule(workspace._id, 'PR-104', { decision: 'approve', version: 1 });
      await ApiClient.activateRule(workspace._id, 'PR-104', { version: 1 });

      // 2. Seed TERM-01
      await ApiClient.createRule(workspace._id, {
        ruleId: 'TERM-01',
        category: 'terminology',
        severity: 'high',
        ruleText: 'Never use hyperbolic claims like "cheapest" or "100% risk-free". Use "affordable" instead.',
        ruleConfig: { prohibitedTerms: ['cheapest', '100% risk-free'], preferredTerm: 'affordable' },
        sourceId: 'term-guide-2026',
        sourceVersion: 'v2.0'
      });
      await ApiClient.approveRule(workspace._id, 'TERM-01', { decision: 'approve', version: 1 });
      await ApiClient.activateRule(workspace._id, 'TERM-01', { version: 1 });

      // 3. Seed DISC-01
      await ApiClient.createRule(workspace._id, {
        ruleId: 'DISC-01',
        category: 'disclaimer',
        severity: 'medium',
        ruleText: 'All promotional copy must include "*T&C apply".',
        ruleConfig: { requiredPhrase: '*T&C apply' },
        sourceId: 'legal-disclaimer-doc',
        sourceVersion: 'v1.0'
      });
      await ApiClient.approveRule(workspace._id, 'DISC-01', { decision: 'approve', version: 1 });
      await ApiClient.activateRule(workspace._id, 'DISC-01', { version: 1 });

      // 4. Seed A11Y-01
      await ApiClient.createRule(workspace._id, {
        ruleId: 'A11Y-01',
        category: 'accessibility',
        severity: 'medium',
        ruleText: 'Standard body text must satisfy WCAG AA 4.5:1 minimum contrast ratio.',
        ruleConfig: { minContrastRatio: 4.5 },
        sourceId: 'wcag-brand-guide',
        sourceVersion: 'v1.0'
      });
      await ApiClient.approveRule(workspace._id, 'A11Y-01', { decision: 'approve', version: 1 });
      await ApiClient.activateRule(workspace._id, 'A11Y-01', { version: 1 });

      loadRules();
    } catch (err) {
      alert(`Seeding notice: ${err.message}`);
      loadRules();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8" data-tour="rules-registry-container">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#0B1E36] flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#0055D4]" />
            Brand Knowledge Registry
          </h1>
          <p className="text-xs text-slate-600 font-mono mt-1">
            Approved brand guidelines, time-bound promotional conditions, and source provenance
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {isAdmin && (
            <>
              <button
                onClick={handleSeedBaselineRules}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-xs font-mono font-bold text-[#0B1E36] border-2 border-[#F59E0B] flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Seed Baseline Demo Rules (PR-104, Terminology, WCAG)
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                data-tour="btn-add-rule"
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#F59E0B] hover:bg-[#D97706] text-[#0B1E36] border-2 border-[#0B1E36] shadow-[3px_3px_0px_#0B1E36] flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Add Brand Rule
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border-2 border-slate-300 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4 text-xs shadow-sm font-mono">
        <div className="flex items-center gap-2 text-slate-600 font-bold uppercase">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-white border-2 border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:border-[#0055D4] cursor-pointer"
        >
          <option value="">All Categories</option>
          <option value="promotional_condition">Promotional Condition</option>
          <option value="terminology">Terminology</option>
          <option value="disclaimer">Disclaimer</option>
          <option value="accessibility">Accessibility / WCAG</option>
          <option value="product_fact">Product Fact</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-white border-2 border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:border-[#0055D4] cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="draft">Draft Only</option>
          <option value="superseded">Superseded</option>
          <option value="archived">Archived</option>
        </select>

        <button
          onClick={loadRules}
          className="ml-auto text-slate-600 hover:text-[#0B1E36] flex items-center gap-1.5 text-xs font-bold font-mono cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F59E0B]' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Rules list */}
      {(loading && rules.length === 0) ? (
        <div className="p-12 text-center text-slate-600 font-mono text-sm bg-white border-2 border-slate-300 rounded-xl">Loading brand rules registry...</div>
      ) : rules.length === 0 ? (
        <div className="bg-white border-2 border-[#0B1E36] rounded-2xl p-12 text-center shadow-[4px_4px_0px_#0B1E36]">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-black text-[#0B1E36] uppercase">No brand rules configured yet</h3>
          <p className="text-xs text-slate-600 font-mono mt-1 max-w-sm mx-auto">
            Click "Seed Baseline Demo Rules" above to instantly populate PR-104 and brand guidelines.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4" data-tour="rules-cards-list">
          {rules.map(rule => (
            <div key={rule._id} className="bg-white border-2 border-slate-300 hover:border-[#0B1E36] rounded-xl p-5 shadow-sm hover:shadow-[4px_4px_0px_#0B1E36] transition-all relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-sm font-black text-[#0055D4]">{rule.ruleId}</span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                    v{rule.ruleVersion}
                  </span>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border-2 ${
                    rule.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-500' :
                    rule.status === 'draft' ? 'bg-amber-50 text-amber-800 border-amber-500' :
                    'bg-slate-100 text-slate-600 border-slate-300'
                  }`}>
                    {rule.status}
                  </span>
                  <span className="text-xs font-mono text-slate-500 capitalize">
                    {rule.category.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Source: <span className="text-slate-800 font-bold">{rule.sourceId} ({rule.sourceVersion})</span>
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-900 mt-2 font-medium">
                {rule.ruleText}
              </p>

              {/* Scope & Action bar */}
              <div className="mt-4 pt-3 border-t-2 border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-600">
                <div className="flex items-center gap-3">
                  {rule.scope?.channels?.length > 0 && (
                    <span>Channels: <span className="text-[#0B1E36] font-bold">{rule.scope.channels.join(', ')}</span></span>
                  )}
                  {rule.scope?.campaignIds?.length > 0 && (
                    <span>Campaign: <span className="text-[#0B1E36] font-bold">{rule.scope.campaignIds.join(', ')}</span></span>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 ml-auto">
                    {rule.approvalStatus !== 'approved' && (
                      <button
                        onClick={() => handleApprove(rule.ruleId, rule.ruleVersion)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0055D4] hover:bg-blue-100 border border-blue-300 font-mono font-bold text-xs transition cursor-pointer"
                      >
                        Approve Rule
                      </button>
                    )}
                    {rule.approvalStatus === 'approved' && rule.status !== 'active' && (
                      <button
                        onClick={() => handleActivate(rule.ruleId, rule.ruleVersion)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-mono font-bold text-xs transition cursor-pointer"
                      >
                        Activate Rule
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Rule Modal with LIVE Conflict Detector */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white border-2 border-[#0B1E36] rounded-2xl p-6 shadow-[6px_6px_0px_#0B1E36] relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-[#0B1E36] uppercase mb-4">Add Versioned Brand Rule</h2>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0B1E36] font-mono font-bold uppercase mb-1">Rule ID (Logical Key)</label>
                  <input
                    type="text"
                    required
                    value={ruleId}
                    onChange={e => setRuleId(e.target.value.toUpperCase())}
                    placeholder="e.g. PR-104 or TERM-02"
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#0055D4]"
                  />
                </div>
                <div>
                  <label className="block text-[#0B1E36] font-mono font-bold uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#0055D4] cursor-pointer"
                  >
                    <option value="promotional_condition">Promotional Condition</option>
                    <option value="terminology">Terminology</option>
                    <option value="disclaimer">Disclaimer</option>
                    <option value="accessibility">Accessibility / WCAG</option>
                    <option value="product_fact">Product Fact</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#0B1E36] font-mono font-bold uppercase mb-1">Rule Text</label>
                <textarea
                  required
                  rows={2}
                  value={ruleText}
                  onChange={e => setRuleText(e.target.value)}
                  placeholder="Exact statement of the policy or condition..."
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#0055D4]"
                />
              </div>

              <div>
                <label className="block text-[#0B1E36] font-mono font-bold uppercase mb-1">Rule Config (JSON)</label>
                <textarea
                  rows={3}
                  value={ruleConfigStr}
                  onChange={e => setRuleConfigStr(e.target.value)}
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#0055D4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0B1E36] font-mono font-bold uppercase mb-1">Source ID</label>
                  <input
                    type="text"
                    required
                    value={sourceId}
                    onChange={e => setSourceId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#0055D4]"
                  />
                </div>
                <div>
                  <label className="block text-[#0B1E36] font-mono font-bold uppercase mb-1">Source Version</label>
                  <input
                    type="text"
                    required
                    value={sourceVersion}
                    onChange={e => setSourceVersion(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-[#0055D4]"
                  />
                </div>
              </div>

              {/* Automated Rule Conflict Detector UI (Named Improvement 2) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#0B1E36] font-mono uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    Automated Rule Conflict Detector
                  </span>
                  <button
                    type="button"
                    onClick={handleCheckConflicts}
                    disabled={checkingConflict || !ruleId || !ruleText}
                    className="px-2.5 py-1 rounded-lg bg-[#0B1E36] hover:bg-[#152B4A] text-white font-mono font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {checkingConflict ? 'Scanning...' : 'Scan for Conflicts'}
                  </button>
                </div>

                {conflictResult && (
                  <div className="mt-2 text-xs font-mono">
                    {conflictResult.hasConflicts ? (
                      <div className="p-2.5 rounded-xl bg-red-50 border-2 border-red-500 text-red-900">
                        <div className="font-bold flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          Conflict Warning: {conflictResult.conflictCount} conflict(s) detected!
                        </div>
                        {conflictResult.conflicts.map((c, i) => (
                          <div key={i} className="text-[11px] mt-1 pl-3 border-l-2 border-red-500">
                            <strong>{c.conflictType}</strong>: {c.overlapReason}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        No conflicting active rules found. Candidate rule is clean for registration.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 border-2 border-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#F59E0B] hover:bg-[#D97706] text-[#0B1E36] border-2 border-[#0B1E36] shadow-[3px_3px_0px_#0B1E36] cursor-pointer"
                >
                  Create Rule Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
