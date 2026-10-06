import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultJobs } from '../mutation/gutcheck.mjs';

// The CLI's parallelism default. Each shard spawns a full test runner, so on a developer machine that
// is already running a dev environment four shards can exhaust memory (observed 2026-09-02: swap
// exhausted, the probe and a concurrent campaign reaped by the kernel). Two is the default; the machine
// still bounds it, and an explicit --jobs always wins. The Stop hook passes --jobs=1 regardless.
test('defaultJobs: two by default, never more than cpus-1, never below one', () => {
  assert.equal(defaultJobs(10), 2);
  assert.equal(defaultJobs(4), 2);
  assert.equal(defaultJobs(3), 2);
  assert.equal(defaultJobs(2), 1, 'a 2-core box keeps one core for everything else');
  assert.equal(defaultJobs(1), 1);
  assert.equal(defaultJobs(0), 1, 'an unknown core count is never zero shards');
});
