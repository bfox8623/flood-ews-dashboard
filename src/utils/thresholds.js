// threshold berdasarkan water level (untuk kompatibilitas)
export const getStatus = (level, thresholds) => {
  if (!thresholds) {
    if (level <= 30) return { label: 'Aman', color: 'green', level: 1 };
    if (level <= 50) return { label: 'Siaga', color: 'yellow', level: 2 };
    return { label: 'Bahaya', color: 'red', level: 3 };
  }
  const { water_max_aman = 30, water_max_siaga = 50 } = thresholds;
  if (level <= water_max_aman) return { label: 'Aman', color: 'green', level: 1 };
  if (level <= water_max_siaga) return { label: 'Siaga', color: 'yellow', level: 2 };
  return { label: 'Bahaya', color: 'red', level: 3 };
};

// status gabungan dari 4 parameter
export const getCombinedStatus = (data, thresholds) => {
  const { water_level, water_presence, temperature, humidity, rain_detected } = data;
  const t = thresholds || {};
  const waterAman = t.water_max_aman || 30;
  const waterSiaga = t.water_max_siaga || 50;
  const tempMin = t.temp_min || 20;
  const tempMax = t.temp_max || 35;
  const humMin = t.humidity_min || 40;
  const humMax = t.humidity_max || 80;

  let status = { label: 'Aman', color: 'green', level: 1 };

  // 1. Water level
  if (water_level > waterSiaga) {
    status = { label: 'Bahaya', color: 'red', level: 3 };
  } else if (water_level > waterAman) {
    status = { label: 'Siaga', color: 'yellow', level: 2 };
  }

  // 2. Water presence (jika ada air dan level > 10)
  if (water_presence && water_level > 10) {
    if (status.level < 2) status = { label: 'Siaga', color: 'yellow', level: 2 };
    if (water_level > waterSiaga) status = { label: 'Bahaya', color: 'red', level: 3 };
  }

  // 3. Suhu ekstrem
  if (temperature < tempMin || temperature > tempMax) {
    if (status.level < 2) status = { label: 'Siaga', color: 'yellow', level: 2 };
    // jika sudah bahaya, tetap bahaya
  }

  // 4. Kelembaban ekstrem
  if (humidity < humMin || humidity > humMax) {
    if (status.level < 2) status = { label: 'Siaga', color: 'yellow', level: 2 };
  }

  // 5. Hujan => naikkan ke Siaga (jika belum)
  if (rain_detected) {
    if (status.level < 2) status = { label: 'Siaga', color: 'yellow', level: 2 };
  }

  return status;
};
