import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as prove from '../mutation/prove.mjs';

// The oracle for "mechanical extraction". This list was captured from prove.mjs BEFORE any export moved
// out of it, so no refactor that changes the public surface can satisfy it — which is exactly the
// property the moves promise. Relocating a function into mutation/jvm.mjs and re-exporting it from here
// keeps this green; renaming, dropping, or forgetting to re-export one does not.
//
// Adding a genuinely NEW export is a deliberate act: append it here in the same commit, with a reason.
// makeWorkCopy / scopeDecls / workSkipRe (2026-09-05): extracted from prove()/classifyScope so the sharded
// parent can run the execution denominator once over the merged scope (mutation/shards.mjs).
// projectRootOf (2026-09-03): runners.mjs's project-root walk, re-exported like every other runners
// name (field report 2026-09-02 §2 — the subtree refusal and runner detection share it).
const SURFACE = [
  'RUNNERS', 'RUNNER_LANGS', 'ambiguousNames', 'braceArgFrom', 'canonKey', 'changedFilesSince',
  'classifyScope', 'detectRunner', 'eligibleFns', 'eligibleFnsDetail', 'extraHollowOf',
  'fallbackCmdFor', 'formatReport', 'gradleTaskInfo', 'hasProductionContact',
  'hasTopLevelShortCircuit', 'importMap', 'isTestPath', 'javaExe', 'jsInstanceSuts',
  'jsNamespaceSuts', 'jvmFileHasSharedSetupContact', 'jvmInstanceSuts',
  'jvmOwnPlainInstanceMember', 'jvmSourceSetGate', 'kotlinLeadingCall', 'kotlinReceiverCall',
  'main', 'mainCompileExecuted', 'makeResolver', 'makeWorkCopy', 'mavenBin', 'mavenCompiled', 'mavenModuleDir',
  'nodeEffectiveCounts', 'oneSidedLines', 'parseBlocks', 'parseGradleResults', 'parseRun',
  'pinnedFragments', 'pinnedFragmentsByKind', 'projectRootOf', 'prove', 'pyBlocks', 'pythonExe', 'qualifiedName',
  'residualAmbiguous', 'resolveJvmSut', 'resolvePyClassMember', 'resolvePySut', 'resolveRunnerBin',
  'resolveScope', 'runOne', 'scopeDecls', 'survivorEvidenceValid', 'testCmdFor', 'toPosix', 'topLevelCallees',
  'topLevelComparisonSides', 'workSkipRe',
];

test('prove.mjs export surface is unchanged by extraction', () => {
  assert.deepEqual(Object.keys(prove).sort(), SURFACE);
});

test('every pinned export is callable or a real value, not an undefined re-export', () => {
  // A re-export typo (`export { foo } from './jvm.mjs'` where jvm.mjs exports `fooBar`) is a load error
  // in ESM, but a mistaken `export const foo = undefined` shim is not — catch that here.
  const dead = SURFACE.filter((n) => prove[n] === undefined);
  assert.deepEqual(dead, [], `export(s) present but undefined: ${dead.join(', ')}`);
});
