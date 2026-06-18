import { Camera, Hash, ImagePlus, Download, Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Front Page', icon: Camera },
  { id: 2, label: 'Verify ID', icon: Hash },
  { id: 3, label: 'Back Page', icon: ImagePlus },
  { id: 4, label: 'Download', icon: Download },
];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isComplete = currentStep > step.id;
        const isActive = currentStep === step.id;

        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                  isComplete
                    ? 'border-scanner-500 bg-scanner-500 text-ink-950'
                    : isActive
                    ? 'border-scanner-400 text-scanner-400'
                    : 'border-ink-700 text-slate-600'
                }`}
              >
                {isComplete ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isActive ? 'text-scanner-400' : isComplete ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`mx-1 mb-4 h-0.5 flex-1 rounded ${
                  currentStep > step.id ? 'bg-scanner-500' : 'bg-ink-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
