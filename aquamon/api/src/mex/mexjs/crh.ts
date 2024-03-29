import * as net from 'net';

export class ClientRequestHandler {
  async run(invData: { [key: string]: any }): Promise<any> {
    const data: string = invData['DATA'];
    const host = '192.168.18.220';
    const port = 60000;

    const socket = new net.Socket();

    try {
      await new Promise<void>((resolve, reject) => {
        socket.connect(port, host, () => {
          resolve();
        });
        socket.on('error', (error) => {
          reject(error);
        });
      });
    } catch (e) {
      console.error('Error: ' + e + " Couldn't connect with socket-server");
      socket.destroy();
      return false;
    }

    await this.send(socket, data);
    const responseReceive = await this.receive(socket);
    socket.destroy();
    return { responseReceive };
  }

  private async send(socket: net.Socket, data: string): Promise<boolean> {
    try {
      const l = Buffer.from(('0'.repeat(10) + data.length).slice(-10), 'ascii');
      socket.write(l);
      socket.write(data);
      return true;
    } catch (e) {
      console.error('Error: ' + e + " Couldn't send data in CRH");
      socket.destroy();
      return false;
    }
  }

  private async receive(
    socket: net.Socket,
  ): Promise<boolean | { DATA: Buffer }> {
    const buffer_size = 536;
    let response = Buffer.alloc(0);
    try {
      for await (const chunk of socket) {
        response = Buffer.concat([response, chunk]);
        if (chunk.length < buffer_size) {
          break;
        }
      }
      if (response.equals(Buffer.from('0'))) {
        return true;
      } else if (response.length === 0) {
        return false;
      }
    } catch (e) {
      console.error('Error: ' + e + " Couldn't receive data in CRH");
      return false;
    }
    return { DATA: response };
  }
}
