# Vexis Smart Home (`vexis-smart-home`)

Sistema domotico locale, homelab self-hosted e assistente vocale **100% locale e open source**, progettato con approccio **Privacy-First** e **Zero-Cloud**.

## Principi Chiave
- **Nessuna dipendenza cloud:** Tutto il processing (STT, LLM, TTS, automazioni, foto, media) gira sul Mini PC locale.
- **Sicurezza & Privacy fisica:** Nessuna serratura smart; i portoni blindati utilizzano esclusivamente sensori passivi (microswitch / optoisolatore PC817).
- **Architettura Anti-Context-Rot:** Sessioni LLM effimere per stanza (sliding window max 3 turni, TTL 45–60s) con iniezione dinamica dello stato MQTT corrente.

## Struttura della Repository
```text
vexis-smart-home/
├── .env.example               # Template variabili d'ambiente
├── .gitignore                 # Esclusione segreti, volumi e pesi AI
├── ARCHITECTURE.md            # Specifiche tecniche e modello di sicurezza
├── docker/                    # Stack Docker Compose unificato e config Mosquitto
├── backend/                   # Orchestratore Node.js / TypeScript (MQTT + WS + LLM)
├── frontend/                  # Dashboard Kiosk 7" AMOLED (React + Tailwind)
└── firmware/                  # Firmware ESP32-S3 (satelliti) ed ESP32-C3 (sensori)
```

## Avvio Rapido (Infrastruttura)
1. Copia `.env.example` in `.env` e imposta tutte le credenziali (`CHANGE_ME_*`).
2. Genera il file password per Mosquitto:
   ```bash
   docker run --rm -v $(pwd)/docker/mosquitto:/mosquitto/config eclipse-mosquitto:2 \
     mosquitto_passwd -c -b /mosquitto/config/passwd vexis_orchestrator "<MQTT_PASSWORD>"
   ```
3. Avvia lo stack:
   ```bash
   docker compose -f docker/docker-compose.yml --env-file .env up -d
   ```

Per i dettagli architetturali consulta [ARCHITECTURE.md](./ARCHITECTURE.md).
