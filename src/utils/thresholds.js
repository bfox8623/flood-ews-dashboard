// threshold untuk ketinggian air (cm)
// - Sangat Bahaya: < 50 cm  → level 4 (Relay 3 & 4)
// - Bahaya: 50 - 100 cm     → level 3 (Relay 3)
// - Siaga: 100 - 400 cm     → level 2 (Relay 2)
// - Aman: > 400 cm          → level 1 (Relay 1)
export const getStatus = (level, thresholds) => {
  if (!thresholds) {
    if (level < 50) return { label: 'Sangat Bahaya', color: 'red', level: 4 };
    if (level < 100) return { label: 'Bahaya', color: 'red', level: 3 };
    if (level < 400) return { label: 'Siaga', color: 'yellow', level: 2 };
    return { label: 'Aman', color: 'green', level: 1 };
  }
  const { water_max_aman = 400, water_max_siaga = 100, water_max_bahaya = 50 } = thresholds;
  if (level < water_max_bahaya) return { label: 'Sangat Bahaya', color: 'red', level: 4 };
  if (level < water_max_siaga) return { label: 'Bahaya', color: 'red', level: 3 };
  if (level < water_max_aman) return { label: 'Siaga', color: 'yellow', level: 2 };
  return { label: 'Aman', color: 'green', level: 1 };
};

// Status gabungan dari 4 parameter
export const getCombinedStatus = (data, thresholds) => {
  const { water_level, water_presence, temperature, rain_detected } = data;

  const t = thresholds || {};
  const waterAman = t.water_max_aman || 400;   // > 400 cm = aman
  const waterSiaga = t.water_max_siaga || 100; // < 100 cm = bahaya
  const waterBahaya = t.water_max_bahaya || 50; // < 50 cm = sangat bahaya
  const tempMin = t.temp_min || 20;
  const tempMax = t.temp_max || 35;

  let status = { label: 'Aman', color: 'green', level: 1 };

  // 1. Cek ketinggian air
  if (water_level < waterBahaya) {
    status = { label: 'Sangat Bahaya', color: 'red', level: 4 };
  } else if (water_level < waterSiaga) {
    status = { label: 'Bahaya', color: 'red', level: 3 };
  } else if (water_level < waterAman) {
    status = { label: 'Siaga', color: 'yellow', level: 2 };
  }

  // 2. Cek water presence
  if (water_presence && water_level < 400) {
    if (status.level < 2) status = { label: 'Siaga', color: 'yellow', level: 2 };
    if (water_level < waterSiaga) status = { label: 'Bahaya', color: 'red', level: 3 };
    if (water_level < waterBahaya) status = { label: 'Sangat Bahaya', color: 'red', level: 4 };
  }

  // 3. Cek suhu ekstrem
  if (temperature < tempMin || temperature > tempMax) {
    if (status.level < 2) status = { label: 'Siaga', color: 'yellow', level: 2 };
  }

  // 4. Cek hujan
  if (rain_detected) {
    if (status.level < 2) status = { label: 'Siaga', color: 'yellow', level: 2 };
  }

  return status;
};
