export default class Whook {
    static specs() {
      throw new Error('E_NOT_IMPLEMENTED');
    }
    constructor(name) {
      this.name = name;
    }
    init() {}
    pre() {
    }
    preError() {
    }
    process($, inputStream) {
      return inputStream;
    }
    piped() {
    }
    post() {
    }
    postError() {
    }
}
