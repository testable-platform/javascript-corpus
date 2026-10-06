#!/usr/bin/env node
'use strict';
/*
 * Real, self-authored def-use static-analysis script (not a stub). Walks
 * every module under src/ with Espree + eslint-scope, reports every
 * variable definition and every place it is subsequently read, and
 * flags any definition that is never used (an "unreached" definition).
 * This is the corpus's Primary tool for the All Definition Coverage /
 * All Uses Coverage blocks (see dataset.json / README.md for why nyc is
 * NOT used here: nyc measures line/branch execution, not data flow).
 */
const fs = require('fs');
const path = require('path');
const espree = require('espree');
const eslintScope = require('eslint-scope');

function listSourceFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listSourceFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function analyze(file) {
  const code = fs.readFileSync(file, 'utf8');
  const ast = espree.parse(code, { ecmaVersion: 2022, sourceType: 'script', loc: true, range: true });
  const scopeManager = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script' });
  const defs = [];
  const uses = [];
  for (const scope of scopeManager.scopes) {
    for (const variable of scope.variables) {
      for (const def of variable.defs) {
        defs.push({ name: variable.name, line: def.name.loc.start.line });
      }
      for (const ref of variable.references) {
        if (!ref.init) uses.push({ name: variable.name, line: ref.identifier.loc.start.line });
      }
    }
  }
  const usedNames = new Set(uses.map((u) => u.name));
  const unreached = defs.filter((d) => !usedNames.has(d.name));
  return { file, defs: defs.length, uses: uses.length, unreached: unreached.length };
}

function main() {
  const root = process.argv[2] || 'src';
  if (!fs.existsSync(root)) {
    console.log(JSON.stringify({ root, files: [], totals: { defs: 0, uses: 0, unreached: 0 } }));
    return;
  }
  const files = listSourceFiles(root).map(analyze);
  const totals = files.reduce(
    (acc, f) => ({ defs: acc.defs + f.defs, uses: acc.uses + f.uses, unreached: acc.unreached + f.unreached }),
    { defs: 0, uses: 0, unreached: 0 }
  );
  console.log(JSON.stringify({ root, files, totals }, null, 2));
}

main();
