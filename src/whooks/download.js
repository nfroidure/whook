'use strict';

import Whook from '../whook';

export default class DownloadWhook extends Whook {
  static specs() {
    return {
      nodes: [],
      methods: ['GET'],
      in: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        title: 'Input',
        type: 'object',
        properties: {
          download: {
            source: 'qs:download',
            type: 'boolean',
            default: false,
            description: 'Whether the download header should be added or not.'
          },
          filename: {
            source: 'qs:filename',
            type: 'string',
            default: '',
            description: 'The filename under wich the download should be saved.'
          }
        }
      },
      out: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        title: 'Output',
        type: 'object',
        properties: {
          contentDisposition: {
            destination: 'headers:Content-Disposition',
            type: 'string'
          }
        }
      },
      services: {
        log: ''
      }
    };
  }
  constructor() {
    super('download');
  }
  init() {}
  pre({in: {download, filename}, out, services: {log}}, next) {
    if(download) {
      out.contentDisposition = 'attachment' +
        (filename ? '; filename="' + filename + '"' : '');
      log && log(this.name, 'out.contentDisposition set to:', out.contentDisposition);
    }
    next();
  }
}
