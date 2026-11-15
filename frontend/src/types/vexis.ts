export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface AirQualityBadge {
  room: string;
  co2Ppm: number;
  temperatureC: number;
  humidityPct: number;
}
