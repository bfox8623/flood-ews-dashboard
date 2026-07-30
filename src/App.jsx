import { Toaster } from "react-hot-toast";
import { DataProvider } from "./context/DataContext";
import ParameterCards from "./components/ParameterCards";
import WaterLevelChart from "./components/WaterLevelChart";
import WaterPresenceChart from "./components/WaterPresenceChart";
import RainChart from "./components/RainChart";
import EnvironmentChart from "./components/EnvironmentChart";
import HistoryTable from "./components/HistoryTable";
import NotificationListener from "./components/NotificationListener";
import RelayControl from "./components/RelayControl";
import Clock from "./components/Clock";

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header dengan jam di kanan */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🌊 Dashboard EWS Banjir</h1>
          <p className="text-gray-500">Monitoring multi-parameter realtime</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Clock />
        </div>
      </header>

      <div className="mb-8">
        <ParameterCards />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <WaterLevelChart />
        <WaterPresenceChart />
        <RainChart />
        <EnvironmentChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <RelayControl />
          <HistoryTable />
        </div>
        <div className="lg:col-span-2">
          {/* Widget tambahan bisa diletakkan di sini */}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <NotificationListener />
      <Toaster position="top-right" />
      <Dashboard />
    </DataProvider>
  );
}
