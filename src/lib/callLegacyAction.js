export function callLegacyAction(name, ...args) {
  const action = window[name];
  if (typeof action === 'function') {
    return action(...args);
  }
  return undefined;
}
