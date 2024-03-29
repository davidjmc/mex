// socket.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';

@Injectable()
export class SocketService {
  private socket: net.Socket;
  private readonly logger = new Logger(SocketService.name);

  constructor() {
    this.socket = new net.Socket();
    // Configure o socket conforme necessário, como conectar a um host e porta específicos
    this.socket.connect(60000, '192.168.0.7', () => {
      console.log('Conexão estabelecida com o servidor!');
    });

    // Lida com os dados recebidos do servidor
    this.socket.on('data', (data) => {
      const receivedMessage = data.toString();
      this.logger.log(`Mensagem recebida do servidor: ${receivedMessage}`);
      // Você pode emitir um evento ou manipular os dados recebidos aqui
    });

    // Lida com o encerramento da conexão
    this.socket.on('close', () => {
      console.log('Conexão com o servidor encerrada');
    });
  }
}
