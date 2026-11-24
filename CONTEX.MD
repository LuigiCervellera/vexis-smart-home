# Specifiche Architetturali - Sistema Domotico Locale, Homelab & Assistente "Vexis"

## 1. Obiettivi & Vincoli
- **100% Locale & Open Source:** Nessuna dipendenza da cloud esterni (no Shelly Cloud, no Google Home, no app proprietarie).
- **Privacy First:** Nessuna serratura smart; per i portoni blindati ermetici si usano solo sensori passivi (microswitch sullo scasso della mandata o optoisolatore PC817 sui contatti esistenti).
- **Identità Assistente ("Vexis"):** Wake word `Vexis` (configurabile via `.env` e modello `.tflite`). Tono asciutto, analitico, leggermente cinico/mecha (stile *Chatty Stick* / *EDI*), con visualizer HUD ispirato a un nucleo ottico minimale su nero puro AMOLED.

## 2. Hardware Definito
- **Server & NAS Homemade in Rack:** Mini PC AMD Ryzen 7 (es. Beelink SER8 / Minisforum UM con **32GB DDR5** su slot SO-DIMM espandibili a 64GB, **Debian Stable headless**), NVMe primario (OS, DB Postgres/Redis, modelli AI) + **DAS 4-bay USB-C 10Gbps** in modalità JBOD (`MergerFS + SnapRAID` per Immich/Jellyfin/FLAC + spazio backup incrementale `Restic/BorgBackup` + `smartmontools`) + Switch PoE + UPS di protezione e BIOS impostato su *Restore on AC Power Loss: Power On*.
- **Rete IoT Dedicata:** Secondo router/Access Point in *AP Mode* cablato in Ethernet con SSID dedicato `Vexis-IoT` (solo 2.4 GHz, canale separato) per non saturare il Wi-Fi principale.
- **Attuatori Luci (230V AC - Zero-Crossing Switching & Dimmer):**
  - Soggiorno (2 gruppi da 2 luci, ex relè commutatore 4-stati): `1x Shelly Plus 2PM` (con Shelly Script locale 4-stati) oppure `2x Shelly Dimmer Gen3` (se si opta per lampadine LED dimmerabili).
  - Stanze secondarie: `Shelly 1PM Mini Gen3` (o `Shelly Dimmer Gen3` in camera per sveglia-luce graduale), comandati da pulsanti fisici 230V momentanei su `503`.
- **Attuatori Clima:**
  - 2x `Shelly 1 Mini Gen3` (contatto pulito isolato per Caldaia e Chiller).
  - 1x `Shelly BLU H&T Display ZB` (sensore temperatura ambiente).
- **Pannello a Muro:** Schermo 7" AMOLED Touch (modalità kiosk Chromium fullscreen, tema scuro/terminale).
- **Satelliti Vocali & Sensori Aria da Incasso 503 (5 Stanze):** `5x ESP32-S3` compatti (es. XIAO / SuperMini) installati negli slot vuoti delle scatole `503` (zero cavi a vista) con alimentatore certificato isolato `Mean Well IRM-05-5` (230V->5V), microfono I2S `INMP441`, amp `MAX98357A` + micro-speaker 4Ω e sensore `Sensirion SCD40` (CO2 NDIR + Temp + Umidità) su I2C (più `PC817`/microswitch passivi sui 2 portoni blindati).
- **Videocitofonia (2 Accessi - Portoni Blindati):** 2x Videocitofoni IP PoE locali (modello da definire, compatibili `RTSP` / `ONVIF` / `SIP`, senza NFC); l'elettroserratura 12V esistente è comandabile solo dall'interno tramite contatto pulito interno (mai esposta sul posto esterno).

## 3. Stack Software & Servizi Self-Hosted (Docker)
Tutti i servizi sono orchestrati tramite Docker Compose su Linux con policy `restart: unless-stopped`:

### Core Domotica & AI ("Vexis")
- **`Mosquitto`:** Broker MQTT locale su porta `1883` (con *Retained Messages* e *Last Will & Testament*).
- **`Ollama`:** Runtime LLM locale (`llama3.1:8b` o `qwen2.5:7b`) residente in RAM (`OLLAMA_KEEP_ALIVE=-1`) con accelerazione GPU integrata AMD Radeon.
- **`Whisper.cpp`:** Speech-to-Text locale a bassa latenza.
- **`Piper TTS` (o `Kokoro TTS`):** Sintesi vocale locale + filtri audio FFmpeg.
- **`go2rtc`:** Bridge video locale a bassissima latenza (`RTSP`/`ONVIF` → `WebRTC`) per lo streaming dei due videocitofoni verso il pannello Kiosk AMOLED.
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

## 6. Funzionalità & Scenari Applicativi (Roadmap per Sviluppo)

### 1. Controllo Domotico & Clima (Core)
- **Gestione Luci & Stanze:** Accensione/spegnimento istantaneo tramite comandi vocali o touch sul pannello AMOLED (Shelly Plus 2PM e Shelly 1PM Mini Gen3 su rete locale via MQTT).
- **Termoregolazione Intelligente:** Controllo contatto pulito per Caldaia e Chiller (Shelly 1 Mini Gen3) basato sulle letture dei sensori ambientali (`Shelly BLU H&T` e sonde `SCD40`).
- **Sincronizzazione Sveglia-Luce:** Possibilità di collegare l'orario di sveglia all'accensione graduale o programmata delle luci al mattino.

