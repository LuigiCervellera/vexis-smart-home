import type { AssistantState } from '../types/vexis';

interface OpticalCoreProps {
  state: AssistantState;
}

/**
 * Minimal optical core HUD visualizer on pure AMOLED black.
 */
export function OpticalCore({ state }: OpticalCoreProps) {
  const ringColor =
    state === 'listening'
      ? 'border-vexis-cyan shadow-[0_0_40px_rgba(34,211,238,0.45)] scale-105'
      : state === 'thinking'
        ? 'border-vexis-amber shadow-[0_0_35px_rgba(245,158,11,0.35)] animate-pulse'
        : state === 'speaking'
          ? 'border-vexis-cyan shadow-[0_0_55px_rgba(34,211,238,0.65)] scale-110'
          : 'border-zinc-800 shadow-none';

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={`h-44 w-44 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${ringColor}`}
      >
        <div className="h-24 w-24 rounded-full border border-zinc-700/80 flex items-center justify-center bg-amoled">
          <div className="h-4 w-4 rounded-full bg-vexis-cyan/90" />
        </div>
      </div>
      <span className="absolute -bottom-8 font-mono text-xs tracking-[0.25em] uppercase text-zinc-500">
        VEXIS // {state}
      </span>
    </div>
  );
}
