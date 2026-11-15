import { env } from '../config/env.js';
import type { MqttService } from './mqtt.service.js';

/**
 * Registry of local-only function-calling tools for Vexis.
 */
export class ToolsService {
  constructor(private readonly mqtt: MqttService) {}

  setShellySwitch(deviceId: string, channel: number, on: boolean): { ok: boolean } {
    this.mqtt.sendShellyRpc(deviceId, 'Switch.Set', { id: channel, on });
    return { ok: true };
  }

  async sendAndroidAlarm(hour: number, minute: number, message: string): Promise<void> {
    if (!env.NTFY_URL || !env.NTFY_TOPIC) {
      throw new Error('Ntfy is not configured');
    }
    await fetch(`${env.NTFY_URL}/${env.NTFY_TOPIC}`, {
      method: 'POST',
      headers: {
        Title: 'Vexis Alarm',
        Actions: `broadcast, Imposta Sveglia, extras.android.intent.extra.alarm.HOUR=${hour}, extras.android.intent.extra.alarm.MINUTES=${minute}`,
      },
      body: message,
    });
  }

  async searchImmichPhotos(query: string): Promise<unknown> {
    if (!env.IMMICH_URL || !env.IMMICH_API_KEY) {
      throw new Error('Immich read-only integration is not configured');
    }
    const res = await fetch(`${env.IMMICH_URL}/api/search/smart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.IMMICH_API_KEY,
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      throw new Error(`Immich search failed: ${res.status}`);
    }
    return res.json();
  }
}
