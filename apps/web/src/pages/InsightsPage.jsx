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
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.insights.get(workspaceId);
      setInsights(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchInsights();
    }
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-3" />
        <p className="text-sm font-medium">Computing workspace governance analytics & SLA metrics...</p>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="text-rose-400 font-semibold">{error || 'Failed to load governance insights'}</div>
        <button
          onClick={fetchInsights}
          className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 text-xs font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    totalSubmissions = 0,
    statusCounts = {},
    topTriggeredRules = [],
    topOverriddenRules = [],
    firstTimeRightRate = 0,
    averageReviewTurnaroundHours = 0,
    totalOverrides = 0
  } = insights;

  const approvedCount = statusCounts.APPROVED || 0;
  const approvalRate = totalSubmissions > 0 ? ((approvedCount / totalSubmissions) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <PieChart className="w-7 h-7 text-indigo-400" />
            Brand Governance Insights
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics on rule triggers, compliance bottlenecks, human override patterns, and review SLA turnaround.
          </p>
        </div>

        <button
          onClick={fetchInsights}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Analytics
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Creatives</span>
          <div className="text-2xl font-bold text-slate-100">{totalSubmissions}</div>
          <span className="text-[11px] text-slate-500">Across all channels</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Approval Rate</span>
          <div className="text-2xl font-bold text-emerald-400">{approvalRate}%</div>
          <span className="text-[11px] text-emerald-500/80">{approvedCount} approved creatives</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">First-Time-Right</span>
          <div className="text-2xl font-bold text-indigo-400">{(firstTimeRightRate * 100).toFixed(0)}%</div>
          <span className="text-[11px] text-indigo-400/70">Zero revision needed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Avg Review SLA</span>
          <div className="text-2xl font-bold text-amber-400">{averageReviewTurnaroundHours.toFixed(1)}h</div>
          <span className="text-[11px] text-amber-500/80">Intake to approval</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Audited Overrides</span>
          <div className="text-2xl font-bold text-purple-400">{totalOverrides}</div>
          <span className="text-[11px] text-purple-400/80">Human policy exceptions</span>
        </div>
      </div>

      {/* Status Breakdown & Lifecycle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Submission Status Pipeline
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Pending Review', key: 'PENDING_REVIEW', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
            { label: 'In Review', key: 'IN_REVIEW', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
            { label: 'Changes Requested', key: 'CHANGES_REQUESTED', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { label: 'Approved', key: 'APPROVED', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Rejected', key: 'REJECTED', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
          ].map(st => (
            <div key={st.key} className={`p-4 rounded-xl border ${st.color} space-y-1`}>
              <span className="text-[11px] font-semibold block">{st.label}</span>
              <span className="text-xl font-bold">{statusCounts[st.key] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rule Compliance & Overrides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Frequently Triggered Rules */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Top Triggered Brand Rules
            </h3>
            <span className="text-xs text-slate-500">Most frequent friction points</span>
          </div>

          {topTriggeredRules.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No rule triggers recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {topTriggeredRules.map((rule, idx) => {
                const maxCount = Math.max(...topTriggeredRules.map(r => r.triggerCount || 1), 1);
                const percent = Math.round(((rule.triggerCount || 1) / maxCount) * 100);

                return (
                  <div key={idx} className="space-y-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-400 font-mono">{rule.ruleId}</span>
                        <span className="text-slate-200 font-medium truncate max-w-xs">{rule.title || rule.ruleId}</span>
                      </div>
                      <span className="text-xs font-bold text-rose-400 font-mono">
                        {rule.triggerCount} trigger{rule.triggerCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-indigo-500 h-1.5 rounded-full"
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Top Overridden Rules (Policy Exceptions)
            </h3>
            <span className="text-xs text-slate-500">Candidate rules for loosening/revision</span>
          </div>

          {topOverriddenRules.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No rule overrides recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {topOverriddenRules.map((rule, idx) => {
                return (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-amber-400 font-mono block">{rule.ruleId}</span>
                      <span className="text-slate-300 font-medium">{rule.title || rule.ruleId}</span>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-mono font-bold border border-amber-500/20">
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
