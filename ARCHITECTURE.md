# Architettura Tecnica & Modello di Sicurezza - Vexis

## 1. Topologia di Rete e Isolamento (Docker)
Lo stack è suddiviso in tre reti bridge Docker per applicare il principio del **minimo privilegio**:
- **`vexis-core` (interna):** Comunicazione tra `mosquitto`, `vexis-backend`, `ollama`, `whisper`, `piper`, `ntfy`. Nessun servizio AI è esposto direttamente su internet.
- **`vexis-media` (interna):** Isola `immich`, `postgres`, `redis` e `jellyfin`. `vexis-backend` accede ad Immich solo tramite API Key **read-only**.
- **`vexis-proxy` (edge locale):** `nginx-proxy-manager` espone i domini locali (`vexis.home`, `immich.home`, `jellyfin.home`, `vault.home`) con terminazione TLS locale.

## 2. Sicurezza Applicativa & Hardware
- **Container Hardening:**
  - `backend` e `frontend` girano con utenti **non-root** (`node` / `nginx` unprivileged) e multi-stage build.
  - Nessun container usa `privileged: true`; l'accelerazione GPU Radeon passa esclusivamente il device `/dev/dri` a `ollama` e `jellyfin`.
- **MQTT Authentication & ACL:**
  - `allow_anonymous false` obbligatorio in `mosquitto.conf`.
  - Credenziali dedicate per l'orchestratore e per i nodi ESP32/Shelly, con ACL per limitare i topic pubblicabili dai sensori.
  - Stato dispositivi gestito con *Retained Messages* e *Last Will & Testament* (`LWT`).
- **WebSocket & API:**
  - Validazione strict delle variabili d'ambiente all'avvio tramite `zod` (fail-fast se mancano segreti).
  - Autenticazione tramite bearer/token condiviso (`WS_AUTH_TOKEN`) per i satelliti ESP32-S3 e il pannello Kiosk.
- **Privacy Fisica:**
  - Zero attuatori su serrature/portoni blindati: solo lettura passiva isolata galvanicamente (optoisolatore PC817 / microswitch).

## 3. Flusso Vocale & Anti-Context-Rot
1. Il satellite `ESP32-S3` rileva localmente la wake word `Vexis` (`.tflite`) e apre uno stream PCM su WebSocket verso `vexis-backend` (supporta parola di stop/barge-in locale).
2. `vexis-backend` invia l'audio a `whisper.cpp` per la trascrizione locale.
3. Il testo viene inviato a `ollama` (`OLLAMA_KEEP_ALIVE=-1`) insieme a:
   - System Prompt con identità Vexis;
   - **Snapshot MQTT real-time** (luci, clima, CO2, stato portoni);
   - **Sliding Window** della stanza corrente (max 3 turni, TTL 45–60s).
4. Se l'LLM invoca un tool (Shelly JSON-RPC, Ntfy Android Alarm, Immich Smart Search, Disk Check), l'orchestratore esegue l'azione e restituisce il risultato.
5. La risposta testuale viene sintetizzata da `piper` (o `kokoro`) + FFmpeg e inviata in streaming al satellite e al Kiosk AMOLED.
