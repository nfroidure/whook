'use strict';

import Stream from 'stream';
import Whook from '../whook';

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
            description: 'The output format of the provided time.'
          }
        }
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
            enum: [200]
          },
          contentType: {
            type: 'string',
            required: true,
            destination: 'headers:Content-Type',
            enum: ['text/plain']
          },
          contentLength: {
            type: 'number',
            required: true,
            destination: 'headers:Content-Length'
          }
        }
      },
      services: {
        log: '',
        time: ''
      }
    };
  }
  init() {}
  // Logic applyed to response/request abstract data before sending response content
  pre({out}, next) {
    out.statusCode = 200;
    out.contentType = 'text/plain';
    next();
  }
  // Logic applyed to response/request abstract data when sending response content
  process({in: {format}, out: out, services: {time}}, inStream) {
      let curTime = (new Date(time.now()))[
        'iso' === format ?
        'toISOString' : 'getTime'
      ]().toString();
    let outStream = new Stream.PassThrough();
    out.contentLength = curTime.length;
    inStream.on('data', function(chunk) {
        outStream.emit('error', new YError('E_UNEXPECTED_CONTENT'));
    });
    inStream.on('end', () => {
      outStream.write(curTime);
      outStream.end();
    });
    return outStream;
  }
}
