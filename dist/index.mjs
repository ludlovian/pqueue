import trigger from 'trigger';

function pqueue (width = 1) {
  const q = [];
  let running = 0;
  let _idle = trigger();
  let _busy = trigger();
  setIdle();
  return {
    push,
    get running () {
      return running
    },
    get pending () {
      return q.length
    },
    get idle () {
      return _idle
    },
    get busy () {
      return _busy
    }
  }
  function push (fn) {
    return new Promise((resolve, reject) => {
      q.push(() => {
        if (running++ === 0) setBusy();
        try {
          Promise.resolve(fn()).then(
            value => {
              resolve(value);
              done();
            },
            reason => {
              reject(reason);
              done();
            }
          );
        } catch (reason) {
          reject(reason);
          done();
        }
      });
      startOne();
    })
  }
  function done () {
    running--;
    startOne();
  }
  function startOne () {
    if (running >= width) return
    if (!q.length && !running) setIdle();
    if (q.length) q.shift()();
  }
  function setIdle () {
    _idle.fire();
    _busy = trigger();
  }
  function setBusy () {
    _busy.fire();
    _idle = trigger();
  }
}

export default pqueue;
