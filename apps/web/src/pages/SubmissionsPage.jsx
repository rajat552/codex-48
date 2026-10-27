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
  Sparkles
} from 'lucide-react';
import { api } from '../api/client.js';
import { ReviewDetailPage } from './ReviewDetailPage.jsx';
import { JudgeDemoModal } from '../components/JudgeDemoModal.jsx';

export function SubmissionsPage({ workspaceId, userRoles, onNavigateTab }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [showJudgeModal, setShowJudgeModal] = useState(false);

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

  const fetchSubmissions = async () => {
    if (submissions.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await api.submissions.list(workspaceId);
      setSubmissions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchSubmissions();
    }
  }, [workspaceId]);

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
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        campaignId: '',
        channel: 'SOCIAL',
        copyText: '',
        assetFile: null,
        assetAltText: ''
      });
      await fetchSubmissions();
      // Directly open newly created submission
      setSelectedSubmissionId(created._id);
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
          fetchSubmissions();
        }}
      />
    );
  }

  const filteredSubmissions = submissions.filter(sub => {
    if (statusFilter !== 'ALL' && sub.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = sub.title?.toLowerCase().includes(q);
      const matchCampaign = sub.campaignId?.toLowerCase().includes(q);
      const matchCopy = sub.currentRevision?.copyText?.toLowerCase().includes(q);
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
          {['ALL', 'PENDING_REVIEW', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition cursor-pointer ${
                statusFilter === status
                  ? 'bg-[#0B1E36] text-white border-2 border-[#0B1E36] shadow-[2px_2px_0px_#F59E0B]'
                  : 'bg-slate-50 text-slate-700 hover:text-[#0B1E36] border-2 border-slate-200 hover:border-[#0B1E36]'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
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
          <h3 className="text-base font-black text-[#0B1E36] uppercase">No submissions found</h3>
          <p className="text-xs text-slate-600 font-mono max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try modifying your search or filter criteria.'
              : 'Submit your first creative brief copy or image to run automated brand rule validation.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0B1E36] font-mono font-bold text-xs uppercase border-2 border-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] mt-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Create First Submission
          </button>
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
                      {sub.title}
                    </h3>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                      Campaign: {sub.campaignId}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0055D4] border border-blue-200">
                      {sub.channel}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                      Rev {currentRev.revisionNumber || 1}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1 font-mono">
                    "{currentRev.copyText || 'No text snippet'}"
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
                  <span className={`text-xs font-mono font-bold uppercase px-3 py-1 rounded border-2 ${
                    sub.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-500' :
                    sub.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-500' :
                    sub.status === 'CHANGES_REQUESTED' ? 'bg-amber-50 text-amber-800 border-amber-500' :
                    'bg-blue-50 text-[#0055D4] border-blue-400'
                  }`}>
                    {sub.status.replace('_', ' ')}
                  </span>

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
          <div className="bg-white border-2 border-[#0B1E36] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-[6px_6px_0px_#0B1E36]">
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
    </div>
  );
}
