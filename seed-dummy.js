import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account key
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ============================================================
// THRESHOLD (cm)
// Aman:    450 - 500 (maksimum sensor)
// Siaga:   200 - 450
// Waspada: 100 - 200
// Bahaya:  < 100
// ============================================================

function randomInRange(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function generateCurrentData() {
  const data = [];
  
  // 1. Aman (450-500 cm) - mendekati maksimum sensor
  data.push({
    water_level: randomInRange(450, 500),
    label: '🟢 AMAN (maksimum sensor)'
  });
  
  // 2. Siaga (200-450 cm)
  data.push({
    water_level: randomInRange(210, 440),
    label: '🟡 SIAGA'
  });
  
  // 3. Waspada (100-200 cm)
  data.push({
    water_level: randomInRange(110, 190),
    label: '🟠 WASPADA'
  });
  
  // 4. Bahaya (10-90 cm)
  data.push({
    water_level: randomInRange(10, 90),
    label: '🔴 BAHAYA'
  });
  
  // 5. Kembali Aman (450-500 cm)
  data.push({
    water_level: randomInRange(450, 500),
    label: '🟢 AMAN (kembali)'
  });
  
  return data;
}

function generateHistoryData() {
  const historyData = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const hour = now.getTime() - (23 - i) * 3600000;
    const timestamp = new Date(hour);
    
    let waterLevel;
    if (i < 4) waterLevel = randomInRange(450, 500); // Aman
    else if (i < 8) waterLevel = randomInRange(250, 430); // Siaga
    else if (i < 12) waterLevel = randomInRange(120, 190); // Waspada
    else if (i < 16) waterLevel = randomInRange(20, 90); // Bahaya
    else if (i < 20) waterLevel = randomInRange(250, 430); // Siaga
    else waterLevel = randomInRange(450, 500); // Aman
    
    waterLevel += (Math.random() - 0.5) * 10;
    waterLevel = Math.round(Math.max(5, Math.min(500, waterLevel)) * 10) / 10;
    
    historyData.push({
      water_level: waterLevel,
      water_presence: waterLevel < 200,
      rain_detected: waterLevel > 300 && waterLevel < 400 && Math.random() > 0.5,
      temperature: Math.round((24 + Math.random() * 6) * 10) / 10,
      timestamp: admin.firestore.Timestamp.fromDate(timestamp)
    });
  }
  
  return historyData;
}

async function writeDummy() {
  console.log('🚀 Memulai generate data dummy real-time...\n');
  console.log('Threshold: Aman 450-500, Siaga 200-450, Waspada 100-200, Bahaya <100\n');
  console.log('📊 Data Aman mendekati nilai maksimum sensor (500 cm)\n');

  const currentData = generateCurrentData();
  
  for (let i = 0; i < currentData.length; i++) {
    const data = currentData[i];
    const payload = {
      water_level: data.water_level,
      water_presence: data.water_level < 200,
      rain_detected: data.water_level > 300 && data.water_level < 400 && Math.random() > 0.5,
      temperature: Math.round((24 + Math.random() * 6) * 10) / 10,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('realtime').doc('current').set(payload);
    console.log(`✅ Current: water_level = ${data.water_level} cm (${data.label})`);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n📊 Mengisi history untuk grafik (24 jam terakhir)...');
  const historyData = generateHistoryData();
  
  let count = 0;
  for (const data of historyData) {
    const docId = `history_${Date.now()}_${count}`;
    await db.collection('history').doc(docId).set(data);
    count++;
  }
  
  console.log(`✅ History: ${count} data berhasil ditulis ke Firestore`);

  console.log('\n✅ Selesai! Cek Firestore dan dashboard-mu.');
  console.log('📌 Data Aman sekarang di rentang 450-500 cm (maksimum sensor).');
}

writeDummy().catch(console.error);
