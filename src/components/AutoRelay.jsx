// AutoRelay dinonaktifkan sementara – logika auto-relay sudah diintegrasikan di Dashboard
import { useEffect } from 'react';
export default function AutoRelay() {
  useEffect(() => {
    console.log('AutoRelay disabled – integrated in Dashboard');
  }, []);
  return null;
}
