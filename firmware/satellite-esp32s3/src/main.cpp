#include <Arduino.h>
#include <WiFi.h>
#include "config.h"

/**
 * Vexis Voice Satellite (ESP32-S3)
 * - Local dual wake word detection ("Vexis" + immediate barge-in "Stop")
 * - Raw PCM audio streaming over authenticated WebSocket
 * - LVGL display auto-timeout management
 */

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("[VEXIS-SAT] Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[VEXIS-SAT] Connected. Ready for wake word & WS audio stream.");
  // TODO: Initialize I2S INMP441 / MAX98357A, TFLite wake word engine, and WebSocket client
}

void loop() {
  delay(10);
}
