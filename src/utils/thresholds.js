// ============================================================
// THRESHOLD KETINGGIAN AIR (cm)
// Bahaya:   < 100 cm  (1 meter)
// Waspada:  100-200 cm (1-2 meter)
// Siaga:    200-500 cm (2-5 meter)
// Aman:     > 500 cm  (5 meter lebih)
// ============================================================
export const getStatus = (level, thresholds) => {
  if (!thresholds) {
    if (level < 100) return { label: 'Bahaya', color: 'red', level: 4 };
    if (level < 200) return { label: 'Waspada', color: 'orange', level: 3 };
    if (level < 500) return { label: 'Siaga', color: 'yellow', level: 2 };
    return { label: 'Aman', color: 'green', level: 1 };
  }
  const { water_max_aman = 500, water_max_siaga = 200, water_max_waspada = 100 } = thresholds;
  if (level < water_max_waspada) return { label: 'Bahaya', color: 'red', level: 4 };
  if (level < water_max_siaga) return { label: 'Waspada', color: 'orange', level: 3 };
  if (level < water_max_aman) return { label: 'Siaga', color: 'yellow', level: 2 };
  return { label: 'Aman', color: 'green', level: 1 };
};

// Status gabungan dari 4 parameter
export const getCombinedStatus = (data, thresholds) => {
  const { water_level, water_presence, temperature, rain_detected } = data;

  const t = thresholds || {};
  const waterAman = t.water_max_aman || 500;
  const waterSiaga = t.water_max_siaga || 200;
  const waterWaspada = t.water_max_waspada || 100;
  const tempMin = t.temp_min || 20;
  const tempMax = t.temp_max || 35;

  let status = { label: 'Aman', color: 'green', level: 1 };

  // 1. Cek ketinggian air
  if (water_level < waterWaspada) {
    status = { label: 'Bahaya', color: 'red', level: 4 };
  } else if (water_level < waterSiaga) {
    status = { label: 'Waspada', color: 'orange', level: 3 };
  } else if (water_level < waterAman) {
    status = { label: 'Siaga', color: 'yellow', level: 2 };
  }

  // 2. Cek water presence
  if (water_presence && water_level < waterAman) {
    if (status.level < 2) status = { label: 'Siaga', color: 'yellow', level: 2 };
    if (water_level < waterSiaga) status = { label: 'Waspada', color: 'orange', level: 3 };
    if (water_level < waterWaspada) status = { label: 'Bahaya', color: 'red', level: 4 };
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
