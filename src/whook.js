/**
 * @module whook/whook
 */
import YError from 'yerror';


export default class Whook {
    static specs() {
      throw new YError('E_NOT_IMPLEMENTED');
    }
    constructor(name) {
      this.name = name;
    }
    init() {}
    ackInput($, inputStream) {
      return inputStream;
    }
    ackInputError() {}
    processOutput($, outputStream) {
      return outputStream;
    }
    processOutputError() {}
}
