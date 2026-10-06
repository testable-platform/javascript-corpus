import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { prove, pinnedFragmentsByKind, resolveRunnerBin } from '../mutation/prove.mjs';

// Field report 2026-09-02 §4: `expect(f()).toBeUndefined()` read as no-pin while `toBeNull()` was a pin.
// Both fail against the numeric sentinel (and its sign-flipped twin), so both are sound value pins.
// Oracle: the fixture's `currentActor` really returns undefined and its test really asserts that, so a
// gut to 987654321 must go red — the block is caught, never skipped.

const HAS_VITEST = resolveRunnerBin('vitest', resolve('.')) !== null;

test('pinnedFragmentsByKind: toBeUndefined() is a value pin, exactly like toBeNull()', () => {
  const k = pinnedFragmentsByKind('expect(currentActor()).toBeUndefined();\nexpect(currentOwner()).toBeNull();', new Map());
  assert.ok(k.value.includes('currentOwner()'), 'toBeNull() was already a pin');
  assert.ok(k.value.includes('currentActor()'), 'toBeUndefined() pins a value the sentinel fails');
});

test('PROVE vitest e2e: a toBeUndefined() block is probed and caught, not skipped as no-pin', { skip: !HAS_VITEST }, () => {
  const d = mkdtempSync(join(tmpdir(), 'gc-undef-'));
  const files = {
    'package.json': '{"type":"module","devDependencies":{"vitest":"*"}}',
    'src/actor.mjs': 'export function currentActor() { return undefined; }\n',
    'test/actor.test.mjs': `import { it, expect } from 'vitest';
import { currentActor } from '../src/actor.mjs';
it('nobody is attributed by default', () => { expect(currentActor()).toBeUndefined(); });
`,
  };
  for (const [r, b] of Object.entries(files)) { const f = join(d, r); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, b); }
  symlinkSync(resolve('node_modules'), join(d, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  try {
    const r = prove(d, { runner: 'vitest' });
    assert.equal(r.skipped.filter((s) => s.why === 'no-pin').length, 0, JSON.stringify(r.skipped));
    assert.equal(r.caught, 1);
    assert.equal(r.hollow.length, 0);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
