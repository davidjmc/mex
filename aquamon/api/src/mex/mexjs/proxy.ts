import { Marshaller } from './marshaller';

export class QueueProxy {
  private marshaller: Marshaller;

  constructor() {
    this.marshaller = new Marshaller();
  }

  async publish(topic, message) {
    const topics = [topic];

    const invocation = {
      OP: 'Publish',
      TOPICS: topics,
      MSG: message,
      THING_ID: '1',
    };

    return await this.marshaller.run(invocation);
  }

  async subscribe(topic) {
    const topics = [topic];

    const invocation = {
      OP: 'Subscribe',
      TOPICS: topics,
      THING_ID: '1',
    };

    return await this.marshaller.run(invocation);
  }

  async checkMessage(topic) {
    const topics = [topic];

    const invocation = {
      OP: 'CheckMsg',
      TOPICS: topics,
      THING_ID: '1',
    };

    return await this.marshaller.run(invocation);
  }
}
