import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 32, colorClassName = 'text-scanner-400', className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${colorClassName} ${className}`} />;
}
