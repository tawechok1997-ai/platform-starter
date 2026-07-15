export type Snapshot<T> = Readonly<T>;

export function hasUnsavedChanges<T>(current: T, persisted: T): boolean {
  return JSON.stringify(current) !== JSON.stringify(persisted);
}

export function createOptimisticSnapshot<T>(value: T): Snapshot<T> {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export function rollbackOptimisticChange<T>(snapshot: Snapshot<T>): T {
  if (typeof structuredClone === 'function') return structuredClone(snapshot);
  return JSON.parse(JSON.stringify(snapshot)) as T;
}
