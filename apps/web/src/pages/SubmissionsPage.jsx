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

export function SubmissionsPage({ workspaceId, userRoles }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);

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
    setLoading(true);
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
      if (createForm.assetFile) {
        formData.append('asset', createForm.assetFile);
      }
      if (createForm.assetAltText) {
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <FileText className="w-7 h-7 text-indigo-400" />
            Brand Governance Reviews
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Intake, automated rule snapshot verification, WCAG visual compliance, and human approval queue.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition"
        >
          <Plus className="w-4 h-4" />
          New Creative Submission
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {['ALL', 'PENDING_REVIEW', 'IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, campaign, or copy..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-3" />
          <p className="text-sm font-medium">Loading workspace submissions...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-sm">
          {error}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No submissions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try modifying your search or filter criteria.'
              : 'Submit your first creative brief copy or image to run automated brand rule validation.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold mt-2"
          >
            <Plus className="w-4 h-4" />
            Create First Submission
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredSubmissions.map(sub => {
            const currentRev = sub.currentRevision || {};
            const findings = currentRev.findings || [];
            const activeConflicts = findings.filter(
              f => f.classification === 'CONFIRMED_RULE_CONFLICT' && f.status === 'ACTIVE'
            );

            return (
              <div
                key={sub._id}
                onClick={() => setSelectedSubmissionId(sub._id)}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 cursor-pointer transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition truncate">
                      {sub.title}
                    </h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Campaign: {sub.campaignId}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      {sub.channel}
                    </span>
                    <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                      Rev {currentRev.revisionNumber || 1}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1 font-mono">
                    "{currentRev.copyText || 'No text snippet'}"
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span>Submitted by: {sub.createdBy?.displayName || 'User'}</span>
                    <span>&bull;</span>
                    <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  {/* Findings status badge */}
                  {activeConflicts.length > 0 ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {activeConflicts.length} Conflict{activeConflicts.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Compliant
                    </span>
                  )}

                  {/* Overall Submission status */}
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    sub.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    sub.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                    sub.status === 'CHANGES_REQUESTED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                  }`}>
                    {sub.status.replace('_', ' ')}
                  </span>

                  <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Creative Submission */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                New Creative Submission Intake
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Submissions automatically snapshot current active workspace rules and trigger deterministic and AI brand compliance checks.
              </p>
            </div>

            <form onSubmit={handleCreateSubmission} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={createForm.title}
                    onChange={e => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Summer Promo Email Banner"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign ID *</label>
                  <input
                    type="text"
                    required
                    value={createForm.campaignId}
                    onChange={e => setCreateForm(prev => ({ ...prev, campaignId: e.target.value }))}
                    placeholder="e.g. FLASH-2026-Q2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Distribution Channel *</label>
                <select
                  value={createForm.channel}
                  onChange={e => setCreateForm(prev => ({ ...prev, channel: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="SOCIAL">Social Media (Instagram, LinkedIn, X)</option>
                  <option value="EMAIL">Marketing Email</option>
                  <option value="PRINT">Print Media / Billboard</option>
                  <option value="LANDING_PAGE">Web Landing Page</option>
                  <option value="SMS">SMS / Messaging</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Creative Copy Text * (Subject to Terminology & Promotional Checks)
                </label>
                <textarea
                  rows={4}
                  required
                  value={createForm.copyText}
                  onChange={e => setCreateForm(prev => ({ ...prev, copyText: e.target.value }))}
                  placeholder="Paste ad headline, body text, and promotional terms (e.g., Get free delivery on orders over Rs 500!)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Attach Creative Asset (Optional PNG / JPG)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={e => setCreateForm(prev => ({ ...prev, assetFile: e.target.files[0] }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>

              {createForm.assetFile && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Asset Alt Text (Accessibility)
                  </label>
                  <input
                    type="text"
                    value={createForm.assetAltText}
                    onChange={e => setCreateForm(prev => ({ ...prev, assetAltText: e.target.value }))}
                    placeholder="Short description of image content..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating & Running Review...' : 'Submit Creative for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
