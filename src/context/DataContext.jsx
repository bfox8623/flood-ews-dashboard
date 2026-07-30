import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, collection, query, orderBy, limit, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { getStatus } from "../utils/thresholds";

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [thresholds, setThresholds] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch thresholds sekali
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "settings", "thresholds"));
      if (snap.exists()) {
        setThresholds(snap.data());
        console.log("Thresholds loaded:", snap.data());
      } else {
        console.warn("Thresholds document not found!");
      }
    })();
  }, []);

  // Realtime current
  useEffect(() => {
    console.log("Listening to realtime/current...");
    const unsub = onSnapshot(doc(db, "realtime", "current"), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        console.log("Current data:", data);
        setCurrent(data);
      } else {
        console.warn("Document realtime/current does not exist!");
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to realtime/current:", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // History (last 100)
  useEffect(() => {
    const q = query(collection(db, "history"), orderBy("timestamp", "desc"), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      const hist = [];
      snapshot.forEach((d) => hist.push({ id: d.id, ...d.data() }));
      hist.reverse(); // chronological
      console.log("History data count:", hist.length);
      setHistory(hist);
    });
    return () => unsub();
  }, []);

  const getStatusFn = useCallback((level) => getStatus(level, thresholds), [thresholds]);

  return (
    <DataContext.Provider value={{ current, history, thresholds, loading, getStatus: getStatusFn }}>
      {children}
    </DataContext.Provider>
  );
};
