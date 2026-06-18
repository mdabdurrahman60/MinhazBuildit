import { RotateCcw, FileDown, Hash } from 'lucide-react';
import Spinner from './Spinner.jsx';

export default function PdfPreview({
  page1Url,
  page2Url,
  extractedId,
  isGenerating,
  errorMessage,
  onRetakePage2,
  onGenerate,
}) {
  return (
    <div className="flex flex-1 flex-col px-5 py-6">
      <h2 className="font-display text-lg font-semibold text-slate-50">Review &amp; Generate</h2>
      <p className="mt-1 text-sm text-slate-400">Confirm both pages before creating the PDF.</p>

      <div className="mt-5 flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-3">
        <Hash size={16} className="text-scanner-400" />
        <span className="text-sm text-slate-300">Document ID:</span>
        <span className="font-mono text-sm font-semibold tracking-wide text-slate-50">{extractedId}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-2 text-xs font-medium text-slate-400">Page 1 (Front)</p>
          <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
            <img src={page1Url} alt="Front page preview" className="h-40 w-full object-cover" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-400">Page 2 (Back)</p>
          <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
            <img src={page2Url} alt="Back page preview" className="h-40 w-full object-cover" />
          </div>
        </div>
      </div>

      {errorMessage && <p className="mt-4 text-sm text-rose-400">{errorMessage}</p>}

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 rounded-2xl bg-scanner-500 px-6 py-4 text-base font-semibold text-ink-950 disabled:opacity-60"
        >
          {isGenerating ? <Spinner size={20} colorClassName="text-ink-950" /> : <FileDown size={20} />}
          {isGenerating ? 'Generating PDF...' : 'Generate PDF'}
        </button>
        <button
          onClick={onRetakePage2}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 rounded-2xl border border-ink-700 px-6 py-4 text-base font-medium text-slate-300 disabled:opacity-40"
        >
          <RotateCcw size={18} />
          Retake Page 2
        </button>
      </div>
    </div>
  );
}
