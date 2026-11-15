# Specifiche Architetturali - Sistema Domotico Locale, Homelab & Assistente "Vexis"

## 1. Obiettivi & Vincoli
- **100% Locale & Open Source:** Nessuna dipendenza da cloud esterni (no Shelly Cloud, no Google Home, no app proprietarie).
- **Privacy First:** Nessuna serratura smart; per i portoni blindati ermetici si usano solo sensori passivi (microswitch sullo scasso della mandata o optoisolatore PC817 sui contatti esistenti).
- **Identità Assistente ("Vexis"):** Wake word `Vexis` (configurabile via `.env` e modello `.tflite`). Tono asciutto, analitico, leggermente cinico/mecha (stile *Chatty Stick* / *EDI*), con visualizer HUD ispirato a un nucleo ottico minimale su nero puro AMOLED.

## 2. Hardware Definito
- **Server Centrale:** Mini PC AMD Ryzen 7 (es. Beelink SER5 MAX/SER6 o Minisforum serie UM) con **32GB RAM**, NVMe primario (OS, DB Postgres/Redis, modelli AI) + storage secondario (HDD/SSD 2.5" o 2° NVMe per librerie foto Immich e media Jellyfin) + UPS di protezione e BIOS impostato su *Restore on AC Power Loss: Power On*.
- **Attuatori Luci (230V AC - Zero-Crossing Switching):**
  - 1x `Shelly Plus 2PM` (2 canali, luci Sala da Pranzo).
  - 2x `Shelly 1PM Mini Gen3` (1 canale ciascuno, luci Stanze 2 e 3).
- **Attuatori Clima:**
  - 2x `Shelly 1 Mini Gen3` (contatto pulito isolato per Caldaia e Chiller).
  - 1x `Shelly BLU H&T Display ZB` (sensore temperatura ambiente).
- **Pannello a Muro:** Schermo 7" AMOLED Touch (modalità kiosk Chromium fullscreen, tema scuro/terminale).
- **Satelliti Vocali di Stanza:** Moduli `ESP32-S3` (es. M5Stack CoreS3 o kit DIY con microfono I2S INMP441 + amp MAX98357A) alimentati via cavo USB-C (dock magnetica a muro rimandata a fase 2).
- **Sensori Qualità Aria:** `Sensirion SCD40` (CO2 reale NDIR + Temp + Umidità) su bus I2C (integrati nei satelliti o in moduli DIY da incasso 503 con ESP32-C3 + micro-alimentatore 230V->5V isolato).

## 3. Stack Software & Servizi Self-Hosted (Docker)
Tutti i servizi sono orchestrati tramite Docker Compose su Linux con policy `restart: unless-stopped`:

### Core Domotica & AI ("Vexis")
- **`Mosquitto`:** Broker MQTT locale su porta `1883` (con *Retained Messages* e *Last Will & Testament*).
- **`Ollama`:** Runtime LLM locale (`llama3.1:8b` o `qwen2.5:7b`) residente in RAM (`OLLAMA_KEEP_ALIVE=-1`) con accelerazione GPU integrata AMD Radeon.
- **`Whisper.cpp`:** Speech-to-Text locale a bassa latenza.
- **`Piper TTS` (o `Kokoro TTS`):** Sintesi vocale locale + filtri audio FFmpeg.
- **Backend Orchestratore (Node.js / TypeScript):**
  - Client `mqtt` per controllo relè Shelly via JSON-RPC (`<device>/rpc`) e lettura consumi/stati real-time.
  - Server `WebSocket` per streaming audio PCM grezzo dai satelliti ESP32-S3 e telemetria real-time alla dashboard.
  - **Gestione Memoria LLM Anti-Context-Rot:** Sessioni stateless effimere per stanza con Sliding Window (max 3 turni) e auto-distruzione TTL (45-60s). Iniezione dinamica dello stato MQTT corrente nel System Prompt ad ogni chiamata.
  - **Function Calling (Tools):** Controllo luci/clima, impostazione sveglie su Android tramite push `Ntfy` + Broadcast Intent (`android.intent.action.SET_ALARM`), monitoraggio spazio dischi, ricerca foto su Immich REST API (`/api/search/smart`) con proiezione su schermo.
- **Frontend Kiosk (React + TypeScript + Tailwind CSS + Shadcn UI):**
  - HUD reattivo con nucleo ottico/wave visualizer centrale, controllo stanze/clima, badge CO2 e modali temporanee con **auto-dismiss timer (60-90s)** per QR code ospiti o galleria foto Immich.
- **Firmware Satelliti (C++ PlatformIO / ESP-IDF o ESPHome):**
  - Doppia wake word locale (`Vexis` + parola di stop/barge-in immediato) e gestione schermo LVGL con timeout automatico.

### Servizi Homelab Aggiuntivi
- **`Immich`:** Gestione e backup foto/video self-hosted con ricerca semantica CLIP, API Key read-only per Vexis e storage su unità secondaria.
- **`Jellyfin`:** Media server open-source per film, serie TV e musica con transcodifica hardware GPU Radeon (`/dev/dri`).
- **`Vaultwarden`:** Gestore password self-hosted compatibile con client Bitwarden.
- **`Nginx Proxy Manager`:** Reverse proxy con gestione domini locali (es. `vexis.home`, `immich.home`, `jellyfin.home`, `vault.home`) e certificati SSL.
- **`Portainer`:** Interfaccia web per gestione, log e monitoraggio dei container Docker.

## 4. Struttura Repository GitHub (`vexis-smart-home`)
```text
vexis-smart-home/
├── .gitignore                 # Esclude .env, volumi Docker, librerie foto e pesi modelli AI
├── .env.example               # Template pubblico variabili d'ambiente
├── ARCHITECTURE.md            # Specifiche tecniche del sistema
├── README.md                  # Documentazione del progetto
├── docker/
│   ├── docker-compose.yml     # Stack unificato (Domotica + AI + Homelab)
│   └── mosquitto/
│       └── mosquitto.conf     # Configurazione broker MQTT
├── backend/                   # Server orchestratore Node.js / TypeScript
├── frontend/                  # Dashboard React + Tailwind + Shadcn (Kiosk AMOLED)
└── firmware/                  # Codice C++ PlatformIO / ESPHome per ESP32-S3 e C3