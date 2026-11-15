#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include "config.h"

/**
 * Vexis 503 Flush-Mount Sensor Node (ESP32-C3)
 * - Sensirion SCD40 (CO2 NDIR, Temp, Humidity) over I2C
 * - Passive armored door state (PC817 optoisolator / microswitch, no smart lock)
 * - Publishes retained JSON telemetry to local Mosquitto broker
 */

void setup() {
  Serial.begin(115200);
  pinMode(DOOR_SENSOR_PIN, INPUT_PULLUP);
  Wire.begin(I2C_SDA, I2C_SCL);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("[VEXIS-NODE] Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[VEXIS-NODE] Connected. Ready for SCD40 + passive door telemetry.");
  // TODO: Initialize SCD4x and PubSubClient MQTT with LWT & retained state
}

void loop() {
  delay(1000);
}
