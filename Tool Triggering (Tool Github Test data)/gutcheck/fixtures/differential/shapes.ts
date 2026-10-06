// Curated high-risk TS shapes for the differential corpus (test/differential.test.mjs).
export function pick(s: string[], t = 0.25): { id: string; drift: boolean } {
  return { id: s[0], drift: t > 0 };
}
export function identity<T>(x: T): T { return x; }
export function pluckLength<T extends { length: number }>(arg: T): number { return arg.length; }
export const first = <T,>(arr: T[]) =>
  arr.length > 0
    ? arr[0]
    : undefined;
export function withSatisfies(): number {
  const v = { a: 1 } satisfies { a: number };
  return v.a;
}
// A TypeScript overload set: bodiless signatures, then the one implementation. Only the implementation
// is guttable (its body is the target); the diff report must enumerate ONE function named `zipPairs`.
export function zipPairs<T1, T2>(a: T1[], b: T2[]): [T1, T2][]
export function zipPairs<T1, T2, T3>(a: T1[], b: T2[], c: T3[]): [T1, T2, T3][]
export function zipPairs<T>(...arrays: T[][]): T[][] {
  return arrays[0].map((_, i) => arrays.map((a) => a[i]))
}
export function sumBy<T extends number>(array: readonly T[]): number;
export function sumBy<T extends object>(array: readonly T[], fn: (item: T) => number): number;
export function sumBy<T>(array: readonly any[], fn?: (item: T) => number): number {
  return (array || []).reduce((acc, item) => acc + (fn ? fn(item) : item), 0)
}
