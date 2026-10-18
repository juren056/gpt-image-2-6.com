type DynamicMessageInputs = Record<string, unknown>;
type DynamicMessageOptions = { locale?: string };
type DynamicMessage = (
  inputs?: DynamicMessageInputs,
  options?: DynamicMessageOptions
) => string;

/** Bind runtime keys to a finite registry so unrelated messages can tree-shake. */
export function createMessageLookup(messages: Record<string, unknown>) {
  const hasDynamicMessage = (key: string): boolean =>
    Object.hasOwn(messages, key) && typeof messages[key] === 'function';
  const tDynamic = (
    key: string,
    inputs?: DynamicMessageInputs,
    options?: DynamicMessageOptions
  ): string =>
    hasDynamicMessage(key)
      ? (messages[key] as DynamicMessage)(inputs, options)
      : key;
  return { messages, hasDynamicMessage, tDynamic };
}
