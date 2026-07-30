import { useData } from "../context/DataContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function WaterLevelChart() {
  const { current, history } = useData();

  let chartData = history.map(d => ({
    time: d.timestamp?.toDate ? format(d.timestamp.toDate(), "HH:mm") : "",
    value: d.water_level,
    fullTime: d.timestamp?.toDate ? d.timestamp.toDate() : null,
  }));

  if (chartData.length === 0 && current) {
    const now = new Date();
    const past = new Date(now.getTime() - 5 * 60000);
    chartData = [
      { time: format(past, "HH:mm"), value: current.water_level, fullTime: past },
      { time: format(now, "HH:mm"), value: current.water_level, fullTime: now },
    ];
  }

  if (chartData.length === 0) return <p className="text-gray-400">Tidak ada data tinggi air.</p>;

  return (
    <div className="p-4 bg-white rounded-2xl shadow">
      <h4 className="text-sm font-semibold mb-2">Tinggi Air (cm)</h4>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} />
          <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.fullTime ? format(p[0].payload.fullTime, "dd MMM HH:mm") : ""} />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
