import { CheckCircle2, RotateCcw } from 'lucide-react';

export default function SuccessScreen({ extractedId, onScanAnother }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
        <CheckCircle2 size={40} />
      </div>

      <h2 className="font-display text-2xl font-bold text-slate-50">PDF Downloaded</h2>
      <p className="mt-2 max-w-xs text-sm text-slate-400">
        Saved as <span className="font-mono font-semibold text-slate-200">{extractedId}.pdf</span>. All scanned
        image data has been cleared from memory.
      </p>

      <button
        onClick={onScanAnother}
        className="mt-10 flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-scanner-500 px-6 py-4 text-base font-semibold text-ink-950 shadow-lg shadow-scanner-500/20 active:scale-95"
      >
        <RotateCcw size={18} />
        Scan Another Document
      </button>
    </div>
  );
}
