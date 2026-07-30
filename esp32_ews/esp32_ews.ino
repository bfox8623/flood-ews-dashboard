#include <WiFi.h>
#include <time.h>
#include <Firebase_ESP_Client.h>

// Ganti dengan kredensial WiFi Anda
#define WIFI_SSID "NAMA_WIFI"
#define WIFI_PASSWORD "PASSWORD_WIFI"

// Firebase (tidak perlu diubah)
#define API_KEY "AIzaSyB2fzKLKbzcyNU-lDmevv7Dc6xchyqE0AU"
#define USER_EMAIL "esp32@ews-dashboard.local"
#define USER_PASSWORD "Mabarskuy123"
#define PROJECT_ID "ews-dashboard-99dda"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long lastTime = 0;
const unsigned long timerDelay = 5000; // kirim tiap 5 detik

// Ganti dengan fungsi baca sensor sesungguhnya
float readSensor() {
  // Simulasi: nilai acak 0 - 1000 cm
  return random(0, 10000) / 10.0; // contoh 457.3
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Konek WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println(" Terhubung!");

  // Sinkronkan waktu NTP (untuk timestamp)
  configTime(25200, 0, "pool.ntp.org", "time.nist.gov");
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    Serial.println("Waktu tersinkron");
  }

  // Konfigurasi Firebase
  config.api_key = API_KEY;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (millis() - lastTime > timerDelay || lastTime == 0) {
    lastTime = millis();

    float level = readSensor();
    Serial.print("Tinggi air: ");
    Serial.print(level);
    Serial.println(" cm");

    // Buat data JSON
    FirebaseJson content;
    content.set("fields/water_level/doubleValue", level);

    // Dapatkan timestamp epoch (detik)
    time_t now = time(NULL);
    if (now > 100000) { // valid time
      content.set("fields/timestamp/integerValue", (int)now);
    }

    // 1. Update dokumen realtime/current
    if (Firebase.Firestore.updateDocument(&fbdo, PROJECT_ID, "", "realtime/current", content.raw())) {
      Serial.println("✓ current updated");
    } else {
      Serial.print("X current error: ");
      Serial.println(fbdo.errorReason());
    }

    // 2. Tambah dokumen baru di history
    if (Firebase.Firestore.createDocument(&fbdo, PROJECT_ID, "", "history", content.raw())) {
      Serial.println("✓ history added");
    } else {
      Serial.print("X history error: ");
      Serial.println(fbdo.errorReason());
    }
  }
}
