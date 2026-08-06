import { useData } from "../context/DataContext";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function HistoryTable() {
  const { history } = useData();
  const last10 = history.slice(-10).reverse();

  const formatTime = (ts) => {
    if (!ts) return "-";
    try {
      if (ts.toDate) {
        // Firestore Timestamp
        return format(ts.toDate(), "dd/MM HH:mm:ss", { locale: id });
      }
      if (typeof ts === "number") {
        // Unix timestamp (detik)
        return format(new Date(ts * 1000), "dd/MM HH:mm:ss", { locale: id });
      }
      if (typeof ts === "string") {
        // ISO string
        return format(new Date(ts), "dd/MM HH:mm:ss", { locale: id });
      }
      return "-";
    } catch (e) {
      console.warn("Error formatting timestamp:", ts, e);
      return "-";
    }
  };

  const getSafeValue = (value, fallback = "-") => {
    if (value === undefined || value === null) return fallback;
    if (typeof value === "number") return value.toFixed(1);
    return value;
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow overflow-auto max-h-96">
      <h3 className="text-lg font-semibold mb-3">Riwayat 10 Data Terakhir</h3>
      {last10.length === 0 ? (
        <p className="text-gray-400 text-center py-4">Belum ada data history.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1 pr-2">Waktu</th>
              <th className="py-1 pr-2">Air (cm)</th>
              <th className="py-1 pr-2">Keberadaan Air</th>
              <th className="py-1 pr-2">Hujan</th>
              <th className="py-1">Suhu (°C)</th>
            </tr>
          </thead>
          <tbody>
            {last10.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-1 pr-2 whitespace-nowrap">{formatTime(item.timestamp)}</td>
                <td className="py-1 pr-2">{getSafeValue(item.water_level)}</td>
                <td className="py-1 pr-2">{item.water_presence ? "Ada" : "Tidak"}</td>
                <td className="py-1 pr-2">{item.rain_detected ? "Hujan" : "Tidak"}</td>
                <td className="py-1">{getSafeValue(item.temperature)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
