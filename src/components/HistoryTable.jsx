import { useData } from "../context/DataContext";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function HistoryTable() {
  const { history } = useData();
  const last10 = history.slice(-10).reverse();

  const formatTime = (ts) => {
    if (!ts) return "-";
    if (ts.toDate) return format(ts.toDate(), "dd/MM HH:mm:ss", { locale: id });
    if (typeof ts === "number") return format(new Date(ts * 1000), "dd/MM HH:mm:ss", { locale: id });
    return "-";
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow overflow-auto max-h-96">
      <h3 className="text-lg font-semibold mb-3">Riwayat 10 Data Terakhir</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-left">
            <th className="py-1 pr-2">Waktu</th>
            <th className="py-1 pr-2">Air (cm)</th>
            <th className="py-1 pr-2">Keberadaan</th>
            <th className="py-1 pr-2">Hujan</th>
            <th className="py-1 pr-2">Suhu (°C)</th>
            <th className="py-1">Kelembaban (%)</th>
          </tr>
        </thead>
        <tbody>
          {last10.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-400">Belum ada data</td>
            </tr>
          ) : (
            last10.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-1 pr-2 whitespace-nowrap">{formatTime(item.timestamp)}</td>
                <td className="py-1 pr-2">{item.water_level.toFixed(1)}</td>
                <td className="py-1 pr-2">{item.water_presence ? "Ada" : "Tidak"}</td>
                <td className="py-1 pr-2">{item.rain_detected ? "Hujan" : "Tidak"}</td>
                <td className="py-1 pr-2">{item.temperature.toFixed(1)}</td>
                <td className="py-1">{item.humidity.toFixed(1)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
