import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account key (download dari Firebase Console)
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ============================================================
// THRESHOLD (cm)
// Aman:    500.0 (nilai maksimum sensor)
// Siaga:   200 - 450
// Waspada: 100 - 200
// Bahaya:  < 100
// ============================================================

// Fungsi untuk generate angka random dalam rentang (2 desimal)
function randomInRange(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

// ============================================================
// 1. DATA REAL-TIME (5 kondisi bergantian)
// ============================================================
function generateCurrentData() {
  return [
    { 
      water_level: 500.0, 
      label: '🟢 AMAN (maksimum sensor)',
      rain: false,
      presence: false
    },
    { 
      water_level: randomInRange(210, 440), 
      label: '🟡 SIAGA',
      rain: false,
      presence: false
    },
    { 
      water_level: randomInRange(110, 190), 
      label: '🟠 WASPADA',
      rain: false,
      presence: false
    },
    { 
      water_level: randomInRange(10, 90), 
      label: '🔴 BAHAYA + HUJAN',
      rain: true,      // <-- HUJAN saat Bahaya
      presence: true   // <-- Ada air
    },
    { 
      water_level: 500.0, 
      label: '🟢 AMAN (kembali)',
      rain: false,
      presence: false
    },
  ];
}

// ============================================================
// 2. DATA HISTORY (24 jam terakhir, fluktuatif)
// ============================================================
function generateHistoryData() {
  const historyData = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const hour = now.getTime() - (23 - i) * 3600000;
    const timestamp = new Date(hour);

    let waterLevel;
    let rain = false;
    let presence = false;

    // Pola: Aman -> Siaga -> Waspada -> Bahaya -> Siaga -> Aman
    if (i < 4) {
      waterLevel = 500.0; // Aman
    } else if (i < 8) {
      waterLevel = randomInRange(250, 430); // Siaga
    } else if (i < 12) {
      waterLevel = randomInRange(120, 190); // Waspada
    } else if (i < 16) {
      waterLevel = randomInRange(10, 90); // Bahaya
      rain = true;       // <-- HUJAN saat Bahaya
      presence = true;   // <-- Ada air saat Bahaya
    } else if (i < 20) {
      waterLevel = randomInRange(250, 430); // Siaga
    } else {
      waterLevel = 500.0; // Aman
    }

    // Pastikan tidak melebihi 500 dan tidak negatif
    waterLevel = Math.round(Math.max(5, Math.min(500, waterLevel)) * 10) / 10;

    historyData.push({
      water_level: waterLevel,
      water_presence: presence || waterLevel < 200,
      rain_detected: rain || (waterLevel > 300 && waterLevel < 400 && Math.random() > 0.5),
      temperature: Math.round((24 + Math.random() * 6) * 10) / 10,
      timestamp: admin.firestore.Timestamp.fromDate(timestamp)
    });
  }

  return historyData;
}

// ============================================================
// 3. EKSEKUSI UTAMA
// ============================================================
async function seed() {
  console.log('🚀 Mulai seeding data ke Firestore...\n');
  console.log('📊 Threshold: Aman=500, Siaga 200-450, Waspada 100-200, Bahaya <100\n');
  console.log('🌧️  Kondisi Bahaya akan disertai Hujan dan Air (realistis)\n');

  // --- A. Current (5 data bergantian) ---
  const currentData = generateCurrentData();
  for (let i = 0; i < currentData.length; i++) {
    const data = currentData[i];
    const payload = {
      water_level: data.water_level,
      water_presence: data.presence || data.water_level < 200,
      rain_detected: data.rain || (data.water_level > 300 && data.water_level < 400 && Math.random() > 0.5),
      temperature: Math.round((24 + Math.random() * 6) * 10) / 10,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('realtime').doc('current').set(payload);
    console.log(`✅ Current: ${data.water_level} cm → ${data.label}`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // jeda 3 detik
  }

  // --- B. History (24 data) ---
  console.log('\n📊 Mengisi history (24 jam)...');
  const historyData = generateHistoryData();
  let count = 0;
  for (const data of historyData) {
    const docId = `history_${Date.now()}_${count}`;
    await db.collection('history').doc(docId).set(data);
    count++;
  }
  console.log(`✅ History: ${count} data tersimpan`);

  console.log('\n✅ Seeding selesai! Cek Firestore dan dashboard.');
  console.log('📌 Data Aman selalu 500.0 cm (tidak kurang/lebih).');
  console.log('🌧️  Data Bahaya disertai Hujan = true dan Air = true.');
}

// ============================================================
// 4. JALANKAN
// ============================================================
seed().catch(console.error);
