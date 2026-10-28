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
      const data = await api.submissions.diffRevisions(workspaceId, submission._id || submission.id, fromRev, toRev);
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
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-[#0B1E36] rounded-2xl p-6 shadow-[4px_4px_0px_#0B1E36]">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white text-slate-700 hover:text-[#0B1E36] border-2 border-slate-300 hover:border-[#0B1E36] transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-[#0055D4] border border-blue-300">
                Named Improvement #3
              </span>
              <h2 className="text-xl font-black text-[#0B1E36] flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-[#0055D4]" />
                Side-by-Side Revision Diff
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-mono mt-1">
              Submission: <span className="text-[#0B1E36] font-bold">{submission.title}</span> (Campaign: {submission.campaignId})
            </p>
          </div>
        </div>

        {/* Revision Selectors */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border-2 border-slate-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-bold uppercase">From:</span>
            <select
              value={fromRev}
              onChange={e => setFromRev(Number(e.target.value))}
              className="bg-white border-2 border-slate-300 text-slate-900 font-bold text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-[#0055D4] cursor-pointer"
            >
              {availableRevisions.map(num => (
                <option key={num} value={num}>Revision {num}</option>
              ))}
            </select>
          </div>
          <span className="text-[#0B1E36] font-black">&rarr;</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-bold uppercase">To:</span>
            <select
              value={toRev}
              onChange={e => setToRev(Number(e.target.value))}
              className="bg-white border-2 border-slate-300 text-slate-900 font-bold text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-[#0055D4] cursor-pointer"
            >
              {availableRevisions.map(num => (
                <option key={num} value={num}>Revision {num}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchDiff}
            className="p-1.5 rounded-lg bg-[#0B1E36] text-white hover:bg-[#152B4A] transition cursor-pointer"
            title="Refresh Diff"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F59E0B]' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-500 text-red-900 text-sm font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-600 bg-white rounded-2xl border-2 border-slate-300 shadow-sm font-mono">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#F59E0B] mb-3" />
          <p className="text-sm font-bold text-[#0B1E36]">Computing deterministic text and visual diff...</p>
        </div>
      ) : diffData ? (
        <div className="space-y-6">
          {/* Summary metrics pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border-2 border-slate-300 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs text-slate-500 block font-mono font-bold uppercase tracking-wider">Resolved Findings</span>
                <span className="text-3xl font-black text-emerald-600 font-mono">{diffData.findingsDiff?.resolvedFindings?.length || 0}</span>
              </div>
              <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-emerald-700">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border-2 border-slate-300 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs text-slate-500 block font-mono font-bold uppercase tracking-wider">Persisting Violations</span>
                <span className="text-3xl font-black text-amber-600 font-mono">{diffData.findingsDiff?.persistingFindings?.length || 0}</span>
              </div>
              <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border-2 border-slate-300 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs text-slate-500 block font-mono font-bold uppercase tracking-wider">New Findings Introduced</span>
                <span className="text-3xl font-black text-red-600 font-mono">{diffData.findingsDiff?.newFindings?.length || 0}</span>
              </div>
              <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-700">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Visual Delta Metrics Card */}
          {diffData.visualDelta && (
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#0B1E36] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0055D4]" />
                Visual Accessibility & Color Metrics Delta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                  <span className="text-xs text-slate-500 font-bold uppercase">Rev {fromRev} Contrast:</span>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {diffData.visualDelta.fromMetrics?.contrastRatio 
                      ? `${diffData.visualDelta.fromMetrics.contrastRatio.toFixed(2)}:1` 
                      : 'N/A'}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                  <span className="text-xs text-slate-500 font-bold uppercase">Rev {toRev} Contrast:</span>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {diffData.visualDelta.toMetrics?.contrastRatio 
                      ? `${diffData.visualDelta.toMetrics.contrastRatio.toFixed(2)}:1` 
                      : 'N/A'}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                  <span className="text-xs text-slate-500 font-bold uppercase">Contrast Improvement:</span>
                  <div className={`text-lg font-black mt-1 ${
                    diffData.visualDelta.contrastDifference > 0 ? 'text-emerald-700' : 'text-slate-800'
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
          <div className="bg-white border-2 border-[#0B1E36] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0B1E36]">
            <div className="p-4 border-b-2 border-slate-200 bg-slate-50 flex items-center justify-between font-mono">
              <h3 className="text-sm font-black uppercase text-[#0B1E36] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Word-by-Word Text Diff
              </h3>
              <div className="flex items-center gap-3 text-xs font-bold uppercase">
                <span className="flex items-center gap-1.5 text-red-700">
                  <span className="w-3 h-3 bg-red-100 border border-red-400 rounded inline-block"></span>
                  Removed text
                </span>
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-3 h-3 bg-emerald-100 border border-emerald-400 rounded inline-block"></span>
                  Added text
                </span>
              </div>
            </div>

            <div className="p-6 font-mono text-sm leading-relaxed bg-white whitespace-pre-wrap text-slate-900">
              {diffData.textDiff?.chunks?.map((chunk, idx) => {
                if (chunk.added) {
                  return (
                    <span
                      key={idx}
                      className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded border border-emerald-400 font-bold"
                    >
                      {chunk.value}
                    </span>
                  );
                }
                if (chunk.removed) {
                  return (
                    <span
                      key={idx}
                      className="bg-red-100 text-red-900 line-through px-1 py-0.5 rounded border border-red-300"
                    >
                      {chunk.value}
                    </span>
                  );
                }
                return <span key={idx} className="text-slate-800">{chunk.value}</span>;
              })}
            </div>
          </div>

          {/* Finding Status Resolution Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resolved Findings */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 space-y-3 shadow-sm font-mono">
              <div className="flex items-center gap-2 text-emerald-800 font-black text-sm uppercase">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Resolved in Revision {toRev} ({diffData.findingsDiff?.resolvedFindings?.length || 0})
              </div>
              {diffData.findingsDiff?.resolvedFindings?.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No previous findings were resolved in this revision.</p>
              ) : (
                <div className="space-y-2">
                  {diffData.findingsDiff?.resolvedFindings?.map((f, i) => (
                    <div key={i} className="p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-emerald-900">{f.message}</div>
                      <div className="text-slate-500 text-[11px]">Rule: {f.ruleReference?.ruleId || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Persisting or New Findings */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 space-y-3 shadow-sm font-mono">
              <div className="flex items-center gap-2 text-amber-800 font-black text-sm uppercase">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Persisting / New Issues ({ (diffData.findingsDiff?.persistingFindings?.length || 0) + (diffData.findingsDiff?.newFindings?.length || 0) })
              </div>
              {((diffData.findingsDiff?.persistingFindings?.length || 0) + (diffData.findingsDiff?.newFindings?.length || 0)) === 0 ? (
                <p className="text-xs text-slate-500 italic">All findings resolved! Revision {toRev} is fully compliant.</p>
              ) : (
                <div className="space-y-2">
                  {diffData.findingsDiff.persistingFindings?.map((f, i) => (
                    <div key={`p-${i}`} className="p-3 bg-amber-50 border-2 border-amber-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900">{f.message}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">Persisting</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">Rule: {f.ruleReference?.ruleId || 'N/A'}</div>
                    </div>
                  ))}
                  {diffData.findingsDiff.newFindings?.map((f, i) => (
                    <div key={`n-${i}`} className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-900">{f.message}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-200 text-red-900">New Issue</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">Rule: {f.ruleReference?.ruleId || 'N/A'}</div>
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
