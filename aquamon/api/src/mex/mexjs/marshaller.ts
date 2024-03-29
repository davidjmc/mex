import { ClientRequestHandler } from './crh';

export class Marshaller {
  private crh: ClientRequestHandler;

  constructor() {
    this.crh = new ClientRequestHandler();
  }

  async run(invArg) {
    if (invArg['DATA'] === undefined) {
      // complex data
      const invocation = await this.marshaller(invArg);
      const response = await this.crh.run(invocation);
      if (typeof response !== 'object') {
        return false;
      }
      return this.unmarshaller(response);
    } else {
      // bytes
      const invocation = this.unmarshaller(invArg);
      const response = await this.crh.run(invocation);
      if (typeof response !== 'object') {
        return false;
      }
      return this.marshaller(response);
    }
  }

  async marshaller(invArg) {
    function toBytes(data) {
      return Buffer.from(JSON.stringify(data), 'utf-8');
    }

    invArg = Object.fromEntries(
      Object.entries(invArg).map(([k, v]) => [k, toBytes(v)]),
    );

    const { OP, THING_ID, TOPICS, MSG } = invArg;

    // console.log("Aqui", invArg)

    // const op = invArg['OP']
    // const thing_id = invArg['THING_ID']
    // const topics = invArg['TOPICS']
    // const msg = invArg['MSG']

    const serialized = Buffer.concat([
      Buffer.from('OP:' + OP + '\n', 'utf-8'),
      Buffer.from('THING_ID:' + THING_ID + '\n', 'utf-8'),
      TOPICS
        ? Buffer.from('TOPICS:' + TOPICS + '\n', 'utf-8')
        : Buffer.from(''),
      Buffer.from('\n', 'utf-8'),
      MSG ? MSG : Buffer.from(''),
    ]);

    // let serialized = Buffer.concat([
    //     Buffer.from(`OP:${op}\n`, 'utf-8'),
    //     Buffer.from(`THING_ID:${thing_id}\n`, 'utf-8'),
    //     topics !== undefined ? Buffer.from(`TOPICS:${topics}\n`, 'utf-8') : Buffer.from(''),
    //     Buffer.from('\n', 'utf-8'),
    //     msg !== undefined ? msg : Buffer.from('')
    // ]);

    const invocation = {
      DATA: serialized,
    };
    return invocation;
  }

  async unmarshaller(invArg) {
    function fromBytes(data) {
      if (data === null || data.equals(Buffer.from(''))) {
        return data;
      }
      return data.toString('utf-8');
    }

    const data = invArg['DATA'];

    const attrs = {
      OP: null,
      TOPICS: null,
      THING_ID: null,
      MSG: null,
    };

    let attr = Buffer.from('');
    let val = Buffer.from('');
    let byte = 0;
    while (byte < data?.length) {
      const c = data[byte];
      if (c !== 58) {
        // ':'
        attr = Buffer.concat([attr, Buffer.from([c])]);
        byte += 1;
        continue;
      }

      byte += 1;
      let cByte = data[byte];
      while (cByte !== 10) {
        // '\n'
        val = Buffer.concat([val, Buffer.from([cByte])]);
        byte += 1;
        cByte = data[byte];
      }
      // end of header line
      attrs[attr.toString()] = val;
      attr = Buffer.from('');
      val = Buffer.from('');
      byte += 1;
      if (data[byte] === 10) {
        // '\n', i.e., it is the end of the header
        break;
      }
    }

    let message = Buffer.from('');
    byte += 1;
    while (byte < data?.length) {
      message = Buffer.concat([message, Buffer.from([data[byte]])]);
      byte += 1;
    }

    attrs['MSG'] = message;

    return {
      OP: attrs['OP']?.toString('utf-8'),
      TOPICS: attrs['TOPICS']?.toString('utf-8'),
      THING_ID: attrs['THING_ID']?.toString('utf-8'),
      MSG: attrs['MSG']?.toString('utf-8'),
    };
  }

  // unmarshaller(invArg) {
  //     function fromBytes(data) {
  //         if (!data || data.equals(Buffer.from(''))) {
  //             return data;
  //         }

  //         return data;
  //     }

  //     const data = invArg['DATA'].toString('utf-8');

  //     const attrs = {
  //         'OP': null,
  //         'TOPICS': null,
  //         'THING_ID': null,
  //         'MSG': null,
  //     };

  //     let byte = 0;
  //     let attr = Buffer.from('');
  //     let val = Buffer.from('');
  //     while (byte < data.length) {
  //         const c = data[byte];
  //         if (c !== 58) { // ':'
  //             attr = Buffer.concat([attr, Buffer.from([c])]);
  //             byte += 1;
  //             continue;
  //         }

  //         byte += 1;
  //         let cByte = data[byte];
  //         while (cByte !== 10) { // '\n'
  //             val = Buffer.concat([val, Buffer.from([cByte])]);
  //             byte += 1;
  //             cByte = data[byte];
  //         }
  //         // end of header line
  //         attrs[attr.toString()] = val;
  //         attr = Buffer.from('');
  //         val = Buffer.from('');
  //         byte += 1;
  //         if (data[byte] === 10) { // '\n', i.e., it is the end of the header
  //             break;
  //         }
  //     }

  //     let message = Buffer.from('');
  //     byte += 1;
  //     while (byte < data.length) {
  //         message = Buffer.concat([message, Buffer.from([data[byte]])]);
  //         byte += 1;
  //     }

  //     attrs['MSG'] = message;

  //     console.log('unmarshaller-data = ', attrs);

  //     return {
  //         'OP': fromBytes(attrs['OP']),
  //         'TOPICS': fromBytes(attrs['TOPICS']),
  //         'THING_ID': fromBytes(attrs['THING_ID']),
  //         'MSG': fromBytes(attrs['MSG'])
  //     };
  // }

  // unmarshaller(invArg) {
  //     const data = invArg['DATA'].toString('utf-8');
  //     const lines = data.split('\n');

  //     console.log(data);
  //     const attrs = {};

  //     lines.forEach(line => {
  //         const [key, value] = line.split(':');
  //         attrs[key] = value ? value.trim() : '';
  //     });

  //     console.log(attrs)

  //     return {
  //         'OP': attrs['OP'],
  //         'TOPICS': attrs['TOPICS'],
  //         'THING_ID': attrs['THING_ID'],
  //         'MSG': attrs['MSG']
  //     };
  // }
}
