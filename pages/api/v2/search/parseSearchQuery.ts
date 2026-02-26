/**
 * Exact-pattern matching for minimal search. No DB lookup.
 * Used by check-redirect, quick, and search API routes.
 */

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const BLOCK_NUMBER_REGEX = /^[0-9]+$/;

export type SearchMatchType = 'block' | 'transaction' | 'address' | null;

export function parseSearchQuery(q: string): { type: SearchMatchType; parameter: string } {
  const trimmed = (q ?? '').trim();
  if (!trimmed) {
    return { type: null, parameter: trimmed };
  }
  if (TX_HASH_REGEX.test(trimmed)) {
    return { type: 'transaction', parameter: trimmed };
  }
  if (ADDRESS_REGEX.test(trimmed)) {
    return { type: 'address', parameter: trimmed };
  }
  if (BLOCK_NUMBER_REGEX.test(trimmed)) {
    return { type: 'block', parameter: trimmed };
  }
  return { type: null, parameter: trimmed };
}
