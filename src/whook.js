'use strict';

export default class Whook {
    static specs() {
      throw new Error('E_NOT_IMPLEMENTED');
    }
    constructor(name) {
      this.name = name;
    }
    init($, next) {
      throw new Error('E_NOT_IMPLEMENTED');
    }
    pre($, next) {
      next();
    }
    preError(err, $, next) {
      next(err);
    }/*
    process($, inputStream) {
      return inputStream;
    }*/
    piped(outputStream) {
    }
    post($, next) {
      next();
    }
    postError(err, $, next) {
      next(err);
    }
}
