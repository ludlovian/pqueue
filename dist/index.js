'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var PLock = _interopDefault(require('plock'));
var PSwitch = _interopDefault(require('pswitch'));

class PQueue {
  constructor (width = 1) {
    this._lock = new PLock(width);
    this._busy = new PSwitch(false);
    this.pending = 0;
  }
  async push (fn) {
    this.pending++;
    this._busy.set(true);
    await this._lock.lock();
    this.pending--;
    try {
      return await Promise.resolve(fn())
    } finally {
      this._lock.release();
      if (this.running === 0 && this.pending === 0) this._busy.set(false);
    }
  }
  get idle () {
    return this._busy.when(false)
  }
  get busy () {
    return this._busy.when(true)
  }
  get running () {
    return this._lock.locks
  }
}

module.exports = PQueue;
