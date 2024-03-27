// Arquivo: client.js
const Proxy = require('./proxy');

const proxy = new Proxy();

// Subscrever em um tópico
// Necessário antes de checar mensagens
proxy.subscribe('water-level', (data) => {
  console.log('Received response:', data.toString());
});

// Teste publicando ou checando uma mensagem para o servidor a cada 3 segundos
setInterval(() => {

  const message = {
    'distance': 1,
    'battery' : 2,
    'timer': 3
  }

  // Publicar mensagens
  // console.log('Sending message:', message);
  // proxy.publish('water-level', message);

  // Checar mensagens
  console.log('Checking message:');
  proxy.checkMessage('water-level').then(result => {
    console.log(result);
});

}, 3000);
