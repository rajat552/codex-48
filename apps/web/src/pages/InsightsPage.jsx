import React, { useState, useEffect } from 'react';
import {
  PieChart,
  TrendingUp,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client.js';

export function InsightsPage({ workspaceId }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const fetchInsights = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
      api.clearCache();
    } else if (!insights) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await api.insights.get(workspaceId, {}, { skipCache: isManualRefresh });
      setInsights(data);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Failed to load insights from backend:', err);
      if (!insights) {
        setInsights({
          totalSubmissions: 0,
          statusCounts: {},
          topTriggeredRules: [],
          topOverriddenRules: [],
          firstTimeRightRate: 0,
          averageReviewTurnaroundHours: 0,
          totalOverrides: 0
        });
      }
    } finally {
      setLoading(false);
      if (isManualRefresh) {
        setTimeout(() => setIsRefreshing(false), 450);
      }
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchInsights(false);
    }
  }, [workspaceId]);

  if (loading && !insights) {
    return (
      <div className="p-16 text-center text-slate-600 bg-white rounded-2xl border-2 border-slate-300 shadow-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#F59E0B] mb-3" />
        <p className="text-sm font-mono font-bold text-[#0B1E36]">Computing workspace governance analytics & SLA metrics...</p>
      </div>
    );
  }

  const totalSubmissions = insights?.totalSubmissions ?? insights?.sampleSize ?? 0;
  const statusCounts = insights?.statusCounts || {};
  const topTriggeredRules = insights?.topTriggeredRules || insights?.topRecurringRules || [];
  const topOverriddenRules = insights?.topOverriddenRules || insights?.overriddenRules || [];
  const firstTimeRightRate = insights?.firstTimeRightRate ?? 0;
  const averageReviewTurnaroundHours = insights?.averageReviewTurnaroundHours ?? (insights?.medianTurnaroundSeconds ? (insights.medianTurnaroundSeconds / 3600) : 0);
  const totalOverrides = insights?.totalOverrides ?? topOverriddenRules.reduce((acc, r) => acc + (r.overrideCount || r.count || 0), 0);

  const approvedCount = statusCounts.APPROVED || 0;
  const approvalRate = totalSubmissions > 0 ? ((approvedCount / totalSubmissions) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6" data-tour="insights-overview">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#0B1E36] flex items-center gap-3">
            <PieChart className="w-7 h-7 text-[#0055D4]" />
            Brand Governance Insights
          </h1>
          <p className="text-xs text-slate-600 font-mono mt-1">
            Real-time analytics on rule triggers, compliance bottlenecks, human override patterns, and review SLA turnaround.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline-block">
              Updated {lastUpdated}
            </span>
          )}
          <button
            id="btn-refresh-analytics"
            onClick={() => fetchInsights(true)}
            disabled={isRefreshing || loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0B1E36] border-2 border-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-xs font-mono font-bold uppercase transition cursor-pointer disabled:opacity-60"
            title="Recompute and pull fresh real-time governance metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#F59E0B]' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Analytics'}
          </button>
        </div>
      </div>

      {/* Top Metric Cards - Matching MLH Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" data-tour="insights-metric-cards">
        <div className="bg-white border-2 border-slate-300 hover:border-[#0B1E36] rounded-xl p-5 shadow-sm hover:shadow-[3px_3px_0px_#0B1E36] transition-all space-y-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Total Creatives</span>
          <div className="text-3xl font-black text-[#0B1E36]">{totalSubmissions}</div>
          <span className="text-[11px] font-mono text-slate-500">Across all channels</span>
        </div>

        <div className="bg-white border-2 border-slate-300 hover:border-[#0B1E36] rounded-xl p-5 shadow-sm hover:shadow-[3px_3px_0px_#0B1E36] transition-all space-y-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Approval Rate</span>
          <div className="text-3xl font-black text-emerald-600">{approvalRate}%</div>
          <span className="text-[11px] font-mono text-emerald-700">{approvedCount} approved creatives</span>
        </div>

        <div className="bg-white border-2 border-slate-300 hover:border-[#0B1E36] rounded-xl p-5 shadow-sm hover:shadow-[3px_3px_0px_#0B1E36] transition-all space-y-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">First-Time-Right</span>
          <div className="text-3xl font-black text-[#0055D4]">{(firstTimeRightRate * 100).toFixed(0)}%</div>
          <span className="text-[11px] font-mono text-[#0055D4]">Zero revision needed</span>
        </div>

        <div className="bg-white border-2 border-slate-300 hover:border-[#0B1E36] rounded-xl p-5 shadow-sm hover:shadow-[3px_3px_0px_#0B1E36] transition-all space-y-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Avg Review SLA</span>
          <div className="text-3xl font-black text-amber-600">{averageReviewTurnaroundHours.toFixed(1)}h</div>
          <span className="text-[11px] font-mono text-amber-700">Intake to approval</span>
        </div>

        <div className="bg-white border-2 border-slate-300 hover:border-[#0B1E36] rounded-xl p-5 shadow-sm hover:shadow-[3px_3px_0px_#0B1E36] transition-all space-y-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Audited Overrides</span>
          <div className="text-3xl font-black text-purple-700">{totalOverrides}</div>
          <span className="text-[11px] font-mono text-purple-700">Human policy exceptions</span>
        </div>
      </div>

      {/* Status Breakdown & Lifecycle */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-[#0B1E36] flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#0055D4]" />
          Submission Status Pipeline
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Pending Review', key: 'PENDING_REVIEW', color: 'text-indigo-800 bg-indigo-50 border-indigo-300' },
            { label: 'In Review', key: 'IN_REVIEW', color: 'text-blue-800 bg-blue-50 border-blue-300' },
            { label: 'Changes Requested', key: 'CHANGES_REQUESTED', color: 'text-amber-800 bg-amber-50 border-amber-300' },
            { label: 'Approved', key: 'APPROVED', color: 'text-emerald-800 bg-emerald-50 border-emerald-300' },
            { label: 'Rejected', key: 'REJECTED', color: 'text-red-800 bg-red-50 border-red-300' }
          ].map(st => (
            <div key={st.key} className={`p-4 rounded-xl border-2 ${st.color} space-y-1 font-mono`}>
              <span className="text-[11px] font-bold uppercase block">{st.label}</span>
              <span className="text-2xl font-black">{statusCounts[st.key] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rule Compliance & Overrides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Frequently Triggered Rules */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0B1E36] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Top Triggered Brand Rules
            </h3>
            <span className="text-xs font-mono text-slate-500">Most frequent friction points</span>
          </div>

          {topTriggeredRules.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 italic py-4">No rule triggers recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {topTriggeredRules.map((rule, idx) => {
                const maxCount = Math.max(...topTriggeredRules.map(r => r.triggerCount || 1), 1);
                const percent = Math.round(((rule.triggerCount || 1) / maxCount) * 100);

                return (
                  <div key={idx} className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0055D4]">{rule.ruleId}</span>
                        <span className="text-slate-800 font-semibold truncate max-w-xs">{rule.title || rule.ruleId}</span>
                      </div>
                      <span className="text-xs font-bold text-red-600">
                        {rule.triggerCount} trigger{rule.triggerCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Overridden Rules */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0B1E36] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Top Overridden Rules (Policy Exceptions)
            </h3>
            <span className="text-xs font-mono text-slate-500">Candidate rules for loosening</span>
          </div>

          {topOverriddenRules.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 italic py-4">No rule overrides recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {topOverriddenRules.map((rule, idx) => {
                return (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold text-amber-600 block">{rule.ruleId}</span>
                      <span className="text-slate-800 font-medium">{rule.title || rule.ruleId}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold border border-amber-300">
                      {rule.overrideCount} override{rule.overrideCount > 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
