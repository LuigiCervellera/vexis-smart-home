# VEXIS Smart Home (`vexis-smart-home`)

> Sistema domotico, homelab self-hosted e assistente vocale **100% locale, open source e Zero-Cloud**.

**Vexis** nasce con un obiettivo preciso: avere una casa intelligente, reattiva e dotata di un assistente vocale AI avanzato **senza alcuna dipendenza da cloud esterni** (niente Shelly Cloud, Google Home o app proprietarie) e senza compromessi sulla sicurezza fisica o sulla privacy.

---

## Principi & Filosofia

- **100% Locale & Open Source:** STT, LLM, TTS, automazioni, librerie foto e media girano interamente sul server domestico.
- **Privacy Fisica Prima di Tutto:** Nessuna serratura smart o attuatore motorizzato sugli accessi principali. I portoni blindati sono monitorati solo tramite **sensori passivi isolati galvanicamente** (microswitch sulla mandata o optoisolatore `PC817`).
- **Identità di Vexis:** Wake word locale `Vexis` (con parola di stop/barge-in immediato), tono asciutto, analitico e leggermente cinico/mecha, accompagnato da un **HUD ottico minimale su nero puro AMOLED**.
- **Anti-Context-Rot:** L'LLM non accumula conversazioni infinite che degradano la qualità delle risposte. Ogni stanza ha una **sessione effimera** (sliding window max 3 turni, TTL 45–60s) con iniezione dinamica dello stato MQTT reale ad ogni richiesta.

---

## Architettura del Sistema

```mermaid
flowchart LR
    ESP32S3["Satelliti ESP32-S3\n(I2S Mic/Spk + Wake Word)"] -->|WebSocket PCM + Token| BE["Backend Orchestratore\n(Node.js / TypeScript)"]
    ESP32C3["Nodi 503 ESP32-C3\n(SCD40 CO2 + PC817)"] -->|MQTT Auth| MQTT["Mosquitto\n(Broker 1883)"]
    SHELLY["Attuatori Shelly\n(Luci / Clima)"] <-->|MQTT JSON-RPC| MQTT
    MQTT <--> BE
    BE <-->|STT| WHISPER["Whisper.cpp"]
    BE <-->|LLM RAM| OLLAMA["Ollama\n(GPU Radeon)"]
    BE <-->|TTS| PIPER["Piper / Kokoro TTS"]
    BE <-->|WebSocket Telemetria| KIOSK["Frontend Kiosk\n(7&quot; AMOLED Touch)"]
    BE -->|Read-Only API| IMMICH["Immich"]
    BE -->|Broadcast Intent| NTFY["Ntfy -> Android"]
```

---

## Hardware di Riferimento

| Componente | Modello / Specifiche | Ruolo |
| :--- | :--- | :--- |
| **Server Centrale** | Mini PC AMD Ryzen 7, 32 GB RAM, doppio storage (NVMe + secondario), UPS | Host Docker, AI locale in RAM e servizi Homelab |
| **Luci (230V AC)** | `1x Shelly Plus 2PM` (Sala da Pranzo), `2x Shelly 1PM Mini Gen3` (Stanze 2 e 3) | Controllo luci Zero-Crossing & lettura consumi |
| **Clima** | `2x Shelly 1 Mini Gen3` (contatto pulito), `1x Shelly BLU H&T Display ZB` | Controllo caldaia/chiller e temperatura ambiente |
| **Pannello a Muro** | Schermo 7" AMOLED Touch (Chromium Kiosk fullscreen) | HUD di controllo, stato CO2, modali foto/QR |
| **Satelliti Vocali** | `ESP32-S3` + microfono I2S `INMP441` + amp `MAX98357A` | Wake word locale, streaming PCM e riproduzione TTS |
| **Sensori Aria & Accessi** | `ESP32-C3` + `Sensirion SCD40` (I2C) + `PC817` / microswitch | Misura CO2 reale (NDIR), temp/umidità, stato portoni |

---

## Stack Software (Docker Compose)

Tutti i servizi sono orchestrati in [`docker/docker-compose.yml`](docker/docker-compose.yml) con policy `restart: unless-stopped` e separati in tre reti isolate (`vexis-core`, `vexis-media`, `vexis-proxy`).

