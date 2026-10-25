import React, { useState, useEffect } from 'react';
import { ArrowLeft, GitCompare, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../api/client.js';

export function RevisionDiffView({ workspaceId, submission, onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromRev, setFromRev] = useState(1);
  const [toRev, setToRev] = useState(submission.revisions?.length || 1);
  const [diffData, setDiffData] = useState(null);

  const availableRevisions = submission.revisions?.map(r => r.revisionNumber) || [1];

  const fetchDiff = async () => {
    if (fromRev === toRev) {
      setError('Select two different revision numbers to compare.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.submissions.diffRevisions(workspaceId, submission._id, fromRev, toRev);
      setDiffData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submission.revisions && submission.revisions.length > 1) {
      setFromRev(submission.revisions[submission.revisions.length - 2].revisionNumber);
      setToRev(submission.revisions[submission.revisions.length - 1].revisionNumber);
    }
  }, [submission]);

  useEffect(() => {
    if (fromRev !== toRev) {
      fetchDiff();
    }
  }, [fromRev, toRev]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Named Improvement #3
              </span>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-indigo-400" />
                Side-by-Side Revision Diff
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Submission: <span className="text-slate-200 font-semibold">{submission.title}</span> (Campaign: {submission.campaignId})
            </p>
          </div>
        </div>

        {/* Revision Selectors */}
        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">From:</span>
            <select
              value={fromRev}
              onChange={e => setFromRev(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
            >
              {availableRevisions.map(num => (
                <option key={num} value={num}>Revision {num}</option>
              ))}
            </select>
          </div>
          <span className="text-slate-600 font-bold">&rarr;</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">To:</span>
            <select
              value={toRev}
              onChange={e => setToRev(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
            >
              {availableRevisions.map(num => (
                <option key={num} value={num}>Revision {num}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchDiff}
            className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 transition"
            title="Refresh Diff"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-3" />
          <p className="text-sm font-medium">Computing deterministic text and visual diff...</p>
        </div>
      ) : diffData ? (
        <div className="space-y-6">
          {/* Summary metrics pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Resolved Findings</span>
                <span className="text-2xl font-bold text-emerald-400">{diffData.findingsDiff?.resolvedFindings?.length || 0}</span>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Persisting Violations</span>
                <span className="text-2xl font-bold text-amber-400">{diffData.findingsDiff?.persistingFindings?.length || 0}</span>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">New Findings Introduced</span>
                <span className="text-2xl font-bold text-rose-400">{diffData.findingsDiff?.newFindings?.length || 0}</span>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Visual Delta Metrics Card */}
          {diffData.visualDelta && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Visual Accessibility & Color Metrics Delta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Rev {fromRev} Contrast:</span>
                  <div className="text-lg font-bold text-slate-200 mt-1">
                    {diffData.visualDelta.fromMetrics?.contrastRatio 
                      ? `${diffData.visualDelta.fromMetrics.contrastRatio.toFixed(2)}:1` 
                      : 'N/A'}
                  </div>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Rev {toRev} Contrast:</span>
                  <div className="text-lg font-bold text-slate-200 mt-1">
                    {diffData.visualDelta.toMetrics?.contrastRatio 
                      ? `${diffData.visualDelta.toMetrics.contrastRatio.toFixed(2)}:1` 
                      : 'N/A'}
                  </div>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Contrast Improvement:</span>
                  <div className={`text-lg font-bold mt-1 ${
                    diffData.visualDelta.contrastDifference > 0 ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {diffData.visualDelta.contrastDifference !== null 
                      ? `${diffData.visualDelta.contrastDifference > 0 ? '+' : ''}${diffData.visualDelta.contrastDifference.toFixed(2)}:1` 
                      : 'No change'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Side-by-side Text Diff */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Word-by-Word Text Diff
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-3 h-3 bg-rose-500/20 border border-rose-500/40 rounded inline-block"></span>
                  Removed text
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/40 rounded inline-block"></span>
                  Added text
                </span>
              </div>
            </div>

            <div className="p-6 font-mono text-sm leading-relaxed bg-slate-950/40 whitespace-pre-wrap">
              {diffData.textDiff?.chunks?.map((chunk, idx) => {
                if (chunk.added) {
                  return (
                    <span
                      key={idx}
                      className="bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded border border-emerald-500/40 font-semibold"
                    >
                      {chunk.value}
                    </span>
                  );
                }
                if (chunk.removed) {
                  return (
                    <span
                      key={idx}
                      className="bg-rose-500/20 text-rose-300 line-through px-1 py-0.5 rounded border border-rose-500/40"
                    >
                      {chunk.value}
                    </span>
                  );
                }
                return <span key={idx} className="text-slate-300">{chunk.value}</span>;
              })}
            </div>
          </div>

          {/* Finding Status Resolution Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resolved Findings */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Resolved in Revision {toRev} ({diffData.findingsDiff?.resolvedFindings?.length || 0})
              </div>
              {diffData.findingsDiff?.resolvedFindings?.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No previous findings were resolved in this revision.</p>
              ) : (
                <div className="space-y-2">
                  {diffData.findingsDiff.resolvedFindings.map((f, i) => (
                    <div key={i} className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs space-y-1">
                      <div className="font-semibold text-emerald-300">{f.message}</div>
                      <div className="text-slate-400 text-[11px]">Rule: {f.ruleReference?.ruleId || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Persisting or New Findings */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                Persisting / New Issues ({ (diffData.findingsDiff?.persistingFindings?.length || 0) + (diffData.findingsDiff?.newFindings?.length || 0) })
              </div>
              {((diffData.findingsDiff?.persistingFindings?.length || 0) + (diffData.findingsDiff?.newFindings?.length || 0)) === 0 ? (
                <p className="text-xs text-slate-500 italic">All findings resolved! Revision {toRev} is fully compliant.</p>
              ) : (
                <div className="space-y-2">
                  {diffData.findingsDiff.persistingFindings?.map((f, i) => (
                    <div key={`p-${i}`} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-300">{f.message}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Persisting</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">Rule: {f.ruleReference?.ruleId || 'N/A'}</div>
                    </div>
                  ))}
                  {diffData.findingsDiff.newFindings?.map((f, i) => (
                    <div key={`n-${i}`} className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-rose-300">{f.message}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">New Issue</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">Rule: {f.ruleReference?.ruleId || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
