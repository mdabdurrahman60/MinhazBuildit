import { ScanLine } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center gap-3 border-b border-ink-800 px-5 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-scanner-500/10 text-scanner-400">
        <ScanLine size={22} />
      </div>
      <div>
        <h1 className="font-display text-lg font-semibold leading-tight text-slate-50">DocScan</h1>
        <p className="text-xs leading-tight text-slate-500">Smart 2-page document scanner</p>
      </div>
    </header>
  );
}
