export type OneTapFailure =
  | 'not-linked'
  | 'token'
  | 'signup-disabled'
  | 'network'
  | 'generic';
export function classifyOneTapFailure(error: {
  message?: string;
  code?: string;
  status?: number;
}): OneTapFailure {
  const value = `${error.code || ''} ${error.message || ''}`
    .toLowerCase()
    .replace(/_/g, ' ');
  if (value.includes('account not linked')) return 'not-linked';
  if (value.includes('invalid id token')) return 'token';
  if (value.includes('signup disabled')) return 'signup-disabled';
  if (!error.status || error.status >= 500) return 'network';
  return 'generic';
}
