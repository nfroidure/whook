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
            description: 'Whether the download header should be added.',
            type: 'boolean',
            default: false,
          },
          filename: {
            source: 'qs:filename',
            description: 'The filename under which the download should be saved.',
            type: 'string',
            default: '',
          },
        },
      },
      out: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        title: 'Output',
        type: 'object',
        properties: {
          contentDisposition: {
            destination: 'headers:Content-Disposition',
            type: 'string',
          },
        },
      },
      services: {
        log: '',
      },
    };
  }
  constructor() {
    super('download');
  }
  init() {}
  ackInput({ in: { download, filename }, out, services: { log } }, inputStream) {
    if(download) {
      out.contentDisposition = 'attachment' +
        (filename ? '; filename="' + filename + '"' : '');
      if(log) {
        log(this.name, 'out.contentDisposition set to:', out.contentDisposition);
      }
    }
  }
}
