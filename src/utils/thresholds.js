export const getStatus = (level, thresholds) => {
  if (!thresholds) return { label: "Memuat...", color: "gray", level: 0 };
  if (level >= thresholds.bahaya) return { label: "BAHAYA", color: "red", level: 4 };
  if (level >= thresholds.waspada) return { label: "WASPADA", color: "orange", level: 3 };
  if (level >= thresholds.siaga) return { label: "SIAGA", color: "yellow", level: 2 };
  return { label: "AMAN", color: "green", level: 1 };
};
