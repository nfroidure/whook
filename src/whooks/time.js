import Whook from '../whook';
import debug from 'debug';

let log = debug('whook.whooks.time');

export default class TimeHook extends Whook {
  static specs() {
    return {
      methods: ['GET'], // Apply to GET requests only
      nodes: ['time'], // Hook will be mounted to /time API endpoint
      in: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        title: 'TimeHook input specs',
        type: 'object',
        properties: {
          format: {
            source: 'qs:format', // value will be picked in query parameters (?format)
            type: 'string',
            default: 'timestamp',
            enum: ['timestamp', 'iso'],
            description: 'The output format of the provided time.',
          },
        },
      },
      out: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        title: 'TimeHook output specs',
        type: 'object',
        properties: {
          statusCode: {
            type: 'number',
            required: true,
            destination: 'status',
            enum: [200],
          },
          contentType: {
            type: 'string',
            required: true,
            destination: 'headers:Content-Type',
            enum: ['text/plain'],
          },
          contentLength: {
            type: 'number',
            required: true,
            destination: 'headers:Content-Length',
          },
        },
      },
      services: {
        time: '',
        temp: '',
      },
    };
  }
  init() {}
  ackInput({ in: { format }, out, services: { time, temp } }) {
    let timeValue = (new Date(time.now()))[
      'iso' === format ?
      'toISOString' : 'getTime'
    ]().toString();

    log('Got the time:', timeValue);
    out.statusCode = 200;
    out.contentType = 'text/plain';
    out.contentLength = timeValue.length;
    temp.set('time', timeValue);
  }
  processOutput({ in: { format }, out, services: { temp } }, outStream) {
    outStream.write(temp.get('time'));
    outStream.end();
  }
}
