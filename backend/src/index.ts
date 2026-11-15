import { MqttService } from './services/mqtt.service.js';
import { LlmService } from './services/llm.service.js';
import { ToolsService } from './services/tools.service.js';
import { VexisWsServer } from './transport/ws.server.js';
import { startHttpServer } from './transport/http.server.js';

async function bootstrap(): Promise<void> {
  console.log('[VEXIS] Starting local orchestrator...');

  const mqttService = new MqttService();
  mqttService.connect();

  const llmService = new LlmService();
  const toolsService = new ToolsService(mqttService);
  void toolsService; // Wired for upcoming voice/command router

  const wsServer = new VexisWsServer(mqttService);
  wsServer.start();

  const httpServer = startHttpServer();

  const shutdown = async (signal: string) => {
    console.log(`[VEXIS] Received ${signal}, shutting down gracefully...`);
    llmService.dispose();
    await wsServer.close();
    await mqttService.disconnect();
    httpServer.close(() => process.exit(0));
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[VEXIS] Fatal startup error:', err);
  process.exit(1);
});
