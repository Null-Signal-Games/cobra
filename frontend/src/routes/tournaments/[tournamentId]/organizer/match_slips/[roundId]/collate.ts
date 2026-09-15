import type { Pairing } from "$lib/model/Pairing";

export function sortByTableNumber(p1: Pairing, p2: Pairing): number {
  return p1.table_number - p2.table_number;
}

export function getProcessedPairings(pairings: Pairing[], collated: boolean): Pairing[] {
  const sorted = [...pairings].sort(sortByTableNumber);
  if (!collated || sorted.length < 5) {
    return sorted;
  }

  const collatedPairings: Pairing[] = [];
  const period = Math.ceil(sorted.length / 4);
  for (let i = 0; i < period; i++) {
    for (let j = i; j < sorted.length; j += period) {
      collatedPairings.push(sorted[j]);
    }
  }

  return collatedPairings;
}
