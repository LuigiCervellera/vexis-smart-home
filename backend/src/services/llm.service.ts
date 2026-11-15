import { env } from '../config/env.js';
import type { ChatTurn, HomeSnapshot, RoomSession } from '../domain/types.js';

const VEXIS_SYSTEM_PROMPT = `Sei Vexis, l'assistente domotico locale dell'abitazione.
Tono: asciutto, analitico, leggermente cinico/mecha (stile Chatty Stick / EDI).
Rispondi in italiano in modo conciso e diretto. Non inventare dati: usa solo lo stato MQTT fornito e i tool disponibili.`;

/**
 * Stateless ephemeral LLM session manager (Anti-Context-Rot).
 * - Sliding window: max N turns per room.
 * - Auto-expiration TTL: 45-60s.
 * - Dynamic MQTT state injection on every call.
 */
export class LlmService {
  private sessions = new Map<string, RoomSession>();
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(() => this.pruneExpired(), 15_000);
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [roomId, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(roomId);
      }
    }
  }

  async ask(roomId: string, userMessage: string, snapshot: HomeSnapshot): Promise<string> {
    const now = Date.now();
    const ttlMs = env.VEXIS_SESSION_TTL_SEC * 1000;
    const existing = this.sessions.get(roomId);
    const history: ChatTurn[] =
      existing && existing.expiresAt > now ? [...existing.turns] : [];

    const systemMessage = `${VEXIS_SYSTEM_PROMPT}\n\n[STATO CASA REAL-TIME]\n${JSON.stringify(snapshot)}`;

    const messages = [
      { role: 'system', content: systemMessage },
      ...history,
      { role: 'user', content: userMessage },
    ];

    const response = await fetch(`${env.OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.VEXIS_LLM_MODEL,
        messages,
        stream: false,
        keep_alive: -1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { message?: { content?: string } };
    const assistantReply = data.message?.content?.trim() || 'Nessuna risposta elaborata.';

    const updatedTurns: ChatTurn[] = [
      ...history,
      { role: 'user' as const, content: userMessage },
      { role: 'assistant' as const, content: assistantReply },
    ].slice(-env.VEXIS_MAX_HISTORY_TURNS * 2);

    this.sessions.set(roomId, {
      roomId,
      turns: updatedTurns,
      expiresAt: now + ttlMs,
    });

    return assistantReply;
  }

  dispose(): void {
    clearInterval(this.cleanupTimer);
  }
}
