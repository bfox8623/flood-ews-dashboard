import { useData } from "../context/DataContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

export default function EnvironmentChart() {
  const { current, history } = useData();

  let chartData = history.map(d => ({
    time: d.timestamp?.toDate ? format(d.timestamp.toDate(), "HH:mm") : "",
    temperature: d.temperature,
    humidity: d.humidity,
    fullTime: d.timestamp?.toDate ? d.timestamp.toDate() : null,
  }));

  if (chartData.length === 0 && current) {
    const now = new Date();
    const past = new Date(now.getTime() - 5 * 60000);
    chartData = [
      { time: format(past, "HH:mm"), temperature: current.temperature, humidity: current.humidity, fullTime: past },
      { time: format(now, "HH:mm"), temperature: current.temperature, humidity: current.humidity, fullTime: now },
    ];
  }

  if (chartData.length === 0) return <p className="text-gray-400">Tidak ada data lingkungan.</p>;

  return (
    <div className="p-4 bg-white rounded-2xl shadow">
      <h4 className="text-sm font-semibold mb-2">Lingkungan</h4>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
          <YAxis yAxisId="left" domain={["auto", "auto"]} tick={{ fontSize: 10 }} unit="°C" />
          <YAxis yAxisId="right" orientation="right" domain={["auto", "auto"]} tick={{ fontSize: 10 }} unit="%" />
          <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.fullTime ? format(p[0].payload.fullTime, "dd MMM HH:mm") : ""} />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={false} name="Suhu" />
          <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Kelembaban" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
