import { useData } from "../context/DataContext";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const colorMap = {
  green: "bg-green-100 border-green-500 text-green-800",
  yellow: "bg-yellow-100 border-yellow-500 text-yellow-800",
  orange: "bg-orange-100 border-orange-500 text-orange-800",
  red: "bg-red-100 border-red-500 text-red-800",
  gray: "bg-gray-100 border-gray-400 text-gray-700",
};

export default function StatusCard() {
  const { current, loading, getStatus } = useData();

  if (loading || !current) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  const { water_level, timestamp } = current;

  // Parse timestamp: bisa Firestore Timestamp (object) atau integer epoch detik
  let lastUpdate = "-";
  if (timestamp) {
    if (timestamp.toDate) {
      // Firestore Timestamp
      lastUpdate = format(timestamp.toDate(), "dd MMM yyyy, HH:mm:ss", { locale: id });
    } else if (typeof timestamp === "number") {
      // epoch detik dari ESP32
      lastUpdate = format(new Date(timestamp * 1000), "dd MMM yyyy, HH:mm:ss", { locale: id });
    }
  }

  const status = getStatus(water_level);

  return (
    <div className={`p-6 rounded-2xl border-l-8 shadow-md transition-all duration-500 ${colorMap[status.color]}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-2">Tinggi Muka Air</h2>
      <div className="text-4xl font-bold mb-1">{water_level.toFixed(1)} cm</div>
      <div className="text-2xl font-bold mb-3">{status.label}</div>
      <div className="text-xs opacity-80">Update terakhir: {lastUpdate}</div>
    </div>
  );
}
