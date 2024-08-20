const { Mutex } = require("async-mutex");

class GlobalMutex {
  constructor() {
    if (GlobalMutex.instance) {
      return GlobalMutex.instance;
    }
    this.mutex = new Mutex();
    GlobalMutex.instance = this;
  }

  static getInstance() {
    if (!GlobalMutex.instance) {
      new GlobalMutex();
    }
    return GlobalMutex.instance;
  }
}

module.exports = GlobalMutex;
