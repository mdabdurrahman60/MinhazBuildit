import { ScanLine, ShieldCheck, Zap } from 'lucide-react';

export default function Dashboard({ onStart }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-scanner-500/10 text-scanner-400">
        <ScanLine size={40} />
      </div>

      <h2 className="font-display text-2xl font-bold text-slate-50">Scan a 2-Page Document</h2>
      <p className="mt-2 max-w-xs text-sm text-slate-400">
        Capture the front and back pages. We&apos;ll read the ID number automatically and save a ready-to-share PDF.
      </p>

      <div className="mt-8 grid w-full max-w-xs grid-cols-1 gap-3 text-left">
        <div className="flex items-center gap-3 rounded-xl bg-ink-900 px-4 py-3">
          <Zap size={18} className="text-scanner-400" />
          <span className="text-sm text-slate-300">Automatic ID detection (English &amp; Bangla)</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-ink-900 px-4 py-3">
          <ShieldCheck size={18} className="text-scanner-400" />
          <span className="text-sm text-slate-300">100% on-device — nothing is ever uploaded</span>
        </div>
      </div>

      <button
        onClick={onStart}
        className="mt-10 w-full max-w-xs rounded-2xl bg-scanner-500 px-6 py-4 text-base font-semibold text-ink-950 shadow-lg shadow-scanner-500/20 transition-transform active:scale-95"
      >
        Start New Scan
      </button>
    </div>
  );
}
