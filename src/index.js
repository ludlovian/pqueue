'use strict'

import trigger from 'trigger'

export default function pqueue (width = 1) {
  const q = []
  let running = 0
  let _idle = trigger()
  _idle.fire()

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
    }
  }

  function push (fn) {
    return new Promise((resolve, reject) => {
      q.push(() => {
        if (running++ === 0) _idle = trigger()
        try {
          Promise.resolve(fn()).then(
            value => {
              resolve(value)
              done()
            },
            reason => {
              reject(reason)
              done()
            }
          )
        } catch (reason) {
          reject(reason)
          done()
        }
      })
      startOne()
    })
  }

  function done () {
    running--
    startOne()
  }

  function startOne () {
    if (running >= width) return
    if (!q.length && !running) _idle.fire()
    if (q.length) q.shift()()
  }
}
