import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  UploadCloud,
  RefreshCw,
  Sparkles,
  Radio,
  Info,
  X
} from 'lucide-react';
import { api } from '../api/client.js';
import { ReviewDetailPage } from './ReviewDetailPage.jsx';
import { JudgeDemoModal } from '../components/JudgeDemoModal.jsx';
import { getChannelInfo } from '../utils/channelUtils.js';

export function SubmissionsPage({ workspaceId, userRoles, onNavigateTab, isActive = true }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [channelModal, setChannelModal] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Submission Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    campaignId: '',
    channel: 'SOCIAL',
    copyText: '',
    assetFile: null,
    assetAltText: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSubmissions = async (isManual = false) => {
    if (submissions.length === 0 || isManual) {
      setLoading(true);
    }
    if (isManual) {
      api.clearCache();
    }
    setError(null);
    try {
      const data = await api.submissions.list(workspaceId, {}, { skipCache: true });
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId && (isActive === undefined || isActive)) {
      fetchSubmissions(true);
    }
  }, [workspaceId, isActive]);

  const handleCreateSubmission = async e => {
    e.preventDefault();
    if (!createForm.title || !createForm.campaignId || !createForm.copyText) {
      alert('Please fill out all required fields (title, campaign, copy text).');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', createForm.title);
      formData.append('campaignId', createForm.campaignId);
      formData.append('channel', createForm.channel);
      formData.append('copyText', createForm.copyText);
      formData.append('text', createForm.copyText);
      if (createForm.assetFile) {
        formData.append('file', createForm.assetFile);
        formData.append('asset', createForm.assetFile);
      }
      if (createForm.assetAltText) {
        formData.append('altText', createForm.assetAltText);
        formData.append('assetAltText', createForm.assetAltText);
      }

      const created = await api.submissions.create(workspaceId, formData);
      const newId = created?._id || created?.id || created?.data?._id || created?.data?.id;
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        campaignId: '',
        channel: 'SOCIAL',
        copyText: '',
        assetFile: null,
        assetAltText: ''
      });
      fetchSubmissions();
      // Directly open newly created submission in ReviewDetailPage (2nd page)
      if (newId) {
        setSelectedSubmissionId(newId);
      }
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedSubmissionId) {
    return (
      <ReviewDetailPage
        workspaceId={workspaceId}
        submissionId={selectedSubmissionId}
        userRoles={userRoles}
        onBack={() => {
          setSelectedSubmissionId(null);
          api.clearCache();
          fetchSubmissions(true);
        }}
      />
    );
  }

  const getSubmissionStatus = (sub) => {
    if (!sub) return 'submitted';
    const decisionAction = String(sub.decision?.action || '').toLowerCase().trim();
    if (decisionAction === 'reject' || decisionAction === 'rejected') return 'rejected';
    if (decisionAction === 'approve' || decisionAction === 'approved') return 'approved';
    if (decisionAction === 'request_changes' || decisionAction === 'changes_requested') return 'changes_requested';
    return String(sub.status || 'submitted').toLowerCase().trim();
  };

  const matchesStatus = (subOrStatus, filterId) => {
    if (filterId === 'ALL') return true;
    const s = (typeof subOrStatus === 'object' && subOrStatus !== null)
      ? getSubmissionStatus(subOrStatus)
      : String(subOrStatus || '').toLowerCase().trim();

    if (filterId === 'IN_REVIEW') {
      return ['submitted', 'processing', 'review_ready', 'draft', 'pending_review', 'in_review', 'incomplete'].includes(s);
    }
    if (filterId === 'CHANGES_REQUESTED') {
      return s === 'changes_requested' || s === 'request_changes';
    }
    if (filterId === 'APPROVED') {
      return s === 'approved' || s === 'approve';
    }
    if (filterId === 'REJECTED') {
      return s === 'rejected' || s === 'reject';
    }
    return s === filterId.toLowerCase();
  };

  const statusCounts = {
    ALL: submissions.length,
    IN_REVIEW: submissions.filter(s => matchesStatus(s, 'IN_REVIEW')).length,
    CHANGES_REQUESTED: submissions.filter(s => matchesStatus(s, 'CHANGES_REQUESTED')).length,
    APPROVED: submissions.filter(s => matchesStatus(s, 'APPROVED')).length,
    REJECTED: submissions.filter(s => matchesStatus(s, 'REJECTED')).length
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (!matchesStatus(sub, statusFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (sub.title || sub.originalFilename || sub.campaignId || '').toLowerCase().includes(q);
      const matchCampaign = sub.campaignId?.toLowerCase().includes(q);
      const matchCopy = (sub.extractedText || sub.text || sub.copyText || sub.currentRevision?.copyText || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCampaign && !matchCopy) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4" data-tour="submissions-overview">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#0B1E36] flex items-center gap-3">
            <FileText className="w-7 h-7 text-[#0055D4]" />
            Brand Governance Reviews
          </h1>
          <p className="text-xs text-slate-600 font-mono mt-1">
            Intake, automated rule snapshot verification, WCAG visual compliance, and human approval queue.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fetchSubmissions(true)}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#0B1E36] font-mono font-bold text-xs uppercase tracking-wider border-2 border-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-60"
            title="Refresh submissions list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F59E0B]' : 'text-[#0B1E36]'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowJudgeModal(true)}
            data-tour="btn-judge-demo"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-amber-50/60 text-[#0B1E36] font-mono font-bold text-xs uppercase tracking-wider border-2 border-[#0B1E36] shadow-[3px_3px_0px_#F59E0B] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
            title="1-Click Judge Showcase: Run proposal test scenarios"
          >
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <span>Judge Demo Scenarios</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            data-tour="btn-new-submission"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0B1E36] font-mono font-bold text-xs uppercase tracking-wider border-2 border-[#0B1E36] shadow-[3px_3px_0px_#0B1E36] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            New Creative Submission
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm" data-tour="filter-toolbar">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'IN_REVIEW', label: 'In Review' },
            { id: 'CHANGES_REQUESTED', label: 'Changes Requested' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#0B1E36] text-white border-2 border-[#0B1E36] shadow-[2px_2px_0px_#F59E0B]'
                  : 'bg-slate-50 text-slate-700 hover:text-[#0B1E36] border-2 border-slate-200 hover:border-[#0B1E36]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                statusFilter === tab.id
                  ? 'bg-[#F59E0B] text-[#0B1E36]'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {statusCounts[tab.id] || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-auto sm:min-w-[260px] flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, campaign, or copy..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0055D4]"
          />
        </div>
      </div>

      {/* Submissions List */}
      {(loading && submissions.length === 0) ? (
        <div className="p-16 text-center text-slate-600 bg-white rounded-2xl border-2 border-slate-300 shadow-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#F59E0B] mb-3" />
          <p className="text-sm font-mono font-bold text-[#0B1E36]">Loading workspace submissions...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border-2 border-red-500 text-red-900 rounded-2xl text-sm font-mono">
          {error}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-16 text-center bg-white border-2 border-[#0B1E36] rounded-2xl shadow-[4px_4px_0px_#0B1E36] space-y-3" data-tour="review-checks-area" data-tour-alias="submissions-list-area">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-black text-[#0B1E36] uppercase">
            {submissions.length === 0 ? 'No Submissions Found' : 'No Matching Submissions'}
          </h3>
          <p className="text-xs text-slate-600 font-mono max-w-sm mx-auto">
            {submissions.length === 0
              ? 'Submit your first creative brief copy or image to run automated brand rule validation.'
              : `No submissions currently match status "${statusFilter.replace('_', ' ')}"${searchQuery ? ` and query "${searchQuery}"` : ''}. Click below to view all workspace submissions.`}
          </p>
          {submissions.length === 0 ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0B1E36] font-mono font-bold text-xs uppercase border-2 border-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Create First Submission
            </button>
          ) : (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1E36] hover:bg-[#152B4A] text-white font-mono font-bold text-xs uppercase border-2 border-[#0B1E36] shadow-[2px_2px_0px_#F59E0B] mt-2 cursor-pointer"
            >
              View All Submissions ({submissions.length})
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5" data-tour="review-checks-area" data-tour-alias="submissions-list-area">
          {filteredSubmissions.map((sub, idx) => {
            const currentRev = sub.currentRevision || {};
            const findings = currentRev.findings || [];
            const activeConflicts = findings.filter(
              f => f.classification === 'CONFIRMED_RULE_CONFLICT' && f.status === 'ACTIVE'
            );

            return (
              <div
                key={sub._id}
                onClick={() => setSelectedSubmissionId(sub._id)}
                className="bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-[#0B1E36] rounded-xl p-5 cursor-pointer transition shadow-sm hover:shadow-[4px_4px_0px_#0B1E36] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base font-black text-[#0B1E36] group-hover:text-[#0055D4] transition truncate">
                      {sub.title || sub.originalFilename || (sub.campaignId ? `${sub.campaignId} Creative` : `Creative #${String(sub._id || '').slice(-4)}`)}
                    </h3>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                      Campaign: {sub.campaignId}
                    </span>
                    {(() => {
                      const chInfo = getChannelInfo(sub.channel);
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChannelModal(chInfo);
                          }}
                          className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#0055D4] border border-blue-200 hover:border-blue-400 shadow-xs transition-all cursor-pointer group/chan select-none"
                          title={`Distribution Channel: ${chInfo.full} — Click to view channel details`}
                        >
                          <Radio className="w-3 h-3 text-[#0055D4] group-hover/chan:scale-110 transition-transform" />
                          <span>{chInfo.full}</span>
                        </button>
                      );
                    })()}
                    <span
                      className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300"
                      title={`Revision: Rev ${sub.revisionNumber || currentRev.revisionNumber || 1}`}
                    >
                      Rev {sub.revisionNumber || currentRev.revisionNumber || 1}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1 font-mono">
                    "{sub.extractedText || sub.text || sub.copyText || currentRev.copyText || 'No text snippet'}"
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                    <span>Submitted by: {sub.createdBy?.displayName || 'User'}</span>
                    <span>&bull;</span>
                    <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  {/* Findings status badge */}
                  {activeConflicts.length > 0 ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded bg-red-50 text-red-700 border-2 border-red-500">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {activeConflicts.length} Conflict{activeConflicts.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border-2 border-emerald-500">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Compliant
                    </span>
                  )}

                  {/* Overall Submission status */}
                  {(() => {
                    const effectiveStatus = getSubmissionStatus(sub);
                    return (
                      <span className={`text-xs font-mono font-bold uppercase px-3 py-1 rounded border-2 ${
                        effectiveStatus === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-[1px_1px_0px_#10B981]' :
                        effectiveStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-500 shadow-[1px_1px_0px_#EF4444]' :
                        effectiveStatus === 'changes_requested' ? 'bg-amber-50 text-amber-800 border-amber-500 shadow-[1px_1px_0px_#F59E0B]' :
                        'bg-blue-50 text-[#0055D4] border-blue-400'
                      }`}>
                        {effectiveStatus.replace('_', ' ')}
                      </span>
                    );
                  })()}

                  {/* MLH Signature Golden Arrow Badge */}
                  <div className="w-8 h-8 rounded-lg bg-[#F59E0B] group-hover:bg-[#D97706] border-2 border-[#0B1E36] flex items-center justify-center text-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] transition-all">
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Creative Submission */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0B1E36] rounded-2xl max-w-xl w-full p-4 sm:p-6 space-y-5 shadow-[6px_6px_0px_#0B1E36] max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-black text-[#0B1E36] uppercase flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                New Creative Submission Intake
              </h2>
              <p className="text-xs text-slate-600 font-mono mt-1">
                Submissions automatically snapshot current active workspace rules and trigger deterministic and AI brand compliance checks.
              </p>
            </div>

            <form onSubmit={handleCreateSubmission} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#0B1E36] mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={createForm.title}
                    onChange={e => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Summer Promo Email Banner"
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0055D4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#0B1E36] mb-1">Campaign ID *</label>
                  <input
                    type="text"
                    required
                    value={createForm.campaignId}
                    onChange={e => setCreateForm(prev => ({ ...prev, campaignId: e.target.value }))}
                    placeholder="e.g. FLASH-2026-Q2"
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0055D4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#0B1E36] mb-1">Distribution Channel *</label>
                <select
                  value={createForm.channel}
                  onChange={e => setCreateForm(prev => ({ ...prev, channel: e.target.value }))}
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0055D4] cursor-pointer"
                >
                  <option value="SOCIAL">Social Media (Instagram, LinkedIn, X)</option>
                  <option value="EMAIL">Marketing Email</option>
                  <option value="PRINT">Print Media / Billboard</option>
                  <option value="LANDING_PAGE">Web Landing Page</option>
                  <option value="SMS">SMS / Messaging</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#0B1E36] mb-1">
                  Creative Copy Text * (Subject to Terminology & Promotional Checks)
                </label>
                <textarea
                  rows={4}
                  required
                  value={createForm.copyText}
                  onChange={e => setCreateForm(prev => ({ ...prev, copyText: e.target.value }))}
                  placeholder="Paste ad headline, body text, and promotional terms (e.g., Get free delivery on orders over Rs 500!)..."
                  className="w-full bg-white border-2 border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0055D4]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#0B1E36] mb-1">
                  Attach Creative Asset (Optional PNG / JPG)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={e => setCreateForm(prev => ({ ...prev, assetFile: e.target.files[0] }))}
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-2 file:border-[#0B1E36] file:text-xs file:font-mono file:font-bold file:bg-[#F59E0B] file:text-[#0B1E36] hover:file:bg-[#D97706] cursor-pointer"
                />
              </div>

              {createForm.assetFile && (
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#0B1E36] mb-1">
                    Asset Alt Text (Accessibility)
                  </label>
                  <input
                    type="text"
                    value={createForm.assetAltText}
                    onChange={e => setCreateForm(prev => ({ ...prev, assetAltText: e.target.value }))}
                    placeholder="Short description of image content..."
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0055D4]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 border-2 border-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#F59E0B] hover:bg-[#D97706] text-[#0B1E36] border-2 border-[#0B1E36] shadow-[3px_3px_0px_#0B1E36] transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Creating & Running Review...' : 'Submit Creative for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Judge Demo Scenarios Showcase Modal */}
      <JudgeDemoModal
        isOpen={showJudgeModal}
        onClose={() => setShowJudgeModal(false)}
        workspaceId={workspaceId}
        onSubmissionCreated={(id) => {
          setSelectedSubmissionId(id);
          fetchSubmissions();
        }}
        onNavigateTab={onNavigateTab}
      />

      {/* Distribution Channel Details Modal */}
      {channelModal && (
        <div className="fixed inset-0 bg-[#0B1E36]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-3 border-[#0B1E36] rounded-2xl max-w-md w-full shadow-[6px_6px_0px_#0B1E36] p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
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
