#include <WiFi.h>
#include <time.h>
#include <Firebase_ESP_Client.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>

// --- WiFi ---
const char* ssid = "NAMA_WIFI";
const char* password = "PASSWORD_WIFI";

// --- Firebase ---
#define API_KEY "AIzaSyB2fzKLKbzcyNU-lDmevv7Dc6xchyqE0AU"
#define USER_EMAIL "esp32@ews-dashboard.local"
#define USER_PASSWORD "Mabarskuy123"
#define PROJECT_ID "ews-dashboard-99dda"

// --- MQTT (HiveMQ) ---
const char* mqtt_server = "d6e43354d203418ab452c2ef94e9ed66.s1.eu.hivemq.cloud";
const char* mqtt_user = "dashboard";
const char* mqtt_pass = "12345678";
const int mqtt_port = 8883;

// --- Pin Sensor ---
#define TRIG_PIN 12      // HC-SR04 Trig
#define ECHO_PIN 13      // HC-SR04 Echo
#define WATER_PRESENCE_PIN 32  // Water level sensor digital (1/0)
#define RAIN_SENSOR_PIN 33     // Rain sensor digital (1/0)
#define ONE_WIRE_BUS 15        // DS18B20 data pin
#define DHT_PIN 14             // DHT22/AM2302 data
#define DHT_TYPE DHT22

// --- Relay ---
#define RELAY1_PIN 25
#define RELAY2_PIN 26
#define RELAY3_PIN 27
#define RELAY4_PIN 14

// --- Global ---
WiFiClientSecure espMQTTClient;
PubSubClient mqttClient(espMQTTClient);
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);
DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastSensorRead = 0;
unsigned long lastMQTTReconnect = 0;
const unsigned long sensorInterval = 5000; // baca sensor tiap 5 detik
const unsigned long firebaseInterval = 15000; // kirim ke Firestore tiap 15 detik
unsigned long lastFirebaseSend = 0;

// Data sensor
float water_level = 0.0;
int water_presence = 0;
int rain_detected = 0;
float temperature = 0.0;
float humidity = 0.0;

// Manual relay override
bool manualRelay3 = false;
bool manualRelay4 = false;

// --- Fungsi baca HC-SR04 ---
float readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // timeout 30ms
  if (duration == 0) return -1; // error
  float distance = duration * 0.034 / 2; // cm
  return distance;
}

// --- Baca semua sensor ---
void readSensors() {
  // Ultrasonik
  water_level = readUltrasonic();
  if (water_level < 0) water_level = 0; // fallback

  // Water presence (digital)
  water_presence = digitalRead(WATER_PRESENCE_PIN);

  // Rain sensor
  rain_detected = digitalRead(RAIN_SENSOR_PIN);

  // Suhu DS18B20
  ds18b20.requestTemperatures();
  temperature = ds18b20.getTempCByIndex(0);

  // Kelembaban DHT
  humidity = dht.readHumidity();
  if (isnan(humidity)) humidity = 0;

  Serial.printf("Air:%.1fcm, Presence:%d, Rain:%d, Temp:%.1fC, Hum:%.1f%%\n",
                water_level, water_presence, rain_detected, temperature, humidity);
}

// --- Kontrol relay otomatis ---
void controlRelay() {
  if (manualRelay3 || manualRelay4) {
    digitalWrite(RELAY3_PIN, manualRelay3 ? HIGH : LOW);
    digitalWrite(RELAY4_PIN, manualRelay4 ? HIGH : LOW);
    digitalWrite(RELAY1_PIN, LOW);
    digitalWrite(RELAY2_PIN, LOW);
    return;
  }
  // Threshold sesuai pengaturan
  if (water_level >= 600) { // Bahaya
    digitalWrite(RELAY1_PIN, LOW);
    digitalWrite(RELAY2_PIN, LOW);
    digitalWrite(RELAY3_PIN, HIGH);
    digitalWrite(RELAY4_PIN, HIGH);
  } else if (water_level >= 400) { // Waspada (sebelumnya siaga)
    digitalWrite(RELAY1_PIN, LOW);
    digitalWrite(RELAY2_PIN, HIGH);
    digitalWrite(RELAY3_PIN, LOW);
    digitalWrite(RELAY4_PIN, LOW);
  } else if (water_level >= 200) { // Siaga
    digitalWrite(RELAY1_PIN, HIGH);
    digitalWrite(RELAY2_PIN, LOW);
    digitalWrite(RELAY3_PIN, LOW);
    digitalWrite(RELAY4_PIN, LOW);
  } else { // Aman
    digitalWrite(RELAY1_PIN, HIGH);
    digitalWrite(RELAY2_PIN, LOW);
    digitalWrite(RELAY3_PIN, LOW);
    digitalWrite(RELAY4_PIN, LOW);
  }
}

