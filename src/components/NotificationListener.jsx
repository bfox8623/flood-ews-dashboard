import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useData } from "../context/DataContext";

export default function NotificationListener() {
  const { current, getStatus } = useData();
  const prevStatus = useRef(null);

  useEffect(() => {
    if (!current) return;
    const status = getStatus(current.water_level);
    if (prevStatus.current && status.level > prevStatus.current.level) {
      toast(`Status meningkat ke ${status.label}!`, {
        icon: "⚠️",
        duration: 5000,
        style: { background: "#1e293b", color: "#fff" },
      });
    }
    prevStatus.current = status;
  }, [current, getStatus]);

  return null;
}
