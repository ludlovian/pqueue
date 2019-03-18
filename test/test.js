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
/*
test('queue - map', async t => {

  var result = [];
  var q = PromiseQueue.create({concurrency: 1});

  async function square(x) {
    await delay(10);
    result.push(x*x);
    return x*2;
  }

  var r = q.map([3,4,5], square)

  await r;
  t.deepEqual(result, [9, 16, 25], 'results captured');

});

test('queue with rejecting task', async t => {
  var q, f, e;

  e = new Error("rejected");

  f = () => delay(10);
  q = new PromiseQueue();
  q.push(null, f);

  try {
    await q.push(() => Promise.reject(e));
    t.fail('should never get here');
  } catch(r) {
    t.equal(r, e, 'item rejects with err');
  }

  try {
    await q.wait();
    t.fail('should never get here either');
  } catch(r) {
    t.equal(r, e, 'drain rejects with err');
  }

  try {
    q.push(f)
  } catch(r) {
    t.ok(r instanceof Error, 'push after rejection rejects');
  }

});

test('queue errors', async t => {
  var q;

  q = new PromiseQueue();
  try {
    q.push({neitherIterable: 'norAfunc'})
  } catch(r) {
    t.ok(r instanceof Error, 'not a function');
  }

  q = new PromiseQueue({limit: 1});
  var f = () => Promise.resolve();

  const firstOne = q.push(f);

  try {
    q.push(f)
  } catch(r) {
    t.ok( r instanceof Error, 'push beyond limit');
  }

  await firstOne; // make sure it works
});

test('clearing queue', async t => {
  var q;

  q = new PromiseQueue({concurrency: 2});
  var count = 0;
  var work = ()=>delay(100).then(() => count++);

  // push a bunch of items (first two will start)
  q.map([1,2,3,4,5], () => work());

  // clear the queue
  await q.clear();

  t.equal(count, 2, 'only two items processed');

  // now add another
  await q.push(work);

  // which should work fine
  t.equal(count, 3, 'another item added after clear');
});

test('stopping queue', async t => {
  var q;

  q = new PromiseQueue({concurrency: 2});
  var count = 0;
  var work = ()=>delay(100).then(() => count++);

  // push a bunch of items (first two will start)
  q.map([1,2,3,4,5], () => work());

  // stop the queue
  const end = q.stop();

  // fail to push anything else
  try {
    q.push(work);
  } catch(e) {
    t.ok(e instanceof Error, 'push after stop');
  }

  await end;
  t.equal(count, 2, 'only two items processed');
});

*/
