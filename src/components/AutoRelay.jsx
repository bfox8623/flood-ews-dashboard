import { useEffect, useRef } from "react";
import { publishRelay } from "../services/mqtt";
import { useData } from "../context/DataContext";

export default function AutoRelay() {
  const { current, getStatus } = useData();
  const prevStatusRef = useRef(null);

  useEffect(() => {
    if (!current) return;
    const level = current.water_level;
    const status = getStatus(level);
    const prev = prevStatusRef.current;

    // Jika status berubah, dan sekarang WASPADA atau BAHAYA
    if (prev && status.level >= 3 && status.level > prev.level) {
      // Nyalakan relay 3 & 4 otomatis
      console.log("Auto-relay: status naik ke", status.label, "→ nyalakan relay 3 & 4");
      publishRelay(true, true);
    }
    // Jika status turun dari WASPADA/BAHAYA ke AMAN/SIAGA, matikan relay 3 & 4
    if (prev && prev.level >= 3 && status.level < 3) {
      console.log("Auto-relay: status turun ke", status.label, "→ matikan relay 3 & 4");
      publishRelay(false, false);
    }

    prevStatusRef.current = status;
  }, [current, getStatus]);

  return null; // tidak menampilkan apa-apa
}
