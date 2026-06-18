import { RotateCcw, CheckCircle2 } from 'lucide-react';
import Spinner from './Spinner.jsx';

export default function IdVerification({
  imageUrl,
  isProcessing,
  ocrProgress,
  extractedId,
  onIdChange,
  onRetake,
  onConfirm,
  errorMessage,
}) {
  return (
    <div className="flex flex-1 flex-col px-5 py-6">
      <h2 className="font-display text-lg font-semibold text-slate-50">Verify Document ID</h2>
      <p className="mt-1 text-sm text-slate-400">Check the page preview and confirm the ID number.</p>

      <div className="relative mt-5 overflow-hidden rounded-2xl border border-ink-700 bg-ink-900">
        <img src={imageUrl} alt="Captured front page" className="h-56 w-full object-cover" />
        {isProcessing && (
          <div
            className="pointer-events-none absolute inset-x-0 h-1 bg-scanner-400 shadow-[0_0_20px_4px_rgba(251,191,36,0.55)] animate-scan-sweep"
            aria-hidden="true"
          />
        )}
      </div>

      {isProcessing ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-300">
          <Spinner size={16} />
          <span>
            Reading ID Number... <span className="font-mono">{ocrProgress}%</span>
          </span>
        </div>
      ) : (
        <div className="mt-6">
          <label htmlFor="extracted-id" className="mb-2 block text-sm font-medium text-slate-300">
            Extracted ID Number
          </label>
          <input
            id="extracted-id"
            type="text"
            inputMode="numeric"
            value={extractedId}
            onChange={(event) => onIdChange(event.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Enter ID manually"
            className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-4 font-mono text-lg font-semibold tracking-wide text-slate-50 outline-none focus:border-scanner-400"
          />
          {errorMessage && <p className="mt-2 text-sm text-rose-400">{errorMessage}</p>}
          <p className="mt-2 text-xs text-slate-500">
            If the number above looks wrong, edit it directly before continuing.
          </p>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <button
          onClick={onConfirm}
          disabled={isProcessing || !extractedId}
          className="flex items-center justify-center gap-2 rounded-2xl bg-scanner-500 px-6 py-4 text-base font-semibold text-ink-950 disabled:opacity-40"
        >
          <CheckCircle2 size={20} />
          Confirm &amp; Continue
        </button>
        <button
          onClick={onRetake}
          className="flex items-center justify-center gap-2 rounded-2xl border border-ink-700 px-6 py-4 text-base font-medium text-slate-300"
        >
          <RotateCcw size={18} />
          Retake Page 1
        </button>
      </div>
    </div>
  );
}
