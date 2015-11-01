import Whook from '../whook';
import debug from 'debug';

let log = debug('whook.whooks.echo');

export default class EchoHook extends Whook {
  static specs({ statusCode = 200 } = {}) {
    return {
      methods: ['POST'],
      nodes: ['echo'],
      in: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        title: 'EchoHook input specs',
        type: 'object',
        properties: {
          contentType: {
            source: 'headers:Content-Type',
            type: 'string',
            description: 'The type of the content to echo.',
            enum: ['text/plain', 'application/octet-stream'],
          },
          contentLength: {
            source: 'headers:Content-Length',
            type: 'number',
            description: 'The length of the content to echo.',
          },
        },
      },
      out: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        title: 'EchoHook output specs',
        type: 'object',
        properties: {
          statusCode: {
            type: 'number',
            required: true,
            destination: 'status',
            enum: [statusCode],
          },
          contentType: {
            type: 'string',
            destination: 'headers:Content-Type',
            enum: ['text/plain', 'application/octet-stream'],
          },
          contentLength: {
            type: 'number',
            destination: 'headers:Content-Length',
          },
        },
      },
      services: {
        temp: '',
      },
    };
  }
  init(specs) {
    this._statusCode = specs.out.properties.statusCode.enum[0];
  }
  ackInput({ in: { contentType, contentLength }, out: out, services: { temp } },
    inputStream, next) {
    out.statusCode = this._statusCode;
    out.contentType = contentType;
    out.contentLength = contentLength;
    temp.set('content', inputStream);
    next();
  }
  ackInputError({ in: { contentType, contentLength }, out: out }, err) {
    if('E_BAD_INPUT' === err.code) {
      out.statusCode = 400;
      return;
    }
    throw err;
  }
  processOutput({ out, services: { temp } }, outputStream, next) {
    if(this._statusCode !== out.statusCode) {
      log(
        'Unexpected status, leaving the output stream as is.',
        this._statusCode,
        out.statusCode
      );
      return next(null, outputStream);
    }
    temp.get('content')
      .once('error', next)
      .pipe(outputStream)
      .once('end', next)
      .once('error', next);
  }
}
