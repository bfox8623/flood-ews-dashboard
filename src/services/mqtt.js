import Paho from 'paho-mqtt';

const brokerUrl = 'd6e43354d203418ab452c2ef94e9ed66.s1.eu.hivemq.cloud';
const port = 8884; // WebSocket port
const clientId = 'dashboard_' + Math.random().toString(16).substr(2, 8);

const options = {
  userName: 'dashboard',
  password: '12345678',
  useSSL: true,
  onSuccess: () => {
    console.log('MQTT (dashboard) connected');
  },
  onFailure: (err) => {
    console.error('MQTT connection failed:', err.errorMessage);
  },
};

let client = null;

export function connectMQTT() {
  if (client && client.isConnected()) return client;

  client = new Paho.Client(brokerUrl, port, clientId);
  client.onConnectionLost = (responseObject) => {
    console.warn('MQTT connection lost:', responseObject.errorMessage);
  };

  client.connect({
    ...options,
    onSuccess: options.onSuccess,
    onFailure: options.onFailure,
  });

  return client;
}

export function publishRelay(relay3, relay4) {
  const mqttClient = connectMQTT();
  const payload = JSON.stringify({ relay3, relay4 });
  const message = new Paho.Message(payload);
  message.destinationName = 'ews/relay';
  message.qos = 0;

  // Pastikan client terhubung sebelum publish
  if (mqttClient.isConnected()) {
    mqttClient.send(message);
    console.log('Published to MQTT:', payload);
  } else {
    // Tunggu hingga connect lalu kirim
    mqttClient.connect({
      ...options,
      onSuccess: () => {
        mqttClient.send(message);
        console.log('Published to MQTT (after connect):', payload);
      },
      onFailure: options.onFailure,
    });
  }
}
