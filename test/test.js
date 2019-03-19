import test from 'ava'
import pqueue from '../src'
import trigger from 'trigger'

const isResolved = (p, ms = 10) =>
  new Promise(resolve => {
    p.then(() => resolve(true))
    setTimeout(() => resolve(false), ms)
  })

test('queue - basic operation', async t => {
  const q = pqueue()

  t.true(await isResolved(q.idle))
  t.is(q.pending, 0)
  t.is(q.running, 0)

  const t1 = trigger()
  const p1 = q.push(() => t1)
  t.false(await isResolved(p1))
  t.false(await isResolved(q.idle))
  t.is(q.pending, 0)
  t.is(q.running, 1)

  const t2 = trigger()
  const p2 = q.push(() => t2)
  t.is(q.pending, 1)
  t.is(q.running, 1)

  t1.fire(17)
  t.is(await p1, 17)
  t.true(await isResolved(p1))
  t.false(await isResolved(q.idle))
  t.is(q.pending, 0)
  t.is(q.running, 1)

  t2.fire(9)
  t.is(await p2, 9)
  t.true(await isResolved(q.idle))
})

test('queue - with concurrency', async t => {
  const q = pqueue(2)

  const t1 = trigger()
  const t2 = trigger()
  const t3 = trigger()

  const p1 = q.push(() => t1)
  const p2 = q.push(() => t2)
  const p3 = q.push(() => t3)

  t.is(q.running, 2)
  t.is(q.pending, 1)
  t.false(await isResolved(q.idle))

  t2.fire(2)
  t.is(await p2, 2)
  t.is(q.running, 2)
  t.is(q.pending, 0)
  t.false(await isResolved(q.idle))

  t3.fire(3)
  t.is(await p3, 3)
  t.is(q.running, 1)
  t.is(q.pending, 0)
  t.false(await isResolved(q.idle))

  t1.fire(1)
  t.is(await p1, 1)
  t.is(q.running, 0)
  t.is(q.pending, 0)
  t.true(await isResolved(q.idle))
})

test('jobs that reject', async t => {
  const q = pqueue()
  const t1 = trigger()
  const p1 = q.push(() => t1)

  t.is(q.running, 1)

  const err = new Error('oops')

  p1.then(() => t.fail(), e => t.is(e, err))
  t1.cancel(err)

  t.true(await isResolved(q.idle))
})

test('jobs that throw', async t => {
  const q = pqueue()
  const err = new Error('oops')
  const f1 = () => { throw err }
  const p1 = q.push(f1)
  p1.then(() => t.fail(), e => t.is(e, err))
  t.true(await isResolved(q.idle))
})
