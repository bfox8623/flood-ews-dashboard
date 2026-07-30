const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Fungsi random
const randomFloat = (min, max, decimals = 1) =>
  Number((Math.random() * (max - min) + min).toFixed(decimals));

const randomBool = () => (Math.random() < 0.5 ? 0 : 1);

// Membuat satu data dummy
function generateData() {
  return {
    water_level: randomFloat(200, 450, 1), // cm
    water_presence: randomBool(),          // 0 atau 1
    rain_detected: randomBool(),           // 0 atau 1
    temperature: randomFloat(24, 35, 1),  // °C
    humidity: randomFloat(60, 95, 1),      // %
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function seed() {
  console.log("🌱 Mulai seeding...");

  // 1. Data realtime/current
  await db.collection("realtime").doc("current").set(generateData());
  console.log("✅ realtime/current berhasil dibuat");

  // 2. Data dummy history (10 dokumen)
  const batch = db.batch();
  const historyRef = db.collection("history");

  for (let i = 0; i < 10; i++) {
    const docRef = historyRef.doc();
    batch.set(docRef, generateData());
  }

  await batch.commit();
  console.log("✅ 10 dokumen history berhasil dibuat");

  console.log("🎉 Seeding selesai! Dashboard sekarang memiliki data dummy.");
}

seed().catch((err) => {
  console.error("❌ Seeding gagal:", err);
  process.exit(1);
});