### 2. Qualità dell'Aria & Monitoraggio Ambientale ($\text{CO}_2$)
- **Rilevamento Reale NDIR:** Lettura continua di $\text{CO}_2$ (ppm), temperatura e umidità tramite sensori `Sensirion SCD40` (su bus I2C dei satelliti o in moduli da incasso 503).
- **Alert Vocali con Isteresi & Cooldown:** Avviso vocale mirato esclusivamente nel satellite della stanza interessata quando la $\text{CO}_2$ supera i `1200-1300 ppm` (con blocco anti-spam di 30 minuti, salvo picchi critici $>1600\text{ ppm}$).
- **Indicatore Visivo HUD:** Badge dinamico verde/ambra/rosso sulla dashboard React e sul mini-display del satellite.

### 3. Integrazione Smartphone Android (Zero Porte Aperte)
- **Programmazione Sveglie Vocali:** Comando vocale natural-language (es. *"Vexis, metti una sveglia alle 6:30"* oppure *"domani faccio il turno di mattina"* con calcolo automatico dell'orario). Il backend Node.js invia una push ad alta priorità tramite **Ntfy** che esegue un **Broadcast Intent nativo Android** (`android.intent.action.SET_ALARM` con `SKIP_UI: true`) impostando la sveglia nell'orologio di sistema senza sbloccare il telefono.
- **Invio Percorsi, Link e Azioni al Telefono:** Capacità dell'LLM di inviare sullo smartphone itinerari/destinazioni (aprendo direttamente Google Maps / navigatore tramite Intent o URL), promemoria o notifiche push urgenti (es. allerta $\text{CO}_2$ critica).

### 4. Accesso Ospiti & Interfaccia Effimera (Macchina a Stati)
- **QR Code Ospiti Dinamico:** Comando vocale (es. *"Vexis, mostra il QR per gli ospiti"*) che genera e proietta sul pannello AMOLED a muro (o sul display del satellite) un QR code con credenziali Wi-Fi Guest o token JWT temporaneo a scadenza per controllare solo le luci delle aree comuni.
- **Auto-Dismiss & Fail-Safe Schermo:** Macchina a stati (`IDLE` $\rightarrow$ `LISTENING` $\rightarrow$ `EXECUTING` $\rightarrow$ `TEMPORARY_MODAL`) con chiusura automatica delle schermate temporanee dopo `60-90 secondi`, chiusura manuale con un tap o interruzione immediata tramite nuova wake word.

### 5. Integrazione Homelab & Interrogazione Dati (Ollama Tools)
- **Diagnostica & Storage Server:** Possibilità di chiedere a voce lo stato del Mini PC, il carico CPU/RAM e lo spazio libero/occupato sui dischi NVMe e sull'unità secondaria (`get_system_storage`).
- **Ricerca Semantica Foto & Proiezione (Immich):** Comando vocale (es. *"Mostra quella foto di quando siamo andati a Gardaland"*); Node.js interroga la REST API di Immich (`/api/search/smart` tramite API Key read-only) e apre un carosello fotografico temporaneo sul pannello AMOLED da 7".
- **Controllo Media & Servizi:** Gestione e interrogazione stato dei container Docker (`Jellyfin`, `Vaultwarden`, `Immich`) tramite strumenti dedicati del backend.

### 6. Interazione Vocale & UX HUD
- **Doppia Wake Word & Barge-In:** Attivazione locale su ESP32-S3 tramite `Vexis` + parola di stop/interruzione immediata per troncare risposte lunghe o TTS in corso.
- **Personalità & Memoria Anti-Context-Rot:** Tono asciutto e analitico (stile *Chatty Stick* / *EDI*), sessioni stateless per stanza con finestra scorrevole (max 3 turni, TTL 45-60s) e iniezione live dello stato MQTT della casa ad ogni richiesta.
- **Visualizer Ottico AMOLED:** Interfaccia su nero puro con nucleo grafico centrale reattivo allo stato del sistema (ascolto, elaborazione, alert).

### 7. Videocitofonia Locale (2 Portoni Blindati)
- **Doppio Accesso Indipendente (`door_1` / `door_2`):** Due videocitofoni IP locali (modello in fase di scelta, PoE con `RTSP`/`ONVIF`/`SIP` e zero cloud) collegati alla LAN domestica.
- **Notifica & Proiezione Automatica:** Alla suonata su uno dei due ingressi, i satelliti `ESP32-S3` annunciano quale porta ha suonato, il Kiosk AMOLED apre la modale temporanea (`60-90s`) con il flusso video live via `go2rtc` e `Ntfy` invia uno snapshot push sullo smartphone Android.
- **Sicurezza Fisica:** Nessun attuatore di sblocco collegato ai portoni blindati; solo monitoraggio passivo di apertura tramite microswitch / `PC817`.