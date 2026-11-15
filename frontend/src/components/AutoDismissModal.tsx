import { useEffect } from 'react';

interface AutoDismissModalProps {
  open: boolean;
  title: string;
  timeoutSec?: number;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Temporary Kiosk modal with automatic dismissal (60-90s default)
 * for guest Wi-Fi QR codes or Immich photo projections.
 */
export function AutoDismissModal({
  open,
  title,
  timeoutSec = 75,
  onClose,
  children,
}: AutoDismissModalProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, timeoutSec * 1000);
    return () => clearTimeout(timer);
  }, [open, timeoutSec, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-sm uppercase tracking-widest text-vexis-cyan">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="font-mono text-xs text-zinc-500 hover:text-zinc-200"
          >
            [CHIUDI]
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
