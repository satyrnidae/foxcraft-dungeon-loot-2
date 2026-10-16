// Several independent checks inside one test, all reported together, like unittest's subTest.
import assert from 'node:assert/strict';

export class Checks {
  constructor() {
    this.failures = [];
  }

  /** Runs fn. A throw is recorded under label and the test goes on to the next check. */
  sub(label, fn) {
    try {
      fn();
    } catch (exc) {
      this.failures.push(`[${label}] ${exc.message}`);
    }
  }

  /** Fails the test with every recorded failure. */
  done() {
    if (this.failures.length > 0) {
      throw new assert.AssertionError({ message: `${this.failures.length} check(s) failed\n${this.failures.join('\n')}` });
    }
  }
}

export const isByte = (value, n) => value && value.type === 'byte' && value.value === n;

/** Every object nested anywhere inside node, node itself first. */
export function* dicts(node) {
  if (node !== null && typeof node === 'object' && !Array.isArray(node) && node.constructor === Object) {
    yield node;
    for (const value of Object.values(node)) yield* dicts(value);
  } else if (Array.isArray(node)) {
    for (const value of node) yield* dicts(value);
  }
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const sorted = (values) => [...values].sort();
