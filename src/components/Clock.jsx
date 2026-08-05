import { useState, useEffect } from 'react';

export default function Clock() {
  const [now, setNow] = useState(new Date());

  // Update setiap detik
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta',
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
  };

  return (
    <div className="clock-container">
      <div className="clock-time">
        {formatTime(now)}
        <span className="clock-timezone"> WIB</span>
      </div>
      <div className="clock-date">{formatDate(now)}</div>
      <div className="clock-source">
        <span className="dot-green">●</span> Web Time
      </div>
    </div>
  );
}
