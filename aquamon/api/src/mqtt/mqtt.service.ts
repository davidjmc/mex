import { Injectable } from '@nestjs/common';
import * as mqtt from 'mqtt';
// import * as fs from 'fs';

@Injectable()
export class MqttService {
  private client: mqtt.Client;

  constructor() {
    this.client = mqtt.connect('mqtt://broker.hivemq.com:1883');

    // this.client = mqtt.connect('broker.hivemq.com', {
    //   protocol: 'mqtt', // Indica que a conexão deve usar TLS
    //   // ca: [fs.readFileSync('src/mqtt/cert.pem')], // Caminho para o certificado de autoridade (CA) do broker MQTT
    //   rejectUnauthorized: true, // Rejeita conexões com certificados inválidos (opcional)
    //   username: 'your_mqtt_client_username',
    //   password: 'your_mqtt_client_password',
    // });

    this.client.on('connect', () => {
      console.log('Conectado ao broker MQTT');
    });
  }

  subscribe(topic: string, callback: (message: string) => void) {
    this.client.subscribe(topic);
    this.client.on('message', (t, message) => {
      if (t === topic) {
        console.log(
          `Mensagem recebida no tópico ${topic}: ${message.toString()}`,
        );
        callback(message.toString());
      }
    });
  }

  unsubscribe(topic: string) {
    this.client.unsubscribe(topic);
  }
}
