#include <WiFi.h>
#include <PubSubClient.h>
#include <time.h>

// WiFi
const char* ssid = "admin";
const char* password = "12345678";

// HiveMQ
const char* mqtt_server = "d6e43354d203418ab452c2ef94e9ed66.s1.eu.hivemq.cloud"; // tanpa "mqtts://" tanpa port
const char* mqtt_user = "admin";
const char* mqtt_pass = "12345678";
const int mqtt_port = 8883;

// Pin relay
#define RELAY3_PIN 25
#define RELAY4_PIN 26

WiFiClientSecure espClient;
PubSubClient client(espClient);

unsigned long lastPublish = 0;
const long publishInterval = 15000; // 15 detik

void setup() {
  Serial.begin(115200);
  pinMode(RELAY3_PIN, OUTPUT);
  pinMode(RELAY4_PIN, OUTPUT);
  digitalWrite(RELAY3_PIN, LOW);
  digitalWrite(RELAY4_PIN, LOW);

  setup_wifi();
  espClient.setInsecure(); // Untuk memudahkan; nanti bisa diatur fingerprint
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void setup_wifi() {
  delay(10);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  char msg[length+1];
  memcpy(msg, payload, length);
  msg[length] = 0;
  Serial.println(msg);

  if (strcmp(topic, "ews/relay") == 0) {
    String json = String(msg);
    // Parse sederhana: cari relay3:true/relay4:true
    if (json.indexOf("\"relay3\":true") >= 0) digitalWrite(RELAY3_PIN, HIGH);
    else if (json.indexOf("\"relay3\":false") >= 0) digitalWrite(RELAY3_PIN, LOW);

    if (json.indexOf("\"relay4\":true") >= 0) digitalWrite(RELAY4_PIN, HIGH);
    else if (json.indexOf("\"relay4\":false") >= 0) digitalWrite(RELAY4_PIN, LOW);
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32_EWS", mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      client.subscribe("ews/relay");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  unsigned long now = millis();
  if (now - lastPublish > publishInterval) {
    lastPublish = now;
    float water = readSensor(); // Ganti dengan baca sensor sebenarnya
    time_t epoch = time(nullptr);

    String payload = "{\"water_level\":" + String(water,1) + ",\"timestamp\":" + String(epoch) + "}";
    client.publish("ews/sensor", payload.c_str());
    Serial.println("Published: " + payload);
  }
}

float readSensor() {
  return random(0, 10000) / 10.0; // Simulasi
}
