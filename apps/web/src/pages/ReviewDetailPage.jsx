import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Sparkles,
  GitCompare,
  PlusCircle,
  ShieldAlert,
  History,
  FileCheck,
  Send,
  Eye,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../api/client.js';
import { RevisionDiffView } from './RevisionDiffView.jsx';

export function ReviewDetailPage({ workspaceId, submissionId, userRoles, onBack }) {
  const [submission, setSubmission] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // View state
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' | 'revisions' | 'audit'
  const [showDiffView, setShowDiffView] = useState(false);

  // Modals
  const [overrideModal, setOverrideModal] = useState({ open: false, findingId: null, message: '', reason: '' });
  const [decisionModal, setDecisionModal] = useState({ open: false, type: '', comment: '' });
  const [revisionModal, setRevisionModal] = useState({ open: false, copyText: '', notes: '' });

  const isReviewerOrAdmin = userRoles.includes('REVIEWER') || userRoles.includes('ADMIN');
  const isCreatorOrAdmin = userRoles.includes('CREATOR') || userRoles.includes('ADMIN');

  const fetchSubmission = async () => {
    try {
      const data = await api.submissions.getById(workspaceId, submissionId);
      setSubmission(data);
      if (data.currentRevision?.copyText) {
        setRevisionModal(prev => ({ ...prev, copyText: data.currentRevision.copyText }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchAudit = async () => {
    try {
      const events = await api.audit.list(workspaceId, { submissionId });
      setAuditEvents(events);
    } catch (err) {
      console.error('Failed to load audit events', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchSubmission(), fetchAudit()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [workspaceId, submissionId]);

  // Handle Finding Override
  const handleOverrideSubmit = async () => {
    if (!overrideModal.reason || overrideModal.reason.trim().length < 5) {
      alert('A substantive override reason (at least 5 characters) is required for compliance audit logs.');
      return;
    }
    setActionLoading(true);
    try {
      await api.submissions.overrideFinding(
        workspaceId,
        submissionId,
        overrideModal.findingId,
        overrideModal.reason
      );
      setOverrideModal({ open: false, findingId: null, message: '', reason: '' });
      await loadAll();
    } catch (err) {
      alert(`Override failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reviewer Decision (Approve / Reject / Changes Requested)
  const handleDecisionSubmit = async () => {
    const { type, comment } = decisionModal;
    if ((type === 'REJECTED' || type === 'CHANGES_REQUESTED') && (!comment || comment.trim().length < 5)) {
      alert('A comment explaining the decision (at least 5 characters) is required.');
      return;
    }
    setActionLoading(true);
    try {
      await api.submissions.submitDecision(workspaceId, submissionId, type, comment);
      setDecisionModal({ open: false, type: '', comment: '' });
      await loadAll();
    } catch (err) {
      alert(`Decision failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle New Revision Submission
  const handleCreateRevision = async () => {
    if (!revisionModal.copyText || revisionModal.copyText.trim().length === 0) {
      alert('Revision copy text cannot be empty.');
      return;
    }
    setActionLoading(true);
    try {
      await api.submissions.createRevision(workspaceId, submissionId, {
        copyText: revisionModal.copyText,
        revisionNotes: revisionModal.notes || 'Revised copy based on review findings'
      });
      setRevisionModal({ open: false, copyText: '', notes: '' });
      await loadAll();
    } catch (err) {
      alert(`Failed to submit revision: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-3" />
        <p className="text-sm font-medium">Loading submission and review evidence...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="text-rose-400 font-semibold">{error || 'Submission not found'}</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 text-sm font-medium"
        >
          Back to Submissions
        </button>
      </div>
    );
  }

  if (showDiffView) {
    return (
      <RevisionDiffView
        workspaceId={workspaceId}
        submission={submission}
        onBack={() => setShowDiffView(false)}
      />
    );
  }

  const currentRev = submission.currentRevision || {};
  const findings = currentRev.findings || [];
  const activeBlockingCount = findings.filter(
    f => f.classification === 'CONFIRMED_RULE_CONFLICT' && f.status === 'ACTIVE'
  ).length;

  const confirmedConflicts = findings.filter(f => f.classification === 'CONFIRMED_RULE_CONFLICT');
  const needsVerification = findings.filter(f => f.classification === 'NEEDS_VERIFICATION');
  const styleAdvisories = findings.filter(f => f.classification === 'ADVISORY_STYLE_VISUAL_CONCERN');

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-100">{submission.title}</h2>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                submission.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                submission.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                submission.status === 'CHANGES_REQUESTED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              }`}>
                {submission.status.replace('_', ' ')}
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                Rev {currentRev.revisionNumber || 1}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Campaign: <span className="text-slate-300 font-medium">{submission.campaignId}</span> &bull; Channel:{' '}
              <span className="text-slate-300 font-medium">{submission.channel}</span> &bull; Created by:{' '}
              <span className="text-slate-300 font-medium">{submission.createdBy?.displayName || 'User'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {submission.revisions && submission.revisions.length > 1 && (
            <button
              onClick={() => setShowDiffView(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition"
            >
              <GitCompare className="w-4 h-4" />
              Compare Revisions
            </button>
          )}

          {isCreatorOrAdmin && (
            <button
              onClick={() => setRevisionModal(prev => ({ ...prev, open: true }))}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <PlusCircle className="w-4 h-4" />
              Submit Revision
            </button>
          )}

          {isReviewerOrAdmin && submission.status !== 'APPROVED' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDecisionModal({ open: true, type: 'APPROVED', comment: '' })}
                disabled={activeBlockingCount > 0}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeBlockingCount > 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                }`}
                title={activeBlockingCount > 0 ? `Cannot approve with ${activeBlockingCount} unresolved blocking conflict(s)` : 'Approve submission'}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </button>

              <button
                onClick={() => setDecisionModal({ open: true, type: 'CHANGES_REQUESTED', comment: '' })}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/30 rounded-xl text-xs font-semibold transition"
              >
                <AlertTriangle className="w-4 h-4" />
                Changes
              </button>

              <button
                onClick={() => setDecisionModal({ open: true, type: 'REJECTED', comment: '' })}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/30 rounded-xl text-xs font-semibold transition"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        {[
          { id: 'findings', label: `Findings & Review (${findings.length})`, icon: ShieldAlert },
          { id: 'revisions', label: `Revision History (${submission.revisions?.length || 1})`, icon: History },
          { id: 'audit', label: `Audit Log (${auditEvents.length})`, icon: FileCheck }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
                isActive
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Findings & Content */}
      {activeTab === 'findings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Creative copy and Visual metrics */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submitted Creative Copy</h3>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-sm font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                {currentRev.copyText}
              </div>
            </div>

            {/* Visual metrics card if available */}
            {currentRev.visualMetrics && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visual & Contrast Metrics</h3>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Contrast Ratio:</span>
                    <span className={`font-bold font-mono ${
                      currentRev.visualMetrics.contrastRatio >= 4.5 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {currentRev.visualMetrics.contrastRatio ? `${currentRev.visualMetrics.contrastRatio.toFixed(2)}:1` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">WCAG 2.2 AA (4.5:1):</span>
                    <span className={`font-semibold ${
                      currentRev.visualMetrics.contrastRatio >= 4.5 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {currentRev.visualMetrics.contrastRatio >= 4.5 ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  {currentRev.visualMetrics.detectedColors && (
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-400 block mb-1">Detected Color Swatches:</span>
                      <div className="flex items-center gap-2">
                        {currentRev.visualMetrics.detectedColors.map((hex, i) => (
                          <div
                            key={i}
                            title={hex}
                            className="w-6 h-6 rounded-md border border-slate-700 shadow-inner"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rules Snapshot info */}
            {currentRev.ruleSnapshot && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Rule Snapshot</h3>
                <p className="text-xs text-slate-400">
                  Evaluated against <span className="text-slate-200 font-semibold">{currentRev.ruleSnapshot.length}</span> active workspace rules frozen at submission intake.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Evidence-Linked Findings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Classification: Confirmed Conflicts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">
                  Confirmed Rule Conflicts ({confirmedConflicts.length})
                </h3>
              </div>

              {confirmedConflicts.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
                  No confirmed rule conflicts detected in this revision.
                </div>
              ) : (
                confirmedConflicts.map((finding, idx) => (
                  <FindingCard
                    key={idx}
                    finding={finding}
                    isReviewerOrAdmin={isReviewerOrAdmin}
                    onOpenOverride={f => setOverrideModal({ open: true, findingId: f._id, message: f.message, reason: '' })}
                  />
                ))
              )}
            </div>

            {/* Classification: Needs Verification */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                  Factual Claims Needing Verification ({needsVerification.length})
                </h3>
              </div>

              {needsVerification.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
                  No unverified factual claims flagged.
                </div>
              ) : (
                needsVerification.map((finding, idx) => (
                  <FindingCard
                    key={idx}
                    finding={finding}
                    isReviewerOrAdmin={isReviewerOrAdmin}
                    onOpenOverride={f => setOverrideModal({ open: true, findingId: f._id, message: f.message, reason: '' })}
                  />
                ))
              )}
            </div>

            {/* Classification: Style & Tone Advisories */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
                  Advisory Style & Tone Feedback ({styleAdvisories.length})
                </h3>
              </div>

              {styleAdvisories.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
                  No style or visual advisories.
                </div>
              ) : (
                styleAdvisories.map((finding, idx) => (
                  <FindingCard
                    key={idx}
                    finding={finding}
                    isReviewerOrAdmin={isReviewerOrAdmin}
                    onOpenOverride={f => setOverrideModal({ open: true, findingId: f._id, message: f.message, reason: '' })}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Revision History */}
      {activeTab === 'revisions' && (
        <div className="space-y-4">
          {submission.revisions?.map((rev, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-100">Revision {rev.revisionNumber}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(rev.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {rev.findings?.length || 0} findings
                </span>
              </div>
              <p className="text-xs text-slate-400 italic">Notes: {rev.revisionNotes || 'No notes provided'}</p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300">
                {rev.copyText}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Tamper-Evident Immutable Audit Log</h3>
          <div className="space-y-3">
            {auditEvents.map(evt => (
              <div key={evt._id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400 font-mono">{evt.eventType}</span>
                  <span className="text-slate-500">{new Date(evt.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-slate-300">
                  Actor: <span className="font-medium text-slate-200">{evt.actor?.email || 'System'}</span> (Role: {evt.actor?.role || 'N/A'})
                </div>
                {evt.details && (
                  <pre className="mt-2 p-2 bg-slate-900 rounded text-[11px] text-slate-400 overflow-x-auto">
                    {JSON.stringify(evt.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Finding Override */}
      {overrideModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Human Override of Brand Finding
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Under strict brand governance, overriding an automated finding requires a clear, documented rationale that is permanently recorded in the append-only audit trail.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono">
              "{overrideModal.message}"
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Substantive Override Justification *
              </label>
              <textarea
                value={overrideModal.reason}
                onChange={e => setOverrideModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Legal exception granted for Summer Flash Sale campaign per Ticket #892"
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOverrideModal({ open: false, findingId: null, message: '', reason: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSubmit}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20"
              >
                Confirm Override & Record in Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reviewer Decision */}
      {decisionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">
              Confirm Decision: {decisionModal.type}
            </h3>
            <p className="text-xs text-slate-400">
              {decisionModal.type === 'APPROVED'
                ? 'Approving marks this creative ready for live production deployment.'
                : 'Provide actionable feedback to the creator for revision.'}
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Decision Comment {decisionModal.type !== 'APPROVED' ? '*' : '(Optional)'}
              </label>
              <textarea
                value={decisionModal.comment}
                onChange={e => setDecisionModal(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Enter feedback or approval remarks..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDecisionModal({ open: false, type: '', comment: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDecisionSubmit}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Submit Revision */}
      {revisionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-400" />
              Submit Creative Revision
            </h3>
            <p className="text-xs text-slate-400">
              Updating copy triggers an automated review against the active brand rules snapshot.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Updated Copy Text *
                </label>
                <textarea
                  value={revisionModal.copyText}
                  onChange={e => setRevisionModal(prev => ({ ...prev, copyText: e.target.value }))}
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Revision Notes (Optional)
                </label>
                <input
                  type="text"
                  value={revisionModal.notes}
                  onChange={e => setRevisionModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. Corrected promotional threshold to Rs 999 and removed prohibited terms"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRevisionModal(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRevision}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
              >
                Trigger Automated Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FindingCard({ finding, isReviewerOrAdmin, onOpenOverride }) {
  const isConflict = finding.classification === 'CONFIRMED_RULE_CONFLICT';
  const isVerification = finding.classification === 'NEEDS_VERIFICATION';
  const isOverridden = finding.status === 'OVERRIDDEN';

  const borderColor = isOverridden
    ? 'border-slate-800 bg-slate-950/40 opacity-70'
    : isConflict
    ? 'border-rose-500/30 bg-rose-500/5'
    : isVerification
    ? 'border-amber-500/30 bg-amber-500/5'
    : 'border-indigo-500/30 bg-indigo-500/5';

  return (
    <div className={`p-5 rounded-2xl border ${borderColor} space-y-3 transition`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
              isOverridden
                ? 'bg-slate-800 text-slate-400'
                : isConflict
                ? 'bg-rose-500/20 text-rose-300'
                : isVerification
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-indigo-500/20 text-indigo-300'
            }`}>
              {finding.classification.replace(/_/g, ' ')}
            </span>

            {finding.confidence !== undefined && (
              <span className="text-[10px] font-mono text-slate-500">
                Confidence: {(finding.confidence * 100).toFixed(0)}%
              </span>
            )}

            {isOverridden && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Human Overridden
              </span>
            )}
          </div>

          <h4 className="text-sm font-semibold text-slate-200">{finding.message}</h4>
        </div>

        {isReviewerOrAdmin && !isOverridden && (
          <button
            onClick={() => onOpenOverride(finding)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            Override
          </button>
        )}
      </div>

      {/* Evidence snippet */}
      {finding.evidenceSnippet && (
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Evidence Detected:</span>
          <span className="text-slate-300 font-mono">"{finding.evidenceSnippet}"</span>
        </div>
      )}

      {/* Rule Citation */}
      {finding.ruleReference && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-[10px] uppercase font-bold text-slate-500">Active Rule:</span>
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-[11px]">
            {finding.ruleReference.ruleId} &bull; {finding.ruleReference.ruleTitle}
          </span>
        </div>
      )}

      {/* Suggested Correction */}
      {finding.suggestedCorrection && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Suggested Correction:
          </span>
          <p className="text-indigo-200 font-mono">{finding.suggestedCorrection}</p>
        </div>
      )}

      {/* Override note if present */}
      {isOverridden && finding.override && (
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Override Reason:</span>
          <p className="text-slate-300 italic">"{finding.override.reason}"</p>
          <span className="text-[10px] text-slate-500 block">
            By: {finding.override.overriddenBy?.email || 'Reviewer'} &bull; {new Date(finding.override.overriddenAt).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