// --- MQTT callback ---
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char msg[length+1];
  memcpy(msg, payload, length);
  msg[length] = 0;
  if (strcmp(topic, "ews/relay") == 0) {
    String json = String(msg);
    if (json.indexOf("\"relay3\":true") >= 0) manualRelay3 = true;
    else if (json.indexOf("\"relay3\":false") >= 0) manualRelay3 = false;
    if (json.indexOf("\"relay4\":true") >= 0) manualRelay4 = true;
    else if (json.indexOf("\"relay4\":false") >= 0) manualRelay4 = false;
    if (!manualRelay3 && !manualRelay4) {
      Serial.println("Manual override off");
    }
  }
}

void connectMQTT() {
  if (mqttClient.connected()) return;
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
  espMQTTClient.setInsecure();
  if (mqttClient.connect("ESP32_Sensors", mqtt_user, mqtt_pass)) {
    Serial.println("MQTT connected");
    mqttClient.subscribe("ews/relay");
  }
}

// --- Kirim ke Firestore ---
void sendToFirestore() {
  FirebaseJson content;
  content.set("fields/water_level/doubleValue", water_level);
  content.set("fields/water_presence/integerValue", water_presence);
  content.set("fields/rain_detected/integerValue", rain_detected);
  content.set("fields/temperature/doubleValue", temperature);
  content.set("fields/humidity/doubleValue", humidity);

  time_t now = time(NULL);
  content.set("fields/timestamp/integerValue", (int)now);

  if (Firebase.Firestore.updateDocument(&fbdo, PROJECT_ID, "", "realtime/current", content.raw())) {
    Serial.println("Firebase current updated");
  } else {
    Serial.print("Firebase error: "); Serial.println(fbdo.errorReason());
  }

  // Kirim juga ke history setiap 15 menit (cek menit)
  struct tm timeinfo;
  if (getLocalTime(&timeinfo) && (timeinfo.tm_min % 15 == 0) && (timeinfo.tm_sec < 10)) {
    if (Firebase.Firestore.createDocument(&fbdo, PROJECT_ID, "", "history", content.raw())) {
      Serial.println("History added");
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(WATER_PRESENCE_PIN, INPUT);
  pinMode(RAIN_SENSOR_PIN, INPUT);
  pinMode(RELAY1_PIN, OUTPUT); pinMode(RELAY2_PIN, OUTPUT);
  pinMode(RELAY3_PIN, OUTPUT); pinMode(RELAY4_PIN, OUTPUT);
  digitalWrite(RELAY1_PIN, LOW); digitalWrite(RELAY2_PIN, LOW);
  digitalWrite(RELAY3_PIN, LOW); digitalWrite(RELAY4_PIN, LOW);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.println("WiFi OK");

  configTime(25200, 0, "pool.ntp.org", "time.nist.gov");
  ds18b20.begin();
  dht.begin();

  config.api_key = API_KEY;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  Firebase.begin(&config, &auth);
}

void loop() {
  if (!mqttClient.connected()) {
    if (millis() - lastMQTTReconnect > 5000) {
      lastMQTTReconnect = millis();
      connectMQTT();
    }
  } else {
    mqttClient.loop();
  }

  if (millis() - lastSensorRead >= sensorInterval) {
    lastSensorRead = millis();
    readSensors();
    controlRelay();
  }

  if (millis() - lastFirebaseSend >= firebaseInterval) {
    lastFirebaseSend = millis();
    sendToFirestore();
  }
}
