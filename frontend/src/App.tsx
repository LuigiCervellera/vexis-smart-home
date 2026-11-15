import { useState } from 'react';
import { Lightbulb, Thermometer, Wind } from 'lucide-react';
import { OpticalCore } from './components/OpticalCore';
import type { AssistantState } from './types/vexis';

export default function App() {
  const [assistantState] = useState<AssistantState>('idle');

  return (
    <main className="flex h-screen w-screen flex-col justify-between bg-amoled p-6 font-mono text-zinc-200">
      {/* Top Telemetry Bar */}
      <header className="flex items-center justify-between border-b border-zinc-900 pb-3 text-xs text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="text-vexis-cyan font-semibold tracking-widest">VEXIS OS</span>
          <span className="flex items-center gap-1.5">
            <Wind className="h-3.5 w-3.5 text-emerald-400" />
            CO2: 460 ppm
          </span>
          <span className="flex items-center gap-1.5">
            <Thermometer className="h-3.5 w-3.5 text-vexis-amber" />
            21.5 °C
          </span>
        </div>
        <span className="text-zinc-600">LOCAL // ZERO-CLOUD</span>
      </header>

      {/* Center Optical Core */}
      <section className="flex flex-1 items-center justify-center">
        <OpticalCore state={assistantState} />
      </section>

      {/* Bottom Quick Room Controls */}
      <footer className="grid grid-cols-3 gap-3 border-t border-zinc-900 pt-4">
        {['Sala da Pranzo', 'Stanza 2', 'Stanza 3'].map((room) => (
          <button
            key={room}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-surface px-4 py-3 text-xs transition hover:border-vexis-cyan/60"
          >
            <span>{room}</span>
            <Lightbulb className="h-4 w-4 text-zinc-500" />
          </button>
        ))}
      </footer>
    </main>
  );
}
