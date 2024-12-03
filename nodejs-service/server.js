const express = require('express');
const mqtt = require('mqtt');
const os = require('os');
const app = express()
const port = 80
const mqttBroker = process.env.MQTT_BROKER || 'localhost';
const mqttPort = process.env.MQTT_PORT || 1883;
const publish_topic = 'upb/control'
code_list = new Set(); // Set evita duplicados

const client = mqtt.connect(`mqtt://${mqttBroker}:${mqttPort}`); //Server MQTT

app.use(express.json());

// Connection to Broker MQTT
client.on('connect', () => {
    console.log('Connected to the broker');
    client.subscribe('upb/data/#', (err) => {
        if (!err) {
            console.log('Subscribed to topic upb/data/#');
        }
    });
});

client.on('message', (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        if (data.esp32) {
            if (!code_list.has(data.esp32)) {
                code_list.add(data.esp32);
                console.log(`New ESP32 ID received: ${data.esp32} and added to the list`);
            } else {
                console.log(`Known ID: ${data.esp32} had sent a message`);
            }
        } else {
            console.warn(`Message received without ESP32 ID: ${message.toString()}`);
        }
        console.log(`Received message: ${JSON.stringify(data)} on topic: ${topic}`);
    } catch (err) {
        console.error('Error parsing JSON message:', err.message);
    }
});

// Endpoint: POST with HTTP request
app.post('/control', (req, res) => {
    const { esp32, new_delay } = req.body;
    if (typeof new_delay !== 'number') {
        return res.status(400).json({ error: 'new_delay debe ser un número' });
    }

    if (esp32 === "") {
        // Send mssg to all esp32 in code_list
        const errors = [];
        for (const id of code_list) {
            const message = JSON.stringify({ esp32: id, new_delay });
            client.publish(publish_topic, message, (err) => {
                if (err) {
                    console.error(`Failed to publish to ${id}: ${err}`);
                    errors.push(id);
                } else {
                    console.log(`Message sent to ESP32 ${id}: ${message}`);
                }
            });
        }

        // Send answer
        if (errors.length > 0) {
            return res.status(500).json({ message: 'Algunos mensajes fallaron', failed_ids: errors });
        } else {
            return res.status(200).json({ message: 'Mensaje enviado a todos los dispositivos registrados' });
        }
    } else {
        // Send mssg to specific esp32
        const message = JSON.stringify({ esp32, new_delay });
        client.publish(publish_topic, message, (err) => {
            if (err) {
                console.error(`Failed to publish to ${esp32}: ${err}`);
                return res.status(500).json({ error: `Error al publicar al ESP32 ${esp32}` });
            }
            console.log(`Message sent to ESP32 ${esp32}: ${message}`);
            res.status(200).json({ message: 'Mensaje enviado correctamente', esp32, new_delay });
        });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Listening at http://localhost:${port}...`);
});
