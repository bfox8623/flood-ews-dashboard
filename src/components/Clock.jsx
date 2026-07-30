import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-right">
      <div className="text-2xl font-mono font-bold text-gray-700">
        {format(now, "HH:mm:ss")}
      </div>
      <div className="text-xs text-gray-500">
        {format(now, "EEEE, dd MMMM yyyy", { locale: id })}
      </div>
    </div>
  );
}
