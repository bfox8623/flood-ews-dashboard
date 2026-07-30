import { useState } from "react";
import { publishRelay } from "../services/mqtt";
import { useData } from "../context/DataContext";

export default function RelayControl() {
  const { current, getStatus } = useData();
  const [loading, setLoading] = useState(false);

  const status = current ? getStatus(current.water_level).label : "-";

  const handleRelay = async (relay3, relay4) => {
    setLoading(true);
    try {
      publishRelay(relay3, relay4);
      // Beri waktu sebentar agar perintah terkirim
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow">
      <h3 className="text-lg font-semibold mb-3">Kontrol Relay</h3>
      <p className="text-sm mb-2">Status: <strong>{status}</strong></p>
      <div className="flex gap-4">
        <div>
          <span className="block text-sm mb-1">Relay 3</span>
          <button onClick={() => handleRelay(true, false)} className="bg-red-500 text-white px-3 py-1 rounded mr-2 hover:bg-red-600">ON</button>
          <button onClick={() => handleRelay(false, false)} className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400">OFF</button>
        </div>
        <div>
          <span className="block text-sm mb-1">Relay 4</span>
          <button onClick={() => handleRelay(false, true)} className="bg-red-500 text-white px-3 py-1 rounded mr-2 hover:bg-red-600">ON</button>
          <button onClick={() => handleRelay(false, false)} className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400">OFF</button>
        </div>
      </div>
      {loading && <p className="text-xs mt-2 text-gray-400">Mengirim perintah...</p>}
    </div>
  );
}
