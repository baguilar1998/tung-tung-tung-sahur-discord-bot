export function pickIndex(length: number, random: () => number): number {
  if (length <= 0) {
    throw new Error("Cannot pick from an empty list.");
  }
  const raw = random();
  const scaled = Number.isFinite(raw) ? Math.floor(raw * length) : 0;
  return Math.min(length - 1, Math.max(0, scaled));
}

export function choose<T>(items: readonly T[], random: () => number): T {
  const item = items[pickIndex(items.length, random)];
  if (item === undefined) {
    throw new Error("Failed to choose an item.");
  }
  return item;
}

export function drum(random: () => number): string {
  const hits = 3 + pickIndex(5, random);
  return `${Array.from({ length: hits }, () => "tung").join(" ")} sahur`;
}
