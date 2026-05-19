let _lockedCount = 0;
const _listeners = new Set<() => void>();

export function getLockedCount(): number {
  return _lockedCount;
}

export function setLockedCount(n: number): void {
  _lockedCount = Math.max(0, n);
  _listeners.forEach((fn) => fn());
}

export function decrementLockedCount(): void {
  _lockedCount = Math.max(0, _lockedCount - 1);
  _listeners.forEach((fn) => fn());
}

export function subscribeLockedCount(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
