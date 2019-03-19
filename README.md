# pqueue
Concurrent Promise queue

Simple scheduler of promises to restrict concurrency

## API

### pqueue

`p = pqueue(concurrency)`

creates a queue with the specified concurrency (defaults to 1)

### .push

`queue.push(fn)`

Push a function (normally a promise poducing one) onto the queue to be executed once concurrency permits

Returns a `Promise` of the function's resolution/rejection

### .running

`n = queue.running`

returns how many jobs/functions are currently running

### .pending

`n = queue.pending`

returns how many jobs/functions are currently pending in the queue


### .idle

`await queue.idle`

a `Promise` which reoslves once the queue is idle (no more jobs to process)
