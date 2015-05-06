'use strict';

var stringToStream = require('string-to-stream');
var Whook = require('../whook');

class TimeHook extends Whook {
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
          status: {
            type: 'number',
            required: true,
            destination: 'status',
          },
          contentType: {
            type: 'string',
            required: true,
            destination: 'headers:Content-Type',
          }
        }
      },
      services: {
        log: ''
      }
    };
  }
  init() {}
  // Logic applyed to response/request abstract data before sending response content
  pre({out}, next) {
    out.contentType = 'text/plain';
    next();
  }
  // Logic applyed to response/request abstract data before sending response content
  process({in: {format}, services: {time}}) {
    var curTime = time();
    return stringToStream(
      (new Date(time()))['iso' === format ? 'toISOString' : 'getTime']()
    );
  }
}

module.exports = TimeHook;
