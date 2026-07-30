import { useData } from "../context/DataContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function WaterPresenceChart() {
  const { current, history } = useData();

  let chartData = history.map(d => ({
    time: d.timestamp?.toDate ? format(d.timestamp.toDate(), "HH:mm") : "",
    value: d.water_presence,
    fullTime: d.timestamp?.toDate ? d.timestamp.toDate() : null,
  }));

  if (chartData.length === 0 && current) {
    const now = new Date();
    const past = new Date(now.getTime() - 5 * 60000);
    chartData = [
      { time: format(past, "HH:mm"), value: current.water_presence, fullTime: past },
      { time: format(now, "HH:mm"), value: current.water_presence, fullTime: now },
    ];
  }

  if (chartData.length === 0) return <p className="text-gray-400">Tidak ada data keberadaan air.</p>;

  return (
    <div className="p-4 bg-white rounded-2xl shadow">
      <h4 className="text-sm font-semibold mb-2">Keberadaan Air</h4>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 1]} ticks={[0, 1]} tick={{ fontSize: 10 }} />
          <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.fullTime ? format(p[0].payload.fullTime, "dd MMM HH:mm") : ""} />
          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
