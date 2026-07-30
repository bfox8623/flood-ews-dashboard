import { useData } from "../context/DataContext";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const colorMap = {
  green: "bg-green-100 border-green-500 text-green-800",
  yellow: "bg-yellow-100 border-yellow-500 text-yellow-800",
  orange: "bg-orange-100 border-orange-500 text-orange-800",
  red: "bg-red-100 border-red-500 text-red-800",
  blue: "bg-blue-100 border-blue-500 text-blue-800",
  gray: "bg-gray-100 border-gray-400 text-gray-700",
};

export default function ParameterCards() {
  const { current, loading, getStatus } = useData();

  if (loading || !current) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 bg-white rounded-xl shadow h-24">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const { water_level, water_presence, rain_detected, temperature, humidity, timestamp } = current;
  const status = getStatus(water_level);

  const parameters = [
    {
      label: "Tinggi Air",
      value: water_level.toFixed(1) + " cm",
      color: status.color,
      icon: "🌊",
    },
    {
      label: "Keberadaan Air",
      value: water_presence ? "Ada" : "Tidak Ada",
      color: water_presence ? "green" : "gray",
      icon: "💧",
    },
    {
      label: "Hujan",
      value: rain_detected ? "Hujan" : "Tidak Hujan",
      color: rain_detected ? "blue" : "gray",
      icon: "🌧️",
    },
    {
      label: "Lingkungan",
      value: `${temperature.toFixed(1)}°C / ${humidity.toFixed(1)}%`,
      color: temperature > 35 || humidity > 80 ? "red" : temperature < 20 ? "blue" : "green",
      icon: "🌡️💦",
    },
  ];

  const lastUpdate = timestamp?.toDate
    ? format(timestamp.toDate(), "dd MMM yyyy, HH:mm:ss", { locale: id })
    : typeof timestamp === "number"
    ? format(new Date(timestamp * 1000), "dd MMM yyyy, HH:mm:ss", { locale: id })
    : "-";

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {parameters.map((param, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border-l-4 shadow-sm transition-all ${colorMap[param.color] || "bg-white border-gray-300 text-gray-800"}`}
          >
            <div className="text-2xl mb-1">{param.icon}</div>
            <div className="text-xs font-semibold uppercase tracking-wider">{param.label}</div>
            <div className="text-lg font-bold">{param.value}</div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 mt-2">Update terakhir: {lastUpdate}</div>
    </>
  );
}
