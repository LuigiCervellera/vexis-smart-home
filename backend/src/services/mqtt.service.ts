import mqtt, { MqttClient } from 'mqtt';
import { EventEmitter } from 'node:events';
import { env } from '../config/env.js';
import type { HomeSnapshot } from '../domain/types.js';

/**
 * Manages local Mosquitto MQTT connection, Shelly JSON-RPC commands,
 * and real-time home state snapshot (retained messages + LWT).
 */
export class MqttService extends EventEmitter {
  private client: MqttClient | null = null;
  private snapshot: HomeSnapshot = {
    devices: {},
    airQuality: {},
    doors: {},
  };

  connect(): void {
    const brokerUrl = `mqtt://${env.MQTT_HOST}:${env.MQTT_PORT}`;
    this.client = mqtt.connect(brokerUrl, {
      clientId: 'vexis-orchestrator',
      username: env.MQTT_USER,
      password: env.MQTT_PASSWORD,
      clean: true,
      reconnectPeriod: 5000,
      will: {
        topic: 'vexis/system/status',
        payload: Buffer.from('offline'),
        qos: 1,
        retain: true,
      },
    });

    this.client.on('connect', () => {
      console.log('[MQTT] Connected to local Mosquitto broker');
      this.client?.publish('vexis/system/status', 'online', { qos: 1, retain: true });
      this.client?.subscribe(['shellies/+/status/#', 'vexis/sensors/#']);
    });

    this.client.on('message', (topic, payload) => {
      this.handleMessage(topic, payload.toString('utf-8'));
    });

    this.client.on('error', (err) => {
      console.error('[MQTT] Connection error:', err.message);
    });
  }

  private handleMessage(topic: string, rawPayload: string): void {
    try {
      const data = JSON.parse(rawPayload) as Record<string, unknown>;
      // TODO: map Shelly Gen2/Gen3 status & ESP32 SCD40/door payloads into this.snapshot
      this.emit('state:updated', { topic, data, snapshot: this.snapshot });
    } catch {
      // Ignore non-JSON status strings (e.g. LWT "online"/"offline")
    }
  }

  /**
   * Sends a Shelly Gen2/Gen3 JSON-RPC command over MQTT (`<device>/rpc`).
   */
  sendShellyRpc(deviceId: string, method: string, params: Record<string, unknown>): void {
    if (!this.client?.connected) {
      throw new Error('MQTT broker not connected');
    }
    const payload = JSON.stringify({
      id: Date.now(),
      src: 'vexis-orchestrator',
      method,
      params,
    });
    this.client.publish(`${deviceId}/rpc`, payload, { qos: 1 });
  }

  getSnapshot(): HomeSnapshot {
    return this.snapshot;
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;
    await this.client.endAsync();
  }
}
