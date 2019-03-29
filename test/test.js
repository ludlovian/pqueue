import test from 'ava'
import PQueue from '../src'
import Trigger from 'trigger'

const isResolved = (p, ms = 10) =>
  new Promise(resolve => {
    p.then(() => resolve(true))
    setTimeout(() => resolve(false), ms)
  })

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

test('queue - basic operation', async t => {
  const q = new PQueue()

  t.true(await isResolved(q.idle))
  t.is(q.pending, 0)
  t.is(q.running, 0)

  const t1 = new Trigger()
  const p1 = q.push(() => t1)
  t.false(await isResolved(p1))
  t.false(await isResolved(q.idle))
  t.true(await isResolved(q.busy))
  t.is(q.pending, 0)
  t.is(q.running, 1)

  const t2 = new Trigger()
  const p2 = q.push(() => t2)
  t.is(q.pending, 1)
  t.is(q.running, 1)

  t1.fire(17)
  t.is(await p1, 17)
  t.true(await isResolved(p1))
  t.false(await isResolved(q.idle))
  t.true(await isResolved(q.busy))
  t.is(q.pending, 0)
  t.is(q.running, 1)

  t2.fire(9)
  t.is(await p2, 9)
  t.true(await isResolved(q.idle))
  t.false(await isResolved(q.busy))
})

test('queue - with concurrency', async t => {
  const q = new PQueue(2)

  const t1 = new Trigger()
  const t2 = new Trigger()
  const t3 = new Trigger()

  const p1 = q.push(() => t1)
  const p2 = q.push(() => t2)
  const p3 = q.push(() => t3)

  await delay(20)

  t.is(q.running, 2)
  t.is(q.pending, 1)
  t.false(await isResolved(q.idle))
  t.true(await isResolved(q.busy))

  t2.fire(2)
  t.is(await p2, 2)
  t.is(q.running, 2)
  t.is(q.pending, 0)
  t.false(await isResolved(q.idle))
  t.true(await isResolved(q.busy))

  t3.fire(3)
  t.is(await p3, 3)
  t.is(q.running, 1)
  t.is(q.pending, 0)
  t.false(await isResolved(q.idle))
  t.true(await isResolved(q.busy))

  t1.fire(1)
  t.is(await p1, 1)
  t.is(q.running, 0)
  t.is(q.pending, 0)
  t.true(await isResolved(q.idle))
  t.false(await isResolved(q.busy))
})

test('jobs that reject', async t => {
  const q = new PQueue()
  const t1 = new Trigger()
  const p1 = q.push(() => t1)

  await delay(10)
  t.is(q.running, 1)

  const err = new Error('oops')

  p1.then(() => t.fail(), e => t.is(e, err))
  t1.cancel(err)

  t.true(await isResolved(q.idle))
  t.false(await isResolved(q.busy))
})

test('jobs that throw', async t => {
  const q = new PQueue()
  const err = new Error('oops')
  const f1 = () => {
    throw err
  }
  const p1 = q.push(f1)
  p1.then(() => t.fail(), e => t.is(e, err))
  t.true(await isResolved(q.idle))
  t.false(await isResolved(q.busy))
})
