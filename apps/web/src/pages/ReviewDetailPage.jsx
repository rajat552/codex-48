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
  ExternalLink,
  Radio,
  X
} from 'lucide-react';
import { api } from '../api/client.js';
import { RevisionDiffView } from './RevisionDiffView.jsx';
import { getChannelInfo } from '../utils/channelUtils.js';

export function ReviewDetailPage({ workspaceId, submissionId, userRoles, onBack }) {
  const [activeSubmissionId, setActiveSubmissionId] = useState(submissionId);
  const [submission, setSubmission] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [channelModal, setChannelModal] = useState(null);

  useEffect(() => {
    setActiveSubmissionId(submissionId);
  }, [submissionId]);

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
      const data = await api.submissions.getById(workspaceId, activeSubmissionId);
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
      const events = await api.audit.list(workspaceId, { submissionId: activeSubmissionId });
      setAuditEvents(events);
    } catch (err) {
      console.error('Failed to load audit events', err);
    }
  };

  const loadAll = async () => {
    if (!submission) {
      setLoading(true);
    }
    setError(null);
    await Promise.all([fetchSubmission(), fetchAudit()]);
    setLoading(false);
  };

  useEffect(() => {
    if (activeSubmissionId) {
      loadAll();
    }
  }, [workspaceId, activeSubmissionId]);

  // Auto-poll if review is currently processing in background
  useEffect(() => {
    let timer = null;
    const s = String(submission?.status || '').toLowerCase();
    if (s === 'submitted' || s === 'processing') {
      timer = setInterval(() => {
        fetchSubmission();
        fetchAudit();
      }, 2000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [submission?.status, workspaceId, activeSubmissionId]);

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
        activeSubmissionId,
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
      await api.submissions.submitDecision(workspaceId, activeSubmissionId, type, comment);
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
      const res = await api.submissions.createRevision(workspaceId, activeSubmissionId, {
        text: revisionModal.copyText,
        copyText: revisionModal.copyText,
        revisionNotes: revisionModal.notes || 'Revised copy based on review findings'
      });
      setRevisionModal({ open: false, copyText: '', notes: '' });
      const newId = res?.data?.id || res?.id;
      if (newId) {
        setActiveSubmissionId(newId);
      } else {
        await loadAll();
      }
    } catch (err) {
      alert(`Failed to submit revision: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !submission) {
    return (
      <div className="p-16 text-center text-slate-600 bg-white rounded-2xl border-2 border-slate-300 shadow-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#F59E0B] mb-3" />
        <p className="text-sm font-mono font-bold text-[#0B1E36]">Loading submission and review evidence...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="p-6 bg-white border-2 border-red-500 rounded-2xl space-y-4 shadow-sm">
        <div className="text-red-700 font-mono font-bold text-sm">{error || 'Submission not found'}</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#0B1E36] text-white rounded-xl hover:bg-[#152B4A] text-xs font-mono font-bold uppercase cursor-pointer"
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

  const currentRev = submission.currentRevision || {
    revisionNumber: submission.revisionNumber || 1,
    copyText: submission.extractedText || submission.text || submission.copyText || '',
    findings: submission.findings || [],
    visualMetrics: submission.processing?.visualMetrics || submission.visualMetrics || null,
    ruleSnapshot: submission.ruleVersionSnapshot || submission.ruleSnapshot || []
  };

  const findings = (currentRev.findings && currentRev.findings.length > 0)
    ? currentRev.findings
    : (submission.findings || []);

  const activeBlockingCount = findings.filter(
    f => f.classification === 'CONFIRMED_RULE_CONFLICT' && (f.status === 'ACTIVE' || !f.override?.overridden)
  ).length;

  const confirmedConflicts = findings.filter(f => f.classification === 'CONFIRMED_RULE_CONFLICT');
  const needsVerification = findings.filter(f => f.classification === 'NEEDS_VERIFICATION');
  const styleAdvisories = findings.filter(f => f.classification === 'ADVISORY_STYLE_VISUAL_CONCERN');

  const revisionsList = (submission.revisions && submission.revisions.length > 0)
    ? submission.revisions
    : [{
        revisionNumber: currentRev.revisionNumber || submission.revisionNumber || 1,
        createdAt: submission.createdAt || new Date(),
        copyText: currentRev.copyText || submission.extractedText || '',
        findings: findings,
        status: submission.status,
        revisionNotes: 'Initial revision intake'
      }];

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Summary */}
      <div className="bg-white border-2 border-[#0B1E36] rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-[4px_4px_0px_#0B1E36]">
        <div className="flex items-center gap-4" data-tour="review-checks-area">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white text-slate-700 hover:text-[#0B1E36] border-2 border-slate-300 hover:border-[#0B1E36] transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-black text-[#0B1E36]">{submission.title || submission.campaignId || 'Creative Review'}</h2>
              <span className={`text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded border-2 ${
                submission.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-500' :
                submission.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-500' :
                submission.status === 'CHANGES_REQUESTED' ? 'bg-amber-50 text-amber-800 border-amber-500' :
                'bg-blue-50 text-[#0055D4] border-blue-400'
              }`}>
                {(submission.status || 'SUBMITTED').replace('_', ' ')}
              </span>
              <span className="text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold border border-slate-300">
                Rev {currentRev.revisionNumber || submission.revisionNumber || 1}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-mono mt-1 flex items-center gap-2 flex-wrap">
              <span>Campaign: <span className="text-[#0B1E36] font-bold">{submission.campaignId || 'General'}</span></span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                Channel:{' '}
                {(() => {
                  const chInfo = getChannelInfo(submission.channel);
                  return (
                    <button
                      type="button"
                      onClick={() => setChannelModal(chInfo)}
                      className="inline-flex items-center gap-1.5 font-bold text-[#0055D4] hover:text-[#003da5] bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
                      title={`Distribution Channel: ${chInfo.full} — Click to view channel details`}
                    >
                      <Radio className="w-3 h-3 text-[#0055D4]" />
                      <span>{chInfo.full}</span>
                    </button>
                  );
                })()}
              </span>
              <span>&bull;</span>
              <span>Created by: <span className="text-[#0B1E36] font-bold">{submission.creatorId?.displayName || submission.createdBy?.displayName || 'User'}</span></span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap" data-tour="corrections-actions">
          <button
            onClick={async () => {
              setActionLoading(true);
              try {
                await api.submissions.triggerReview(workspaceId, submissionId);
                await loadAll();
              } catch (err) {
                alert(err.message || 'Failed to trigger review run');
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-[#0B1E36] border-2 border-[#F59E0B] shadow-[2px_2px_0px_#0B1E36] rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer disabled:opacity-50"
            title="Re-run compliance review engine"
          >
            <RefreshCw className={`w-4 h-4 text-amber-600 ${actionLoading ? 'animate-spin' : ''}`} />
            Run Review
          </button>

          {revisionsList && revisionsList.length > 1 && (
            <button
              onClick={() => setShowDiffView(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#0055D4] border-2 border-[#0055D4] rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer"
            >
              <GitCompare className="w-4 h-4" />
              Compare Revisions
            </button>
          )}

          {isCreatorOrAdmin && (
            <button
              onClick={() => setRevisionModal(prev => ({ ...prev, open: true }))}
              className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-[#0B1E36] border-2 border-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer"
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
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase border-2 border-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] transition cursor-pointer ${
                  activeBlockingCount > 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-slate-300 shadow-none'
                    : 'bg-[#10B981] hover:bg-[#059669] text-white'
                }`}
                title={activeBlockingCount > 0 ? `Cannot approve with ${activeBlockingCount} unresolved blocking conflict(s)` : 'Approve submission'}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </button>

              <button
                onClick={() => setDecisionModal({ open: true, type: 'CHANGES_REQUESTED', comment: '' })}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#0B1E36] border-2 border-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                Changes
              </button>

              <button
                onClick={() => setDecisionModal({ open: true, type: 'REJECTED', comment: '' })}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b-2 border-slate-200 overflow-x-auto no-scrollbar pb-1 sm:pb-0" data-tour="findings-evidence-panel">
        {[
          { id: 'findings', label: `Findings & Review (${findings.length})`, icon: ShieldAlert },
          { id: 'revisions', label: `Revision History (${revisionsList.length})`, icon: History },
          { id: 'audit', label: `Audit Log (${auditEvents.length})`, icon: FileCheck }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex-shrink-0 whitespace-nowrap ${
                isActive
                  ? 'border-[#0055D4] text-[#0055D4] bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-[#0B1E36]'
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
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Submitted Creative Copy</h3>
              <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-sm font-mono text-slate-900 leading-relaxed whitespace-pre-wrap">
                {currentRev.copyText}
              </div>
            </div>

            {/* Visual metrics card if available */}
            {currentRev.visualMetrics && (
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 space-y-3 shadow-sm">
                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Visual & Contrast Metrics</h3>
                <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Contrast Ratio:</span>
                    <span className={`font-black ${
                      currentRev.visualMetrics.contrastRatio >= 4.5 ? 'text-emerald-700' : 'text-red-600'
                    }`}>
                      {currentRev.visualMetrics.contrastRatio ? `${currentRev.visualMetrics.contrastRatio.toFixed(2)}:1` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">WCAG 2.2 AA (4.5:1):</span>
                    <span className={`font-bold ${
                      currentRev.visualMetrics.contrastRatio >= 4.5 ? 'text-emerald-700' : 'text-red-600'
                    }`}>
                      {currentRev.visualMetrics.contrastRatio >= 4.5 ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  {currentRev.visualMetrics.detectedColors && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-600 block mb-1">Detected Color Swatches:</span>
                      <div className="flex items-center gap-2">
                        {currentRev.visualMetrics.detectedColors.map((hex, i) => (
                          <div
                            key={i}
                            title={hex}
                            className="w-6 h-6 rounded-md border-2 border-slate-300 shadow-inner"
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
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 space-y-2 shadow-sm font-mono">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Rule Snapshot</h3>
                <p className="text-xs text-slate-600">
                  Evaluated against <span className="text-[#0B1E36] font-bold">{currentRev.ruleSnapshot.length}</span> active workspace rules frozen at submission intake.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Evidence-Linked Findings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Classification: Confirmed Conflicts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <h3 className="text-sm font-black font-mono text-red-700 uppercase tracking-wider">
                  Confirmed Rule Conflicts ({confirmedConflicts.length})
                </h3>
              </div>

              {confirmedConflicts.length === 0 ? (
                <div className="p-4 rounded-xl bg-white border-2 border-slate-200 text-xs font-mono text-slate-500">
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
                <h3 className="text-sm font-black font-mono text-amber-700 uppercase tracking-wider">
                  Factual Claims Needing Verification ({needsVerification.length})
                </h3>
              </div>

              {needsVerification.length === 0 ? (
                <div className="p-4 rounded-xl bg-white border-2 border-slate-200 text-xs font-mono text-slate-500">
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
                <div className="w-2.5 h-2.5 rounded-full bg-[#0055D4]" />
                <h3 className="text-sm font-black font-mono text-[#0055D4] uppercase tracking-wider">
                  Advisory Style & Tone Feedback ({styleAdvisories.length})
                </h3>
              </div>

              {styleAdvisories.length === 0 ? (
                <div className="p-4 rounded-xl bg-white border-2 border-slate-200 text-xs font-mono text-slate-500">
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
          {revisionsList.map((rev, i) => {
            const isCurrent = (rev._id && String(rev._id) === String(activeSubmissionId)) ||
              (!rev._id && (rev.revisionNumber === (currentRev.revisionNumber || 1)));

            return (
              <div
                key={i}
                className={`bg-white border-2 rounded-2xl p-6 space-y-3 shadow-sm transition-all ${
                  isCurrent ? 'border-[#0055D4] ring-2 ring-blue-100 shadow-[4px_4px_0px_#0055D4]' : 'border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-[#0B1E36]">Revision {rev.revisionNumber || i + 1}</span>
                    <span className="text-xs font-mono text-slate-500">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleString() : 'Revision Timestamp'}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-mono font-bold bg-blue-100 text-[#0055D4] px-2 py-0.5 rounded border border-blue-300">
                        Active Viewing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold border border-slate-300">
                      {rev.findings?.length || 0} findings
                    </span>
                    {rev._id && String(rev._id) !== String(activeSubmissionId) && (
                      <button
                        onClick={() => setActiveSubmissionId(rev._id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#0B1E36] hover:bg-[#152B4A] text-white border border-[#0B1E36] cursor-pointer shadow-xs transition"
                      >
                        Inspect Revision {rev.revisionNumber}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-mono italic">Notes: {rev.revisionNotes || 'No notes provided'}</p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 whitespace-pre-wrap">
                  {rev.copyText || rev.extractedText || 'No text copy provided for this revision.'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#0B1E36]">Tamper-Evident Immutable Audit Log</h3>
          <div className="space-y-3">
            {auditEvents.map(evt => (
              <div key={evt._id} className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0055D4]">{evt.eventType}</span>
                  <span className="text-slate-500">{new Date(evt.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-slate-700">
                  Actor: <span className="font-bold text-[#0B1E36]">{evt.actor?.email || 'System'}</span> (Role: {evt.actor?.role || 'N/A'})
                </div>
                {evt.details && (
                  <pre className="mt-2 p-2 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-800 overflow-x-auto">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0B1E36] rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-[6px_6px_0px_#0B1E36] max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-[#0B1E36] uppercase flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Human Override of Brand Finding
            </h3>
            <p className="text-xs text-slate-600 font-mono leading-relaxed">
              Under strict brand governance, overriding an automated finding requires a clear, documented rationale that is permanently recorded in the append-only audit trail.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-200 text-xs text-slate-900 font-mono">
              "{overrideModal.message}"
            </div>
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#0B1E36] mb-1">
                Substantive Override Justification *
              </label>
              <textarea
                value={overrideModal.reason}
                onChange={e => setOverrideModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Legal exception granted for Summer Flash Sale campaign per Ticket #892"
                rows={3}
                className="w-full bg-white border-2 border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0055D4]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOverrideModal({ open: false, findingId: null, message: '', reason: '' })}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 border-2 border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSubmit}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#F59E0B] hover:bg-[#D97706] text-[#0B1E36] border-2 border-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] cursor-pointer"
              >
                Confirm Override & Record in Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reviewer Decision */}
      {decisionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0B1E36] rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-[6px_6px_0px_#0B1E36] max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-[#0B1E36] uppercase">
              Confirm Decision: {decisionModal.type}
            </h3>
            <p className="text-xs text-slate-600 font-mono">
              {decisionModal.type === 'APPROVED'
                ? 'Approving marks this creative ready for live production deployment.'
                : 'Provide actionable feedback to the creator for revision.'}
            </p>
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[#0B1E36] mb-1">
                Decision Comment {decisionModal.type !== 'APPROVED' ? '*' : '(Optional)'}
              </label>
              <textarea
                value={decisionModal.comment}
                onChange={e => setDecisionModal(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Enter feedback or approval remarks..."
                rows={3}
                className="w-full bg-white border-2 border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0055D4]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDecisionModal({ open: false, type: '', comment: '' })}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 border-2 border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDecisionSubmit}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#0B1E36] hover:bg-[#152B4A] text-white border-2 border-[#0B1E36] shadow-[2px_2px_0px_#F59E0B] cursor-pointer"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Submit Revision */}
      {revisionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0B1E36] rounded-2xl max-w-xl w-full p-4 sm:p-6 space-y-4 shadow-[6px_6px_0px_#0B1E36] max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-[#0B1E36] uppercase flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#0055D4]" />
              Submit Creative Revision
            </h3>
            <p className="text-xs text-slate-600 font-mono">
              Updating copy triggers an automated review against the active brand rules snapshot.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[#0B1E36] mb-1">
                  Updated Copy Text *
                </label>
                <textarea
                  value={revisionModal.copyText}
                  onChange={e => setRevisionModal(prev => ({ ...prev, copyText: e.target.value }))}
                  rows={5}
                  className="w-full bg-white border-2 border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0055D4]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[#0B1E36] mb-1">
                  Revision Notes (Optional)
                </label>
                <input
                  type="text"
                  value={revisionModal.notes}
                  onChange={e => setRevisionModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. Corrected promotional threshold to Rs 999 and removed prohibited terms"
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0055D4]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRevisionModal(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 border-2 border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRevision}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#F59E0B] hover:bg-[#D97706] text-[#0B1E36] border-2 border-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] cursor-pointer"
              >
                Trigger Automated Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Channel Details Modal */}
      {channelModal && (
        <div className="fixed inset-0 bg-[#0B1E36]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-3 border-[#0B1E36] rounded-2xl max-w-md w-full shadow-[6px_6px_0px_#0B1E36] p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border-2 border-blue-300 flex items-center justify-center text-[#0055D4] shadow-xs">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0055D4]">
                    Distribution Channel
                  </span>
                  <h3 className="text-base font-black text-[#0B1E36] leading-tight">
                    {channelModal.full}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setChannelModal(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0B1E36] hover:bg-slate-100 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Channel Category & Coverage
                </span>
                <p className="text-xs text-slate-800 font-sans leading-relaxed">
                  {channelModal.scopeDescription}
                </p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                  Automated Governance Checks Applied
                </span>
                <p className="text-xs text-amber-950 font-sans leading-relaxed">
                  {channelModal.rulesSummary}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setChannelModal(null)}
                className="px-5 py-2 bg-[#0B1E36] text-white hover:bg-[#152B4A] rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_#F59E0B] cursor-pointer"
              >
                Close
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
    ? 'border-slate-300 bg-slate-50 opacity-70'
    : isConflict
    ? 'border-red-400 bg-red-50/40'
    : isVerification
    ? 'border-amber-400 bg-amber-50/40'
    : 'border-blue-300 bg-blue-50/40';

  return (
    <div className={`p-5 rounded-xl border-2 ${borderColor} space-y-3 transition shadow-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              isOverridden
                ? 'bg-slate-200 text-slate-700 border-slate-400'
                : isConflict
                ? 'bg-red-100 text-red-900 border-red-300'
                : isVerification
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-blue-100 text-blue-900 border-blue-300'
            }`}>
              {finding.classification.replace(/_/g, ' ')}
            </span>

            {finding.confidence !== undefined && (
              <span className="text-[10px] font-mono text-slate-500 font-bold">
                Confidence: {(finding.confidence * 100).toFixed(0)}%
              </span>
            )}

            {isOverridden && (
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Human Overridden
              </span>
            )}
          </div>

          <h4 className="text-sm font-black text-[#0B1E36]">{finding.message}</h4>
        </div>

        {isReviewerOrAdmin && !isOverridden && (
          <button
            onClick={() => onOpenOverride(finding)}
            className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 transition cursor-pointer"
          >
            Override
          </button>
        )}
      </div>

      {/* Evidence snippet */}
      {finding.evidenceSnippet && (
        <div className="p-3 bg-white rounded-xl border border-slate-300 text-xs font-mono">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Evidence Detected:</span>
          <span className="text-slate-900 font-bold">"{finding.evidenceSnippet}"</span>
        </div>
      )}

      {/* Rule Citation */}
      {finding.ruleReference && (
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
          <span className="text-[10px] uppercase font-bold text-slate-500">Active Rule:</span>
          <span className="px-2 py-0.5 rounded bg-white border border-slate-300 text-[#0055D4] font-bold text-[11px]">
            {finding.ruleReference.ruleId} &bull; {finding.ruleReference.ruleTitle}
          </span>
        </div>
      )}

      {/* Suggested Correction */}
      {finding.suggestedCorrection && (
        <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs space-y-1">
          <span className="text-[10px] font-mono uppercase font-bold text-amber-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Suggested Correction:
          </span>
          <p className="text-[#0B1E36] font-mono font-medium">{finding.suggestedCorrection}</p>
        </div>
      )}

      {/* Override note if present */}
      {isOverridden && finding.override && (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-mono space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-800">Override Reason:</span>
          <p className="text-slate-800 italic">"{finding.override.reason}"</p>
          <span className="text-[10px] text-slate-500 block">
            By: {finding.override.overriddenBy?.email || 'Reviewer'} &bull; {new Date(finding.override.overriddenAt).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
