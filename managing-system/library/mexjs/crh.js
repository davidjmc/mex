const net = require('net');

class ClientRequestHandler {
    constructor() {}

    async run(invData) {
        const data = invData['DATA']
        // console.log(invData);
        // const data = JSON.stringify(invData);
        //const data = invData['DATA'];
        const host = '172.22.64.223';
        let port = 0;

        if (isNaN(port) || port === 0) {
            port = 60000;
        }

        const socket = new net.Socket();

        try {
            await socket.connect(port, host);
            // if (parseInt(process.env.await_broker_response) === 1) {
            //     socket.setBlocking(true);
            // } else {
            //     socket.setBlocking(false);
            // }
        } catch (e) {
            console.error('Error: ' + e + ' Couldn\'t connect with socket-server');
            return false;
        }

        await this.send(socket, data);
        const response = await this.receive(socket);
        socket.destroy();
        return response;
    }

    async send(socket, data) {
        try {
            const l = Buffer.from(('0'.repeat(10) + data.length).slice(-10), 'ascii');
            socket.write(l);
            socket.write(data);
        } catch (e) {
            console.error('Error: ' + e + ' Couldn\'t send data in CRH');
            socket.destroy();
            return false;
        }
    }

    async receive(socket) {
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
            console.error('Error: ' + e + ' Couldn\'t receive data in CRH');
            return false;
        }
        return { DATA: response };
    }
}

module.exports = ClientRequestHandler;