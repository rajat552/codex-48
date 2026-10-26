import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Layers } from 'lucide-react';
import { ApiClient } from '../api/client';

export function BriefImportPage({ workspace, userRoles }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState(null);
  const [error, setError] = useState(null);

  const isAdmin = userRoles.includes('ADMIN');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setConvertResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await ApiClient.uploadBrief(workspace._id, formData);
      setImportResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleConvert = async () => {
    if (!importResult?._id) return;
    setConverting(true);
    setError(null);
    try {
      const data = await ApiClient.convertBriefToRules(workspace._id, importResult._id, {
        selectedCandidateIds: [] // convert all
      });
      setConvertResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tight text-[#0B1E36] flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-[#0055D4]" />
          Multi-Format Brief Parser (PDF / DOCX)
        </h1>
        <p className="text-xs text-slate-600 font-mono mt-1">
          Named Improvement 1: Extract text, headings, and candidate policy statements from campaign briefs
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border-2 border-red-500 text-xs font-mono text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-white border-2 border-[#0B1E36] rounded-2xl p-6 mb-8 shadow-[4px_4px_0px_#0B1E36]">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 hover:border-[#0055D4] rounded-xl p-8 text-center transition-colors bg-slate-50/50">
            <input
              type="file"
              id="brief-file"
              accept=".pdf,.docx"
              onChange={e => setFile(e.target.files[0] || null)}
              className="hidden"
            />
            <label htmlFor="brief-file" className="cursor-pointer">
              <FileText className="w-10 h-10 text-[#0055D4] mx-auto mb-3" />
              <div className="text-sm font-black text-[#0B1E36]">
                {file ? file.name : 'Select or drop a PDF or DOCX Campaign Brief'}
              </div>
              <div className="text-xs font-mono text-slate-500 mt-1">
                Supported formats: .pdf (PDF.js parser) and .docx (Mammoth parser). Max: 10MB.
              </div>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || uploading}
              className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#F59E0B] hover:bg-[#D97706] text-[#0B1E36] border-2 border-[#0B1E36] shadow-[3px_3px_0px_#0B1E36] flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {uploading ? 'Parsing Brief Document...' : 'Upload & Parse Brief'}
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>

      {/* Parsed Results Preview */}
      {importResult && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#0B1E36] rounded-2xl p-6 shadow-[4px_4px_0px_#0B1E36]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-[#0055D4] uppercase tracking-wider">Parsing Success</span>
                <h3 className="text-base font-black text-[#0B1E36] mt-0.5">{importResult.originalFilename}</h3>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Hash: {importResult.contentHash.slice(0, 16)}... | Pages: {importResult.pageCount}
              </div>
            </div>

            {/* Extracted Headings */}
            <div className="mb-6">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-2">
                Detected Headings / Policy Statements ({importResult.headings?.length || 0})
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {importResult.headings?.map((h, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-50 border-2 border-slate-200 text-xs text-slate-900 font-mono">
                    {h}
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted Text Excerpt */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-2">Extracted Content Preview</h4>
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-800 font-mono max-h-48 overflow-y-auto whitespace-pre-wrap border-2 border-slate-200">
                {importResult.extractedText}
              </div>
            </div>

            {/* Convert to Candidate Rules Button */}
            {isAdmin && (
              <div className="mt-6 pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-mono text-slate-500">
                  Non-negotiable rule: Extracted statements stay unapproved candidate drafts until reviewed by admin.
                </span>
                <button
                  onClick={handleConvert}
                  disabled={converting}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#F59E0B] hover:bg-[#D97706] text-[#0B1E36] border-2 border-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {converting ? 'Converting...' : 'Convert to Candidate Draft Rules'}
                </button>
              </div>
            )}
          </div>

          {/* Conversion Results & Conflict Warnings */}
          {convertResult && (
            <div className="bg-white border-2 border-emerald-500 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-800 font-mono font-bold text-sm mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Successfully Created {convertResult.convertedCount} Candidate Rule Draft(s)!
              </div>

              {convertResult.conflictWarnings?.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 border-2 border-amber-500 text-xs font-mono text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Conflict Warnings Flagged for Review:
                  </div>
                  {convertResult.conflictWarnings.map((w, idx) => (
                    <div key={idx} className="mt-1 pl-3 border-l-2 border-amber-500 text-[11px]">
                      Candidate: "{w.ruleText}"
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs font-mono text-slate-600 mt-3">
                Go to the <strong className="text-[#0B1E36]">Brand Rules</strong> tab to inspect, approve, and activate these candidate rules.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
