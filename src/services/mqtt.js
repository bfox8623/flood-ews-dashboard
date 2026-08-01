import { Client, Message } from 'paho-mqtt';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

let client = null;
let isConnected = false;

const brokerUrl = import.meta.env.VITE_MQTT_BROKER || 'wss://broker.hivemq.com:8884/mqtt';
const username = import.meta.env.VITE_MQTT_USERNAME || '';
const password = import.meta.env.VITE_MQTT_PASSWORD || '';
const clientId = 'web_' + Math.random().toString(16).substring(2, 10);

export const connectMqtt = () => {
  if (client && isConnected) return client;

  try {
    const url = new URL(brokerUrl);
    const host = url.hostname;
    const port = url.port || (url.protocol === 'wss:' ? 8884 : 8080);
    const useSSL = url.protocol === 'wss:';

    client = new Client(host, Number(port), clientId);

    client.onConnectionLost = (responseObject) => {
      isConnected = false;
      console.warn('MQTT connection lost:', responseObject.errorMessage);
    };

    client.onMessageArrived = (message) => {
      console.log('MQTT message arrived:', message.payloadString);
    };

    client.connect({
      onSuccess: () => {
        isConnected = true;
        console.log('✅ MQTT connected to', brokerUrl);
      },
      onFailure: (err) => {
        console.error('❌ MQTT connection failed:', err.errorMessage);
        isConnected = false;
      },
      useSSL,
      userName: username,
      password: password,
      keepAliveInterval: 60,
      cleanSession: true,
    });
  } catch (e) {
    console.error('Error creating MQTT client:', e);
  }

  return client;
};

export const publishAllRelays = async (relay1, relay2, relay3, relay4) => {
  // 1. Kirim via MQTT
  try {
    const c = connectMqtt();
    if (isConnected) {
      const message = new Message(JSON.stringify({ relay1, relay2, relay3, relay4 }));
      message.destinationName = 'ews/relay';
      message.qos = 1;
      c.send(message);
      console.log('📤 Published to MQTT:', { relay1, relay2, relay3, relay4 });
    } else {
      console.warn('⚠️ MQTT not connected, skip publishing');
    }
  } catch (err) {
    console.error('❌ MQTT publish error:', err);
  }

  // 2. Selalu simpan ke Firestore (backup)
  try {
    await setDoc(doc(db, 'commands', 'relay'), {
      relay1,
      relay2,
      relay3,
      relay4,
      updatedAt: new Date().toISOString(),
    });
    console.log('📁 Firestore updated:', { relay1, relay2, relay3, relay4 });
  } catch (err) {
    console.error('❌ Firestore update error:', err);
  }
};

export const publishRelay = (relay3, relay4) => {
  publishAllRelays(false, false, relay3, relay4);
};
