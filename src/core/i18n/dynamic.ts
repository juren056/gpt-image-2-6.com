import { m } from '@/paraglide/messages.js';

type DynamicMessageInputs = Record<string, unknown>;
type DynamicMessageOptions = { locale?: string };
type DynamicMessage = (
  inputs?: DynamicMessageInputs,
  options?: DynamicMessageOptions
) => string;

// Dynamic message lookup for keys built at runtime (tab labels, keyed
// lists). Prefer static `m["ns.key"]()` whenever the key is known —
// dynamic access opts the whole message bundle out of tree-shaking.
export function hasDynamicMessage(key: string): boolean {
  return typeof (m as Record<string, unknown>)[key] === 'function';
}

export function tDynamic(
  key: string,
  inputs?: DynamicMessageInputs,
  options?: DynamicMessageOptions
): string {
  const fn = (m as Record<string, unknown>)[key];
  return typeof fn === 'function'
    ? (fn as DynamicMessage)(inputs, options)
    : key;
}
