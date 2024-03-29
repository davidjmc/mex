import { Injectable, Logger } from '@nestjs/common';
import { QueueProxy } from './mexjs/proxy';

@Injectable()
export class MexService {
  constructor() {
    console.log('Connecting to mex broker...');
    const proxy = new QueueProxy();

    proxy.subscribe('water-level');

    // Teste checando uma mensagem para o servidor a cada 3 segundos
    setInterval(() => {
      // Checar mensagens
      console.log('Checking message from water-level');
      proxy.checkMessage('water-level').then((result) => {
        Logger.log(result);
      });
    }, 5000);
  }
}
