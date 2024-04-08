import { Injectable } from '@nestjs/common';
import { QueueProxy } from './mexjs/proxy';

@Injectable()
export class MexService {
  async subcribe(topic: string, callback: (message: string) => void) {
    console.log('Connecting to mex broker...');
    const proxy = new QueueProxy();
    proxy.subscribe(topic);
    // Teste checando uma mensagem para o servidor a cada 3 segundos
    setInterval(() => {
      // Checar mensagens
      console.log('Checking message from water-level');
      proxy.checkMessage('water-level').then((result) => {
        callback(JSON.stringify(result));
      });
    }, 5000);
  }
}
