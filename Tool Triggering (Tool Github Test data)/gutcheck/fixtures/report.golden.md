## gutcheck — diff verification report

**2 functions changed** · proven 1 · hollow 0 · unverifiable 0 · untested 1

*probed 1 fn · 1/1 bound · 0 tests skipped · runner node*

| Function | File | Status | Evidence |
| --- | --- | --- | --- |
| `dbl` | src/lib.mjs | ✅ proven | test/t.test.mjs:3 'sound' went red when gutted |
| `ghost` | src/lib.mjs | ∅ untested | no test executes it |

✓ 1 test verified: gutted the function, the test went red.

---
*Evidence classes: **proven/hollow** are execution-backed (we mutated the function and reran its tests). **untested/unnoticed** come from running every test file in scope under coverage—untested means no test executes it. Only value-pinning tests with locatable functions are probeable per block—the per-reason skip breakdown is in the default report and `--json` output.*