### Core Domotica & AI
- **Mosquitto:** Broker MQTT locale su porta `1883` con `allow_anonymous false`, ACL e *Retained Messages* + *LWT*.
- **Ollama:** Runtime LLM locale (`qwen2.5:7b` / `llama3.1:8b`) residente in RAM (`OLLAMA_KEEP_ALIVE=-1`) con accelerazione GPU Radeon (`/dev/kfd`, `/dev/dri`).
- **Whisper.cpp:** Speech-to-Text locale a bassa latenza.
- **Piper TTS:** Sintesi vocale locale.
- **Ntfy:** Push notification locale per impostare sveglie su Android via Broadcast Intent (`android.intent.action.SET_ALARM`).
- **Backend Orchestratore (`backend/`):** Node.js + TypeScript (utente non-root) per bridge MQTT JSON-RPC, server WebSocket autenticato, memoria effimera e *function calling* (luci/clima, sveglie, spazio dischi, ricerca foto Immich).
- **Frontend Kiosk (`frontend/`):** React + TypeScript + Tailwind CSS su `nginx-unprivileged`, tema nero puro `#000000` AMOLED, nucleo ottico reattivo e modali con auto-dismiss (60–90s).

### Homelab & Media
- **Immich:** Gestione e backup foto/video con ricerca semantica CLIP (collegata a Vexis tramite API Key **read-only**).
- **Jellyfin:** Media server con transcodifica hardware GPU Radeon (`/dev/dri`).
- **Vaultwarden:** Gestore password self-hosted compatibile Bitwarden.
- **Nginx Proxy Manager:** Reverse proxy per i domini locali (`vexis.home`, `immich.home`, `jellyfin.home`, `vault.home`), con UI admin legata a `127.0.0.1:81`.
- **Portainer:** Gestione container Docker (socket montato in sola lettura `:ro`).

---

## Struttura della Repository

```text
vexis-smart-home/
├── .env.example               # Template pubblico variabili d'ambiente
├── .gitignore                 # Esclusione segreti, password MQTT, volumi e pesi AI
├── ARCHITECTURE.md            # Specifiche tecniche e modello di sicurezza
├── CONTEX.MD                  # Documento di specifica iniziale del progetto
├── README.md                  # Documentazione principale
├── docker/
│   ├── docker-compose.yml     # Stack unificato (Domotica + AI + Homelab)
│   └── mosquitto/
│       ├── mosquitto.conf     # Configurazione broker MQTT (no anonymous)
│       └── acl.conf           # Controllo accessi topic MQTT
├── backend/                   # Orchestratore Node.js / TypeScript
├── frontend/                  # Dashboard Kiosk 7" AMOLED (React + Tailwind)
└── firmware/
    ├── satellite-esp32s3/     # Firmware PlatformIO satellite vocale ESP32-S3
    └── sensor-esp32c3/        # Firmware PlatformIO nodo sensori 503 ESP32-C3
```

---

## Avvio Rapido

### 1. Configurazione Ambiente
Copia il template delle variabili d'ambiente e sostituisci tutti i valori `CHANGE_ME_*`:
```bash
cp .env.example .env
```

### 2. Generazione Credenziali Mosquitto
Crea il file delle password per il broker MQTT locale (escluso da Git):
```bash
docker run --rm -v $(pwd)/docker/mosquitto:/mosquitto/config eclipse-mosquitto:2.0 \
  mosquitto_passwd -c -b /mosquitto/config/passwd vexis_orchestrator "<MQTT_PASSWORD>"
```

### 3. Avvio dello Stack Docker
```bash
docker compose -f docker/docker-compose.yml --env-file .env up -d
```

### 4. Configurazione Firmware (ESP32-S3 / ESP32-C3)
Per ciascun modulo in `firmware/`, copia `include/config.h.example` in `include/config.h` (escluso da Git) e inserisci le credenziali Wi-Fi, MQTT e il token WebSocket prima di compilare con PlatformIO.

---

## Sicurezza
Per i dettagli completi su isolamento di rete, container hardening, gestione segreti e privacy fisica, consulta [`ARCHITECTURE.md`](ARCHITECTURE.md).
