import PLock from 'plock';
import PSwitch from 'pswitch';

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
    return this._busy.whenOff
  }
  get busy () {
    return this._busy.whenOn
  }
  get running () {
    return this._lock.locks
  }
}

export default PQueue;
