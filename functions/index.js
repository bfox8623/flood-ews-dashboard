const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mqtt = require("mqtt");

admin.initializeApp();
const db = admin.firestore();

// Baca kredensial dari environment variable (file .env)
const mqttBrokerUrl = process.env.HIVEMQ_URL;
const mqttOptions = {
  username: process.env.HIVEMQ_USERNAME,
  password: process.env.HIVEMQ_PASSWORD,
  port: 8883,
  protocol: "mqtts",
};

let client;

function connectMQTT() {
  if (!client || client.connected === false) {
    client = mqtt.connect(mqttBrokerUrl, mqttOptions);
    client.on("connect", () => {
      console.log("MQTT connected");
      client.subscribe("ews/sensor");
    });
    client.on("message", (topic, message) => {
      if (topic === "ews/sensor") {
        handleSensorData(JSON.parse(message.toString()));
      }
    });
  }
}

async function handleSensorData(data) {
  const { water_level, timestamp } = data;
  const now = timestamp ? new Date(timestamp * 1000) : new Date();

  await db.collection("realtime").doc("current").set({
    water_level: water_level,
    timestamp: admin.firestore.Timestamp.fromDate(now),
  });

  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  if (minutes % 15 === 0 && seconds < 10) {
    await db.collection("history").add({
      water_level: water_level,
      timestamp: admin.firestore.Timestamp.fromDate(now),
    });
  }
}

exports.relayControl = functions.firestore.document("commands/relay")
  .onWrite(async (change, context) => {
    connectMQTT();
    const data = change.after.data();
    if (!data) return;

    const message = {
      relay3: data.relay3 || false,
      relay4: data.relay4 || false,
    };
    client.publish("ews/relay", JSON.stringify(message));
    console.log("Published relay command:", message);
  });

exports.manualUpdate = functions.https.onRequest((req, res) => {
  connectMQTT();
  res.send("MQTT bridge active");
});
