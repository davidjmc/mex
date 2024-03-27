const Marshaller = require('./marshaller');

class QueueProxy {
  constructor() {
    this.marshaller = new Marshaller();
    this.messageCallback = null;
  }

  async publish(topic, message) {
    var topics = [topic]

    const invocation = {
      'OP': 'Publish',
      'TOPICS': topics,
      'MSG': message,
      'THING_ID': '1'
    };

    return await this.marshaller.run(invocation);
  }

  async subscribe(topic) {
    var topics = [topic]
    
    const invocation = {
        'OP': 'Subscribe',
        'TOPICS': topics,
        'THING_ID': '1'
      };
    
    return await this.marshaller.run(invocation)
  }

  async checkMessage(topic) {
    var topics = [topic]

    const invocation = {
        'OP': 'CheckMsg',
        'TOPICS': topics,
        'THING_ID': '1'
    };
    
    return await this.marshaller.run(invocation);
  }
}

module.exports = QueueProxy;
