export interface RoomAirQuality {
  co2Ppm: number;
  temperatureC: number;
  humidityPct: number;
  updatedAt: number;
}

export interface ShellyDeviceState {
  id: string;
  name: string;
  online: boolean;
  channels: Record<number, boolean>;
  powerWatts?: number;
  updatedAt: number;
}

export interface PassiveDoorState {
  id: string;
  closed: boolean;
  updatedAt: number;
}

export interface HomeSnapshot {
  devices: Record<string, ShellyDeviceState>;
  airQuality: Record<string, RoomAirQuality>;
  doors: Record<string, PassiveDoorState>;
}

export interface ChatTurn {
  role: 'user' | 'assistant' | 'tool';
  content: string;
}

export interface RoomSession {
  roomId: string;
  turns: ChatTurn[];
  expiresAt: number;
}

export interface ToolCallRequest {
  name: string;
  arguments: Record<string, unknown>;
}
